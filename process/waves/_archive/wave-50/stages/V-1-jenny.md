# V-1 jenny — Semantic-Spec Verification (wave-50)

**Wave:** wave-50 — M8 study-group slice 2 (per-server custom study-timer durations + F-1 slim-bar fix)
**Spec source (authoritative):** DB `tasks.description` for `f4b3659e-842b-450c-9869-750b64685d63` (2 spec blocks: f4b3659e + ffd98a36)
**Deployed target:** web `https://web-production-bce1a8.up.railway.app`, api `https://api-production-b93e.up.railway.app` — merge `6994776` (PR #64, on `main`), migration `0023_lush_iron_fist`
**Method:** live curl against deployed API (Fixture A + B), two-client Socket.IO fan-out against `/study-timer` namespace, deployed CSS-bundle inspection, deployed-commit source read (`git show 699477:…`).
**Fixtures used:** A `studyhall-e2e-fixture@example.com` + B `studyhall-e2e-fixture-b@example.com` (co-members of server `ad62cd12`). One throwaway signup for the auth-boundary probe. NO real users touched.
**Leave-state:** server `ad62cd12` left **idle @ 25/5** (workDurationMs=1500000, breakDurationMs=300000) as instructed.

---

## VERDICT: APPROVE

Both specs match deployed production behavior beyond the ACs, at the intent level. Zero spec-drift findings. One benign spec-gap note (rate limiter, non-blocking) and one methodology note on the 403 probe are recorded below; neither affects the verdict.

---

## Spec block 1 (f4b3659e) — per-server custom work/break durations

### Acceptance-criteria semantics — all PASS

| AC | Deployed evidence | Result |
|---|---|---|
| Member sets whole-minute work/break within ranges; persists on the single server row; used for subsequent phases | PATCH `/servers/ad62cd12/study-timer/config` `{workMinutes:30,breakMinutes:10}` → 200 DTO `workDurationMs:1800000, breakDurationMs:600000`; re-GET reflected same | PASS |
| Work 1-120, break 1-60; out-of-range/non-integer/missing → 400, stored unchanged | 0→400 "greater than or equal to 1"; 121→400 "less than or equal to 120"; 5.5→400 "Expected integer, received float"; break 61→400; break 0→400; missing→400 "Required"; null→400 "Expected number, received null". Re-GET after a 400 = still 1800000/600000 (unchanged) | PASS |
| Configurable ONLY while idle; running/paused → 409 + reset hint, unchanged | Start (running) → config → **409** `{"message":"Reset the timer to change durations","error":"Conflict","statusCode":409}`. Pause → config → **409** same. Durations unchanged (1800000/600000) after both 409s. Idle → config → 200 | PASS (both running AND paused 409, exceeds AC which only names "running or paused") |
| Next Start uses new durations | After config 30/10, Start → DTO `remainingMs:1799998`, `endsAt` ≈ now+30min, `workDurationMs:1800000` — first Work phase uses the new 30-min work anchor | PASS |
| Every other member viewing sees new durations live, no reload (fan-out over study-timer:update to server room) | Two-client Socket.IO test: B joined `/study-timer` room for ad62cd12; A PATCH 35/8 → **B received `study-timer:update`** with `timer.workDurationMs:2100000, breakDurationMs:480000` live, no reload. Extended DTO carried in the broadcast payload | PASS |
| Members only: anon 401, non-member 403; serverId from route, userId from session (IDOR-safe) | Anon GET → 401; anon PATCH → 401. Co-member B GET → 200. Source `configureDurations` calls `assertMember` (throws `ForbiddenException`/403) **before** the idle-check, and derives userId from `req.session.getUserId()`, serverId from route param — IDOR-safe, matches control-route pattern | PASS (see methodology note on live 403) |
| Widget surfaces current work/break + change affordance; disabled/blocked-with-hint while running/paused | Widget source `StudyTimerWidget.tsx`: desktop inline duration form + slim reveal row (`DurationConfigForm`, `slimConfigOpen`), 409/400 error surfaces in both desktop and slim regions (lines 60, 601). Affordance present; reset-hint surfaced from the 409 body | PASS (UI structural; live DOM not screenshotted — API-level 409/400 semantics confirmed live) |

### Edge cases (spec-enumerated) — all PASS
- `workMinutes 0 / 121 / 5.5 / null` → 400, unchanged ✔
- `breakMinutes 0 / 61 / null` → 400, unchanged ✔
- config while running / paused → 409 reset hint, unchanged ✔
- config while idle → 200, persists, next Start uses new durations, broadcast fan-out ✔
- concurrent writes last-write-wins on UNIQUE(server_id): `configureDurations` uses `insert … onConflictDoUpdate(target: server_id)` — single-row upsert, no partial state ✔ (verified in source, not raced live)
- non-member 403 / anon 401 no state leak ✔
- durations unchanged from default → wave-49 25/5 behavior: default GET returned 1500000/300000, migration 0023 backfills `DEFAULT 1500000 / 300000 NOT NULL` ✔ (backward-compat)

### Contract conformance — PASS
- **GET DTO** now includes `workDurationMs` + `breakDurationMs` (live GET confirmed both fields present). Shared `StudyTimerSchema` extended with `workDurationMs: z.number().int().positive()` + `breakDurationMs: z.number().int().positive()` (study-timer.ts:41-42).
- **PATCH /config response** = updated StudyTimer DTO (live 200 body = full DTO with new durations).
- **Request body schema** `StudyTimerConfigSchema { workMinutes: int 1-120, breakMinutes: int 1-60 }` (study-timer.ts:113-116) — validated via `safeParse`, 400 with `error.flatten()` on failure. Live 400 bodies show `fieldErrors` per-field messages.
- **Error envelopes:** 400 = Zod flatten `{formErrors, fieldErrors}`; 409 = Nest `{message, error:"Conflict", statusCode:409}`; 401/403 = auth-guard envelopes. All observed live match.
- **Migration 0023** additive: `ADD COLUMN work_duration_ms integer DEFAULT 1500000 NOT NULL` + `break_duration_ms DEFAULT 300000 NOT NULL` — backfills existing rows to classic 25/5. Anchors-only model preserved.

### User-journey continuity — PASS
Config affordance extends the wave-49 widget (same surface, no dead-end); default (unconfigured) behavior is byte-identical to wave-49 (25/5). No regression to the existing start/pause/resume/reset control flow (all still return 200 live).

---

## Spec block 2 (ffd98a36) — F-1 slim-bar phase indicator fix (<1024px)

### Acceptance-criteria — all PASS (verified LIVE in deployed CSS bundle + deployed source)
- **<1024px 2px phase left-border:** deployed CSS `/assets/index-B8BAzU7P.css` contains `.timer-phase-work{border-left:2px solid #10b981}` (emerald Work) and `.timer-phase-break{border-left:2px solid #f59e0b}` (amber Break). Matches `design/study-timer.html` token set. ✔
- **Desktop (≥1024px) unchanged:** deployed CSS `@media(min-width:1024px){.timer-phase-work,.timer-phase-break{border-left:none}}` — phase border removed on desktop, no regression. ✔
- **Idle renders neutral border, not a phase color:** widget `phaseClass = !isIdle ? (isWork ? 'timer-phase-work' : 'timer-phase-break') : ''` (StudyTimerWidget.tsx:858) — idle applies neither class → container's default 1px neutral border shows. ✔
- **Border tracks phase changes live:** `phaseClass` is derived from live timer state each render; class toggles emerald↔amber on phase change. ✔

### Root-cause fix — matches spec's intended remediation exactly
Spec root cause: inline `border` shorthand at `StudyTimerWidget.tsx:476` outranked the stylesheet `.timer-phase-*` `border-left` via specificity. Deployed fix (StudyTimerWidget.tsx:866-872): the container inline style is decomposed into `borderTop`/`borderRight`/`borderBottom` only — `borderLeft` deliberately **not** set inline, letting the CSS class win. This is precisely the "individual border sides / stop the inline shorthand from setting border-left" fix the spec prescribed. No logic change. `prefers-reduced-motion` and other timer states untouched (CSS is border-only).

---

## Findings ledger

**Drift (code wrong vs spec): NONE.**

**Gap / notes (spec silent or environmental — NOT drift, NOT blocking):**

1. **[GAP-1 / info — rate limiter]** The PATCH `/config` mutation route sits behind a throttler (observed `429 "ThrottlerException: Too Many Requests"` after several rapid config calls; cleared after ~60s). The spec is silent on rate-limiting. This is a sensible platform default (mirrors other mutation routes) and does not contradict any AC — the 409/400/200 semantics all verify correctly once the throttle window clears. No action needed; recorded for T-block/perf awareness.

2. **[NOTE — 403 probe methodology]** A genuine live 403 from the **membership** gate could not be produced with a verified non-member (only A + B are known verified users, both co-members of ad62cd12). The throwaway signup returned 403 but from the **email-verification** claim guard (`st-ev`), which fires before `assertMember`. The membership-gate 403 is therefore confirmed by **source** (`assertMember` throws `ForbiddenException` → 403, ordered before the idle-check) rather than by a live verified-non-member request. Anon 401 was confirmed live. This is a test-coverage limitation, not a defect — the guard exists and is correctly ordered.

**Intended-choice confirmations (explicitly NOT drift, per spec P-0 scope-fence):**
- Idle-only 409 semantic (no mid-run duration change) — intended, verified. ✔
- Per-server (UNIQUE server_id), NOT per-user — intended, verified (single shared row). ✔
- No presets / no history / no long-break-every-N / no per-user prefs / no heavy settings UI — scope-fenced future slices; correctly absent. ✔

---

## Summary
- **Spec 1 (per-server durations):** all 7 ACs, all 7 edge-cases, full contract (DTO/schema/error envelopes/migration), journey continuity — PASS against deployed prod.
- **Spec 2 (F-1 fix):** all 3 ACs + root-cause remediation — PASS, verified LIVE in the shipped CSS bundle.
- **Drift:** none. **Blocking gaps:** none. Two non-blocking notes recorded.

**VERDICT: APPROVE**
