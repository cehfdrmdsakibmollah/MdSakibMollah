import {NextResponse} from 'next/server';
export async function GET(){try{const r=await fetch((process.env.API_INTERNAL_URL||'http://127.0.0.1:4000/api/v1')+'/health',{signal:AbortSignal.timeout(3500),cache:'no-store'});return NextResponse.json({online:r.ok},{status:r.ok?200:503})}catch{return NextResponse.json({online:false},{status:503})}}
