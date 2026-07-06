# Wave 64 — P-4 Verdict

**Reviewer:** head-product (fresh spawn, agentId head-product-wave64-p4-a1)
**Reviewed against:** process/waves/wave-64/blocks/P/review-artifacts.md
**Attempt:** 1  (first gate)
**Phase:** 1 (head-product)

## Verdict
APPROVED

## Rationale
This wave caches previously-viewed message image-attachment bytes offline — the "previously-loaded media" clause of the M12 offline-first moat metric, correct founder-directed slice, and correctly sequenced (media before conflict-resolution, the last remaining metric clause). The P-block is sound on every hazard this bundle introduces, which is the bar for the most complex M12 bundle. (1) RULE 11 v4 migration-safety is a hard, binary, tested AC: seed AC #2 requires `.version(4).stores()` to re-state all seven prior tables verbatim (named individually) plus cachedAttachmentBlobs, preserves the v1/v2/v3 blocks, and mandates a v3→v4 AND full v1→v4 upgrade test asserting all prior tables AND their rows survive — the row-survival guard against irreversible data-loss on the shipped M4+bundle-#1/#2 stores is explicit and falsifiable. (2) Object-URL revoke is a standalone explicit AC (sibling AC #3): every createObjectURL is paired with revokeObjectURL on unmount / src-change / blob-replace, mirroring the MessageComposer:343/374/505 precedent, "no object URL leaked," with a revoke-on-unmount test enumerated — the memory-leak class is closed, not deferred. (3) The cache-on-view / presigned-1h-TTL correctness model is specced precisely (sibling AC #1: fetch-and-cache at view time while the URL is fresh, cannot re-fetch expired offline; edge-case covers the fresh-DTO re-stamp path). (4) The per-item 10 MiB size cap (single const, skip-no-throw) applied per-attachment across 0-N bounds unbounded IndexedDB growth — no eviction is the correct thin self-use-mvp scope, not a gap. (5) The REFRAME is sound: descoping the assignment leg was correct because assignment attachments have no online byte-render surface (paperclip badge + filename chips only), so "wire offline rendering" would silently require building a net-new online open surface — a genuine false-present premise, correctly re-homed to a deferred M12 candidate with the online-surface prerequisite named; the CORS resolution is empirically verified open on prod (not assumed), so the no-proxy client cache-on-view path is legitimate. (6) Both byte-sites are covered (thumbnail :439 AND lightbox :467), with image-only scope and non-image FileChip explicitly unchanged, per-attachment across AttachmentList 0-N. (7) All ACs are independently verifiable, empty/offline/error/never-cached states are all specified, the floor-waiver rests on the established infra-reuse lineage plus the reframe reduction (resolve-by-rule, sound), and no-server-change is correct. The P-3 plan reuses the locked Dexie substrate + read-through + MessageComposer object-URL pattern rather than inventing a parallel path, and explicitly considered-and-rejected a backend blob-proxy for a defensible reason — no architecture-blind path, no gold-plating, no new infra. All three P-0 reviewers (problem-framer REFRAME→PROCEED, ceo-reviewer PROCEED HOLD-SCOPE, mvp-thinner OK) are present and reconciled, no open escalations carried in. No auth/session/cookie/rate-limit/user-creation surface is touched (client-side cache of already-authorized presigned GETs), so the tightened security gate does not apply. Every P-4 stage-exit checkbox ticks from a concrete artifact; design_gap_flag=false is correct. Proceed to Phase 2.

## Rework instructions  (only if REWORK)
n/a

## Escalation  (only if ESCALATE)
n/a

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 2

---
## Phase 2 — Karen + jenny + Gemini (merged) — GATE PASSED
- **karen (abd584cd38e3a4d82): APPROVE** — 8/8 claims VERIFIED. Dexie v3 (db.ts:127-135) 7 tables; both render sites (MessageList:439 thumbnail/:467 lightbox/:478 FileChip/:496 AttachmentList); AttachmentRef DTO w/ contentType (messaging.ts:11-18); object-URL create+revoke (MessageComposer:343/374/505); MAX_ATTACHMENT_BYTES 10MiB (:51); CORS-open coherent; rule-11 migration AC hard; 10e7543f descoped (parent NULL). **FIXED (was WRONG):** fabricated sibling task_id 83aa28e4-431f-...-000000000000 in the spec YAML → corrected to the real 83aa28e4-af9d-43d9-92c5-1066d3de768d. **EXACT v3 7 lines for v4 verbatim restate:** messages/channels/outbox/dmConversations/dmMessages/cachedAssignments 'id, serverId'/cachedScheduledSessions 'id, serverId, windowKey'.
- **jenny (ad561a4bc3428a025): APPROVE** — all 5 items MATCH (mirrors bundle #1/#2 pattern; media = the metric clause; design_gap_flag=false; coverage-first honesty; descope = genuine prerequisite gap, study-group confirmed no persisted surface). FIXED: study-group→media pivot now appended to product-decisions.md (was the one Low decision-log staleness finding).
- **Gemini:** see P-4-gemini-review.md (UNAVAILABLE=degradable non-block).
## B-block carry-forwards (binding)
1. Dexie v3→v4:  = the 7 v3 lines above VERBATIM + cachedAttachmentBlobs; keep v1-v3 blocks. Test asserts v3→v4 (+full) preserves prior ROWS. head-builder byte-compares. RULE 11 (BUILD-PRINCIPLES #11), 3rd application.
2. Cache-on-view: fetch+store bytes AT VIEW TIME while presigned URL fresh (1h TTL); can't re-fetch expired offline.
3. Object-URL create + REVOKE on unmount/src-change (MessageComposer:343/374/505 pattern; explicit AC — leak hazard). VERIFY revoke genuinely wired on unmount.
4. Per-item size cap (MAX_CACHED_BLOB_BYTES=10MiB, single const, skip oversized no-throw). IMAGE-only; non-image FileChip unchanged.
5. BOTH byte-sites (thumbnail :439 + lightbox :467); per-attachment across 0-N.
6. claimed_task_ids = [a1b9b06b, 83aa28e4-af9d-43d9-92c5-1066d3de768d] (sibling id corrected).
GATE PASSED → design_gap_flag=false → B-0.
