import {test} from 'node:test';
import assert from 'node:assert/strict';
import {quickReply} from './quick-replies';

test('greets visitors without claiming private delivery',()=>{
 const answer=quickReply('Hi');
 assert.match(answer,/welcome/i);
 assert.match(answer,/sign in/i);
});

test('WhatsApp is routed to contact rather than mobile app FAQs',()=>{
 const answer=quickReply('How can I contact via WhatsApp?');
 assert.match(answer,/wa|WhatsApp/i);
 assert.match(answer,/\+8801407154481/);
 assert.doesNotMatch(answer,/React Native/);
});

test('payment inquiries do not include unverified wallet accounts',()=>{
 const answer=quickReply('Can I pay with bKash?');
 assert.match(answer,/invoice/i);
 assert.match(answer,/confirm the correct receiving wallet privately/i);
 assert.match(answer,/Do not send any PIN, OTP/);
});

test('prices are not invented',()=>{
 const answer=quickReply('How much does a new website cost?');
 assert.match(answer,/requirements/i);
 assert.doesNotMatch(answer,/\$\d+|৳\d+/);
});

test('recognizes AI workflows and qualifications',()=>{
 assert.match(quickReply('Do you build AI agents?'),/AI assistants/i);
 assert.match(quickReply('Tell me about your Creative IT certificate'),/A\+/);
});

test('unknown offline questions explicitly say not sent',()=>{
 const answer=quickReply('xyzzy unsupported request');
 assert.match(answer,/not sent to Sakib/i);
});
