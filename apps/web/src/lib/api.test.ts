import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {User} from 'firebase/auth';
import {callApi} from './api';

const originalFetch=globalThis.fetch;

test('authenticated client message carries Firebase Bearer token and JSON body',async()=>{
 try{
  let calls=0;
  globalThis.fetch=async(input,init)=>{
   calls++;
   assert.equal(input,'/api/backend/conversations/abc/messages');
   assert.equal(init?.method,'POST');
   assert.equal((init?.headers as Record<string,string>).Authorization,'Bearer verified-id-token');
   assert.equal((init?.headers as Record<string,string>)['Content-Type'],'application/json');
   assert.equal(init?.body,JSON.stringify({text:'Hello'}));
   assert.equal(init?.cache,'no-store');
   return Response.json({messages:[{_id:'m1',text:'Hello'}]},{status:201});
  };
  const user={getIdToken:async()=> 'verified-id-token'} as unknown as User;
  const data=await callApi<{messages:{_id:string}[]}>('/conversations/abc/messages',{method:'POST',body:JSON.stringify({text:'Hello'})},user);
  assert.equal(data.messages[0]._id,'m1');
  assert.equal(calls,1);
 }finally{globalThis.fetch=originalFetch}
});

test('unsigned request never adds Authorization header',async()=>{
 try{
  globalThis.fetch=async(_input,init)=>{
   assert.equal((init?.headers as Record<string,string>).Authorization,undefined);
   return Response.json({status:'ok'});
  };
  await callApi('/health');
 }finally{globalThis.fetch=originalFetch}
});

test('backend authorization rejection is surfaced instead of successful delivery',async()=>{
 try{
  globalThis.fetch=async()=>Response.json({error:'Sign in to continue.',code:'AUTH_REQUIRED'},{status:401});
  await assert.rejects(callApi('/me'),/Sign in to continue/);
 }finally{globalThis.fetch=originalFetch}
});

test('offline backend response does not return a successful message',async()=>{
 try{
  globalThis.fetch=async()=>Response.json({error:'Backend is unavailable or waking up.'},{status:503});
  await assert.rejects(callApi('/conversations/start',{method:'POST'}),/Backend is unavailable or waking up/);
 }finally{globalThis.fetch=originalFetch}
});

test('token retrieval failure does not send an unauthenticated private request',async()=>{
 try{
  let sent=false;
  globalThis.fetch=async()=>{sent=true;return Response.json({ok:true})};
  const user={getIdToken:async()=>{throw new Error('Firebase session expired')}} as unknown as User;
  await assert.rejects(callApi('/me',{},user),/Firebase session expired/);
  assert.equal(sent,false);
 }finally{globalThis.fetch=originalFetch}
});
