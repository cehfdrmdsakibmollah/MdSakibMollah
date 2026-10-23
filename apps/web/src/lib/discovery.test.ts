import {test} from 'node:test';
import assert from 'node:assert/strict';
import {projects} from './site';
import {normalizeSearch,searchDiscovery,filterPortfolioProjects,projectCategories,projectTechnologies} from './discovery';

test('search normalizes case, spaces and accents',()=>{
 assert.equal(normalizeSearch('  CAFÉ   React  '),'cafe react');
 assert.ok(searchDiscovery('  FIREBASE   TODO  ').some(item=>item.href==='/projects/firebase-todo'));
});

test('discovery only exposes real portfolio routes and does not invent projects',()=>{
 const all=[...searchDiscovery('React',30),...searchDiscovery('contact',30)];
 assert.ok(all.length>0);
 for(const item of all){
  assert.ok(item.href.startsWith('/')&&!item.href.startsWith('//'));
  if(item.type==='Project')assert.ok(projects.some(p=>item.href===`/projects/${p.slug}`));
 }
 assert.equal(searchDiscovery('secret-personal-password-value').length,0);
 assert.equal(searchDiscovery('react',0).length,0);
});

test('project filtering intersects technologies, categories and search terms',()=>{
 const result=filterPortfolioProjects(projects,{query:'shopping',category:'Full Stack',technology:'React',sort:'recommended',featuredOnly:false});
 assert.equal(result.length,1);
 assert.equal(result[0].slug,'react-ecommerce-firebase');
 const noMatches=filterPortfolioProjects(projects,{query:'impossibleterm',category:'All',technology:'All',sort:'recommended',featuredOnly:false});
 assert.deepEqual(noMatches,[]);
 assert.ok(projectCategories.includes('Firebase'));
 assert.ok(projectTechnologies.includes('Tailwind CSS'));
});

test('featured flag, sorting and defaults are deterministic and do not mutate original array',()=>{
 const original=projects.map(p=>p.slug);
 const opts={query:'',category:'All',technology:'All',featuredOnly:false} as const;
 const asc=filterPortfolioProjects(projects,{...opts,sort:'az'});
 assert.deepEqual(asc.map(p=>p.title),[...asc].map(p=>p.title).sort());
 const desc=filterPortfolioProjects(projects,{...opts,sort:'za'});
 assert.deepEqual(desc.map(p=>p.title),[...asc].reverse().map(p=>p.title));
 assert.equal(filterPortfolioProjects(projects,{...opts,sort:'recommended',featuredOnly:true}).every(p=>p.featured),true);
 assert.deepEqual(projects.map(p=>p.slug),original);
});
