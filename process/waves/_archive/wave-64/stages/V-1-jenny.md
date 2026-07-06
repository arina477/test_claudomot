# V-1 jenny — wave-64 (M12 offline moat #3: message image-attachment media cache)

**Verdict: APPROVE**

Deployed prod (`https://web-production-bce1a8.up.railway.app`, api `api-production-b93e.up.railway.app`, bucket `t3.storageapi.dev`) matches the SPEC CONTRACT intent for both shipped specs. Probed live against Fixture Proof Server (`FP`) general channel; the message PNG attachment `corsprobe.png` (attachment id `ffc4f4c7-1e46-4bb8-b06b-12b1ea6b86ad`, object key uuid `93982063-…`, 70 bytes, image/png) was used as the live probe subject. No spec drift found. One methodology note and two non-blocking gap observations below.

Source of truth: DB `tasks.description` of seed `a1b9b06b-d4e4-47ac-bf55-4a51a520b612` (YAML head). Implementation cross-read: `apps/web/src/features/sync/db.ts`, `cache.ts`, `types.ts`, `apps/web/src/shell/useCachedAttachmentImage.ts`, `apps/web/src/shell/MessageList.tsx`.

---

## Evidence by acceptance criterion

### Spec A (a1b9b06b) — Dexie v4 blob substrate

- **A-AC1 v4 table + fields — PASS.** Deployed IndexedDB `studyhall` contains object store `cachedAttachmentBlobs`. A live cached row read back: `{id, blob(Blob 70B), contentType:"image/png", filename:"corsprobe.png", sizeBytes:70, cachedAt:"2026-07-06T13:11:44.090Z"}` — every spec field present, pk = attachment id. Source `db.ts:154-163` v4 `.stores({… cachedAttachmentBlobs:'id, cachedAt'})`.
- **A-AC2 RULE 11 restate all 7 prior tables — PASS (deployed observation).** Live `db.objectStoreNames` = `[cachedAssignments, cachedAttachmentBlobs, cachedScheduledSessions, channels, dmConversations, dmMessages, messages, outbox]` — all 7 prior tables present alongside the new one; no table was dropped by the v4 upgrade on a store that had pre-existing v1–v3 data (this session's DB was already populated with channels/messages before v4). `db.ts:154-163` restates all 7 verbatim. (Row-preservation across upgrade is a unit-test AC — Karen's lane; I confirm the deployed store set is intact.)
- **A-AC3 type + get/put helpers — PASS.** `CachedAttachmentBlob` type present (`types.ts:109-122`); `getCachedAttachmentBlob` (`cache.ts:265-270`) and `putCachedAttachmentBlob` stamping `cachedAt` (`cache.ts:280-290`) both exercised live — the live row carries a `cachedAt` stamped at view time.
- **A-AC4 per-item 10 MiB cap, skip-no-throw — PASS.** `cache.ts:259` `MAX_CACHED_BLOB_BYTES = 10*1024*1024` (single hardcoded const, no config knob); `cache.ts:283` `if (record.sizeBytes > MAX_CACHED_BLOB_BYTES) return;` — early no-throw skip before the `.put`. Matches AC.
- **A-AC5 fake-indexeddb tests — Karen's lane** (source-claim truth). Not re-run here.

### Spec B (83aa28e4) — serve message attachment media offline

- **B-AC1 cache-on-view write-through at 1h-TTL presigned URL, thumbnail + lightbox — PASS.** Online, the thumbnail `<img alt="corsprobe.png">` renders directly from the presigned URL with `X-Amz-Expires=3600` (1h TTL confirmed in the live URL). Merely viewing the channel wrote the Blob through: the `cachedAttachmentBlobs` row appeared with `cachedAt` == channel-open instant. Write-through fires in the parent hook's `fetch(attachmentUrl).then(...)` → `putCachedAttachmentBlob` (`useCachedAttachmentImage.ts:72-89`). Lightbox (`MessageList.tsx:477-484`) shares the parent-hook-resolved `imageSrc`, so both surfaces are served from one view-time resolution — consistent with "thumbnail AND lightbox" intent.
- **B-AC2 offline / fetch-fail → cached Blob via createObjectURL, not a broken remote img — PASS (deterministic + T-5 live).** Trigger mechanism (source `useCachedAttachmentImage.ts:92-114`) is proactive fetch-then-fallback: on `fetch` reject it calls `getCachedAttachmentBlob` → `URL.createObjectURL` → sets `{kind:'objectUrl'}`. I exercised the exact deployed path against the real cached Blob: `getCachedAttachmentBlob(ffc4f4c7…)` → `createObjectURL` produced a valid `blob:` URL that **decoded successfully** (`img.onload` fired). T-5 already confirmed the full offline render live end-to-end; this corroborates the byte-level mechanism.
- **B-AC3 object-URL lifecycle / revoke discipline — PASS.** Create at `useCachedAttachmentImage.ts:103`; revoke on src-change at `:59-62` and on unmount at `:116-123`. Instrumented `URL.createObjectURL`/`revokeObjectURL` on the deployed page across an offline lightbox open/close cycle: net leaked object URLs = **0** (`live:0`). My deterministic test also paired every create with a revoke cleanly.
- **B-AC4 image-only scope; non-image FileChip unchanged; per-attachment cap — PASS (source-confirmed).** Image branch and the non-image `FileChip` branch (`MessageList.tsx:489-496`) are separate; the chip path always uses the presigned URL directly, no cache logic — unchanged. Cap + cache apply per-attachment (`cache.ts:283` is per-record). The live fixture message carries a single image attachment, so multi-attachment mixing was verified by source, not live DOM.
- **B-AC5 never-viewed image offline → graceful placeholder, no crash/spinner — PASS.** Against the deployed store, `getCachedAttachmentBlob('00000000-…')` returns `undefined` → hook sets `{kind:'unavailable'}` (`useCachedAttachmentImage.ts` else-branch). During the offline period, zero JS exceptions / unhandled rejections were thrown — all console errors were benign `ERR_INTERNET_DISCONNECTED` network failures (API `/servers`, `/me`, socket.io polling, PWA icons, and my own injected `does-not-exist.png` probe); the `.catch()` swallows fetch failure gracefully. No crash, no infinite spinner.

