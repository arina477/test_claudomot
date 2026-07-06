# P-3 Plan — wave-64 (M12 offline-media-blob, multi-spec, 2 tasks)

## Approach
- **Architecture deltas:** extend the shipped Dexie substrate with a blob table + read-through helpers; introduce a
  small React component/hook that resolves a message image attachment to either the network presigned URL (online,
  + write-through cache) or a cached-blob object URL (offline), managing the object-URL revoke lifecycle. NO server
  change (attachment.url reused; CORS-OPEN verified). Alternative considered: a backend blob-proxy — REJECTED as
  unnecessary (CORS empirically open; a proxy adds server scope + load for no benefit).
- **Data model:** Dexie IndexedDB v4 (client-only) — 1 new table cachedAttachmentBlobs (Blob storage). **HIGHEST-RISK
  (head-builder gate, RULE 11):** `.version(4).stores()` MUST re-state ALL 7 prior tables verbatim
  (channels/messages/outbox/dmConversations/dmMessages/cachedAssignments/cachedScheduledSessions) — omitting one DELETES it.
- **NEW hazards:** binary Blob-in-IDB; object-URL create/REVOKE (leak); per-item size cap (unbounded IDB); presigned 1h TTL (cache at VIEW time).
- **API/deps:** none.

## Plan (file-level steps, per-spec commits)

### B-2 Backend — SKIP (no server change; reuses attachment.url presigned GET, CORS-OPEN)

### B-3 Frontend — the whole feature (executor: react-specialist)
**Step 3a — SEED a1b9b06b (substrate), commit `feat(sync): ... task a1b9b06b`:**
- `apps/web/src/features/sync/db.ts` — StudyHallDB v4: add cachedAttachmentBlobs ('id, cachedAt' or 'id'); `.version(4).stores()` re-states all 7 prior tables VERBATIM (rule 11). Keep v1-v3 blocks.
- `apps/web/src/features/sync/types.ts` — CachedAttachmentBlob (id, blob: Blob, contentType, filename, sizeBytes, cachedAt).
- `apps/web/src/features/sync/cache.ts` — getCachedAttachmentBlob(db, id) → record|undefined; putCachedAttachmentBlob(db, record) → stamps cachedAt, SKIPS if sizeBytes > MAX_CACHED_BLOB_BYTES (10 MiB precedent, single const).
- tests (fake-indexeddb): v3→v4 (+full) preservation of all 7 prior tables' ROWS; Blob put→get round-trip (bytes readable); size-cap skip.

**Step 3b — SIBLING 83aa28e4 (message image-attachment offline), commit `feat(messaging): ... task 83aa28e4`:**
- Add a `CachedAttachmentImage` component (or `useCachedAttachmentImage(attachment)` hook) in the messaging shell: renders an <img>; ONLINE → src=attachment.url AND on successful load/view fetch(attachment.url).blob() → putCachedAttachmentBlob (cap-respecting, at VIEW time while presigned URL fresh); OFFLINE or url-fetch-fail → getCachedAttachmentBlob(attachment.id) → URL.createObjectURL → src; REVOKE the object URL on unmount / src-change (mirror MessageComposer.tsx:343/374/505). Never-cached offline → graceful placeholder.
- Wire it into BOTH message-attachment render sites: the inline thumbnail (`apps/web/src/shell/MessageList.tsx:439`) AND the lightbox (`:467`), across a message's 0-N image attachments (AttachmentList :496). IMAGE only (contentType image/*); non-image FileChip (:478) unchanged.
- tests: online → blob written through; offline → renders from cached object-URL; oversized skipped; object-URL revoke on unmount; never-cached → placeholder.

### Specialist routing (AGENTS.md validated)
- react-specialist — B-3 executor (React + Dexie/Blob/object-URL frontend). Substrate (3a) THEN wire-in (3b) — hard dependency.

## Parallelization map
Serial: 3a substrate → 3b wire-in (dependency). Single specialist, 2 commits (one per task_id).

## Self-consistency sweep
1. Every AC → step (seed→3a; 83aa28e4→3b). ✓  2. Specialist assigned. ✓  3. No file in 2 batches (serial). ✓
4. design_gap_flag false. ✓  5. Arch delta named (client-cache-on-view vs proxy trade-off). ✓  6. Data model concrete (v4 restate risk flagged); no API change. ✓  7. No deps. ✓  8. SDK n/a. ✓
Sweep clean. Multi-spec commit hygiene: one commit per task_id.
