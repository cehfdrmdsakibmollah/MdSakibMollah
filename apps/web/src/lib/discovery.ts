import {articles,projects,services,type Project} from './site';

export type DiscoveryItem={
 id:string;
 type:'Page'|'Project'|'Service'|'Article';
 title:string;
 description:string;
 href:string;
 keywords:string[];
};

const pages:DiscoveryItem[]=[
 {id:'page-home',type:'Page',title:'Home',description:'Meet MD Sakib Mollah and explore the portfolio',href:'/',keywords:['developer','about','portfolio']},
 {id:'page-work',type:'Page',title:'All projects',description:'Browse real GitHub repositories and case studies',href:'/projects',keywords:['work','github','code']},
 {id:'page-contact',type:'Page',title:'Contact & project inquiry',description:'Discuss a project or ask a question',href:'/contact',keywords:['hire','email','whatsapp','inquiry']},
 {id:'page-insights',type:'Page',title:'Developer insights',description:'Technical writing and learning notes',href:'/insights',keywords:['articles','blog','writing']},
 {id:'page-dashboard',type:'Page',title:'Client dashboard',description:'Sign in to read private messages and replies',href:'/dashboard',keywords:['messages','login','account','inbox']},
 {id:'page-privacy',type:'Page',title:'Privacy & data use',description:'See how your information is handled',href:'/privacy',keywords:['data','security','policy']},
];

export const discoveryItems:DiscoveryItem[]=[
 ...pages,
 ...projects.map(p=>({id:`project-${p.slug}`,type:'Project' as const,title:p.title,description:p.description,href:`/projects/${p.slug}`,keywords:[p.slug,p.category,...p.stack]})),
 ...services.map(s=>({id:`service-${s.slug}`,type:'Service' as const,title:s.title,description:s.short,href:`/services/${s.slug}`,keywords:s.tags})),
 ...articles.map(a=>({id:`article-${a.slug}`,type:'Article' as const,title:a.title,description:a.summary,href:`/insights/${a.slug}`,keywords:['insights','article','blog']}))
];

export function normalizeSearch(value:string):string {
 return value.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').trim().toLocaleLowerCase('en-US').replace(/[-_]+/g,' ').replace(/\s+/g,' ');
}

export function searchDiscovery(query:string,limit=9):DiscoveryItem[] {
 const q=normalizeSearch(query);
 if(!q)return pages.slice(0,Math.max(0,limit));
 const terms=q.split(' ');
 return discoveryItems.map(item=>{
  const title=normalizeSearch(item.title);
  const haystack=normalizeSearch([item.title,item.description,...item.keywords].join(' '));
  if(!terms.every(t=>haystack.includes(t)))return {item,score:-1};
  const score=(title===q?10:0)+(title.startsWith(q)?5:0)+(terms.filter(t=>title.includes(t)).length*2)+(item.type==='Project'?1:0);
  return {item,score};
 }).filter(x=>x.score>=0).sort((a,b)=>b.score-a.score||a.item.title.localeCompare(b.item.title)).slice(0,Math.max(0,limit)).map(x=>x.item);
}

export type ProjectSort='recommended'|'az'|'za';
export type ProjectFilters={query:string;category:string;technology:string;sort:ProjectSort;featuredOnly:boolean};
export function filterPortfolioProjects(items:readonly Project[],settings:ProjectFilters):Project[] {
 const query=normalizeSearch(settings.query);
 const terms=query?query.split(' '):[];
 return items.filter(p=>
  (settings.category==='All'||p.category===settings.category)
  &&(settings.technology==='All'||p.stack.some(t=>normalizeSearch(t)===normalizeSearch(settings.technology)))
  &&(!settings.featuredOnly||Boolean(p.featured))
  &&terms.every(term=>normalizeSearch([p.title,p.description,p.category,...p.stack].join(' ')).includes(term))
 ).sort((a,b)=>settings.sort==='az'?a.title.localeCompare(b.title)
  :settings.sort==='za'?b.title.localeCompare(a.title)
  :Number(Boolean(b.featured))-Number(Boolean(a.featured))||items.indexOf(a)-items.indexOf(b));
}

export const projectCategories=['All',...new Set(projects.map(x=>x.category))];
export const projectTechnologies=['All',...new Set(projects.flatMap(x=>x.stack))].sort((a,b)=>a.localeCompare(b));
