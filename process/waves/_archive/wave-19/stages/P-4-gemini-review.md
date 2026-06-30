CONCERN: The proposed two-phase attachment process—confirming an upload to create a database row, then separately associating it with a message—introduces a significant risk of orphaned data. If a user uploads a file but abandons the message, the unassociated file and database record will persist indefinitely, leading to storage bloat and unnecessary costs.

EVIDENCE: "…`confirmAttachment(...)` → ... → INSERT attachment row (message_id NULL, channel_id, uploader_id) → return AttachmentRef" and a later, separate step: "extend createMessage (...) to accept `attachmentIds[]` and, IN THE SAME message-insert TRANSACTION, UPDATE the attachment rows SET message_id = newMessage.id"

SUGGESTION: Implement a garbage collection mechanism, such as a cron job, to periodically delete attachment rows and their corresponding storage objects that remain unassociated (message_id IS NULL) after a reasonable time-to-live.
