import {test} from 'node:test';
import assert from 'node:assert/strict';
import {
 emptyBrief,normalizeBrief,buildProjectBriefText,toBriefTransfer,parseBriefTransfer,
 isBriefReady,projectServices,projectBudgets,featureOptions
} from './project-brief';

test('planning brief starts without contact information and requires meaningful goal',()=>{
 assert.equal(isBriefReady(emptyBrief),false);
 assert.equal(isBriefReady({...emptyBrief,goal:'Short'}),false);
 assert.equal(isBriefReady({...emptyBrief,goal:'A booking platform for local customers'}),true);
 assert.ok(!Object.hasOwn(emptyBrief,'email'));
 assert.ok(!Object.hasOwn(emptyBrief,'name'));
});

test('normalization bounds input and rejects invalid selects, features and script fields',()=>{
 const b=normalizeBrief({
  service:'<script>alert(1)</script>',budget:'invalid',timeline:'tomorrow',
  goal:'X'.repeat(10000),audience:'A'.repeat(900),notes:'N'.repeat(2000),
  features:['Online payments','Online payments','admin','Live chat','__proto__']
 });
 assert.equal(b.service,emptyBrief.service);
 assert.equal(b.budget,emptyBrief.budget);
 assert.equal(b.timeline,emptyBrief.timeline);
 assert.equal(b.goal.length,800);
 assert.equal(b.audience.length,300);
 assert.equal(b.notes.length,650);
 assert.deepEqual(b.features,['Online payments','Live chat']);
});

test('generated draft is an editable, bounded description and does not invent an estimate',()=>{
 const brief={...emptyBrief,goal:'A clinic scheduling website for returning patients',
  audience:'Local patients',features:['Booking or scheduling','Responsive design'],
  budget:'Not sure yet' as const,timeline:'1–3 months' as const};
 const msg=buildProjectBriefText(brief);
 assert.match(msg,/clinic scheduling/);
 assert.match(msg,/Booking or scheduling/);
 assert.match(msg,/Indicative budget: Not sure yet/);
 assert.match(msg,/Preferred timeline: 1–3 months/);
 assert.ok(msg.length<=4000);
 assert.doesNotMatch(msg,/guaranteed|estimated total cost/i);
});

test('contact handoff accepts only bounded, versioned planner-created content',()=>{
 const ready={...emptyBrief,goal:'A mobile reservation app with an admin dashboard'};
 const transfer=toBriefTransfer(ready);
 assert.deepEqual(parseBriefTransfer(JSON.stringify(transfer)),transfer);
 for(const invalid of [null,'not-json',JSON.stringify({...transfer,version:2}),
  JSON.stringify({...transfer,service:'fake'}),JSON.stringify({...transfer,budget:'$0'}),
  JSON.stringify({...transfer,message:'malicious overwrite'}),
  JSON.stringify({...transfer,message:'A'.repeat(9000)})]){
  assert.equal(parseBriefTransfer(invalid),null);
 }
 assert.equal(projectServices.length,5);
 assert.equal(projectBudgets.length,5);
 assert.ok(featureOptions.length>=8);
});
