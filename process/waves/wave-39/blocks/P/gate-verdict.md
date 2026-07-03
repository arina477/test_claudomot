# Wave 39 — P-4 Verdict

**Reviewer:** head-product (fresh spawn, Phase-1 gate)
**Reviewed against:** process/waves/wave-39/blocks/P/review-artifacts.md
**Attempt:** 1  (1 = first gate)
**Phase:** 1 (head-product)

## Verdict
APPROVED

## Rationale
Wave-39 fixes wave-38 F1 — the shell "Your profile and settings" button is a dead no-onClick control, so the just-shipped avatar uploader, the /settings/privacy page (M7's headline privacy differentiator), and account logout are all unreachable through the UI. The ceo SELECTIVE-EXPANSION reframe (accepted at P-0) is the right ambition for a single doorway: wiring one hardcoded route would ship a second dead-end, so the fix is a small 3-item user-menu popover (Profile / Privacy / Log out) over the EXISTING routes only, with an explicit and repeated anti-gold-plating guardrail (no new settings pages/panels/notification-prefs). Every load-bearing claim verified against the codebase: the dead button is real (ChannelSidebar.tsx onMouseEnter/Leave only, no onClick); the MessageList role=menu popover pattern that design_gap_flag=false rests on is genuinely shipped (role="menu" + popoverRef/anchorRef outside-click + aria-haspopup); Session.signOut resolves against the already-used `supertokens-auth-react/recipe/session` import; and /settings/profile, /settings/privacy, /login are all routed and auth-guarded. ACs are enumerated, independently verifiable, and cover the four non-happy states (keyboard open, Esc close+refocus, outside-click close, close-on-select) plus logout-then-protected-route bounce; AC7 is the falsifiable reachability crux. design_gap_flag=false is a defensible trivial-extension call with the B-block design-gap fallback as backstop. The floor-merge override-ship is legitimate precedent-application (w21 founding exemption → w24 no-re-litigate → w25/26/38), not a fresh BOARD. The plan is concrete, frontend-only, react-specialist-routed with no new deps/SDK/API, and ladders cleanly to M7 (product-polish, launch-readiness) with no scale/billing/multi-tenant gold-plating. One carry-forward note (binding, non-blocking) on the session-mutation surface — see below.

## Binding carry-forward notes (non-blocking; must be honored downstream)

- **N1 — Session-surface security routing (T-8 + P-4 tightened gate).** Log out mutates session (SuperTokens `Session.signOut`), so `wave_touches ∩ {sessions, auth} ≠ ∅`. Per the trigger table, this wave's user-facing session surface MUST be exercised at the **T-8 Security** layer and is in scope for the **P-4 security-scope tightened gate**. The P-block artifacts describe the mutation technically (P-3 "client-side session clear + redirect") and give T-8 testable targets (AC5 + edge-case "protected routes then bounce"), but no artifact enumerates the `{sessions}` touch and routes it to T-8 by name. This is a routing-label omission, not a spec hole — the security surface is genuinely thin (client-side signOut over an already-initialized recipe; no new endpoint, no cookie/CSRF/rate-limit/user-creation change). **Required downstream:** T-8 must verify signOut actually clears the session (not just redirects), the redirect to /login lands, and a subsequent authed-only route bounces to login. Record the `{sessions}` touch on the wave so the P-4 Phase-2 tightened-gate rule and T-8 both fire.
- **N2 — Anti-gold-plating guardrail is load-bearing.** Carry the P-0 guardrail verbatim into B-block: menu over existing routes ONLY; no new settings pages, panels, notification-prefs, or account-management surfaces this wave. The `simplify` pass at B-6 should flag any drift into new settings UI.
- **N3 — signOut export verification.** B-3 must confirm the exact call shape (`import Session from 'supertokens-auth-react/recipe/session'` → `Session.signOut()`) matches how the app already imports session utilities (auth/supertokens.ts) before wiring the Log out item.

## Stage-exit checklist (P-0 → P-3)

**P-0 Frame**
- [x] Root-cause problem named (dead onClick is THE single doorway to all settings; verified not a symptom).
- [x] Maps to one live milestone (M7 6e2f68d8, product-polish, launch-readiness) tied to the offline-first study-messaging wedge.
- [x] Falsifiable: AC7 — logged-in user reaches avatar upload via UI only and sees it render.
- [x] problem-framer (PROCEED) + ceo-reviewer (SELECTIVE-EXPANSION) verdicts present and reconciled; menu subsumes problem-framer's cross-nav concern (no silent override).

**P-1 Decompose**
- [x] One seed, no siblings; cross-nav gap subsumed by the menu (no bundle bloat).
- [x] All ACs mvp-critical to the reachability claim; none deferred/split needed.
- [x] No dependency on unbuilt out-of-bundle tasks.
- [x] Floor-merge override-ship justified by precedent (w21/w24 lineage); floor_merge_attempt=0 defensible (no unblocked adjacent frontend scope).

**P-2 Spec**
- [x] ACs enumerated + independently verifiable (7 ACs).
- [x] Empty/loading/error/offline analogues covered for the surface: keyboard open, Esc+refocus, outside-click close, close-on-select, logout-bounce, unverified-user Profile, rapid re-click idempotency, keyboard-only reachability.
- [x] Non-goals explicit (no new settings pages/panels/prefs/account-management).
- [x] Session/auth surface present — flagged for T-8 + tightened gate (carry-forward N1).
- [x] Full spec contract embedded as fenced YAML head in the primary task's DB description (verified via tasks.description of c208e91e), not only the convenience copy.

**P-3 Plan**
- [x] Reuses established architecture (MessageList role=menu popover pattern + design-system tokens); no parallel mechanism invented.
- [x] No unneeded infra (no Redis/multi-replica/billing); frontend-only, zero new deps/SDK/API.
- [x] Each step maps to a bundle task + observable artifact (UserMenu.tsx, ChannelSidebar.tsx wiring, unit test; AC7 live at T-5).

## Handoff
- **design_gap_flag == false** → next stage is Phase-2 reviewers (Karen + jenny + Gemini); on Phase-2 pass, P-block exits to **B-0 Branch & schema** (D-block skips).

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3

---
## Phase 2 — Karen + jenny + Gemini (merged)
**Karen:** APPROVE — all 6 load-bearing claims VERIFIED (dead button ChannelSidebar.tsx:403-468 no onClick; routes /settings/{profile,privacy} exist router.tsx:86,94; MessageList role=menu popover pattern :612-641; supertokens-auth-react session recipe initialized supertokens.ts:12,27 → Session.signOut() available; logout genuinely absent — only signOut-adjacent UI is VoiceStudyRoom Leave=room.disconnect, different concern; react-specialist AGENTS.md:82).
**jenny:** APPROVE — no material drift across 5 checks. Menu navigates only to inventoried surfaces; privacy item advances M7; logout genuinely absent; floor-merge follows w16→w21→…→w38 precedent (already logged). Carry-forward (T-9, non-blocking): flip the map's ChannelSidebar settings-button node from "dead/UI-unwired" (line 92) → "reachable via user-menu" + note the shell overlay (annotation-only).
**Gemini:** UNAVAILABLE (exit 3, HTTP 429 credits depleted) — degradable, does not block.
## Phase 2 verdict: PASS (Karen + jenny APPROVE; Gemini UNAVAILABLE) → P-block EXIT → B-0 (design_gap_flag=false, D skips)
Carry-forwards: T-8 (logout/session — verify signOut clears session + redirect); T-9 (map settings-button node flip).
