/**
 * Private conversation views always show the most recent messages, not the
 * oldest 200. MongoDB first selects the newest page (stable on equal dates),
 * then the UI receives that page in chronological order.
 */
export const recentChatLimit=200;
export const newestFirstChatSort={createdAt:-1,_id:-1} as const;
export function chronologicalFromNewest<T>(newestFirst:readonly T[]):T[]{
 return [...newestFirst].reverse();
}
