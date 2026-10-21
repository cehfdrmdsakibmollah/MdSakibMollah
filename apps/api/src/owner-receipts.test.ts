import {test} from 'node:test';
import assert from 'node:assert/strict';
import {openedReplySchema,ownerReplyReceiptFilter} from './owner-receipts.js';
import {canPostClientMessage} from './identity.js';

const ownerId='507f1f77bcf86cd799439011';
const clientReplyId='507f191e810c19729de860ea';
const anotherId='507f1f77bcf86cd799439012';

test('opened receipts permit only well-formed IDs in a bounded strict payload',()=>{
 const valid=openedReplySchema.parse({messageIds:[ownerId,clientReplyId]});
 assert.deepEqual(valid.messageIds,[ownerId,clientReplyId]);
 for(const bad of [
  {messageIds:[]},
  {messageIds:['not-an-objectid']},
  {messageIds:[ownerId],admin:true},
  {messageIds:Array(31).fill(ownerId)}
 ])assert.equal(openedReplySchema.safeParse(bad).success,false);
});

test('receipt updates are restricted to owner messages in exactly one conversation, only when unopened',()=>{
 const filter=ownerReplyReceiptFilter(anotherId,[ownerId,ownerId,clientReplyId]);
 assert.deepEqual(filter,{
  conversationId:anotherId,
  _id:{$in:[ownerId,clientReplyId]},
  sender:'owner',
  openedAt:{$exists:false}
 });
});

test('a different client or owner not participating cannot mark someone else’s reply opened',()=>{
 const owner={uid:'owner-uid',admin:true};
 const actualClient={uid:'client-uid',admin:false};
 const otherClient={uid:'other-uid',admin:false};
 assert.equal(canPostClientMessage(actualClient,'client-uid'),true);
 assert.equal(canPostClientMessage(otherClient,'client-uid'),false);
 assert.equal(canPostClientMessage(owner,'client-uid'),false);
});
