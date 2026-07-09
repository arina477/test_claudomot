# Wave 81 — P-3 Plan

## Approach section
### Architecture deltas
- **New — FullPageScroll wrapper (apps/web):** a small shared component (`h-dvh overflow-y-auto` + the DS scrollbar class) that wraps a standalone full-page route's existing `min-h-screen` content, restoring internal scroll within the globally-locked (`body{overflow:hidden}`) app viewport. **Alt:** unlock `body{overflow:hidden}` globally — REJECTED (wrong-layer; the lock is load-bearing for the app-shell's internal-panel scroll on /app /discover; removing it causes double-scrollbars + breaks the shell). **Alt:** per-page ad-hoc `h-dvh overflow-y-auto` on each root — workable but a shared primitive is DRY + consistent + future-proof. **Chosen:** one FullPageScroll primitive applied per standalone route.
- **Changed — the standalone full-page routes:** ProfilePage, SettingsPrivacyPage, PrivacyPage, TermsPage, LandingPage wrap their content in FullPageScroll (or swap their root to it). The shell routes (/app, /discover) are NOT touched. Failure-domain: pure client layout; no data/API/transaction change.

### Data model / API / deps
- None. Pure frontend layout.

## Plan section
### File-level steps by B-stage
**B-0 Branch** — branch `wave-81-fullpage-scroll`. | orchestrator | first. (No schema.)
**B-1 Contracts** — SKIP (no contract/type/API change). Record skip.
**B-2 Backend** — SKIP (frontend-only). Record skip.
**B-3 Frontend** — | **react-specialist** | the whole implementation:
- create `apps/web/src/shell/FullPageScroll.tsx` (h-dvh overflow-y-auto + 6px DS scrollbar; renders children).
- wrap/convert the roots of ProfilePage.tsx, SettingsPrivacyPage.tsx, PrivacyPage.tsx, TermsPage.tsx, LandingPage.tsx to use FullPageScroll (keep the inner min-h-screen content; the wrapper provides the scroll viewport). **AUDIT each: apply only where the page renders under the locked body** (all 5 do). Do NOT wrap /app /discover shell routes.
- verify no double-scrollbar on shell routes; preserve the DS scrollbar; h-dvh not h-screen.
- tests: a layout/DOM test that the wrapped page root has an overflow-y-auto scroll container; ideally a constrained-viewport scroll assertion. LIVE scroll-to-bottom is verified at T-5/T-6.
**B-4 Wiring / B-5 Verify / B-6 Review** — standard (typecheck, lint, tests, /review).

### Specialist routing (validated against AGENTS.md)
react-specialist (all frontend). Present. No D-block, no B-1/B-2 (skipped).

### Parallelization map
- Serial: B-0 → B-3 (single specialist, cohesive layout change). B-1/B-2 skipped.

### Self-consistency sweep
1. Every AC → step: FullPageScroll (B-3) + each route wrapped (B-3) + global-overflow-untouched (constraint) + shell-no-double-scroll (B-3 audit) + DS scrollbar (B-3) + no-churn (no-op wrapper). ✓
2. Specialist assigned (react-specialist). ✓ 3. No file in 2 batches. ✓ 4. design_gap false. ✓ 5. Deltas + alternatives (unlock-body rejected; per-page-ad-hoc considered). ✓ 6. No API/data (n/a). ✓ 7. No deps. ✓ 8. No SDK. ✓

**Binding refinements carried:** body{overflow:hidden} untouched; h-dvh (not h-screen); 6px DS scrollbar; standalone routes only (not /app /discover); LIVE scroll-to-bottom on /settings/profile (T-5).
