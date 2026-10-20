import admin from 'firebase-admin';
import type {Request,Response,NextFunction} from 'express';
import {env,admins} from './config.js';

if (!admin.apps.length) {
  if (env.FIREBASE_SERVICE_ACCOUNT_JSON_B64) {
    const credentials=JSON.parse(Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_JSON_B64,'base64').toString('utf8'));
    admin.initializeApp({credential:admin.credential.cert(credentials),projectId:env.FIREBASE_PROJECT_ID});
  } else {
    admin.initializeApp({credential:admin.credential.applicationDefault(),projectId:env.FIREBASE_PROJECT_ID});
  }
}
export type Identity={uid:string;email:string;name:string;admin:boolean};
declare global {namespace Express {interface Request {identity?:Identity}}}
type HttpError=Error&{status?:number;code?:string};
function denied(message:string,status:number,code:string):HttpError{
  return Object.assign(new Error(message),{status,code});
}
export async function getIdentity(idToken:string):Promise<Identity>{
  let token:admin.auth.DecodedIdToken;
  try {
    // Firebase already verifies signed JWTs and expiry; no revocation HTTP call
    // on every request. Revocation can be enforced separately for sensitive actions.
    token=await admin.auth().verifyIdToken(idToken);
  } catch(error) {
    const code=(error as {code?:string})?.code||'';
    if(code.startsWith('auth/')) throw denied('Your sign-in session is invalid or expired. Please sign in again.',401,'AUTH_TOKEN_INVALID');
    console.error('[Firebase Admin] Token verification unavailable:',code||String(error));
    throw denied('The sign-in service is temporarily unavailable. Check Firebase Admin credentials and server logs.',503,'AUTH_SERVICE_UNAVAILABLE');
  }
  if(!token.email||!token.email_verified)throw denied('Verify your email before using private messaging.',403,'EMAIL_NOT_VERIFIED');
  const email=token.email.toLowerCase();
  return {uid:token.uid,email,name:typeof token.name==='string'?token.name:email.split('@')[0],admin:admins.has(email)};
}
export async function requireAuth(req:Request,_res:Response,next:NextFunction){
  try {
    const match=/^Bearer (.+)$/i.exec(req.headers.authorization||'');
    if(!match)throw denied('Sign in to continue.',401,'AUTH_REQUIRED');
    req.identity=await getIdentity(match[1]);
    next();
  } catch(error) {next(error);}
}
export function requireAdmin(req:Request,_res:Response,next:NextFunction){
  if(!req.identity?.admin)return next(denied('This account is not an administrator.',403,'ADMIN_REQUIRED'));
  next();
}
