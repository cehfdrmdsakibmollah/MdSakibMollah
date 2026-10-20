import type {ClientFeedback,Conversation} from '@/lib/api';
import {MessageSquareHeart,Star} from 'lucide-react';
export default function FeedbackPanel({items,chats}:{items:ClientFeedback[];chats:Conversation[]}){
 const byId=new Map(chats.map(c=>[c._id,c]));
 return <section className="space-y-4" aria-label="Private client feedback">
  <p className="text-sm muted">Verified users can rate their chat experience. Feedback is private and never published as client testimonials automatically.</p>
  {!items.length&&<p className="surface rounded-xl p-6 muted">No feedback has been submitted yet.</p>}
  {items.map(f=><article className="surface rounded-2xl p-6" key={f._id}>
   <div className="flex items-start flex-wrap justify-between gap-3"><div className="flex items-center gap-2"><MessageSquareHeart className="text-blue-500" size={20}/><h3 className="font-semibold">{byId.get(f.conversationId)?.participantName||'Verified client'}</h3></div><span className="text-xs muted">{new Date(f.updatedAt||f.createdAt).toLocaleString()}</span></div>
   <div className="flex mt-3 gap-1" aria-label={`${f.rating} out of 5 stars`}>{[1,2,3,4,5].map(n=><Star key={n} size={17} className={n<=f.rating?'text-amber-400 fill-amber-400':'muted'}/>)}</div>
   {f.comment&&<p className="mt-4 text-sm leading-7 whitespace-pre-wrap">{f.comment}</p>}
  </article>)}
 </section>
}
