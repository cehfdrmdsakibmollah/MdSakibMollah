import {projects} from './site';
import {projectCategories,projectTechnologies,type ProjectFilters,type ProjectSort} from './discovery';

export const MAX_COMPARISONS=3;
export const SHORTLIST_STORAGE_KEY='sakib-portfolio-shortlist-v1';
export const explorerParams=['q','cat','tech','sort','featured','compare'] as const;
export const defaultExplorerFilters:ProjectFilters={
 query:'',category:'All',technology:'All',sort:'recommended',featuredOnly:false
};

const validSlugs=new Set(projects.map(project=>project.slug));
function validChoice(value:string|null,choices:readonly string[],fallback:string):string{
 return value&&choices.includes(value)?value:fallback;
}

/** URLs and local bookmarks cannot introduce unlisted projects or arbitrary markup. */
export function cleanProjectSlugs(values:readonly string[]):string[]{
 return Array.from(new Set(values.filter(value=>validSlugs.has(value)))).slice(0,MAX_COMPARISONS);
}
export function toggleProjectShortlist(selected:readonly string[],slug:string):string[]{
 const current=cleanProjectSlugs(selected);
 if(!validSlugs.has(slug))return current;
 if(current.includes(slug))return current.filter(value=>value!==slug);
 if(current.length>=MAX_COMPARISONS)return current;
 return [...current,slug];
}
export type ExplorerState={filters:ProjectFilters;compare:string[]};
export function parseExplorerState(params:URLSearchParams):ExplorerState{
 const sort=params.get('sort');
 return {
  filters:{
   query:(params.get('q')||'').slice(0,80),
   category:validChoice(params.get('cat'),projectCategories,'All'),
   technology:validChoice(params.get('tech'),projectTechnologies,'All'),
   sort:sort==='az'||sort==='za'?sort:'recommended',
   featuredOnly:params.get('featured')==='1'
  },
  compare:cleanProjectSlugs((params.get('compare')||'').split(','))
 };
}

/** Update only owned URL keys; preserve unrelated query params and fragment. */
export function encodeExplorerState(existing:URLSearchParams,state:ExplorerState):URLSearchParams{
 const params=new URLSearchParams(existing);
 for(const key of explorerParams)params.delete(key);
 const {query,category,technology,sort,featuredOnly}=state.filters;
 if(query.trim())params.set('q',query.trim().slice(0,80));
 if(projectCategories.includes(category)&&category!=='All')params.set('cat',category);
 if(projectTechnologies.includes(technology)&&technology!=='All')params.set('tech',technology);
 if(sort==='az'||sort==='za')params.set('sort',sort);
 if(featuredOnly)params.set('featured','1');
 const compare=cleanProjectSlugs(state.compare);
 if(compare.length)params.set('compare',compare.join(','));
 return params;
}
