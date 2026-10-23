import {normalizeBrief,type ProjectBrief} from './project-brief';

export type ScopeAssessment={
 covered:number;
 total:5;
 completed:string[];
 gaps:string[];
 considerations:string[];
};

// This measures how many briefing topics were supplied, NOT project feasibility,
// price accuracy, completion percentage, or an AI-generated recommendation.
export function assessProjectScope(input:ProjectBrief):ScopeAssessment{
 const b=normalizeBrief(input);
 const checks=[
  {label:'A clear problem or goal',complete:b.goal.length>=10},
  {label:'The intended audience',complete:b.audience.length>=3},
  {label:'Requested capabilities',complete:b.features.length>0},
  {label:'A preferred timeline',complete:b.timeline!=='Flexible'},
  {label:'An indicative budget range',complete:b.budget!=='Not sure yet'}
 ];
 const considerations:string[]=[];
 if(b.features.length>=6)
  considerations.push('Several features are requested. Consider identifying the first release priorities and what can follow later.');
 if(b.features.includes('Online payments'))
  considerations.push('Discuss payment providers, refunds and transaction security before implementation.');
 if(b.features.includes('Account login'))
  considerations.push('Clarify account roles, access permissions and personal-data protection.');
 if(b.features.includes('Booking or scheduling'))
  considerations.push('Clarify availability rules, cancellations, time zones and notifications.');
 if(b.features.includes('AI assistance'))
  considerations.push('Clarify the data shared with AI providers, review needs and ongoing usage costs.');
 if(b.features.includes('API integrations'))
  considerations.push('List the third-party services, API access and integration dependencies.');
 if(b.budget==='Under $500'&&b.features.length>=5)
  considerations.push('Budget and feature priorities should be discussed together; no cost or delivery commitment is implied.');
 return {
  covered:checks.filter(c=>c.complete).length,
  total:5,
  completed:checks.filter(c=>c.complete).map(c=>c.label),
  gaps:checks.filter(c=>!c.complete).map(c=>c.label),
  considerations
 };
}

function markdownValue(value:string):string{
 return value.replace(/\\/g,'\\\\')
  .replace(/([\`*_\[\]#])/g,'\\$1')
  .replace(/</g,'&lt;').replace(/>/g,'&gt;')
  .replace(/\r\n?/g,'\n').replace(/\n/g,'  \n');
}

/** Text-only, local file export. Nothing is posted to the portfolio API. */
export function exportProjectBriefMarkdown(input:ProjectBrief):string{
 const b=normalizeBrief(input);
 const review=assessProjectScope(b);
 const lines=[
  '# Project Brief',
  '',
  '_Prepared by the client. Preferences only; not a quote or guarantee._',
  '',
  '## Project overview',
  '',
  '- **Type:** '+markdownValue(b.service),
  '- **Goal:** '+markdownValue(b.goal||'To discuss'),
  '- **Audience:** '+markdownValue(b.audience||'To discuss'),
  '- **Preferred timeline:** '+markdownValue(b.timeline),
  '- **Indicative budget preference:** '+markdownValue(b.budget),
  '',
  '## Requested capabilities',
  '',
  ...(b.features.length?b.features.map(feature=>'- '+markdownValue(feature)):['- To discuss']),
  '',
  '## Other constraints',
  '',
  markdownValue(b.notes||'None specified'),
  '',
  '## Before implementation',
  '',
  'Brief topics provided: '+review.covered+' of '+review.total+'. This is not a feasibility or quality score.',
  '',
  ...(review.gaps.length?['**Still to discuss:**',...review.gaps.map(g=>'- '+g),'']:[]),
  ...(review.considerations.length?['**Points worth clarifying:**',...review.considerations.map(c=>'- '+c),'']:[]),
  'A developer should confirm scope, schedule, security and pricing directly before work begins.',
  ''
 ];
 return lines.join('\n');
}
