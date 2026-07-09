# Wave 81 — P-block Gate Verdict (Phase 1)

- **gate:** P-4
- **attempt:** 1
- **phase:** 1
- **verdict:** APPROVED
- **agentId:** head-product (VP Product / Staff PM), fresh independent spawn
- **wave_type:** single-spec
- **claimed_task_ids:** [2340d2d3-f405-4d16-b8fb-a2111c141ea7]
- **mode:** automatic
- **reviewed:** P-0 frame, P-1 decompose, P-2 spec (pointer + task 2340d2d3 description contract), P-3 plan, review-artifacts manifest

## Verdict: APPROVED

The framing, scope, spec, and plan hold. I independently verified the load-bearing
factual claims against the codebase rather than trusting the artifacts. Every claim
the scope decision rests on checked out.

### Independent verification performed (not taken on trust)
- **Root cause CONFIRMED.** `apps/web/src/styles/globals.css` L56-57 (`html`) and L62-63
  (`body`): `height:100%; overflow:hidden` — a GLOBAL, unconditional rule (not shell-scoped).
  `#root` height:100% (L71-72). This is the app-shell lock. Correct root cause.
- **6px DS scrollbar CONFIRMED present** — globals.css L75-87 (`::-webkit-scrollbar width:6px`,
  DS §9). The preservation AC references a real, existing artifact.
- **min-h-screen-under-locked-body pattern CONFIRMED on all 5 named routes** — ProfilePage
  (L462), SettingsPrivacyPage (L246), PrivacyPage (L12), TermsPage (L12), LandingPage (L11) —
  each a `min-h-screen` root with NO internal `overflow-y-auto` / `h-dvh` scroll container.
- **Shell-owns-internal-scroll CONFIRMED** — `shell/*` (MainColumn.tsx, ServerDiscoverPage.tsx,
  and ~30 others) carry `overflow-y-auto` inner panels. The shell scrolls inner columns, not the
  body — which is exactly why the body lock is load-bearing and why wrapping /app /discover would
  double-scroll. The "do NOT wrap shell routes" AC rests on real fact.

### Axis-by-axis

**1. Root cause + fix layer — CORRECT; wrong-layer fix REJECTED.**
The fix is a PER-PAGE scroll container (`h-dvh overflow-y-auto`), NOT removal of the global
`body{overflow:hidden}`. The unlock-body alternative is explicitly named and rejected in both
P-0 (refinement 1) and P-3 (Architecture deltas, "REJECTED — wrong-layer"), and it is pinned as
a LOAD-BEARING constraint in the task contract (edge-case "Do NOT touch globals.css body/html
overflow") and as an AC ("global body{overflow:hidden} is UNCHANGED"). Verified: removing it
would regress the shell's internal-panel scroll and cause double scrollbars on /app /discover.
Correct layer, correctly guarded.

**2. Scope call — SOUND; public-page inclusion is BACKED, not creep.**
The orchestrator mediated a real disagreement (problem-framer PROCEED-widen vs ceo-reviewer
PROCEED-2-routes) by verifying the facts. I re-verified: ceo-reviewer's "public pages scroll on
the document body" claim is FACTUALLY WRONG — the body overflow is globally hidden, and all three
public pages use unscrolled min-h-screen roots, so they clip once content exceeds the viewport
(legal text + multi-section landing certainly do). Fixing the shared clip CLASS is correct.
ceo-reviewer's anti-churn concern is honored structurally: a scroll wrapper is a visual NO-OP on
a page that fits the viewport, so broad application carries zero churn risk — captured as an
explicit AC ("a page that already fits shows no visual change"). This is class-fix discipline,
not scope-creep.

**3. ACs — FALSIFIABLE + OBSERVABLE.**
- Live scroll-to-bottom on /settings/profile is specified as LIVE on a CONSTRAINED viewport,
  reaching the bottom-most field AND the save button, "not assertion-only" — the founder's exact
  bug, observable and falsifiable. Routed to T-5/T-6.
- No-double-scrollbar-on-shell-routes guard is an explicit AC (/app /discover NOT wrapped),
  backed by the verified fact that the shell owns internal scroll.
- DS-scrollbar preservation AC references the real globals.css §9 6px rule.
- No-churn AC (short page = no-op) is observable.

**4. Floor waiver — JUSTIFIED; design_gap false — CORRECT.**
Founder-directed bug fix, single coherent unit (one shared wrapper across the affected routes),
NO active milestone (roadmap 14/14 done → RESCOPE-AUTO-MERGE / expand-current-bundle is impossible,
not merely skipped). mvp-thinner correctly not spawned (no product-feature milestone). Waiver basis
is sound and matches PRODUCT-PRINCIPLES rule-5 spirit (the floor targets wasteful greenfield
micro-waves, not requested bug fixes). design_gap false is correct — a layout/scroll primitive on
existing adopted pages reusing the shipped DS scrollbar; no new UI surface, no D-block.

**5. Plan concreteness — SOUND.**
Every AC maps to a step: FullPageScroll create (B-3) + each route wrapped (B-3) + global-overflow-
untouched (constraint) + shell-no-double-scroll (B-3 audit) + DS scrollbar (B-3) + no-churn (no-op
wrapper). Single specialist (react-specialist, present in AGENTS.md) for a cohesive client-only
layout change. h-dvh over h-screen is pinned (mobile-URL-bar clip variant). B-1 Contracts and
B-2 Backend correctly SKIPPED (frontend-only, no contract/type/API/data change) with skip recorded.
D-block correctly skipped (design_gap false).

## Rework instructions
None.

## Non-blocking notes for B-block (carry-forward, not gate conditions)
- react-specialist should AUDIT each route at implementation time to confirm it renders under the
  locked body before wrapping (all 5 verified to at gate time; the audit is a belt-and-suspenders
  guard against a route that gained its own scroll since).
- LandingPage has an inner `overflow-hidden` section (L70) but its ROOT (L11) is an unscrolled
  min-h-screen — wrap at the root; do not let the inner section mislead.
- Prefer wrapping (composition) over swapping the root className so each page's existing
  min-h-screen content layout is preserved unchanged.

## Phase-1 summary
verdict: APPROVED — framing, scope, spec, plan all hold under independent code verification.
No REWORK. Proceeds to Phase-2 / B-block. B-1/B-2/D correctly skipped.

---
## Phase 2 — Karen + jenny + Gemini (appended)
**Phase 2 verdict: PASS** (Karen APPROVE 6/6 + jenny APPROVE 0-drift, notes folded; Gemini UNAVAILABLE 429 → degraded, non-blocking). No BLOCK.
- **Karen:** all 6 claims VERIFIED against HEAD (globals.css lock + 6px scrollbar; ProfilePage L462 / SettingsPrivacyPage L246 / Privacy/Terms/Landing L11 min-h-screen roots; router bare AuthGuard settings + public; shell routes own overflow-y-auto panels → excluded; no existing FullPageScroll). Fix is right-layer. Note: FullPageScroll transform-free (fixed-nav).
- **jenny:** 0 DRIFT — the shipped DESIGN MOCKUPS already model body-locked/inner-scroll (settings-profile.html:278) → built pages drifted, fix RESTORES intent; DS §9 6px scrollbar matches; scope (5 standalone routes, shells excluded) matches the map's standalone-vs-shell split. GAP-1 (FullPageScroll no transform/filter/contain — folded to B-3), GAP-2 (T-9 map add), GAP-3 (log overflow-lock in product-decisions, optional L-1).
- **Gemini:** UNAVAILABLE (429), degraded, not retried.

## Gate result: APPROVED — P-block exits → B-0 (design_gap false, D skipped).
