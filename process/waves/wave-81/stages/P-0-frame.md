# Wave 81 — P-0 Frame

## Discover section
- **wave_db_id:** 70926c0f-a6f2-47ab-9c91-afd8d3204e47 (wave_number 81; milestone_id NULL — roadmap complete, founder bug-fix phase)
- **Prior-work citation:** wave-77 grew ProfilePage with ~6 academic fields (commit 26fc38d), pushing it past the viewport and exposing a latent clip. globals.css app-shell overflow lock is the shipped foundation.
- **Roadmap milestone:** NONE — all 14 milestones done (roadmap terminal). Founder resumed the loop (2026-07-09) with a bug-fix directive. Task 2340d2d3 milestone_id NULL.
- **Spec-contract short-circuit:** no-prior-spec.
- **Product-decision resolutions:** none (bug fix).

## Reframe section
- **Original framing (founder directive 2026-07-09):** "in the profile i cannot scroll all the information" at /settings/profile — cannot reach/save fields below the fold.
- **Root cause (VERIFIED by both reviewers + orchestrator):** globals.css locks `html`+`body` to `height:100%; overflow:hidden` (`#root` 100%) — the Discord-style app-shell where inner panels scroll, the page body does NOT. The standalone full-page routes render as bare `<AuthGuard><Page/></AuthGuard>` (no scrolling shell): ProfilePage (`min-h-screen` ~L462) + SettingsPrivacyPage (`min-h-screen` ~L246) grow past the viewport → the global `overflow:hidden` body CLIPS the overflow, no scrollbar.
- **problem-framer: PROCEED (widen scope)** — root cause + fix layer confirmed (page-level scroll container `h-dvh overflow-y-auto`; do NOT remove global body overflow — that would break the app-shell = wrong-layer). Found the SAME `min-h-screen`-under-locked-body pattern in 6 places (2 settings + Privacy/Terms/Landing public + AuthLayout). Recommends a shared FullPageScroll wrapper across standalone routes.
- **ceo-reviewer: PROCEED / SELECTIVE-EXPANSION (2 routes)** — worth doing (founder-directed, blocks a core action). Claimed only the 2 settings pages are affected, asserting public Landing/Privacy/Terms "scroll on the document body." Cautioned against unbacked churn.
- **Mediation (head-product):** the two disagree on whether public pages clip. **Orchestrator VERIFIED: PrivacyPage/TermsPage/LandingPage ALL use `min-h-screen` roots** with no own scroll container, and `body{overflow:hidden}` is a GLOBAL unconditional CSS rule (not shell-scoped) → the public pages DO clip once content exceeds the viewport (legal text + multi-section landing certainly do). **problem-framer's class-fix is correct; ceo-reviewer's "public unaffected" is factually wrong.** BUT ceo-reviewer's anti-churn concern is honored automatically: **a scroll-container wrapper (`h-dvh overflow-y-auto`) is a visual NO-OP on a page that fits the viewport** — so applying it to every standalone route is safe (fixes long pages, invisible on short ones), zero churn risk.
- **Disposition:** **PROCEED (class-fix via a shared scroll wrapper).** Scope = a reusable `FullPageScroll` primitive applied to the standalone full-page routes rendered under the locked body — the founder's /settings/profile + its sibling /settings/privacy (confirmed) + the public Privacy/Terms/Landing (verified same pattern) + audit auth pages (apply the no-op-safe wrapper). Global overflow untouched.
- **Final framing:** restore internal page scroll on the standalone full-page routes by wrapping their content in a shared scroll container, so all content (incl. the profile form's bottom fields + save) is reachable within the locked app viewport.

### Binding refinements carried to P-2/P-3 (LOAD-BEARING)
1. Do NOT remove/alter the global `body{overflow:hidden}` (load-bearing for the app-shell internal-scroll layout — removing it is a wrong-layer fix + double-scrollbar regression on /app /discover).
2. A shared `FullPageScroll` primitive: `h-dvh overflow-y-auto` (prefer **h-dvh** over h-screen to avoid the mobile-URL-bar variant of the same clip). Preserve the 6px dark DS scrollbar (globals.css §9 / DESIGN-SYSTEM §9).
3. Apply to standalone full-page routes; each route enumerated as an AC. A scroll wrapper is a no-op on short pages → safe to apply broadly, no churn.
4. No double-scrollbar regression on the shell routes (/app, /discover) — those already scroll internally; do NOT wrap them.
5. **Live scroll-to-bottom verification on a CONSTRAINED viewport** (the founder's /settings/profile — reach the bottom-most field + save button) is a required AC; assertion-only is insufficient (T-5/T-6).

**claimed_task_ids:** [2340d2d3-f405-4d16-b8fb-a2111c141ea7]
