# Wave 19 — B-block (Build) gate verdict — B-6 Phase 1 (head-builder code-read)

**Block:** B (Build) | **Wave:** 19 — M3 attachments (multi-spec) | **Stage:** B-6 Review (Phase 1)
**Branch:** wave-19-m3-attachments @ 681440b
**Specs:** 20db0c16 (data plane) · 7c39c9e3 (composer) · cf1ae370 (render)
**Reviewer:** head-builder (Staff/Principal SWE gate)

---

## Verdict

```yaml
head_signoff:
  verdict: REWORK
  stage: B-6
  phase: 1
  reviewers: { code-read: head-builder }
  failed_checks:
    - "B-3 composer client-guard allowlist does NOT mirror the server allowlist (contract drift)"
  rationale: >
    The data plane is excellent and every load-bearing server-side check passes:
    rule-4 channel-derived authz is enforced at BOTH presign and confirm with the
    REQUIRED non-member-403 negative-path tests reproduced and asserting
    canViewChannelById was called with the route :channelId; a cross-channel
    key-swap IDOR guard is additionally present; row-at-send is atomic in a single
    db.transaction with an isNewInsert guard that prevents double-attach on
    idempotent replay and forecloses orphan rows (message_id NOT NULL);
    confirm is validation-only (HeadObject ≤10MB → 413 server-enforced, no DB row);
    AttachmentRef.url is a presigned-GET (resolveAttachmentUrl), not the static
    public URL; and attachment loads are batch-keyed (single SELECT WHERE message_id
    = ANY + parallel presign) across all four read paths — no N+1. Render-side
    a11y (lightbox focus-trap/Esc/backdrop/focus-restore), img onError → broken-chip
    fallback, and tombstone-renders-no-attachment all pass; optimistic-render +
    outbox + reconciliation is intact. ONE blocking defect remains: the composer's
    client-side content-type allowlist is a strict superset of the server's locked
    6-type allowlist. This is exactly the contract-drift-that-silently-breaks-the-client
    failure mode the B-6 gate exists to catch, and it directly fails spec AC
    7c39c9e3 ("Client-side guard mirrors the server, reject before upload with a
    clear inline error"). Fix is trivial and localized; the rest of the block is
    APPROVED-ready.
  next_action: REWORK_B-3
```

---

## Load-bearing checks (the three this gate was told to scrutinize)

### 1. Rule-4 channel-derived authz + non-member 403 negative-path test — PASS
- `apps/api/src/files/attachments.controller.ts:91-94` (presign) and `:145-148` (confirm):
  both call `rbacService.canViewChannelById(userId, channelId)` where `userId` is
  session-derived (`req.session.getUserId()`) and `channelId` is the **route param**,
  not a client body field. Non-member → `ForbiddenException` (403). Authz source is
  channel-derived per rule 4.
- Negative-path tests reproduced and assert 403 at BOTH doors:
  - presign: `attachments.controller.spec.ts:73-85` — `makeController(false)` → rejects
    `ForbiddenException` AND asserts `canViewChannelById` called with `('user-member', CHANNEL_ID)`.
  - confirm: `attachments.controller.spec.ts:189-201` — same assertion shape.
- BONUS (exceeds spec): confirm enforces a key-scope guard
  (`attachments.controller.ts:153-158`, test `:205-215`) rejecting any key not prefixed
  `attachments/<channelId>/` — closes a cross-channel key-swap IDOR.
- NOTE for Phase 2 /review (per BUILD-PRINCIPLES rule 4): these are unit tests with a
  mocked RbacService. Phase 2 must adversarially re-verify the non-member 403 against a
  real Postgres door (the rule-4 promotion requires a reproduced negative path, not only
  a mocked one).

### 2. Row-at-send atomicity — PASS
- `messages.service.ts:369-446` (createMessage) and `:904-982` (createReply): message INSERT
  + attachment INSERT in one `db.transaction`. `isNewInsert` derived from
  `onConflictDoNothing(...).returning().length > 0`. Attachment INSERT gated on
  `isNewInsert` → idempotent replay (key conflict) re-fetches the existing row and
  **skips** the attachment INSERT, so replays do NOT double-attach. `message_id` is
  set from the just-inserted row id and is `NOT NULL` in schema/migration → no orphan
  rows are representable. uploader_id = session authorId, channel_id = route channelId.

### 3. Presigned-GET url — PASS
- `files.service.ts:307-320` `resolveAttachmentUrl` = `GetObjectCommand` + `getSignedUrl`
  (1h TTL), distinct from `resolvePublicUrl` (avatar public URL). `buildAttachmentRefMap`
  (`messages.service.ts:280-310`) resolves all keys in parallel and is used by every read
  path (list/createMessage/createReply/listThreadReplies/getMyMentions). Railway Buckets
  private contract honored.

