// Read-only release drift report. No auth tokens, DB writes or secret values.
// Runs after CI build on pushes to main; warnings do NOT claim the release is live.
const targetSha = /^[a-f0-9]{40}$/i.test(process.env.GITHUB_SHA||'')
  ? process.env.GITHUB_SHA.toLowerCase() : null;

const endpoints=[
  {name:'Vercel frontend', url:'https://mdsakibmollah.vercel.app/api/release'},
  {name:'Render backend', url:'https://sakib-portfolio-api-free.onrender.com/api/v1/health'},
];

function warn(title,message) {
  const safe=String(message).replace(/[\r\n]+/g,' ').replace(/::/g,':');
  console.log(`::warning title=${title}::${safe}`);
}

async function probe({name,url}) {
  let response;
  try {
    response=await fetch(url,{headers:{Accept:'application/json','Cache-Control':'no-cache'},
      cache:'no-store',signal:AbortSignal.timeout(115_000)});
  } catch(err) {
    warn('Deployment check unavailable',`${name} could not be checked: ${err instanceof Error ? err.name : 'network failure'}`);
    return;
  }
  if(response.status===404 && name==='Vercel frontend') {
    warn('Vercel release endpoint not deployed','Production still lacks /api/release. Publish the current main on Vercel to enable exact frontend revision verification.');
    return;
  }
  if(!response.ok) {
    warn('Deployment endpoint not ready',`${name} returned HTTP ${response.status}`);
    return;
  }
  const body=await response.json().catch(()=>null);
  const revision=body?.revision;
  if(!body || !/^[0-9a-f]{40}$/i.test(revision||'')) {
    warn('Revision unavailable',`${name} did not expose a valid revision. Verify platform system Git variables and redeploy.`);
    return;
  }
  const deployed=revision.toLowerCase();
  console.log(`${name}: ${deployed}`);
  if(targetSha && deployed!==targetSha)
    warn('Production revision behind GitHub',`${name} runs ${deployed.slice(0,12)} but the tested main commit is ${targetSha.slice(0,12)}. The deployment has not caught up.`);
  else if(targetSha) console.log(`PASS: ${name} matches tested main commit.`);
}

if(!targetSha) warn('Main revision unavailable','GITHUB_SHA was not supplied; live revisions will still be listed if present.');
await Promise.all(endpoints.map(probe));
console.log('Revision report complete. This does not authenticate Google OAuth or verify Gmail delivery.');
