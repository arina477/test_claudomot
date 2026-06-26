# Wave 1 — B-6 Verdict

**Reviewer:** head-builder (fresh spawn, agentId head-builder-b6-wave1)
**Reviewed against:** process/waves/wave-1/blocks/B/review-artifacts.md
**Attempt:** 1  (1 = first gate)

## Verdict
APPROVED

## Rationale
This is a clean, spec-conformant, CI-ready foundation scaffold. I independently re-ran every load-bearing check against reality rather than trusting the B-stage deliverables: `pnpm install --frozen-lockfile` is a no-op (lockfile committed, AC1); `pnpm lint` (Biome ci, 34 files) exits 0; `pnpm typecheck` (tsc project refs, strict, 3 workspaces) exits 0; `pnpm build` produces artifacts for all three workspaces (web 215.95 KB JS + PWA precache; api nest build); `pnpm test` passes 11/11 (api 1/1 health-contract, web 10/10 shell + indicator). I booted the actual AC2 dev path (`nest start`, which is what `pnpm dev` runs) and `GET /health` returned **HTTP 200** with body `{"status":"ok","service":"studyhall-api","version":"0.0.1"}` — satisfying AC2 ("body containing `{"status":"ok"}`"). Contract conformance is real: `packages/shared/src/health.ts` is the single Zod source, the api controller types its return as the shared `HealthResponse`, and the api test asserts the live body against `HealthResponseSchema.safeParse`. CI (`.github/workflows/ci.yml`) pins `node-version-file: .nvmrc`, `.nvmrc=22` is materialized (karen's P-4 carry-forward resolved), and runs lint/typecheck/test/build/secret-scan (gitleaks) as separate gating jobs. Secret hygiene is clean — no `.env`/secrets in the diff; `.gitignore` covers `.env*`, `node_modules/`, `dist/`. Scope discipline is correct: no DB/auth/voice smuggled in (schema legitimately skipped — deferred to task b9118041), the member-list column is correctly out of shell scope (jenny nuance confirmed in `AppShell.tsx`), ConnectionStateIndicator is prop-driven across online/reconnecting/offline with `role=status`/`aria-live` (AC4), and the `lg:` (1024px) breakpoint collapses the channel sidebar to an overlay drawer below 1024 while keeping all columns at ≥1280 (AC5). The four documented deviations (api CommonJS tsconfig override, inline SVG icons, `NODE_ENV=test` in vite config, 3-line supertest type shim) are all reasonable, minimal, and disable no lint rules. One latent production-deploy defect exists (broken `api start` script — see Carry-forward below); it fails no AC this wave and does not block CI, so it does not gate B-6, but it is logged as a load-bearing hand-off so the C-block does not hit a false-green deploy.

## Verified acceptance criteria
- **AC1 (frozen install):** PASS — `pnpm install --frozen-lockfile` → "Already up to date"; `pnpm-lock.yaml` committed.
- **AC2 (`pnpm dev` boots api + web; `GET /health` → 200 `{"status":"ok"}`):** PASS — verified live via `nest start` (the `pnpm dev` path): 200, exact body shape.
- **AC3 (dark 3-column shell, zinc/emerald/Geist per design system):** PASS — ServerRail / ChannelSidebar / MainColumn over `#0a0a0b` zinc surfaces, Geist loaded in `index.html`, emerald accent + tokens in `globals.css`; built against design/app-home.html + server-channel-view.html.
- **AC4 (ConnectionStateIndicator online/reconnecting/offline):** PASS — prop-driven, all three states render; `aria-live` text not color-alone.
- **AC5 (responsive: <1024 collapse, ≥1280 all columns):** PASS — `lg:` (1024) drawer collapse; sidebar persists in DOM for a11y; covered by RTL tests.
- **AC6 (lint/typecheck/build exit 0):** PASS — all three re-run green independently.
- **AC7 (smoke suite passes — ≥1 web 3-column test, ≥1 api /health-200 test):** PASS — 11/11.
- **AC8 (CI green-ready, `node-version-file: .nvmrc`, `.nvmrc=22`):** PASS — workflow + `.nvmrc=22` materialized; lint/typecheck/test/build/secret-scan jobs present.

## Carry-forward to C-block (NOT a B-6 blocker — no AC exercises it this wave)

### HIGH — broken production start script (deploy-boot trap)
- **What:** `apps/api/package.json` `start` = `node dist/main`, but `nest build` emits the entrypoint to `dist/src/main.js` (TS preserves the `src/` tree because `apps/api/tsconfig.json` does not pin `rootDir` and the api imports the out-of-root `@studyhall/shared`). `node dist/main` throws `MODULE_NOT_FOUND` (reproduced).
- **Why it does not gate B-6:** No wave-1 AC exercises production `pnpm start` (AC2 is `pnpm dev` → `nest start`, which works), and CI never runs `start`. Dev, lint, typecheck, test, build, and CI are all green.
- **Owner / when:** head-ci-cd at C-2 (Deploy & verify) — the Railway start command / boot path must resolve to the real `dist/src/main.js` (or pin `rootDir`/`outDir` so the entry lands at `dist/main.js`) BEFORE first deploy. Do not let the deploy go green on a /healthz that never came up. Route the fix through backend-developer per the Iron Law.

### LOW — minor observations (accepted-debt, no action required this wave)
- `apps/web` declares `@studyhall/shared` (dependency + tsconfig path alias, both resolve) but does not yet *import* it in source — AC contract says "consumed by both api and web." Acceptable for the scaffold: real connectivity wiring (which will consume the shape) is an explicitly deferred wave; the package is consumable from web today and api consumes it concretely. Note for the connectivity wave.
- CI `test` job provisions a `postgres:16` service that is unused this wave (DB deferred). Harmless and cheap; forward-looking. No change.
- `version` resolves to `0.0.1` (from `apps/api/package.json`) at runtime vs the `0.1.0` fallback literal noted in B-5; AC2 only requires `status:'ok'`, so both satisfy. Cosmetic.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
