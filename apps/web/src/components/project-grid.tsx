"use client";

import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {ArrowUpRight,Search,RotateCcw,Code2,ShoppingBag,CloudSun,CheckSquare,Utensils,Fingerprint,Layout,House,BookmarkPlus,BookmarkCheck,GitCompareArrows,Copy,ExternalLink,Check,Trash2} from 'lucide-react';
import Reveal from './reveal';
import {projects,type Project} from '@/lib/site';
import {filterPortfolioProjects,projectCategories,projectTechnologies,type ProjectSort} from '@/lib/discovery';
import {SHORTLIST_STORAGE_KEY,MAX_COMPARISONS,defaultExplorerFilters,cleanProjectSlugs,toggleProjectShortlist,parseExplorerState,encodeExplorerState} from '@/lib/project-explorer';

const icons=[ShoppingBag,CheckSquare,Utensils,CloudSun,Fingerprint,ShoppingBag,Layout,House];

function Card({project,index,compact,shortlisted,onToggle,full}:{project:Project;index:number;compact:boolean;shortlisted:boolean;onToggle:()=>void;full:boolean}){
 const Icon=icons[projects.findIndex(x=>x.slug===project.slug)]||Code2;
 return <Reveal delay={Math.min(index%3,.2)}>
  <div className="relative h-full">
   <Link href={`/projects/${project.slug}`} className="card-shine group block surface rounded-[27px] p-3 hover:border-blue-500/45 transition-all hover:-translate-y-1 hover:shadow-glow h-full">
    <div className={`relative h-52 sm:h-56 rounded-[19px] overflow-hidden bg-gradient-to-br ${project.accent} flex items-center justify-center`}>
     <div className="absolute w-48 h-48 border border-white/10 rounded-full scale-125"/>
     <div className="absolute w-64 h-64 border border-white/10 rounded-full scale-125"/>
     <div className="relative grid place-items-center w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/30 shadow-2xl rotate-[-8deg] group-hover:rotate-0 group-hover:scale-110 transition-transform duration-500"><Icon size={47} strokeWidth={1.4} className="text-white"/></div>
     <div className="absolute top-5 left-5 text-white/75 text-xs tracking-widest uppercase">0{projects.findIndex(p=>p.slug===project.slug)+1} / Project</div>
     <div className="absolute right-5 bottom-5 rounded-full bg-black/25 backdrop-blur-md text-white p-2"><ArrowUpRight size={19}/></div>
    </div>
    <div className="p-4 pb-5">
     <div className="flex justify-between items-center gap-3"><p className="text-xs tracking-wider uppercase text-blue-500 font-semibold">{project.category}</p><ArrowUpRight size={18} className="muted group-hover:text-blue-500"/></div>
     <h3 className="font-display text-xl sm:text-2xl font-bold mt-3 tracking-tight">{project.title}</h3>
     <p className="muted mt-2 text-sm leading-6 min-h-16">{project.description}</p>
     <div className="flex flex-wrap gap-2 mt-5">{project.stack.slice(0,3).map(s=><span key={s} className="text-[11px] pill">{s}</span>)}</div>
    </div>
   </Link>
   {!compact&&<button type="button" onClick={onToggle} disabled={!full&&!shortlisted}
    aria-label={shortlisted?`Remove ${project.title} from comparison`:`Add ${project.title} to comparison`}
    aria-pressed={shortlisted} title={shortlisted?'Remove from shortlist':full?'Compare up to 3 projects':'Remove a project before adding another'}
    className={`absolute top-6 right-6 z-10 flex gap-2 items-center rounded-full px-3 py-2 text-xs font-semibold shadow-lg backdrop-blur-lg disabled:opacity-60 ${shortlisted?'bg-emerald-600 text-white':'bg-slate-950/80 text-white hover:bg-blue-600'}`}>
     {shortlisted?<BookmarkCheck size={16}/>:<BookmarkPlus size={16}/>}
     {shortlisted?'Added':'Compare'}
   </button>}
  </div>
 </Reveal>;
}

