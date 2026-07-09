# P-0 ceo-reviewer — wave-81 (strategic-value + ambition lens)

**Reviewer:** ceo-reviewer (BOARD seat)
**Wave:** 81 — founder-directed bug fix (profile settings page not scrollable)
**Date:** 2026-07-09

## Verdict: **PROCEED** (with SELECTIVE-EXPANSION to the bounded clip-class — 2 routes, not 1)

## Reasoning

This is worth doing now and it is worth doing once. It is founder-directed, it is a real UX bug that **blocks a core action** (a user literally cannot reach or save profile fields below the fold — settings input silently clipped), and the fix is cheap and well-understood: the app-shell locks body `overflow:hidden`, and the standalone full-page settings routes use bare `min-h-screen` with no internal scroll container, so viewport-overflow content is unreachable. wave-77's academic fields pushed content past the fold and exposed it. The founder named `/settings/profile`, but the identical defect provably affects `/settings/privacy` — same `min-h-screen`-inside-a-locked-shell pattern, same `AuthGuard` app-shell, verified in `router.tsx` (both at lines 95–110) and in both page files. Fixing only the reported page would leave `/settings/privacy` clipped and all but guarantee the founder reports it next; fixing the shared root cause (give both authenticated standalone settings pages a proper internal scroll container) is the same small change applied consistently and closes the class. That is the right ambition here — "fix it properly once" — not gold-plating.

The scope stops there. The clip-class is exactly **two routes**: `/settings/profile` and `/settings/privacy`. The other three `min-h-screen` pages — `LandingPage`, `PrivacyPage`, `TermsPage` — are **public routes rendered OUTSIDE the app-shell**; they scroll on the document body and are not affected by the shell's overflow lock. They must NOT be swept in: there's no bug behind them and touching them is unbacked churn. Likewise, do not let this become a settings-layout redesign, a design-system scroll-primitive refactor, or a backlog dredge — it is a scroll-container fix, scoped to the two clipped pages.

On the phase: a "fix bugs / polish" phase is the correct use of the loop right now. StudyHall is post-roadmap (all 14 milestones shipped) and pre-external-users — exactly the window to harden real UX defects before anyone outside sees the product. The founder explicitly chose bug-fixing over a new strategic direction; that call is respected, and this bug is a strong first pick (high user-impact, low cost, clear root cause). No push for a strategic pivot is warranted; the brain should run the bug queue the founder has opened.

## Recommended scope (binding for P-1/P-2)

- **IN:** Restore scroll/reachability on the two authenticated standalone settings pages — `/settings/profile` (ProfilePage) and `/settings/privacy` (SettingsPrivacyPage) — by giving them an internal scroll container that works within the app-shell's `overflow:hidden` body. Fix the shared root cause once so both pages inherit it.
- **OUT:** Public pages (Landing / Privacy / Terms — outside the shell, not clipped); settings-layout or navigation redesign; new design-system scroll primitives beyond what the fix needs; any unrelated bug-backlog items (those are separate seeds, not this wave).

## Ambition dial

- Founder's literal ask: 1 page.
- Recommended: 2 pages (the full, provable clip-class) — SELECTIVE-EXPANSION.
- Rejected over-reach: 5 pages / redesign / DS refactor — RECONSIDER-and-decline.

**BOARD seat vote: PROCEED.**
