# Wave 19 — B-2 Backend
```yaml
files: [files.service.ts (extend), files/attachments.controller.ts + spec, files.module.ts, messaging/messages.service.ts, messaging.module.ts (assoc)]
presign_confirm: "POST /channels/:channelId/attachments/{presign,confirm}; rule-4 canViewChannelById(userId, channelId) FIRST (non-member 403 — tested at BOTH); key-scoping IDOR guard (key startsWith attachments/<channelId>/); content-type allowlist (ATTACHMENT_ALLOWED_MIME). confirm = VALIDATION-ONLY (HeadObject ≤10MB→413 → ValidatedAttachment, NO db row)."
row_at_send: "createMessage WRAPPED in db.transaction; insert message ON CONFLICT DO NOTHING RETURNING → isNewInsert guard; if isNewInsert && attachments: tx.insert(attachments) with message_id=msg.id, uploader_id=sender, channel_id; idempotent replay → no double-attach. createReply same (already txn). message_id NOT NULL (no orphans)."
url: "resolveAttachmentUrl(key) = presigned-GET (GetObjectCommand + getSignedUrl, 1h) — Railway Buckets PRIVATE; NOT static resolvePublicUrl."
dto: "rowToDto += attachments[]; fetchAttachmentRows(messageIds) single SELECT WHERE message_id=ANY + parallel presign (NO N+1, verified selectCallCount=5/page); listMessages + listThreadReplies carry attachments[]. gateway message event carries attachments[] (no new event)."
tests: "328 pass (+attachment/IDOR-403/association/idempotent/no-N+1); typecheck+shared-build+biome clean"
```
