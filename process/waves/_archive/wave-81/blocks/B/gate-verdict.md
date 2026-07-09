# Wave 81 — B-block exit gate verdict (Phase 1)

- **Block:** B (Build)
- **Gate:** B-6 Review
- **Attempt:** 1
- **Verdict:** APPROVED
- **agentId:** head-builder (claude-opus-4-8)
- **Reviewed:** 2026-07-09
- **Branch:** wave-81-fullpage-scroll
- **Spec:** task 2340d2d3 (wave-81-spec) + P-4 corrections
- **Mode:** automatic

## Verdict: APPROVED

The FullPageScroll fix is spec-faithful, respects every LOAD-BEARING constraint, and passes all cross-cutting quality gates on an independent run. No rework required. Cited evidence below.

## Judged criteria

### 1. FullPageScroll correct — PASS
`apps/web/src/shell/FullPageScroll.tsx` renders exactly `<div className={`h-dvh overflow-y-auto${...}`}>`.
- `h-dvh`, NOT `h-screen` — correct (tracks dynamic viewport, avoids mobile URL-bar clip). Confirmed.
- **NO transform / filter / contain / will-change** — the fixed-nav reparent guard holds. The component sets only `h-dvh overflow-y-auto` plus an optional `className` background passthrough. The prop JSDoc explicitly documents the constraint ("Must not add transform/filter/contain/will-change"). Confirmed by reading the full 35-line source.

### 2. Five routes wrapped, shell routes untouched, body-lock intact — PASS
- ProfilePage — **both returns wrapped**: loading return (`<FullPageScroll>` at line 391, close 458) and main return (468, close 1084). Confirmed.
- SettingsPrivacyPage (246→755), PrivacyPage (12→146), TermsPage (12→166), LandingPage (11→271) — all wrapped, single import each. Confirmed.
- No FullPageScroll usage anywhere outside the 5 pages + component/tests (`grep -rl` swept clean).
- Shell routes: `AppHome.tsx` and `DiscoverShell.tsx` (the real /app /discover roots) have 0 FullPageScroll references and are **NOT in the diff at all** — untouched. No double-scrollbar risk.
- **globals.css is NOT in the diff** — `body { overflow: hidden }` UNCHANGED. The wrong-layer body-unlock was NOT done. The fix is a per-page inner scroll container, exactly as specified.

### 3. LandingPage fixed nav + DS scrollbar — PASS
- LandingPage's `<header className="fixed top-0 z-50 w-full">` lives INSIDE `<FullPageScroll>`, which is transform-free — so the fixed navbar stays viewport-anchored (no containing block established by the wrapper). Confirmed by reading the wrapped markup.
- The 6px dark DS scrollbar (globals.css §9 `::-webkit-scrollbar`) is global and inherited by the new `overflow-y-auto` container automatically — no per-component override needed, and globals.css was not touched, so it is preserved.

### 4. Tests — PASS
- `apps/web/src/shell/FullPageScroll.test.tsx` (3 tests): asserts root is `overflow-y-auto` + `h-dvh`, explicitly asserts NOT `h-screen`, and guards that neither className tokens nor inline style introduce transform/filter/contain/will-change.
- `apps/web/src/pages/fullpage-scroll-routes.test.tsx` (7 tests): asserts each of Privacy/Terms/Landing renders a root `overflow-y-auto h-dvh` scroll container, re-runs the transform-free guard per page, and asserts LandingPage's `header.fixed` survives as a descendant of the wrapper.
- Both new files pass in isolation (10/10). LIVE scroll-to-bottom on a constrained viewport is correctly deferred to T-5/T-6 (not a B-block obligation) — B-5 notes this explicitly.

### 5. Cross-cutting (independently re-run on branch) — PASS
- **Typecheck:** `turbo run typecheck` — 4 successful, 4 total (FULL TURBO cache). Exit 0.
- **Biome:** `biome ci apps/web/src` — 161 files checked, 0 errors, no fixes. Exit 0.
- **Web unit suite:** `vitest run` — **745 passed (745)**, 55 files. Exit 0. (The socket.io ECONNREFUSED lines are expected test-env chatter from presence-client reconnect attempts, not failures.)
- **Build:** `turbo run build` — 3 successful, 3 total; web bundle + PWA generated cleanly. Exit 0.
- **Regressions:** none. Shell routes untouched (no double-scrollbar), fixed nav intact (transform-free wrapper + guarding test), body-lock intact.
- **design_gap false — correct.** This is a structural/CSS fix that reuses the existing DS scrollbar and the mockup-modeled `h-[100dvh] overflow-y-auto` shape; no new UI surface, icon, page, or flow is introduced. No D-block needed.

## Rework items
None.

## Escalations
None. Not structural.
