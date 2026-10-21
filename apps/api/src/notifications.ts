import {env} from './config.js';
const escapeHtml=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c));
export async function sendEmail(to:string,subject:string,body:string){
 if(!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL) return false;
 try{
  const res=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json'},signal:AbortSignal.timeout(12000),body:JSON.stringify({from:env.RESEND_FROM_EMAIL,to:[to],subject,html:`<div style="font:16px/1.6 system-ui,sans-serif;max-width:600px;margin:auto"><h2>MD Sakib Mollah</h2><p>${escapeHtml(body).replaceAll('\n','<br>')}</p><hr><small>Portfolio communications</small></div>`})});
  if(!res.ok) throw new Error(`Email provider responded ${res.status}`);
  return true;
 }catch(err){console.error('Email delivery failed:',err);return false;}
}
