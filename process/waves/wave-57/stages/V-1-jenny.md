# V-1 Semantic-Spec Verification — wave-57 (jenny)

**Verdict: APPROVE**

Task: `ff09c4c9-1fea-4d70-bd03-0f0a8742a5f5` — DM→server one-click-return (wave-51 T-5 F-1 papercut).
Spec source: `tasks.description` YAML head (SoT).
Deployed: merge `1361c49` (PR #72), api+web SUCCESS. CI run 28764778640 = `success`.

## Method
Verified against source + tests, not report claims. Confirmed the CI-green sha (`5ddbeec`) is byte-identical to the merged/live commit `1361c49` for all three touched files (`git diff --stat 5ddbeec 1361c49` on AppShell.tsx / ServerRail.tsx / AppShell.test.tsx = empty) — so the green suite exercised exactly the deployed code, no post-CI drift.

## Implementation trace
- `apps/web/src/shell/AppShell.tsx:59` — `onExitDmHome={() => setDmHomeActive(false)}`. Unconditional reset; no dependency on `selectedId` changing. Matches spec `contracts.ui` (AppShell passes an exit callback).
- `apps/web/src/shell/AppShell.tsx:119-123` — DmHome/MainColumn ternary unchanged in shape (spec: "AppShell:118 unchanged"). Confirmed.
- `apps/web/src/shell/ServerRail.tsx:240-243` — server icon `onClick`: `selectServer(s.id); onExitDmHome?.();`. Exit called unconditionally on EVERY server click → satisfies the edge case (re-select-same-server exits, not gated on `selectedId`).
- `apps/web/src/shell/ServerRail.tsx:125` — Home button `onClick={onExitDmHome}`. The B-carry was correct: Home previously had NO onClick (decorative); now wired.
- `onDmHome` toggle (AppShell.tsx:55-58) unchanged → DM entry preserved (edge-case: onDmHome toggle-into-DM behavior preserved).

## AC-by-AC
| AC | Spec intent | Evidence | Status |
|----|-------------|----------|--------|
| AC1 | Server-select from DM exits DmHome on FIRST click → MainColumn | ServerRail.tsx:242 unconditional call; test `server icon click exits DmHome on first click` (AppShell.test.tsx:253) + `selectServer('srv-1')` asserted | MET |
| AC2 | Home from DM exits on FIRST click → MainColumn | ServerRail.tsx:125 wired; test `Home button click exits DmHome on first click` (:278) | MET |
| AC3 | Entering DM home still works (no regression) | onDmHome untouched; test `DM-rail button still enters DmHome` (:294) | MET |
| AC4 | Component test proves single-click exit + re-select-same-server edge | 4 tests (:253–327), all first-click assertions | MET |
| Edge | Re-select ALREADY-selected server exits (unconditional, not selectedId-gated) | selectedId='srv-1', click same server exits; test `re-selecting already-selected server...` (:306) | MET |

## Test integrity
The 4 tests render the REAL AppShell + REAL ServerRail together (SUT not mocked — only `api`/socket boundaries stubbed). Exit is asserted via ChannelSidebar re-appearance, which is a sound proxy: AppShell gates both ChannelSidebar and MainColumn on the same `!dmHomeActive` condition, so sidebar-back ⟺ DmHome-gone ⟺ MainColumn rendered. Mutation-verified at B-6 (reverting the fix fails 3/4). No mock-the-system-under-test, no acceptance-by-assertion.

## Journey-map F-1 annotation
`command-center/artifacts/user-journey-map.md:17` (wave-57) accurately describes the bug, root cause (setDmHomeActive lived only on onDmHome; Home had no onClick), the fix (unconditional onExitDmHome on server-select + Home wired), and marks **"F-1 (wave-51) now FIXED."** The wave-51 annotation (:19) that originally logged F-1 as MEDIUM PRE-EXISTING is consistent. Annotation matches deployed behavior. No route/screen/endpoint added — correctly annotation-only.

## Drift / findings
None. Zero spec drift. Scope respected — minimal targeted fix, no nav-state-model refactor (spec explicitly forbade it; problem-framer PROCEED / ceo HOLD-SCOPE / mvp OK). No schema/backend, matching `contracts: data NONE / api NONE`.

## Recommendation
Proceed to V-2. No fast-fix items for V-3.
