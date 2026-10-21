/**
 * Pure mapping of already-verified Firebase ID-token claims to API identity.
 * The Firebase Admin SDK must verify signature, audience and expiry BEFORE this runs.
 * Keeping this separate allows CI to exercise access policy without real user tokens.
 */
export type VerifiedClaims={
 uid:string;
 email?:string;
 email_verified?:boolean;
 name?:unknown;
};
export type Identity={uid:string;email:string;name:string;admin:boolean};

export function identityFromClaims(claims:VerifiedClaims,adminEmails:ReadonlySet<string>):Identity{
 if(!claims.email || !claims.email_verified){
  throw Object.assign(new Error('Verify your email before using private messaging.'),{
   status:403,code:'EMAIL_NOT_VERIFIED'
  });
 }
 const email=claims.email.toLowerCase();
 return {
  uid:claims.uid,
  email,
  name:typeof claims.name==='string'?claims.name:email.split('@')[0],
  admin:adminEmails.has(email)
 };
}
