import test from 'node:test';
import assert from 'node:assert/strict';
import {monitorPublicSeo,markdownSummary,DEFAULT_SITE,VERIFICATION_PATH,VERIFICATION_TEXT,CORE_PATHS} from './monitor-public-seo.mjs';

const SHA='6b8881f07b35745e791339f8f4ed362513f8ce69';
function fixture(overrides={}){
 const sitemap=`<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${CORE_PATHS.map(path=>`<url><loc>${DEFAULT_SITE}${path==='/'?'':path}</loc></url>`).join('')}</urlset>`;
 const robots=`User-agent: *\nAllow: /\nDisallow: /dashboard\nDisallow: /dashboard/\nDisallow: /api/\nSitemap: ${DEFAULT_SITE}/sitemap.xml\n`;
 const pages=Object.fromEntries(CORE_PATHS.map((p,i)=>[p,`<!doctype html><html><head><title>Page ${i}</title><meta name="description" content="Useful detailed page description"><meta property="og:image" content="${DEFAULT_SITE}/og-image.jpg"><link rel="canonical" href="${DEFAULT_SITE}${p==='/'?'':p}"></head><body><h1>Page ${i}</h1></body></html>`]));
 const map={...pages,'/robots.txt':robots,'/sitemap.xml':sitemap,[VERIFICATION_PATH]:VERIFICATION_TEXT,'/api/release':JSON.stringify({revision:SHA}),...overrides};
 const calls=[];
 const fetchImpl=async(url,options)=>{
  calls.push({url,options});
  const path=new URL(url).pathname;
  if(!Object.hasOwn(map,path))return {status:404,text:async()=>''};
  const value=map[path];
  return {status:200,text:async()=>value};
 };
 return {fetchImpl,calls};
}

const opts={site:DEFAULT_SITE,expectedSha:SHA,expectedUrlCount:CORE_PATHS.length,timeoutMs:1000};

test('valid public SEO passes and monitor makes only read-only public GET requests',async()=>{
 const mock=fixture();
 const result=await monitorPublicSeo({...opts,fetchImpl:mock.fetchImpl});
 assert.equal(result.failed,0,JSON.stringify(result.checks.filter(c=>!c.ok)));
 assert.ok(result.passed>=19);
 assert.ok(mock.calls.every(c=>c.options.method===undefined&&c.url.startsWith(DEFAULT_SITE)));
 assert.match(markdownSummary(result),/0 failed/);
});

test('detects exact HTML verification payload drift rather than trimming',async()=>{
 const mock=fixture({[VERIFICATION_PATH]:VERIFICATION_TEXT+'\n'});
 const result=await monitorPublicSeo({...opts,fetchImpl:mock.fetchImpl});
 assert.ok(result.checks.some(c=>c.label==='HTML-file verification exact bytes'&&!c.ok));
});

test('detects noindex, canonical drift and release SHA mismatch',async()=>{
 const mock=fixture({
  '/services':`<title>Services</title><meta name="description" content="Service details"><meta property="og:image" content="${DEFAULT_SITE}/og-image.jpg"><meta name="robots" content="noindex, nofollow"><link rel="canonical" href="https://other.example/services">`,
  '/api/release':JSON.stringify({revision:'1'.repeat(40)})
 });
 const result=await monitorPublicSeo({...opts,fetchImpl:mock.fetchImpl});
 assert.ok(result.checks.some(c=>c.label==='Public SEO /services'&&!c.ok));
 assert.ok(result.checks.some(c=>c.label==='Vercel production release SHA matches main'&&!c.ok));
});

test('detects missing sitemap URLs, private URLs and robots mistakes',async()=>{
 const mock=fixture({
  '/robots.txt':'User-agent: *\nDisallow: /\n',
  '/sitemap.xml':`<urlset><url><loc>${DEFAULT_SITE}/dashboard</loc></url></urlset>`
 });
 const result=await monitorPublicSeo({...opts,fetchImpl:mock.fetchImpl});
 assert.ok(result.checks.some(c=>c.label==='robots.txt allows public crawling'&&!c.ok));
 assert.ok(result.checks.some(c=>c.label==='Sitemap includes all core pages'&&!c.ok));
 assert.ok(result.checks.some(c=>c.label==='Sitemap does not list private or external pages'&&!c.ok));
});
