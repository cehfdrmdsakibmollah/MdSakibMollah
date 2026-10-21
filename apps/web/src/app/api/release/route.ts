import {NextResponse} from 'next/server';

export const runtime='nodejs';
export const dynamic='force-dynamic';

// Git revision is public deployment metadata. Never expose process.env or secrets.
export function GET() {
 const candidate=process.env.VERCEL_GIT_COMMIT_SHA?.trim() || '';
 const revision=/^[0-9a-f]{40}$/i.test(candidate)?candidate.toLowerCase():null;
 return NextResponse.json(
  {service:'sakib-portfolio-web',revision,environment:process.env.VERCEL_ENV||'unknown'},
  {headers:{'Cache-Control':'no-store, max-age=0','X-Content-Type-Options':'nosniff'}}
 );
}
