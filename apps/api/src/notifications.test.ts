import {test} from 'node:test';
import assert from 'node:assert/strict';

// Only synthetic settings. All calls are intercepted; no external email is sent.
process.env.MONGODB_URI='mongodb://127.0.0.1:27017/test-notifications';
process.env.ADMIN_EMAILS='owner@example.test';
process.env.RESEND_API_KEY='resend-fake-test-key';
process.env.RESEND_FROM_EMAIL='Portfolio <notifications@example.test>';

const {sendEmail}=await import('./notifications.js');

test('transactional notification posts to configured Resend endpoint with safe HTML and timeout',async()=>{
 const previousFetch=globalThis.fetch;
 let calls=0;
 try {
  globalThis.fetch=(async(input:RequestInfo|URL,init?:RequestInit)=>{
   calls++;
   assert.equal(String(input),'https://api.resend.com/emails');
   assert.equal(init?.method,'POST');
   assert.ok(init?.signal instanceof AbortSignal);
   const headers=init?.headers as Record<string,string>;
   assert.equal(headers.Authorization,'Bearer resend-fake-test-key');
   const request=JSON.parse(String(init?.body)) as {to:string[];subject:string;html:string};
   assert.deepEqual(request.to,['owner@example.test']);
   assert.equal(request.subject,'Test diagnostics');
   assert.match(request.html,/&lt;script&gt;/);
   assert.doesNotMatch(request.html,/<script>/);
   return new Response(JSON.stringify({id:'fake-provider-id'}),{status:202});
  }) as typeof globalThis.fetch;
  const accepted=await sendEmail('owner@example.test','Test diagnostics','Sensitive <script> content');
  assert.equal(accepted,true);
  assert.equal(calls,1);
 } finally {globalThis.fetch=previousFetch;}
});

test('provider rejection is reported as false rather than an inbox-delivered success',async()=>{
 const previousFetch=globalThis.fetch;
 const previousLog=console.error;
 try {
  globalThis.fetch=(async()=>new Response('Unauthorized',{status:403})) as typeof globalThis.fetch;
  console.error=()=>{};
  assert.equal(await sendEmail('owner@example.test','Test diagnostics','Hello'),false);
 } finally {globalThis.fetch=previousFetch;console.error=previousLog;}
});
