"use client";
import {useState} from 'react';
import type {User} from 'firebase/auth';
import {callApi} from '@/lib/api';

type Result = {ok:boolean;providerAccepted:boolean;inboxDeliveryVerified:boolean;message:string};

/** A diagnostic only: Resend acceptance is not the same as Gmail inbox delivery. */
export default function EmailNotificationCheck({user,configured}:{user:User;configured:boolean}){
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');
 const [error,setError]=useState(false);
 async function check(){
  if(!configured||busy)return;
  setBusy(true);setMessage('');setError(false);
  try{
   const result=await callApi<Result>('/admin/notifications/test',{method:'POST'},user);
   if(!result.ok||!result.providerAccepted)throw new Error('The provider did not accept the email.');
   setMessage('Test accepted by the email provider. Check the owner Gmail inbox (including Spam) to verify actual delivery.');
  }catch(err){
   setError(true);
   setMessage(err instanceof Error?err.message:'Test notification failed. Check Render and Resend settings.');
  }finally{setBusy(false);}
 }
 return <section aria-label="Email notification diagnostics" className="mt-5 surface rounded-2xl p-5 text-sm">
  <p className="font-semibold">Email notification status: {configured?'Sender settings detected':'Setup incomplete'}</p>
  <p className="muted mt-2 leading-6">Only the verified owner can request this test. It sends to the configured owner address only. Acceptance by Resend is not proof of Gmail delivery.</p>
  <button type="button" onClick={()=>void check()} disabled={!configured||busy}
   className="mt-4 rounded-xl bg-blue-600 text-white px-5 py-2.5 font-semibold disabled:opacity-50">
    {busy?'Sending test…':'Send test notification to owner Gmail'}
  </button>
  {!configured&&<p className="muted mt-3 text-xs">Set RESEND_API_KEY, RESEND_FROM_EMAIL (verified sender), and OWNER_NOTIFICATION_EMAIL on Render. No secrets are needed in the browser.</p>}
  {message&&<p role={error?'alert':'status'} className={`mt-3 text-xs ${error?'text-red-400':'text-blue-500'}`}>{message}</p>}
 </section>;
}
