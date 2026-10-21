import {test} from 'node:test';
import assert from 'node:assert/strict';
import {identityFromClaims,canReadPrivateConversation,canPostClientMessage} from './identity.js';

const owners=new Set(['owner@example.com']);

test('unverified email cannot access private chat, even if matching owner address',()=>{
 for(const claims of [
  {uid:'test-user',email:'owner@example.com',email_verified:false},
  {uid:'test-user',email_verified:true},
  {uid:'test-user',email:'owner@example.com'}
 ]){
  assert.throws(()=>identityFromClaims(claims,owners),(error:unknown)=>{
   assert.equal((error as {status:number}).status,403);
   assert.equal((error as {code:string}).code,'EMAIL_NOT_VERIFIED');
   return true;
  });
 }
});

test('verified owner email matches case-insensitively without trusting owner claim',()=>{
 const owner=identityFromClaims({uid:'uid-owner',email:'OWNER@EXAMPLE.COM',email_verified:true,name:'Owner'},owners);
 assert.deepEqual(owner,{uid:'uid-owner',email:'owner@example.com',name:'Owner',admin:true});
});

test('a verified client is not an administrator',()=>{
 const client=identityFromClaims({uid:'uid-client',email:'client@example.com',email_verified:true},owners);
 assert.equal(client.admin,false);
 assert.equal(client.name,'client');
 assert.equal(client.uid,'uid-client');
});

test('admin email matching uses a full email, not a suffix',()=>{
 for(const email of ['notowner@example.com','owner@example.com.evil.test']){
  assert.equal(identityFromClaims({uid:'test',email,email_verified:true},owners).admin,false);
 }
});

test('only the matching verified client may read or write their own private conversation',()=>{
 const clientA=identityFromClaims({uid:'client-A',email:'a@example.test',email_verified:true},owners);
 const clientB=identityFromClaims({uid:'client-B',email:'b@example.test',email_verified:true},owners);
 assert.equal(canReadPrivateConversation(clientA,'client-A'),true);
 assert.equal(canPostClientMessage(clientA,'client-A'),true);
 assert.equal(canReadPrivateConversation(clientB,'client-A'),false);
 assert.equal(canPostClientMessage(clientB,'client-A'),false);
});

test('verified owner can read client conversation, but cannot impersonate client message writes',()=>{
 const owner=identityFromClaims({uid:'owner-uid',email:'owner@example.com',email_verified:true},owners);
 const client=identityFromClaims({uid:'client-uid',email:'client@example.test',email_verified:true},owners);
 assert.equal(canReadPrivateConversation(owner,client.uid),true);
 assert.equal(canPostClientMessage(owner,client.uid),false);
 assert.equal(canReadPrivateConversation(client,owner.uid),false);
 assert.equal(canPostClientMessage(client,owner.uid),false);
});
