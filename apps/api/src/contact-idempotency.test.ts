import {test} from 'node:test';
import assert from 'node:assert/strict';
import {persistContactOnce,isDuplicateSubmissionError} from './contact-idempotency.js';

test('new request persists once; repeat with same key gets existing reference',async()=>{
 const store=new Map<string,string>();
 let writes=0;
 const post=async()=>{
  return persistContactOnce({
   submissionId:'de305d54-75b4-431b-adb2-eb6b9e546014',
   lookupReference:async id=>store.get(id)||null,
   insertReference:async()=>{
    writes++;
    store.set('de305d54-75b4-431b-adb2-eb6b9e546014','lead-123');
    return 'lead-123';
   }
  });
 };
 assert.deepEqual(await post(),{reference:'lead-123',created:true});
 assert.deepEqual(await post(),{reference:'lead-123',created:false});
 assert.equal(writes,1);
});

test('concurrent retry resolves unique index collision without duplicate alert',async()=>{
 const key='729b8962-26ad-40e5-bbc4-f79359711199';
 let insertAttempts=0;
 const data=new Map<string,string>();
 const post=()=>persistContactOnce({
  submissionId:key,
  lookupReference:async id=>data.get(id)||null,
  insertReference:async()=>{
   insertAttempts++;
   // Fake server-side unique-index enforcement in a concurrent race.
   if(data.has(key))throw Object.assign(new Error('E11000 duplicate key'),{code:11000});
   data.set(key,'lead-xyz');
   return 'lead-xyz';
  }
 });
 const results=await Promise.all([post(),post()]);
 assert.equal(results.filter(r=>r.created).length,1);
 assert.equal(results.filter(r=>!r.created).length,1);
 assert.ok(results.every(r=>r.reference==='lead-xyz'));
 assert.equal(insertAttempts,2);
});

test('unrelated persistence failures must propagate rather than simulate success',async()=>{
 const forbidden=new Error('MongoDB unavailable');
 await assert.rejects(persistContactOnce({
  submissionId:'de305d54-75b4-431b-adb2-eb6b9e546014',
  lookupReference:async()=>null,
  insertReference:async()=>{throw forbidden}
 }),err=>err===forbidden);
 assert.equal(isDuplicateSubmissionError({code:11000}),true);
 assert.equal(isDuplicateSubmissionError({code:11001}),false);
});

test('legacy clients without submissionId still create a lead',async()=>{
 let lookupCalled=false;
 const result=await persistContactOnce({
  lookupReference:async()=>{lookupCalled=true;return null},
  insertReference:async()=> 'lead-legacy'
 });
 assert.deepEqual(result,{reference:'lead-legacy',created:true});
 assert.equal(lookupCalled,false);
});

test('a collision without an existing matching reference surfaces the error',async()=>{
 const conflict=Object.assign(new Error('duplicate id'),{code:11000});
 await assert.rejects(persistContactOnce({
  submissionId:'de305d54-75b4-431b-adb2-eb6b9e546014',
  lookupReference:async()=>null,
  insertReference:async()=>{throw conflict}
 }),err=>err===conflict);
});
