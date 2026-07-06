# V-1 Karen — wave-64 reality verification

**Wave:** 64 — offline cache for message attachment media (M12 offline moat #3)
**Merge commit:** `1744de85bc0e29b27f654800c7877cc9a4b7000f` (main, HEAD confirmed at this SHA)
**Deploy:** https://web-production-bce1a8.up.railway.app — HTTP 200 (verified live)
**Scope of this review:** claim-truth in the merged/deployed state (files/exports/migration/wire-in/deploy exist and are real). Spec-conformance is jenny's lane, not mine.

## VERDICT: APPROVE

Every load-bearing claim in the wave claim set is TRUE against the repo at the merge commit and the deploy. No claimed-but-fake artifacts, no decorative tests, no undocumented deferrals. The rule-11 (Dexie cumulative-declarative) highest-value claim holds and is backed by a row-survival test, not a table-existence test. The one descoped leg (assignment-media, task `10e7543f`) is correctly absent per the documented P-0 descope.

---

## Findings (per claim)

### Claim 1 — Dexie v4 substrate (rule-11 verbatim re-statement) — CONFIRMED
- `apps/web/src/features/sync/db.ts:154-163` has `this.version(4).stores({...})` with EXACTLY 8 tables: `messages`, `channels`, `outbox`, `dmConversations`, `dmMessages`, `cachedAssignments`, `cachedScheduledSessions` (all 7 v3 tables) + new `cachedAttachmentBlobs: 'id, cachedAt'`.
- The 7 prior tables are re-stated VERBATIM: comparing `db.ts:155-161` (v4 block) against `db.ts:130-136` (v3 block) — every index string is byte-identical (`messages: 'id, channelId, [channelId+createdAt], createdAt'`, `outbox: '++id, channelId, idempotencyKey, state, [state+createdAt]'`, `cachedScheduledSessions: 'id, serverId, windowKey'`, etc.). No table dropped, no index drift.
- The v3 block (`db.ts:129-137`) is still present and unchanged — v1 (`db.ts:77-81`), v2 (`db.ts:101-107`), v3 (`db.ts:129-137`) all intact; v4 is purely additive.
- Table property declared on the class: `cachedAttachmentBlobs!: EntityTable<CachedAttachmentBlob, 'id'>` at `db.ts:43`.
- **Verdict: TRUE.** The highest-value claim is real.

### Claim 2 — CachedAttachmentBlob type — CONFIRMED
- `apps/web/src/features/sync/types.ts:109-122` exports `type CachedAttachmentBlob` with EXACTLY the 6 required fields: `id: string` (110-111), `blob: Blob` (112-113), `contentType: string` (114-115), `filename: string` (116-117), `sizeBytes: number` (118-119), `cachedAt: string` (120-121).
- Imported and used by both `db.ts:26` and `cache.ts:19`.
- **Verdict: TRUE.**

### Claim 3 — Cache helpers + 10 MiB cap — CONFIRMED
- `apps/web/src/features/sync/cache.ts:265-270` exports `getCachedAttachmentBlob(store, id)` → `store.cachedAttachmentBlobs.get(id)`.
- `cache.ts:280-290` exports `putCachedAttachmentBlob(store, record)`.
- `cache.ts:259` `export const MAX_CACHED_BLOB_BYTES = 10 * 1024 * 1024;` (10 MiB).
- Over-cap SKIP (no throw): `cache.ts:284` `if (record.sizeBytes > MAX_CACHED_BLOB_BYTES) return;` — early return, no exception. Confirmed silent skip.
- Mirrors MessageComposer's upload-side cap: `apps/web/src/shell/MessageComposer.tsx:51` `const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;` — identical value. The "mirroring" claim is literally true.
- **Verdict: TRUE.**

### Claim 4 — Render hook exists + object-URL lifecycle — CONFIRMED
- `apps/web/src/shell/useCachedAttachmentImage.ts` EXISTS (133 lines).
- Online path: `useCachedAttachmentImage.ts:66` sets `{ kind: 'url', src: attachmentUrl }` (presigned URL), then `.ts:72-89` fires best-effort `fetch(attachmentUrl)` → `putCachedAttachmentBlob(db, {...})` write-through with errors swallowed (`.catch(() => {})` at 86-88).
- Offline/fail path: `.ts:92-114` `.catch` → `getCachedAttachmentBlob(db, attachmentId)` (100) → `URL.createObjectURL(cached.blob)` (103) → `{ kind: 'objectUrl', src: objUrl }` (105); `unavailable` when no blob (107).
- Revoke on src-change: `.ts:59-63` (top of effect body, revokes prior `objectUrlRef.current` before re-render).
- Revoke on unmount: `.ts:116-123` (effect cleanup return, revokes `objectUrlRef.current`).
- grep confirms BOTH paths: `revokeObjectURL` at `ts:61` (src-change) and `ts:120` (cleanup); `createObjectURL` at `ts:103`.
- **Verdict: TRUE.** Both a cleanup path and a src-change revoke path exist.

### Claim 5 — Wire-in to MessageList AttachmentRender — CONFIRMED
- `apps/web/src/shell/MessageList.tsx:50` imports `useCachedAttachmentImage`.
- `AttachmentRender` (`MessageList.tsx:416-497`) calls the hook at `.tsx:427` `const cachedImageState = useCachedAttachmentImage(attachment);` (unconditionally, respecting rules-of-hooks).
- Image thumbnail uses hook src: `.tsx:437` `const imageSrc = cachedImageState.src;` → `<img src={imageSrc}>` at `.tsx:453`.
- Lightbox uses same hook src: `.tsx:479` `<ImageLightbox src={imageSrc} ...>`.
- Image-only gate: `.tsx:423` `const isImage = isImageType(attachment.contentType);` with `isImageType` = `contentType.startsWith('image/')` (`.tsx:199-201`); hook output only consumed inside `if (isImage)` block (429-487).
- Non-image FileChip path unchanged: `.tsx:490-496` returns `<FileChip>` with `url={attachment.url}` for non-images — no hook involvement.
- `unavailable` state falls through to broken-image chip: `.tsx:431-434`.
- **Verdict: TRUE.**

### Claim 6 — Tests present AND real (not decorative) — CONFIRMED
`apps/web/src/features/sync/attachment-blob-cache.test.ts` (461 lines):
- v3→v4 ROW survival (not table existence): test `'all seven v3 table rows survive the v3→v4 migration'` (`.test.ts:242-387`) seeds one row into EACH of the 7 prior tables (channels 250, messages 259, outbox 272, dmConversations 282, dmMessages 290, cachedAssignments 300, cachedScheduledSessions 311), closes db1, re-opens db2 on the SAME `IDBFactory`, and asserts each ROW's field values survive: `channel?.name` (344), `message?.content` (348), `outboxItems` length+state+content (356-358), `dmConv?.isGroup` (363), `dmMsg?.content` (367), `asgn?.title` (373), `sess?.title`+`windowKey` (377-379). These are ROW-content assertions, NOT decorative table-existence checks. New v4 table asserted empty/cold (382-383).
- Second test `'v4 blob table accepts writes after upgrade without corrupting v1+v2+v3 rows'` (389-460) writes to the new table and re-asserts prior rows unchanged.
- Size-cap load-bearing: `.test.ts:175-188` asserts over-cap `getCachedAttachmentBlob` returns undefined; `.test.ts:190-202` asserts oversized put `resolves.toBeUndefined()` (no throw); exact-cap stored (158-173); constant value asserted (154-156).

`apps/web/src/shell/attachment-image-cache.test.tsx` (354 lines):
- Offline object-URL render: `.test.tsx:167-189` fetch-reject + cached blob → asserts `URL.createObjectURL` called with the blob (183) and `img[src="blob:test-object-url"]` present (187-188).
- Revoke-on-unmount: `.test.tsx:210-235` → `unmount()` (232) → asserts `URL.revokeObjectURL` called with the object URL (234).
- Revoke-on-src-change: `.test.tsx:237-306` swaps attachment id via rerender → asserts `URL.revokeObjectURL` called with the PREVIOUS url `'blob:object-url-1'` (304).
- Write-through, never-cached placeholder, and non-image FileChip passthrough also covered (142-163, 192-207, 309-353).
- **Verdict: TRUE.** Assertions are real and target row survival + object-URL lifecycle, not existence theater.
- **Note (not a defect):** the "full v1→v4" upgrade in these tests opens a FRESH IDB and lets Dexie run all migrations at once on an empty store — it does not persist a genuinely v3-shaped store and then upgrade in place. This is a known limitation of testing Dexie migrations with a single instance; the v3→v4 test does exercise a real close/re-open cycle on a shared factory, which is the meaningful upgrade path. Row-survival intent is satisfied. Flagging for jenny/T-block awareness; does not affect claim truth.

### Claim 7 — Deploy hash + api untouched — CONFIRMED
- Deploy live: `curl` https://web-production-bce1a8.up.railway.app/ → `HTTP 200`, `server: railway-hikari`, serves `index.html` (888 bytes, Vite SPA shell). Trusting C-2's SUCCESS@1744de8 + this independently-observed HTTP 200 for the "serves merge commit" claim (the SPA shell does not embed the git SHA, so byte-level SHA match is not directly observable from the response; C-2 monitor is the authoritative source per monitor-principles).
- api untouched: `git show --name-only 1744de8` matches ZERO `apps/api` files (`grep -c apps/api` = `0`). The 7 changed files are all under `apps/web/`: `cache.ts`, `db.ts`, `types.ts`, `MessageList.tsx`, `attachment-image-cache.test.tsx`, `useCachedAttachmentImage.ts`, `attachment-blob-cache.test.ts`. No-server-change claim verified directly from the diff.
- **Verdict: TRUE.**

### Descope check — assignment-media leg (task 10e7543f) — CORRECT ABSENCE
- No assignment-media files in the diff. Per the prompt this leg was DESCOPED at P-0 (documented in `1e9aa9c docs(decisions): record M12 bundle-#3 study-group→media pivot + assignment-media descope`). Its absence is expected, not a missing-claim finding.

---

## Antipattern sweep
- **Claimed-but-fake:** none. Every claimed file, export, and constant exists at the cited line.
- **Decorative tests:** none. The rule-11 test asserts ROW content across all 7 tables after a close/re-open cycle; the lifecycle tests assert actual `createObjectURL`/`revokeObjectURL` call args. No table-existence-only theater.
- **Deferred-but-undocumented:** none. The only deferral (assignment-media) is documented in commit `1e9aa9c`.
- **Silent table drop (rule 11):** not present. All 7 prior tables re-stated verbatim in v4; v1/v2/v3 blocks intact.

## Handoff
- No REJECT items. No rework required for claim-truth.
- Minor advisory to jenny / head-tester (non-blocking): the "full v1→v4" migration test path opens a fresh store rather than persisting v3-then-upgrading; the v3→v4 close/re-open test is the load-bearing one and is sound. Consider a note in T-layer principles if a true persisted-old-version upgrade fixture is wanted in future waves.
