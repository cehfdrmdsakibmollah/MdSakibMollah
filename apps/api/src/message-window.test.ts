import {test} from 'node:test';
import assert from 'node:assert/strict';
import {recentChatLimit,newestFirstChatSort,chronologicalFromNewest} from './message-window.js';

test('MongoDB fetch selects newest messages using timestamp and ObjectId tie breaker',()=>{
 assert.equal(recentChatLimit,200);
 assert.deepEqual(newestFirstChatSort,{createdAt:-1,_id:-1});
});

test('a long conversation shows its newest 200 messages in chronological order',()=>{
 const all=Array.from({length:215},(_,i)=>({id:i+1}));
 // MongoDB would select a descending page before limit(200).
 const descending=[...all].reverse().slice(0,recentChatLimit);
 const displayed=chronologicalFromNewest(descending);
 assert.equal(displayed.length,200);
 assert.equal(displayed[0].id,16);
 assert.equal(displayed.at(-1)?.id,215);
 assert.deepEqual(descending.slice(0,2).map(x=>x.id),[215,214],
   'ordering must not mutate the original query array');
});

test('short conversations remain in the original order after reversal',()=>{
 assert.deepEqual(chronologicalFromNewest([{id:3},{id:2},{id:1}]),[{id:1},{id:2},{id:3}]);
 assert.deepEqual(chronologicalFromNewest([]),[]);
});
