# V-1 Semantic-Spec Verification — jenny — StudyHall wave-1

**Verdict: APPROVE**

Spec contract: `tasks.id = cbf25dd5-95ab-4ebf-a7bc-a5e6a3714804` (DB row; convenience copy `process/waves/wave-1/stages/P-2-spec.md`).
Deployed: web `https://web-production-bce1a8.up.railway.app` · api `https://api-production-b93e.up.railway.app` · merge commit `486d45b`.
Method: live curl of both Railway services + independent inspection of committed source + CI run `28240325274` (PR #1, all 5 jobs green).

Live-browser render (AC3/4/5 visual) could not be exercised — Playwright MCP needs the absent `chrome` channel binary. Per the V-1 prompt and T-5/T-6 (head-tester APPROVED for a static no-flow foundation wave), CI RTL component tests + live HTTP serve are the agreed coverage substitute. Verified both.

---

## Acceptance-criteria results (8/8 met)

**AC1 — `pnpm install --frozen-lockfile` succeeds from clean checkout. PASS**
- `pnpm-lock.yaml` committed (268 KB). `pnpm-workspace.yaml` + `turbo.json` present; workspaces `apps/api`, `apps/web`, `packages/shared`.
- `.github/workflows/ci.yml:21,32,52,63` run `pnpm install --frozen-lockfile` across 4 jobs — all green. CI test-job log: "Lockfile passes supply-chain policies (839 entries)".

**AC2 — `pnpm dev` boots api (`/health` 200 `{"status":"ok"}`) + web SPA. PASS**
- Live `GET /health` → HTTP 200, exact body `{"status":"ok","service":"studyhall-api","version":"0.1.0"}` — matches the contract's `api: GET /health -> { status:'ok', service:'studyhall-api', version:<string> }`.
- Live web `/` → HTTP 200 SPA HTML (`<div id="root">`, hashed `index-*.js`/`index-*.css`, PWA manifest).

**AC3 — Dark app shell: server-rail + channel-sidebar + main column on zinc surfaces, Geist, emerald. PASS**
- `apps/web/src/shell/AppShell.tsx` renders `ServerRail (72px) | ChannelSidebar (260px) | MainColumn (flex-1)`.
- Tokens `apps/web/src/styles/globals.css`: `--color-surface-950:#0a0a0b` (near-black layered zinc), `--color-surface-700:#27272a`, `--color-accent-emerald:#10b981`.
- Deployed HTML: `<html lang="en" class="dark">`, `theme-color #0a0a0b`, Geist + Geist Mono `<link>` loaded.
- RTL: 6 AppShell tests green in CI (rail nav, sidebar present, main column, server buttons, channels, connection-status region).

**AC4 — ConnectionStateIndicator renders online / reconnecting / offline (prop-driven). PASS**
- `apps/web/src/shell/ConnectionStateIndicator.tsx` exports `ConnectionState = 'online'|'reconnecting'|'offline'`; all three branches implemented (emerald sr-only online, amber+spinner reconnecting, danger offline message), 200ms color fade, `role`/`aria-live="polite"` (state in text, not color alone).
- RTL: 4 ConnectionStateIndicator tests green in CI (each state + aria-live on all states).

**AC5 — Responsive: <1024px collapse to overlay; all columns visible at the wide breakpoint. PASS**
- `AppShell.tsx:52` channel sidebar `hidden lg:flex` (inline ≥1024); `:62,:70` overlay backdrop + drawer `lg:hidden` with toggle in `MainColumn.tsx:48`. ServerRail + MainColumn always present; sidebar collapses to a drawer below `lg`.
- Both AC hard bounds hold: <1024 collapses to overlay; ≥1280 all three columns visible. See minor note below on the 1024–1280 band.

**AC6 — lint / typecheck / build exit 0. PASS** — CI jobs `lint`, `typecheck`, `build` all green in run `28240325274`.

**AC7 — Smoke suite passes (api ≥1, web ≥1). PASS** — CI log: api `health.controller.spec.ts` Tests 1 passed (1); web `AppShell.test.tsx` Tests 10 passed (10). Matches the prompt's "api 1/1, web 10/10". The api test parses the live response shape through the shared `HealthResponseSchema` (true contract test, not a mock).

**AC8 — CI green on PR to main across lint/typecheck/test/build/secret-scan. PASS** — `gh pr checks 1`: all 5 checks pass; PR #1 merged as `486d45b`.

---

## Contract conformance
- `packages/shared/src/health.ts` exports `HealthResponseSchema { status:'ok'|'degraded', service:string, version:string }` + inferred `HealthResponse`, consumed by both api (`health.controller.ts` return type) and web (`index.ts` re-export). Matches `contracts.types`.
- `'degraded'` enum member is present but only `'ok'` is exercised — intentional forward-compat per prompt (no failure path this wave). Not a defect.
- `contracts.data: none` / `contracts.sdk: none` — confirmed: no DB wiring, no SuperTokens/LiveKit/Resend/Sentry in the shell. Deferred siblings (`b9118041` auth backend, `9aae8255` auth/profile pages) correctly out of scope — not flagged.
- Edge case "API unreachable → shell still renders": SPA serves from static assets independently of the api host; ConnectionStateIndicator is prop-driven offline/reconnecting. Satisfied by architecture (separate Railway services).

---

## Minor observations (non-blocking — no REJECT, no rework required)

1. **`version` value — cosmetic, spec-satisfied (not drift).** Deployed `/health` returns `version:"0.1.0"` from the controller fallback (`health.controller.ts`: `process.env.npm_package_version ?? '0.1.0'`), while `apps/api/package.json` declares `"version":"0.0.1"` — `npm_package_version` is not set in the Railway runtime, so the literal fallback wins. The contract requires only `version:<string>` and the schema only `z.string()`; both are satisfied. Flag for a future wave: source the version from a single place so the reported value tracks `package.json`.

2. **Breakpoint band 1024–1280 — spec-gap, not drift.** Implementation reveals all three columns at `lg` (Tailwind default 1024px); the AC phrases the wide state as "≥1280px all three visible". Both AC hard conditions still hold (<1024 collapses; ≥1280 shows all three). The 1280-gated surface in DESIGN-SYSTEM §9 is the member-list 4th column, which is explicitly OUT of scope this wave — so three-column reveal at ≥1024 does not violate intent. Spec wording under-specifies the 1024–1280 band; no code change needed.

3. **CI Node 20 deprecation warnings (annotations only).** `actions/checkout@v4`, `setup-node@v4`, `pnpm/action-setup@v4`, `gitleaks-action@v2` forced onto Node 24. Non-blocking maintenance; surface at a later C-block tune.

---

## Drift vs gap summary
- **Spec drift (code/deploy wrong vs spec): none.**
- **Spec gaps (spec under-specified): #1 version source, #2 1024–1280 breakpoint band** — both cosmetic, neither breaks AC intent.

All 8 acceptance criteria meet the spec's INTENT against the live deployment. **APPROVE.**
