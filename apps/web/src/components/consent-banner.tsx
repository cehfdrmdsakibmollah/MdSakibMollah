"use client";
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {enableAnalytics} from '@/lib/firebase';
export default function ConsentBanner(){
 const [choice,setChoice]=useState<string|null>('loading');
 useEffect(()=>{const value=localStorage.getItem('sakib-analytics-consent');setChoice(value);if(value==='yes')void enableAnalytics().catch(()=>{})},[]);
 function decide(value:'yes'|'no'){localStorage.setItem('sakib-analytics-consent',value);setChoice(value);if(value==='yes')void enableAnalytics().catch(()=>{});}
 if(choice!==null)return null;
 return <aside role="region" aria-label="Analytics preference" className="fixed z-[65] left-4 right-4 bottom-4 sm:left-6 sm:right-auto sm:w-[410px] surface rounded-2xl p-5 shadow-[0_18px_65px_rgba(0,0,0,.3)]">
 <h2 className="font-display font-bold text-base">A little privacy, by design.</h2>
 <p className="muted text-xs leading-6 mt-2">Optional analytics help understand website usage. You can decline and still use the portfolio. <Link href="/privacy" className="text-blue-500 underline">Privacy details</Link>.</p>
 <div className="mt-4 flex gap-3"><button onClick={()=>decide('no')} className="surface px-5 py-2.5 rounded-xl text-sm">Decline</button><button onClick={()=>decide('yes')} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold">Allow analytics</button></div>
 </aside>
}
