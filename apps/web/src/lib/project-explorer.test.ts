import {test} from 'node:test';
import assert from 'node:assert/strict';
import {projects} from './site';
import {MAX_COMPARISONS,defaultExplorerFilters,cleanProjectSlugs,toggleProjectShortlist,parseExplorerState,encodeExplorerState} from './project-explorer';

const slugs=projects.map(project=>project.slug);

test('comparison prevents arbitrary slugs, duplicates and more than three projects',()=>{
 const result=cleanProjectSlugs([slugs[0],slugs[0],'../admin',slugs[1],slugs[2],slugs[3]]);
 assert.deepEqual(result,slugs.slice(0,MAX_COMPARISONS));
 assert.deepEqual(toggleProjectShortlist(slugs.slice(0,3),slugs[3]),slugs.slice(0,3));
 assert.deepEqual(toggleProjectShortlist(slugs.slice(0,3),slugs[1]),[slugs[0],slugs[2]]);
 assert.deepEqual(toggleProjectShortlist([], 'fake-project'),[]);
 assert.deepEqual(slugs.map(x=>x),projects.map(x=>x.slug));
});

test('bad or unrecognized filter parameters reset safely',()=>{
 const params=new URLSearchParams('cat=NotReal&tech=Bad&sort=unknown&featured=yes&compare=evil,react-ecommerce-firebase,react-ecommerce-firebase');
 const state=parseExplorerState(params);
 assert.deepEqual(state.filters,defaultExplorerFilters);
 assert.deepEqual(state.compare,['react-ecommerce-firebase']);
});

test('project share URLs round-trip with all filters and preserve unrelated query params',()=>{
 const state={
  filters:{query:'React mobile',category:'Firebase',technology:'React',sort:'az' as const,featuredOnly:true},
  compare:[slugs[0],slugs[1]]
 };
 const original=new URLSearchParams('utm_source=test&ignored=1&q=old&cat=bad');
 const params=encodeExplorerState(original,state);
 assert.equal(params.get('utm_source'),'test');
 assert.equal(params.get('ignored'),'1');
 assert.deepEqual(parseExplorerState(params),state);
 assert.equal(original.get('q'),'old','serializer does not mutate original');
});

test('excess search length and repeated url keys are bounded',()=>{
 const tooLong='x'.repeat(400);
 const parsed=parseExplorerState(new URLSearchParams({q:tooLong,compare:slugs.join(',')}));
 assert.equal(parsed.filters.query.length,80);
 assert.equal(parsed.compare.length,3);
 const empty=encodeExplorerState(new URLSearchParams('q=old&compare=old'),{filters:defaultExplorerFilters,compare:[]});
 assert.equal(empty.toString(),'');
});
