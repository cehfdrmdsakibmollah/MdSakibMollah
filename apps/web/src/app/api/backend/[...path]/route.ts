import {NextRequest,NextResponse} from 'next/server';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const configured = process.env.API_INTERNAL_URL?.trim();
const internal = (configured || (process.env.NODE_ENV !== 'production' ? 'http://127.0.0.1:4000/api/v1' : '')).replace(/\/$/,'');
function validBackend(): boolean {
 if (!internal) return false;
 try {
  const url = new URL(internal);
  if (process.env.NODE_ENV === 'production') return url.protocol === 'https:';
  return url.protocol === 'https:' || url.protocol === 'http:';
 } catch { return false; }
}
async function proxy(request:NextRequest,{params}:{params:Promise<{path:string[]}>}){
 const {path}=await params;
 if(!path?.length || path.some(part=>!part || part==='.' || part==='..'|| !/^[a-zA-Z0-9_-]+$/.test(part)))
  return NextResponse.json({error:'Invalid API path'},{status:400});
 if (!validBackend()) {
  return NextResponse.json({error:'Backend API is not configured. Set API_INTERNAL_URL to the HTTPS API address in Vercel project settings.',code:'BACKEND_URL_MISSING'},{status:503});
 }
 const target=new URL(`${internal}/${path.join('/')}`);
 request.nextUrl.searchParams.forEach((value,key)=>target.searchParams.append(key,value));
 const headers=new Headers();
 const bearer=request.headers.get('authorization');
 if(bearer && /^Bearer [A-Za-z0-9._-]+$/.test(bearer))headers.set('authorization',bearer);
 if(request.method!=='GET'&&request.method!=='HEAD')headers.set('content-type','application/json');
 try{
  const response=await fetch(target,{method:request.method,headers,body:request.method==='GET'||request.method==='HEAD'?undefined:await request.text(),cache:'no-store',signal:AbortSignal.timeout(20000)});
  const content=await response.text();
  return new NextResponse(content,{status:response.status,headers:{'content-type':response.headers.get('content-type')||'application/json','cache-control':'no-store'}});
 }catch(error){
  console.error('Portfolio API unavailable:',error instanceof Error?error.message:'Unknown');
  return NextResponse.json({error:'Backend is offline or unreachable. Start the API on port 4000 and check your MongoDB connection. This message was not delivered.'},{status:503});
 }
}
export {proxy as GET,proxy as POST,proxy as PATCH};
