# Wave 62 — L-block observations ledger

Append-only. L-2 Distill (karen) reads these; promotes to `*-PRINCIPLES.md` ONLY when an
observation recurs across 2+ waves AND head-verifier approves (max 1 rule/file/wave). Single-wave
observations stay here until a second wave confirms.

---

## L-2 synthesis observations (knowledge-synthesizer)

Inputs read: process/waves/wave-62/stages/ full artifact set (P-0-frame, P-0-problem-framer,
P-0-ceo-reviewer, P-0-mvp-thinner, P-1-decompose, P-2-spec, P-3-plan, P-4-gemini-review,
B-0-branch-and-schema, B-3-frontend, B-4-wiring, B-5-verify, B-6-review-output, C-1-pr-ci-merge,
C-2-deploy-and-verify, T-5-e2e, T-9-journey, V-1-karen, V-1-jenny, V-1-summary, V-2-triage,
V-3-fast-fix).
Gate verdicts checked: process/waves/wave-62/blocks/{P,B,C,T,V}/gate-verdict.md (all five gates
APPROVED; 2 noise findings, 0 blocking; V-2 triage empty fast-fix queue; V-3 phase 2 skipped).
Prior archives consulted: process/waves/_archive/wave-{57,58,59,60,61}/blocks/L/observations.md
(recurrence checks on all standing HOLD candidates: soft-check-hardening VERIFY rule 5,
prod-baseURL CI rule 11, T-1 it.each-table-per-bucket, wave-57 dead-onClick, wave-60 token-hex
HOLD, and all older multi-wave HOLDs). wave-20/blocks/L/observations.md also consulted for
Dexie/IndexedDB L-2 history.
Principles files read: PRODUCT-PRINCIPLES.md (5 rules), BUILD-PRINCIPLES.md (10 rules),
CI-PRINCIPLES.md (10 rules), VERIFY-PRINCIPLES.md (4 rules), T-5.md (3 rules).
Grep executed: `dexie|indexeddb|idb|\.version\(|offline.cache` across process/waves/_archive/**/
observations.md — confirmed no prior L-2 observation of the Dexie IndexedDB .version().stores()
verbatim-restate migration class; wave-20 header references Dexie only in the wave-description
context, not as an L-2 observation about the upgrade-path hazard.

---

