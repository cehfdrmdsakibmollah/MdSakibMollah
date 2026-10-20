#!/usr/bin/env node
// Public, read-only checks; do not pass credentials or secret values.
const [webUrl, apiUrl] = process.argv.slice(2);

function parseOrigin(input, label) {
 if (!input) throw new Error(`Missing ${label} URL.`);
 const url = new URL(input);
 if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash)
   throw new Error(`${label} must be a public HTTPS hostname, without credentials, query, or fragment.`);
 return url.origin;
}

async function check(label, url, validate) {
 try {
  const response = await fetch(url, {redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(15000)});
  let json = null;
  if (response.headers.get('content-type')?.includes('application/json')) {
   json = await response.json();
  }
  const ok = response.ok && validate(response, json);
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label} (HTTP ${response.status})`);
  if (!ok && json && typeof json.code === 'string') console.log(`  API code: ${json.code}`);
  return ok;
 } catch (error) {
  console.log(`FAIL ${label} (${error instanceof Error ? error.name : 'network error'})`);
  return false;
 }
}

try {
 const web = parseOrigin(webUrl, 'Frontend');
 const api = parseOrigin(apiUrl, 'Backend');
 console.log('Checking public production services; no login tokens or secrets are used.\n');
 const results = [];
 results.push(await check('Express + MongoDB', `${api}/api/v1/health`, (_r, body) =>
   body?.status === 'ok' && body?.database === 'connected'));
 results.push(await check('Next.js homepage', web, (r) =>
   (r.headers.get('content-type') || '').includes('text/html')));
 results.push(await check('Next.js → Express proxy', `${web}/api/backend/health`, (_r, body) =>
   body?.status === 'ok' && body?.database === 'connected'));
 results.push(await check('Client chat availability probe', `${web}/api/backend-health`, (_r, body) =>
   body?.online === true));
 if (results.every(Boolean)) {
  console.log('\nPublic health checks passed. Firebase login, authorization, and chat persistence still require a signed-in browser test.');
 } else {
  console.error('\nSome checks failed. Inspect Vercel runtime logs and both projects\' environment variables (never paste secret values).');
  process.exitCode = 1;
 }
} catch (error) {
 console.error('Usage: node scripts/check-production.mjs https://YOUR-FRONTEND.vercel.app https://YOUR-BACKEND.vercel.app');
 console.error(error instanceof Error ? error.message : 'Invalid arguments');
 process.exitCode = 1;
}
