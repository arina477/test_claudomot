# Wave 51 — P-4 Verdict

**Reviewer:** head-product (fresh spawn, gate agent)
**Reviewed against:** process/waves/wave-51/blocks/P/review-artifacts.md
**Attempt:** 1  (1 = first gate)
**Phase:** 1 (head-product)

## Verdict
APPROVED

## Rationale
This is a right-sized cosmetic layout fix on the shipped DM surface (M8, sourced from wave-46 V-2 finding F9), and every deliverable holds up under an independent read. The spec's acceptance criteria are falsifiable and observable (DmThread at full 632px width @1024, no message wrap at 1024/1280, ChannelSidebar absent on the DM surface and present in server view, mobile overlay drawer gated off, no server-view regression), with the hard non-happy states enumerated as edge cases (stale previously-selected server leak, no-server "Select a server" placeholder, mobile drawer path, rapid server↔DM toggle, and an explicit no-regression case). The plan is the correct-layer fix: I verified the load-bearing claims directly against apps/web/src/shell/AppShell.tsx — the `{!dmHomeActive && (...)}` guard wrapping MemberListPanel exists exactly at lines 122-126, the ChannelSidebar desktop wrapper is unconditional at 64-69, the mobile overlay drawer is unconditional at 82-106, and dmHomeActive is component state (useState, line 37), not a router route. Extending the existing guard to those two wrappers mirrors an established in-file pattern rather than inventing a parallel path, and the rejected alternatives (CSS-hide, which leaves the column in the grid/DOM; router plumbing, which does not exist) are correctly reasoned out. No API/schema/contract change; design_gap_flag=false is correct because the fix restores the already-canonical 3-panel DM layout (no new surface, component, or mockup), so the Design block legitimately skips straight to Build. Scope fence (geometry/gating only, no DM redesign, no sibling todos folded in) is coherent and enforced across all three P-0 reviewers.

## Judgment calls (all defensible)

**REFRAME handled without re-spawn — defensible.** The problem-framer returned REFRAME but the P-0 orchestrator adopted the correction and PROCEEDed rather than re-spawning all three reviewers. This is the correct call, not a shortcut. The merge-table REFRAME→re-spawn edge exists to protect against a *wrong-problem* finding that would invalidate the ceo/mvp reviews. Here the correction was framing-PRECISION, not wrong-problem: it sharpened two premises (the ChannelSidebar renders a STALE server column, not an empty one; DM is a component-state toggle, not a route) and handed the exact implementation — without changing the disposition (still a DM-layout-debt fix) or the scope (still geometry-only, single AC). ceo-reviewer (PROCEED/HOLD-SCOPE) and mvp-thinner (OK, floor_constraint_active, zero split candidates) already judged the correct substance; their verdicts survive the sharpened framing intact. Re-spawning would have been process-for-process with an identical predictable outcome. The disposition-unchanged + scope-unchanged test is the right discriminator, and it was applied and documented.

**Floor-waiver (override-ship, resolve-by-rule) — defensible.** The single-spec sub-floor (~<100 LOC vs 1,500) tripped and was waived by rule without a BOARD convene. Correct: the floor's purpose is to block wasteful tiny greenfield waves, which does not apply to a V-2-triaged user-visible defect fix on a shipped surface with zero valid split candidates (mvp-thinner confirmed indivisibility; the AC is atomic — conditional render + full-width thread + 1024/1280 re-check are inseparable). Expanding would violate the P-0 scope fence by folding in sibling todos. This is the same class as wave-50 and correctly logged as the 2nd occurrence of the floor-carve-out candidate (approaching L-2 promotion threshold). No BOARD is right — routine sizing resolved by rule, and the ceo-reviewer BOARD seat already HOLD-SCOPE'd this exact scope at P-0.

**design_gap_flag=false / D-block skip — correct.** Restores an existing canonical layout via an existing guard pattern; no new UI surface, component, or mockup. B-block next.

**Note for B-block (advisory, not blocking):** the mobile overlay backdrop button (AppShell.tsx:72-80) is a third ChannelSidebar-adjacent element gated on `sidebarOpen`. It is cosmetically harmless when the drawer is gated off, but the implementer should confirm `sidebarOpen` cannot strand a backdrop on the DM surface. This is covered by the spec's "no orphaned column / no layout flash" AC and the plan's absence-assertion test; no spec change needed.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 2

---

# Phase 2 — Karen + jenny + Gemini (merged)

## Verdict: APPROVED (gate PASSES → B-block; design_gap_flag false → D skips)

- **karen: APPROVE** (a36d48ba) — all 7 load-bearing claims VERIFIED with exact file:line: dmHomeActive state (AppShell.tsx:37), ChannelSidebar ungated desktop 64-69 + mobile drawer 82-106, MemberListPanel `!dmHomeActive` guard :122 (the mirror idiom), geometry (ServerRail 72 / ChannelSidebar 260 / DmConvList lg:320 / DmThread flex-1 → 372px @1024 → 632px gated), react-specialist in AGENTS.md, zero contract/schema change. Spec buildable.
- **jenny: APPROVE** (adb794c8) — 0 drift: canonical DM 3-panel matches design/direct-messages.html (3 panels, no channel-sidebar) + journey map; F9 deferral chain traces to task 39fc1c5e; scope-fence matches P-0 verbatim; no server-view regression; no new route. 0 material spec-gap.
- **Gemini: UNAVAILABLE** (HTTP 429; exit 3) — degradable per Action 3; gate proceeds on karen + jenny.

## B-block carry (MANDATORY from Phase-2 karen)
- The B-3 test MUST assert ChannelSidebar is ABSENT when dmHomeActive=true for BOTH the desktop wrapper (64-69) AND the mobile overlay drawer (82-106), and PRESENT (no regression) when false — a desktop-only gate would pass a weak test while leaving the mobile leak.
- (head-product advisory) mobile backdrop (72-80) is sidebarOpen-gated; karen confirmed sidebarOpen can't become true while dmHomeActive (channel-drawer toggle unreachable on DM surface), so gating 82-106 is sufficient.

## Footer (Phase 2)
- phase2_complete: true
- karen: APPROVE | jenny: APPROVE | gemini: UNAVAILABLE
- gate: PASSED
