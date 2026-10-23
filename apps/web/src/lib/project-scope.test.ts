import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emptyBrief} from './project-brief';
import {assessProjectScope,exportProjectBriefMarkdown} from './project-scope';

test('scope review reports five transparent planning topics, never a project quality score',()=>{
 const empty=assessProjectScope(emptyBrief);
 assert.equal(empty.covered,0);
 assert.equal(empty.total,5);
 assert.equal(empty.gaps.length,5);
 assert.equal(empty.considerations.length,0);
 const complete=assessProjectScope({...emptyBrief,
  goal:'A reservation application for local customers',
  audience:'Local businesses and their customers',
  features:['Booking or scheduling'],
  timeline:'1–3 months',budget:'$500 – $2,000'
 });
 assert.equal(complete.covered,5);
 assert.equal(complete.gaps.length,0);
 assert.ok(complete.considerations.some(x=>/cancellations/.test(x)));
});

test('scope considerations depend on actual client-selected capabilities',()=>{
 const assessment=assessProjectScope({...emptyBrief,
  goal:'A web platform with customer accounts and AI search',
  budget:'Under $500',
  features:['Online payments','Account login','AI assistance','API integrations','Booking or scheduling','Live chat']
 });
 assert.equal(assessment.covered,3);
 assert.ok(assessment.considerations.some(x=>/refunds/.test(x)));
 assert.ok(assessment.considerations.some(x=>/personal-data/.test(x)));
 assert.ok(assessment.considerations.some(x=>/AI providers/.test(x)));
 assert.ok(assessment.considerations.some(x=>/first release priorities/.test(x)));
 assert.ok(assessment.considerations.some(x=>/Budget and feature priorities/.test(x)));
 assert.ok(!assessment.considerations.some(x=>/guaranteed delivery|fixed price/i.test(x)));
});

test('Markdown download content includes supplied information, omits private contact fields, and does not promise prices',()=>{
 const doc=exportProjectBriefMarkdown({...emptyBrief,
  service:'Mobile Application',goal:'A booking system for community appointments',
  audience:'Public visitors',timeline:'Flexible',budget:'Not sure yet',
  features:['Responsive design','Booking or scheduling'],
  notes:'Must be usable on smaller phones'
 });
 assert.match(doc,/^# Project Brief/m);
 assert.match(doc,/Mobile Application/);
 assert.match(doc,/community appointments/);
 assert.match(doc,/Booking or scheduling/);
 assert.match(doc,/not a quote or guarantee/i);
 assert.match(doc,/Still to discuss/);
 assert.doesNotMatch(doc,/Customer email:|Contact phone:|guaranteed completion/i);
 assert.ok(doc.length<9000);
});

test('Markdown export escapes user-supplied markup and remains bounded',()=>{
 const doc=exportProjectBriefMarkdown({...emptyBrief,
  goal:'A website <script>alert(1)</script> with secure pages',
  audience:'Shop staff',notes:'<img src=x onerror=alert(1)>'
 });
 assert.ok(!doc.includes('<script>'));
 assert.ok(!doc.includes('<img'));
 assert.match(doc,/&lt;script&gt;/);
 assert.match(doc,/&lt;img/);
 const long=exportProjectBriefMarkdown({...emptyBrief,
  goal:'G'.repeat(4000),audience:'A'.repeat(2000),notes:'N'.repeat(3000)
 });
 assert.ok(long.length<4500,'normalizeBrief limits exported text length');
});
