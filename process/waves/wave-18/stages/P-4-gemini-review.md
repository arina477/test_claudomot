CONCERN: The strategy for maintaining the denormalized `last_reply_at` timestamp upon reply deletion is inefficient. It forces a potentially expensive re-computation on every delete, even when the deleted reply is not the most recent one, creating a performance bottleneck for threads with many replies.

EVIDENCE: "deleteReply / soft-delete (extend wave-13 deleteMessage): when the deleted message is a reply (`thread_parent_id` set), in the same txn decrement the parent `reply_count` and recompute `last_reply_at` (MAX(created_at) of remaining live replies, or NULL)."

SUGGESTION: Conditionally trigger the re-computation only when the deleted reply'
