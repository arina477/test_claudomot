# L-2 — Distill (wave-84)

**Owner:** head-learn (L-block gate, mode: automatic)
**V-block entry:** APPROVE (karen + jenny + head-verifier).

## Action 1-2 — Mark claimed task done + verify

```sql
UPDATE tasks SET status='done'
WHERE id='9535895f-1d80-4a59-b93e-dff05ff94c6e' AND status IN ('todo','in_progress','blocked')
RETURNING id, status;
→ 9535895f-... | done   (UPDATE 1)
```

Verify:
```sql
SELECT id, status FROM tasks WHERE id=ANY('{9535895f-1d80-4a59-b93e-dff05ff94c6e}'::uuid[]);
→ 9535895f-... | done
```

Single-task bundle (no siblings). Row was `in_progress` at wave start; now `done`. No skipped/ineligible ids.

## Action 3 — knowledge-synthesizer

Spawned `knowledge-synthesizer` against `process/waves/wave-84/` + prior 5 waves' archived observations (wave-83..79) + all five principles files. Output: `process/waves/wave-84/blocks/L/observations.md` — **3 observations** (within 0-6 cap).

| id | title | severity | recurrence | candidate_file | status |
|---|---|---|---|---|---|
| obs-1 | Security policy outbound-surface enumeration: verify ALL paths at B-6 Phase-2, not only author-visible entries | strong | **2** (wave-83 obs-2-fence-gap + wave-84) | BUILD-PRINCIPLES | **PROMOTE-ELIGIBLE** |
| obs-2 | Build-time env vars threaded through ALL build invocation paths at authoring time | warning | partial 2nd (wave-3 class covered by BUILD rule 1; ci.yml + api-Dockerfile sub-forms are 1st) | BUILD-PRINCIPLES | HOLD |
| obs-3 | BOARD reframe prevented a naive security option (MEDIUM XSS traded for HIGH auth-reliability regression) | informational | 1 (first instance) | PRODUCT-PRINCIPLES | HOLD |

## Action 4 — Filter to promotion candidates

- **obs-1** — generalizable + falsifiable + cited + 2-wave recurrence → candidate. Wave-83 obs-2-fence-gap (helmet un-fenced cross-origin defaults, HELD 1st instance) and wave-84 (CSP allowlist omitting real outbound origins) are the same generalizable class: a security policy implemented by enumerating only the author-visible surface, catchable at B-6 Phase-2 completeness enumeration.
- **obs-2** — HOLD. BUILD rule 1 already covers the detection side (prod-boot). The ci.yml + cross-service-Dockerfile-contamination sub-forms are each first instances; recurrence to wave-3 is partial. Does not clear the 2-wave bar for its specific form. (Also would contend for BUILD-PRINCIPLES' one-per-file slot, which obs-1 wins.)
- **obs-3** — HOLD. First instance, informational; no falsifiable enforceable rule.

## Action 5 — karen vetting

Spawned `karen` on obs-1's candidate vs BUILD-PRINCIPLES "Contract for new rules".

- **Recurrence verdict: GENUINE 2nd instance.** Not a hand-waved unification — both failures share one falsifiable shape (implementer enumerates only paths visible from their own vantage; both caught only at the mandatory B-6 Phase-2 adversarial pass; both silent-if-shipped with no test catching the gap). Not a near-dup of rule 1 (prod-boot detection locus) or rule 4 (B-6 Phase-2 authz/injection negative-path reproduction — complementary, different check).
- **First pass: REJECT on format** — the initial candidate file used the synthesizer's longer 147/103-char draft (both lines over the limits). karen supplied a conforming rewrite and stated "on the corrected text this is an APPROVE."

## Action 6 — Lint, then promote

karen's rewrite still measured 140/107 on the FULL line (the linter measures `length($0)` including the `19. ` / `   Why: ` prefixes, not text-only). Tightened, preserving karen's approved semantics, to:

```
19. At B-6 Phase-2, enumerate a security policy's full outbound surface, not just author-visible entries.
   Why: Omitted origins fail silently on server or feature paths, uncaught by tests.
```

Deterministic linter (all four checks) on `process/waves/wave-84/blocks/L/candidates/BUILD-PRINCIPLES.md`:
- rule line 105 ≤ 120 → OK
- why line 84 ≤ 100 → OK
- forbidden tokens (`we`/`our`/`the team`/`wave-N`/em-dash/`because...because`/long paren) → none → OK
- exactly 2 non-empty lines → OK
- **linter:OK**

**Promoted** rule 19 to `command-center/principles/BUILD-PRINCIPLES.md` under `## Rules` (appended after rule 18). Candidate file committed alongside as audit trail. One promotion, one file — cap respected.

## Action 7 — Observation pipeline state

3 observations emitted to `process/waves/wave-84/blocks/L/observations.md`. obs-2 (build-var threading multi-path form) and obs-3 (reframe-prevented-harm) flagged in observations for future confirmation; no soft-signal founder escalation warranted.

---

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "tasks: 9535895f-1d80-4a59-b93e-dff05ff94c6e done"
  - "observations: process/waves/wave-84/blocks/L/observations.md (3 observations)"
  - "principles promotions: 1 (command-center/principles/BUILD-PRINCIPLES.md rule 19)"
tasks_marked_done: [9535895f-1d80-4a59-b93e-dff05ff94c6e]
tasks_skipped_with_reason: []
observations_emitted: 3
promotion_candidates: 1
karen_verdicts:
  - {candidate_id: obs-1, target_file: command-center/principles/BUILD-PRINCIPLES.md, verdict: APPROVE-after-tighten}
linter_runs:
  - {candidate_id: obs-1, target_file: command-center/principles/BUILD-PRINCIPLES.md, attempt: 1, verdict: OK, rejection_code: ""}
candidates_dropped_by_linter: []
promotions_applied:
  - {file: command-center/principles/BUILD-PRINCIPLES.md, line: 124, rule: "19. At B-6 Phase-2, enumerate a security policy's full outbound surface, not just author-visible entries."}
note: "obs-1 is a genuine 2nd instance of wave-83's HELD fence-gap class (security-policy surface enumeration), promoted at higher severity (3 CRITICAL). obs-2/obs-3 held: obs-2 partial-recurrence + loses BUILD-PRINCIPLES slot to obs-1; obs-3 first-instance informational."
```
