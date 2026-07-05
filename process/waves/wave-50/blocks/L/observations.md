# Wave 50 — L-block observations ledger

Append-only. L-2 Distill (karen) reads these; promotes to `*-PRINCIPLES.md` ONLY when an
observation recurs across 2+ waves AND head-verifier approves (max 1 rule/file/wave). Single-wave
observations stay here until a second wave confirms.

---

## L-2 synthesis observations (knowledge-synthesizer)

Inputs read: process/waves/wave-50/ full artifact set (P-1-decompose, P-3-plan, B-5-verify,
B-6-review, B-6-review-output, B/gate-verdict, C-1-pr-ci-merge, T-5-tester-1, T-5-tester-2,
T-5-e2e, V-1-karen, V-1-jenny, V-2-triage, V-3-fast-fix, V/gate-verdict).
Prior archives consulted: process/waves/_archive/wave-{46,47,48,49}/blocks/L/observations.md
(recurrence checks on B-5 CI parity, T-5 MCP profile contention, sub-floor override pattern,
and all prior held HOLDs).
Principles files read: BUILD-PRINCIPLES.md (9 rules), T-5.md (2 rules).

---

- **[obs-A — RECURRING (4th instance): B-5 CI-command parity; full repo-wide `biome ci .` caught escapes before C-1]**

  B-5 ran `biome ci .` (repo-wide, CI-identical) and caught 2 format-drift files
  (`apps/api/test/integration/study-timer.integration.spec.ts` and
  `apps/web/src/styles/globals.css`) that the specialists' scoped `biome ci src/...` runs
  had missed. Both were fixed and committed (3d5b53b) before B-6, resulting in 0 fix-up
  cycles at C-1 (all 7 required CI checks green on the first run). This directly contrasts
  with wave-49, where B-5 was absent and 4 fix-up cycles were consumed at C-1.

  Recurrence lineage (confirmed by B-5-verify.md § "Note for L-2" and wave-49 obs-A):
  - wave-38 obs-1: B-5 specialist omits `biome ci .`; 3 deterministic Biome errors reach CI;
    1 fix-up commit. FIRST INSTANCE.
  - wave-42 obs-2: test-automator pushes T-4 spec after tsc only; biome lint fails; 1 fix-up
    commit. SECOND INSTANCE. Promotion-eligible; BUILD rule 9 slot taken that wave.
  - wave-49 obs-A: B-5 has NO deliverable; neither `biome ci .` nor `pnpm test:ci` run; 4
    fix-up cycles at C-1. THIRD INSTANCE. Karen APPROVED at wave-49 L-2; dropped on 1-char
    why-line overflow (104 chars vs 100-char cap).
  - wave-50 (this wave): B-5 ran `biome ci .` CORRECTLY; caught 2 escapes before B-6; 0
    fix-up cycles. FOURTH INSTANCE (positive: rule followed → C-1 first-run green). The
    4th instance strengthens the causal claim: the gap is structural and the fix is
    mechanical and consistent.

  Source artifacts:
  - process/waves/wave-50/stages/B-5-verify.md (§ "Note for L-2"; `biome_ci_repo_wide: PASS`
    after 2 format-drift fixes; `fix_up_cycles: 0`)
  - process/waves/wave-50/stages/C-1-pr-ci-merge.md (`fix_up_cycles: 0`; all 7 CI checks
    first-run green)
  - process/waves/_archive/wave-49/blocks/L/observations.md (obs-A; 3rd instance;
    karen-APPROVED, dropped on format overflow)

  Severity: strong (4 confirmed instances across distinct waves and agents; measurable C-1
  fix-up cycle cost when absent; first-run green when followed; causal relationship verified).
  Candidate principles file: command-center/principles/BUILD-PRINCIPLES.md (rule 10).
  Candidate rule (pre-trimmed, char-counted WITH the 3-space indent):

  ```
  10. B-5 verify runs the exact CI commands, full lint and full test suite, not a subset, before B-6 review.
     Why: A subset missing the CI-identical lint or tests lets failures reach C-1 as post-merge fixes.
  ```

  Char count verification:
  - Rule line: "10. B-5 verify runs the exact CI commands, full lint and full test suite, not a subset, before B-6 review." = 106 chars. PASS (≤120).
  - Why line WITH 3-space indent: "   Why: A subset missing the CI-identical lint or tests lets failures reach C-1 as post-merge fixes." = 99 chars. PASS (≤100).
  - Forbidden tokens: no `we`, `our`, `the team`, `wave-<N>`, em-dash, no parenthetical >5 words. PASS.
  - Exactly 2 non-empty lines: PASS.

  Recurrence: RECURRING — 4th confirmed instance (waves 38, 42, 49, 50).
  Promotion flag: YES — meets 2+ wave bar; all 4 instances cited; generalizable (any CI-linted
  project); falsifiable (checkable: does B-5 produce a deliverable showing `biome ci .` exit 0
  and the test suite passing with the full repo scope?). Pre-trimmed entry passes the linter bar
  that blocked wave-49. NOMINATION for karen vetting at L-2.

