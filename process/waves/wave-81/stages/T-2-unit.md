# Wave 81 — T-2 Unit

**Pattern A — Verified-via-CI.** `test` job ran the full Vitest suite at C-1 on the merge commit; T-2 audits coverage adequacy of the wave's new DOM/unit surface.

## Action 1 — CI evidence
- **test** — PASS (1m58s) — run 29008456214 job 86085771255. Full suite green, 0 hangs. Per C-1 evidence: web 747/747 green; study-timer 5/5 (the pre-existing flaky suite stabilized across 740d27f / 69a9c43 / b0f4c57).

## Action 2 — Coverage audit (the wave's NEW unit surface)
The fix is a DOM-shape invariant (a root scroll container), which the wave covers with direct assertions on the rendered root element — the correct unit layer for a layout wrapper:

- **FullPageScroll.test.tsx** (3 tests): (a) renders children in a root scroll container; (b) root className contains `overflow-y-auto` + `h-dvh` and NOT `h-screen`; (c) className + inline style contain NONE of transform/filter/contain/will-change (the fixed-nav containing-block invariant) while still passing through `bg-surface-950`.
- **fullpage-scroll-routes.test.tsx** (7 tests): for PrivacyPage, TermsPage, LandingPage — each renders a ROOT `overflow-y-auto` + `h-dvh` container, and each wrapper establishes NO containing block (forbidden-prop guard). Plus: LandingPage keeps its `header.fixed` navbar as a descendant of the scroll wrapper (proves the fixed-nav-under-scroll-container invariant that motivated the no-transform constraint).
- **SettingsPrivacyPage.test.tsx** (added F7 test): asserts the loaded page's root is the FullPageScroll wrapper (overflow-y-auto h-dvh, no containing-block props) — this is the founder-reported ProfilePage's sibling, whose save/toggle controls sit below the fold.
- **profile-academic.test.tsx** (added): ProfilePage academic-section coverage under the wrapper.

**Assessment:** the DOM assertions (root element carries overflow-y-auto) are the honest unit-level proxy for "the page scrolls." They cannot prove pixel-level scrollability (no layout engine in jsdom) — that is exactly why T-5 executes the LIVE scroll on real prod. Layering is correct: unit proves the wrapper is the root scroll container; E2E proves scrolling reaches the bottom field. No mock-the-system-under-test (the real page components are rendered, not stubbed). ProfilePage itself is not asserted at the root level in a standalone test (it needs data mocking) — covered instead by SettingsPrivacyPage sibling assertion + the LIVE T-5 on the actual /settings/profile. Minor coverage note below.

## Action 3 — Findings
- **F-T2-1 (low):** ProfilePage (the exact founder-reported route) has no standalone unit test asserting its root === FullPageScroll wrapper (it requires profile-data mocking; the sibling SettingsPrivacyPage carries the root-wrapper assertion and profile-academic.test.tsx covers a ProfilePage section). Not blocking — the LIVE T-5 covers the exact route directly. Forward to V-2 as informational.

```yaml
test_pattern: ci-verified
evidence:
  - "C-1 test job: run 29008456214 job 86085771255 green (1m58s); web 747/747; study-timer 5/5 (flake stabilized)"
findings:
  - {severity: low, location: "apps/web/src/pages/ProfilePage.tsx", description: "no standalone unit asserting ProfilePage root === FullPageScroll wrapper; covered by SettingsPrivacyPage sibling + LIVE T-5"}
```
