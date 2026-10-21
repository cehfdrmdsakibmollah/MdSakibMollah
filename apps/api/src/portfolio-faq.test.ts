import {test} from 'node:test';
import assert from 'node:assert/strict';
import {portfolioFaq,publicFaqReply} from './portfolio-faq.js';
test('answers visitor name and identity without pretending to be Sakib',()=>{
 const reply=portfolioFaq('What is your name?');
 assert.match(reply||'',/MD Sakib Mollah/);
 assert.match(reply||'',/not Sakib himself/);
});
test('offers fact-checked web/mobile/AI services',()=>{
 for(const input of ['website', 'mobile app', 'AI chatbot']){
  const answer=portfolioFaq(input);
  assert.ok(answer);
  assert.match(answer,/Sakib|portfolio/i);
 }
});
test('pricing answers avoid invented amounts',()=>{
 const answer=portfolioFaq('How much for a project?')||'';
 assert.match(answer,/fixed project prices/i);
 assert.doesNotMatch(answer,/\$\d+|৳\d+/);
});
test('guest messages are explicitly not forwarded or persisted',()=>{
 for(const q of ['What is the delivery price in my city?', 'unknown request 9zzxy']){
  const reply=publicFaqReply(q);
  assert.ok(reply.text);
  if(!reply.matched)assert.match(reply.text,/not sent or saved/);
 }
});
test('supports Bengali client queries',()=>{
 assert.match(portfolioFaq('আপনার নাম কি')||'',/MD Sakib Mollah/);
 assert.match(portfolioFaq('ওয়েবসাইট বানাব')||'',/React/);
});