### Contract conformance / journey continuity
- **Online happy path not degraded — PASS.** After a full offline→online round-trip, the channel reloads and the thumbnail renders normally from the presigned URL (`complete:true`, non-blob). No lingering broken state; app returns to `Online`, 0 console errors.
- **No UX dead-end — PASS.** Lightbox opened and closed cleanly offline (dialog mounts/unmounts, Esc closes); no broken `<img>`, no leaked object URL, no stuck spinner.

---

## Non-blocking observations (spec gaps, NOT drift)

1. **GAP (pre-existing, out of wave-64 scope): the offline-serve branch cannot be reached via in-app channel navigation while offline, because the channel *message view itself* does not hydrate offline.** When I navigated Home→server→channel while `setOffline(true)`, the content pane stayed on "Pick a channel / Select a channel from the sidebar" — the channel view depends on a live API call to hydrate, so the attachment message never mounts offline through that path. The offline-serve code is correct and reachable on an already-mounted attachment that loses connectivity (T-5's live path); but a cold offline navigation to the channel won't surface it. This is a broader offline-hydration limitation of the message surface (channel/message hydration), not a defect in the wave-64 attachment code, and is outside both specs' scope (specs assume the message is on-screen). Flagging for M12 continuity: the "previously-loaded media" promise is only fully realized if the *channel* is also offline-navigable. Recommend @head-verifier note for the M12 conflict-resolution/remaining-metric planning, not a wave-64 blocker.

2. **GAP (spec silent, benign): lightbox reuses the parent hook's resolved src rather than resolving independently.** Spec B-AC1 lists thumbnail (`:439`) and lightbox (`:467`) as two cache-on-view surfaces; the implementation resolves once in the parent `MessageAttachment` hook and passes `imageSrc` to `<ImageLightbox>`, so the lightbox does not run its own `fetch`/offline-fallback. In practice this is *better* (one write-through, no double-fetch) and both surfaces render from the single resolved src, satisfying intent. No user-visible defect. Noting only because a strict reading of "both … cache-on-view" could imply two independent resolutions.

## Methodology note (my own, corrected)
My initial offline UI re-mount attempts appeared to show the attachment "missing offline"; root cause was a **test-navigation error** — I was clicking the collapsible **"General" category header** (`MessageList` sidebar section) instead of the **channel row** (`aria-label="general channel, 50 unread mentions"`), so the channel never loaded. Once corrected, online render and cache behavior were as specified. No app defect implied by that detour.

---

## Files (absolute)
- Spec source of truth: DB `tasks.description`, seed `a1b9b06b-d4e4-47ac-bf55-4a51a520b612` (pointer copy `/home/claudomat/project/process/waves/wave-64/stages/P-2-spec.md`)
- `/home/claudomat/project/apps/web/src/features/sync/db.ts:154-163` (v4 schema, 7-table restate)
- `/home/claudomat/project/apps/web/src/features/sync/cache.ts:259,265-270,280-290` (const + get/put + cap skip)
- `/home/claudomat/project/apps/web/src/features/sync/types.ts:109-122` (CachedAttachmentBlob)
- `/home/claudomat/project/apps/web/src/shell/useCachedAttachmentImage.ts:59-62,72-114,116-123` (write-through, offline fallback, object-URL lifecycle)
- `/home/claudomat/project/apps/web/src/shell/MessageList.tsx:439-484,489-496` (thumbnail, lightbox, non-image FileChip)

Descoped assignment-attachment leg (10e7543f) correctly ABSENT — not flagged.
