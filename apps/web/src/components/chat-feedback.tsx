"use client";
import {useState,type FormEvent} from 'react';
import {MessageSquareHeart,Star,LoaderCircle,CheckCircle2} from 'lucide-react';
import type {User} from 'firebase/auth';
import {callApi} from '@/lib/api';

export default function ChatFeedback({user,conversationId}:{user:User;conversationId:string}){
 const[expanded,setExpanded]=useState(false);
 const[rating,setRating]=useState(5);
 const[comment,setComment]=useState('');
 const[loading,setLoading]=useState(false);
 const[success,setSuccess]=useState(false);
 const[error,setError]=useState('');
 async function submit(e:FormEvent){
  e.preventDefault();setLoading(true);setError('');
  try{
   await callApi(`/conversations/${conversationId}/feedback`,{method:'POST',body:JSON.stringify({rating,comment})},user);
   setSuccess(true);setExpanded(false);
  }catch(e){setError(e instanceof Error?e.message:'Could not save feedback');}
  finally{setLoading(false);}
 }
 if(success)return <p role="status" className="text-xs text-emerald-500 flex items-center gap-2 px-4 pb-3"><CheckCircle2 size={14}/> Private feedback saved. Thank you!</p>;
 return <div className="px-4 pb-3 border-t" style={{borderColor:'var(--border)'}}>
  <button type="button" aria-expanded={expanded} onClick={()=>setExpanded(v=>!v)} className="text-xs muted flex items-center gap-2 pt-3 hover:text-blue-500"><MessageSquareHeart size={14}/> Rate your chat experience</button>
  {expanded&&<form onSubmit={e=>void submit(e)} className="pt-3 space-y-2">
   <fieldset><legend className="text-xs font-semibold mb-2">How helpful was this conversation?</legend><div className="flex gap-1">{[1,2,3,4,5].map(n=><button key={n} type="button" onClick={()=>setRating(n)} aria-label={`${n} of 5 stars`} aria-pressed={rating===n} className="p-1" ><Star size={21} className={n<=rating?'text-amber-400 fill-amber-400':'muted'}/></button>)}</div></fieldset>
   <label className="block text-xs">Optional comment<input maxLength={600} value={comment} onChange={e=>setComment(e.target.value)} className="block mt-1 w-full surface rounded-lg px-3 py-2" placeholder="Your feedback helps improve the experience"/></label>
   {error&&<p role="alert" className="text-red-500 text-xs">{error}</p>}
   <button disabled={loading} className="bg-blue-600 text-white text-xs rounded-lg px-3 py-2 disabled:opacity-50 flex gap-2 items-center">{loading&&<LoaderCircle size={13} className="animate-spin"/>}Submit private feedback</button>
  </form>}
 </div>;
}
