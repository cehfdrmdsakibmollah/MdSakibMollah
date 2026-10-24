"use client";
import {useEffect,useRef,useState,type FormEvent} from 'react';import {ArrowUpRight,CheckCircle2,LoaderCircle,Send} from 'lucide-react';import {callApi} from '@/lib/api';import {PROJECT_BRIEF_KEY,parseBriefTransfer} from '@/lib/project-brief';
const initial={name:'',email:'',company:'',service:'Website / Web App',budget:'Not sure yet',message:'',website:''};
export default function ContactForm(){const[data,setData]=useState(initial);const[busy,setBusy]=useState(false);const[error,setError]=useState('');const[success,setSuccess]=useState('');
 const[plannerImported,setPlannerImported]=useState(false);const submissionIdRef=useRef<string|null>(null);const inFlightRef=useRef(false);
 useEffect(()=>{
  // Only an explicit planner handoff on this tab can prefill the form.
  // Consume it once, without retaining client details beyond the page.
  try{
   const raw=window.sessionStorage.getItem(PROJECT_BRIEF_KEY);
   if(!raw)return;
   window.sessionStorage.removeItem(PROJECT_BRIEF_KEY);
   const transfer=parseBriefTransfer(raw);
   if(!transfer)return;
   setData(prev=>({...prev,service:transfer.service,budget:transfer.budget,message:transfer.message}));
   setPlannerImported(true);
  }catch{/* session storage may be unavailable in privacy mode */}
 },[]);
 async function submit(e:FormEvent<HTMLFormElement>){
 e.preventDefault();
 if(inFlightRef.current)return;
 inFlightRef.current=true;
 setBusy(true);setError('');setSuccess('');
 // Retain the same key if the response is lost and the visitor retries.
 // A subsequent edit intentionally starts a new submission.
 const submissionId=submissionIdRef.current??crypto.randomUUID();
 submissionIdRef.current=submissionId;
 try{
  const result=await callApi<{ok:boolean;reference:string;deduplicated?:boolean}>('/contact',
   {method:'POST',body:JSON.stringify({...data,submissionId})});
  setSuccess(`Your inquiry was received${result.reference?` (reference ${result.reference.slice(-6)})`:''}. Sakib will review it personally.`);
  submissionIdRef.current=null;
  setData(initial);
 }catch(e){
  setError(`${e instanceof Error?e.message:'Unable to send your message.'} Your inquiry was not confirmed. If needed, retry without editing—an already-saved request will not be duplicated.`);
 }finally{setBusy(false);inFlightRef.current=false}
}
const field=(key:keyof typeof data,value:string)=>{submissionIdRef.current=null;setData(s=>({...s,[key]:value}))};return <form onSubmit={e=>void submit(e)} className="surface rounded-[28px] p-6 sm:p-9 shadow-2xl space-y-5">{plannerImported&&<div role="status" className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 text-sm leading-6"><strong className="text-blue-500">Project brief added.</strong> Review and edit the details below. Your name and email are not prefilled, and nothing is sent until you select <strong>Send Project Inquiry</strong>.</div>}<div className="grid sm:grid-cols-2 gap-5"><label className="block text-sm font-medium">Your name *<input required minLength={2} maxLength={90} value={data.name} onChange={e=>field('name',e.target.value)} placeholder="Your full name" className="mt-2 w-full surface rounded-xl px-4 py-3.5 bg-transparent"/></label><label className="block text-sm font-medium">Work email *<input required type="email" maxLength={254} value={data.email} onChange={e=>field('email',e.target.value)} placeholder="name@company.com" className="mt-2 w-full surface rounded-xl px-4 py-3.5 bg-transparent"/></label></div><label className="block text-sm font-medium">Company / Brand<input maxLength={100} value={data.company} onChange={e=>field('company',e.target.value)} placeholder="Optional" className="mt-2 w-full surface rounded-xl px-4 py-3.5 bg-transparent"/></label><div className="grid sm:grid-cols-2 gap-5"><label className="block text-sm font-medium">What do you need?<select value={data.service} onChange={e=>field('service',e.target.value)} className="mt-2 w-full surface rounded-xl px-4 py-3.5 bg-[var(--card)]"><option>Website / Web App</option><option>Mobile Application</option><option>AI & Automation</option><option>UI / UX Engineering</option><option>Other</option></select></label><label className="block text-sm font-medium">Estimated budget<select value={data.budget} onChange={e=>field('budget',e.target.value)} className="mt-2 w-full surface rounded-xl px-4 py-3.5 bg-[var(--card)]"><option>Not sure yet</option><option>Under $500</option><option>$500 – $2,000</option><option>$2,000 – $5,000</option><option>$5,000+</option></select></label></div><label className="block text-sm font-medium">Tell me about your project *<textarea required minLength={10} maxLength={4000} rows={5} value={data.message} onChange={e=>field('message',e.target.value)} placeholder="Your goals, core features, ideal timeline, and the problem you’re solving…" className="mt-2 block w-full surface rounded-xl px-4 py-3.5 bg-transparent resize-y"/></label><div aria-hidden="true" className="absolute left-[-9999px]"><label>Website<input tabIndex={-1} value={data.website} onChange={e=>field('website',e.target.value)} autoComplete="off"/></label></div>{error&&<p role="alert" className="text-red-400 text-sm">{error}</p>}{success&&<p role="status" className="text-emerald-500 flex items-start gap-2 text-sm"><CheckCircle2 className="shrink-0" size={18}/>{success}</p>}<button type="submit" disabled={busy} className="w-full inline-flex justify-center items-center gap-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-7 py-4 font-semibold disabled:opacity-60 transition-colors">{busy?<LoaderCircle size={18} className="animate-spin"/>:<Send size={18}/>} {busy?'Sending your inquiry…':'Send Project Inquiry'} <ArrowUpRight size={17}/></button><p className="text-xs muted leading-5">Your details are used only to respond to this inquiry. Automated email confirmations are sent when email delivery is configured.</p></form>}
