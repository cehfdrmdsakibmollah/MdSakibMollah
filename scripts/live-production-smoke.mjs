// Public production smoke test. Intentionally uses no passwords, test accounts, or production writes.
// GitHub Actions installs playwright-core in a temporary directory.
import assert from 'node:assert/strict';

const SITE = 'https://mdsakibmollah.vercel.app';
const API = 'https://sakib-portfolio-api-free.onrender.com';
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
  response = await request(audioUrl, { method: 'HEAD' });
  assert.equal(response.status, 200, 'Music HEAD must be 200');
  assert.match(response.headers.get('content-type') || '', /(audio|webm)/i, 'Music MIME must be audio or WebM');
  response = await request(audioUrl);
  assert.equal(response.status, 200, 'Music GET must be 200');
  const audio = Buffer.from(await response.arrayBuffer());
  assert.ok(audio.length > 5000, 'Music asset should not be empty');
  assert.equal(audio.subarray(0, 4).toString('hex'), '1a45dfa3', 'Expected WebM container');
  console.log(`PASS: live music HEAD/GET, WebM signature, bytes=${audio.length}, type=${response.headers.get('content-type')}`);

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
    await page.goto(SITE + '/dashboard', { waitUntil: 'domcontentloaded', timeout: 90_000 });

    // Music starts only after a deliberate user click. A Pause button appears
    // only after HTMLAudioElement.play() resolves successfully.
    const music = page.getByRole('button', { name: 'Play optional ambient music' });
    await music.waitFor({ timeout: 35_000 });
    await music.click();
    const pause = page.getByRole('button', { name: 'Pause ambient music' });
    await pause.waitFor({ timeout: 15_000 });
    await page.waitForTimeout(700);
    assert.ok(await pause.count(), 'Music should remain playing after user click');
    await pause.click();
    await music.waitFor({ timeout: 5000 });
    console.log('PASS: Chromium shows Music, starts playback by click, and pauses');

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
