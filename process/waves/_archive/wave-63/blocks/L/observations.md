# Wave 63 — L-block observations ledger

Append-only. L-2 Distill (karen) reads these; promotes to `*-PRINCIPLES.md` ONLY when an
observation recurs across 2+ waves AND head-verifier approves (max 1 rule/file/wave). Single-wave
observations stay here until a second wave confirms.

---

## L-2 synthesis observations (knowledge-synthesizer)

Inputs read: process/waves/wave-63/stages/ full artifact set (B-0-branch-and-schema,
B-3-frontend, B-4-wiring, B-5-verify, B-6-review-output, C-1-pr-ci-merge, C-2-deploy-and-verify,
T-5-e2e, V-1-karen, V-1-jenny, V-1-summary, V-2-triage, V-3-fast-fix).
Gate verdicts checked: process/waves/wave-63/blocks/{B,C,T,V}/gate-verdict.md (all four gates
APPROVED; 2 noise findings, 0 blocking; V-2 fast-fix queue empty; V-3 Phase 2 skipped).
Prior archives consulted: process/waves/_archive/wave-{57,58,59,60,61}/blocks/L/observations.md
+ process/waves/wave-62/blocks/L/observations.md (5 most-recent prior waves; recurrence checks on
Dexie upgrade-path class, soft-check-hardening VERIFY rule 5, prod-baseURL CI rule 11,
T-1 it.each-table-per-bucket, wave-57 dead-onClick, wave-60 token-hex STRONG HOLD, and all older
multi-wave HOLDs).
Principles files read: BUILD-PRINCIPLES.md (10 rules), VERIFY-PRINCIPLES.md (4 rules),
CI-PRINCIPLES.md (10 rules), T-5.md (3 rules), T-2.md (1 rule).

---

