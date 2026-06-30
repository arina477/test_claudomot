# Wave 19 — P-3 Plan

## Approach

### Architecture deltas
**Reuse the EXISTING FilesService + Railway Buckets** (apps/api/src/files — already serves avatars via presign→PUT→HeadObject-confirm with @aws-sdk/client-s3). Attachments extend this, not a new integration. **MessagingModule** gains attachment association on the message create/list path.

- **FilesService extend:** add `presignAttachmentUpload(channelId, userId, contentType)` (key `attachments/<channelId>/<uuid>.<ext>`, content-type allowlist = images png/jpeg/webp/gif + files application/pdf, text/plain — exact map in code; 503 if storage unconfigured, like avatars) + `checkAttachmentSize(key)` (HeadObject → 413 if >10MB; 10MB const) + reuse `resolvePublicUrl`. Mirror the avatar methods (proven pattern).
- **Attachments persistence (new):** `attachments` table (migration 0009): id uuid pk, message_id uuid FK→messages CASCADE (NULLABLE until associated), uploader_id uuid FK→users, channel_id uuid FK→channels, object_key text, filename text, content_type text, size_bytes int, created_at timestamptz; index (message_id). Drizzle schema apps/api/src/db/schema/attachments.ts + export.
- **AttachmentsService/flow (in MessagingModule or a thin AttachmentsModule):** `confirmAttachment(channelId, userId, key, filename, contentType)` → checkAttachmentSize (HeadObject ≤10MB) → INSERT attachment row (message_id NULL, channel_id, uploader_id) → return AttachmentRef {id, filename, contentType, sizeBytes, url}. **Channel-membership authz** on presign + confirm (canViewChannelById, channel from the route param VALIDATED against membership — BUILD-PRINCIPLES rule 4: a non-member is 403; negative-path test required at B-6).
- **Message association:** extend createMessage (+ createReply) to accept `attachmentIds[]` (or keys) and, IN THE SAME message-insert TRANSACTION, UPDATE the attachment rows SET message_id = newMessage.id WHERE id = ANY(ids) AND uploader_id = sender AND channel_id = message.channel AND message_id IS NULL (reject mismatched owner/channel/already-associated). rowToDto += attachments[] (JOIN/select attachments WHERE message_id). listMessages + listThreadReplies return attachments[].
- **Realtime:** the EXISTING message event (message:new / thread:reply:created) carries the message DTO which now includes attachments[] — no new event/namespace; recipients render on arrival.

### Data model
**migration 0009 (additive):** attachments table (above) + index (message_id). No change to messages. Backfill: none (new table).

### API / deps
- POST /channels/:channelId/attachments/presign {contentType, filename} → {uploadUrl, key}; POST /channels/:channelId/attachments/confirm {key, filename, contentType} → AttachmentRef; message-send body += attachmentIds[]. **No new dep** (@aws-sdk/client-s3 + s3-request-presigner installed). **No founder cred-ask** (storage wired). Verify the attachments bucket exists / reuse the avatar bucket (STORAGE_BUCKET_NAME) — confirm at B-0; if a separate bucket is wanted, `railway bucket create` with APP_RAILWAY_TOKEN (self-provision, no ask).

### Frontend (apps/web/src/shell/)
- **MessageComposer.tsx:** file/image picker (hidden input + button), staged-attachment state, pre-send preview (image thumbnail / file chip + remove), client-side ≤10MB + content-type guard (mirror server, inline reject), upload-on-send (presign → fetch PUT → confirm → send message with attachmentIds), progress + failure retry/clear.
- **MessageList.tsx:** render message.attachments — inline image preview (constrained max-h, click → full-size overlay) for image content-types; file chip (icon + filename + human size, click to open url) for files; 0-N stack; tombstone-safe (deleted message renders no attachments).
- **api.ts:** presignAttachment, confirmAttachment; extend sendMessage to carry attachmentIds.
- **useMessages.ts:** thread the attachmentIds through the optimistic send (reuse outbox; the attachment metadata reconciles on the server echo).

