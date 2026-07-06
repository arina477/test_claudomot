# L-2 — Distill (wave-68)

## Action 1+2 — Tasks marked done + verified
`claimed_task_ids = [2bd37c4c]`. UPDATE flipped `2bd37c4c-eca8-4eda-900b-0276fe46f1b3` `in_progress → done` (RETURNING confirmed 1 row). Action-2 verification re-SELECT: status `done`. No skipped/ineligible rows.

## Action 3 — knowledge-synthesizer
Spawned against `process/waves/wave-68/` + the last 5 waves' observations + all principles files. Output: `process/waves/wave-68/blocks/L/observations.md` — **5 observations** (2 warning = same built-not-wired signal; 3 informational). All blameless + system-level + artifact-cited.

## Action 4 — Promotion candidates
One candidate cleared the Generalizable + Falsifiable + Cited + recurring + costly + binary bar:
- **built-but-not-wired-seam** (obs-1 / Candidate 2) → BUILD-PRINCIPLES.md rule 12. 2nd instance (wave-67 obs-3 route-outside-Provider = 1st; wave-68 seam-not-wired at ChannelSidebar = 2nd) — same class: a missing call-site wire, invisible to isolated component tests (which inject the dep) and to optional-prop typecheck.

Held (no promotion):
- **mocked-DB-tests-miss-real-query-bugs** (Candidate 1): genuine 2nd instance but ALREADY-CANON — test-writing-principles.md rule 26 covers it. Promoting a restatement = duplicate-promotion anti-pattern. HOLD-RESOLVED.
- All other standing HOLDs maintained (see observations.md obs-3 status table).

## Action 5 — karen vet + Action 6 — lint & promote
Candidate: `process/waves/wave-68/blocks/L/candidates/BUILD-PRINCIPLES.md` targeting rule 12.
- **Karen pass 1:** Contract format REJECT (Why line 118 chars > 100 hard limit). Code-claim **CONFIRMED** at HEAD: ChannelSidebar.tsx:173+:352 wires `onSaveSuccess={refetchDetail}`; seam test shell-components.test.tsx:370-445 asserts the real call path; isolated false-pass counterpart at server-overview-settings.test.tsx:298-314.
- **Deterministic linter (attempt 1, karen's stripped-length rewrite):** REJECT — full-line lengths rule 122 / why 104 (linter counts the `12. ` prefix + `   Why: ` indent, not stripped content).
- **Cap-1 karen rewrite:** returned a shorter 2-line candidate.
- **Deterministic linter (attempt 2):** **OK** — rule 112 / why 98, exactly 2 non-empty lines, no forbidden tokens.
- **Promoted** rule 12 to `command-center/principles/BUILD-PRINCIPLES.md` under § Rules; committed with candidate file as audit trail (`912d03a`).

Rule 12: `Test a component's success callback through its real parent caller, not the component rendered in isolation. / Why: An isolated test injecting the prop passes while the caller never wires it, no-oping live.`

## T-9 out-of-band promotion adjudication (V-3 flag)
head-tester appended rules **28 + 29** to `test-writing-principles.md` at T-9 (commit `98dd773`), bypassing the L-2 karen-vetted lane. L-2 review against that file's own "Contract for new rules":
- **Rules STAND on substance.** Both are format-clean (`### N.` + `Why:` template, no war stories/wave-refs/Context/Cross-ref/stack names, sequential 28/29), non-duplicative (grep-confirmed distinct from rules 9/10/25/26), and map to real wave-68 artifacts (28 → T-8 non-owner PATCH→403 row-unmodified attack proof; 29 → B-6 post-save reconcile + T-5 close+reopen). This file's own cap is "≥3 new rules share a theme," NOT the strict ≤1-per-file-per-wave `*-PRINCIPLES.md` L-2 cap; two additions are within it.
- Reverting substance-clean, contract-conformant, genuinely-recurring rules purely to punish the process path = lesson-deletion, not restraint → NOT reverted.
- **The out-of-band PROCESS is the flagged anti-pattern** (principle promotion belongs in the L-2 karen-vetted lane, not an in-stage gate-agent append). 2nd instance of wave-52 obs-3(b) (gate-agent principles-file direct-write) — HELD as a recurring process signal for future L-2 (candidate for a brain-level "gate agents route candidates to L-2" rule). No principles-file rule promoted for it (process/routing observation, no principles-file home).
- This adjudication CONSUMES test-writing-principles.md's wave-68 promotion budget → **0 additional** rules to that file.

## Net promotions
**1 total:** BUILD-PRINCIPLES.md rule 12. test-writing-principles.md: 0 additional (rules 28/29 pre-existing via T-9, left standing). All other files: 0.

---

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "tasks: 2bd37c4c done (verified via re-SELECT)"
  - "observations: process/waves/wave-68/blocks/L/observations.md (5 observations)"
  - "principles promotions: 1 (BUILD-PRINCIPLES.md rule 12); commit 912d03a"
tasks_marked_done: [2bd37c4c-eca8-4eda-900b-0276fe46f1b3]
tasks_skipped_with_reason: []
observations_emitted: 5
promotion_candidates: 1
karen_verdicts:
  - {candidate_id: BUILD-PRINCIPLES-rule-12, target_file: command-center/principles/BUILD-PRINCIPLES.md, verdict: "REJECT(format,why>100) then APPROVE-after-rewrite; code-claim CONFIRMED at HEAD"}
linter_runs:
  - {candidate_id: BUILD-PRINCIPLES-rule-12, target_file: command-center/principles/BUILD-PRINCIPLES.md, attempt: 1, verdict: REJECT, rejection_code: "linter:rule>120 + linter:why>100"}
  - {candidate_id: BUILD-PRINCIPLES-rule-12, target_file: command-center/principles/BUILD-PRINCIPLES.md, attempt: 2, verdict: OK, rejection_code: ""}
candidates_dropped_by_linter: []
promotions_applied:
  - {file: command-center/principles/BUILD-PRINCIPLES.md, line: "rule 12", rule: "Test a component's success callback through its real parent caller, not the component rendered in isolation."}
out_of_band_adjudication:
  target: command-center/testing/test-writing-principles.md
  rules_reviewed: [28, 29]
  commit: 98dd773
  verdict: "STAND on substance (format-clean, non-dup, genuine backing, within the file's own >=3 cap); out-of-band process flagged as 2nd instance of wave-52 obs-3(b); consumes this file's wave-68 budget -> 0 additional promotions"
note: "Most waves promote 0; wave-68 promotes exactly 1 (BUILD rule 12). T-9 out-of-band rules left standing; process anti-pattern recorded."
```
