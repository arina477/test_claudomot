# T-9 Gate Verdict — wave-57 (DM→server one-click return; nav papercut)

**Head:** head-tester · **Mode:** automatic · **Gate:** T-9 (block-exit) · **wave_type:** ui · **Live SHA:** 1361c49

## Verdict: APPROVED

next_action: PROCEED_TO_V-1
journey_regen_recommendation: **TARGETED F-1 update** (mark wave-51 F-1 double-click finding FIXED in wave-57) — NOT a full crawl-regen.

---

## Scrutiny answers

### 1. T-2 (KEY layer) — are real-component tests authoritative for this transition, or does it NEED a live authenticated Playwright click-flow?

Real-component tests are **authoritative** for this specific change. The bug is a pure client-side React nav-state transition: `dmHomeActive` (AppShell local `useState`) was never cleared on the `selectServer` / Home paths, so AppShell's ternary kept rendering `<DmHome/>` — first click swallowed. This transition has **zero backend, schema, contract, realtime, or router dependency** — it is entirely determined by React setState within one event. The 4 tests render the REAL AppShell + ServerRail in jsdom (not a mocked shell) and assert the user-visible outcome: after a *single* `user.click`, ChannelSidebar (`role=complementary`) is back in the DOM AND `selectServer` fired with the right id. That is full behavioral fidelity for a state transition with no out-of-process edge to cross.

Critically, these tests pass my mutation-sanity bar: B-6 reverted the 2 production wirings and 3 of 4 tests FAILED (`server-icon exits`, `Home exits`, `re-select-same-server exits`). The 4th (DM-entry regression guard) correctly stays green because it exercises the *unchanged* entry path. "What would have to be broken for this test to fail?" → the actual fix. Not coverage theater. This is the opposite of single-client-echo or mock-the-SUT: real components, real transition, mutation-proven load-bearing.

A live authenticated Playwright click-flow would re-exercise the identical client logic across a browser boundary that adds no new failure surface for THIS bug — it would confirm the same setState, at flake/runtime cost, proving nothing the real-component tests don't. For a WS-gateway / realtime / auth-door wave I would demand it; for a pure nav-state papercut it is not warranted.

### 2. T-5 Pattern-A classification — sound, or skip-abuse?

**Sound.** Pattern-A here = (component-fidelity mutation-verified tests) + (CI e2e job green: run 28764778640, no Playwright regression) + (live web-serves smoke: 1361c49 HTTP 200, fix in the shipped bundle). This is not skip-abuse: T-5 did not skip: it classified the proportionate proof for a client-side transition and named the boundary honestly ("A full authenticated live click-flow would re-confirm the same client logic the real-component tests already exercise; not warranted"). The classification is defensible because the change has no backend/realtime dependency that a live flow would uniquely exercise. The manifest's "skip-abuse?" concern is answered: the authoritative proof (T-2 mutation-verified real components) is stronger for this bug than a live click would be, and the CI e2e job additionally guards against cross-page regression.

### 3. Skip honesty (T-3/T-4/T-6/T-7/T-8)

All legitimate:
- **T-3 contract / T-4 integration** — no Zod contract change, no DB/schema/migration (migration ledger untouched); nothing to exercise against real Postgres. Correct skip.
- **T-6 layout** — the fix changes WHICH pane renders (DmHome vs server surface), not styling/tokens/spacing/appearance of any component. No visual baseline moves. Correct skip. (Distinct from wave-51 F9 which WAS a layout fix.)
- **T-7 perf / T-8 security** — +2 production lines, no auth surface, no route, no bundle-budget-relevant delta, no RBAC/session/IDOR surface touched. Correct skip.

Skips are documented with rationale, not silent. Diff is confined to 2 shell files + tests (B-6: +100/-2, 2 production lines).

### 4. Journey-map: full crawl-regen vs targeted F-1 update → **TARGETED**

Normally wave_type=ui + B-3 ran ⇒ journey regen required. But the proportionality carve-out applies: this fix adds/changes **NO route, screen, endpoint, or surface** — it corrects a state transition on an *already-documented* flow. The journey-map ALREADY documents this exact bug: line 18 (wave-51 last_updated) records **F-1 (MEDIUM, PRE-EXISTING, non-blocking) — "first-click-swallowed on the DM→server RETURN path; ServerRail selectServer/Home handlers do not clear dmHomeActive."** Wave-57 resolves precisely that. The wave-51 entry even flags it as unmodified-that-wave and carried to V-2. A full crawl would rediscover the identical inventory and re-annotate one line. The proportionate, honest action is a **targeted annotation**: append a wave-57 `last_updated` note marking F-1 **FIXED** (one-click DM→server + DM→Home return; component mutation-verified; live 1361c49), and update the DM-flow prose that describes the return path to drop the "double-click needed" defect. The precedent for annotation-only regen on no-new-surface waves is established across the map (wave-28, wave-47, wave-51 all annotation-only). This satisfies the T-9 anti-drift intent (the map's F-1 entry stays truthful for the verifier's baseline) without a false-completeness full crawl.

Orchestrator: perform the targeted F-1-FIXED annotation before V-block handoff.

### 5. Findings

**0 open.** T-findings-aggregate: TOTAL 0. B-6: CLEAN/APPROVED, 0 Critical/High/Medium, 2 Low non-blocking (cosmetic optional-chain style asymmetry; latent undefaulted prop — both no-action). No flake observed across the CI e2e and component runs. No quarantine.

---

## Stage-exit checklist (applicable subset)

- [x] Mutation-sanity: reverting the fix fails 3/4 tests (B-6-verified) — tests fail on a real bug, not only on deletion.
- [x] T-1 static: lint+typecheck green (CI 28764778640), 0 ts-bypasses.
- [x] T-2: real-component tests assert user-visible DOM state change (ChannelSidebar restored) + first-click semantics, not mock call counts.
- [x] T-4 E2E: CI e2e job green; no getByTestId abuse (role/`complementary` queries used). Two-client N/A (no realtime path in this change).
- [x] T-5: Pattern-A proportionate for a client-side transition; boundary named honestly.
- [x] Skips (T-3/T-4-integration/T-6/T-7/T-8) each justified by absent surface, documented not silent.
- [x] No Playwright `browser_close` risk (no live swarm run this wave).
- [x] T-9 journey: F-1 finding present in map; targeted FIXED-annotation prescribed (proportionate regen); no new flow to smoke.
- [x] Findings: 0 open.

```yaml
head_signoff:
  verdict: APPROVED
  stage: T-9
  reviewers:
    b6_review: CLEAN (0 crit/high/med; 2 low no-action)
    mutation_test: PASS (revert fails 3/4)
  failed_checks: []
  rationale: >
    Pure client-side nav-state transition with zero backend/realtime/contract/schema
    dependency. The KEY T-2 layer renders real AppShell+ServerRail and is mutation-verified
    (revert fails 3/4) — authoritative for this bug; a live authenticated Playwright flow
    would re-exercise the identical setState across a boundary that adds no new failure
    surface, so T-5 Pattern-A (component-fidelity + CI e2e green + live-serves smoke) is
    proportionate, not skip-abuse. T-3/T-4/T-6/T-7/T-8 skips are each justified by an absent
    surface and documented, not silent. Journey-map already documents this exact defect as
    wave-51 F-1 (double-click return); the fix adds no route/screen/surface, so a targeted
    F-1-FIXED annotation is the proportionate, honest regen (full crawl would rediscover the
    same inventory). 0 open findings.
  journey_regen: TARGETED_F1_UPDATE
  next_action: PROCEED_TO_V-1
```
