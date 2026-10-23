export const PROJECT_BRIEF_KEY='sakib-project-brief-transfer-v1';
export const projectServices=['Website / Web App','Mobile Application','AI & Automation','UI / UX Engineering','Other'] as const;
export const projectBudgets=['Not sure yet','Under $500','$500 – $2,000','$2,000 – $5,000','$5,000+'] as const;
export const timelines=['Flexible','Within a month','1–3 months','3–6 months','6+ months'] as const;
export const featureOptions=[
 'Responsive design','Account login','Admin dashboard','Online payments',
 'Live chat','Booking or scheduling','Content management','API integrations',
 'Analytics / reporting','AI assistance'
] as const;
export type ProjectService=typeof projectServices[number];
export type ProjectBudget=typeof projectBudgets[number];
export type ProjectTimeline=typeof timelines[number];
export type ProjectBrief={
 service:ProjectService;budget:ProjectBudget;timeline:ProjectTimeline;
 goal:string;audience:string;features:string[];notes:string;
};
export const emptyBrief:ProjectBrief={
 service:'Website / Web App',budget:'Not sure yet',timeline:'Flexible',
 goal:'',audience:'',features:[],notes:''
};
const allowedFeatures=new Set<string>(featureOptions);
const isOneOf=<T extends string>(value:unknown,allowed:readonly T[]):value is T=>
 typeof value==='string'&&allowed.includes(value as T);
const safeString=(value:unknown,max:number):string=>typeof value==='string'?value.replace(/\0/g,'').slice(0,max).trim():'';
export function normalizeBrief(input:unknown):ProjectBrief{
 const b=input&&typeof input==='object'&&!Array.isArray(input)?input as Record<string,unknown>:{};
 return {
  service:isOneOf(b.service,projectServices)?b.service:emptyBrief.service,
  budget:isOneOf(b.budget,projectBudgets)?b.budget:emptyBrief.budget,
  timeline:isOneOf(b.timeline,timelines)?b.timeline:emptyBrief.timeline,
  goal:safeString(b.goal,800),
  audience:safeString(b.audience,300),
  notes:safeString(b.notes,650),
  features:Array.isArray(b.features)?Array.from(new Set(b.features.filter((f):f is string=>
   typeof f==='string'&&allowedFeatures.has(f)))).slice(0,featureOptions.length):[]
 };
}
export function isBriefReady(brief:ProjectBrief):boolean{
 return brief.goal.trim().length>=10;
}
export function buildProjectBriefText(input:ProjectBrief):string{
 const b=normalizeBrief(input);
 const lines=[
  'Project brief (prepared by client)',
  'Project type: '+b.service,
  'Primary goal: '+(b.goal||'To discuss'),
  'Target audience: '+(b.audience||'To be discussed'),
  'Requested features: '+(b.features.length?b.features.join(', '):'To be discussed'),
  'Preferred timeline: '+b.timeline,
  'Indicative budget: '+b.budget,
  'Other requirements: '+(b.notes||'None specified'),
  '',
  'Please review feasibility, scope and next steps with me.'
 ];
 return lines.join('\n').slice(0,3900);
}
// Only a planner-created draft is read into Contact Form; no personal contact
// details, credentials, or arbitrary saved app state are accepted.
export type BriefTransfer={version:1;service:ProjectService;budget:ProjectBudget;message:string};
export function toBriefTransfer(input:ProjectBrief):BriefTransfer{
 const b=normalizeBrief(input);
 return {version:1,service:b.service,budget:b.budget,message:buildProjectBriefText(b)};
}
export function parseBriefTransfer(raw:string|null):BriefTransfer|null{
 if(!raw||raw.length>5000)return null;
 try{
  const obj=JSON.parse(raw) as Record<string,unknown>;
  if(!obj||obj.version!==1||!isOneOf(obj.service,projectServices)||!isOneOf(obj.budget,projectBudgets))return null;
  const msg=safeString(obj.message,4000);
  if(msg.length<10||!msg.startsWith('Project brief (prepared by client)'))return null;
  return {version:1,service:obj.service,budget:obj.budget,message:msg};
 }catch{return null}
}
