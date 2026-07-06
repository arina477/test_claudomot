# Wave 64 — B-6 Verdict

**Reviewer:** head-builder (fresh spawn, Phase 1)
**Reviewed against:** process/waves/wave-64/blocks/B/review-artifacts.md
**Attempt:** 1  (1 = first gate)

## Verdict
APPROVED

## Rationale

This is an ADD-only, frontend/sync-only wave (B-1/B-2 correctly skipped — no shared/API/DTO shape change; the server attachment.url is reused). I verified all three named hazards directly at source rather than trusting the stage claims, and independently re-ran the full verification suite. Every claimed green is real.

**Hazard 1 — Dexie v3→v4 migration byte-compare (RULE 11 / offline-first data-loss door): PASS.** `apps/web/src/features/sync/db.ts` `.version(4).stores()` (lines 154-163) re-states all SEVEN v3 tables byte-for-byte identical to the v3 block (lines 129-137): `messages: 'id, channelId, [channelId+createdAt], createdAt'`, `channels: 'id, serverId'`, `outbox: '++id, channelId, idempotencyKey, state, [state+createdAt]'`, `dmConversations: 'id, createdAt'`, `dmMessages: 'id, conversationId, [conversationId+createdAt], createdAt'`, `cachedAssignments: 'id, serverId'`, `cachedScheduledSessions: 'id, serverId, windowKey'` — verbatim, zero omissions — plus the new `cachedAttachmentBlobs: 'id, cachedAt'`. The v1 (line 77), v2 (line 101), and v3 (line 129) blocks are all still present. No startup auto-migrate (Dexie cumulative-declarative, applied lazily on open). The named exit-criterion preservation test (`attachment-blob-cache.test.ts:242`) seeds a row into all seven pre-v4 tables, opens a second connection at v4, and asserts every row survives intact; a companion coexist test writes to the new v4 table and confirms the pre-v4 rows are unchanged. **The v4 7-table byte-compare passed.**

**Hazard 2 — object-URL leak (the key hazard): revoke-on-unmount is genuinely present.** `apps/web/src/shell/useCachedAttachmentImage.ts` owns each created URL in `objectUrlRef`. Every `URL.createObjectURL` (line 103) is paired: the useEffect cleanup (lines 116-123) revokes on unmount, and the effect body (lines 60-63) revokes any prior URL on src-change, with the effect keyed on all five attachment fields (id/url/contentType/filename/sizeBytes). The test suite asserts `revokeObjectURL` fires on unmount (`attachment-image-cache.test.tsx:234`) AND on id/src change (line 304), with `createObjectURL` returning sequential URLs to prove the correct prior URL is revoked. No leak path remains.

**Hazard 3 — size cap + cache-on-view + image-only + both sites: PASS.** `MAX_CACHED_BLOB_BYTES = 10 * 1024 * 1024` is a single const (cache.ts:259); `putCachedAttachmentBlob` skips (no-op, no-throw) when `sizeBytes > cap` (line 284), covered by exact-at-cap-stored / one-byte-over-not-stored / oversized-no-throw tests. Write-through fetches at view time inside the effect (presigned 1h TTL), is non-blocking, and swallows errors (`.catch(() => {})`); offline reads from `getCachedAttachmentBlob`. Scope is IMAGE-only via the `isImageType` gate in AttachmentRender — non-image attachments fall through to the unchanged FileChip; never-cached-offline renders the broken-image placeholder chip. Both render sites use the resolved `imageSrc`: inline thumbnail (`MessageList.tsx:453`) and lightbox (`MessageList.tsx:479`).

**jsdom Blob deviation:** reasonable, not a masked defect. jsdom's structured-clone reconstructs Blob as `{}` (size/type getters absent), so the round-trip test asserts blob-present + `sizeBytes` scalar rather than `blob.size`/`blob.type`. Production browser IndexedDB round-trips Blobs fully; the object-URL creation path (`URL.createObjectURL(cached.blob)`) is exercised in the offline-render test. Documented deviation, accepted.

**No regression + no over-engineering:** independently re-ran — web `tsc --noEmit` exit 0; full web vitest 539/539 across 35 files; biome ci clean on all 7 touched files. The two attachment test files contribute 19 tests (12 substrate + 7 wire-in). No new scale infra, no premature abstraction — a single 10 MiB const, no config knob, ADD-only against the existing AttachmentRender. Online image rendering and channel/DM/attachment behavior untouched.

**Commit hygiene (multi-spec):** clean. `e64a504` cites task a1b9b06b and touches only substrate files (db.ts / cache.ts / types.ts + substrate test); `6522847` cites task 83aa28e4 and touches only wire-in files (useCachedAttachmentImage.ts / MessageList.tsx + wire-in test). No commit spans both spec blocks; each claimed task_id has exactly one commit.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 2
