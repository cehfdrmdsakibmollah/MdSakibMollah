// A single clearly labeled, synthetic live contact-form integration check.
// Intentionally uses no Firebase tokens, Resend API keys, MongoDB credentials,
// private message bodies or production customer data.
//
// This script is only executed by the opt-in contact-e2e GitHub Actions workflow.
// The created lead is cleaned up through the MongoDB Atlas connector after verifying persistence.
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';

const origin = 'https://mdsakibmollah.vercel.app';
const marker = 'PORTFOLIO_E2E_' + randomUUID();
const testLead = {
  name: 'Portfolio QA Test',
  email: 'mdsakibmolla545@gmail.com',
  company: 'AUTOMATED TEST ONLY',
  service: 'QA integration test',
  budget: 'N/A - no real work inquiry',
  message: `AUTOMATED TEST ONLY / ${marker}. Verify that the live contact API saves exactly one synthetic lead. This is not a customer or a request for work.`,
};

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function postContact() {
  let last;
  // The retries only apply to gateway/network errors; once a 201 has been
  // received, do NOT retry and risk duplicate lead creation.
  for(let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(origin + '/api/backend/contact', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(testLead),
        signal: AbortSignal.timeout(110000),
      });
      const body = await response.json().catch(() => ({}));
      if(response.status === 201) return {response, body};
      if(response.status < 500) {
        throw new Error(`Non-retriable HTTP ${response.status}: ${String(body.error || 'contact rejected').slice(0,100)}`);
      }
      last = new Error(`Temporary API failure: HTTP ${response.status}`);
    } catch(error) {
      // A network timeout after the server saved the lead has uncertain
      // outcome; do not retry to avoid potential duplicate customer entries.
      if(error?.name === 'TimeoutError' || error?.name === 'AbortError') throw error;
      if(String(error?.message).includes('Non-retriable')) throw error;
      last = error;
    }
    if(attempt < 2) await delay(5000);
  }
  throw last;
}

const {response,body} = await postContact();
assert.equal(response.status,201);
assert.equal(body.ok,true);
assert.match(body.reference,/^[a-f\d]{24}$/i,'Expected newly saved MongoDB document reference');
console.log('PASS: live contact POST returned HTTP 201 and MongoDB reference');
console.log('TEST_MARKER=' + marker);
console.log('TEST_LEAD_ID=' + body.reference);
console.log('NOTE: This is an explicit synthetic QA lead. Remove it after database/email inspection.');
console.log('NOTE: API 201 confirms save, NOT Gmail delivery; check mail inbox separately.');
