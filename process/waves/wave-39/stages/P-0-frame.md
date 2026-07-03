# Wave 39 — P-0 Frame

## Discover section
- **wave_db_id:** fc6efe36 (wave_number 39)
- **Prior-work citation:** wave-38 shipped avatar storage LIVE; its T-5 discovered F1 (this task). wave-4 built the avatar uploader UI + ProfilePage; wave-35 built SettingsPrivacyPage. The settings pages exist + are routed but the shell entry button was never wired.
- **Roadmap milestone:** M7 (6e2f68d8), in_progress, class=`product-polish`.
- **Spec-contract short-circuit verdict:** `no-prior-spec` (prose "Source: wave-38 T-5 F1…", no fenced YAML head). Full P-1..P-3.
- **Product-decision resolutions:** none (Tier-3 none). Launch-relevant polish.

## Reframe section
- **Original task framing:** wire the dead `ChannelSidebar.tsx:405` settings button (aria-label "Your profile and settings", currently onMouseEnter/Leave only, no onClick) to open the existing `/settings/profile` (hosts the avatar uploader) so the avatar feature is reachable.
- **problem-framer verdict:** PROCEED (verified the dead onClick IS the genuine root cause — one entry point, GearIcon/MicrophoneIcon are decorative aria-hidden spans; /settings/profile is real+routed+auth-guarded). Flags an ADJACENT pre-existing gap (NOT to bundle — scope-creep #5): SettingsPrivacyPage has zero nav, ProfilePage links only to /app → profile↔privacy mutually unreachable + privacy is URL-only. Recommends a sibling seed for settings cross-nav.
- **ceo-reviewer verdict:** SELECTIVE-EXPANSION. Wiring to a single hardcoded /settings/profile ships a SECOND dead-end: /settings/privacy (M7's named privacy differentiator) is ALSO only reachable via this same button. Proposes: make the entry a small user MENU (popover) reaching BOTH existing routes /settings/profile + /settings/privacy + Log out. Cheap (2-3 items over existing routes, no new pages/endpoints/data), disproportionate value (unlocks the whole settings surface + account exit; avoids rip-and-replace next wave). Guardrail: menu over existing routes ONLY, no new settings UI/panels.
- **mvp-thinner verdict:** not spawned (M7 class=product-polish, not product-feature).
- **Mediation outcome (head-product):** ACCEPT ceo SELECTIVE-EXPANSION. Rationale: the button is THE single doorway to all settings; a hardcoded single-destination nav leaves privacy (M7's headline differentiator) unreachable — a launch-readiness miss. A small user menu (Profile / Privacy / Log out) over EXISTING routes is the right ambition for the doorway, is cheap, and SUBSUMES problem-framer's profile↔privacy cross-nav concern (the menu IS the nav — no separate cross-nav sibling needed). problem-framer's PROCEED and ceo's SELECTIVE-EXPANSION are not in conflict: both agree privacy must also be reachable; the menu solves both at once. Anti-gold-plating guardrail carried into P-2/P-3: menu over existing routes only; NO new settings pages/panels/notification-prefs/account-management surfaces this wave.
- **Sibling task IDs created:** none (the cross-nav gap is subsumed by the menu; no separate sibling).
- **Disposition:** REFRAMED (SELECTIVE-EXPANSION accepted).

### Final framing (rest of P-block uses this)
**Wave-39 = wire the shell settings entry into a small user menu that unlocks the existing settings surface (F1 fix).**
1. Make the `ChannelSidebar` "Your profile and settings" button open a small user-menu popover on click (keyboard-accessible), styled with existing design-system tokens, reusing any existing popover/menu pattern in the app.
2. Menu items = navigate to **Settings / Profile** (`/settings/profile` — avatar uploader) + **Settings / Privacy** (`/settings/privacy`) + **Log out** (only if logout is not already reachable elsewhere in the shell — verify at P-3; if already reachable, still include for a coherent user menu OR note the existing path).
3. NO new settings pages, panels, or capabilities — menu over existing routes only.
4. Verify via live E2E (T-5): a real user clicks the button → menu opens → Profile → uploads an avatar → it renders; and → Privacy → the privacy page loads.
5. **design_gap_flag decision deferred to P-1:** a small user-menu popover is a new component; P-1 checks for an existing menu/popover pattern + tokens to match (if present → false/trivial-extension; if genuinely novel → tiny D-block brief).
