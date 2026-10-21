import admin from 'firebase-admin';
import type {Request,Response,NextFunction} from 'express';
import {env,admins} from './config.js';

if (!admin.apps.length) {
  if (env.FIREBASE_SERVICE_ACCOUNT_JSON_B64) {
    const credentials=JSON.parse(Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_JSON_B64,'base64').toString('utf8'));
    // Rotation check logs only a yes/no result; never log key IDs, JSON or Base64.
    const expectedId=process.env.FIREBASE_EXPECTED_KEY_ID;
    if (expectedId && process.env.RENDER) {
      console.info('[Firebase Admin] Expected service-account key configured:', {
        matches:credentials.private_key_id===expectedId
      });
    }
    admin.initializeApp({credential:admin.credential.cert(credentials),projectId:env.FIREBASE_PROJECT_ID});
  } else {
    admin.initializeApp({credential:admin.credential.applicationDefault(),projectId:env.FIREBASE_PROJECT_ID});
  }
  // Run one read-only credential check at startup without printing user records.
  // This does not replace a full signed-in Google Login / messaging test.
  if(process.env.RENDER && process.env.FIREBASE_EXPECTED_KEY_ID){
    void admin.auth().listUsers(1)
      .then(()=>console.info('[Firebase Admin] Auth service credential probe: OK'))
      .catch(error=>{
        const code=typeof (error as {code?:unknown})?.code==='string'?(error as {code:string}).code:'UNKNOWN';
        console.error('[Firebase Admin] Auth service credential probe: FAILED', {code});
      });
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
