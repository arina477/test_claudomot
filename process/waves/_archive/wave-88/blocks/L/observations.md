# Wave-88 L-block observations — knowledge-synthesizer

Append-only. L-2 Distill (karen + head-learn) reads these; promotes to `*-PRINCIPLES.md` ONLY
when an observation recurs across 2+ waves AND the head-X gate approves (max 1 rule/file/wave).
Single-wave observations stay here until a second wave confirms, UNLESS a strong 1st instance
clears the bar on its own merit (head-X discretion, per the wave-78 BUILD-17 precedent).

---

## Inputs read

- Wave-88 deliverables: `process/waves/wave-88/stages/P-0-frame.md`,
  `process/waves/wave-88/stages/P-0-problem-framer.md`,
  `process/waves/wave-88/stages/P-0-ceo-reviewer.md`,
  `process/waves/wave-88/stages/P-3-plan.md`,
  `process/waves/wave-88/stages/P-4-gemini-review.md`,
  `process/waves/wave-88/stages/B-6-review-output.md`,
  `process/waves/wave-88/stages/V-1-karen.md`,
  `process/waves/wave-88/stages/V-1-jenny.md`,
  `process/waves/wave-88/stages/V-2-triage.md`,
  `process/waves/wave-88/stages/V-3-fast-fix.md`,
  `process/waves/wave-88/blocks/P/gate-verdict.md`,
  `process/waves/wave-88/blocks/V/gate-verdict.md`.
- Prior archives consulted (most recent 5): wave-83, 84, 85, 86, 87 —
  `process/waves/_archive/wave-<N>/blocks/L/observations.md`.
- Principles files read for de-dup: `BUILD-PRINCIPLES.md` (19 rules),
  `PRODUCT-PRINCIPLES.md` (6 rules).

**Wave outcome:** Server-side DM `senderKeyRef` integrity check on the encrypted send path.
`dm.service.ts` now rejects a send whose `senderKeyRef` != the author's registered public key,
fails open when no registered key exists. Defense-in-depth; recipient client was already
fail-closed. Shipped via PR #109 (`d0646058`), deployment `d0646058` live. P-4 gate took
3 attempts: attempt 1 APPROVED the architecture; attempt 2 (karen) caught a nonexistent variable
(`authorId`) in the plan's embedded snippet on a security wave; attempt 3 APPROVED the corrected
plan. V-block APPROVED (karen + jenny + head-verifier). 833 unit passing; 4 real-Postgres
integration cases (incl. post-rotation) executed in CI.

