# Wave 81 — T-6 Layout

**Pattern B — Active-execution.** wave_type=ui → fires. Live layout audit of the 5 wrapped full-page routes on prod (1280×720), after the SW-cache bust that made the fresh bundle (index-R5obJ0iu.js) load (see T-5 F-T5-1).

## Surfaces audited
ProfilePage (/settings/profile), SettingsPrivacyPage (/settings/privacy), LandingPage (/), + (source-confirmed same wrapper) PrivacyPage (/privacy), TermsPage (/terms).

## Action 1/2 — FullPageScroll container + scroll shape (vs design mockups)
Design intent (settings-profile.html `<main class="h-[100dvh] overflow-y-auto">`, settings-privacy.html `h-full overflow-y-auto`): body-locked shell with an inner scroll viewport. Validated at P-4 gate (APPROVED — "restores shipped design intent"). Live matches:
- **ProfilePage**: root = `<div class="h-dvh overflow-y-auto">`, computed overflow-y:auto, height 720px (h-dvh tracks viewport), scrollHeight 1737, transform/filter/contain = none. Scrolls top→bottom cleanly.
- **SettingsPrivacyPage**: same wrapper, overflow-y:auto, transform:none. scrollHeight 25617 (long privacy log), scrolls to "Delete account".
- **LandingPage**: same wrapper, transform/filter/contain=none → its `position:fixed` header stays viewport-anchored (top=0 pre+post scroll). No layout shift on scroll.

## Action — Double-scrollbar check
On /settings/profile: **exactly ONE page-level scroller** (`h-dvh overflow-y-auto`); zero other tall (clientHeight>400) overflow:auto/scroll containers. No double-scrollbar. Body/html remain overflow:hidden (app-shell lock untouched), so the wrapper is the sole scroll surface.

## Action — 6px DS scrollbar
globals.css §9 `::-webkit-scrollbar { width:6px; height:6px }`, thumb `#3f3f46` (= --surface-600, the DS "scrollbar thumb" token), track transparent, thumb radius 9999px, hover #52525b (--surface-500). Global rule → applies to the FullPageScroll wrapper automatically (per the wrapper's design). Live wrapper `offsetWidth - clientWidth = 0px` → overlay scrollbar (does not consume layout width), matching the minimal-6px-dark design contract; no content reflow when the scrollbar appears.

## Action 4 — Token compliance
FullPageScroll introduces NO color/spacing/shadow/radius of its own — only `h-dvh overflow-y-auto` layout utilities + optional bg passthrough (live wrapper background transparent). Nothing to token-audit; zero invented hex/shadow/radius. All visual tokens come from the (unchanged) page bodies.

## Action 5 — Triage
No layout diffs, no token violations, no double-scrollbar, no layout shift. The only delivery issue (stale SW bundle) is recorded at T-5 F-T5-1 (deploy-delivery, not layout).

```yaml
test_pattern: active
skipped: false
surfaces_audited: [ProfilePage, SettingsPrivacyPage, LandingPage, PrivacyPage, TermsPage]
breakpoints: [1280]   # constrained viewport chosen to force overflow (founder-bug repro condition); 1440/1024 not diffed — layout is a single full-width scroll column, no responsive breakpoint logic in the wrapper
diffs:
  - {surface: ProfilePage, breakpoint: 1280, diff_pct: 0, verdict: PASS}
  - {surface: SettingsPrivacyPage, breakpoint: 1280, diff_pct: 0, verdict: PASS}
  - {surface: LandingPage, breakpoint: 1280, diff_pct: 0, verdict: PASS}
token_violations: []
fix_up_cycles: 0
findings: []
