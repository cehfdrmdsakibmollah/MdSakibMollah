"use client";
import {useEffect,useRef,useState} from 'react';
import {Music2,Volume2,VolumeX,Pause,Play} from 'lucide-react';

/**
 * Short, consent-based ambient intro from the owner-supplied audio.
 * Audio is OFF by default to respect visitor choice and browser autoplay policy.
 * If the asset is not deployed, the control does not appear.
 */
export default function AmbientMusic(){
 const audio=useRef<HTMLAudioElement|null>(null);
 const [available,setAvailable]=useState(false);
 const [playing,setPlaying]=useState(false);
 const [volume,setVolume]=useState(0.15);
 const [notice,setNotice]=useState('');
 useEffect(()=>{
  let active=true;
  const element=new Audio('/audio/funk-power-intro.webm');
  element.preload='none';
  element.volume=0.15;
  element.loop=false;
  audio.current=element;
  const onEnd=()=>{if(active)setPlaying(false)};
  const onPause=()=>{if(active)setPlaying(false)};
  element.addEventListener('ended',onEnd);
  element.addEventListener('pause',onPause);
  void fetch('/audio/funk-power-intro.webm',{method:'HEAD'}).then(r=>{
   if(active)setAvailable(r.ok&&((r.headers.get('content-type')||'').includes('audio')||(r.headers.get('content-type')||'').includes('webm')));
  }).catch(()=>{if(active)setAvailable(false)});
  const visibility=()=>{if(document.hidden){element.pause();setPlaying(false)}};
  document.addEventListener('visibilitychange',visibility);
  return()=>{active=false;element.pause();element.src='';audio.current=null;document.removeEventListener('visibilitychange',visibility);element.removeEventListener('ended',onEnd);element.removeEventListener('pause',onPause)};
 },[]);
 const toggle=async()=>{
  const a=audio.current;if(!a)return;
  if(!a.paused){a.pause();return;}
  try{
   a.volume=volume;
   a.currentTime=0;
   await a.play();
   setPlaying(true);setNotice('');
  }catch{setPlaying(false);setNotice('Audio unavailable. Browser may require permission.');}
 };
 if(!available)return null;
 return <div className="fixed z-[39] bottom-5 left-4 sm:left-6 flex items-center gap-2 rounded-2xl border border-blue-400/20 bg-[#0b1728]/95 backdrop-blur-md text-white p-2.5 shadow-xl" aria-label="Optional portfolio ambient music">
  <button type="button" onClick={()=>void toggle()} title={playing?'Pause music':'Play gentle background music'} aria-label={playing?'Pause ambient music':'Play optional ambient music'} className="flex items-center gap-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/40 px-3 py-2 text-xs font-semibold">
   <Music2 size={15}/>{playing?<><Pause size={14}/> Pause</>:<><Play size={14}/> Music</>}
  </button>
  <span className="hidden sm:inline text-[11px] text-slate-300">Optional • Low volume</span>
  <label className="flex items-center gap-1" title="Music volume: 10–20%">
   {playing?<Volume2 size={15}/>:<VolumeX size={15}/>}
   <input aria-label="Music volume" type="range" min={10} max={20} step={1} value={Math.round(volume*100)} onChange={e=>{const v=Number(e.target.value)/100;setVolume(v);if(audio.current)audio.current.volume=v}} className="w-14 accent-blue-400"/>
  </label>
  {notice&&<span role="alert" className="sr-only">{notice}</span>}
 </div>;
}
