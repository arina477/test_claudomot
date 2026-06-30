# Wave 20 — P-4 Verdict

**Reviewer:** head-product (fresh spawn, P-4 Phase-1 gate)
**Reviewed against:** process/waves/wave-20/blocks/P/review-artifacts.md
**Attempt:** 1  (first gate)
**Phase:** 1 (head-product)

## Verdict
APPROVED

## Rationale
Wave-20 is the first M4 wave — the offline-send spine that is the founder's differentiating wedge (offline-first vs Discord/Teams/Notion). The seed reframe is correct and load-bearing: I verified directly against `apps/api/src/messaging/messages.service.ts` that (a) server message idempotency ALREADY EXISTS — `createMessage` runs `INSERT ... onConflictDoNothing({ target: [channel_id, idempotency_key] })` with replay re-fetch (~L485-536), so the plan correctly does NOT rebuild it (lock-test + document only); (b) the optional-key gap is real — `idempotency_key IS NULL` never dedups (NULLs not equal in a UNIQUE index, L487-488/519-535), so binding the key for the outbox path is genuine hardening; and (c) the forward `?after=` keyset cursor is genuinely absent — `listMessages` is backward-only `created_at DESC` throughout (L1355-1540) while `listThreadReplies` is the forward-ASC `created_at > cursor` keyset with `canViewChannelById` authz (L1139-1205), exactly the pattern the plan reuses. The exactly-once + in-order reconnect-replay is correctly the gating AC, with task e29f6566 explicitly the fake-indexeddb proof (sequential oldest-first drain + idempotent replay via the existing ON CONFLICT + partial-drain resume + no-data-loss). The new `?after=` route is a channel-authz boundary and is correctly flagged for a B-6 Phase-2 non-member 403 negative-path test (BUILD rule 4). The Dexie SDK research is sound (store shape, per-test IDBFactory isolation, sequential drain, no-await-in-txn gotcha) and deps are client-side (no founder ask). mvp-thinner's spine-vs-UI split is clean (connection-state indicator + pending/failed UI + catch-up-history UI deferred to a 2nd M4 wave) and design_gap=FALSE is correct (no new design surface — M3 optimistic pending/failed states already exist). Gold-plating is correctly excluded (CRDT/conflict-resolution, background-sync service-worker, offline-for-all-entities, multi-device sync all OUT). Every AC maps to a file-level B-stage step; all four specialists (typescript-pro, backend-developer, react-specialist, frontend-developer) are valid catalog agents.

## Stage-exit checklist (all ticked from artifact)
- **P-0 Frame:** root cause = the offline-first wedge (not a symptom); one live milestone cited (M4 eb2a1688); falsifiable signal = exactly-once + in-order, fake-indexeddb-proven; problem-framer REFRAME + ceo PROCEED + mvp-thinner OK all present and reconciled into "PROCEED with seed reframe." ✓
- **P-1 Decompose:** seed + 3 siblings all load-bearing (drop any → exactly-once collapses); UI/catch-up-history split to 2nd M4 wave; no out-of-bundle dependency (builds on shipped M3). ✓
- **P-2 Spec:** ACs enumerated + independently verifiable per task; edge cases specified (offline send, partial drain, replay dedup, malformed/HEAD cursor, IDB-unavailable private mode); non-goals explicit; `?after=` authz surface flagged for the tightened gate / rule-4 403 at B-6 Phase-2; spec embedded as YAML head of seed 92d85e0e `tasks.description`. ✓
- **P-3 Plan:** reuses locked architecture (listThreadReplies keyset, existing ON CONFLICT idempotency, existing optimistic outbox in useMessagesWithRetry); no unjustified infra (sequential drain not Promise.all, no Redis/multi-replica/billing); every AC → file step in the self-consistency sweep. ✓
- **Security-scope tightened gate:** `?after=` is channel-authz (canViewChannelById), reusing the existing session guard — it creates NO new auth/session/cookie/rate-limit/user-creation surface. The ≥2-Phase-2-iteration rule is NOT triggered; rule-4 403 coverage is correctly routed to B-6 Phase-2. ✓
- **Load-bearing claims (ratified against ground-truth, not inferred):** server idempotency EXISTS (messages.service.ts L485-536); optional-key gap real (L487-488); listMessages backward-only (L1355-1540); listThreadReplies forward-ASC keyset + authz is the reuse pattern (L1139-1205); encode/decodeCursor opaque base64 (L49-64); useMessagesWithRetry optimistic send with per-send idempotencyKey is the path the outbox backs (useMessages.ts L55-350). ✓

## Anti-patterns checked — none fire
- Symptom-framing: NO (reframe corrected the stale "no idempotency today" premise).
- Orphan wave: NO (the founder wedge / live M4).
- Decomposition bloat: NO (mvp-thinner OK; UI split out).
- Happy-path-only spec: NO (edge cases enumerated per task).
- Vague ACs: NO (each independently testable).
- Spec-vs-bet drift: NO (spine maps to the offline-first metric).
- Architecture-blind plan: NO (reuses keyset/idempotency/optimistic-outbox).
- Gold-plating at self-use-mvp: NO (CRDT/SW/multi-device explicitly OUT).

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 2
- next_action: PROCEED_TO_P-4_PHASE-2 (karen + jenny + Gemini cross-review)
- design_gap_flag: false → on full P-4 pass, hand off to B-0 (D-block SKIPS)

---
## Phase 2 final (appended by orchestrator)
| Reviewer | Verdict |
|---|---|
| karen | APPROVE — reframe (idempotency EXISTS, don't rebuild), forward-cursor gap+reuse (listThreadReplies ASC), optional-NULL-key insight, Dexie SDK, useMessages outbox-backing all VERIFIED. B-notes: (1) pick authz path for listMessagesAfter (ChannelMessageGuard decorator vs in-service canViewChannelById) + B-6 403 test targets it; (2) stable idempotency key ONCE-AT-ENQUEUE (existing client does randomUUID per-attempt — substance of 9a4ab31d). |
| jenny | APPROVE — 4-block spec MATCHES M4 ## Scope; spine-first split coherent (UI surfaces = 2nd M4 wave, metric reachable across 2 waves); reframe faithful to scope; CRDT/service-worker/multi-device OUT; dexie+fake-indexeddb named verbatim in scope; M4 correctly not claimed complete. |
| Gemini | UNAVAILABLE (no text, attempt 2) — degradable: passes on APPROVE/UNAVAILABLE, blocks only on material CONCERN. Degraded-pass. |

## Gate result: PASSED → B-block (design_gap_flag false → D SKIPS)
- B-block carries: (1) REFRAME — do NOT rebuild server idempotency (lock-test + forward ?after= cursor only); (2) forward cursor reuses listThreadReplies ASC/gt keyset; (3) rule-4 — new ?after= route channel-authz → B-6 Phase-2 non-member 403 test (pick the authz path per karen note 1); (4) exactly-once + in-order GATING AC proven via fake-indexeddb (sequential oldest-first drain + ON CONFLICT replay dedup); (5) stable idempotency key once-at-enqueue (karen note 2); (6) Dexie gotchas (no-await-in-txn, no schema downgrade, sequential drain, per-test IDBFactory); (7) OUT: connection-state/pending-UI/catch-up-UI (2nd M4 wave), CRDT/service-worker/multi-device.
- New deps: dexie@4 + fake-indexeddb@6 (client, no founder ask). SDK-doc: SDK-Docs/Dexie.
- Next: B-0 (branch + claim; no server schema — Dexie client schema in B-4).
