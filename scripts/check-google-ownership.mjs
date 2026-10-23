/**
 * Exact-match build-time check for the Google Search Console HTML-file
 * verification supplied by the site owner.
 *
 * This file is intentionally public: Google must be able to fetch it at
 * https://mdsakibmollah.vercel.app/google25491feec6ee656b.html.
 */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const file='apps/web/public/google25491feec6ee656b.html';
const expected='google-site-verification: google25491feec6ee656b.html';
const actual=await readFile(file,'utf8');
assert.equal(actual,expected,'Google Search Console verification file must exactly match the uploaded source');
assert.equal(actual.length,53,'Unexpected ownership verification file length');
console.log('PASS: Google ownership verification HTML file is exact and ready for the next Vercel release');
