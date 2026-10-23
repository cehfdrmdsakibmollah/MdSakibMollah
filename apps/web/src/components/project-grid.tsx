"use client";
import {useMemo,useState} from 'react';import Link from 'next/link';import {ArrowUpRight,Search,RotateCcw,Code2,ShoppingBag,CloudSun,CheckSquare,Utensils,Fingerprint,Layout,House} from 'lucide-react';import Reveal from './reveal';import {projects,type Project} from '@/lib/site';
import {filterPortfolioProjects,projectCategories,projectTechnologies,type ProjectSort} from '@/lib/discovery';
const icons=[ShoppingBag,CheckSquare,Utensils,CloudSun,Fingerprint,ShoppingBag,Layout,House];
function Card({project,index}:{project:Project;index:number}){const Icon=icons[projects.findIndex(x=>x.slug===project.slug)]||Code2;return <Reveal delay={Math.min(index%3,.2)}><Link href={`/projects/${project.slug}`} className="card-shine group block surface rounded-[27px] p-3 hover:border-blue-500/45 transition-all hover:-translate-y-1 hover:shadow-glow h-full"><div className={`relative h-52 sm:h-56 rounded-[19px] overflow-hidden bg-gradient-to-br ${project.accent} flex items-center justify-center`}><div className="absolute w-48 h-48 border border-white/10 rounded-full scale-125"/><div className="absolute w-64 h-64 border border-white/10 rounded-full scale-125"/><div className="relative grid place-items-center w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/30 shadow-2xl rotate-[-8deg] group-hover:rotate-0 group-hover:scale-110 transition-transform duration-500"><Icon size={47} strokeWidth={1.4} className="text-white"/></div><div className="absolute top-5 left-5 text-white/75 text-xs tracking-widest uppercase">0{index+1} / Project</div><div className="absolute right-5 bottom-5 rounded-full bg-black/25 backdrop-blur-md text-white p-2"><ArrowUpRight size={19}/></div></div><div className="p-4 pb-5"><div className="flex justify-between items-center gap-3"><p className="text-xs tracking-wider uppercase text-blue-500 font-semibold">{project.category}</p><ArrowUpRight size={18} className="muted group-hover:text-blue-500"/></div><h3 className="font-display text-xl sm:text-2xl font-bold mt-3 tracking-tight">{project.title}</h3><p className="muted mt-2 text-sm leading-6 min-h-16">{project.description}</p><div className="flex flex-wrap gap-2 mt-5">{project.stack.slice(0,3).map(s=><span key={s} className="text-[11px] pill">{s}</span>)}</div></div></Link></Reveal>}
export default function ProjectGrid({compact=false}:{compact?:boolean}){
 const [category,setCategory]=useState('All');
 const [technology,setTechnology]=useState('All');
 const [query,setQuery]=useState('');
 const [sort,setSort]=useState<ProjectSort>('recommended');
 const [featuredOnly,setFeaturedOnly]=useState(false);
 const visible=useMemo(()=>filterPortfolioProjects(compact?projects.filter(p=>p.featured):projects,
  {query:compact?'':query,category,technology:compact?'All':technology,sort:compact?'recommended':sort,featuredOnly:compact?false:featuredOnly}),
  [compact,category,technology,query,sort,featuredOnly]);
 const clear=()=>{setCategory('All');setTechnology('All');setQuery('');setSort('recommended');setFeaturedOnly(false)};
 const anyFilter=category!=='All'||technology!=='All'||query.trim()||sort!=='recommended'||featuredOnly;
 return <>
  {!compact&&<section aria-label="Explore portfolio work" className="surface rounded-3xl p-4 sm:p-6 mb-7">
   <div className="grid gap-4 md:grid-cols-[1fr_190px_180px]">
    <label className="block min-w-0"><span className="block font-semibold text-sm mb-2">Search projects</span>
     <div className="relative"><Search size={18} aria-hidden="true" className="absolute top-1/2 -translate-y-1/2 left-4 text-blue-500"/>
      <input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search name, stack or description…" className="w-full surface rounded-xl py-3 pl-11 pr-4 text-sm" aria-label="Search projects"/></div>
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
    {Boolean(anyFilter)&&<button type="button" onClick={clear} className="inline-flex gap-2 items-center text-sm text-blue-500 hover:underline"><RotateCcw size={15}/> Reset filters</button>}
   </div>
  </section>}
  <div className="flex flex-wrap items-center justify-between gap-4 mb-7">
   <div className="flex flex-wrap gap-2" role="group" aria-label="Filter projects by category">{projectCategories.map(cat=><button type="button" key={cat} onClick={()=>setCategory(cat)} aria-pressed={category===cat} className={`px-4 py-2 rounded-full text-sm transition-all ${category===cat?'bg-blue-600 text-white':'surface muted hover:text-blue-500'}`}>{cat}</button>)}</div>
   <span role="status" aria-live="polite" className="text-sm muted" data-testid="project-result-count">{visible.length} of {compact?projects.filter(p=>p.featured).length:projects.length} projects</span>
  </div>
  <div className="grid md:grid-cols-2 gap-6 lg:gap-7">{visible.map((project,index)=><Card project={project} index={index} key={project.slug}/>)}</div>
  {!visible.length&&<div role="status" className="surface rounded-3xl p-8 sm:p-10 text-center"><h3 className="font-display font-bold text-xl">No matching projects</h3><p className="muted mt-2 text-sm">Try another keyword or clear your filters to explore the full portfolio.</p><button type="button" onClick={clear} className="mt-5 bg-blue-600 text-white rounded-full px-6 py-2.5 text-sm font-semibold">Show all projects</button></div>}
 </>;
}
