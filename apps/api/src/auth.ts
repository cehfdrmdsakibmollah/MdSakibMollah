import admin from 'firebase-admin';
import type {Request,Response,NextFunction} from 'express';
import {env,admins} from './config.js';
if(!admin.apps.length){
  if(env.FIREBASE_SERVICE_ACCOUNT_JSON_B64){
    const credentials=JSON.parse(Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_JSON_B64,'base64').toString('utf8'));
    admin.initializeApp({credential:admin.credential.cert(credentials),projectId:env.FIREBASE_PROJECT_ID});
  } else {admin.initializeApp({credential:admin.credential.applicationDefault(),projectId:env.FIREBASE_PROJECT_ID});}
}
export type Identity={uid:string;email:string;name:string;admin:boolean};
declare global {namespace Express {interface Request {identity?:Identity}}}
export async function getIdentity(idToken:string):Promise<Identity>{
  const token=await admin.auth().verifyIdToken(idToken,true);
  if(!token.email||!token.email_verified) throw Object.assign(new Error('Verify your email before using private messaging.'),{status:403});
  const email=token.email.toLowerCase();
  return {uid:token.uid,email,name:typeof token.name==='string'?token.name:email.split('@')[0],admin:admins.has(email)};
}
export async function requireAuth(req:Request,_res:Response,next:NextFunction){
  try {const match=/^Bearer (.+)$/i.exec(req.headers.authorization||''); if(!match) throw Object.assign(new Error('Sign in to continue.'),{status:401});req.identity=await getIdentity(match[1]);next();}
  catch(e){next(e);}
}
export function requireAdmin(req:Request,_res:Response,next:NextFunction){if(!req.identity?.admin)return next(Object.assign(new Error('Forbidden'),{status:403})); next();}
