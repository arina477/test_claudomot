# P-0 Problem-Framer — wave-81 (profile settings not scrollable)

**Agent:** problem-framer · **Mode:** founder-directed bug fix · **Date:** 2026-07-09

## VERDICT: PROCEED (with binding scope refinement)

The orchestrator's root-cause is **correct and verified against code**. Proceed to P-1/P-2 with the fix layer and scope refinements below. This is not a REFRAME (problem is framed right) and not an AUTO-SPLIT (single coherent CSS-layout defect), but the scope must widen from the one reported page to the shared standalone-page-scroll pattern — captured as a binding refinement, not a split.

## Root-cause verification (confirmed)

- **`apps/web/src/styles/globals.css`** L55-73: `html { height:100%; overflow:hidden }`, `body { height:100%; overflow:hidden }`, `#root { height:100% }`. This is the Discord-style app-shell lock — inner panels scroll, the page body never does. Verified load-bearing.
- **`apps/web/src/router.tsx`** L95-110: `/settings/profile` and `/settings/privacy` render as `<AuthGuard><Page/></AuthGuard>` — **NO shell wrapper**. Contrast `/discover` (L87-94) which wraps in `DiscoverShell` (RailShell provides its own internal scroll). Confirmed: the two settings pages render OUTSIDE any scrolling AppShell container.
- **`ProfilePage.tsx`** L461-463: root `<div className="min-h-screen">`. **`SettingsPrivacyPage.tsx`** L245-248: identical `min-h-screen` root. `min-h-screen` grows with content; the `overflow:hidden` body clips everything past 100vh with no scrollbar → form bottom unreachable. Confirmed.
- **Trigger:** wave-77 commit `26fc38d` (B-3 academic-identity editor) grew ProfilePage to 1070 lines / ~6 academic fields, pushing content past the viewport and exposing the pre-existing clip. Confirmed via git history.
- **No other overflow override exists** — only `globals.css` sets overflow anywhere in `apps/web/src/styles/` or `index.html`. Nothing else provides a scroll container.

Diagnosis is **CORRECT** as written.

## Symptom-vs-cause + right-layer (confirmed)

The correct fix is a **PAGE-LEVEL scroll container on the standalone routes** — the standalone page root becomes a viewport-height scrolling wrapper (e.g. `h-screen overflow-y-auto` enclosing the existing `min-h-screen` content, or the root itself carrying `h-dvh overflow-y-auto`). **Do NOT remove or weaken `body { overflow:hidden }`** — it is load-bearing for the app-shell's internal-scroll layout (DiscoverShell/RailShell rely on the body being locked so their inner panels own scrolling). Removing the global rule is a **wrong-layer fix** (Antipattern: fix-at-wrong-altitude): it would trade a broken settings page for a broken app shell and a double-scrollbar regression. The clip is caused by standalone pages opting out of the shell without providing their own scroll region — so the fix belongs at those pages' outer container, exactly where the opt-out happens. Fix layer **CONFIRMED: page-level scroll wrapper, global overflow untouched.**

## Scope (binding refinement — this is the important part)

Fixing only `/settings/profile` is a **demo-path tunnel-vision symptom-patch** (Antipattern: fix-the-reported-instance). The clip is a property of the *pattern*, not the page. Verified siblings sharing the exact `min-h-screen`-under-locked-body pattern with no scroll container:

| Route | File | Root | Overflow risk today |
|---|---|---|---|
| `/settings/profile` | `ProfilePage.tsx` L462 | `min-h-screen` | **Broken now** (reported) — 1070 lines, ~6 fields past viewport |
| `/settings/privacy` | `SettingsPrivacyPage.tsx` L246 | `min-h-screen` | **High** — 748 lines, same header pattern; breaks on small viewports / more toggles |
| `/privacy` | `PrivacyPage.tsx` L12 | `min-h-screen` | **High** — long legal copy, public |
| `/terms` | `TermsPage.tsx` L12 | `min-h-screen` | **High** — long legal copy, public |
| `/` (Landing) | `LandingPage.tsx` L11 | `min-h-screen` | **High** — long marketing page, public |
| auth pages (login/signup/forgot/reset/verify-email) | via `AuthLayout.tsx` L20 | `min-h-screen flex-col items-center justify-center` | **Lower today** (short centered forms) but same latent defect — clips if a form ever exceeds 100vh (validation stack, small laptop, zoom) |

