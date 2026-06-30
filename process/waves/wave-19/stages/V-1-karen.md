# V-1 Karen — wave-19 M3 attachments (source-claim verification, MERGED @ main 81d12b9 / PR#31)

```yaml
verdict: APPROVE
scope: source-claim verification against merged code (main, working tree at 81d12b9)
note_on_live: |
  $CLAUDOMAT_DB_URL points at the BRAIN/control-plane DB (tasks/milestones/waves/founder_bets),
  NOT the StudyHall application DB (no messages/channels/attachments tables there). So prod
  table-existence + drizzle ledger 9→10 could NOT be queried directly from this seat.
  Migration applied-to-prod is verified INDIRECTLY: migration file 0009 present + journal has
  10 entries (idx 9 = 0009_narrow_carnage), and C/T evidence (T-8 live_probe: presign 401 +
  confirm 401 on serving revision) confirms the routes are live. The deploy-applied claim rests
  on the C-block migration step, not re-verifiable here. UNVERIFIED-BY-SEAT, not WRONG.

claims:
  1_data_plane_real:
    status: VERIFIED
    presign: files.service.ts:217-266 — allowlist (ATTACHMENT_ALLOWED_MIME :33-40), key attachments/<channelId>/<uuid>.<ext> :242, API not in upload path (presigned PUT)
    confirm_validation_only: attachments.controller.ts:135-192 — HeadObject via checkAttachmentSize (files.service.ts:281-306), NO DB row, returns ValidatedAttachment descriptor
    row_at_send: messages.service.ts:485-562 — createMessage WRAPPED in db.transaction; attachment INSERT :547-559 with message_id = confirmedMessageRow.id (NOT NULL); isNewInsert guard :502/:547 prevents double-attach on idempotent replay. createReply mirror :1030-1108.
  2_C1_IDOR_fixed:
    status: VERIFIED
    load_bearing: true
    send_time_rederive: validateAndHeadAttachments messages.service.ts:349-411 runs BEFORE txn (:467 createMessage, :1023 createReply); calls headAttachment :383, DISCARDS client size/type, returns serverContentType/contentLength :405-406
    anchored_regex: ^attachments/<escapedChannelId>/[A-Za-z0-9._-]+$ :365 (channelId from message's real channel, not client body); char class excludes "/" and ".." → cross-channel swap + path-traversal closed :376-380
    persisted_insert_server_derived: INSERT uses a.contentType/a.sizeBytes which are the SERVER-derived values from validateAndHeadAttachments (:405-406 → :555-556 / :1100-1101). Bypassing /confirm changes nothing — send is the binding gate.
    negative_tests: T-8 reports CI-executed — cross-channel→400, traversal→400, 11MB→413, video/mp4→400, happy-path persists server image/png+204800 (not client pdf/500), reply cross-channel→400 + 15MB→413 (T-8-security.md:11). VERIFIED at evidence level (tests named + ratified by T-8 PASS); not independently re-run from this seat.
  3_presigned_get_url:
    status: VERIFIED
    url_source: AttachmentRef.url = resolveAttachmentUrl (files.service.ts:356-369, GetObjectCommand + getSignedUrl, 1h TTL) — NOT static resolvePublicUrl (that stays avatar-only). Private-bucket-correct.
    no_n_plus_1: fetchAttachmentRows batch SELECT WHERE message_id = ANY (inArray) :254-268; buildAttachmentRefMap presigns in parallel via Promise.all :289. Wired into listMessages :1444, listThreadReplies :1234, getMyMentions :1568, createMessage :580, createReply :1111.
  4_migration_0009:
    status: VERIFIED (file+journal) / UNVERIFIED-BY-SEAT (prod-applied)
    additive: 0009_narrow_carnage.sql — CREATE TABLE attachments, message_id uuid NOT NULL FK→messages ON DELETE cascade, uploader_id FK→users, channel_id FK→channels ON DELETE cascade, INDEX(message_id). Schema def matches (schema/attachments.ts:21-44).
    note: uploader_id is text (matches users.id text PK) — consistent, not a defect. journal = 10 entries, idx 9. Prod ledger 9→10 not queryable from brain DB (see note_on_live).
  5_frontend:
    status: VERIFIED
    composer: MessageComposer.tsx — picker (hidden input :638-648 + attach button :681-701), staged preview (StagedTile :168-266, image thumb via createObjectURL :343 / file chip), client guard ≤10MB + 6-type allowlist mirroring server :51-65/:337-341, upload flow presign→PUT→confirm→send :384-443/:449-518, send disabled while uploading (canSend/hasBlockingTile :301-305), failed upload → error tile + no broken send :480-483. api.presignAttachment/confirmAttachment exist (api.ts:223/248).
    message_row: MessageList.tsx — image preview max-h-320 → lightbox on click (AttachmentRender :400-461, ImageLightbox :198 focus-trap/Esc/restore), file chip (FileChip :305), onError → broken-image fallback chip :429/:462-468, 0-N stack (AttachmentList :481-487).
    tombstone_safe: isDeleted returns early :964-988 BEFORE attachment render at :1116 → deleted messages never render attachments. VERIFIED.
  6_antipatterns:
    claimed_not_built: NONE found — every spec AC traces to merged code.
    gold_plating: NONE — grep for transcode/virus/clamav/cloudfront/cdn/thumbnail-service/sharp/pdf-render/ffmpeg in attachment code = clean (only hit is a pre-existing avatar CDN string in files.controller.spec.ts, unrelated). Scope (≤10MB, image preview + file chip, allowlist, 0-N) held; OUT-items stayed out.
    live_routes: T-8 live_probe presign 401 + confirm 401 (not 404) on serving revision → routes deployed. Controller wired in files.module.ts:16.
    m3_metric: reactions (wave-13) + threads (wave-18) + attachments (wave-19) all shipped → M3 "reactions, threads, attachments working" genuinely met at source level.

load_bearing_summary:
  C1_IDOR_fixed: VERIFIED (server re-derive + anchored regex + server-derived persisted INSERT)
  row_at_send_atomic: VERIFIED (db.transaction wrap, message_id NOT NULL, isNewInsert no-double-attach)
  presigned_GET: VERIFIED (resolveAttachmentUrl GetObjectCommand, batch + parallel, no N+1)

residual_risk:
  - Prod schema/ledger not directly queryable from this seat (brain DB only). Recommend C-block/V-2 confirm `\d attachments` exists on the StudyHall app DB + drizzle ledger count = 10 before closing the wave. LOW (file+journal+live-401 evidence corroborate).
  - H-2 known-debt (oversized object can land in bucket via presigned-PUT, no GC cron) is correctly documented + harmless (never persisted/surfaced; send-time HeadObject is binding gate). Accepted, not a blocker.
```

## Bottom line
APPROVE. All three load-bearing claims (C-1/IDOR fix, row-at-send atomicity, presigned-GET) are VERIFIED in merged source. No claimed-but-not-built gaps, no gold-plating. The only thing this seat could not verify directly is the prod-applied migration (the DB URL available here is the brain control-plane DB, not the app DB) — corroborated indirectly by migration file + journal idx 9 + T-8's live 401 probe. One LOW-severity follow-up for V-2/C-block: confirm `attachments` table + ledger=10 on the actual StudyHall app DB before wave close.
