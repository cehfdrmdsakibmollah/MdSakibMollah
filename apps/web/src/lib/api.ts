import type {User} from 'firebase/auth';
export const apiOrigin='/api/backend';
export async function callApi<T>(path:string,options:RequestInit={},user?:User|null):Promise<T>{
 const token=user?await user.getIdToken():undefined;
 const headers:HeadersInit={...(options.body?{'Content-Type':'application/json'}:{}),...(token?{Authorization:`Bearer ${token}`}:{})};
 const response=await fetch(`${apiOrigin}${path}`,{...options,headers:{...headers,...options.headers},cache:'no-store'});
 const json=await response.json().catch(()=>({}));
 if(!response.ok)throw new Error((json as {error?:string}).error||`Request failed (${response.status})`);
 return json as T;
}
export type Message={_id:string;sender:'client'|'assistant'|'owner';text:string;deliveredBy:'person'|'rule'|'ai';createdAt:string};
export type Conversation={_id:string;participantUid:string;participantEmail:string;participantName:string;status:'open'|'closed';lastMessageAt:string};
export type Lead={_id:string;name:string;email:string;company:string;service:string;budget:string;message:string;status:'new'|'contacted'|'closed';createdAt:string};

export type ClientFeedback={_id:string;conversationId:string;participantUid:string;rating:number;comment:string;createdAt:string;updatedAt:string};