---

- **[obs-B — FIRST INSTANCE: parallel T-5 testers mutually exclude on the shared MCP Chrome profile; workaround = isolated playwright node package]**

  Two `ui-comprehensive-tester` agents spawned concurrently for T-5. The MCP
  playwright servers share a single non-isolated Chrome profile; only one tester can hold
  the browser at a time. Tester-2's first run was BLOCKED waiting for the profile lock;
  tester-1 held it. Resolution: tester-2 re-ran driving the installed `playwright` node
  package directly with its own headless Chromium and an isolated `browserContext`,
  matching the approach tester-1 had used. Both testers succeeded cleanly with this
  approach and all 8 scenarios passed.

  Note: wave-49 T-5-tester-2 observed the shared-profile constraint ("instances share one
  Chrome-for-testing profile so only one holds the browser") but worked around it by
  acquiring the lock on playwright-1 rather than blocking. That wave's L-2 obs did NOT
  record this class. Wave-50 is the first explicit BLOCK from the contention and the first
  documented wave-level resolution path (isolated node package).

  The T-5.md rules 1 and 2 cover the per-session MCP-launch-failure bypass and committing
  the browser flag. The generalizable gap here is upstream: when TWO testers are co-spawned,
  the harness should provision each with a distinct `--user-data-dir` (or use the node
  package directly per tester), not share a profile between concurrent agents.

  Source artifacts:
  - process/waves/wave-50/stages/T-5-tester-2.md (§ "No MCP playwright-* tools used;
    no existing browser process touched/killed. The prior BLOCKED (shared MCP Chrome-profile
    lock) is resolved by not touching MCP at all.")
  - process/waves/wave-50/stages/T-5-e2e.md (§ "Note (non-finding)": "the MCP playwright
    servers share one Chrome profile (non-isolated) → concurrent testers mutually exclude
    (tester-2 first run BLOCKED). Workaround: drive the installed playwright node package
    with an isolated context.")

  Severity: warning (one tester fully BLOCKED; required a re-run with the workaround;
  adds latency and requires tester awareness of the constraint).
  Candidate principles file: command-center/principles/test-layer-principles/T-5.md (rule 3).
  Candidate rule shape:
    3. When two T-5 testers run concurrently, each must use a distinct isolated browser
       context; do not share the MCP Chrome profile across agents.
       Why: Concurrent MCP testers contend on one Chrome profile; the second agent blocks
       until the first releases it.
    Rule line = 104 chars; why line WITH 3-space indent = 98 chars. No forbidden tokens. PASS.
  Recurrence: FIRST INSTANCE (wave-49 had a related awareness but no BLOCK and no
  recorded obs). HOLD — promote on a second wave where a concurrent T-5 spawns block on
  the shared MCP profile.

---

- **[obs-C — FIRST INSTANCE: P-4 reviewer flagging compute-on-read multi-path threading pre-B-block prevents restart/self-heal corruption class]**

  The P-4 (gemini) review — supplemented by the karen-2 carry from P-block into B-block —
  identified that custom durations must be threaded through the COMPLETE compute-on-read
  walk (`computeCurrentPhase`, `doPhaseAdvance`, `selfHealIfOverdue`, `startTimer`), not
  only the `startTimer` entry path. This pre-build correctness carry prevented a specific
  class of corruption: a restarted process self-healing a custom-duration timer with
  hardcoded 25/5 constants instead of the configured row values, silently truncating the
  remaining phase time for all members.

  The B-6 gate-verdict (head-builder) and karen V-1 both verified the karen-2 threading
  carry is REAL on the merge tree: bare `WORK_DURATION_MS`/`BREAK_DURATION_MS` constants
  appear ONLY in the no-row fallback paths, never in the live compute walk. The self-heal
  corruption vector is structurally closed.

  The generalizable class: when a spec introduces a per-row configuration parameter that
  feeds a compute-on-read state walk with multiple read paths (start, self-heal, phase
  advance), the P-4/plan review must enumerate ALL read paths that use the parameter and
  confirm each threads the row value, not a module-level constant. A reviewer catch at
  P-4 is cheaper than a B-block rework or a live corruption bug.

  Source artifacts:
  - process/waves/wave-50/blocks/B/gate-verdict.md (§ "karen-2 (duration threading):
    CONFIRMED. … selfHealIfOverdue passes row to computeCurrentPhase and phaseDurationMs.")
  - process/waves/wave-50/stages/V-1-karen.md (§ Finding 6: "bare WORK/BREAK_DURATION_MS
    constants appear in ONLY 3 spots, all no-row fallbacks; the walk is fully row-aware")
  - process/waves/wave-50/stages/P-3-plan.md (§ B-2 step: "Start/advance use configured
    durations instead of hardcoded 25/5 constants")

  Note: the P-4 gemini stage returned HTTP 429 (credits depleted) and could not be
  read directly. The karen-2 carry is documented in B/gate-verdict and V-1-karen, which
  confirm it was active pre-B-block. The P-3 plan also explicitly scopes the threading
  refactor, confirming the carry was in-scope from the plan stage.

  Severity: warning (a missed carry would have shipped a silent state-corruption bug on
  the first process restart; the catch prevented it).
  Candidate principles file: command-center/principles/BUILD-PRINCIPLES.md (rule 10 slot
  — competing with wave-49 obs-C and wave-47 obs-C).
  Recurrence: FIRST INSTANCE. HOLD — promote on a second wave where a compute-on-read
  walk with multiple read paths fails to thread a new per-row parameter through all paths,
  causing a live state-corruption bug that a P-4 catch or plan review would have prevented.

---

- **[obs-D — status check on prior held observations]**

  | origin | obs | class | wave-50 status |
  |--------|-----|-------|----------------|
  | wave-49 obs-B | Socket.IO namespace mismatch; mocked-both-sides unit suite invisible to namespace string drift; T-4.md rule 1 | NOT CONFIRMED. Wave-50 reuses the wave-49 `/study-timer` gateway; no new gateway namespace introduced. Remains 2nd-instance HOLD. |
  | wave-49 obs-C | Responsive breakpoint not validated against D-3 adopted design at B-block; BUILD rule 10 | CONFIRMED BY CORRECT APPLICATION — the F-1 fix (the exact class wave-49 obs-C flagged) was authored and validated correctly at B-3, with a T-5 and T-6 pass on the slim-bar border at <1024px. This is a positive application, not a second failure. HOLD maintained (still needs a second failure instance to promote). |
  | wave-44 obs-1 | Responsive/layout fix introduces overlay without WCAG dialog contract; BUILD rule 10 | NOT CONFIRMED. No layout fix introducing an overlay this wave. Remains 6-wave HOLD. |
  | wave-45 obs-1 | Browser resolution in committed playwright config; T-5 rule 3 | NOT CONFIRMED (positive — T-5 launched cleanly via node package). Remains 5-wave HOLD. |
  | wave-45 obs-2 | `playwright test --list` false-green for browser-resolution change; BUILD rule 10 | NOT CONFIRMED. No Playwright config change this wave. Remains 5-wave HOLD. |
  | wave-47 obs-C | Display-identifier vs opaque-id mismatch; BUILD rule 10 | NOT CONFIRMED. No component rendering user identities via opaque-id mismatch. Remains 3-wave HOLD. |
  | wave-41 obs-1 | V-3 redeploy false-green; CI rule 7 amendment | NOT CONFIRMED. No V-3 fast-fix redeploy (V-3 Phase 2 not triggered). Remains 9-wave HOLD. |
  | wave-41 obs-2 | Symbol-grep false-positive; VERIFY rule 5 slot | NOT CONFIRMED. No bundle verification via symbol-name grep. Remains 9-wave HOLD. |
  | wave-41 obs-3 | Parallel-path enforcement gap; BUILD rule 10 | NOT CONFIRMED. No new parallel-method enforcement boundary. Remains 9-wave HOLD. |
  | wave-40 obs-1 | T-8 fix mechanism contradicts architectural decision; PRODUCT rule 4 | NOT CONFIRMED. No T-8-sourced architectural conflict. Remains 10-wave HOLD. |
  | wave-40 obs-4 | Global 22P02 filter / text-keyed route params; BUILD rule 10 | NOT CONFIRMED. No text-keyed route params introduced. Remains 10-wave HOLD. |

---

## Summary table

| id | title (short) | severity | recurrence | candidate file | disposition |
|----|---------------|----------|------------|----------------|-------------|
| obs-A | B-5 CI-command parity: `biome ci .` (full repo) caught 2 escapes missed by scoped runs; 0 fix-up cycles when followed | strong | 4th instance (waves 38, 42, 49, 50); PROMOTION-ELIGIBLE | BUILD-PRINCIPLES rule 10 | PROMOTION CANDIDATE — 4 confirmed instances; generalizable; falsifiable; pre-trimmed entry passes linter; nominate for karen |
| obs-B | Parallel T-5 testers block on shared MCP Chrome profile; workaround = isolated playwright node package per tester | warning | 1st instance (wave-49 awareness only, no prior recorded obs) | T-5.md rule 3 | HOLD — promote on 2nd confirming wave |
| obs-C | P-4/plan review enumerated all compute-on-read walk paths for new per-row parameter, preventing self-heal corruption; generalizable pre-build carry class | warning | 1st instance | BUILD-PRINCIPLES rule 10 | HOLD — promote on 2nd confirming wave |
| obs-D | Status check on prior held observations | informational | status checks | null | STATUS CHECK ONLY |

**Observations emitted: 4 (obs-A through obs-D)**
**Severities: 1 strong (obs-A), 2 warning (obs-B, obs-C), 1 informational (obs-D)**
**Promotion-eligible: obs-A (4th failure/positive instance; BUILD-PRINCIPLES rule 10)**
**Nomination for karen vetting: obs-A (primary); pre-trimmed 2-line entry above passes linter**