## Plan
### File-level steps (by B-stage)
**B-1 Schema** (postgres-pro): migration 0009 attachments table + index; apps/api/src/db/schema/attachments.ts + schema index export.
**B-2 Contracts** (typescript-pro): packages/shared/src/messaging.ts — AttachmentRef; MessageResponse += attachments?; presign/confirm req/res types; sendMessage body += attachmentIds.
**B-3 Backend** (backend-developer):
| apps/api/src/files/files.service.ts | modify | presignAttachmentUpload + checkAttachmentSize (10MB) + content-type allowlist |
| apps/api/src/files/files.controller.ts (or attachments.controller.ts) | modify/create | POST attachments/presign + confirm, channel-membership-gated |
| apps/api/src/messaging/messages.service.ts | modify | createMessage/createReply accept attachmentIds → associate in-txn (owner/channel/unassociated guard); rowToDto += attachments[]; list returns attachments |
| apps/api/src/messaging/messages.controller.ts | modify | send body attachmentIds |
| (gateway) | verify | message event DTO carries attachments[] (no new event) |
**B-4 Frontend** (react-specialist + frontend-developer; against D-block design): MessageComposer (picker/preview/guard/upload), MessageList (image-preview/file-chip render), api.ts, useMessages (attachmentIds through outbox).
**B-5 Wiring:** repo typecheck + route registration + boot-probe + confirm storage env (graceful 503 if absent, like avatars).

### Specialist routing (validated vs AGENTS.md): postgres-pro, typescript-pro, backend-developer, react-specialist, frontend-developer — all present.

### Parallelization: B-1 → B-2 serial. B-3 chain: FilesService+attachments-controller → message-association (depends on attachment rows) → gateway verify. B-4 after B-3 + D-block: composer ∥ render.

### Self-consistency sweep
1. Every AC → step: presign/confirm/≤10MB/allowlist (FilesService+controller); attachment row+association in-txn (messages.service+migration); authz channel-derived (controller, rule 4); DTO attachments[] + fan-out (rowToDto+gateway); composer picker/preview/guard (MessageComposer); render image/file (MessageList). ✓
2. Specialist each step. ✓ 3. No file in two parallel batches. ✓ 4. design_gap TRUE → B-4 against D-block-adopted composer/row attachment design. ✓ 5. Storage reuse (FilesService) + alt (separate bucket vs reuse) named. ✓ 6. Contracts concrete. ✓ 7. No new dep. ✓ 8. SDK = installed @aws-sdk/client-s3, SDK-doc present. ✓

### B-block carries (P-4 will confirm)
- BUILD-PRINCIPLES rule 4 (the freshly-promoted rule): the presign/confirm/associate authz is a real authz boundary — B-6 Phase-2 MUST reproduce a non-member 403 negative path (the wave-18 IDOR class). Channel-derived authz, not a client param as the authz source.
- ≤10MB enforced server-side at confirm (HeadObject), NOT just client (defense-in-depth; presigned-PUT can't carry ContentLengthRange).
- Storage graceful-degrade (503 STORAGE_NOT_CONFIGURED) if env absent — matches avatars; don't crash boot.

## P-4 PHASE-2 ANNOTATION (Gemini→head-product MATERIAL — row-at-send, kills orphans + resolves C5)
**Change the attachment-row birth location from confirm → message-send.** No orphan rows by construction; association is atomic; migration 0009 `message_id` is NOT NULL.
- `confirmAttachment(channelId, userId, key, filename, contentType)` becomes VALIDATION-ONLY: HeadObject (≤10MB→413) + content-type allowlist check; returns the VALIDATED descriptor `{key, filename, contentType, sizeBytes}` — does NOT INSERT a DB row.
- The composer stages the validated descriptor client-side (preview is client-side — no persisted row needed pre-send).
- `createMessage` / `createReply` accept `attachments[]` (the validated descriptors {key, filename, contentType, sizeBytes}) and, in the send path, INSERT the attachment rows with `message_id = newMessage.id` set atomically (createReply already db.transaction; createMessage must be wrapped — this MAKES B-block carry #1's wrap MANDATORY, resolved in favor of wrapping). Guard: uploader_id = sender, channel_id = message.channel.
- migration 0009: attachments.message_id uuid NOT NULL FK→messages CASCADE (row born associated).
- Abandoned STORAGE objects (presigned+PUT but message never sent) = logged KNOWN-DEBT; NO GC cron this wave (gold-plating at sole-user scale; optional follow-on at multi-user scale).
- Contract delta: message-send body carries `attachments[]` (validated descriptors), NOT pre-created attachmentIds. AttachmentRef (id, filename, contentType, sizeBytes, url) is returned on the message DTO after the send INSERT. AttachmentRef.url = presigned-GET (karen C7 — Railway Buckets private; add resolveAttachmentUrl with GetObjectCommand+getSignedUrl, NOT the static resolvePublicUrl).
