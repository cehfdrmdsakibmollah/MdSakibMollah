'use client';

import {useMemo,useState} from 'react';
import {useRouter} from 'next/navigation';
import {
 ArrowRight,ArrowLeft,CheckCircle2,ClipboardCopy,ClipboardList,
 Sparkles,ShieldCheck,ExternalLink,RotateCcw
} from 'lucide-react';
import {
 PROJECT_BRIEF_KEY,emptyBrief,projectServices,projectBudgets,timelines,
 featureOptions,normalizeBrief,isBriefReady,buildProjectBriefText,toBriefTransfer,
 type ProjectBrief
} from '@/lib/project-brief';

const stages=[
 {name:'Your idea',hint:'Goal and audience'},
 {name:'What to build',hint:'Type and capabilities'},
 {name:'Delivery',hint:'Timeline and budget'},
 {name:'Review brief',hint:'Copy or send'}
] as const;
const fieldClass='surface w-full px-4 py-3 rounded-xl text-sm focus-visible:outline-blue-500 bg-[var(--card)]';
const labelClass='block text-sm font-semibold mb-2';
export default function ProjectPlanner(){
 const router=useRouter();
 const [step,setStep]=useState(0);
 const [brief,setBrief]=useState<ProjectBrief>({...emptyBrief});
 const [status,setStatus]=useState('');
 const [error,setError]=useState('');
 const text=useMemo(()=>buildProjectBriefText(brief),[brief]);
 const change=(part:Partial<ProjectBrief>)=>{setBrief(prev=>normalizeBrief({...prev,...part}));setError('');setStatus('')};
 const toggle=(name:string)=>change({features:brief.features.includes(name)?
  brief.features.filter(f=>f!==name):[...brief.features,name]});
 const next=()=>{
  if(step===0&&!isBriefReady(brief)){setError('Please describe your project goal in at least 10 characters.');return}
  setError('');setStatus('');setStep(s=>Math.min(stages.length-1,s+1));
 };
 const startOver=()=>{setBrief({...emptyBrief});setStep(0);setError('');setStatus('')};
 const copy=async()=>{
  try{
   await navigator.clipboard.writeText(text);
   setStatus('Project brief copied. You can paste it anywhere.');
   setError('');
  }catch{
   setError('Clipboard access is unavailable. Select and copy the preview below instead.');
  }
 };
 const continueToContact=()=>{
  if(!isBriefReady(brief)){setError('Add a clear project goal before continuing.');setStep(0);return}
  try{
   window.sessionStorage.setItem(PROJECT_BRIEF_KEY,JSON.stringify(toBriefTransfer(brief)));
   router.push('/contact');
  }catch{
   setError('Browser storage is unavailable. Copy your brief and paste it into the contact form manually.');
  }
 };
 return <div className="min-h-screen pt-32 pb-24 orbit-bg">
  <section className="max-w-6xl mx-auto px-5 sm:px-8">
   <div className="max-w-3xl">
    <p className="uppercase text-xs tracking-[.27em] text-blue-500 font-semibold">Client Project Studio / Free planning tool</p>
    <h1 className="font-display text-4xl sm:text-6xl font-bold tracking-tight mt-5">Turn your idea into a <span className="electric-text">clear project brief.</span></h1>
    <p className="muted leading-7 text-base sm:text-lg mt-6">Scope your website, app or automation in four simple steps. Review an editable brief before sharing it. No account, AI credits or payment required.</p>
   </div>
   <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(300px,.76fr)] gap-7 mt-11 items-start">
    <div className="surface rounded-[28px] p-5 sm:p-8">
     <div className="flex gap-2 sm:gap-3" aria-label="Project planning progress">
      {stages.map(({name},index)=><button type="button" key={name} onClick={()=>{
        if(index<=step || isBriefReady(brief)){setStep(index);setError('')}
      }} aria-label={`Step ${index+1}: ${name}`} aria-current={index===step?'step':undefined}
       className={`h-2 rounded-full flex-1 transition-colors ${index<=step?'bg-blue-500':'bg-blue-500/15'}`}/>)}
     </div>
     <div className="flex items-center justify-between gap-3 mt-5">
      <span className="text-xs font-semibold uppercase tracking-widest text-blue-500">Step {step+1} of {stages.length}</span>
      <span className="muted text-xs">{stages[step].hint}</span>
     </div>
     <h2 className="font-display text-2xl sm:text-3xl font-bold mt-2">{stages[step].name}</h2>
     {step===0&&<div className="space-y-6 mt-7">
      <div><label htmlFor="planner-goal" className={labelClass}>What problem should this project solve? *</label>
       <textarea id="planner-goal" rows={5} minLength={10} maxLength={800} required value={brief.goal} onChange={e=>change({goal:e.target.value})} placeholder="Example: I need a booking platform that lets customers reserve appointments and receive confirmations." className={fieldClass}/>
       <p className="muted text-xs mt-2">{brief.goal.length}/800 characters · Minimum 10 required</p>
      </div>
      <div><label htmlFor="planner-audience" className={labelClass}>Who will use it?</label>
       <input id="planner-audience" maxLength={300} value={brief.audience} onChange={e=>change({audience:e.target.value})} placeholder="Customers, internal team, students, patients..." className={fieldClass}/>
      </div>
     </div>}
     {step===1&&<div className="space-y-7 mt-7">
      <fieldset><legend className={labelClass}>Choose a project type</legend>
       <div className="grid sm:grid-cols-2 gap-3">{projectServices.map(service=><label key={service} className={`flex gap-3 items-center cursor-pointer rounded-xl border p-4 text-sm ${brief.service===service?'border-blue-500 bg-blue-500/10':'border-[var(--border)]'}`}>
        <input type="radio" name="planner-service" value={service} checked={brief.service===service} onChange={()=>change({service})} className="accent-blue-600"/>
        <span className="font-semibold">{service}</span>
       </label>)}</div>
      </fieldset>
      <fieldset><legend className={labelClass}>Pick the capabilities you want</legend>
       <p className="text-xs muted mb-3">Optional · Select any that may be useful. Final scope is discussed with Sakib.</p>
       <div className="grid sm:grid-cols-2 gap-3">{featureOptions.map(feature=><label key={feature} className={`flex items-center gap-3 cursor-pointer rounded-xl border px-4 py-3 text-sm ${brief.features.includes(feature)?'border-blue-500 bg-blue-500/10':'border-[var(--border)]'}`}>
        <input type="checkbox" checked={brief.features.includes(feature)} onChange={()=>toggle(feature)} className="accent-blue-600 w-4 h-4"/>
        {feature}
       </label>)}</div>
      </fieldset>
     </div>}
     {step===2&&<div className="space-y-6 mt-7">
      <div><label htmlFor="planner-timeline" className={labelClass}>Preferred timeline</label>
       <select id="planner-timeline" value={brief.timeline} onChange={e=>change({timeline:e.target.value as ProjectBrief['timeline']})} className={fieldClass}>{timelines.map(x=><option key={x}>{x}</option>)}</select>
      </div>
      <div><label htmlFor="planner-budget" className={labelClass}>Your approximate budget range</label>
       <select id="planner-budget" value={brief.budget} onChange={e=>change({budget:e.target.value as ProjectBrief['budget']})} className={fieldClass}>{projectBudgets.map(x=><option key={x}>{x}</option>)}</select>
       <p className="muted text-xs mt-2">This is your preference, not a quote or a project price estimate.</p>
      </div>
      <div><label htmlFor="planner-notes" className={labelClass}>Other requirements or constraints</label>
       <textarea id="planner-notes" value={brief.notes} maxLength={650} rows={4} onChange={e=>change({notes:e.target.value})} className={fieldClass} placeholder="Integrations, accessibility needs, references, or anything else worth discussing..."/>
      </div>
     </div>}
     {step===3&&<div className="space-y-5 mt-7">
      <p className="muted text-sm leading-6">Review your brief on the right. You can return to any earlier step to edit the details. No message is sent automatically.</p>
      <div className="flex items-start gap-3 rounded-2xl border border-blue-500/25 bg-blue-500/10 p-4 text-sm">
       <ShieldCheck className="text-blue-500 shrink-0" size={21}/>
       <p>The next action only prepares the Contact Form. You will enter your name and email there, and decide whether to press Send.</p>
      </div>
      <button type="button" onClick={()=>void copy()} className="surface rounded-xl inline-flex items-center gap-2 px-5 py-3 font-semibold text-sm"><ClipboardCopy size={18}/> Copy brief</button>
      <button type="button" onClick={continueToContact} className="flex items-center justify-center gap-2 bg-blue-600 text-white rounded-xl px-6 py-4 font-semibold w-full hover:bg-blue-500">Continue to contact form <ArrowRight size={19}/></button>
     </div>}
     {error&&<p role="alert" className="text-red-400 text-sm mt-5">{error}</p>}
     {status&&<p role="status" className="text-emerald-500 text-sm mt-5">{status}</p>}
     <div className="border-t mt-8 pt-5 flex items-center justify-between gap-3" style={{borderColor:'var(--border)'}}>
      <button type="button" onClick={()=>{setStep(s=>Math.max(0,s-1));setError('')}} disabled={step===0} className="surface rounded-xl px-4 py-3 inline-flex items-center gap-2 text-sm font-semibold disabled:opacity-40"><ArrowLeft size={17}/> Back</button>
      <button type="button" onClick={startOver} className="muted inline-flex items-center gap-2 text-xs"><RotateCcw size={14}/> Start over</button>
      {step<3&&<button type="button" onClick={next} className="bg-blue-600 text-white rounded-xl px-5 py-3 inline-flex items-center gap-2 text-sm font-semibold">Next <ArrowRight size={17}/></button>}
     </div>
    </div>
    <aside aria-label="Live project brief preview" className="surface rounded-[28px] p-5 sm:p-7 lg:sticky lg:top-28">
     <div className="flex items-center justify-between gap-2"><span className="font-display font-bold text-xl inline-flex gap-2 items-center"><ClipboardList className="text-blue-500" size={22}/> Live brief preview</span>{isBriefReady(brief)&&<CheckCircle2 className="text-emerald-500 shrink-0" size={21}/>}</div>
     <p className="muted text-xs leading-5 mt-3">Updates as you complete the steps. The preview stays on this device unless you choose to copy or transfer it.</p>
     <pre data-testid="project-brief-preview" className="text-sm leading-7 whitespace-pre-wrap break-words font-sans mt-6 p-4 rounded-xl border bg-blue-500/5" style={{borderColor:'var(--border)'}}>{text}</pre>
     <div className="mt-5 flex gap-2 items-start text-xs muted"><Sparkles size={17} className="text-blue-500 shrink-0"/> Scope and availability are discussed individually. This tool does not generate price guarantees or AI recommendations.</div>
    </aside>
   </div>
   <div className="mt-10 text-sm muted flex items-center gap-2"><ExternalLink size={15}/><span>Need something simpler? <a href="/contact" className="text-blue-500 underline underline-offset-4">Use the regular Contact Form</a>.</span></div>
  </section>
 </div>;
}
