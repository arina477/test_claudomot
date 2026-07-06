# T-block gate verdict — wave-68 (M11 publish-write-half + memberCount fix)

**Gate:** T-9 (block-exit) · **Head:** head-tester · **Mode:** automatic
**Deployed:** merge 1b5a184, BOTH services SUCCESS · **Spec:** tasks row 2bd37c4c (8 ACs + AC9 live-DB test)

## Named gate criteria (from the T-manifest / head-product)

### (1) Owner-only publish enforced live (T-8 non-owner → 403) OR CI-verified
**MET — LIVE + CI.** As authenticated non-owner (fixture A), `PATCH`ing a fixture-B-owned server → **403** "Not authorized to update this server", and the target row was verified **UNMODIFIED in Postgres** (is_public still false, desc/topic still null — the "HACKED"/"pwned" payload had zero effect). Missing server → 404. The owner-gate is server-side (NestJS), not a UI hide. Corroborated by the CI live-DB integration tier (updateServer non-owner→403 row-unmodified, AC9 confirmed executed not skipped) + 13 Overview UI tests (owner-sees / non-owner-doesn't).

### (2) publish → /discover → memberCount-correct works live (write-half + memberCount fix, end-to-end)
**MET — LIVE, full loop.** Owner published via the real Overview settings UI (`PATCH /servers/:id` → 200, persisted to Postgres, reconcile holds on close+reopen) → `/discover` flipped **0→1** with the card showing name/desc/topic + **"2 members" (the REAL count == DB ground-truth of 2, NOT the wave-67 always-0 bug)** + a Join affordance → unpublish (toggle OFF + Save) → `/discover` flipped **1→0 (retract works)**. memberCount fix proven at both API and UI level. 2 runs, no flake.

## Layer verdicts

| Layer | Pattern | Verdict | Basis |
|---|---|---|---|
| T-1 static | A (CI) | PASS | lint+typecheck green (PR #83) |
| T-2 unit | A (CI) | PASS | web 603 + api 764 unit green |
| T-3 contract | A (CI) | PASS | UpdateServer DTO + PATCH /servers/:id + ServerDetail ext — CI-covered |
| T-4 integration | A (CI-live-DB) | PASS | **Real-Postgres integration RAN GREEN (NOT mocked):** memberCount real-count 0/1/2, private-exclusion, updateServer non-owner→403 row-unmodified. This is the AC9 guard the wave-67 mocked unit test lacked (which let memberCount:0 ship green). |
| T-5 e2e | B (live) | PASS | Full write-half loop LIVE (publish→discover→memberCount-2→retract) + B-6 reconcile proven. `T-5-e2e.md` |
| T-6 layout | B (live) | PASS | Overview settings + populated discover cards match dark-theme DS, no material divergence. `T-6-layout.md` |
| T-7 perf | — | SKIP | not heavy (no bundle/TTI regression surface) |
| T-8 security | B (live, load-bearing) | PASS | non-owner PATCH → 403 + row UNMODIFIED (server-side owner-gate); 404 missing. `T-8-security.md` |
| T-9 journey | B (gate) | PASS | journey regenerated; per-flow smoke present; LiveKit N/A documented. `T-9-journey.md` |

## Stage-exit checklist (T-9 + applicable STABLE/cross-layer)
- [x] **(2) memberCount fix proven against a REAL DB, not a mock** — the wave-67 bug shipped green precisely because the unit test mocked memberCount; AC9's live-DB test + this live T-5/T-8 run exercise the real aggregation. Mutation-sanity: deleting the LEFT-JOIN/aggregation fix reverts to 0, which the live-DB test + live discover assertion would catch.
- [x] **T-8 RBAC IDOR-tested** — non-owner asserted 403 (not only owner 200), AND row-unmodified asserted (side-effect-free rejection).
- [x] **T-8 guard ordering** — authenticated-unauthorized → 403; missing → 404 (existence not leaked via wrong code).
- [x] **T-4 real-Postgres, DB NOT mocked** — CI integration tier ran on postgres:16 with the real query.
- [x] **T-5 no getByTestId where role/label exists** — driven by aria-label (rail, gear), role=switch, role=dialog.
- [x] **T-5 test-actual-content** — read real memberCount (2), real persisted is_public/desc/topic, DB cross-checks — not layout-only.
- [x] **T-9 journey regenerated** + every relevant flow has ≥1 smoke assertion.
- [x] **LiveKit media-plane** explicitly N/A (no voice/video surface) — documented boundary, not silently skipped.
- [x] **No Playwright browser_close mid-run** — playwright-1 left open.
- [x] **Prod left clean** — T-8 fixture deleted, target restored to private, /discover back to 0 public.
- [x] **No preemptive pause** — block exit is this T-9 verdict; no measured pause trigger fired.

## Anti-pattern scan
- Coverage theater: NO — every assertion is user-observable (403+row-unmodified, memberCount=2 on the card, directory 0→1→0).
- Mock-the-SUT: NO — T-4 uses real Postgres; the wave-67 mock-hidden bug is the cautionary tale this wave closes.
- Single-client realtime: N/A — no realtime path this wave (REST publish + directory read).
- Flaky-retry masking: NO — 2 clean confirming runs, no retries.

## Findings → V-2 (non-blocking)
- Live UI negative case for the owner-gate (non-owner CANNOT see the publish control in the live UI) is CI-covered but not live-proven, because fixture A is not a member of a non-A-owned server and thus can't reach its settings live. The authoritative server-side guard IS live-proven (403 + row-unmodified), so this is defense-in-depth coverage completeness, not a security gap.

## Verdict
```yaml
test_block_status: complete
head_signoff:
  verdict: APPROVED
  stage: T-9
  reviewers: {}
  failed_checks: []
  rationale: >
    Both named gate criteria are met with the strongest available evidence. Owner-only publish is
    enforced SERVER-SIDE and proven live: a non-owner PATCH returns 403 and the target row is
    confirmed unmodified in Postgres — a 403 with a side-effect-free rejection, not a UI hide.
    The M11 write-half closes end-to-end live: an owner publishes via the real Overview settings UI
    (PATCH 200, persisted to Postgres, reconcile holds on reopen — the B-6 fix), the server then
    appears in /discover with the CORRECT member count of 2 (== DB ground-truth) — closing the
    wave-67 memberCount:0 bug — plus a Join affordance, and unpublish retracts it (directory 0→1→0).
    The memberCount fix is proven against a real DB at both the CI live-integration tier (the AC9
    guard the mocked wave-67 test lacked) and live at the API + UI. No coverage theater, no
    mock-the-SUT, no flake (2 clean runs). T-6 layout matches the dark-theme design system. Journey
    regenerated with the new publish action + populated directory; LiveKit media-plane N/A documented.
    Prod left clean (fixture deleted, target private, directory empty). Suite is honest; product works.
  next_action: PROCEED_TO_V_BLOCK
block_state:
  claimed_layers: [T-1, T-2, T-3, T-4, T-5, T-6, T-8, T-9]
  layer_verdicts: {T-1: PASS, T-2: PASS, T-3: PASS, T-4: PASS(CI-live-DB), T-5: PASS, T-6: PASS, T-7: SKIP, T-8: PASS, T-9: PASS}
  flaky_quarantine: []
  escalation_log: []
  coverage_deltas:
    added: ["PATCH /servers/:id owner-gate live 403+row-unmodified", "discover memberCount real-count live", "Overview settings full write-half loop live"]
    to_v2: ["live UI non-owner control-hidden negative case (CI-covered; server-side guard live-proven)"]
```