- **[obs-1 — FIRST INSTANCE: when extending a shipped Dexie/IndexedDB store to a new content type,
  the .version(N+1).stores() call MUST re-state all prior tables verbatim; omitting them silently
  deletes the prior store, causing irreversible data loss on upgrade]**

  Wave-62 extended the shipped M4 Dexie v1 store (channels/messages/outbox) to also cache DMs
  (dmConversations + dmMessages). The highest-risk mechanical decision — named explicitly at P-0
  problem-framer, P-2 spec, and the V-block gate — was that Dexie's `.version(2).stores()` call
  uses a cumulative-declarative model: if the v2 call does NOT re-state the v1 tables, Dexie
  interprets the omission as "delete these stores on upgrade." Any user whose browser held M4 offline
  data (cached channel messages / outbox rows) would silently lose that data on the first page load
  after the update. The fix is mechanical: `db.ts:96-98` re-states `messages`, `channels`, and
  `outbox` byte-for-byte identically to their v1 declaration at `db.ts:72-74`.

  The risk is not hypothetical. Dexie's declarative model means a developer adding a new table while
  looking only at the new requirement will omit the prior tables without any compiler or type error;
  the store silently empties on the first upgrade transaction. The wave-62 execution closed this risk
  by:
  1. Naming it the highest-risk item in P-0, P-2 spec (`HIGHEST-RISK: v1->v2 .version(2).stores()
     re-states v1 tables verbatim (else M4 store deleted)` — P-2-spec.md line 6).
  2. Naming it the named exit criterion in P-3/B-5 (B-5-verify.md line 4: "dm-cache.test.ts: 15/15
     incl the v1→v2 upgrade-preservation tests (channels/messages/outbox rows survive) — the NAMED
     load-bearing exit criterion").
  3. Authoring a fake-indexeddb preservation test (dm-cache.test.ts:303-382) that seeds a v1-shaped
     DB row, closes it, re-opens the SAME IDBFactory at v2, and asserts v1 rows survive — exercising
     the real upgrade transaction, not a mock path.
  4. Head-verifier independently byte-comparing db.ts:72-74 vs db.ts:96-98 at the V-gate even when
     both reviewers already returned APPROVE (V-3-fast-fix.md §Gate assessment; blocks/V/gate-verdict.md
     §Rationale: "I did not accept the clean verdicts at face value: I spot-checked the single
     irreversible-if-wrong item...db.ts:72-74 (v1) and db.ts:96-98 (v2 restatement) are byte-for-byte
     identical").
  5. T-5 live-prod confirmation that the deployed IndexedDB is at v2 with the M4 store intact
     ([channels, dmConversations, dmMessages, messages, outbox] all present — T-5-e2e.md step 1).

  Near-dup check (BUILD-PRINCIPLES rules 1-10): Rule 3 states "Any seed applied by a backfill must
  also appear in the create transaction, column-for-column." That rule encodes the server-side DB
  concern of backfill/create-path parity for SQL databases — it addresses the risk that a `create`
  transaction omits a column that a backfill seeds. The Dexie migration class is structurally
  distinct: the consumer is a browser-side IndexedDB upgraded declaratively via Dexie's
  `.version().stores()` API; the risk is that an upgrade declaration silently DELETES an existing
  client-side store for every existing user on upgrade, not that a new row is missing a column
  value. Rule 3 encodes a server-DB create-path parity norm; this class encodes a client-side
  store-upgrade omission norm. Different API model, different user-facing consequence (data loss for
  existing users vs. wrong initial state for new rows), different detection mechanism (fake-indexeddb
  upgrade-path test vs column-level backfill comparison). Not a near-dup. No near-dup found in
  BUILD rules 1-10, PRODUCT rules 1-5, CI rules 1-10, VERIFY rules 1-4, or T-5 rules 1-3.

  Archive search: process/waves/_archive/**/observations.md grep for `dexie`, `indexeddb`, `idb`,
  `.version(`, `offline.cache` returned no prior L-2 observation on the Dexie upgrade-path hazard.
  Wave-20's L-2 ledger introduced the Dexie/IndexedDB substrate (M4 first wave) but recorded no
  observation about the `.version().stores()` omission-equals-deletion model. This is FIRST INSTANCE.

  Falsifiability: "does `db.ts` version(N+1) re-state every table from version(N) verbatim?" is a
  one-grep check (`diff` between the v(N) and v(N+1) `.stores()` table list). Any future
  `.version(3)` call could be checked by diffing the v2 declaration against the v3 declaration.

  Cost-if-ignored: irreversible client-side data loss for every user who had M4 offline cache data
  when the new version ships. Unlike a server-side missing column (detectable immediately at boot
  via a 500), a Dexie omission silently deletes the store during the browser's IndexedDB upgrade
  transaction with no server-side signal and no recovery path for the deleted rows.

  Candidate rule shape for BUILD-PRINCIPLES (pre-shaped for karen's reference, NOT a nomination at
  first instance):
    "11. In a Dexie .version(N+1).stores() call, re-state every prior table verbatim; omitting one
         silently deletes it for all users on upgrade."
    Rule line = 97 chars. PASS (<=120).
    "   Why: Dexie's cumulative-declarative model treats an absent table as a drop instruction;
       data loss is irreversible."
    Why line WITH 3-space indent = 97 chars. PASS (<=100).
    No forbidden tokens (no `we`, `our`, `the team`, `wave-<N>`, em-dash). PASS.
    Near-dup check vs BUILD rules 1-10: rule 3 (server-DB backfill/create-path parity) is the
    closest; confirmed distinct class (client IndexedDB upgrade omission vs server-DB create
    transaction column parity). Not a near-dup. PASS.

  Source artifacts:
  - process/waves/wave-62/stages/P-0-frame.md (§Carry-forward: "Dexie v1→v2 verbatim-restate
    migration (highest-risk)")
  - process/waves/wave-62/stages/P-0-problem-framer.md (§Design-soundness notes 2: "the
    .version(2).stores() must include the unchanged v1 tables (Dexie is declarative-cumulative);
    dropping them from the v2 call would delete the M4 store")
  - process/waves/wave-62/stages/P-2-spec.md (line 6: "HIGHEST-RISK: v1->v2 .version(2).stores()
    re-states v1 tables verbatim (else M4 store deleted)")
  - process/waves/wave-62/stages/B-5-verify.md (line 4: "dm-cache.test.ts 15/15 incl the v1→v2
    upgrade-preservation tests — the NAMED load-bearing exit criterion")
  - process/waves/wave-62/stages/V-1-karen.md (§Claim 1: "db.ts:96-98 are byte-for-byte identical
    to the v1 declaration db.ts:72-74 — no silent index drift that would drop v1 data")
  - process/waves/wave-62/stages/V-1-jenny.md (§Block 80c7c11f, AC 2: "db.ts:96-98 re-states
    messages/channels/outbox byte-identically to :72-74; preservation tests dm-cache.test.ts:303
    + :384")
  - process/waves/wave-62/blocks/V/gate-verdict.md (§Rationale: independent head-verifier
    spot-check of db.ts:72-74 vs db.ts:96-98 byte-identity + dm-cache.test.ts:303-382 upgrade
    path; T-5 live v2 store confirmation)
  - process/waves/wave-62/stages/T-5-e2e.md (§Step 1: "Object stores present: [channels,
    dmConversations, dmMessages, messages, outbox] — the DB is at v2")

  Severity: warning (the execution succeeded; the risk was correctly identified and closed by
    mechanical controls — preservation test + head-verifier byte-check + T-5 live confirmation;
    the observation is warranted because the hazard is not obvious from the API surface and has
    no compiler-level catch; cost-if-missed is irreversible data loss for existing users).
  Candidate principles file: command-center/principles/BUILD-PRINCIPLES.md (rule 11 candidate).
  Recurrence verdict: FIRST INSTANCE. No prior L-2 observation on the Dexie upgrade-path hazard
    in any archived wave (wave-20 introduced the substrate but recorded no obs on this class).
  Promotion flag: HOLD — 1st instance; watch for a second wave where a new Dexie version is
    added (or, conversely, where a .version(N+1) omission is caught by the preservation test
    or surfaced as a data-loss incident).

---

- **[obs-2 — HOLD UPDATE: head-verifier independently spot-checked the one irreversible-if-wrong
  claim against merged source even though both V-1 reviewers returned APPROVE — assess relationship
  to VERIFY-PRINCIPLES rule 3 and prior recurrence evidence]**

  At V-3 gate, head-verifier did not accept the V-1 dual-APPROVE at face value. The gate assessment
  (V-3-fast-fix.md §Gate assessment) records: "Independent head-verifier spot-check of the one
  irreversible-if-wrong item (Dexie v1→v2 migration): db.ts:72-74 (v1) == db.ts:96-98 (v2
  restatement) byte-identical; preservation test dm-cache.test.ts:303-382 exercises the real
  upgrade path on a shared IDBFactory and asserts v1 rows survive." The gate verdict (blocks/V/
  gate-verdict.md §Rationale) confirms: "I did not accept the clean verdicts at face value: I
  spot-checked the single irreversible-if-wrong item...This is demonstrable shipped-behavior
  satisfaction of the acceptance criteria, not acceptance-by-assertion."

  Assessment against VERIFY-PRINCIPLES rule 3: Rule 3 states "Re-verify a fast-fix against the
  reviewer's live reproduction on deployed state, never on source review alone." Rule 3 encodes
  the specific V-3 fast-fix re-verification norm: when a fast-fix was applied in Phase 2, the
  re-verify must reproduce on deployed state. Wave-62's head-verifier action is structurally
  related but occurs in a different context: Phase 2 was SKIPPED (fast-fix queue empty), so rule 3
  does not literally fire. The head-verifier's spot-check is an independent gate action on the
  V-1 claim layer under the condition "both reviewers APPROVED a claim I assess as
  irreversible-if-wrong." This is a distinct verification norm: "when a load-bearing irreversible
  claim is present, independently spot-check it at the gate even when both reviewers already
  returned APPROVE." Rule 3 is a post-fast-fix redeployment norm; this is a pre-acceptance
  irreversibility escalation norm. These are distinguishable on at least two axes: timing (during
  active fast-fix cycle vs at gate before accepting a clean APPROVE pair) and trigger (fast-fix
  applied vs irreversible-if-wrong claim present). Not a restatement of rule 3.

  Assessment against wave-52 obs-3(a) HOLD: wave-52 obs-3(a) documents "VERIFY: independently
  re-probe load-bearing claims at gate before accepting zero-finding verdict" — the general class
  of V-1 reviewers independently probing load-bearing claims rather than cross-endorsing each
  other. This has been CONFIRMED BY APPLICATION every wave since wave-52 (confirmed in waves 57,
  58, 59, 60, 61 status-check obs). The wave-62 head-verifier behavior is a specialization of that
  class: both reviewers already probed the claim independently, AND the head-verifier added a
  third layer of independent confirmation on the subset of claims that are irreversible-if-wrong.
  This is an intensification pattern within the wave-52 obs-3(a) class, not a new independent
  class. The broader class (independent probing at gate before accepting zero-finding verdict) is
  already confirmed-by-application under wave-52 obs-3(a) and remains HOLD pending promotion for
  VERIFY rule 5 there.

  The specific nuance — "for irreversible-if-wrong claims, the head-verifier adds a third
  independent layer even after dual-APPROVE" — is a new detail that strengthens the case for the
  wave-52 obs-3(a) rule candidate rather than initiating a separate observation class. If the
  wave-52 obs-3(a) VERIFY rule 5 candidate is eventually promoted, the irreversibility-escalation
  nuance should be captured in its Why clause or as a companion note, not as a separate rule.

  Cross-reference with candidate (a) from the brief: the head-learn brief asks whether this is
  genuinely NEW versus VERIFY-PRINCIPLES rule 3, and whether this is the 1st instance or has an
  equivalent appeared in prior-wave observations. Assessment:
  - Versus VERIFY rule 3: DISTINCT (different timing/trigger — see above). Not a restatement.
  - Versus wave-52 obs-3(a): this wave CONFIRMS the broader independent-probing class AND adds
    an irreversibility-escalation refinement. It is not the 1st instance of the broader class
    (wave-52 obs-3(a) is the origin); it is a strengthening data point within that class.
  - The specific irreversibility-escalation nuance (head-verifier adds a 3rd layer when both
    reviewers APPROVE but the claim is irreversible-if-wrong) is a 1st-instance sub-class detail
    within the broader wave-52 obs-3(a) class. It does not independently meet the 2-wave bar for
    promotion as a standalone observation — it enriches the existing HOLD.

  Source artifacts:
  - process/waves/wave-62/stages/V-3-fast-fix.md (§Gate assessment: "Independent head-verifier
    spot-check of the one irreversible-if-wrong item")
  - process/waves/wave-62/blocks/V/gate-verdict.md (§Rationale: "I did not accept the clean
    verdicts at face value: I spot-checked the single irreversible-if-wrong item")
  - command-center/principles/VERIFY-PRINCIPLES.md rule 3 (re-verify post-fast-fix; confirmed
    distinct from this class)
  - process/waves/_archive/wave-52/blocks/L/observations.md obs-3(a) (origin of the broader
    independent-probing class, still HOLD for VERIFY rule 5 candidate)

  Severity: informational (system operated correctly; the head-verifier's independent spot-check
    is the intended behavior; no defect surfaced or missed; the observation is a refinement of
    an existing HOLD class, not a new failure mode).
  Candidate principles file: none independently — enriches wave-52 obs-3(a) VERIFY rule 5
    candidate shape; when that candidate is promoted, the irreversibility-escalation nuance
    should inform the final rule text.
  Recurrence verdict: NOT a 1st instance of the broader class (wave-52 obs-3(a) is the origin
    and has been confirmed by application waves 57-62). The irreversibility-escalation
    sub-detail is a 1st-instance nuance within that broader class. NOT a restatement of VERIFY
    rule 3 (distinct trigger and timing). Enriches wave-52 obs-3(a); does not stand alone.
  Promotion flag: NONE independently — this obs exists to document the relationship clearly
    for L-2 karen. The wave-52 obs-3(a) HOLD remains the home; that candidate is still pending
    a 2nd-instance that FAILS when the independent probing is absent (or confirms via a gap
    caused by its absence).

---

- **[obs-3 — HOLD UPDATE (wave-58 obs-1, 1st instance): hardening a pass-regardless soft-check
  into a gating assertion surfaces a masked production defect — NO-CONFIRM this wave; HOLD
  maintained]**

  Wave-58 obs-1 (FIRST INSTANCE) documented: when a pass-regardless soft-check is converted to a
  gating hard assertion, the first honest CI run may gate red because a pre-existing production
  defect previously concealed by the softness is now exposed. The pre-shaped VERIFY-PRINCIPLES
  rule 5 candidate is held pending a confirming wave.

  Wave-62 assessment: this wave is a client-side IndexedDB substrate extension with no conversion
  of any existing assertion from pass-regardless to gating. There is no soft-check in the diff.
  CI ran 7/7 green on first attempt (C-1-pr-ci-merge.md: "CI 7/7 green"). V-2 triage was empty;
  no production defect was found. The structural prerequisite for the wave-58 obs-A class to fire
  (an existing pass-regardless check being hardened into a gating assertion) is entirely absent.

  Determination: NOT CONFIRMED. Wave-62 is not a confirming instance of the wave-58 obs-A class.

  Source artifacts: C-1-pr-ci-merge.md (CI 7/7 green, PR #77), V-2-triage.md (empty fast-fix
  queue), V-1-karen.md (all six load-bearing claims verified; only noise findings).

  Candidate rule shape preserved from wave-58 (NOT a nomination — still 1st instance only):
    "5. When converting a pass-regardless soft-check to a gating assertion, budget a production fix;
       surfacing the masked defect is the expected outcome."
    Rule = 104 chars. PASS. Why = "A soft-check that passes regardless hides whether the behavior
    works; the first honest run may gate red." Why with indent = 97 chars. PASS.
    No forbidden tokens. Not a near-dup of VERIFY rules 1-4. PASS.

  Severity: informational (status update; wave structure entirely orthogonal to the class).
  Candidate principles file: command-center/principles/VERIFY-PRINCIPLES.md (rule 5 candidate).
  Recurrence verdict: NO-CONFIRM wave-62. Still FIRST INSTANCE (wave-58 only). HOLD maintained.
  Promotion flag: HOLD — 1st instance; watch for a wave where a pass-regardless check is converted
    to a gating assertion and triggers a production-fix contingency.

---

- **[obs-4 — HOLD UPDATE (wave-58 obs-2, 1st instance): a prod-baseURL e2e is post-deploy
  verification, not a pre-merge gate — NO-CONFIRM this wave; HOLD maintained]**

  Wave-58 obs-2 (FIRST INSTANCE) documented: a Playwright suite whose baseURL targets the live
  production URL is a post-deploy verification instrument; marking it required in CI would block
  the branch fix that resolves the failing e2e.

  Wave-62 assessment: CI ran 7/7 green (C-1-pr-ci-merge.md confirms). The behavioral state of
  deployed prod before and after the merge is complementary (new Dexie v2 tables added; existing
  channel cache behavior unchanged). No e2e-red-then-fix cycle occurred; no situation arose where
  the production-baseURL classification was relevant to a merge decision.

  Determination: NOT CONFIRMED. Wave-62 is not a confirming or falsifying instance.

  Source artifacts: C-1-pr-ci-merge.md (7/7 CI green), C-2-deploy-and-verify.md (web SUCCESS
  b28ad3b), T-5-e2e.md (post-deploy live probe PASS).

  Candidate rule shape preserved from wave-58 (NOT a nomination — still 1st instance only):
    "11. Classify an e2e suite whose baseURL targets deployed prod as non-required in CI; it is
       post-deploy verification, not a pre-merge gate."
    Rule = 113 chars. PASS. Why = "A production-baseURL e2e tests the deployed binary, not the
    branch; gating merge on it blocks the fix." Why with indent = 99 chars. PASS.
    No forbidden tokens. Not a near-dup of CI rules 1-10. PASS.

  Severity: informational (status update; wave structure orthogonal to the class).
  Candidate principles file: command-center/principles/CI-PRINCIPLES.md (rule 11 candidate).
  Recurrence verdict: NO-CONFIRM wave-62. Still FIRST INSTANCE (wave-58 only). HOLD maintained.
  Promotion flag: HOLD — 1st instance; watch for a second wave where baseURL = prod classification
    is applied correctly or missed.

---

- **[obs-5 — HOLD UPDATE (wave-59 obs-3, 1st instance): test a multi-branch pure-function formatter
  as a single it.each table covering every output bucket — NO-CONFIRM this wave; HOLD maintained]**

  Wave-59 obs-3 (FIRST INSTANCE) documented: for an exhaustive multi-branch pure formatter, a
  single it.each table covering every output bucket is the correct T-1 unit shape; a row per
  bucket makes any single-branch drift fail deterministically. T-1.md currently has 0 rules.

  Wave-62 assessment: this wave adds 15 unit tests in dm-cache.test.ts (round-trip, ordering,
  tie-break, and preservation tests) and 23 tests in dm.test.tsx (write-through, offline fallback,
  socket parity). None of these tests exercise a multi-branch pure-function formatter. The
  dm-cache tests use describe/it structure (per-behavior), not an it.each table over output
  buckets. The class being watched (a pure formatter tested as a transition table) is not present
  in this wave's test authoring decisions.

  Determination: NOT CONFIRMED. Wave-62 is not a confirming instance of wave-59 obs-3.

  Source artifacts: V-1-karen.md (dm-cache.test.ts 15/15; dm.test.tsx 23/23 — test shapes
  verified as per-behavior unit assertions, not a pure-formatter bucket table), B-3-frontend.md
  (test file descriptions confirm the test structure).

  Candidate rule shape preserved from wave-59 (NOT a nomination — still 1st instance only):
    "1. Test a multi-branch pure formatter with a single it.each table covering every output
       bucket; add one row per boundary transition."
    Rule = 97 chars. PASS. Why = "A table makes a missing bucket visible as a missing row; N
    separate it() calls can omit a bucket silently." Why with indent = 97 chars. PASS.
    No forbidden tokens. Not a near-dup. PASS.

  Severity: informational (status update; wave structure orthogonal to the class).
  Candidate principles file: command-center/principles/test-layer-principles/T-1.md (rule 1
    candidate — T-1.md currently has 0 rules).
  Recurrence verdict: NO-CONFIRM wave-62. Still FIRST INSTANCE (wave-59 only). HOLD maintained.
  Promotion flag: HOLD — 1st instance; watch for a second wave where a multi-branch pure
    formatter is tested with an it.each table or where a missing bucket is silently omitted.

---

- **[obs-6 — status check on prior held observations]**

  Updating carried status from wave-61 obs-5 and all prior HOLDs:

  | origin | obs | class | wave-62 status |
  |--------|-----|-------|----------------|
  | wave-60 obs-1 (STRONG HOLD) | Hardcoded palette hex in 45 web-shell .tsx files where consumable CSS tokens exist; shade drift documented cost; karen L-2 ruling: REJECT/HOLD until token-migration wave lands + correct file target (DESIGN-PRINCIPLES) | NOT CONFIRMED. Wave-62 touches only apps/web/src/features/sync/ and apps/web/src/shell/useDm.ts + dm.test.tsx — no inline backgroundColor or hex literal changes. Not a confirming or falsifying instance. STRONG HOLD maintained. |
  | wave-58 obs-1 / obs-A | Hardening a pass-regardless soft-check into a gating assertion exposes a masked production defect | NOT CONFIRMED. No test assertion conversion; CI 7/7 green first attempt. See obs-3 above. HOLD maintained. |
  | wave-58 obs-2 / obs-B | Prod-baseURL e2e is post-deploy verification, not a pre-merge gate | NOT CONFIRMED. CI 7/7 green; classification not stress-tested. See obs-4 above. HOLD maintained. |
  | wave-59 obs-3 | Test a multi-branch pure formatter as an it.each table covering every output bucket | NOT CONFIRMED. No pure-function multi-branch formatter introduced or tested. See obs-5 above. HOLD maintained. |
  | wave-57 obs-1 | Interactive nav/rail button shipped with no onClick from a prior wave; gap invisible to tests; surfaced as UX papercut | NOT CONFIRMED. Wave-62 makes no UI component changes to interactive shell/nav buttons. Not a confirming instance. HOLD maintained. |
  | wave-56 obs-1 | P-0 three-reviewer convergence caught seed conflating scale-independent correctness cap with premature pagination UX; YAGNI split at P-0 | NOT CONFIRMED. Wave-62 P-0 was a clean PROCEED on a correctly-framed offline-cache extension; no YAGNI split or scale-dependent scope conflict. HOLD maintained. |
  | wave-56 obs-2 | ceo-reviewer explicitly retracted its own prior-wave N-2 seed nomination | NOT CONFIRMED. Wave-62 ceo-reviewer is a HOLD-SCOPE PROCEED on an M12 first bundle; no prior-wave nomination retracted. HOLD maintained. |
  | wave-55 obs-1 | Seed positive-only assertion redundant with existing control; load-bearing cell was the untested negative; 1st instance of false-coverage-value sub-class | NOT CONFIRMED. Wave-62 P-0 is a clean PROCEED on a correctly-framed premise (no seed-coverage-value claim made or falsified). Not a confirming instance. HOLD maintained. |
  | wave-54 obs-2 | Seed premise about entire WS info-disclosure vulnerability class being open was false; P-0 collapsed sweep to verify-only | NOT CONFIRMED. Wave-62 has no security sweep; seed premise was accurate and fully verified at P-0. Not a confirming instance. HOLD maintained. |
  | wave-52 obs-3 (a) | VERIFY: independently re-probe load-bearing claims at gate before accepting zero-finding verdict | CONFIRMED BY APPLICATION (intensified). Karen independently verified all six load-bearing claims at file:line (db.ts byte-identity + 497/497 re-run + HTTP 200 deploy). Jenny independently mapped all three spec blocks' ACs against DB-row spec source + merged source + T-5 live probe. Head-verifier independently spot-checked the irreversible-if-wrong Dexie v1→v2 migration item even after dual-APPROVE. All three layers converged without cross-endorsement. The behavior this rule candidate formalizes continues to occur correctly; wave-62 is the strongest instantiation observed (three independent verification layers on the single highest-risk irreversible item). Still 1st-instance HOLD for formal VERIFY rule 5 candidacy — no failure case to anchor it. |
  | wave-52 obs-3 (b) | Gate agent direct-writes to principles files | NOT CONFIRMED. No gate agent wrote directly to a principles file this wave. Remains 1st-instance HOLD. |
  | wave-50 obs-B | Parallel T-5 testers block on shared MCP Chrome profile | NOT CONFIRMED. T-5 ran as single-agent live offline probe (inherently single-client). Remains multi-wave HOLD. |
  | wave-50 obs-C | P-4/plan review enumerate compute-on-read walk paths for new per-row parameter | NOT CONFIRMED. Wave-62 has no compute-on-read walk; read-through cache helpers are O(1) point lookups or range queries. Remains multi-wave HOLD. |
  | wave-49 obs-B | Socket.IO namespace mismatch invisible to mocked-both-sides unit suite; T-4.md rule 1 | NOT CONFIRMED. Wave-62 adds no new Socket.IO gateway; DM socket write-through reuses the existing onDmMessage handler. Remains multi-wave HOLD. |
  | wave-49 obs-C | Responsive breakpoint not validated against D-3 adopted design at B-block | NOT CONFIRMED. D-block skipped (design_gap_flag false; data-source change on existing surface). Remains multi-wave HOLD. |
  | wave-44 obs-1 | Responsive/layout fix introduces overlay without WCAG dialog contract | NOT CONFIRMED. No layout fix or overlay. Remains multi-wave HOLD. |
  | wave-45 obs-1 | Browser resolution in committed playwright config | NOT CONFIRMED. No Playwright config change. Remains multi-wave HOLD. |
  | wave-45 obs-2 | playwright test --list false-green for browser-resolution change | NOT CONFIRMED. No Playwright config change. Remains multi-wave HOLD. |
  | wave-47 obs-C | Display-identifier vs opaque-id mismatch | NOT CONFIRMED. No component rendering user identities. Remains multi-wave HOLD. |
  | wave-41 obs-1 | V-3 redeploy false-green | NOT CONFIRMED. V-3 Phase 2 not triggered (fast-fix queue empty). Remains multi-wave HOLD. |
  | wave-41 obs-2 | Symbol-grep false-positive | NOT CONFIRMED. V-1 karen used file:line git-show inspection against deployed tree at b28ad3b. Remains multi-wave HOLD. |
  | wave-41 obs-3 | Parallel-path enforcement gap | NOT CONFIRMED. No new parallel sibling method. Remains multi-wave HOLD. |
  | wave-40 obs-1 | T-8 fix mechanism contradicts architectural decision | NOT CONFIRMED. No T-8 security surface; wave is a client-side IndexedDB extension with no architectural conflict. Remains multi-wave HOLD. |
  | wave-40 obs-4 | Global 22P02 filter / text-keyed route params | NOT CONFIRMED. No text-keyed route params. Remains multi-wave HOLD. |

  Severity: informational (status checks only; wave-52 obs-3(a) continues confirmed by application,
    with the strongest instantiation observed across all waves).
  Candidate principles file: none.
  Promotion flag: NO.

---

## Summary table

| id | title (short) | severity | recurrence | candidate file | disposition |
|----|---------------|----------|------------|----------------|-------------|
| obs-1 | Dexie .version(N+1).stores() must re-state all prior tables verbatim; omission silently deletes the store for all existing users on upgrade | warning | FIRST INSTANCE — no prior L-2 observation on this class (wave-20 introduced the Dexie substrate but recorded no obs on the upgrade-path hazard); not a near-dup of BUILD rule 3 (server-DB backfill/create parity vs client-side store-upgrade omission) | BUILD-PRINCIPLES rule 11 candidate | HOLD — 1st instance; watch for a wave adding a Dexie v(N+2) call or where an omission is caught by the preservation test |
| obs-2 | Head-verifier added a 3rd independent verification layer on the irreversible-if-wrong claim even after dual-APPROVE — enriches wave-52 obs-3(a) HOLD; distinct from VERIFY rule 3 (different timing/trigger); not a standalone new class | informational | Enriches wave-52 obs-3(a) confirmed-by-application class; 1st instance of the irreversibility-escalation sub-detail; NOT a restatement of VERIFY rule 3 | none independently — informs wave-52 obs-3(a) VERIFY rule 5 candidate shape | NONE independently — enriches existing HOLD; wave-52 obs-3(a) remains the home |
| obs-3 | wave-58 obs-A (soft-check-hardening class) — NO-CONFIRM wave-62; 1st instance only (wave-58) | informational | NO-CONFIRM wave-62; still 1st instance | VERIFY-PRINCIPLES rule 5 candidate shape | HOLD |
| obs-4 | wave-58 obs-B (prod-baseURL e2e = post-deploy verification) — NO-CONFIRM wave-62; 1st instance only (wave-58) | informational | NO-CONFIRM wave-62; still 1st instance | CI-PRINCIPLES rule 11 candidate shape | HOLD |
| obs-5 | wave-59 obs-3 (T-1 it.each-table-per-bucket class) — NO-CONFIRM wave-62; 1st instance only (wave-59) | informational | NO-CONFIRM wave-62; still 1st instance | T-1.md rule 1 candidate shape | HOLD |
| obs-6 | Status check on prior held observations | informational | status checks | none | STATUS CHECK ONLY |

**Observations emitted: 6 (obs-1 through obs-6)**
**Severities: 1 warning (obs-1), 5 informational (obs-2 through obs-6)**
**Promotion-eligible this wave: NONE — obs-1 is 1st instance; obs-2 enriches an existing HOLD; obs-3/4/5 are NO-CONFIRM status updates**
**Nominations for karen vetting: NONE this wave**

---

## Explicit recurrence verdicts on the two named candidates (per brief)

### Candidate (a): "head-verifier spot-checks the highest-risk irreversible claim against merged
source even when BOTH reviewers already APPROVE" — genuinely new vs VERIFY rule 3? 1st instance
or prior equivalent in archives?

**Verdict: DISTINCT from VERIFY rule 3; enriches wave-52 obs-3(a) class; 1st instance of the
irreversibility-escalation sub-detail; NOT standalone-promotable this wave.**

1. VERIFY rule 3 encodes: "Re-verify a fast-fix against the reviewer's live reproduction on
   deployed state, never on source review alone." The trigger is a fast-fix having been applied
   in Phase 2 of V-3; the norm is re-verification on deployed state post-fix. Wave-62's
   head-verifier action occurred at Phase 1 (gate accept/reject), with Phase 2 SKIPPED because
   the fast-fix queue was empty. Rule 3 is a post-fast-fix redeployment norm; the wave-62 action
   is a pre-acceptance irreversibility escalation at the gate. Different trigger (fast-fix applied
   vs irreversible-if-wrong claim identified at APPROVE review), different timing (Phase 2 post-fix
   vs Phase 1 gate decision), different question ("does the deployed fix actually work?" vs "is
   this non-reversible claim actually true before I APPROVE?"). These are distinguishable in both
   direction and scope. DISTINCT — not a restatement.

2. Archive check for prior equivalent: the broader independent-probing class exists at wave-52
   obs-3(a) and has been confirmed-by-application every subsequent wave (waves 57-62). The
   specific pattern "head-verifier adds a 3rd independent layer on the irreversible-if-wrong claim
   subset when both reviewers already returned APPROVE" first appears explicitly in wave-62's
   V-gate artifacts. No prior-wave observations.md records head-verifier performing this specific
   irreversibility-escalation step. This is the 1st instance of the sub-detail.

3. Relationship to wave-52 obs-3(a): obs-3(a) formalizes the general independent-probing norm at
   V-block gate. Wave-62 is the strongest observed instantiation of that norm: it shows the norm
   being applied at three layers (karen, jenny, head-verifier) rather than two, with the third
   layer specifically targeted at the irreversible-if-wrong subset. This is a clarifying data
   point for the shape of the eventual VERIFY rule 5 rule text, not a second independent
   observation requiring its own track. When wave-52 obs-3(a) is eventually promoted, the rule
   text should reflect that irreversibility is a trigger for a third verification layer, not just
   two.

4. Promotion bar: not met as a standalone obs — 1st instance of the sub-detail; enriches an
   existing HOLD. The wave-52 obs-3(a) HOLD is the correct home.

---

### Candidate (b): "when extending a shipped Dexie/IndexedDB store to a new content type, the
vN→vN+1 .version().stores() migration MUST re-state all prior tables verbatim or the prior store
is silently dropped (data loss)" — near-dup of BUILD rule 3? 1st instance or prior in archives?

**Verdict: DISTINCT from BUILD rule 3; FIRST INSTANCE as L-2 observation; BUILD-PRINCIPLES rule
11 candidate shape; HOLD pending 2nd confirming wave.**

1. Near-dup assessment vs BUILD rule 3: Rule 3 states "Any seed applied by a backfill must also
   appear in the create transaction, column-for-column." The domain is server-side Postgres: a SQL
   backfill seeds rows with a column value, and the create transaction must also include that seed
   or new rows are created without it, producing a different initial state from backfilled rows.
   The failure mode is a silent state divergence between existing (backfilled) and new (created)
   rows. The Dexie class concerns a client-side browser IndexedDB upgraded via Dexie's
   cumulative-declarative `.version().stores()` API: omitting a prior table from the upgrade
   declaration triggers Dexie to DROP that store (with all its rows) during the upgrade
   transaction. The failure mode is irreversible data loss for all existing users on upgrade. The
   differences are material: (a) domain — server DB vs client-side browser storage; (b) API model
   — SQL CREATE/INSERT vs Dexie's declarative upgrade manifest; (c) consequence — wrong initial
   state for new rows vs data loss for all existing users on upgrade; (d) detection — column-level
   backfill comparison vs upgrade-path preservation test with a shared IDBFactory. Not a near-dup.
   PASS.

2. Archive check: `grep -ri 'dexie|indexeddb|idb|\.version\(|offline.cache'` across all archived
   observations.md files returned: wave-20's L-2 ledger header describes the wave as shipping
   "Dexie/IndexedDB store + outbox/composer + fake-indexeddb harness" — this is a wave-description
   line, not an L-2 observation about the upgrade-path hazard. Wave-20's observations (obs-1
   through obs-4) address: P-0 stale-premise detection (obs-1, which was promoted to PRODUCT rule
   1), BUILD rule 4 validation (obs-2), V-block cursor-codec round-trip (obs-3), and principles-
   file write-outside-L-block (obs-4). None of the four obs in wave-20 addresses the Dexie
   `.version().stores()` omission-equals-deletion hazard. No other archived wave's observations.md
   contains a Dexie/IndexedDB migration obs. This is FIRST INSTANCE.

3. Falsifiability: "does db.ts .version(N+1) re-state every table from .version(N) verbatim?"
   is checkable by diffing the store lists between consecutive `.version()` calls. The answer
   is a binary yes/no with no ambiguity. Fully falsifiable.

4. Cost-if-ignored: irreversible silent data loss for every user who had M4 offline cache data in
   their browser on the wave upgrade. Unlike a server-side missing column, there is no server-side
   500 or log entry — the client's IndexedDB silently empties during the background upgrade
   transaction. No recovery path.

5. Promotion bar: not met — 1st instance. LOG and watch for a wave adding a Dexie .version(N+2)
   call or where a `.version(N+1)` omission is caught by the preservation test pattern (or,
   conversely, where it is not caught and a data-loss incident occurs in the live IndexedDB).

---

## Explicit recurrence table for standing held candidates

| origin | class | wave-62 result | standing |
|--------|-------|----------------|----------|
| wave-52 obs-3(a) | VERIFY: independently re-probe load-bearing claims at gate | CONFIRMED BY APPLICATION (3-layer instantiation; strongest to date) | HOLD for VERIFY rule 5 — no failure case yet; wave-62 enriches the candidate shape with irreversibility-escalation sub-detail |
| wave-58 obs-1 / obs-A | Soft-check-hardening exposes masked production defect | NO-CONFIRM | HOLD — 1st instance; no confirming wave yet |
| wave-58 obs-2 / obs-B | Prod-baseURL e2e = post-deploy verification | NO-CONFIRM | HOLD — 1st instance; no confirming wave yet |
| wave-59 obs-3 | T-1 it.each-table-per-bucket for pure formatter | NO-CONFIRM | HOLD — 1st instance; no confirming wave yet |
| wave-60 obs-1 | Hardcoded palette hex in 45 web-shell .tsx files; STRONG HOLD | NO-CONFIRM (wrong wave scope) | STRONG HOLD — karen REJECT pending token-migration wave + DESIGN-PRINCIPLES target |
| wave-57 obs-1 | Interactive nav/rail button ships with no onClick | NO-CONFIRM | HOLD — 1st instance; no confirming wave yet |
| wave-52 obs-3(b) | Gate agent direct-writes to principles files | NO-CONFIRM | HOLD — 1st instance |
