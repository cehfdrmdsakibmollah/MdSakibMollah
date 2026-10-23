import {test} from 'node:test';
import assert from 'node:assert/strict';
import {projects,services,articles,site} from './site';
import {
 publicUrl,personId,websiteId,personJsonLd,websiteJsonLd,
 breadcrumbJsonLd,projectJsonLd,serviceJsonLd,articleJsonLd,safeJsonLd
} from './seo';

test('canonical public SEO URLs are root-relative and cannot escape the site',()=>{
 const root=publicUrl('/');
 assert.equal(root,new URL('/',site.url).href);
 assert.equal(publicUrl('/services'),new URL('/services',site.url).href);
 for(const invalid of ['https://other.invalid','//other.invalid','/services?utm_source=spam','/post#fragment','relative/path','/../external\\path']){
  assert.throws(()=>publicUrl(invalid));
 }
});

test('WebSite and Person schemas match real public portfolio identity and URLs',()=>{
 const person=personJsonLd();
 const website=websiteJsonLd();
 assert.equal(person['@type'],'Person');
 assert.equal(person['@id'],personId());
 assert.equal(website['@id'],websiteId());
 assert.deepEqual(website.publisher,{'@id':personId()});
 assert.ok(person.sameAs.includes(site.github));
 assert.equal(website.url,publicUrl('/'));
});

test('all public projects, services and articles expose accurate structured data',()=>{
 for(const project of projects){
  const json=projectJsonLd(project);
  assert.equal(json['@type'],'SoftwareSourceCode');
  assert.equal(json.codeRepository,project.github);
  assert.equal(json.url,publicUrl('/projects/'+project.slug));
  assert.equal(json.creator['@id'],personId());
 }
 for(const service of services){
  const json=serviceJsonLd(service);
  assert.equal(json['@type'],'Service');
  assert.equal(json.description,service.details);
  assert.equal(json.url,publicUrl('/services/'+service.slug));
 }
 for(const article of articles){
  const json=articleJsonLd(article);
  assert.equal(json['@type'],'BlogPosting');
  assert.equal(json.headline,article.title);
  assert.equal(json.datePublished,article.date+'T00:00:00Z');
  assert.equal(json.mainEntityOfPage,publicUrl('/insights/'+article.slug));
 }
});

test('breadcrumbs use real canonical URLs in hierarchy order',()=>{
 const trails=[
  [{name:'Home',path:'/'},{name:'Services',path:'/services'}],
  [{name:'Home',path:'/'},{name:'Projects',path:'/projects'},{name:projects[0].title,path:'/projects/'+projects[0].slug}]
 ];
 for(const trail of trails){
  const json=breadcrumbJsonLd(trail);
  assert.equal(json.itemListElement.length,trail.length);
  json.itemListElement.forEach((entry,index)=>{
   assert.equal(entry.position,index+1);
   assert.equal(entry.name,trail[index].name);
   assert.equal(entry.item,publicUrl(trail[index].path));
  });
 }
 assert.throws(()=>breadcrumbJsonLd([{name:'Home',path:'/'}]));
});

test('JSON-LD output cannot break out into inline HTML or script tags',()=>{
 const json=safeJsonLd({name:'</script><script>alert(1)</script>',markup:'<div>'});
 assert.ok(!json.includes('<script>'));
 assert.ok(!json.includes('</script>'));
 assert.deepEqual(JSON.parse(json),{name:'</script><script>alert(1)</script>',markup:'<div>'});
});
