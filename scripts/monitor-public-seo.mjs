/**
 * Read-only SEO health monitor for the public production website.
 * No Google account access, URL-inspection requests, sign-ins, writes or secrets.
 * Intended for the lightweight scheduled GitHub Actions workflow.
 */
import {appendFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

export const DEFAULT_SITE='https://mdsakibmollah.vercel.app';
export const DEFAULT_BACKEND='https://sakib-portfolio-api-free.onrender.com';
export const VERIFICATION_PATH='/google25491feec6ee656b.html';
export const VERIFICATION_TEXT='google-site-verification: google25491feec6ee656b.html';
export const CORE_PATHS=['/','/services','/projects','/insights','/planner','/contact','/privacy'];

/**
 * A newer main SHA does not always require a backend redeploy.
 * Require the live Render commit to be an ancestor of main with no intervening
 * backend-affecting code/dependency/config changes. This avoids false alerts
 * when only frontend, SEO or documentation files change.
 *
 * GitHub Actions must check out the full Git history (fetch-depth: 0).
 * Never execute shell commands with user-supplied strings.
 */
export function backendSourceCompatible(deployed,main,gitStatus=(args)=>spawnSync('git',args,{stdio:'ignore'}).status){
 if(!/^[a-f0-9]{40}$/i.test(deployed||'')||!/^[a-f0-9]{40}$/i.test(main||''))return false;
 if(deployed.toLowerCase()===main.toLowerCase())return true;
 const dependsOn=['apps/api','package.json','package-lock.json','render.yaml','.node-version','.nvmrc'];
 return gitStatus(['merge-base','--is-ancestor',deployed,main])===0 &&
  gitStatus(['diff','--quiet',deployed,main,'--',...dependsOn])===0;
}

const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const htmlDecode=s=>s.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'");

function extractTagAttribute(markup, tagName, wantedAttribute, attributeName, attributeValue){
 const tags=markup.match(new RegExp(`<${tagName}\\b[^>]*>`,'gi'))||[];
 for(const tag of tags){
  const pairs=new Map();
  for(const match of tag.matchAll(/([a-zA-Z][\w:-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)){
   pairs.set(match[1].toLowerCase(),htmlDecode(match[2]??match[3]??match[4]??''));
  }
  if(pairs.get(attributeName)===attributeValue)return pairs.get(wantedAttribute)||'';
 }
 return '';
}

const canonicalOf=html=>extractTagAttribute(html,'link','href','rel','canonical');
const metaOf=(html,name)=>extractTagAttribute(html,'meta','content','name',name);
const ogOf=(html,name)=>extractTagAttribute(html,'meta','content','property',name);
const titleOf=html=>htmlDecode(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim()||'');

async function download(fetchImpl,url,{attempts=2,timeoutMs=35000}={}){
 let lastError;
 for(let attempt=1;attempt<=attempts;attempt++){
  try{
   const response=await fetchImpl(url,{cache:'no-store',redirect:'follow',headers:{Accept:'text/html,application/xml,text/plain;q=0.9','Cache-Control':'no-cache'},signal:AbortSignal.timeout(timeoutMs)});
   if(response.status>=500)throw new Error(`HTTP ${response.status}`);
   return {status:response.status,body:await response.text()};
  }catch(error){
   lastError=error;
   if(attempt<attempts)await delay(1500*attempt);
  }
 }
 throw lastError;
}

export async function monitorPublicSeo({site=DEFAULT_SITE,backend=DEFAULT_BACKEND,expectedSha='',expectedUrlCount=21,fetchImpl=fetch,timeoutMs=35000,backendRevisionCompatible=backendSourceCompatible}={}){
 const siteUrl=new URL(site);
 if(siteUrl.protocol!=='https:'||siteUrl.pathname!=='/'||siteUrl.search||siteUrl.hash)
  throw new Error('SITE must be a root HTTPS origin');
 const origin=siteUrl.origin;
 const backendUrl=new URL(backend);
 if(backendUrl.protocol!=='https:'||backendUrl.pathname!=='/'||backendUrl.search||backendUrl.hash)
  throw new Error('Backend must be a root HTTPS origin');
 const backendOrigin=backendUrl.origin;
 const checks=[];
 const record=(label,ok,detail='')=>checks.push({label,ok:Boolean(ok),detail:String(detail)});
 async function read(path){return await download(fetchImpl,origin+path,{timeoutMs});}

 let robots='',sitemap='',verification='';
 for(const [name,path] of [['robots.txt','/robots.txt'],['sitemap.xml','/sitemap.xml'],['Google HTML-file verification',VERIFICATION_PATH]]){
  try{
   const res=await read(path);
   record(`${name} returns HTTP 200`,res.status===200,`HTTP ${res.status}`);
   if(res.status===200){
    if(name==='robots.txt')robots=res.body;
    else if(name==='sitemap.xml')sitemap=res.body;
    else verification=res.body;
   }
  }catch(error){record(`${name} reachable`,false,error.message||String(error));}
 }
 record('HTML-file verification exact bytes',verification===VERIFICATION_TEXT,
  verification===VERIFICATION_TEXT?'Exact expected response':'Missing or altered verification text');
 record('robots.txt allows public crawling',/User-agent:\s*\*/i.test(robots)&&!/^Disallow:\s*\/\s*$/mi.test(robots));
 record('robots.txt excludes private dashboard and API',/Disallow:\s*\/dashboard\b/i.test(robots)&&/Disallow:\s*\/api\//i.test(robots));
 record('robots.txt links to canonical sitemap',robots.includes(`Sitemap: ${origin}/sitemap.xml`));

 const locs=[...sitemap.matchAll(/<loc\s*>([\s\S]*?)<\/loc>/gi)].map(x=>htmlDecode(x[1].trim()));
 const urls=[...new Set(locs)];
 record('Sitemap is a well-formed-looking URL list',sitemap.includes('<urlset')&&sitemap.includes('</urlset>')&&locs.length>0);
 record(`Sitemap contains ${expectedUrlCount} distinct URLs`,locs.length===expectedUrlCount&&urls.length===locs.length,`Total ${locs.length}, unique ${urls.length}`);
 record('Sitemap includes all core pages',CORE_PATHS.every(path=>urls.includes(origin+(path==='/'?'':path))));
 record('Sitemap does not list private or external pages',urls.every(url=>{
  try{
   const parsed=new URL(url);
   return parsed.origin===origin && !/^\/(dashboard|api)(\/|$)/.test(parsed.pathname) && !parsed.search && !parsed.hash;
  }catch{return false;}
 }));

 const pages=urls.filter(url=>{
  try{return new URL(url).origin===origin;}catch{return false;}
 });
 // Bounded concurrency: protect the production app and reduce GitHub Action time.
 const seenTitles=new Set();
 for(let i=0;i<pages.length;i+=4){
  const chunk=pages.slice(i,i+4);
  const results=await Promise.all(chunk.map(async url=>{
   const path=new URL(url).pathname;
   try{
    const res=await download(fetchImpl,url,{timeoutMs});
    if(res.status!==200)return {path,ok:false,detail:`HTTP ${res.status}`};
    const html=res.body;
    const title=titleOf(html);
    const canonical=canonicalOf(html);
    const description=metaOf(html,'description');
    const robotsMeta=metaOf(html,'robots');
    const ogImage=ogOf(html,'og:image');
    return {path,ok:canonical===url && Boolean(title&&description&&ogImage)&&!/(^|[,\s])noindex([,\s]|$)/i.test(robotsMeta),
      title,detail:`canonical=${canonical||'missing'} title=${title?'present':'missing'} description=${description?'present':'missing'} og:image=${ogImage?'present':'missing'} robots=${robotsMeta||'default'}`};
   }catch(error){return {path,ok:false,detail:error.message||String(error)};}
  }));
  for(const result of results){
   record(`Public SEO ${result.path}`,result.ok,result.detail);
   if(result.title){
    record(`Unique title ${result.path}`,!seenTitles.has(result.title),result.title);
    seenTitles.add(result.title);
   }
  }
 }

 if(/^[a-f0-9]{40}$/i.test(expectedSha)){
  try{
   const res=await read('/api/release');
   const revision=res.status===200?JSON.parse(res.body).revision:null;
   record('Vercel production release SHA matches main',res.status===200&&revision?.toLowerCase()===expectedSha.toLowerCase(),
    `production=${String(revision||'unavailable').slice(0,12)} main=${expectedSha.slice(0,12)} HTTP=${res.status}`);
  }catch(error){record('Vercel production release SHA reachable',false,error.message||String(error));}
 }else record('Expected GitHub main SHA available',false,'Supply the 40-character EXPECTED_SHA from the scheduled workflow');

 // Render Free instances can need 50+ seconds to wake after inactivity.
 // Health is a public GET endpoint. No customer data, email or DB writes.
 try{
  const response=await download(fetchImpl,backendOrigin+'/api/v1/health',{
   timeoutMs:Math.max(timeoutMs,110_000)
  });
  record('Render backend health HTTP 200',response.status===200,`HTTP ${response.status}`);
  let health;
  try{health=JSON.parse(response.body)}catch{health=null}
  record('Render backend and MongoDB healthy',
   response.status===200&&health?.status==='ok'&&health?.database==='connected',
   `service=${health?.service||'unavailable'} status=${health?.status||'unavailable'} database=${health?.database||'unavailable'}`);
  if(/^[a-f0-9]{40}$/i.test(expectedSha)){
   const revision=health?.revision;
   record('Render backend includes latest API changes',
    response.status===200&&typeof revision==='string'&&
     backendRevisionCompatible(revision,expectedSha),
    `backend=${typeof revision==='string'?revision.slice(0,12):'unavailable'} main=${expectedSha.slice(0,12)}; checks backend-related file history`);
  }
 }catch(error){
  record('Render backend health reachable',false,error instanceof Error?error.message:String(error));
 }

 return {checks,passed:checks.filter(c=>c.ok).length,failed:checks.filter(c=>!c.ok).length,origin};
}

export function markdownSummary(report){
 const lines=['## Public production SEO health','',`Site: ${report.origin}`,'',`**${report.passed} passed, ${report.failed} failed**`,'',
 '| Result | Check | Detail |','|---|---|---|',
 ...report.checks.map(c=>`| ${c.ok?'✅':'❌'} | ${c.label.replaceAll('|','\\|')} | ${c.detail.replaceAll('|','\\|').replace(/[\r\n]+/g,' ').slice(0,180)} |`)];
 return lines.join('\n')+'\n';
}

if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
 try{
  const report=await monitorPublicSeo({expectedSha:process.env.EXPECTED_SHA||''});
  for(const check of report.checks)console.log(`${check.ok?'PASS':'FAIL'} ${check.label}: ${check.detail}`);
  console.log(`SEO_MONITOR_PASS=${report.passed} FAIL=${report.failed}`);
  if(process.env.GITHUB_STEP_SUMMARY)await appendFile(process.env.GITHUB_STEP_SUMMARY,markdownSummary(report));
  if(report.failed)process.exitCode=1;
 }catch(error){console.error('SEO monitor error:',error);process.exitCode=1;}
}