**Recommended scope: fix the shared pattern, not the one page.** Introduce a single reusable **`FullPageScroll` wrapper** (or an equivalent shared root class, e.g. a `page-scroll` utility = `h-dvh overflow-y-auto`) and apply it to every standalone full-page route — the two settings pages, the three public pages, and `AuthLayout` (which covers all five auth pages in one edit). This is one shared primitive, not N ad-hoc patches, so it does not bloat the change and it prevents the next wave that grows any standalone page from re-reporting the same bug. This is a scope **widening within the same fix**, not a milestone split → PROCEED, not AUTO-SPLIT.

Rationale for not narrowing to just the two settings pages: PrivacyPage/TermsPage/LandingPage are long public pages that are almost certainly already clipped in production today (they have no scroll container and the body is locked) — leaving them is knowingly shipping a half-fix of a bug we've now root-caused globally.

## Antipatterns red-team (PRODUCT-PRINCIPLES.md § Antipatterns)

- **Wrong-layer fix (removing global overflow):** flagged and rejected — see right-layer section. Binding constraint on P-2/P-3.
- **Demo-path tunnel-vision (fix only the reported page):** flagged and rejected — see scope table. Binding: fix the shared pattern.
- **Over-engineering / gold-plating:** none introduced. The `FullPageScroll` wrapper is the *minimum* shared primitive; the alternative (per-page copy-paste) is more code and more drift, not less.

## Binding refinements for P-2 (spec) / P-3 (plan)

1. **Fix layer is fixed:** page-level scroll wrapper on standalone routes. `globals.css` `html`/`body` `overflow:hidden` is NOT to be touched. Any spec that proposes editing the global overflow rule is out of contract.
2. **Scope is the shared pattern:** deliver one reusable `FullPageScroll` wrapper / shared page-scroll class; apply to ProfilePage, SettingsPrivacyPage, PrivacyPage, TermsPage, LandingPage, and AuthLayout (covers all auth pages). AC list must enumerate each so V/T can verify no page is left clipped.
3. **Preserve the 6px dark scrollbar (DESIGN-SYSTEM §9 / globals.css L75-89).** The new scroll container must surface the existing `::-webkit-scrollbar` 6px `#3f3f46` thumb — do not introduce a native/default scrollbar or a differently-styled one. Add a Firefox `scrollbar-width: thin` / `scrollbar-color` fallback if not already covered, but the webkit token set stays canonical.
4. **No double-scrollbar / no layout shift on the shell routes.** `/app` and `/discover` (shell routes) must NOT regress — they already scroll internally; the wrapper must apply ONLY to standalone routes, never wrap the shell. Verify no nested scroll region on shell pages.
5. **Live scroll-to-bottom verification is a required AC (not just a unit test).** T/V must, on a constrained viewport (e.g. 1280×720 or shorter), load `/settings/profile` in production/preview and confirm: (a) the last field and the save/action row at the form bottom are reachable by scrolling, (b) a scrollbar appears, (c) it is the 6px dark DS scrollbar. Repeat the reach-the-bottom check for `/settings/privacy` and at least one long public page (`/terms` or `/privacy`). Assertion-only ("class is present") is insufficient — the acceptance-by-assertion antipattern applies; observe the scroll.
6. **Prefer `h-dvh` over `h-screen`/`100vh`** for the wrapper height to avoid the mobile-URL-bar viewport-unit clip (a second, subtler instance of the same bug class). Note for P-3 approach; `h-screen` is acceptable if the project's Tailwind version predates `dvh` support — confirm at plan time.