---

## Other checks

| Check | Status | Evidence |
|---|---|---|
| confirm = validation-only (no DB row) | PASS | `attachments.controller.ts:177-178`; test `:275-296` |
| ≤10MB server-enforced (HeadObject) | PASS | `files.service.ts:270-295` (413); test `:259-272` |
| No N+1 (batch SELECT + parallel presign) | PASS | `fetchAttachmentRows` + `buildAttachmentRefMap` across all 4 read paths |
| Migration 0009 additive | PASS | `0009_narrow_carnage.sql` CREATE TABLE + FKs + index only; message_id NOT NULL, cascade FKs mirror reactions/mentions |
| Storage graceful-503 | PASS | `getS3Client()` returns null → `ServiceUnavailableException{code:STORAGE_NOT_CONFIGURED}`; `resolveAttachmentUrl` returns null → url falls back to '' |
| No scale gold-plating | PASS | No GC cron, no transcode/CDN/thumbnail-service (abandoned objects = logged known-debt per P-4) |
| Lightbox a11y (focus-trap/Esc/backdrop/restore) | PASS | `MessageList.tsx:198-290` |
| img onError → fallback chip | PASS | `MessageList.tsx:429` `onError={()=>setBroken(true)}` → FileChip isBroken |
| Tombstone renders no attachment | PASS | `MessageList.tsx:964-989` early-returns before AttachmentList |
| Optimistic render → outbox → reconcile | PASS | `useMessages.ts:268-311` optimistic pending, dedup-by-id on confirm, attachments carried for retry |
| Send disabled while uploading; failed upload no broken send | PASS | `MessageComposer.tsx:306-310` hasBlockingTile; `:484-488` aborts send on any null upload result |

---

## Blocking defect (REWORK)

**[H-1] Composer client-guard allowlist drifts from the server allowlist — contract drift.**

- **Where:** `apps/web/src/shell/MessageComposer.tsx:57-70` (`ALLOWED_CONTENT_TYPES`) and the
  derived `ACCEPT` string at `:73`. The block comment at `:54-56` explicitly claims it
  "Must mirror the server-side attachment allowlist in apps/api" — it does not.
- **Server allowlist (locked contract, the source of truth):** `files.service.ts:33-40`
  `ATTACHMENT_ALLOWED_MIME` = exactly 6 types — `image/png`, `image/jpeg`, `image/webp`,
  `image/gif`, `application/pdf`, `text/plain`.
- **Client allowlist (12 types):** adds 6 the server REJECTS — `image/svg+xml`,
  `application/msword`, `…wordprocessingml.document` (.docx), `application/vnd.ms-excel`,
  `…spreadsheetml.sheet` (.xlsx), `application/zip`.
- **Impact:** A user can stage any of those 6 types; the client guard passes (tile shows
  "Ready"); on send the presign call returns 400 from the server allowlist check, the tile
  flips to a generic error, and the message is silently held back. This fails spec AC
  7c39c9e3 ("guard mirrors the server, reject before upload with a clear inline error") —
  the user gets a confusing late upload-time failure instead of the contracted pre-upload
  inline reject. It fails safe (no broken message, no data loss, server is the real gate),
  but it is precisely the client/server contract drift this gate must not pass.
- **Security note:** `image/svg+xml` is correctly excluded server-side (SVG can carry
  script). Listing it client-side is a latent footgun should the server allowlist ever be
  "aligned to what the client sends." Remove it.
- **Fix:** narrow `ALLOWED_CONTENT_TYPES` (and therefore `ACCEPT`) to exactly the 6
  server types. Re-run the web build/typecheck. No backend or contract change needed.
- **Route:** return to B-3 author (frontend-developer). Iron-law: head-builder does not
  edit the deliverable.

---

## Block-state carried to re-gate

```yaml
block_state:
  contract_locked: true
  migration_files: [apps/api/drizzle/migrations/0009_narrow_carnage.sql]
  realtime_verified: deferred-to-T-block   # attachments ride existing message.created fan-out; two-client check belongs to T-5/T-9
  guard_coverage: { presign: rule-4+key-scope, confirm: rule-4+key-scope, send: txn-scoped }
  reviewer_verdicts: { head-builder-phase1: REWORK }
  blocking_defects: [H-1-client-allowlist-drift]
```

Re-submit B-3 with the allowlist aligned; on a clean re-read of that single change the block
is APPROVED-ready for B-6 Phase 2 (/review adversarial re-verification of the rule-4 negative
paths against real Postgres).
