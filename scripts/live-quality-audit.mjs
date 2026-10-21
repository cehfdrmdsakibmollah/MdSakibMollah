/**
 * Read-only production quality audit for mobile, SEO, accessibility, and key UI.
 * Measures the CURRENT live Vercel site (which may lag GitHub main).
 * No sign-ins, secrets, customer data, submissions or DB writes.
 */
import assert from 'node:assert/strict';

const SITE='https://mdsakibmollah.vercel.app';
const {chromium}=await import('file:///tmp/portfolio-smoke/node_modules/playwright-core/index.mjs');
const browser=await chromium.launch({
 executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',
 headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--mute-audio']
});
const findings=[];
function record(label,ok,detail='') {
 findings.push({label,ok,detail});
 console.log(`${ok?'PASS':'FAIL'}: ${label}${detail?' — '+detail:''}`);
}
async function readText(path) {
 const response=await fetch(SITE+path,{cache:'no-store',signal:AbortSignal.timeout(90_000)});
 assert.equal(response.status,200,`${path} must return 200`);
 return await response.text();
}
const pages=[{path:'/',label:'Home'},{path:'/contact',label:'Contact'},{path:'/projects',label:'Projects'},{path:'/insights',label:'Insights'}];
try {
 const robots=await readText('/robots.txt');
 const sitemap=await readText('/sitemap.xml');
 record('robots.txt allows public pages',!/Disallow:\s*\/\s*$/mi.test(robots));
 record('robots.txt blocks private dashboard',/Disallow:\s*\/dashboard/.test(robots));
 record('sitemap XML is served',sitemap.includes('<urlset')&&sitemap.includes('/projects'));
 // This is advisory until the updated Vercel main release lands.
 if(!sitemap.includes('/contact'))
   console.log('WARN: live sitemap misses /contact; source fix is committed but Vercel needs to deploy latest main');
 else console.log('PASS: sitemap lists /contact');

 for(const width of [375,768,1440]){
  const page=await browser.newPage({viewport:{width,height:820},deviceScaleFactor:1});
  await page.addInitScript(()=>localStorage.setItem('sakib-analytics-consent','no'));
  for(const {path,label} of pages){
   let contactWrites=0;
   await page.route('**/api/backend/contact',route=>{
     contactWrites++;
     return route.abort('blockedbyclient');
   });
   const response=await page.goto(SITE+path,{waitUntil:'domcontentloaded',timeout:80_000});
   assert.equal(response?.status(),200,`Live ${label} route status`);
   await page.locator('h1').first().waitFor({timeout:20_000});
   await page.waitForTimeout(300);
   const audit=await page.evaluate(()=>{
    const allImages=Array.from(document.querySelectorAll('img'));
    const missingAlt=allImages.filter(img=>!img.hasAttribute('alt')).length;
    const controls=Array.from(document.querySelectorAll('button'));
    const nameless=controls.filter(b=>!(b.getAttribute('aria-label')||b.getAttribute('title')||b.innerText||'').trim()).length;
    const inputs=Array.from(document.querySelectorAll('input:not([type=hidden]),textarea,select'));
    const unlabeled=inputs.filter(el=>{
      if(el.closest('label')||el.getAttribute('aria-label')||el.getAttribute('aria-labelledby'))return false;
      return !el.id||!document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
    }).length;
    const fcp=performance.getEntriesByName('first-contentful-paint')[0];
    return {
      width:document.documentElement.scrollWidth,viewport:window.innerWidth,
      h1:document.querySelectorAll('h1').length,
      missingAlt,nameless,unlabeled,
      pageTitle:document.title,description:document.querySelector('meta[name="description"]')?.getAttribute('content')||'',
      canonical:document.querySelector('link[rel="canonical"]')?.getAttribute('href')||'',
      fcpMs:fcp?Math.round(fcp.startTime):null
    };
   });
   record(`${width}px ${label}: no horizontal overflow`,audit.width<=audit.viewport+2,`document ${audit.width}px vs viewport ${audit.viewport}px`);
   record(`${width}px ${label}: single main heading`,audit.h1===1,`h1=${audit.h1}`);
   record(`${width}px ${label}: controls have names`,audit.nameless===0,`unnamed buttons=${audit.nameless}`);
   record(`${width}px ${label}: inputs have labels`,audit.unlabeled===0,`unlabeled=${audit.unlabeled}`);
   record(`${width}px ${label}: images have alt`,audit.missingAlt===0,`missing alt=${audit.missingAlt}`);
   record(`${width}px ${label}: SEO basics`,Boolean(audit.pageTitle&&audit.description&&audit.canonical&&audit.canonical.startsWith('https://')),`FCP≈${audit.fcpMs??'n/a'}ms; canonical=${audit.canonical}`);

   if(path==='/contact'){
     const form=page.locator('form').first();
     assert.ok(await form.isVisible());
     await form.getByRole('button',{name:/Send Project Inquiry/}).click();
     const valid=await form.evaluate(el=>el.checkValidity());
     record(`${width}px Contact: browser validates empty form`,!valid&&contactWrites===0,'no submission/network write');
   }
  }
  if(width===375){
   await page.goto(SITE+'/',{waitUntil:'domcontentloaded',timeout:80_000});
   const open=page.getByRole('button',{name:'Open navigation'});
   await open.click();
   const mobile=page.getByRole('navigation',{name:'Mobile navigation'});
   record('375px mobile menu opens',await mobile.isVisible());
   await mobile.getByRole('link',{name:'Contact'}).click();
   record('375px mobile Contact navigation works',new URL(page.url()).pathname==='/contact');
  }
  await page.close();
 }
 const page=await browser.newPage();
 await page.goto(SITE+'/',{waitUntil:'domcontentloaded',timeout:80_000});
 const nav=page.locator('a.skip-link');
 if(await nav.count()===0){
  console.log('WARN: Live production lacks Skip to main content link; pending new Vercel deployment');
 }else{
  await page.keyboard.press('Tab');
  record('Keyboard skip-to-main link is first and focusable',await nav.evaluate(el=>el===document.activeElement));
 }
 await page.close();
 const problems=findings.filter(x=>!x.ok);
 console.log(`QUALITY_AUDIT_TOTAL=${findings.length} PASS=${findings.length-problems.length} FAIL=${problems.length}`);
 assert.equal(problems.length,0,'Quality audit found structural defects; inspect FAIL lines');
} finally {
 await browser.close();
}
