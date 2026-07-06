# Wave 65 — L-block observations ledger

Append-only. L-2 Distill (karen) reads these; promotes to `*-PRINCIPLES.md` ONLY when an
observation recurs across 2+ waves AND head-verifier approves (max 1 rule/file/wave). Single-wave
observations stay here until a second wave confirmed.

---

## L-2 synthesis observations (knowledge-synthesizer)

Inputs read: process/waves/wave-65/stages/ full artifact set (P-0-frame, P-0-problem-framer,
P-0-ceo-reviewer, P-0-mvp-thinner, P-1-decompose, P-2-spec, P-3-plan, P-4-gemini-review,
P-4-jenny, P-4-karen, B-0-branch-and-schema, B-1-contracts, B-2-backend, B-3-frontend,
B-4-wiring, B-5-verify, B-6-review, B-6-review-output, B-6-refix-verify, C-1-pr-ci-merge,
C-2-deploy-and-verify, T-5-e2e, V-1-karen, V-1-jenny, V-1-summary, V-2-triage, V-3-fast-fix).
Gate verdicts checked: process/waves/wave-65/blocks/{P,B,T,V}/gate-verdict.md (all gates
APPROVED; 2 High findings fixed pre-merge; V-2 triage 0 blocking; V-3 Phase 2 skipped).
Prior archives consulted: process/waves/_archive/wave-{60,61,62,63,64}/blocks/L/observations.md
(recurrence checks on all standing HOLDs plus new signal candidates from this wave).
Principles files read: PRODUCT-PRINCIPLES.md (5 rules), BUILD-PRINCIPLES.md (11 rules),
VERIFY-PRINCIPLES.md (4 rules), CI-PRINCIPLES.md (10 rules).

---

