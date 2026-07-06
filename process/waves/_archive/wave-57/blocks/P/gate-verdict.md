# P-4 Gate Verdict — wave-57 (DM→server nav papercut)

**Head:** head-product (independent Phase-1 gate)
**Mode:** automatic
**Spec SoT:** tasks.id `ff09c4c9-1fea-4d70-bd03-0f0a8742a5f5`
**Wave DB id:** b79d3365

## Verdict: APPROVED

Handoff → **B-block** (`design_gap_flag: false`, verified correct — state-transition fix, no new UI surface/mockup).

---

## Load-bearing-claim verification (against code, this turn)

All claims in the seed / frame / spec were verified against the actual source, not inferred:

| Claim | Source cited | Verified |
|---|---|---|
| `dmHomeActive` is AppShell-local `useState` | AppShell.tsx:37 | ✅ `const [dmHomeActive, setDmHomeActive] = useState(false)` |
| Only writer is the DM-rail `onDmHome` toggle | AppShell.tsx:55-58 | ✅ `onDmHome={() => { setDmHomeActive((v) => !v); … }}` — sole `setDmHomeActive` call site |
| Ternary renders `<DmHome/>` when active | AppShell.tsx:118 | ✅ `{dmHomeActive ? (<DmHome />) : (<MainColumn … />)}` |
| `selectServer` changes selectedId but never resets flag | ServerRail.tsx:237 | ✅ `onClick={() => selectServer(s.id)}` — no `setDmHomeActive`/exit call reachable |
| `dmActive` prop passed to ServerRail | AppShell.tsx:54 | ✅ |

**Root cause is correctly identified and the fix is at the cause layer.** The write-side reset gap (a flag with a single toggle-writer that navigation paths bypass) is the true cause; adding an unconditional `onExitDmHome()` to both navigation handlers fixes it at that layer. No wrong-layer fix, no symptom-patching.

## Judge questions

1. **Root cause + fix layer — PASS.** Verified above. The spec's edge-case block correctly requires the reset to be **unconditional** (not gated on `selectedId` changing) so re-selecting the already-selected server from the DM surface also exits DmHome. This is the one non-obvious correctness requirement and the spec/plan both capture it (spec edge-cases[0]; P-3-plan.md:5 "Reset is unconditional — does NOT depend on selectedId changing"). A `useEffect`-on-selectedId approach was correctly rejected (would miss re-select-same-server AND the Home path, which does not change selectedId).

2. **ACs falsifiable + complete — PASS.** Four ACs, each independently verifiable: (a) server-select single-click exit → MainColumn; (b) Home single-click exit → MainColumn; (c) no regression to *entering* DM home (onDmHome toggle preserved); (d) a component test asserting single-click exit on both paths. Edge cases enumerated: re-select-same-server exits; clicking a server when NOT on DM surface unchanged; onDmHome toggle-into-DM preserved. Plan maps every AC to a file-level step (P-3-plan.md:8-13).

3. **Scope — PASS (minimal, correct for a papercut).** All three P-0 reviewers concur: problem-framer PROCEED, ceo-reviewer PROCEED/HOLD-SCOPE, mvp-thinner OK. No nav-state-model refactor — explicitly rejected in the plan's "Alternative considered" and by ceo-reviewer as gold-plating with no live-bet backing. Traces to a live bet ("Academic tools + offline-first win students from Discord") via M8 shipped-surface retention polish; M9-Monetization correctly reserved to founder, orthogonal, non-blocking.

4. **Floor override + design_gap — PASS.** Sub-floor (~10-30 LOC) override-ship is legitimate under **PRODUCT-PRINCIPLES.md rule 5** (verified present line 82: waive floor when mvp-thinner returns zero split candidates) — mvp-thinner returned `floor_constraint_active: false` with no valid THIN, so this is a genuine minimal single-cause fix, not a suppressed split. Not gate-by-vibe: floor waiver traces to a real rule + a real reviewer verdict. `design_gap_flag: false` is correct — a state-transition correctness fix introduces no new page/flow/component/icon; the DmHome/MainColumn surfaces already exist.

