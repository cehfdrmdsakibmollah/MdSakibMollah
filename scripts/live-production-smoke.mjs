// Public production smoke test. Intentionally uses no passwords, test accounts, or production writes.
// GitHub Actions installs playwright-core in a temporary directory.
import assert from 'node:assert/strict';

const SITE = 'https://mdsakibmollah.vercel.app';
const API = 'https://sakib-portfolio-api-free.onrender.com';
const EXPECT_CHAT_CHIME = process.env.EXPECT_CHAT_CHIME === '1';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function request(path, options = {}) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(path, {
        cache: 'no-store',
        ...options,
        signal: AbortSignal.timeout(115_000),
      });
      if (response.status >= 500) {
        throw new Error(`HTTP ${response.status} at ${new URL(path).pathname}`);
      }
      return response;
    } catch (error) {
      lastError = error;
      console.warn(`Attempt ${attempt}/3: ${error instanceof Error ? error.message : String(error)}`);
      if (attempt < 3) await sleep(6000 * attempt);
    }
  }
  throw lastError;
}

async function main() {
  let response = await request(SITE + '/');
  assert.equal(response.status, 200, 'Homepage must be publicly reachable');
  console.log('PASS: live homepage HTTP 200');

  const audioUrl = SITE + '/audio/funk-power-intro.webm';
  if (EXPECT_CHAT_CHIME) {
    // Static assets may be cached briefly while Vercel's new deploy propagates.
    for (let attempt = 0; attempt < 15; attempt += 1) {
      response = await request(audioUrl, { method: 'HEAD' });
      if (response.status === 404) break;
      await sleep(12_000);
    }
    assert.equal(response.status, 404, 'Old background-music file must be removed from live site');
    console.log('PASS: former background-music asset removed (HTTP 404)');
  } else {
    // On pull requests the current production may still have the prior release.
    response = await request(audioUrl, { method: 'HEAD' });
    assert.equal(response.status, 200, 'Previous production music asset must be reachable before merge');
    assert.match(response.headers.get('content-type') || '', /(audio|webm)/i);
    console.log('PASS: existing public music asset on pre-merge production');
  }

  response = await request(API + '/api/v1/health');
  assert.equal(response.status, 200, 'Render API health must be 200');
  assert.equal((await response.json()).database, 'connected', 'Render must connect to MongoDB');
  console.log('PASS: Render API health + Atlas database connected');

  response = await request(SITE + '/api/backend/health');
  assert.equal(response.status, 200, 'Vercel-to-Render proxy health must be 200');
  console.log('PASS: Vercel backend proxy health');

  for (const path of ['/me', '/admin/overview', '/admin/conversations']) {
    response = await request(SITE + '/api/backend' + path);
    assert.equal(response.status, 401, `Anonymous ${path} must be 401`);
  }
  response = await request(SITE + '/api/backend/conversations/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
  assert.equal(response.status, 401, 'Anonymous private chat creation must be 401');
  console.log('PASS: private identity, admin, and chat reject anonymous requests');

  response = await request(SITE + '/api/backend/assistant/faq', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: 'What services does Sakib offer?' }),
  });
  assert.equal(response.status, 200, 'Public FAQ must respond');
  const faq = await response.json();
  assert.ok(typeof faq.answer === 'string' && faq.answer.length > 15);
  assert.equal(faq.sentToOwner, false, 'Guest FAQ must not forward to owner');
  assert.equal(faq.persisted, false, 'Guest FAQ must not persist private messages');
  console.log('PASS: public FAQ answers without forwarding/storing');

  const { chromium } = await import('file:///tmp/portfolio-smoke/node_modules/playwright-core/index.mjs');
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--mute-audio'],
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    // No optional analytics; monitor Web Audio rather than reading private audio.
    await page.addInitScript(() => {
      localStorage.setItem('sakib-analytics-consent', 'no');
      window.__chimeCalls = [];
      if (window.OscillatorNode) {
        const previousStart = window.OscillatorNode.prototype.start;
        const previousStop = window.OscillatorNode.prototype.stop;
        window.OscillatorNode.prototype.start = function (when) {
          window.__chimeCalls.push({ action: 'start', at: when ?? 0 });
          return previousStart.call(this, when);
        };
        window.OscillatorNode.prototype.stop = function (when) {
          window.__chimeCalls.push({ action: 'stop', at: when ?? 0 });
          return previousStop.call(this, when);
        };
      }
      window.__chimeAmplitudes = [];
      if (window.GainNode) {
        const originalCreateGain = window.BaseAudioContext.prototype.createGain;
        window.BaseAudioContext.prototype.createGain = function () {
          const node = originalCreateGain.call(this);
          const originalRamp = node.gain.linearRampToValueAtTime.bind(node.gain);
          node.gain.linearRampToValueAtTime = function (value, time) {
            window.__chimeAmplitudes.push(value);
            return originalRamp(value, time);
          };
          return node;
        };
      }
    });
    await page.goto(SITE + '/dashboard', { waitUntil: 'domcontentloaded', timeout: 90_000 });

    if (EXPECT_CHAT_CHIME) {
      const ambient = page.getByRole('button', { name: 'Play optional ambient music' });
      assert.equal(await ambient.count(), 0, 'Old Music control must no longer appear');
      let calls = await page.evaluate(() => window.__chimeCalls);
      assert.equal(calls.length, 0, 'Sound must not autoplay on page load');
      const openChat = page.getByRole('button', { name: 'Open portfolio assistant' });
      await openChat.click();
      await page.getByRole('dialog', { name: 'Portfolio assistant and client messages' }).waitFor();
      await page.waitForFunction(() => window.__chimeCalls.some(c => c.action === 'start'), { timeout: 8000 });
      calls = await page.evaluate(() => window.__chimeCalls);
      const start = calls.find(c => c.action === 'start');
      const stop = calls.find(c => c.action === 'stop');
      assert.ok(start && stop, 'Chat click must schedule a short oscillator');
      assert.ok(stop.at - start.at <= 0.2, 'Chime must last at most 200ms');
      const amplitudes = await page.evaluate(() => window.__chimeAmplitudes);
      assert.ok(amplitudes.length && amplitudes.every(x => x <= 0.02), 'Chime gain must stay very low');
      await page.getByRole('button', { name: 'Close live chat' }).click();
      calls = await page.evaluate(() => window.__chimeCalls);
      assert.equal(calls.filter(c => c.action === 'start').length, 1, 'Closing chat must be silent');
      console.log('PASS: no autoplay, no Music UI, soft <=200ms popup chime on chat opening only');
    } else {
      const music = page.getByRole('button', { name: 'Play optional ambient music' });
      await music.waitFor({ timeout: 35_000 });
      await music.click();
      const pause = page.getByRole('button', { name: 'Pause ambient music' });
      await pause.waitFor({ timeout: 15_000 });
      await pause.click();
      await music.waitFor({ timeout: 5000 });
      console.log('PASS: previous Music control on pre-merge production');
    }

    const login = page.getByRole('button', { name: 'Client sign-in' });
    await login.waitFor({ timeout: 15_000 });
    await login.click();
    await page.getByRole('button', { name: 'Continue with Google' }).waitFor({ timeout: 15_000 });
    console.log('PASS: dashboard renders Google sign-in UI (OAuth not completed in automation)');
  } finally {
    await browser.close();
  }
  console.log('Public production smoke tests completed. Authenticated messaging and Gmail delivery require separate authorized end-to-end testing.');
}

main().catch((error) => {
  console.error('FAIL:', error);
  process.exitCode = 1;
});
