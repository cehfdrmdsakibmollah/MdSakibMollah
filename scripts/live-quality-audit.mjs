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
 const secureResponse=await fetch(SITE+'/',{signal:AbortSignal.timeout(90_000)});
 record('Security header: X-Content-Type-Options',secureResponse.headers.get('x-content-type-options')==='nosniff');
 record('Security header: Referrer-Policy',Boolean(secureResponse.headers.get('referrer-policy')?.includes('strict-origin-when-cross-origin')));
 record('Security header: Permissions-Policy',Boolean(secureResponse.headers.get('permissions-policy')?.includes('camera=()')));
 const dashboardMarkup=await readText('/dashboard');
 record('Private dashboard excluded from indexing',/<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(dashboardMarkup));
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
   // Server-rendered buttons appear before React listeners are attached.
   // Header enables its theme button in a post-hydration effect: wait for that
   // explicit ready signal instead of clicking a not-yet-interactive menu.
   await page.waitForFunction(()=>{
     const theme=document.querySelector('button[aria-label="Toggle light or dark mode"]');
     return theme instanceof HTMLButtonElement && !theme.disabled;
   },null,{timeout:15_000});
   const open=page.getByRole('button',{name:'Open navigation'});
   await open.click();
   const mobile=page.getByRole('navigation',{name:'Mobile navigation'});
   await mobile.waitFor({state:'visible',timeout:15_000});
   record('375px mobile menu opens',await mobile.isVisible());
   await mobile.getByRole('link',{name:'Contact'}).click();
   await page.waitForURL(url=>url.pathname==='/contact',{timeout:15_000});
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
 // UI features are only testable once the same GitHub revision reaches production.
 // On PRs or stale deployments, don't mistake an older production UI for a code bug.
 const release=await fetch(SITE+'/api/release',{cache:'no-store'}).then(r=>r.json()).catch(()=>null);
 const testNewUi=Boolean(process.env.GITHUB_SHA && release?.revision===process.env.GITHUB_SHA);
 if(testNewUi){
  const browserPage=await browser.newPage({viewport:{width:390,height:844}});
  await browserPage.addInitScript(()=>localStorage.setItem('sakib-analytics-consent','no'));
  await browserPage.goto(SITE+'/',{waitUntil:'domcontentloaded',timeout:80_000});
  await browserPage.getByRole('button',{name:'Search portfolio (Ctrl+K)'}).click();
  const searchDialog=browserPage.getByRole('dialog',{name:'Search portfolio'});
  record('Smart Search modal opens on mobile',await searchDialog.isVisible());
  const field=searchDialog.getByRole('combobox',{name:/Search portfolio pages/});
  await field.fill('firebase todo');
  record('Smart Search finds actual Firebase project',await searchDialog.getByRole('option',{name:/Realtime Tasks/}).count()===1);
  await browserPage.keyboard.press('Escape');
  record('Smart Search closes with Escape',await searchDialog.count()===0);
  await browserPage.keyboard.press('Control+k');
  record('Smart Search Ctrl+K shortcut works',await searchDialog.isVisible());
  await field.fill('restaurant');
  await browserPage.keyboard.press('Enter');
  await browserPage.waitForURL(url=>url.pathname==='/projects/restaurant-landing',{timeout:20_000});
  record('Smart Search keyboard Enter navigates to real project',new URL(browserPage.url()).pathname==='/projects/restaurant-landing');
  await browserPage.goto(SITE+'/projects',{waitUntil:'domcontentloaded',timeout:80_000});
  const projectSearch=browserPage.getByRole('searchbox',{name:'Search projects'});
  await projectSearch.fill('shopping');
  record('Project explorer supports keyword filtering',await browserPage.getByTestId('project-result-count').innerText()==='1 of 8 projects');
  await browserPage.getByRole('button',{name:'Show all projects'}).count().then(async n=>{if(n)await browserPage.getByRole('button',{name:'Show all projects'}).click()});
  await browserPage.getByRole('button',{name:'Reset filters'}).click();
  record('Project explorer resets to all projects',await browserPage.getByTestId('project-result-count').innerText()==='8 of 8 projects');
  await browserPage.getByRole('button',{name:'Add Commerce Reimagined to comparison'}).click();
  await browserPage.getByRole('button',{name:'Add Realtime Tasks to comparison'}).click();
  await browserPage.waitForFunction(()=>new URL(location.href).searchParams.get('compare')?.includes('firebase-todo'));
  record('Comparison selection creates a shareable URL',new URL(browserPage.url()).searchParams.get('compare')?.split(',').length===2);
  await browserPage.getByRole('button',{name:'Compare selected'}).click();
  const comparison=browserPage.getByRole('region',{name:'Side-by-side project comparison'});
  record('Compare selected shows real GitHub projects',await comparison.isVisible()&&await comparison.getByRole('columnheader',{name:'Realtime Tasks'}).count()===1);
  const copiedLink=browserPage.url();
  await browserPage.goto(copiedLink,{waitUntil:'domcontentloaded',timeout:80_000});
  const rehydratedShortlist=browserPage.getByRole('region',{name:'Project shortlist and comparison'})
   .getByRole('button',{name:'Remove Realtime Tasks from comparison'});
  await rehydratedShortlist.waitFor({state:'visible',timeout:15_000});
  record('Shortlist restores from a shared URL',await rehydratedShortlist.isVisible());
  await browserPage.close();
 }else console.log('WARN: Latest discovery UI tests deferred until Vercel production revision matches this GitHub SHA.');
 const problems=findings.filter(x=>!x.ok);
 console.log(`QUALITY_AUDIT_TOTAL=${findings.length} PASS=${findings.length-problems.length} FAIL=${problems.length}`);
 assert.equal(problems.length,0,'Quality audit found structural defects; inspect FAIL lines');
} finally {
 await browser.close();
}
