# Wave 1 — P-2 Spec (pointer)

**Source of truth:** the spec contract lives in the primary task's `tasks.description` (YAML head + `---` + prose).
**Primary task id:** `cbf25dd5-95ab-4ebf-a7bc-a5e6a3714804`
**wave_type:** single-spec · **claimed_task_ids:** [cbf25dd5-…] · **design_gap_flag:** false

## Acceptance criteria (copy for P-3/P-4 reference)
1. Clean checkout `pnpm install --frozen-lockfile` succeeds.
2. `pnpm dev` boots api (GET /health → 200 `{"status":"ok"}`) + web (SPA serves).
3. Dark app shell renders: server rail + channel sidebar + main column, layered zinc surfaces, Geist + emerald accent, consistent with design/app-home.html + server-channel-view.html chrome.
4. Reusable ConnectionStateIndicator renders online/reconnecting/offline (prop-driven this wave).
5. Responsive: <1024px collapses side panels; ≥1280px shows all three columns (DESIGN-SYSTEM.md breakpoints).
6. `pnpm lint` (Biome), `pnpm typecheck` (tsc strict), `pnpm build` all exit 0.
7. `pnpm test` smoke suite passes (web: shell 3 columns render; api: /health 200).
8. CI green on a PR to main (lint/typecheck/test/build/secret-scan).

## Contracts
- types: `packages/shared` Zod `HealthResponse { status, service, version }`.
- api: `GET /health → 200 { status:'ok', service:'studyhall-api', version }`.
- data: none (DB is the deferred auth-backend task).
- sdk: none (auth/voice/email are later waves).

## Edge cases
clean-machine install · API-unreachable (shell still renders, offline indicator) · narrow window collapse · CI fails red on lint/type error.
