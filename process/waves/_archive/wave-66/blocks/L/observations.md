# Wave 66 — L-block observations ledger

Append-only. L-2 Distill (karen) reads these; promotes to `*-PRINCIPLES.md` ONLY when an
observation recurs across 2+ waves AND head-verifier approves (max 1 rule/file/wave). Single-wave
observations stay here until a second wave confirms.

---

## L-2 synthesis observations (knowledge-synthesizer)

Inputs read: process/waves/wave-66/stages/P-0-frame.md, B-6-review-output.md, T-9-journey.md,
V-1-summary.md, V-2-triage.md, V-3-fast-fix.md.
Gate verdicts checked: process/waves/wave-66/blocks/{P,B,T,V}/gate-verdict.md (all four gates
APPROVED; 0 findings at any severity; V-2 fast-fix queue empty; V-3 Phase 2 skipped).
Prior archives consulted: process/waves/_archive/wave-{61,62,63,64,65}/blocks/L/observations.md
(recurrence checks on all standing HOLDs: createObjectURL dual-revoke, async-concurrency /review
catch, soft-check-hardening, prod-baseURL e2e, T-1 it.each-table, wave-57 dead-onClick, wave-60
token-hex STRONG HOLD, wave-52 obs-3(a/b), and all older multi-wave HOLDs).
Principles files read: PRODUCT-PRINCIPLES.md (5 rules), BUILD-PRINCIPLES.md (11 rules),
VERIFY-PRINCIPLES.md (4 rules).
Wave scope: presentation-only copy split in 2 files
(apps/web/src/shell/ChannelSidebar.tsx + apps/web/src/shell/shell-components.test.tsx).
No logic, schema, API, Dexie version, object URL, async effect, or security surface change.

---

