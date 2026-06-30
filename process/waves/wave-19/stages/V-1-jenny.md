# V-1 Semantic-Spec Verification — jenny — wave-19 (M3 attachments)

**Verdict: APPROVE**
**State verified:** main @ 81d12b9 (merged), LIVE. Specs from DB tasks 20db0c16 / 7c39c9e3 / cf1ae370 + M3 milestone 6198650e.
**Method:** independent read of merged source — no other-reviewer awareness.

---

## Spec 20db0c16 — Upload/storage data plane

| AC | Result | Evidence |
|---|---|---|
| Member presigns → presigned PUT URL + namespaced key `attachments/<channelId>/<uuid>.<ext>`; API not in upload path | MATCHES | `attachments.controller.ts:presign` → `files.service.ts:presignAttachmentUpload` (key `attachments/${channelId}/${randomUUID()}.${ext}`, client PUTs direct) |
| Confirm runs HeadObject, REJECT >10MB 413 before persisting; disallowed type 4xx at presign; row only on size+type pass | MATCHES | `confirm` → `checkAttachmentSize` (HeadObject, `PayloadTooLargeException` >10MB); presign 400 on allowlist miss; **confirm creates NO row** (P-4 row-at-send) — row born only in send txn after re-validation |
| Attachment row links message_id FK + uploader_id, object_key, content_type, size_bytes, created_at; 0-N per message | MATCHES | migration `0009_narrow_carnage.sql`: `message_id NOT NULL FK→messages CASCADE`, uploader_id, channel_id, object_key, filename, content_type, size_bytes, created_at + idx(message_id) |
| Send path accepts attachment descriptors, associates 0-N in one txn; send/list DTO returns metadata (id, filename, contentType, sizeBytes, url) | MATCHES | `createMessage` + `createReply` wrap INSERT+attachment-INSERT in `db.transaction`; `AttachmentRef {id,filename,contentType,sizeBytes,url}` on `MessageResponse.attachments`; `buildAttachmentRefMap` batch-loads + signs URLs |
| Authz channel-derived (not client param); non-member 403 | MATCHES | controller `canViewChannelById(userId, :channelId route param)` 403; send path `ChannelMessageGuard`; send-time re-validation pins key to channel via anchored regex |
| Metadata rides existing /messaging fan-out, no new namespace | MATCHES | only 2 gateways exist (`/messaging`, `/presence`); attachments fan out on the message event via channel room |

**Security note (informational, not drift):** implementation EXCEEDS spec — server re-HeadObjects at send (`headAttachment`) and INSERTs server-derived size/contentType, ignoring client-supplied values (closes size-bypass + type-spoof). Anchored key regex prevents cross-channel/path-traversal key swap. Stronger than the AC text; no conflict.

## Spec 7c39c9e3 — Composer

| AC | Result | Evidence |
|---|---|---|
| File/image picker + pre-send preview (image thumb / file chip + size) + remove | MATCHES | `MessageComposer.tsx` paperclip + hidden input; `StagedTile` thumb via `createObjectURL` / file chip + `humanSize`; remove ✕ |
| Client ≤10MB + content-type guard mirroring server | MATCHES | `MAX_ATTACHMENT_BYTES = 10*1024*1024`; `ALLOWED_CONTENT_TYPES` mirrors `ATTACHMENT_ALLOWED_MIME`; inline reject pre-upload |
| Upload-on-send (presign→PUT→confirm→associate); message appears with attachment | MATCHES | send flow `presign → PUT → confirm → ValidatedAttachment[] → send`; `api.presignAttachment`/`confirmAttachment` |
| Send disabled / progress while uploading; failed upload retry/clear, no broken send | MATCHES | `hasBlockingTile` gates `canSend`; per-tile progress bar; `error` phase tile with retry/clear; broken-send guard |

## Spec cf1ae370 — Message-row render

| AC | Result | Evidence |
|---|---|---|
| Image → inline preview (constrained max dim, click → full) | MATCHES | `AttachmentRender` img `maxHeight:320` → `ImageLightbox` (focus-trap, Esc, backdrop-close) on click |
| File → chip (icon + filename + human size) downloads/opens on click | MATCHES | `FileChip` with `FileIcon` + filename + `humanSize` + `DownloadSimpleIcon`, download URL |
| 0-N stack; no-attachment unchanged; tombstoned messages render none | MATCHES | `AttachmentList` maps 0-N (flex-wrap); attachment block gated on `msg.attachments.length>0`; `isDeleted` returns tombstone article BEFORE the attachment block (line 964) + backend `rowToDto` returns `[]` for soft-deleted (double-safe) |
| Broken image → graceful fallback chip; image-only click-to-full | MATCHES | `onError → setBroken(true)` → falls through to `FileChip isBroken` |

---

## Cross-cutting checks

- **Scope discipline — no creep:** MATCHES. Grep across apps/+packages/ for transcode/cloudfront/virus/clamav/ffmpeg/thumbnail-service/pdf-render = 0; `cdn`/`resize` hits are benign (avatar test fixtures, CSS `resize-none`, viewport-resize). Ships exactly ≤10MB + image+file + allowlist (png/jpeg/webp/gif + pdf/text-plain). OUT items absent.
- **Storage provider consistency:** MATCHES. Reuses `FilesService` + `@aws-sdk/client-s3` + Railway Buckets (no new SDK, no new provider, no founder cred-ask) — verbatim with M3 ## Scope "file/image attachments (Railway Buckets, ≤10MB)".
- **2-namespace lock honored:** MATCHES. Exactly `/messaging` + `/presence`; no third namespace. Attachments use a channel room on `/messaging`.
- **M3 closure-eligibility:** CONFIRMED. All three ## Scope feature clauses shipped in main — reactions (wave-13, present in messages.service/gateway), thread replies (wave-18, ThreadsController + `thread_parent_id` + createReply), attachments (this wave). M3 success metric "reactions, threads, and attachments working" is fully met. Milestone status `in_progress` — eligible to close at N-1 modulo dispositioning the parked tech-debt (abandoned-orphan storage GC = logged known-debt, explicitly out of scope this wave).

## DRIFTS
None. Every AC across all three specs MATCHES the roadmap and the M3 metric with no conflicting source.

**M3 is now feature-complete.**