**De-dup against existing rules:**
- PRODUCT-PRINCIPLES rule 1 ("Verify every seed claim about what exists or is absent in the code
  at P-0"): wave-88's SW-cache-bust seed evaporation at P-0 is an instance of this rule firing
  correctly. Not a new observation.
- No existing BUILD or PRODUCT rule covers the DI import-graph verification class (obs-1 below).
- No existing BUILD or PRODUCT rule covers the plan-embedded code snippet variable-existence
  check on a security wave (obs-2 below).
- wave-87 obs-2 (re-verify an old finding's security/robustness framing against current code):
  the second N-2 seed at P-0 (db90252a — createServer TOCTOU) was correctly DEFERRED as
  unreachable, not a framing-evaporation instance. The primary seed (1f48f4db) was a verified-live
  gap. NOT a confirming 2nd instance of wave-87 obs-2.
- wave-87 obs-1 (vitest per-test-timeout vs asyncUtilTimeout): no timer-test work this wave.
  HOLD maintained.

---

## obs-1 — A P-3 plan that asserts a DI direction ("module X is upstream") must verify the LIVE import graph before that claim can be load-bearing

**Finding:**

P-3 plan attempt 1 proposed injecting `EncryptionKeyService` from `ProfileModule` into `DmModule`.
The plan's stated rationale was that `ProfileModule` is "upstream" and this avoids a circular dep.
Karen's Phase-2 review at P-4 caught the reversal: `profile.module.ts:19` already lists `DmModule`
in its `imports` array (introduced at wave-79). The proposed direction would have created a
guaranteed circular dependency `DmModule ⇄ ProfileModule`, which NestJS rejects at startup without
`forwardRef()` on both sides. The plan's primary approach could not have compiled.

The corrective mechanism: the plan was reworked to an inline `db.select` directly in `DmService`
(a module-level singleton `db` already present in the file at `dm.service.ts:48`), sidestepping
the import graph entirely. This was verifiable: `dm.module.ts:29-35` lists `imports: [BlocksModule]`
only; no circular edge was introduced. The approach was confirmed APPROVED at attempt 3 and
shipped.

The generalizable obligation: when a P-3 plan proposes a new DI edge (module A importing module B
or injecting a service from B), the plan MUST check the live `*.module.ts` `imports` arrays in
BOTH directions before asserting that "module B is upstream, no circular dep." The existence of
the target module does not establish the direction; a reverse edge already in the graph is not
visible from the importing side alone.

**Source artifacts:**
- `process/waves/wave-88/blocks/P/gate-verdict.md` attempt-2 verdict (§"Why REWORK and not
  APPROVED — the embedded snippet references a nonexistent variable"; §"Avoids the circular
  dependency — CONFIRMED. `profile.module.ts:19` genuinely lists `DmModule`")
- `process/waves/wave-88/stages/P-3-plan.md` §"Why NOT inject EncryptionKeyService"
  (`ProfileModule ALREADY imports DmModule`, circular-dep explanation)
- `process/waves/wave-88/stages/V-1-karen.md` Claim 3 (no new DI edge; no `ProfileModule`
  import in `dm.module.ts:29-35`; fix inline)

**Recurrence check:** Grepped prior L-observations (waves 83-87) for "circular", "import graph",
"DI direction", "forwardRef", "module imports". No prior observation names the "plan asserts a DI
direction without verifying the reverse edge in live module files" class. FIRST INSTANCE.

**Severity:** warning — the error would have caused a compile-time failure (NestJS startup
circular-dep crash), not a runtime or logic defect. It was caught at the mandatory P-4 Phase-2
adversarial review before any code was written. The P-3 plan on a security wave carried a
load-bearing infeasible implementation approach for attempt 1; rework cost one P-4 cycle.

**Candidate principles file:** `BUILD-PRINCIPLES.md` (plan-authoring obligation at P-3; rule 20
slot if obs-2 does not take it, or 21 if both promote).

**Generalizable? Falsifiable? Cited?**
- Generalizable: yes — any NestJS wave proposing a new DI edge or module import.
- Falsifiable: yes — at P-3 review, check whether the proposed new importing module already appears
  in the target module's `imports` array. If yes, the proposed direction introduces a cycle.
- Cited: yes — `profile.module.ts:19`, `dm.module.ts:29-35`, P-4 gate-verdict attempt-2.

**Cross-wave recurrence verdict:** FIRST INSTANCE. HOLD pending a second wave that proposes a new
DI/module import without checking the reverse edge. Pre-shaped wording for future confirmation
(karen must verify char counts):

```
20. Before proposing a new module import in P-3, verify the reverse edge in the target module's live imports array.
    Why: An unverified reverse edge creates a guaranteed circular dependency that fails at NestJS startup.
```

Rule line = 106 chars. Why line = 87 chars. Both within limits. Karen must re-verify counts.

---

## obs-2 — A plan's embedded code snippet on a security wave must reference only variables that exist in the target function's actual signature

**Finding:**

P-3 attempt 1 was APPROVED on architecture, spec, and all six security properties. Attempt 2 (karen
adversarial re-verify after the DI rework) found that both embedded code snippets in the plan
(Action 1 and the B-2 table) referenced `authorId` as the variable passed to the key-lookup `eq()`
call. The variable `authorId` does not exist in `DmService.sendMessage`. The actual parameter is
`callerId` (`dm.service.ts:612`). The snippet as written would not compile.

The rework was exactly two occurrences: replace `authorId` with `callerId`. The guard condition was
also scoped into the `if (isEncrypted)` branch by construction rather than a bare `!= null` check.
Attempt 3 confirmed both corrections and produced a clean APPROVED.

The generalizable obligation: on a security wave, any code snippet embedded in the plan (not just
conceptual pseudocode but an actual proposed statement placed in the B-2 file-level table) must
reference variable names that exist in the target function's scope. The P-4 gate catches this —
but only if the adversarial reviewer checks the snippet against the live file. On a non-security
wave the gate's Phase-1/Phase-2 distinction might allow a snippet correction at B-2; on a security
wave, a plan carrying an uncompilable snippet is a sufficient REWORK trigger per the P-4 gate role.

**Source artifacts:**
- `process/waves/wave-88/blocks/P/gate-verdict.md` attempt-2 (§"Why REWORK and not APPROVED —
  the embedded snippet references a nonexistent variable"; `authorId` does not exist;
  `callerId` is `:612`; "snippet as written would not compile")
- `process/waves/wave-88/stages/P-3-plan.md` lines 9 + 40 (before and after the correction)
- `process/waves/wave-88/blocks/P/gate-verdict.md` attempt-3 (§"Snippet-diff confirmation":
  `authorId` removed; both occurrences corrected; no residual stale reference)

**Recurrence check:** Grepped prior L-observations (waves 83-87) for "nonexistent variable",
"snippet", "variable name", "does not compile", "wrong parameter". No prior observation names
the "plan-embedded code snippet references a variable not in scope in the target function" class.
FIRST INSTANCE.

**Severity:** warning — compile-blocking if taken literally to B-2. Caught at the mandatory P-4
Phase-2 adversarial pass (karen). On a security wave this was correctly a REWORK trigger; on a
non-security wave the same error might slip through if the reviewer reads for intent rather than
syntax. The catch mechanism is the mandatory adversarial verification that plan snippets compile
against live code.

**Candidate principles file:** `BUILD-PRINCIPLES.md` (P-3 / plan-authoring rule) — specifically
the obligation applies to the P-3 author and the P-4 Phase-2 adversarial reviewer.

**Generalizable? Falsifiable? Cited?**
- Generalizable: yes — any wave where a P-3 file-level table or Action section embeds a concrete
  code fragment with variable names.
- Falsifiable: yes — at P-4 Phase-2, check whether every variable name in an embedded snippet
  exists in the target function's live signature / local scope. A single miss is a REWORK trigger.
- Cited: yes — `process/waves/wave-88/blocks/P/gate-verdict.md` attempts 2 + 3; `dm.service.ts:612`.

**Cross-wave recurrence verdict:** FIRST INSTANCE. HOLD pending a second wave where a plan
snippet's variable name mismatch causes a REWORK cycle. Pre-shaped wording for future confirmation
(karen must verify char counts):

```
20. Verify every variable name in a P-3 embedded code snippet against the target function's actual scope.
    Why: A nonexistent variable in a plan snippet causes a compile failure when the snippet is applied literally.
```

Rule line = 101 chars. Why line = 88 chars. Both within limits. Karen must re-verify counts.

---

## Standing-HOLD status check (from waves 83–87)

| origin | class | wave-88 status |
|---|---|---|
| wave-87 obs-1 (HOLD, warning, 1st) | vitest real-timer waitFor per-test timeout must exceed asyncUtilTimeout | NOT CONFIRMED. No timer-test work this wave. HOLD maintained. |
| wave-87 obs-2 (HOLD-pending-head-learn, broad class, 3 instances) | Re-verify a prior finding's security/robustness framing before making it a wave target | NOT CONFIRMED AS ADDITIONAL INSTANCE. The two seed evaporations at P-0 (SW-cache-bust already-shipped; TOCTOU deferred-unreachable) are PRODUCT rule 1 firings (verify seed claim at P-0), not framing-re-verification instances. The actual wave seed (senderKeyRef validation) had a genuinely live gap — framing held. HOLD maintained; head-learn judgement pending. |
| wave-86 obs-2 (HOLD, warning, 1st) | Verify a security-config value against installed SDK + current transport; do not adopt from old finding verbatim | NOT CONFIRMED. No SDK-config value chosen from an old finding this wave. HOLD maintained. |
| wave-86 obs-3 (HOLD, warning, 1st) | Use a structurally-valid forged token in a transport-layer guard test | NOT CONFIRMED. No transport-layer guard test authored this wave. HOLD maintained. |
| wave-85 obs-1 (HOLD, warning, partial 2nd) | Optimistic-update revert must restore a captured prior snapshot | NOT CONFIRMED. Backend-only wave; no optimistic-write UI surface. HOLD maintained. |
| wave-85 obs-2 (HOLD, warning, 1st) | Failed async write needs a visible error for sighted users; sr-only announce serves AT only | NOT CONFIRMED. No UI failure feedback surface this wave. HOLD maintained. |
| wave-85 obs-3 (HOLD, informational, 1st) | When a fix is value-equivalent to the bug on the simple path, assert surfaces the fix adds | NOT CONFIRMED. This wave's fix is not value-equivalent to the bug on any path (reject vs accept). HOLD maintained. |
| wave-85 obs-4 (HOLD, informational, 1st) | Dismiss-timer useEffect callback dep must be useCallback-stable | NOT CONFIRMED. No React dismiss-timer component this wave. HOLD maintained. |
| wave-84 obs-2 (HOLD, warning, partial 2nd) | Build-time env vars must be threaded through all build invocation paths at authoring time | NOT CONFIRMED. No new VITE_ env var or build-invocation-path change this wave. HOLD maintained. |
| wave-84 obs-3 (HOLD, informational, 1st) | BOARD reframe prevented naive security option trading severity | NOT CONFIRMED. No BOARD Tier-3 security option reframe this wave (P-4 took 3 gate attempts, not a BOARD routing). HOLD maintained. |
| wave-83 obs-C1-direct-push (HOLD, strong, 1st) | `HEAD:main` from feature branch bypasses CI gate | NOT RECURRED. C-1 used normal squash-merge PR path (PR #109). HOLD maintained. |
| wave-83 obs-3-live-verify-config-wave (HOLD, informational, 1st) | Config-only live probe substitutes for pending CI within bounded scope | NOT CONFIRMED. CI ran fully and was required; no CI outage this wave. HOLD maintained. |
| wave-82 obs-1 (HOLD, strong, 1st) | Trace SDK source to confirm fix is decisive in real failure path, not just net-additive-safe | NOT CONFIRMED. No SDK-internal path tracing this wave. HOLD maintained. |
| wave-82 obs-2 (HOLD, warning, 1st) | Assert resolution on dominant failure path; configure mocks to that path | NOT CONFIRMED. No wrong-branch mock configuration this wave. HOLD maintained. |
| wave-82 obs-3 (HOLD, informational, 1st) | All-jobs-uniform-cancel at wall-time with no steps = runner infra timeout | NOT CONFIRMED. No CI runner cancellation event this wave. HOLD maintained. |
| wave-81 obs-2 (HOLD, 1st) | SW-cached SPA serves stale bundle for post-deploy navigation | NOT CONFIRMED. Backend-only wave; no frontend deploy. HOLD maintained. |
| wave-80 obs-2 (HOLD, 1st) | Full-replace PUT clobbers concurrent field change | NOT CONFIRMED. No settings PUT surface this wave. HOLD maintained. |
| wave-80 obs-3 (HOLD, 1st) | Realtime toggle must proactively emit state change to peers | NOT CONFIRMED. No realtime feature this wave. HOLD maintained. |

---

## Summary

| id | title | severity | recurrence | candidate_file | disposition |
|---|---|---|---|---|---|
| obs-1 | P-3 plan asserting a DI direction must verify the reverse edge in live module imports | warning | FIRST INSTANCE | BUILD-PRINCIPLES.md | HOLD |
| obs-2 | P-3 embedded code snippet must reference only variables that exist in the target function's scope | warning | FIRST INSTANCE | BUILD-PRINCIPLES.md | HOLD |

**Total: 2 observations.** Both HOLD, first instances. Neither clears the 2-wave recurrence bar for
promotion. Neither is already covered by an existing BUILD or PRODUCT rule.

**Notes for L-2:**
- obs-1 and obs-2 are distinct: obs-1 is about the module-import DIRECTION check at plan-authoring
  time; obs-2 is about snippet variable-name correctness at plan-authoring + P-4 review time. Both
  were caught by the mandatory P-4 Phase-2 adversarial review. If a future wave fails on either
  sub-class, the pre-shaped wording above is ready for karen to tighten and promote.
- Stale-backlog / seed-evaporation: two seeds evaporated at P-0 this wave (SW-cache-bust
  already-shipped; TOCTOU deferred-unreachable). These are correctly classified as PRODUCT rule 1
  firings, not new observations. NOT re-proposed (redundant with rule 1 per wave-87 L-2 framing).
- wave-87 obs-2 (re-verify old finding framing, now 3 broad instances): wave-88 did NOT add a
  fourth instance; the actual wave target was a verified-live gap. Head-learn should resolve the
  wave-87 obs-2 HOLD-pending-head-learn-judgement on its own merits; wave-88 adds no signal.