- **[obs-1 — INFORMATIONAL: the single pre-existing error-copy test was replaced by 3 deterministic
  mutual-exclusion cases (offline / reconnecting / online-error); the exhaustive branch coverage
  was confirmed by pre/post-merge diff; CONFIRMED-BY-APPLICATION of VERIFY-PRINCIPLES rule 4]**

  Before this wave, `shell-components.test.tsx:290` asserted a single case: the
  `detailStatus==='error'` branch rendered `/couldn't load channels/i`. After the split, the test
  was updated to assert three distinct, mutually exclusive cases: (1) offline connection state
  renders the neutral copy, (2) reconnecting connection state renders the neutral copy, and (3)
  online connection state with `detailStatus==='error'` renders the error copy. The exhaustive
  three-case replacement was verified from two independent angles: karen confirmed via a
  pre/post-merge diff (`d094f9c~1`) that the old single error case was "genuinely REPLACED" (not
  supplemented) by the 3 deterministic mutual-exclusion cases (V-1-summary.md: "old single error
  case genuinely REPLACED by 3 deterministic cases (offline/reconnecting/online, mutual-exclusion)"),
  and the head-verifier independently confirmed the same replacement pattern at V-3 gate
  (V-3-fast-fix.md §Gate summary: "old single error test genuinely REPLACED (pre/post-merge diff
  d094f9c~1) by 3 deterministic mutual-exclusion cases"). The `online` case (case 3) serves as
  the positive control that confirms genuine online failures still read as errors, satisfying
  VERIFY-PRINCIPLES rule 4: "A negative-case test passes verification only if a positive control
  admits the value the negative excludes."

  This is a CONFIRMED-BY-APPLICATION of VERIFY-PRINCIPLES rule 4. The wave added no new rule;
  the mechanism already in canon covered the case. No new observation is warranted.

  Source artifacts:
  - process/waves/wave-66/stages/V-1-summary.md (karen: "old single error case genuinely REPLACED
    by 3 deterministic cases (offline/reconnecting/online, mutual-exclusion); 18/18 re-run")
  - process/waves/wave-66/stages/V-3-fast-fix.md (§Gate summary: "old single error test genuinely
    REPLACED (pre/post-merge diff d094f9c~1) by 3 deterministic mutual-exclusion cases")
  - process/waves/wave-66/stages/P-0-frame.md (§Reframe — problem-framer REFINEMENT: "Test
    apps/web/src/shell/shell-components.test.tsx:290 asserts /couldn't load channels/i — must be
    updated (split offline-neutral vs online-error)")

  Severity: informational (the system worked as designed; rule 4 fired correctly via the positive
    control that the online-error branch still asserts error copy; zero B-block rework; all gates
    APPROVED first attempt).
  Candidate principles file: none — VERIFY-PRINCIPLES rule 4 already covers this class.
  Recurrence verdict: CONFIRMED-BY-APPLICATION of existing rule 4. Not a new promotable rule.
  Promotion flag: NONE.

---

- **[obs-2 — HOLD UPDATE: wave-65 obs-3 (1st instance: B-6 /review catches async-effect race /
  non-atomic DB write that Phase-1 code-read APPROVED missed) — NO-CONFIRM this wave; HOLD
  maintained]**

  Wave-65 obs-3 (FIRST INSTANCE) documented: B-6 Phase-2 /review caught two High-severity
  concurrency bugs (stale-response race + non-atomic put+prune) that the Phase-1 head-builder
  code-read had APPROVED. The structural pattern — async/temporal defects invisible to static
  inspection, requiring adversarial /review reproduction — was held as a 1st instance pending
  a confirming wave.

  Wave-66 assessment: the entire wave-66 diff is a JSX branch split on `useConnectionState()`
  return value and a test replacement. No new async effects, no new DB helpers, no concurrent
  state writes, no read-then-write sequences. B-6 review returned 0 surviving findings
  (B-6-review-output.md: "No findings survived verification (1 candidate → refuted). Copy-only
  presentation change; no production-bug surface."). The structural prerequisite for obs-3 to
  fire (a new async effect or DB transaction with interleaving risk) is entirely absent from
  this wave's diff.

  Determination: NOT CONFIRMED. Wave-66 is not a confirming instance of wave-65 obs-3.

  Source artifacts: B-6-review-output.md (0 findings; copy-only), V-2-triage.md (empty
  fast-fix queue), V-1-summary.md (0 findings from both reviewers).

  Pre-shaped candidate rule preserved from wave-65 (NOT a nomination — still 1st instance only):
    "12. Run adversarial /review on any new async effect with sequential state writes or DB
        helpers with read-then-write sequences; Phase-1 code-read cannot catch interleaving."
    Rule = 116 chars. PASS. Why = "A race or non-atomic sequence is temporal; static inspection
    of correct-looking code cannot expose it." Why with 4-space indent = 89 chars. PASS.
    No forbidden tokens. Not a near-dup of BUILD rules 1-11. PASS.

  Severity: informational (status update; wave structure orthogonal to the class being watched).
  Candidate principles file: command-center/principles/BUILD-PRINCIPLES.md (rule 12 candidate).
  Recurrence verdict: NO-CONFIRM wave-66. Still FIRST INSTANCE (wave-65 only). HOLD maintained.
  Promotion flag: HOLD — 1st instance; watch for a wave where /review catches an async-effect
    race or non-atomic DB write after a Phase-1 APPROVE.

---

- **[obs-3 — HOLD UPDATE: status check on all standing prior observations]**

  Updating carried status from wave-65 obs-4 and all prior HOLDs:

  | origin | obs | class | wave-66 status |
  |--------|-----|-------|----------------|
  | wave-64 obs-1 | createObjectURL for a cached Blob must pair src-change revoke AND unmount revoke | NOT CONFIRMED. Wave-66 touches ChannelSidebar.tsx (copy split) and shell-components.test.tsx only; no Blob, no createObjectURL, no useCachedAttachmentImage usage. Not a confirming instance. HOLD maintained. |
  | wave-65 obs-3 | B-6 /review catches async-effect race / non-atomic DB write that Phase-1 APPROVED | NOT CONFIRMED. See obs-2 above. No async effects or DB writes in this wave. HOLD maintained. |
  | wave-58 obs-A | Hardening a pass-regardless soft-check into a gating assertion exposes a masked production defect | NOT CONFIRMED. The test replacement this wave is a net-new split authoring (3 new cases replacing 1 old one), not a conversion of a pass-regardless check to gating. Not a confirming instance. HOLD maintained. |
  | wave-58 obs-B | Prod-baseURL e2e is post-deploy verification, not a pre-merge gate | NOT CONFIRMED. T-9 journey regen skipped (no new route/screen/endpoint); classification not stress-tested. HOLD maintained. |
  | wave-59 obs-3 | Test a multi-branch pure formatter with a single it.each table covering every output bucket | NOT CONFIRMED. Wave-66 tests split an existing assertion into 3 mutual-exclusion cases for a JSX branch, not a multi-branch pure-function formatter. Structurally adjacent but distinct: the wave-59 class concerns a pure formatter output-bucket table; this wave's test is a connection-state JSX render branch. Not a confirming instance. HOLD maintained. |
  | wave-60 obs-1 (STRONG HOLD) | Hardcoded palette hex in 45 web-shell .tsx files where consumable CSS tokens exist | NOT CONFIRMED. Wave-66 touches ChannelSidebar.tsx for a copy change only; no backgroundColor or palette hex literal changes. Not a confirming instance. STRONG HOLD maintained. |
  | wave-57 obs-1 | Interactive nav/rail button shipped with no onClick from a prior wave | NOT CONFIRMED. Wave-66 makes no UI nav/rail button changes. Not a confirming instance. HOLD maintained. |
  | wave-52 obs-3(a) | VERIFY: independently re-probe load-bearing claims at gate before accepting zero-finding verdict | CONFIRMED BY APPLICATION. Karen independently verified all 4 load-bearing claims at file:line against merge d094f9c (split not-inverted at ChannelSidebar.tsx:341-343; useConnectionState called once at :179; pre/post-merge diff confirms test replacement; 0 apps/api files; 18/18 re-run). Jenny independently byte-confirmed both copy strings in the deployed bundle index-CHxdidDO.js (source-to-deployed match) and confirmed AC2 online-error preserved on deployed prod. Head-verifier at V-3 gate probed both reviewers' claims independently ("clean verdict probed, not rubber-stamped") and confirmed deployed-artifact behavior from independent angles. Behavior continues correctly. Still HOLD for VERIFY rule 5 candidacy — no failure case yet. |
  | wave-52 obs-3(b) | Gate agent direct-writes to principles files | NOT CONFIRMED. No gate agent wrote directly to a principles file this wave. Remains 1st-instance HOLD. |
  | wave-50 obs-B | Parallel T-5 testers block on shared MCP Chrome profile | NOT CONFIRMED. T-9 journey regen skipped; no multi-agent T-5 session. Remains HOLD. |
  | wave-50 obs-C | P-4/plan review enumerate compute-on-read walk paths for new per-row parameter | NOT CONFIRMED. Wave-66 has no compute-on-read walk; copy-only change. Remains HOLD. |
  | wave-49 obs-B | Socket.IO namespace mismatch invisible to mocked-both-sides unit suite | NOT CONFIRMED. Wave-66 has no Socket.IO changes. Remains HOLD. |
  | wave-49 obs-C | Responsive breakpoint not validated against D-3 adopted design at B-block | NOT CONFIRMED. D-block skipped (design_gap_flag false; copy-only change on existing surface). Remains HOLD. |
  | wave-44 obs-1 | Responsive/layout fix introduces overlay without WCAG dialog contract | NOT CONFIRMED. No layout fix or overlay. Remains HOLD. |
  | wave-45 obs-1/2 | Browser resolution in Playwright config / playwright test --list false-green | NOT CONFIRMED. No Playwright config change. Remains HOLD. |
  | wave-47 obs-C | Display-identifier vs opaque-id mismatch | NOT CONFIRMED. No component rendering user identities. Remains HOLD. |
  | wave-41 obs-1 | V-3 redeploy false-green | NOT CONFIRMED. V-3 Phase 2 not triggered (empty queue). Remains HOLD. |
  | wave-41 obs-2 | Symbol-grep false-positive | NOT CONFIRMED. Karen used file:line inspection against deployed tree d094f9c. Remains HOLD. |
  | wave-41 obs-3 | Parallel-path enforcement gap | NOT CONFIRMED. No new parallel sibling method. Remains HOLD. |
  | wave-40 obs-1 | T-8 fix mechanism contradicts architectural decision | NOT CONFIRMED. No T-8 surface; copy-only change. Remains HOLD. |
  | wave-40 obs-4 | Global 22P02 filter / text-keyed route params | NOT CONFIRMED. No text-keyed route params. Remains HOLD. |
  | wave-56 obs-1 | P-0 three-reviewer convergence caught seed conflating scale-independent correctness cap with premature pagination UX; YAGNI split | NOT CONFIRMED. Wave-66 P-0 was a clean PROCEED on a single-purpose copy fix; no scope conflict or YAGNI split. Remains HOLD. |
  | wave-56 obs-2 | ceo-reviewer explicitly retracted its own prior-wave N-2 seed nomination | NOT CONFIRMED. Wave-66 ceo-reviewer is PROCEED/HOLD-SCOPE; no retraction. Remains HOLD. |
  | wave-55 obs-1 | Seed positive-only assertion redundant with existing control | NOT CONFIRMED. Wave-66 P-0 premise was accurate and verified at P-0. Not a confirming instance. Remains HOLD. |
  | wave-54 obs-2 | Seed premise about entire WS info-disclosure vulnerability class being open was false | NOT CONFIRMED. Wave-66 has no security sweep. Remains HOLD. |

  Severity: informational (status checks only; wave-52 obs-3(a) continues confirmed by application;
    all other HOLDs unchanged; wave-65 obs-3 is the key new HOLD this cycle).
  Candidate principles file: none.
  Promotion flag: NO.

---

## Summary table

| id | title (short) | severity | recurrence | candidate file | disposition |
|----|---------------|----------|------------|----------------|-------------|
| obs-1 | Existing single error-branch test replaced by 3 deterministic mutual-exclusion cases; positive control (online-error) preserved; VERIFY rule 4 applied correctly | informational | CONFIRMED-BY-APPLICATION of VERIFY-PRINCIPLES rule 4 | none | NO PROMOTION — rule 4 already covers this class |
| obs-2 | wave-65 obs-3 (B-6 /review catches async-effect race / non-atomic DB write that Phase-1 APPROVE missed) — NO-CONFIRM wave-66; 1st instance only (wave-65) | informational | NO-CONFIRM wave-66; still 1st instance | BUILD-PRINCIPLES rule 12 candidate shape | HOLD |
| obs-3 | Status check on all standing prior observations | informational | wave-52 obs-3(a) continues confirmed by application; all other HOLDs unchanged | none | STATUS CHECK ONLY |

**Observations emitted: 3 (obs-1 through obs-3)**
**Severities: all informational (trivial copy-fix wave; 2 files; 0 findings; all gates APPROVED first attempt; V-3 Phase 2 skipped)**
**Promotion-eligible this wave: NONE**
**Nominations for karen vetting: NONE this wave**
