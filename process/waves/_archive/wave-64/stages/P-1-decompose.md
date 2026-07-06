# P-1 Decompose — wave-64 (M12 offline-media-blob bundle #3)

## Maximum size rubric — NO SPLIT
| Measure | Threshold | Estimate | Trips? |
|---|---|---|---|
| Files touched | >60 | ~8-12 (db.ts, cache.ts, types.ts + tests; MessageList/attachment render + a fetch-cache hook + tests) | no |
| New primitives | >60 | ~2 (1 Dexie blob table, 1 CachedAttachmentBlob type) + ~2 helpers | no |
| Net LOC | >5,000 | ~1200-1600 (blob substrate + object-URL wire-in + caps + tests) | no |
| Stage-4 working set | >350K | moderate | no |

## Wave type: multi-spec (claimed_task_ids.length == 2 after REFRAME descope: [a1b9b06b seed, 83aa28e4 message-attachment]).

## Minimum floor — TRIPPED (below 2,500 LOC multi-spec floor), WAIVED (override-ship, resolve-by-rule)
Multi-spec floor >2,500 LOC OR ≥6 specs; ~1200-1600 LOC / 2 specs trips. **Floor WAIVED** per the infra-reuse floor-exemption
lineage (product-decisions wave-21/50; applied for M12 bundles #1/#2 in waves 62/63). This wave EXTENDS the shipped
Dexie substrate (apps/web/src/features/sync) — the heavy lifting (Dexie singleton, migration discipline [now
BUILD-PRINCIPLES rule 11], read-through pattern, fake-indexeddb harness, object-URL pattern in MessageComposer) already
exists. The bundle was already REDUCED at P-0 (assignment leg descoped as a false-premise); expanding it back to hit
2,500 would contradict the reframe. All 3 P-0 reviewers scope-fenced (problem-framer round-2 PROCEED, ceo-reviewer
HOLD-SCOPE, mvp-thinner OK). Override-ship §2b(a), keep the 2-task bundle, resolve-by-rule (no BOARD).

## Verdict: PROCEED (floor-waived, 2-task multi-spec bundle)

## design_gap_flag
```yaml
design_gap_flag: false
missing_surfaces: []   # reuses existing message-attachment render surfaces (thumbnail + lightbox); offline serves cached bytes via object-URL — no new screen/mockup
```

## Carry-forward (to P-2/P-3/B)
- Rule 11 (BUILD-PRINCIPLES #11): Dexie v4 .version(4).stores() re-states ALL 7 prior tables verbatim + cachedAttachmentBlobs + preservation test [HIGHEST-RISK; 3rd application of the promoted rule].
- Cache-on-view AT VIEW TIME while presigned URL fresh (1h TTL); can't re-fetch expired offline.
- Object-URL create + REVOKE (MessageComposer.tsx:343/374 pattern; explicit AC — leak hazard).
- Size cap per-item (MAX_ATTACHMENT_BYTES=10MiB precedent); state image-only vs also-file.
- P-2: cover BOTH byte-sites (thumbnail MessageList:439 + lightbox :467); per-attachment cap across 0-N attachments.
- CORS-OPEN verified (no proxy needed).

## Footer
```yaml
wave_type: multi-spec
verdict: PROCEED
floor_merge_attempt: 0
siblings_created: []       # 10e7543f DESCOPED (re-homed to deferred M12 candidate at P-0 reframe)
design_gap_flag: false
```