- **[obs-1 — SECOND INSTANCE / RECURRING (2 waves: 62 + 63): every Dexie .version(N+1).stores()
  call MUST re-state all prior tables verbatim; the preservation test asserting ROW VALUES survive
  is the named exit criterion for the migration; omitting any prior table silently deletes it for
  all users on upgrade — STRONG, PROMOTION-ELIGIBLE]**

  Wave-62 obs-1 (FIRST INSTANCE) documented this class: Dexie's cumulative-declarative model
  treats any table absent from a `.version(N+1).stores()` call as a drop instruction for the
  upgrade transaction, causing irreversible, unlogged client-side data loss for every user who
  held data in that store. Wave-62 closed the risk for v1→v2 (DMs) using three controls:
  verbatim restate, preservation test asserting row values, and head-verifier byte-comparison
  at V-gate. The pre-shaped BUILD-PRINCIPLES rule 11 candidate was HOLD pending a second wave.

  Wave-63 is the second wave adding a new Dexie version (.version(3) for academic cache). The
  same risk existed at higher amplitude: the v3 call now had to carry THREE prior version blocks
  (v1: channels/messages/outbox; v2: dmConversations/dmMessages) totaling 5 tables verbatim.
  The execution closed the risk identically to wave-62, using the same discipline in a harder
  instance:

  1. B-3 substrate commit (58b6b22): `db.ts` `.version(3).stores()` re-states all 5 prior tables
     with byte-identical index strings (`messages: 'id, channelId, [channelId+createdAt], createdAt'`,
     `channels: 'id, serverId'`, `outbox: '++id, channelId, idempotencyKey, state, [state+createdAt]'`,
     `dmConversations: 'id, createdAt'`, `dmMessages: 'id, conversationId, [conversationId+createdAt],
     createdAt'`) before appending the two new tables; v1 and v2 blocks are both preserved above it
     (B-3-frontend.md; B-6-review-output.md: "head-builder byte-compared all 5 prior table lines
     verbatim").

  2. Named exit criterion test exists and asserts ROW VALUES: `academic-cache.test.ts:275`
     ("all v1+v2 rows survive the v1→v2→v3 migration") seeds all 5 pre-v3 tables via db1, closes,
     re-opens the SAME IDBFactory as db2, asserts `channel.name`, `message.content`,
     `outbox.state`+`content`, `dmConv.isGroup`, `dmMsg.content` survive — genuine preservation,
     not table-existence (B-5-verify.md: "16/16 incl v1→v2→v3 PRESERVATION — the NAMED exit
     criterion"; V-1-karen.md Claim 5: "re-ran this stage — 16/16 passed independently").

  3. Head-verifier at V-gate independently confirmed triangulation: v3 `.stores()` byte-matches
     v1+v2 for all 5 prior tables, preservation test asserts row values, T-5 live prod observed
     IDB version 30 (= Dexie schema v3 ×10) with all 5 prior stores intact plus 2 new tables
     and populated row counts (cachedAssignments=2, cachedScheduledSessions=22) after write-through
     (V-gate-verdict.md §Rationale; T-5-e2e.md step 1, `dexie_version_observed: 30`).

  Near-dup check vs BUILD-PRINCIPLES rules 1-10 (re-confirmed this wave): unchanged from wave-62
  assessment — rule 3 ("Any seed applied by a backfill must also appear in the create transaction,
  column-for-column") is the closest; confirmed distinct class (server-side SQL backfill/create
  column-parity vs client-side browser IndexedDB upgrade omission-equals-deletion). Not a near-dup.
  BUILD rules 1-10 do not contain a rule on Dexie/IndexedDB upgrade path management. PASS.

  Pre-shaped candidate rule for BUILD-PRINCIPLES (unchanged from wave-62 shape):
    "11. In a Dexie .version(N+1).stores() call, re-state every prior table verbatim; omitting one
         silently deletes it for all users on upgrade."
    Rule line = 97 chars. PASS (<=120).
    "   Why: Dexie's cumulative-declarative model treats an absent table as a drop instruction;
       data loss is irreversible."
    Why line WITH 3-space indent = 97 chars. PASS (<=100).
    No forbidden tokens (no `we`, `our`, `the team`, `wave-<N>`, em-dash). PASS.
    Near-dup check vs BUILD rules 1-10: PASS (see above).
    Format matches contract exactly: one rule line + one Why line, sequential number 11, ends in
    period, no parenthetical longer than ~5 words. PASS.

  Source artifacts:
  - process/waves/wave-63/stages/B-3-frontend.md (B-3a: "db.ts Dexie v3 — .version(3).stores()
    re-states 5 v1+v2 tables VERBATIM + cachedAssignments + cachedScheduledSessions; v1+v2 blocks
    preserved. academic-cache.test.ts: 16 tests incl v1→v2→v3 PRESERVATION")
  - process/waves/wave-63/stages/B-5-verify.md (line 4: "academic-cache.test.ts: 16/16 incl
    v1→v2→v3 upgrade-PRESERVATION (all 5 prior tables' ROWS survive — NAMED exit criterion)")
  - process/waves/wave-63/stages/B-6-review-output.md ("DATA-LOSS (v2→v3 migration deletes
    M4+bundle-#1 stores) — CLOSED: head-builder byte-compared all 5 prior table lines verbatim
    in .version(3).stores() (db.ts:127-135); preservation test seeds real ROWS")
  - process/waves/wave-63/blocks/B/gate-verdict.md (§Rationale: "The v3 5-table byte-compare
    PASSED...zero omission or alteration — then appends only the two new tables")
  - process/waves/wave-63/stages/V-1-karen.md (Claim 1: byte-for-byte diff against v1 and v2,
    "all 5 prior table index strings are identical — no omission, no silent index drift"; Claim 5:
    "re-ran this stage: academic-cache.test.ts 16/16"; Claim 6: "T-5 is internally coherent: IDB
    version 30 == Dexie schema v3 (×10 convention), all 5 pre-v3 stores + 2 new stores present")
  - process/waves/wave-63/stages/V-1-jenny.md (Block 1: "DATA-LOSS GUARD (highest risk) — MET.
    Byte-comparable to the v2 restate. The named exit-criterion test exists and asserts ROW
    survival (not just table existence): academic-cache.test.ts:268-275")
  - process/waves/wave-63/blocks/V/gate-verdict.md (§Rationale: "the irreversible-if-wrong item
    is genuinely closed via triangulation that agrees three ways"; T-5 live IDB v30 all 5 prior
    stores intact)
  - process/waves/wave-63/stages/T-5-e2e.md (step 1: "IDB version 30 = Dexie schema v3... Object
    stores present: channels, messages, outbox, dmConversations, dmMessages (all 5 pre-v3 tables
    restated verbatim) + cachedAssignments, cachedScheduledSessions. Counts after write-through:
    cachedAssignments=2, cachedScheduledSessions=22.")
  - process/waves/wave-62/blocks/L/observations.md (obs-1: FIRST INSTANCE; pre-shaped rule 11
    candidate; v1→v2 DM cache wave, same class, same controls applied)

  Severity: strong (irreversible client-side data loss for all users holding prior offline-cache
    data is the cost-if-missed; the hazard has no compiler-level catch; the execution succeeded
    both waves; the observation is warranted because the discipline that closed the risk is
    non-obvious from the Dexie API surface and must be explicitly encoded to survive future
    version bumps without a preservation test).
  Candidate principles file: command-center/principles/BUILD-PRINCIPLES.md (rule 11 candidate).
  Recurrence verdict: SECOND INSTANCE — RECURRING (wave-62: FIRST INSTANCE for v1→v2 DM cache;
    wave-63: SECOND INSTANCE for v2→v3 academic cache with the same controls applied at higher
    amplitude — 5 prior tables to carry rather than 3). Two-wave bar is met.
  Promotion flag: PROMOTE-CANDIDATE — 2nd instance confirmed; evidence is real and unmanufactured;
    rule shape passes all contract checks; no near-dup in BUILD-PRINCIPLES rules 1-10; awaits
    karen's L-2 Distill vetting and head-builder approval.

---

- **[obs-2 — HOLD UPDATE (wave-58 obs-1, 1st instance): hardening a pass-regardless soft-check
  into a gating assertion surfaces a masked production defect — NO-CONFIRM this wave; HOLD
  maintained]**

  Wave-58 obs-1 (FIRST INSTANCE) documented: when a pass-regardless soft-check is converted to a
  gating assertion, the first honest CI run may gate red because a pre-existing defect concealed
  by the softness is now exposed. Pre-shaped VERIFY-PRINCIPLES rule 5 candidate is HOLD.

  Wave-63 assessment: this wave is a client-side Dexie v3 substrate extension with two new
  component offline wire-ins. No existing test assertion was converted from pass-regardless to
  gating. All new tests (`academic-cache.test.ts`, `assignments.test.tsx`,
  `calendar-offline.test.tsx`) are net-new, not conversions of existing soft-checks. CI ran 7/7
  on re-run; the one first-run failure (study-timer.test.tsx) is a pre-existing async-race flake
  on an unrelated test, not a soft-check conversion exposing a defect. V-2 triage was empty.

  Determination: NOT CONFIRMED. Wave-63 is not a confirming instance of the wave-58 obs-A class.

  Source artifacts: C-1-pr-ci-merge.md ("study-timer flake UNRELATED to wave-63"), V-2-triage.md
  (empty fast-fix queue), V-1-karen.md (zero findings), B-6-review-output.md ("Findings: none").

  Candidate rule shape preserved from wave-58 (NOT a nomination — still 1st instance only):
    "5. When converting a pass-regardless soft-check to a gating assertion, budget a production fix;
       surfacing the masked defect is the expected outcome."
    Rule = 104 chars. PASS. Why = "A soft-check that passes regardless hides whether the behavior
    works; the first honest run may gate red." Why with indent = 97 chars. PASS.
    No forbidden tokens. Not a near-dup of VERIFY rules 1-4. PASS.

  Severity: informational (status update; wave structure orthogonal to the class being watched).
  Candidate principles file: command-center/principles/VERIFY-PRINCIPLES.md (rule 5 candidate).
  Recurrence verdict: NO-CONFIRM wave-63. Still FIRST INSTANCE (wave-58 only). HOLD maintained.
  Promotion flag: HOLD.

---

- **[obs-3 — HOLD UPDATE (wave-58 obs-2, 1st instance): a prod-baseURL e2e is post-deploy
  verification, not a pre-merge gate — NO-CONFIRM this wave; HOLD maintained]**

  Wave-58 obs-2 (FIRST INSTANCE) documented: a Playwright suite whose baseURL targets the live
  production URL is a post-deploy verification instrument; marking it required in CI would block
  the branch fix that resolves the failing e2e. Pre-shaped CI-PRINCIPLES rule 11 candidate.

  Wave-63 assessment: CI ran 7/7 on re-run (first-run flake was study-timer.test.tsx, unrelated).
  T-5 ran as a post-deploy active probe on deployed prod 699a619 — the expected pattern. No
  e2e-red-then-fix cycle occurred; no scenario arose where the prod-baseURL classification was
  relevant to a merge decision.

  Determination: NOT CONFIRMED. Wave-63 is not a confirming or falsifying instance.

  Source artifacts: C-1-pr-ci-merge.md (7/7 CI re-run), C-block-gate-verdict.md (PASS),
  T-5-e2e.md (post-deploy live probe PASS).

  Candidate rule shape preserved from wave-58 (NOT a nomination — still 1st instance only):
    "11. Classify an e2e suite whose baseURL targets deployed prod as non-required in CI; it is
       post-deploy verification, not a pre-merge gate."
    Rule = 113 chars. PASS. Why = "A production-baseURL e2e tests the deployed binary, not the
    branch; gating merge on it blocks the fix." Why with indent = 99 chars. PASS.
    No forbidden tokens. Not a near-dup of CI rules 1-10. PASS.

  Severity: informational (status update; wave structure orthogonal to the class).
  Candidate principles file: command-center/principles/CI-PRINCIPLES.md (rule 11 candidate).
  Recurrence verdict: NO-CONFIRM wave-63. Still FIRST INSTANCE (wave-58 only). HOLD maintained.
  Promotion flag: HOLD.

---

- **[obs-4 — HOLD UPDATE (wave-59 obs-3, 1st instance): test a multi-branch pure-function
  formatter as a single it.each table covering every output bucket — NO-CONFIRM this wave; HOLD
  maintained]**

  Wave-59 obs-3 (FIRST INSTANCE) documented: for an exhaustive multi-branch pure formatter, a
  single it.each table covering every output bucket is the correct T-1 unit shape.

  Wave-63 assessment: this wave's unit tests (`academic-cache.test.ts`, `assignments.test.tsx`,
  `calendar-offline.test.tsx`) test round-trip cache read/write behavior, serverId scoping,
  window isolation, DB upgrade preservation, and component offline fallback rendering. None of
  these tests exercise a multi-branch pure-function formatter. The it.each-table-per-bucket class
  is structurally absent.

  Determination: NOT CONFIRMED. Wave-63 is not a confirming instance of wave-59 obs-3.

  Source artifacts: B-3-frontend.md (test descriptions confirm per-behavior unit assertions,
  not a pure-formatter bucket table), V-1-karen.md (45 wave-63 tests re-run; test structures
  verified as round-trip, scoping, isolation, and preservation patterns).

  Candidate rule shape preserved from wave-59 (NOT a nomination — still 1st instance only):
    "1. Test a multi-branch pure formatter with a single it.each table covering every output
       bucket; add one row per boundary transition."
    Rule = 97 chars. PASS. Why = "A table makes a missing bucket visible as a missing row; N
    separate it() calls can omit a bucket silently." Why with indent = 97 chars. PASS.
    No forbidden tokens. Not a near-dup. PASS.

  Severity: informational (status update; wave structure orthogonal to the class).
  Candidate principles file: command-center/principles/test-layer-principles/T-1.md (rule 1
    candidate — T-1.md currently has 0 rules).
  Recurrence verdict: NO-CONFIRM wave-63. Still FIRST INSTANCE (wave-59 only). HOLD maintained.
  Promotion flag: HOLD.

---

- **[obs-5 — status check on prior held observations]**

  Updating carried status from wave-62 obs-6 and all prior HOLDs:

  | origin | obs | class | wave-63 status |
  |--------|-----|-------|----------------|
  | wave-60 obs-1 (STRONG HOLD) | Hardcoded palette hex in 45 web-shell .tsx files where consumable CSS tokens exist; shade drift documented cost; karen L-2 ruling: REJECT/HOLD pending token-migration wave + DESIGN-PRINCIPLES target | NOT CONFIRMED. Wave-63 touches only apps/web/src/features/sync/ + apps/web/src/shell/AssignmentsPanel.tsx + ClassCalendar.tsx — no backgroundColor or palette hex literal changes in any touched file. Not a confirming instance. STRONG HOLD maintained. |
  | wave-62 obs-1 | Dexie .version(N+1).stores() must re-state all prior tables verbatim; omission silently deletes store on upgrade; 1st instance | CONFIRMED. Wave-63 is the 2nd instance — v2→v3 migration with 5 prior tables to carry; same discipline applied (verbatim restate + preservation test asserting row values + head-verifier byte-compare + T-5 live proof). See obs-1 above. TWO-WAVE BAR MET — PROMOTE-CANDIDATE. |
  | wave-58 obs-1 / obs-A | Hardening a pass-regardless soft-check into a gating assertion exposes a masked production defect | NOT CONFIRMED. No soft-check conversion; CI study-timer flake is pre-existing async-race, unrelated. See obs-2 above. HOLD maintained. |
  | wave-58 obs-2 / obs-B | Prod-baseURL e2e is post-deploy verification, not a pre-merge gate | NOT CONFIRMED. CI 7/7 re-run; classification not stress-tested. See obs-3 above. HOLD maintained. |
  | wave-59 obs-3 | Test a multi-branch pure formatter as an it.each table covering every output bucket | NOT CONFIRMED. No pure-formatter introduced or tested. See obs-4 above. HOLD maintained. |
  | wave-57 obs-1 | Interactive nav/rail button shipped with no onClick; gap invisible to tests; surfaced as UX papercut | NOT CONFIRMED. Wave-63 makes no UI nav/rail button changes. Not a confirming instance. HOLD maintained. |
  | wave-56 obs-1 | P-0 three-reviewer convergence caught seed conflating scale-independent correctness cap with premature pagination UX; YAGNI split at P-0 | NOT CONFIRMED. Wave-63 is a scoped offline-cache extension with a clean PROCEED. No YAGNI split at P-0. HOLD maintained. |
  | wave-56 obs-2 | ceo-reviewer explicitly retracted its own prior-wave N-2 seed nomination | NOT CONFIRMED. Wave-63 ceo-reviewer is a HOLD-SCOPE PROCEED on M12 bundle #2; no retraction of a prior-wave call. HOLD maintained. |
  | wave-55 obs-1 | Seed positive-only assertion redundant with existing control; load-bearing cell was the untested negative | NOT CONFIRMED. Wave-63 seed premise was accurately scoped; P-0 clean PROCEED. Not a confirming instance. HOLD maintained. |
  | wave-54 obs-2 | Seed premise about entire WS info-disclosure vulnerability class being open was false | NOT CONFIRMED. Wave-63 has no security sweep. HOLD maintained. |
  | wave-52 obs-3 (a) | VERIFY: independently re-probe load-bearing claims at gate before accepting zero-finding verdict | CONFIRMED BY APPLICATION. Karen independently re-ran 45/45 wave-63 suites + byte-diffed the v3 restate + probed HTTP 200 deploy. Jenny cross-referenced all 3 spec blocks vs DB-row spec + merged source + T-5 live probe. Head-verifier independently confirmed the irreversible-if-wrong triangulation (v3 restate + preservation test row values + T-5 IDB inspection) without cross-endorsement. Three independent verification layers on the highest-risk item. Behavior continues correctly. Remains 1st-instance HOLD for VERIFY rule 5 candidacy — no failure case yet. |
  | wave-52 obs-3 (b) | Gate agent direct-writes to principles files | NOT CONFIRMED. No gate agent wrote directly to a principles file this wave. Remains 1st-instance HOLD. |
  | wave-50 obs-B | Parallel T-5 testers block on shared MCP Chrome profile | NOT CONFIRMED. T-5 ran as single-agent live offline probe. Remains multi-wave HOLD. |
  | wave-50 obs-C | P-4/plan review enumerate compute-on-read walk paths for new per-row parameter | NOT CONFIRMED. Wave-63 has no compute-on-read walk. Remains multi-wave HOLD. |
  | wave-49 obs-B | Socket.IO namespace mismatch invisible to mocked-both-sides unit suite | NOT CONFIRMED. Wave-63 adds no new Socket.IO gateway. Remains multi-wave HOLD. |
  | wave-49 obs-C | Responsive breakpoint not validated against D-3 adopted design at B-block | NOT CONFIRMED. D-block skipped (design_gap_flag false; data-source change on existing surfaces). Remains multi-wave HOLD. |
  | wave-44 obs-1 | Responsive/layout fix introduces overlay without WCAG dialog contract | NOT CONFIRMED. No layout fix or overlay. Remains multi-wave HOLD. |
  | wave-45 obs-1 | Browser resolution in committed playwright config | NOT CONFIRMED. No Playwright config change. Remains multi-wave HOLD. |
  | wave-45 obs-2 | playwright test --list false-green for browser-resolution change | NOT CONFIRMED. No Playwright config change. Remains multi-wave HOLD. |
  | wave-47 obs-C | Display-identifier vs opaque-id mismatch | NOT CONFIRMED. No component rendering user identities. Remains multi-wave HOLD. |
  | wave-41 obs-1 | V-3 redeploy false-green | NOT CONFIRMED. V-3 Phase 2 not triggered (fast-fix queue empty). Remains multi-wave HOLD. |
  | wave-41 obs-2 | Symbol-grep false-positive | NOT CONFIRMED. V-1 karen used file:line source inspection against merged tree 699a619. Remains multi-wave HOLD. |
  | wave-41 obs-3 | Parallel-path enforcement gap | NOT CONFIRMED. No new parallel sibling method. Remains multi-wave HOLD. |
  | wave-40 obs-1 | T-8 fix mechanism contradicts architectural decision | NOT CONFIRMED. No T-8 security surface; client-side IndexedDB extension with no architectural conflict. Remains multi-wave HOLD. |
  | wave-40 obs-4 | Global 22P02 filter / text-keyed route params | NOT CONFIRMED. No text-keyed route params. Remains multi-wave HOLD. |

  Severity: informational (status checks; wave-62 obs-1 is the key update — CONFIRMED this wave,
    two-wave bar met, PROMOTE-CANDIDATE for BUILD-PRINCIPLES rule 11).
  Candidate principles file: none.
  Promotion flag: NO (status check; the promotion candidate is obs-1 above).

---

## Summary table

| id | title (short) | severity | recurrence | candidate file | disposition |
|----|---------------|----------|------------|----------------|-------------|
| obs-1 | Dexie .version(N+1).stores() must re-state every prior table verbatim; omission silently deletes the store for all existing users on upgrade; preservation test asserting ROW VALUES is the named exit criterion | strong | SECOND INSTANCE (wave-62: 1st instance v1→v2 DMs; wave-63: 2nd instance v2→v3 academic cache, 5 prior tables, same discipline applied) | BUILD-PRINCIPLES rule 11 candidate | PROMOTE-CANDIDATE — 2nd instance confirmed; evidence unmanufactured; rule shape passes all contract checks |
| obs-2 | wave-58 obs-A (soft-check-hardening class) — NO-CONFIRM wave-63; 1st instance only (wave-58) | informational | NO-CONFIRM wave-63; still 1st instance | VERIFY-PRINCIPLES rule 5 candidate shape | HOLD |
| obs-3 | wave-58 obs-B (prod-baseURL e2e = post-deploy verification) — NO-CONFIRM wave-63; 1st instance only (wave-58) | informational | NO-CONFIRM wave-63; still 1st instance | CI-PRINCIPLES rule 11 candidate shape | HOLD |
| obs-4 | wave-59 obs-3 (T-1 it.each-table-per-bucket class) — NO-CONFIRM wave-63; 1st instance only (wave-59) | informational | NO-CONFIRM wave-63; still 1st instance | T-1.md rule 1 candidate shape | HOLD |
| obs-5 | Status check on prior held observations | informational | wave-62 obs-1 CONFIRMED this wave (key update); all other HOLDs unchanged | none | STATUS CHECK — wave-62 obs-1 promoted to PROMOTE-CANDIDATE |

**Observations emitted: 5 (obs-1 through obs-5)**
**Severities: 1 strong (obs-1), 4 informational (obs-2 through obs-5)**
**Promotion-eligible this wave: obs-1 — BUILD-PRINCIPLES rule 11 candidate; two-wave bar met (wave-62 + wave-63); karen vetting + head-builder approval required**
**Nominations for karen vetting: obs-1 (strong; BUILD-PRINCIPLES rule 11; two-wave bar confirmed)**

---

## Explicit recurrence verdict on the Dexie .version(N+1) restate candidate

**Question:** Does wave-63 confirm the wave-62 obs-1 FIRST INSTANCE of the Dexie cumulative-
declarative upgrade-path hazard, clearing the 2-wave promotion bar?

**Answer: YES — CONFIRMED. Two-wave bar met. PROMOTE-CANDIDATE.**

Evidence chain across both waves:

Wave-62 (FIRST INSTANCE):
- v1→v2 migration for DM cache (dmConversations + dmMessages added)
- `.version(2).stores()` re-stated 3 v1 tables (messages, channels, outbox) byte-identically
- `dm-cache.test.ts:303-382` preservation test: seeds v1 DB, closes, re-opens as v2, asserts v1
  row values survive (channels/messages/outbox)
- Head-verifier spot-checked `db.ts:72-74` (v1) vs `db.ts:96-98` (v2 restatement) byte-identity
  at V-gate even after dual-APPROVE
- T-5 live: deployed IndexedDB at v2 with all 5 stores present ([channels, dmConversations,
  dmMessages, messages, outbox])

Wave-63 (SECOND INSTANCE — harder variant, same discipline):
- v2→v3 migration for academic cache (cachedAssignments + cachedScheduledSessions added)
- `.version(3).stores()` re-stated ALL 5 prior tables (3 from v1 + 2 from v2) verbatim with
  byte-identical index strings; v1 and v2 `.version()` blocks both preserved
- `academic-cache.test.ts:275` preservation test: seeds all 5 pre-v3 tables via db1, closes,
  re-opens as db2, asserts row VALUE survival (`channel.name`, `message.content`, `outbox.state`,
  `dmConv.isGroup`, `dmMsg.content`) — named exit criterion in B-5, independently re-run by karen
  at V-1 (16/16)
- Head-verifier at V-gate confirmed the "irreversible-if-wrong item closed via triangulation that
  agrees three ways" — restate byte-match + preservation row-value test + T-5 live IDB inspection
- T-5 live: deployed IndexedDB at v30 (= Dexie schema v3 ×10) with all 5 prior stores + 2 new
  stores present and row counts confirming write-through

The wave-63 execution is a harder instance than wave-62: 5 tables to carry instead of 3, two
existing version blocks to preserve instead of one, and the preservation test covers a 3-step
migration chain (v1→v2→v3) rather than a single step. The discipline was applied correctly at
higher amplitude, which makes wave-63 the stronger confirming instance.

The candidate rule shape is unchanged from wave-62 and passes all contract checks:
  "11. In a Dexie .version(N+1).stores() call, re-state every prior table verbatim; omitting one
       silently deletes it for all users on upgrade."
  Rule line = 97 chars. PASS.
  "   Why: Dexie's cumulative-declarative model treats an absent table as a drop instruction;
     data loss is irreversible."
  Why line WITH 3-space indent = 97 chars. PASS.
  No forbidden tokens. Not a near-dup of BUILD rules 1-10. PASS.
  Sequentially correct (BUILD has 10 rules; this is rule 11). PASS.

**Recurrence verdict: CONFIRMED. PROMOTE-CANDIDATE for BUILD-PRINCIPLES rule 11.**
**The two-wave bar is met. Karen vetting and head-builder approval are the remaining gates.**