export default function ProjectGrid({compact=false}:{compact?:boolean}){
 const [category,setCategory]=useState('All');
 const [technology,setTechnology]=useState('All');
 const [query,setQuery]=useState('');
 const [sort,setSort]=useState<ProjectSort>('recommended');
 const [featuredOnly,setFeaturedOnly]=useState(false);
 const [compare,setCompare]=useState<string[]>([]);
 const [compareOpen,setCompareOpen]=useState(false);
 const [initialized,setInitialized]=useState(false);
 const [copyStatus,setCopyStatus]=useState('');

 useEffect(()=>{
  if(compact)return;
  const hydrate=()=>{
   const params=new URLSearchParams(window.location.search);
   const {filters,compare:fromUrl}=parseExplorerState(params);
   setQuery(filters.query);setCategory(filters.category);setTechnology(filters.technology);setSort(filters.sort);setFeaturedOnly(filters.featuredOnly);
   if(params.has('compare'))setCompare(fromUrl);
   else{
    try{const stored=JSON.parse(window.localStorage.getItem(SHORTLIST_STORAGE_KEY)||'[]');
     setCompare(Array.isArray(stored)?cleanProjectSlugs(stored.filter((value:unknown):value is string=>typeof value==='string')):[]);
    }catch{setCompare([])}
   }
  };
  hydrate();setInitialized(true);
  window.addEventListener('popstate',hydrate);
  return()=>window.removeEventListener('popstate',hydrate);
 },[compact]);

 useEffect(()=>{
  if(!initialized||compact)return;
  const filters={query,category,technology,sort,featuredOnly};
  const params=encodeExplorerState(new URLSearchParams(window.location.search),{filters,compare});
  const qs=params.toString();
  const next=`${window.location.pathname}${qs?'?'+qs:''}${window.location.hash}`;
  if(next!==`${window.location.pathname}${window.location.search}${window.location.hash}`)
   window.history.replaceState(window.history.state,'',next);
  try{window.localStorage.setItem(SHORTLIST_STORAGE_KEY,JSON.stringify(compare))}catch{/* private browsing may disable storage */}
 },[initialized,compact,query,category,technology,sort,featuredOnly,compare]);

 const visible=useMemo(()=>filterPortfolioProjects(compact?projects.filter(p=>p.featured):projects,
  {query:compact?'':query,category,technology:compact?'All':technology,sort:compact?'recommended':sort,featuredOnly:compact?false:featuredOnly}),
  [compact,category,technology,query,sort,featuredOnly]);
 const selectedProjects=projects.filter(p=>compare.includes(p.slug)).sort((a,b)=>compare.indexOf(a.slug)-compare.indexOf(b.slug));
 const clear=()=>{setCategory('All');setTechnology('All');setQuery('');setSort('recommended');setFeaturedOnly(false)};
 const anyFilter=category!=='All'||technology!=='All'||query.trim()||sort!=='recommended'||featuredOnly;
 const copyShare=async()=>{
  try{await navigator.clipboard.writeText(window.location.href);setCopyStatus('Share link copied');}
  catch{setCopyStatus('Copy the current page URL from your browser address bar');}
 };
 return <>
  {!compact&&<section aria-label="Explore portfolio work" className="surface rounded-3xl p-4 sm:p-6 mb-7">
   <div className="grid gap-4 md:grid-cols-[1fr_190px_180px]">
    <label className="block min-w-0"><span className="block font-semibold text-sm mb-2">Search projects</span>
     <div className="relative"><Search size={18} aria-hidden="true" className="absolute top-1/2 -translate-y-1/2 left-4 text-blue-500"/>
      <input type="search" value={query} onChange={event=>setQuery(event.target.value)} maxLength={80} placeholder="Search name, stack or description…" className="w-full surface rounded-xl py-3 pl-11 pr-4 text-sm" aria-label="Search projects"/></div>
    </label>
    <label className="block"><span className="block font-semibold text-sm mb-2">Technology</span>
     <select value={technology} onChange={event=>setTechnology(event.target.value)} className="surface rounded-xl px-4 py-3 w-full text-sm" aria-label="Filter by technology">{projectTechnologies.map(tech=><option key={tech} value={tech}>{tech==='All'?'All technologies':tech}</option>)}</select>
    </label>
    <label className="block"><span className="block font-semibold text-sm mb-2">Sort projects</span>
     <select value={sort} onChange={event=>setSort(event.target.value as ProjectSort)} className="surface rounded-xl px-4 py-3 w-full text-sm" aria-label="Sort projects"><option value="recommended">Featured first</option><option value="az">Name A–Z</option><option value="za">Name Z–A</option></select>
    </label>
   </div>
   <div className="mt-4 flex flex-wrap justify-between items-center gap-3">
    <label className="inline-flex items-center gap-2 text-sm muted cursor-pointer"><input type="checkbox" checked={featuredOnly} onChange={e=>setFeaturedOnly(e.target.checked)} className="accent-blue-600 w-4 h-4"/> Featured projects only</label>
    <div className="flex items-center gap-3">
     <button type="button" onClick={()=>void copyShare()} className="inline-flex gap-2 items-center text-sm text-blue-500 hover:underline"><Copy size={15}/> Copy filtered link</button>
     {Boolean(anyFilter)&&<button type="button" onClick={clear} className="inline-flex gap-2 items-center text-sm text-blue-500 hover:underline"><RotateCcw size={15}/> Reset filters</button>}
    </div>
   </div>
   {copyStatus&&<p className="muted text-xs mt-3" role="status">{copyStatus}</p>}
  </section>}
  <div className="flex flex-wrap items-center justify-between gap-4 mb-7">
   <div className="flex flex-wrap gap-2" role="group" aria-label="Filter projects by category">{projectCategories.map(cat=><button type="button" key={cat} onClick={()=>setCategory(cat)} aria-pressed={category===cat} className={`px-4 py-2 rounded-full text-sm transition-all ${category===cat?'bg-blue-600 text-white':'surface muted hover:text-blue-500'}`}>{cat}</button>)}</div>
   <span role="status" aria-live="polite" className="text-sm muted" data-testid="project-result-count">{visible.length} of {compact?projects.filter(p=>p.featured).length:projects.length} projects</span>
  </div>
  <div className="grid md:grid-cols-2 gap-6 lg:gap-7">{visible.map((project,index)=><Card project={project} index={index} key={project.slug} compact={compact} shortlisted={compare.includes(project.slug)} full={compare.length<MAX_COMPARISONS} onToggle={()=>setCompare(current=>toggleProjectShortlist(current,project.slug))}/>)}</div>
  {!visible.length&&<div role="status" className="surface rounded-3xl p-8 sm:p-10 text-center"><h3 className="font-display font-bold text-xl">No matching projects</h3><p className="muted mt-2 text-sm">Try another keyword or clear your filters to explore the full portfolio.</p><button type="button" onClick={clear} className="mt-5 bg-blue-600 text-white rounded-full px-6 py-2.5 text-sm font-semibold">Show all projects</button></div>}
  {!compact&&<section aria-label="Project shortlist and comparison" className="mt-12 surface rounded-3xl p-5 sm:p-8">
   <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
    <div><p className="text-xs text-blue-500 tracking-[.17em] font-semibold uppercase">Project shortlist</p><h2 className="font-display font-bold text-2xl mt-2">Compare real work side by side</h2><p className="muted text-sm mt-2">{compare.length} of {MAX_COMPARISONS} projects selected · Saved on this device and in your share link.</p></div>
    <div className="flex flex-wrap gap-2">
     <button type="button" onClick={()=>setCompareOpen(value=>!value)} disabled={!compare.length} className="bg-blue-600 disabled:opacity-50 text-white font-semibold rounded-xl px-5 py-3 inline-flex items-center gap-2 text-sm"><GitCompareArrows size={17}/>{compareOpen?'Hide comparison':'Compare selected'}</button>
     <button type="button" onClick={()=>void copyShare()} className="surface rounded-xl px-4 py-3 text-sm inline-flex gap-2 items-center"><Copy size={16}/> Share shortlist</button>
     {compare.length>0&&<button type="button" onClick={()=>{setCompare([]);setCompareOpen(false)}} className="surface rounded-xl px-4 py-3 text-sm inline-flex gap-2 items-center"><Trash2 size={16}/> Clear</button>}
    </div>
   </div>
   {selectedProjects.length>0?<div className="flex flex-wrap gap-2 mt-5">{selectedProjects.map(p=><span key={p.slug} className="pill inline-flex items-center gap-2 text-xs font-medium">{p.title}<button type="button" aria-label={`Remove ${p.title} from comparison`} onClick={()=>setCompare(current=>toggleProjectShortlist(current,p.slug))} className="text-blue-500 text-lg leading-none">&times;</button></span>)}</div>:<p className="muted text-sm mt-5">Use the Compare button on project cards to add up to three projects.</p>}
   {compareOpen&&selectedProjects.length>0&&<div className="overflow-x-auto mt-6" role="region" aria-label="Side-by-side project comparison" tabIndex={0}>
    <table className="w-full text-left border-separate border-spacing-0 text-sm min-w-[540px]">
     <thead><tr><th scope="col" className="px-3 py-3 muted">Detail</th>{selectedProjects.map(p=><th scope="col" key={p.slug} className="px-3 py-3 font-display text-base">{p.title}</th>)}</tr></thead>
     <tbody>
      <tr><th scope="row" className="px-3 py-3 border-t font-semibold">Category</th>{selectedProjects.map(p=><td key={p.slug} className="px-3 py-3 border-t" style={{borderColor:'var(--border)'}}>{p.category}</td>)}</tr>
      <tr><th scope="row" className="px-3 py-3 border-t font-semibold">Technology</th>{selectedProjects.map(p=><td key={p.slug} className="px-3 py-3 border-t" style={{borderColor:'var(--border)'}}><div className="flex flex-wrap gap-1">{p.stack.map(tech=><span key={tech} className="pill text-xs">{tech}</span>)}</div></td>)}</tr>
      <tr><th scope="row" className="px-3 py-3 border-t font-semibold">Source code</th>{selectedProjects.map(p=><td key={p.slug} className="px-3 py-3 border-t" style={{borderColor:'var(--border)'}}><a href={p.github} target="_blank" rel="noopener noreferrer" className="text-blue-500 inline-flex items-center gap-1">GitHub <ExternalLink size={13}/></a></td>)}</tr>
      <tr><th scope="row" className="px-3 py-3 border-t font-semibold">Details</th>{selectedProjects.map(p=><td key={p.slug} className="px-3 py-3 border-t" style={{borderColor:'var(--border)'}}><Link className="text-blue-500 inline-flex items-center gap-1" href={`/projects/${p.slug}`}>Explore <ArrowUpRight size={13}/></Link></td>)}</tr>
     </tbody>
    </table>
   </div>}
  </section>}
 </>;
}
