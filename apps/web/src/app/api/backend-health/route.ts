import {NextResponse} from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function GET() {
 const configured = process.env.API_INTERNAL_URL?.trim();
 const base = configured || (process.env.NODE_ENV==='production' ? '' : 'http://127.0.0.1:4000/api/v1');
 if (!base || (process.env.NODE_ENV==='production' && !base.startsWith('https://'))) {
   return NextResponse.json({online:false,reason:'backend_unconfigured'},{status:503});
 }
 try {
   const target = new URL(base.replace(/\/$/,'')+'/health');
   const response = await fetch(target,{signal:AbortSignal.timeout(80000),cache:'no-store'});
   return NextResponse.json({online:response.ok},{status:response.ok?200:503});
 } catch {
   return NextResponse.json({online:false},{status:503});
 }
}
