# Wave 85 — V-3 Block-exit Gate Verdict

**Block:** V (Verify) · **Gate:** V-3 · **Head:** head-verifier · **Attempt:** 1
**Wave topic:** AssignmentCard optimistic toggle-revert — snapshot prior status + restore on failure (was assume-opposite) + visible error toast + a11y announce-once (was silent). Frontend-only, deployed live @62bae5fd, bundle `index-DbePiYZE.js`. Primary task `3ad35a42`.
**Phase-2 fast-fix:** SKIPPED (empty fast-fix queue — V-2 triage 0 blocking).

## VERDICT: APPROVED

Fresh independent review. Read the V-block artifacts (karen, jenny, V-1 summary, V-2 triage), cross-checked the T-9 + B-6 gate verdicts and the T-5 live proof, re-read the P-0 SELECTIVE-EXPANSION ruling and the P-2 spec ACs on task `3ad35a42`, and independently re-pulled the deployed bundle + re-read the shipped `handleToggle` source on main. Not a rubber-stamp of the reviewer APPROVEs.

---

## Judgment against the five gate questions

### 1. Are the karen + jenny APPROVEs earned? — YES
- **karen (source-claim, 8/8 VERIFIED):** snapshot capture at click-time (`const prev = assignment.myStatus` before the optimistic flip), restore-the-snapshot-not-opposite in the catch, old assume-opposite pattern grep-confirmed GONE, StatusErrorToast (red-bordered, aria-hidden, 3500ms auto-dismiss, testid), announce-once, stale-closure dep (`assignment.myStatus` in the useCallback array), F1 stable dismiss callback (`useCallback([])`), tests updated-not-duplicated, spin-out `3b878f96` seedable (wave_id NULL), and the deployed bundle actually carries the fix markers. Load-bearing claims, file:line-anchored.
- **jenny (semantic-spec, 5/5 ACs CONFORM live):** each AC cross-checked against T-5 deployed-behavior evidence, including her own P-4 visible-toast correction and the ceo-reviewer SELECTIVE-EXPANSION scope ruling. No drift, no gap, no route/screen change.
- **My independent re-checks confirm both:** the shipped `handleToggle` source matches every karen claim verbatim (capture-before-flip, restore `prev`, `setStatusError(true)`, single `announce(...)`, deps include `assignment.myStatus`, `dismissStatusError` is a stable `useCallback([])`); the live bundle returns HTTP 200 and contains both fix markers (`status-toggle-error-toast` ×1, `Couldn't update assignment` ×1). The APPROVEs are earned, not rubber-stamped.

### 2. Acceptance-by-assertion — EVADED; every AC proven on the DEPLOYED binary
This is the central V-block anti-pattern and it does not apply here. T-5 forced a **real** failure (fetch-override rejecting the PUT `/status`) on the **shipped bundle** and confirmed, on production, all three behaviors that distinguish the fix from the old code: (a) the VISIBLE red-bordered toast with the exact spec copy, (b) prior-status revert (todo→todo, NOT stuck-flipped, NOT wrong-direction — the snapshot-restore semantic), (c) the sr-only announce-once. Happy-path also verified live. karen independently pulled the bundle and confirmed the fix markers; I re-pulled it and reconfirmed. Acceptance rests on observed production behavior, not green assertions alone.

### 3. Binary-status honesty — LEGITIMATELY VALUABLE, not trivial
The honest caveat (single-toggle revert VALUE is binary-equivalent between assume-opposite and snapshot-restore) is stated openly at B-6, T-9, and jenny — and the wave's value is correctly located elsewhere and is real + test-covered + live-verified: (a) a previously-ABSENT visible failure surface (old code was console-only — sighted users got zero feedback), (b) a11y announce-once via the sr-only live region, (c) per-invocation race-safety where assume-opposite genuinely diverges under a concurrent double-toggle, (d) correct-by-construction code. The test suite does NOT rest on the binary-equivalent single-toggle value — the distinguishing tests (visible-toast+announce-once, rapid double-toggle race) FAIL on the old code (B-6 reproduced this independently: 2/3 fail on the pre-fix parent). On the assignments surface (the academic-tools wedge) with the offline-first bet making failed writes expected traffic rather than a corner case, a silent-failure + wrong-revert fix is a genuine correctness+trust win. Legitimately valuable.

### 4. Scope discipline — CLEAN, not gold-plated and not under-scoped
The P-0 ceo-reviewer SELECTIVE-EXPANSION ruling was followed exactly: this wave ships the single-card snapshot-restore fix + the one cheap on-wedge addition (the visible toast). The genuinely-ambitious-but-milestone-shaped work — an app-wide shared error-surface utility retrofitted across the ~8 other optimistic sites — was correctly spun out to task `3b878f96` (status=todo, wave_id NULL, SELECTIVE-EXPANSION lineage recorded on the row). The frontend sweep confirmed the assume-opposite bug is isolated to AssignmentCard (1 of 9 sites), so retrofitting the other 8 would have gold-plated non-bugs. Right-sized.

### 5. The whole arc — CORRECTLY SHIPPED
P-0 both-PROCEED with the consistency initiative spun out → P-4 caught the sr-only-vs-visible-toast gap (jenny) + the existing-test-honesty correction (karen) → B-6 caught + fixed the F1 toast-timer churn (inline `onGone` restarting the 3500ms clock on every realtime re-render) and independently reproduced the test-honesty probe → T-5 live-proved on the deployed bundle → T-9 correctly skipped journey-regen (no new route/screen/endpoint) → V-1 dual APPROVE, 0 findings → V-2 0 blocking. Each gate caught a real thing; nothing was waved through. Correctly shipped.

---

## Findings
None blocking. No REWORK items. V-2 fast-fix queue empty; Phase-2 correctly skipped.

Pre-existing carried items (neither wave-caused, out of scope): PWA icon 404 (`024a1483`), e2e realtime flake. Not gating.

## Gate decision
**APPROVED** — proceed to L-block (Learn).

---

verdict_complete: true
rework_attempt_cap_remaining: 3
