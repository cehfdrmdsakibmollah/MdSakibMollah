/**
 * Persist a public form submission at most once when a client retries after a
 * lost response. A database-enforced unique submissionId index is required for
 * correctness under concurrent requests; the pre-read is only an optimization.
 * Never re-send notification emails for already-saved submissions.
 */
export function isDuplicateSubmissionError(error:unknown):boolean {
 return Boolean(error && typeof error==='object' && 'code' in error && error.code===11000);
}
export async function persistContactOnce({
 submissionId,
 lookupReference,
 insertReference
}:{
 submissionId?:string;
 lookupReference:(id:string)=>Promise<string|null>;
 insertReference:()=>Promise<string>;
}):Promise<{reference:string;created:boolean}>{
 if(submissionId){
  const reference=await lookupReference(submissionId);
  if(reference)return {reference,created:false};
 }
 try{
  const reference=await insertReference();
  return {reference,created:true};
 }catch(error){
  // Two requests may race between lookup and insert. Only a real MongoDB
  // duplicate-key exception may be recovered and only for the same key.
  if(submissionId && isDuplicateSubmissionError(error)){
   const reference=await lookupReference(submissionId);
   if(reference)return {reference,created:false};
  }
  throw error;
 }
}
