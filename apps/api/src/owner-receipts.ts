import {z} from 'zod';

// Strict input: messages are selected by MongoDB ObjectId, never by raw queries.
export const openedReplySchema=z.object({
 messageIds:z.array(z.string().regex(/^[0-9a-f]{24}$/i)).min(1).max(30)
}).strict();

/** Filter MUST restrict updates to the authenticated conversation's owner replies.
 * Existing timestamps are not overwritten, making client-open receipts idempotent.
 */
export function ownerReplyReceiptFilter(conversationId:string,messageIds:readonly string[]){
 return {
  conversationId,
  _id:{$in:[...new Set(messageIds)]},
  sender:'owner' as const,
  openedAt:{$exists:false}
 };
}
