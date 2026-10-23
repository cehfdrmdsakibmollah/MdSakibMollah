import type {Metadata} from 'next';
import Link from 'next/link';
import {ArrowUpRight,Code2,Smartphone,Sparkles} from 'lucide-react';
import {services} from '@/lib/site';
import Breadcrumbs from '@/components/breadcrumbs';

export const metadata:Metadata={
 title:'Web Development, Mobile Apps & AI Integration Services',
 description:'Explore web development with React and Next.js, cross-platform mobile applications and practical AI automation services by MD Sakib Mollah.',
 alternates:{canonical:'/services'},
 openGraph:{type:'website',url:'/services',title:'Web, Mobile & AI Development Services | MD Sakib Mollah',description:'Review web, mobile and AI development capabilities, technology and real public projects.'},
 twitter:{card:'summary_large_image',title:'Software Development Services | MD Sakib Mollah',description:'Explore web, mobile and AI integration capabilities.'}
};
const icons=[Code2,Smartphone,Sparkles];
export default function Services(){
 return <div className="min-h-screen pt-36 pb-24 orbit-bg"><div className="max-w-6xl mx-auto px-6">
  <Breadcrumbs items={[{name:'Home',path:'/'},{name:'Development services',path:'/services'}]}/>
  <p className="text-blue-500 text-xs tracking-[.24em] uppercase font-semibold mt-12">Development / Capabilities</p>
  <h1 className="font-display text-4xl md:text-6xl font-bold mt-5">Web, Mobile & AI Development Services</h1>
  <p className="muted max-w-3xl text-lg leading-8 mt-7">Explore software development capabilities and the technologies behind the public work. Every project begins with a discussion of goals, feasibility and technical requirements.</p>
  <div className="grid lg:grid-cols-3 gap-6 mt-12">{services.map((service,i)=>{
   const Icon=icons[i];
   return <article key={service.slug} className="surface rounded-3xl p-7 flex flex-col">
    <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500"><Icon size={24}/></div>
    <h2 className="font-display text-2xl font-bold mt-7"><Link className="hover:text-blue-500" href={`/services/${service.slug}`}>{service.title}</Link></h2>
    <p className="muted leading-7 mt-4 text-sm">{service.details}</p>
    <ul className="flex flex-wrap gap-2 mt-6">{service.tags.map(tag=><li key={tag} className="pill text-xs">{tag}</li>)}</ul>
    <Link className="mt-auto pt-9 inline-flex items-center gap-2 text-blue-500 font-semibold" href={`/services/${service.slug}`}>Explore {service.title} <ArrowUpRight size={16}/></Link>
   </article>
  })}</div>
  <section className="surface p-7 md:p-10 rounded-3xl mt-14"><h2 className="font-display font-bold text-3xl">Review work before starting</h2><p className="muted mt-4 leading-7">Visit public code repositories to see examples of interface development and Firebase integrations. These are demonstrative portfolio projects, not claims of completed client engagements.</p><div className="flex flex-wrap gap-4 mt-6"><Link href="/projects" className="font-semibold text-blue-500 hover:underline">Browse open-source projects</Link><Link href="/planner" className="font-semibold text-blue-500 hover:underline">Prepare a project brief</Link><Link href="/contact" className="font-semibold text-blue-500 hover:underline">Ask a question</Link></div></section>
 </div></div>
}