## Builder note (non-blocking — carry into B-block)

The Home button in `ServerRail.tsx` (lines 120-131) currently has **no `onClick` handler** — it renders but does nothing today. AC-2 requires it to exit DmHome on first click. The builder must therefore wire `onClick` on the Home button to call `onExitDmHome()` (and whatever Home-select navigation is intended). This is an implementation detail the plan under-specifies (P-3-plan.md:5 says "the Home button handler" as if one exists); it does **not** invalidate the AC — AC-2 remains falsifiable and correct, the callback contract covers it, and the component test in AC-4 will catch a miss. Flagging so the builder does not assume a pre-existing handler to extend.

## Stage-exit checklist

- [x] P-0 problem-framer + ceo-reviewer present, reconciled (both PROCEED); mvp-thinner OK (product-feature milestone) — not silently overridden.
- [x] Problem is root cause (write-side reset gap), not symptom; falsifiable signal = single-click exit renders MainColumn.
- [x] Maps to one milestone (M8 `84e17739`) + live bet (displace-Discord), cited by id.
- [x] P-1 bundle = one seed, no siblings; no THIN available; no external-task dependency.
- [x] P-2 ACs enumerated + independently verifiable; edge cases specified; non-goals named (NO nav-state refactor); no auth/session/cookie/rate-limit surface → tightened security gate N/A.
- [x] Spec contract embedded as fenced YAML at head of tasks.description (SoT), verified via psql.
- [x] P-3 reuses existing shell state pattern (AppShell owns state, passes callback); introduces no infra; every step → bundle task + observable artifact (test).
- [x] Every upstream checkbox ticked from a concrete artifact (code + DB + stage files read this turn), not inferred.
- [x] design_gap_flag handoff correct → B-block.

```yaml
head_signoff:
  verdict: APPROVED
  stage: P-4
  reviewers:
    problem-framer: PROCEED
    ceo-reviewer: PROCEED (HOLD-SCOPE)
    mvp-thinner: OK
  failed_checks: []
  rationale: >
    Root cause verified against AppShell.tsx (dmHomeActive:37, onDmHome toggle:55-58,
    ternary:118) and ServerRail.tsx (selectServer:237) — the write-side reset gap is
    correctly identified and the unconditional onExitDmHome callback is a cause-layer
    fix. ACs are enumerated, falsifiable, and cover both paths, the re-select-same-server
    edge case, no-regression to entering DM home, and a single-click component test.
    Scope is minimal (nav-state refactor rejected by all three reviewers and the plan);
    floor override is legitimate under real PRODUCT rule 5 with zero split candidates;
    design_gap_flag false is correct. One non-blocking builder note carried forward:
    the ServerRail Home button has no current onClick, so AC-2 requires wiring it, not
    extending an existing handler.
  next_action: PROCEED_TO_B-block
```

---
# Wave 57 — P-4 Phase 2 merge
| Reviewer | Verdict | Notes |
|---|---|---|
| karen | APPROVE | Root cause VERIFIED (dmHomeActive AppShell:37, sole setter onDmHome:56; selectServer:237 + Home never reset it). **Home button ServerRail.tsx:120-131 has NO onClick (decorative) — builder must ADD one, not extend.** Existing AppShell.test.tsx has dmHomeActive coverage to extend. react-specialist AGENTS.md:82. |
| jenny | APPROVE | 4/4 drift MATCHES: journey-map (:18) documents this exact F-1 double-click as a PRE-EXISTING defect to fix (corroborates seed's pre-existing claim); no product-decision conflict; minimal-fix scope consistent (wave-50 precedent); design_gap false correct. Minor nit (Home-no-handler) flagged for B. |
| Gemini | UNAVAILABLE (429) | degrades |

**PASS.** karen+jenny APPROVE, Gemini UNAVAILABLE. design_gap_flag false → B-block (D skipped). **B-3 CARRY: the ServerRail Home button (:120-131) has NO onClick today — ADD a fresh onClick calling onExitDmHome; do not assume an existing handler. Cover the re-select-same-server edge case (reset must not depend on selectedId changing).**
