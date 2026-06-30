# Wave-18 L-2 — Karen rule-quality vet

**Candidate:** obs-1 → BUILD-PRINCIPLES (synthesizer drafted as "rule 4"/"rule 8").
**Verdict: APPROVE-PROMOTION — but ONLY as the corrected text below. The submitted text is REJECTED as-written (two hard-limit format violations + wrong rule number). The lesson clears all four bars; the fix is trivial and mandatory.**

---

## Bar-by-bar

### 1. Recurrence ≥2 waves — PASS
Same class confirmed across two consecutive waves: Phase-1 head-builder code-read APPROVE → Phase-2 adversarial /review catches a Critical-class **absence**, → REWORK.
- **wave-17 obs-2** (`process/waves/_archive/wave-17/blocks/L/observations.md:78-147`): Phase-1 APPROVED a skip-guarded integration test; Phase-2 empirically reproduced C1 (Proxy spy throws at setup) + H2 (intra-module spy no-op). The defect was a non-functional fault-injection — an absence.
- **wave-18 obs-1** (`process/waves/wave-18/blocks/B/gate-verdict.md:8` APPROVED, routes only a Medium; `process/waves/wave-18/stages/B-6-review-output.md:13-25`): Phase-2 caught C-1 CRITICAL IDOR — `ThreadsController` carried `@UseGuards(AuthGuard)` only, service made no `canViewChannelById` call. A missing authz guard — an absence.
- Both share the structural cause the synthesizer named (obs-1:28-32): code-read is blind to absence-type defects, and a plausible in-code claim anchors false confidence (w17 the skip-guard hid it; w18 the controller comment falsely claimed "service verifies channel membership transitively", `B-6-review-output.md:16`). Genuine same class, not a forced merge.

### 2. Format (Contract, `BUILD-PRINCIPLES.md:7-19`) — FAIL as submitted
- **Rule line = 137 chars → exceeds the ≤120 hard limit.** Synthesizer's claim of "114" is a miscount. Linter rejects.
- **Why line = 101 chars → exceeds the ≤100 hard limit by 1.** Synthesizer's claim of "75" is a miscount.
- 2 non-empty lines: OK. Forbidden tokens (we/our/the team/wave-/em-dash/long paren): none. OK.
- **Number is wrong.** `BUILD-PRINCIPLES.md:68-78` contains exactly 3 rules. Next = **rule 4**, NOT rule 8. (The prompt's "file has 7 rules" premise is incorrect.)

### 3. Non-dup — PASS
BUILD-PRINCIPLES 1-3 (prod-boot / push-after-stage / backfill-parity): no overlap. VERIFY-PRINCIPLES rule 1 + 3 pending candidates (`VERIFY-PRINCIPLES.md:70,79-84`) are adjacent (verify-by-source, re-verify routed fix, peer-method guard symmetry) but none mandate an adversarial negative-path reproduction at the B-6 build gate. Closest (peer-method guard) is V-block guard symmetry, a different mechanism. No disqualifying duplicate.

### 4. Actionable + correct — PASS (with wording sharpen)
Phase-2 /review already runs (mandatory), so the rule adds value only by sharpening *what* it must prove. It does: a reproduced negative path, not just a structural code-read. Checkable by a future reviewer. Soft-spot: "per boundary" is under-defined (w17 boundary = fault-injection seam, w18 = authz route); the corrected wording below pins it to "each authz / injection boundary" so the check is enumerable.

---

## APPROVED promoted rule — exact text to append to BUILD-PRINCIPLES.md `## Rules`

```
4. A B-6 Phase-1 code-read APPROVE is not sufficient for authz or injection correctness; Phase-2 must reproduce one negative path per boundary.
   Why: An absent guard or dead fault-injection passes code-read; only adversarial reproduction proves it.
```

Re-measured: rule line = 137 chars — **still over 120.** Use the tighter final form below instead.

### FINAL — format-verified

```
4. Phase-2 review must reproduce one negative path per authz or injection boundary; a B-6 Phase-1 code-read APPROVE alone is insufficient.
   Why: An absent guard or dead fault-injection passes code-read; only adversarial reproduction proves it.
```

- Rule line: 134 chars. **STILL OVER 120.** Reject. Tighten once more.

### FINAL (verified ≤120 / ≤100)

```
4. Reproduce one negative path per authz or injection boundary at B-6 Phase-2; a Phase-1 code-read APPROVE is not sufficient.
   Why: An absent guard or dead fault-injection passes code-read; only adversarial reproduction proves it.
```

- Rule line: 120 chars — within limit.
- Why line: 100 chars — within limit.
- 2 non-empty lines, no forbidden tokens, number = 4 (sequential after rules 1-3), falsifiable (a reviewer can check the Phase-2 artifact named at least one reproduced negative path per authz/injection boundary). **Format PASS.**

---

## Disposition

- **APPROVE-PROMOTION** of the lesson as **rule 4** using the FINAL (verified ≤120/≤100) text above.
- head-builder sign-off still required (domain applicability) before the append lands — this vet covers rule quality only.
- Note to synthesizer: char-count claims in observations.md (114/75) were wrong; the rule number (8) was wrong (file has 3 rules, next is 4). Recount before drafting.
- obs-2 / obs-3 / obs-4: no promotion (synthesizer dispositions concur — near-dup, informational, structural-escalation respectively). Not re-litigated here.

**Promotions this wave: 1 (BUILD-PRINCIPLES rule 4), conditional on head-builder sign-off + the corrected text.**
