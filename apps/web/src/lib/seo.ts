import {site,type Project} from './site';

export type BreadcrumbItem={name:string;path:string};
type ServiceEntry={slug:string;title:string;details:string};
type ArticleEntry={slug:string;title:string;summary:string;date:string};

/** Every indexed public URL has one canonical HTTPS origin and no query string. */
export function publicUrl(path:string):string{
 if(!path.startsWith('/')||path.startsWith('//')||path.includes('\\')||/[?#]/.test(path))
  throw new Error('SEO URL must be a clean root-relative pathname');
 const base=new URL(site.url);
 const url=new URL(path,base.origin);
 if(url.origin!==base.origin)throw new Error('SEO URL must be same-origin');
 return url.href.replace(/\/$/,'')+(path==='/'?'/':'');
}
export const personId=()=>publicUrl('/')+'#person';
export const websiteId=()=>publicUrl('/')+'#website';

export function websiteJsonLd(){
 return {'@context':'https://schema.org','@type':'WebSite',
  '@id':websiteId(),url:publicUrl('/'),name:site.name,
  alternateName:'Sakib Mollah Developer Portfolio',description:site.description,inLanguage:'en',
  publisher:{'@id':personId()}};
}
export function personJsonLd(){
 return {'@context':'https://schema.org','@type':'Person',
  '@id':personId(),name:site.name,jobTitle:site.role,
  description:'Developer building React web applications, Firebase projects and responsive user interfaces.',
  url:publicUrl('/'),image:publicUrl('/images/sakib-client-photo.webp'),
  sameAs:[site.github,site.linkedin],
  knowsAbout:['React','Next.js','Firebase','Node.js','MongoDB','Responsive Web Development']};
}
export function breadcrumbJsonLd(items:readonly BreadcrumbItem[]){
 if(items.length<2)throw new Error('At least two breadcrumbs required');
 return {'@context':'https://schema.org','@type':'BreadcrumbList',
  itemListElement:items.map((crumb,index)=>({
   '@type':'ListItem',position:index+1,name:crumb.name,item:publicUrl(crumb.path)
  }))};
}
export function projectJsonLd(p:Project){
 return {'@context':'https://schema.org','@type':'SoftwareSourceCode',
  name:p.title,description:p.description,url:publicUrl('/projects/'+p.slug),
  codeRepository:p.github,creator:{'@id':personId()},
  keywords:p.stack.join(', '),isPartOf:{'@id':websiteId()}};
}
export function serviceJsonLd(s:ServiceEntry){
 return {'@context':'https://schema.org','@type':'Service',
  name:s.title,serviceType:s.title,description:s.details,url:publicUrl('/services/'+s.slug),
  provider:{'@id':personId()}};
}
export function articleJsonLd(a:ArticleEntry){
 return {'@context':'https://schema.org','@type':'BlogPosting',
  headline:a.title,description:a.summary,datePublished:a.date+'T00:00:00Z',
  mainEntityOfPage:publicUrl('/insights/'+a.slug),
  url:publicUrl('/insights/'+a.slug),author:{'@id':personId()},
  publisher:{'@id':personId()},isPartOf:{'@id':websiteId()},
  inLanguage:'en'};
}
/** Escaping < prevents </script> breaking out of an inline JSON-LD script. */
export function safeJsonLd(value:unknown):string{
 return JSON.stringify(value).replace(/</g,'\\u003c');
}
