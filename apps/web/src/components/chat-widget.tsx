"use client";
import {useCallback,useEffect,useRef,useState,type FormEvent} from 'react';
import {MessageCircle,X,Send,LoaderCircle,Bot,UserRound,ShieldCheck,Minimize2,WifiOff,Wifi,ArrowUpRight} from 'lucide-react';
import Link from 'next/link';
import ChatFeedback from './chat-feedback';
import {useAuth} from './providers';
import {callApi,type Message,type Conversation} from '@/lib/api';
import {quickReply} from '@/lib/quick-replies';
import {playChatOpenChime} from '@/lib/chat-open-chime';
type LocalMessage={id:string;sender:'client'|'assistant';text:string};
// Force a fresh widget instance whenever Firebase identity changes.
// React destroys the old component state immediately on sign-out or account switch,
// so cached messages from the previous client cannot be shown to the next user.
export default function ChatWidget(){
 const {user}=useAuth();
 return <ChatWidgetSession key={user?.uid??'signed-out'} />;
}
function ChatWidgetSession(){
 const {user,setAuthOpen}=useAuth();
 const [open,setOpen]=useState(false);
 const [online,setOnline]=useState<boolean|null>(null);
 const [conversation,setConversation]=useState<Conversation|null>(null);
 const [messages,setMessages]=useState<Message[]>([]);
 const [localMessages,setLocalMessages]=useState<LocalMessage[]>([]);
 const [text,setText]=useState('');
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const endRef=useRef<HTMLDivElement>(null);
 const number=useRef(0);
 const verified=Boolean(user?.emailVerified);
 const checkHealth=useCallback(async()=>{
  try{const res=await fetch('/api/backend/health',{cache:'no-store'});setOnline(res.ok);return res.ok}
  catch{setOnline(false);return false}
 },[]);
 const load=useCallback(async(id:string,silent=false)=>{
  if(!user)return;
  try{const result=await callApi<{messages:Message[]}>(`/conversations/${id}/messages`,{},user);setMessages(result.messages);setOnline(true);if(!silent)setError('')}
  catch(e){if(!silent)setError(e instanceof Error?e.message:'Could not refresh messages')}
 },[user]);
 useEffect(()=>{if(!open)return;void checkHealth();const timer=setInterval(()=>void checkHealth(),120000);return()=>clearInterval(timer)},[open,checkHealth]);
 useEffect(()=>{
  if(!open||!verified||!user)return;
  let cancelled=false;
  async function init(){
   try{
    const {conversation:c}=await callApi<{conversation:Conversation}>('/conversations/start',{method:'POST'},user);
    if(cancelled)return;
    setConversation(c);setOnline(true);await load(c._id);
   }catch(e){if(!cancelled){setConversation(null);setError(e instanceof Error?e.message:'Private messaging is unavailable.')}}
  }
  void init();return()=>{cancelled=true};
 },[open,user,verified,load]);
 useEffect(()=>{
  if(!open||!conversation||!verified)return;
  const timer=setInterval(()=>void load(conversation._id,true),9000);
  return()=>clearInterval(timer)
 },[open,conversation,verified,load]);
 useEffect(()=>{if(open)endRef.current?.scrollIntoView({behavior:'smooth',block:'end'})},[messages,localMessages,open,busy]);
 function appendLocal(sender:LocalMessage['sender'],content:string){number.current+=1;setLocalMessages(current=>[...current,{id:`offline-${number.current}-${crypto.randomUUID()}`,sender,text:content}]);}
 async function submit(e:FormEvent){
  e.preventDefault();const value=text.trim();if(!value||busy)return;
  setText('');setError('');
  if(!verified||!conversation||online===false){
   appendLocal('client',value);
   setBusy(true);
   try {
    if(online!==false){
     const res=await fetch('/api/backend/assistant/faq',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({question:value}),cache:'no-store',signal:AbortSignal.timeout(30000)
     });
     if(!res.ok)throw Error('FAQ service unavailable');
     const data=await res.json() as {answer:string;persisted:boolean;sentToOwner:boolean};
     if(typeof data.answer!=='string'||data.sentToOwner!==false||data.persisted!==false)throw Error('Invalid FAQ response');
     appendLocal('assistant',data.answer);
    }else appendLocal('assistant',quickReply(value));
   }catch {
    appendLocal('assistant',quickReply(value));
   }finally {setBusy(false);}
   setError(verified
    ?'Your message was NOT sent or saved for Sakib. The private conversation may still be connecting. Retry once it is ready.'
    :'This informational reply was NOT sent to Sakib. Sign in to send a private message, or use the Contact page.');
   return;
  }
  setBusy(true);
  try{
   const {messages:added}=await callApi<{messages:Message[]}>(`/conversations/${conversation._id}/messages`,{method:'POST',body:JSON.stringify({text:value})},user);
   setMessages(current=>[...current.filter(m=>!added.some(a=>a._id===m._id)),...added]);setOnline(true)
  }catch(e){setText(value);setError(`${e instanceof Error?e.message:'Message failed'}. Your message was NOT confirmed delivered. You can retry.`)}
  finally{setBusy(false)}
 }
 return <>
 <button onClick={()=>{if(!open)playChatOpenChime();setOpen(v=>!v)}} aria-label={open?'Close live chat':'Open portfolio assistant'} aria-expanded={open} className="fixed bottom-5 right-5 sm:bottom-7 sm:right-7 z-50 h-16 w-16 rounded-2xl grid place-items-center text-white bg-blue-600 hover:bg-blue-500 shadow-[0_14px_50px_rgba(29,100,255,.42)] transition-transform hover:scale-105">{open?<X size={26}/>:<MessageCircle size={27}/>}<span className={`absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-[#081629] ${online===false?'bg-amber-400':online===null?'bg-slate-400':'bg-emerald-400'}`}/></button>
 {open&&<section role="dialog" aria-modal="false" aria-label="Portfolio assistant and client messages" className="fixed bottom-24 sm:bottom-28 right-4 sm:right-7 z-50 w-[calc(100vw-2rem)] sm:w-[390px] h-[min(630px,78dvh)] surface shadow-[0_20px_80px_rgba(0,0,0,.3)] rounded-[24px] overflow-hidden flex flex-col">
 <div className="p-5 bg-gradient-to-r from-blue-700 to-blue-500 text-white flex items-center justify-between"><div className="flex items-center gap-3"><div className="h-11 w-11 rounded-xl bg-white/15 grid place-items-center"><Bot size={25}/></div><div><p className="font-display font-bold">Ask Sakib’s assistant</p><p className="text-xs text-blue-100 mt-1">Portfolio FAQs • Sign in for personal replies</p></div></div><button onClick={()=>setOpen(false)} aria-label="Minimize chat"><Minimize2 size={18}/></button></div>
 <div className="px-4 py-2 border-b flex justify-between items-center text-xs" style={{borderColor:'var(--border)'}}><span className="flex gap-2 items-center">{online?<Wifi size={14} className="text-emerald-500"/>:<WifiOff size={14} className="text-amber-500"/>}{online?'Backend connected':online===null?'Checking backend…':'Offline FAQs available'}</span><button onClick={()=>void checkHealth()} className="text-blue-500 font-semibold">Recheck</button></div>
 <div className="flex-1 overflow-y-auto p-4 space-y-4" aria-live="polite">
 <div className="rounded-2xl bg-blue-500/10 text-sm p-4 leading-6">Hi! 👋 Ask about web, mobile, AI, services and project pricing. FAQs work offline. <strong>Personal messages are saved only when the backend confirms delivery.</strong></div>
 {!verified&&<div className="rounded-xl p-3 border text-xs leading-6" style={{borderColor:'var(--border)'}}><ShieldCheck size={17} className="inline text-blue-500 mr-2"/>Sign in with Google or a verified email for private messages. <button className="text-blue-500 underline font-semibold" onClick={()=>setAuthOpen(true)}>Sign in</button></div>}
 {messages.map(m=><div key={m._id} className={`flex ${m.sender==='client'?'justify-end':'justify-start'}`}><div className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 ${m.sender==='client'?'bg-blue-600 text-white':'surface'}`}><span className="text-[10px] opacity-70 uppercase font-semibold flex items-center gap-1 mb-1">{m.sender==='client'?<><UserRound size={12}/> You · sent</>:m.sender==='owner'?'Sakib · Personal reply':<><Bot size={12}/> Automated reply</>}</span><p className="whitespace-pre-wrap break-words">{m.text}</p></div></div>)}
 {localMessages.map(m=><div key={m.id} className={`flex ${m.sender==='client'?'justify-end':'justify-start'}`}><div className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 ${m.sender==='client'?'bg-slate-700 text-white':'surface'}`}><span className="text-[10px] font-bold opacity-70 uppercase block mb-1">{m.sender==='client'?'Local question · not sent':'Portfolio FAQ · not sent'}</span><p className="whitespace-pre-wrap">{m.text}</p></div></div>)}
 {busy&&<p className="text-xs muted flex gap-2 items-center"><LoaderCircle size={14} className="animate-spin"/> Sending and awaiting reply…</p>}
 <div ref={endRef}/></div>
 {error&&<p role="alert" className="text-amber-600 dark:text-amber-400 text-xs px-4 pb-2">{error}</p>}
 <form onSubmit={e=>void submit(e)} className="p-4 border-t flex gap-2" style={{borderColor:'var(--border)'}}><input value={text} onChange={e=>setText(e.target.value)} maxLength={2000} aria-label="Type a message" placeholder={online===false?'Ask an offline FAQ…':'Ask a question…'} className="flex-1 min-w-0 surface px-3 py-3 rounded-xl text-sm"/><button aria-label="Send question" disabled={busy||!text.trim()} className="bg-blue-600 text-white rounded-xl px-4 disabled:opacity-40"><Send size={19}/></button></form>
 <div className="px-4 pb-3 flex justify-between items-center"><Link href="/contact" onClick={()=>setOpen(false)} className="text-xs text-blue-500 flex items-center gap-1 font-semibold">Contact Sakib <ArrowUpRight size={13}/></Link><span className="text-[10px] muted">AI can make mistakes.</span></div>
 {conversation&&online&&verified&&user&&<ChatFeedback key={conversation._id} user={user} conversationId={conversation._id}/>}
 </section>}
 </>;
}
