import {test} from 'node:test';
import assert from 'node:assert/strict';

// Only synthetic settings. All calls are intercepted; no external email is sent.
process.env.MONGODB_URI='mongodb://127.0.0.1:27017/test-notifications';
process.env.ADMIN_EMAILS='owner@example.test';
process.env.RESEND_API_KEY='resend-fake-test-key';
process.env.RESEND_FROM_EMAIL='Portfolio <notifications@example.test>';

const {sendEmail}=await import('./notifications.js');
const {env}=await import('./config.js');

test('transactional notification posts to configured Resend endpoint with safe HTML and timeout',async()=>{
 const previousFetch=globalThis.fetch;
 let calls=0;
 try {
  globalThis.fetch=(async(input:unknown,init?:RequestInit)=>{
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

test('onboarding sender refuses other recipients but accepts owner',async()=>{
 const original=env.RESEND_FROM_EMAIL;
 const ownerOriginal=env.OWNER_NOTIFICATION_EMAIL;
 const fetchOriginal=globalThis.fetch;
 let calls=0;
 try{
  env.RESEND_FROM_EMAIL='onboarding@resend.dev';
  env.OWNER_NOTIFICATION_EMAIL='owner@example.test';
  globalThis.fetch=(async()=>{
   calls++;
   return new Response('{}',{status:202});
  }) as typeof globalThis.fetch;
  assert.equal(await sendEmail('other@example.test','test','test'),false);
  assert.equal(calls,0);
  assert.equal(await sendEmail('owner@example.test','test','test'),true);
  assert.equal(calls,1);
 }finally{
  env.RESEND_FROM_EMAIL=original;
  env.OWNER_NOTIFICATION_EMAIL=ownerOriginal;
  globalThis.fetch=fetchOriginal;
 }
});
