# Wave-20 L-2 — Karen rule-quality vet

**Candidate:** obs-1 → PRODUCT-PRINCIPLES rule 1 (file currently 0 rules).

## VERDICT: REJECT-PROMOTION (format) — substance sound, char limits busted; tightened alternative below.

The recurrence, generalizability, non-dup, and actionability all PASS. The proposed text **fails the Contract's hard char limits** on BOTH lines, and the synthesizer's self-reported counts are wrong. A format-failing rule cannot be promoted as-written; re-propose the tightened alternative.

---

## Gate-by-gate

### 1. Recurrence ≥2 waves, SAME class — PASS (independently verified)
Both instances are decomposer/seed prose mis-stating current-codebase reality, caught by direct code inspection at a P-block gate. Confirmed against the actual artifacts, not the synthesizer's summary:

- **wave-20 (false-ABSENT):** seed 92d85e0e claimed "POST /api/messages has no idempotency today"; problem-framer verified `createMessage .onConflictDoNothing(target:[channel_id, idempotency_key])` + replay-refetch has existed since wave-13 → REFRAME to bind-key + forward-cursor.
  Cite: `/home/claudomat/project/process/waves/wave-20/stages/P-0-frame.md:10` ("MIS-FRAMED on a STALE PREMISE. Verified against M3 code: server message idempotency ALREADY EXISTS").
- **wave-18 (false-PRESENT):** every P-stage asserted `thread_parent_id` self-FK was "already declared"; head-product grepped schema + migrations 0000–0007 + packages/ → zero occurrences; migration 0008 had to ADD the column → P-4 REWORK.
  Cite: `/home/claudomat/project/process/waves/_archive/wave-18/blocks/P/gate-verdict.md:12` ("the gate fails on one load-bearing factual error... every stage asserts the thread_parent_id self-FK is 'already declared'... It is not declared anywhere") and `.../wave-18/stages/P-3-plan.md:65` ("P-4 REWORK CORRECTION... thread_parent_id is NOT previously declared (verified absent...)").

Polarity inverted (present at w18, absent at w20) but the failure class — "seed premise about codebase reality, unverified, wrong" — is genuinely identical. Recurrence holds. Note: w18 was NOT recorded as an L-2 obs at the time, but the evidence is in-tree and real; this is a legitimate first L-2 recording of a two-wave pattern.

### 2. Format (Contract hard limits) — **FAIL**
Contract: rule line ≤120, why line ≤100, exactly 2 non-empty lines, no forbidden tokens, falsifiable.

| line | synthesizer claimed | actual (no prefix) | actual (with `N. `/`Why: `) | limit | verdict |
|---|---|---|---|---|---|
| rule | 100 | **128** | **131** | 120 | OVER |
| why | 88 | **101** | **106** | 100 | OVER |

The rule busts 120 by 8 chars; the why busts 100 by 1 char. **Both limits fail regardless of whether the line-number prefix is counted** — so the ambiguity about prefix-counting is moot. Forbidden-token scan: clean (no `we`/`our`/`the team`/wave-ref/em-dash). 2-line shape: OK. Falsifiable: OK. But the char overflow alone is a hard reject — the Contract states the karen + linter "reject anything that doesn't match."
**The synthesizer's char counts are fabricated/miscounted; do not trust them at face value.**

### 3. Non-dup — PASS
PRODUCT-PRINCIPLES `## Rules` confirmed empty ("_(no rules yet...)_", line 70). No dup possible. (VERIFY rule 1 is a distinct V-block AC-seeding axis, not P-block premise-framing.)

### 4. Actionable + correct — PASS
"Verify each seed existence/absence claim against the code at P-0 before scoping" is a concrete, binary check a future P-0/P-4 reviewer applies: for each "X exists" / "X is absent" premise, is there a grep/read citation confirming it against the live tree? Falsifiable, sharpens the existing (clearly fallible — see w18/w20) codebase-check step into a required premise-verification gate.

---

## Tightened alternative (format-verified — APPROVE THIS TEXT)

```
1. Verify every seed claim about what exists or is absent in the code at P-0; decomposer prose drifts both ways.
   Why: A false-absent premise rebuilds existing work; a false-present one skips a needed addition.
```

Measured: rule = 109 chars (112 with `1. `); why = 91 chars (96 with `Why: `). Both comfortably under limit either way the prefix is counted. No forbidden tokens. 2 non-empty lines. Same meaning, same falsifiability.

**Disposition:** REJECT the proposed wording on format. If head-product signs off on domain applicability, promote the tightened alternative above as PRODUCT-PRINCIPLES rule 1. Substance is approved; only the wording changes.