- **[obs-1 — REINFORCEMENT: PRODUCT-PRINCIPLES rule 1 (verify seed code-absence claims at P-0)
  applied correctly; this wave is its 3rd documented explicit firing; ceo-reviewer independently
  flagged it as a candidate lesson; no new rule warranted]**

  Source artifacts:
  - process/waves/wave-65/stages/P-0-problem-framer.md (verdict REFRAME round 1: verified in code
    that `useMessages.ts:299-316` already ships the message-list Dexie fallback; false-absent
    premise confirmed absent; fix relocated upstream to `ServerContext.tsx`)
  - process/waves/wave-65/stages/P-0-ceo-reviewer.md (§Guardrail note: "this reframe is itself a
    PRODUCT-PRINCIPLES rule-1 datapoint"; "the seed nearly scoped a re-do of shipped code")
  - process/waves/wave-65/stages/P-0-frame.md (§Reframe: "message-list Dexie fallback ALREADY
    ships: `useMessages.ts:299-316` `.catch → getCachedMessages`"; §Carry-forward: "ceo-reviewer
    flagged — decomposition ritual should code-verify 'no fallback exists' claims before seeding")

  Severity: informational

  Candidate principles file: reinforcement only — already PRODUCT-PRINCIPLES rule 1. Rule 1 reads
  "Verify every seed claim about what exists or is absent in the code at P-0; decomposer prose
  drifts both ways." This wave is a live application of the rule's "false-absent" branch (a claim
  that a fallback did not exist when it did). The ceo-reviewer's carry-forward note suggests the
  decomposition ritual (brain-owned) could also carry the check, but that is a brain template
  concern, not a new project-principles rule. The project-side principle that covers this class
  is already in force.

  Recurrence: CONFIRMED-BY-APPLICATION (wave-61 obs-1, wave-64 obs-4, wave-65 obs-1 — three
  explicit documented firings of rule 1 in the "code absence claim falsified at P-0" class).
  Promotion flag: NO — rule 1 already in force; no new rule warranted.

---

- **[obs-2 — REINFORCEMENT: BUILD-PRINCIPLES rule 11 (Dexie cumulative-declarative v(N+1) restate)
  applied correctly for its 4th consecutive application (v4→v5, 8 prior tables); rule functioning
  correctly; no new gap]**

  Source artifacts:
  - process/waves/wave-65/stages/V-1-karen.md (§Finding 1: "v4 block at `db.ts:158-167` is
    unaltered; each of the first 8 store lines in v5 (`db.ts:184-191`) is character-identical to
    the v4 lines (`db.ts:159-166`). No prior table dropped." Plus: independently byte-compared v4
    and v5 store blocks.)
  - process/waves/wave-65/stages/V-1-jenny.md (AC6: "10 object stores present: the 8 prior v4
    tables ... PLUS cachedServers + cachedServerDetails. Source `db.ts` `.version(5).stores()`
    restates all 8 verbatim; `server-cache.test.ts` asserts a v4→v5 (and v1→v5) upgrade preserves
    every prior table's ROWS.")
  - apps/web/src/features/sync/db.ts:183-193 (v5 schema block; v4 block at :158-167 preserved)
  - apps/web/src/features/sync/server-cache.test.ts:324-482 (v4→v5 row preservation test seeding
    all 8 prior tables + a full v1→v5 chain; asserts field-level row content)

  Severity: informational (rule 11 in force and correctly applied for the 4th consecutive M12
  bundle: v1→v2 wave-62, v2→v3 wave-63, v3→v4 wave-64, v4→v5 wave-65; no override friction;
  each application at higher amplitude than the last).

  Candidate principles file: none — BUILD-PRINCIPLES rule 11 already promoted at wave-63.
  Recurrence: 4th consecutive clean application. Rule functioning as designed.
  Promotion flag: NO — rule 11 already in force.

---

- **[obs-3 — FIRST INSTANCE (informational): B-6 /review caught two High-severity concurrency
  bugs that unit tests AND the Phase-1 code-read both missed; both are async effect-lifecycle
  bugs requiring adversarial reproduction, not static inspection; one wave is not enough to
  promote; held as 1st instance]**

  The Phase-1 head-builder code-read returned APPROVED and noted the appendServer write-through
  as accepted-debt, but did not surface two correctness defects that /review subsequently
  identified:

  (a) Stale-response race: `getServerDetail` effect had no per-run cancellation flag; a slow
  prior-server fetch resolving after a fast switch could overwrite the newly-selected server's
  detail. Invisible to static code-read because the race is temporal, not structural.

  (b) Non-atomic put+prune: `putCachedServers` performed the bulkPut and the prune-compute-delete
  as separate operations outside a transaction; a concurrent write-through could read a stale
  keyset between the two operations, causing a valid server to be incorrectly pruned. Invisible
  to static code-read because the hazard requires concurrent interleaving.

  Both were fixed in commit 7b2f6a6 before merge and independently verified by the refix
  re-verification stage. The existing BUILD-PRINCIPLES rule 5 ("Guard every reconnect-triggered
  async loop with an in-flight coalescing flag or promise-mutex at authoring time") covers the
  coalescing sub-class but does not prescribe per-effect cancellation flags for React effects
  that can be superseded by a new selection. This wave's stale-response fix is a React-specific
  cancellation pattern that rule 5 does not fully encode.

  Assessment for promotion: both findings are real and material (High severity, required fixes
  before merge), and the pattern "static code-read misses temporal concurrency defects" is
  generalizable. However, one wave is one datapoint. The candidate claim would be something like:
  "a Phase-1 code-read cannot substitute for adversarial /review reproduction on async state
  effects or transactional DB helpers." This is structurally adjacent to BUILD rule 4 ("Reproduce
  one negative path per authz or injection boundary at B-6 Phase-2; a Phase-1 code-read APPROVE
  is not sufficient") but encodes a different class of boundary (async/concurrency vs authz).
  Near-dup check: BUILD rule 4 applies to authz and injection boundaries; the concurrency/async
  lifecycle class is not explicitly covered. Not a near-dup, but also not yet a two-wave pattern.

  Source artifacts:
  - process/waves/wave-65/stages/B-6-review-output.md (§Triage: "High → FIXED (commit 7b2f6a6):
    (1) ServerContext.tsx:150 stale-response race... (2) cache.ts:52 non-atomic put+prune")
  - process/waves/wave-65/stages/B-6-review.md (phase1_head_builder_verdict: APPROVED; then
    "Phase 2: /review ... 10 verified findings. 2 High + 4 Medium/Low FIXED in commit 7b2f6a6")
  - process/waves/wave-65/stages/B-6-refix-verify.md (§FIX 1 analysis: canonical React
    cancellation pattern; §FIX 2 analysis: genuine atomic tx wrapping bulkPut + prune)
  - process/waves/wave-65/stages/V-1-karen.md (§Finding 3: atomicity + cross-table prune
    verified; §Finding 4: `cancelled` flag guarding both branches and both awaits confirmed)
  - process/waves/wave-65/blocks/B/gate-verdict.md

  Severity: informational (findings were caught and fixed; system functioned as designed; one
  wave is not sufficient for promotion).

  Candidate principles file: BUILD-PRINCIPLES (potential rule 12 candidate — "Phase-1 code-read
  cannot reliably catch async state-effect races or non-atomic DB write patterns; adversarial
  /review reproduction is required for these classes"). Not yet promotable: 1st instance only.

  Pre-shaped candidate rule (for karen's reference only, NOT a nomination):
    "12. Run adversarial /review on any new async effect with sequential state writes or DB
        helpers with read-then-write sequences; Phase-1 code-read cannot catch interleaving."
    Rule line = 116 chars. PASS (<=120).
    "    Why: A race or non-atomic sequence is temporal; static inspection of correct-looking
        code cannot expose it."
    Why line with 4-space indent = 89 chars. PASS (<=100).
    No forbidden tokens (no `we`, `our`, `the team`, `wave-<N>`, em-dash). PASS.
    Near-dup check vs BUILD rules 1-11: rule 4 covers authz/injection boundaries; rule 5
    covers reconnect-triggered coalescing; neither covers async-effect cancellation or DB
    transaction atomicity as a /review trigger class. Not a near-dup. PASS.

  Recurrence verdict: FIRST INSTANCE. No prior L-2 observation on "Phase-1 code-read misses
  async race / non-atomic DB write; /review caught both." Hold pending a second wave where this
  class recurs — either another async effect race or non-atomic multi-step DB write caught by
  /review after a Phase-1 APPROVE.
  Promotion flag: HOLD — 1st instance.

---

- **[obs-4 — informational: status check on prior held observations]**

  Updating carried status from wave-64 obs-5 and all prior HOLDs:

  | origin | obs | class | wave-65 status |
  |--------|-----|-------|----------------|
  | wave-64 obs-1 | createObjectURL for a cached Blob must pair src-change revoke AND unmount revoke | NOT CONFIRMED. Wave-65 is a server-list/channel-tree read-through; no new createObjectURL usage introduced; useCachedAttachmentImage.ts untouched. Not a confirming instance. HOLD maintained. |
  | wave-58 obs-A | Hardening a pass-regardless soft-check into a gating assertion exposes a masked production defect | NOT CONFIRMED. Wave-65 adds net-new tests (server-cache.test.ts, ServerContext.test.tsx); no existing soft-check converted to gating. CI 6/6 green. Not a confirming instance. HOLD maintained. |
  | wave-58 obs-B | Prod-baseURL e2e is post-deploy verification, not a pre-merge gate | NOT CONFIRMED. CI 6/6 green; T-5 ran as a post-deploy live probe per established pattern. Classification not stress-tested. HOLD maintained. |
  | wave-59 obs-3 | Test a multi-branch pure formatter with a single it.each table covering every output bucket | NOT CONFIRMED. Wave-65 tests are async hook behavior (server-cache round-trip, write-through, offline fallback) and effect lifecycle (stale-response, atomicity). No multi-branch pure-function formatter introduced or tested. Not a confirming instance. HOLD maintained. |
  | wave-60 obs-1 (STRONG HOLD) | Hardcoded palette hex in 45 web-shell .tsx files where consumable CSS tokens exist | NOT CONFIRMED. Wave-65 touches only apps/web/src/features/sync/ + apps/web/src/shell/ServerContext.tsx — no inline backgroundColor or palette hex literal changes. Not a confirming instance. STRONG HOLD maintained. |
  | wave-52 obs-3(a) | VERIFY: independently re-probe load-bearing claims at gate before accepting zero-finding verdict | CONFIRMED BY APPLICATION. Karen independently re-ran 24/24 tests + byte-compared v4 and v5 store blocks at file:line for all 7 claims. Jenny live-probed deployed prod: measured 558 cached servers, verified detail DTO shape, observed cold-offline rail hydration and full chain (rail→sidebar→channel→cached messages) on deployed prod. Both reviewers verified independently without cross-endorsement. Behavior continues correctly. Still HOLD for VERIFY rule 5 candidacy — no failure case yet. |
  | wave-52 obs-3(b) | Gate agent direct-writes to principles files | NOT CONFIRMED. No gate agent wrote directly to a principles file this wave. Remains 1st-instance HOLD. |
  | wave-57 obs-1 | Interactive nav/rail button shipped with no onClick | NOT CONFIRMED. Wave-65 makes no UI nav/rail interactive button changes. Remains HOLD. |
  | wave-50 obs-B | Parallel T-5 testers block on shared MCP Chrome profile | NOT CONFIRMED. T-5/V-1-jenny ran as a single-agent live probe (playwright-4). Remains HOLD. |
  | wave-49 obs-B | Socket.IO namespace mismatch invisible to mocked-both-sides unit suite | NOT CONFIRMED. Wave-65 adds no new Socket.IO gateway. Remains HOLD. |
  | wave-49 obs-C | Responsive breakpoint not validated against D-3 adopted design at B-block | NOT CONFIRMED. D-block skipped (design_gap_flag false; ServerContext is data-layer only, no new UI surfaces). Remains HOLD. |

  Severity: informational (status checks only; wave-52 obs-3(a) continues confirmed by application).
  Candidate principles file: none.
  Promotion flag: NO.

---

## Summary table

| id | title (short) | severity | recurrence | candidate file | disposition |
|----|---------------|----------|------------|----------------|-------------|
| obs-1 | PRODUCT rule 1 (verify seed code-absence claims at P-0) applied; 3rd explicit documented firing; false-absent premise on useMessages.ts caught at P-0 | informational | CONFIRMED-BY-APPLICATION (waves 61, 64, 65); rule 1 in force | none | NO PROMOTION — rule 1 already covers this class |
| obs-2 | BUILD rule 11 (Dexie cumulative-declarative v(N+1) restate) applied correctly; 4th consecutive M12 bundle; v4→v5 with 8 prior tables, all restated verbatim | informational | 4th application; rule in force since wave-63 | none | NO PROMOTION — rule 11 already in force |
| obs-3 | B-6 /review caught 2 High concurrency bugs (stale-response race + non-atomic put+prune) that Phase-1 code-read APPROVED missed; async/temporal defects invisible to static inspection | informational | FIRST INSTANCE — no prior L-2 observation on /review catching async-effect race + DB non-atomicity that Phase-1 missed | BUILD-PRINCIPLES rule 12 candidate (1st instance) | HOLD — 1st instance; watch for a second wave where /review catches an async race or non-atomic DB write after a Phase-1 APPROVE |
| obs-4 | Status check on prior held observations | informational | wave-52 obs-3(a) continues confirmed by application; all other HOLDs unchanged | none | STATUS CHECK ONLY |

**Observations emitted: 4 (obs-1 through obs-4)**
**Severities: all informational**
**Promotion-eligible this wave: NONE — obs-1 and obs-2 are reinforcements of already-promoted rules; obs-3 is a genuine 1st-instance hold with a pre-shaped rule candidate; obs-4 is a status check**
**Nominations for karen vetting: NONE this wave — obs-3 is held at 1st instance; the pre-shaped candidate rule is presented for future reference only**
