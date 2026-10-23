'use client';

import {useEffect,useMemo,useRef,useState} from 'react';
import {useRouter} from 'next/navigation';
import {Search,X,ArrowUpRight,CornerDownLeft,BookOpen,Code2,FileText,LayoutGrid} from 'lucide-react';
import {searchDiscovery,type DiscoveryItem} from '@/lib/discovery';

const icons={Page:LayoutGrid,Project:Code2,Service:FileText,Article:BookOpen};

/** Fast local search: no analytics, network queries, or private conversation access. */
export default function CommandPalette(){
 const router=useRouter();
 const [open,setOpen]=useState(false);
 const [query,setQuery]=useState('');
 const [selected,setSelected]=useState(0);
 const inputRef=useRef<HTMLInputElement>(null);
 const dialogRef=useRef<HTMLDivElement>(null);
 const returnFocus=useRef<HTMLElement|null>(null);
 const results=useMemo(()=>searchDiscovery(query,9),[query]);

 useEffect(()=>{
  const onKey=(event:KeyboardEvent)=>{
   if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){
    event.preventDefault();
    setOpen(value=>!value);
   }
   // '/' is a discoverable search shortcut away from editable fields.
   const target=event.target as HTMLElement|null;
   const editing=target?.matches('input, textarea, select, [contenteditable="true"]');
   if(event.key==='/'&&!editing&&!event.ctrlKey&&!event.metaKey&&!event.altKey){
    event.preventDefault();setOpen(true);
   }
  };
  const onRequest=()=>setOpen(true);
  window.addEventListener('keydown',onKey);
  window.addEventListener('portfolio:open-search',onRequest);
  return()=>{window.removeEventListener('keydown',onKey);window.removeEventListener('portfolio:open-search',onRequest)};
 },[]);

 useEffect(()=>{
  if(!open)return;
  returnFocus.current=document.activeElement instanceof HTMLElement?document.activeElement:null;
  setQuery('');setSelected(0);
  const frame=requestAnimationFrame(()=>inputRef.current?.focus());
  return()=>{cancelAnimationFrame(frame);returnFocus.current?.focus()};
 },[open]);

 useEffect(()=>{setSelected(0)},[query]);
 const navigate=(item:DiscoveryItem)=>{
  setOpen(false);
  router.push(item.href);
 };
 const onKeyDown=(event:React.KeyboardEvent<HTMLDivElement>)=>{
  if(event.key==='Escape'){event.preventDefault();setOpen(false);return;}
  if(event.key==='ArrowDown'){event.preventDefault();setSelected(s=>results.length?(s+1)%results.length:0);return;}
  if(event.key==='ArrowUp'){event.preventDefault();setSelected(s=>results.length?(s-1+results.length)%results.length:0);return;}
  if(event.key==='Enter'&&results[selected]){event.preventDefault();navigate(results[selected]);return;}
  if(event.key==='Tab'){
   const focusable=Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('input:not([disabled]),button:not([disabled]),a[href]')||[]);
   if(!focusable.length)return;
   const first=focusable[0],last=focusable[focusable.length-1];
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
  }
 };
 if(!open)return null;
 return <div className="fixed inset-0 z-[90] flex items-start justify-center px-3 sm:px-6 pt-[12vh] sm:pt-[17vh]">
  <button aria-label="Close search overlay" type="button" onClick={()=>setOpen(false)} className="absolute inset-0 bg-[#020617]/75 backdrop-blur-sm cursor-default"/>
  <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Search portfolio" onKeyDown={onKeyDown} className="relative w-full max-w-2xl surface rounded-2xl sm:rounded-3xl shadow-[0_35px_125px_rgba(0,0,0,.46)] overflow-hidden max-h-[75dvh] flex flex-col">
   <div className="flex items-center gap-3 p-4 sm:p-5 border-b" style={{borderColor:'var(--border)'}}>
    <Search className="text-blue-500 shrink-0" size={23}/>
    <input ref={inputRef} role="combobox" aria-expanded="true" aria-controls="portfolio-command-list" aria-autocomplete="list" aria-activedescendant={results[selected]?`portfolio-command-${selected}`:undefined} autoComplete="off" type="search" value={query} onChange={event=>setQuery(event.target.value)} aria-label="Search portfolio pages, projects, services and articles" placeholder="Search projects, technologies, services…" className="min-w-0 flex-1 bg-transparent text-base outline-none border-0 focus:outline-none"/>
    <button type="button" onClick={()=>setOpen(false)} className="surface rounded-lg p-2 shrink-0" aria-label="Close search"><X size={18}/></button>
   </div>
   <div id="portfolio-command-list" role="listbox" aria-label="Portfolio search results" className="overflow-y-auto p-2 sm:p-3 min-h-28">
    {results.length?results.map((item,index)=>{
      const Icon=icons[item.type];
      return <button id={`portfolio-command-${index}`} role="option" aria-selected={selected===index} key={item.id} onMouseEnter={()=>setSelected(index)} onClick={()=>navigate(item)} type="button" className={`w-full flex items-center gap-3 text-left px-3 sm:px-4 py-3 rounded-xl transition-colors ${selected===index?'bg-blue-500/15 text-blue-500':'hover:bg-blue-500/10'}`}>
       <span className="grid place-items-center w-10 h-10 rounded-xl surface shrink-0"><Icon size={18}/></span>
       <span className="flex-1 min-w-0"><span className="block font-semibold text-sm truncate">{item.title}</span><span className="block text-xs muted truncate mt-1">{item.type} · {item.description}</span></span>
       <ArrowUpRight size={17} className="shrink-0 opacity-60"/>
      </button>;
    }):<div role="status" className="p-7 text-center"><p className="font-semibold">No results for “{query}”</p><p className="text-sm muted mt-2">Try React, Firebase, services or contact.</p></div>}
   </div>
   <div className="border-t px-4 py-3 text-xs muted flex items-center justify-between gap-2" style={{borderColor:'var(--border)'}}>
    <span>↑ ↓ Navigate · <CornerDownLeft size={12} className="inline"/> Open</span>
    <span>Esc Close · Local search only</span>
   </div>
  </div>
 </div>;
}
