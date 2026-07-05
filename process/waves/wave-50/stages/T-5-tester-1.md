# T-5 E2E — Study-Timer Per-Server Custom Durations (two-client sync + config-while-running guard)

**Wave:** 50 · **Layer:** T-5 E2E · **Tester:** tester-1
**Target (LIVE prod):** web `https://web-production-bce1a8.up.railway.app` · api `https://api-production-b93e.up.railway.app`
**Server:** Fixture Proof Server `ad62cd12-b78e-4a85-a214-042cf176b16c`
**Clients:** A = `studyhall-e2e-fixture@example.com` (studyhallfixturea) · B = `studyhall-e2e-fixture-b@example.com` (studyhallfixtureb) — genuine two distinct verified co-members.
**Harness:** installed `playwright` node package driven directly (one Chromium, TWO isolated `browserContext`s = two independent cookie jars). MCP `browser_close` never called. Each scenario run ≥2×.
**Evidence dir:** `/home/claudomat/shots/` (screenshots) · WS frames captured live via CDP `Network.webSocketFrame*`.

---

## VERDICT SUMMARY

| Scenario | Run 1 | Run 2 | Result |
|---|---|---|---|
| **S1** Two-client durations sync (crux) | PASS | PASS | **PASS** |
| **S2** New durations take effect on Start | PASS | PASS | **PASS** |
| **S3** Config blocked while running + desktop-visible hint | PASS | PASS | **PASS** |
| **S4** Validation out-of-range | PASS | PASS | **PASS** |
| **S5** Restore to 25/5 idle | — | — | **DONE (clean)** |

**Headline answers:**
- **Does two-client custom-durations sync work live (S1)? — YES.** A applies 45/10 (and 38/12), B's widget reflects the exact configured minutes live WITHOUT reload. Proven by DOM state + captured `study-timer:update` socket frame carrying `workDurationMs`/`breakDurationMs`.
- **Do new durations take effect on Start (S2)? — YES.** After a 45/10 (and 50/10) config, Start begins the countdown from ~45:00 / ~50:00 — NOT 25:00 — on BOTH A and B.
- **Is config correctly blocked while running with a desktop-visible hint (S3)? — YES.** While running, the config inputs are disabled and the Apply button is replaced by a visible italic hint "Reset timer to change lengths" (`-lock-hint`, 157×15px, NOT sr-only) on the ≥1024px desktop viewport. A server-side 409 guard backs this (confirmed in source).
- **Console errors / 5xx:** No 5xx on either client. Only benign 401 on the initial pre-login resource probe (before auth). No app-level console errors during any scenario.

---

## S1 — Two-client durations sync (the crux) — PASS (2/2)

Method: baseline reset to 25/5 idle; on **A** set Work + Break to a distinctive value via the config inputs (`$-work-input` / `$-break-input`) and click Apply (`$-apply`); poll **B** for up to 8s WITHOUT reloading.

| Run | A applies | B observed (no reload) | B display | Synced |
|---|---|---|---|---|
| 1 | Work 45 / Break 10 | work=45 brk=10 | 45:00 | YES |
| 2 | Work 38 / Break 12 | work=38 brk=12 | 38:00 | YES |

**Socket-frame proof (captured on BOTH A and B):**
```
42/study-timer,["study-timer:update",{"serverId":"ad62cd12-…","timer":{
  …,"runState":"idle","workDurationMs":2700000,"breakDurationMs":600000,
  "updatedBy":"21984eb2-…"}}]      ← run1: 2700000ms=45min / 600000ms=10min
…"workDurationMs":2280000,"breakDurationMs":720000…                ← run2: 38min / 12min
```
The config broadcast (`study-timer:update`) reaches the other member — B's `workDurationMs`/`breakDurationMs` update to A's values with matching `updatedBy` = A's userId.

Evidence: `s1-run1-A.png`, `s1-run1-B.png` (B shows 45:00, WORK=45 BREAK=10, "2 studying / Live sync"), `s1-run2-A.png`, `s1-run2-B.png`.

---

## S2 — New durations take effect on Start — PASS (2/2)

Method: apply custom config, then **A** clicks Start; assert running countdown begins from ~custom-work-length on both A and B.

| Run | Configured Work | A display after Start | B display after Start | ≠ 25:00 |
|---|---|---|---|---|
| 1 | 45 min | 44:57 (FOCUS) | 44:57 (FOCUS) | YES |
| 2 | 50 min | 49:57 (FOCUS) | 49:57 (FOCUS) | YES |

Countdown starts from the custom work length (44:57 ≈ 45:00 minus ~3s of ticks), never the 25:00 default, and is identical on B who did not press Start (A started it — proves running-state fan-out uses the configured length). Phase label shows FOCUS. Reset returned to configured idle (45:00 / 50:00) each run.

Evidence: `s2-run1-A.png`, `s2-run1-B.png` (B at 44:57 FOCUS), `s2-run2-A.png`, `s2-run2-B.png`.

---

## S3 — Config blocked while running (+ desktop-visible hint) — PASS (2/2)

Method: apply 45/10, Start the timer, then on **A** attempt to change a duration + Apply on desktop viewport (1440×900).

Observed while running (both runs + a dedicated focused re-check):
- **Work input disabled = true, Break input disabled = true** — inputs locked.
- **Apply button removed** (count = 0 while locked) → the client optimistically prevents any PATCH from firing, so no request reaches the server to be 409'd.
- **Visible desktop hint present:** `[data-testid$="-lock-hint"]` — `exists=true, text="Reset timer to change lengths", visible=true, rect 157×15px, class has no sr-only`. Confirmed VISIBLE on the ≥1024px desktop layout (not hidden).
- Attempting to type into the disabled input times out (input rejects input — expected).
- After Reset, timer returns to idle and config becomes editable again.

**Server-side backstop (defense-in-depth, source-confirmed):** `apps/api/src/study-timer/study-timer.service.ts:731-732` — `if (existing && existing.run_state !== 'idle') throw new ConflictException('Reset the timer to change durations')`; controller documents `PATCH /servers/:serverId/study-timer/config` as idle-only returning 409. The UI also renders a separate `-config-error-409` hint ("Reset the timer first to change durations.") if a PATCH ever returns 409; in practice the client-side input-lock means the PATCH isn't sent, so the primary user-visible guard is the `-lock-hint`. Both layers exist.

Note: the main-suite auto-scan used a slightly different text pattern and reported `hintScan=null`; the focused re-check (`s3-hint.mjs`) and screenshots confirm the hint is genuinely rendered and visible. This is a test-scan wording gap, NOT a product defect.

Evidence: `s3-run1-A.png`, `s3-run2-A.png` (A running at 43:55 FOCUS, WORK 045 / BREAK 010 dimmed, italic "Reset timer to change lengths" where Apply was), `s3-hint-desktop.png`, `s3-widget-locked.png`. Also visible on **B** in `s2-run1-B.png` (B mirrors the locked config + hint during A's session).

---

## S4 — Validation out-of-range — PASS (2/2)

Method: **A** idle, enter an out-of-range Work value, attempt Apply.

| Run | Work entered | Inline error | Apply | B contaminated? |
|---|---|---|---|---|
| 1 | 200 | "Must be 1-120" (red, aria-invalid) | disabled | No (B.work stayed 25) |
| 2 | 150 | "Must be 1-120" | disabled | No (B.work stayed 25) |

Out-of-range value produces an inline validation error, the Apply button stays disabled (nothing destructive committed), and the bad value never propagates to B. Work input bounds are `min=1 max=120`; Break input `min=1 max=60`.

Evidence: `s4-run1-A.png` (WORK 0200 red-bordered, "Must be 1-120" badge, Apply dimmed, display still 25:00), `s4-run2-A.png`.

---

## S5 — Restore — DONE

Server left at **Work 25 / Break 5, timer idle, display 25:00** on both A and B. Clean for subsequent testers.
```
A final: work=25 brk=5 display=25:00 startText=Start
B final: work=25 brk=5 display=25:00
```

---

## Errors / diagnostics

- **5xx:** none (A: [], B: []).
- **409s intercepted at HTTP layer:** none — expected, because the client removes the Apply button while running so no config PATCH is issued (client-side guard fires first). The 409 server guard is verified in source as a backstop.
- **Console errors:** only `Failed to load resource: 401` on the initial page load before authentication (pre-login probe). No errors during scenario execution. No React/runtime errors.
- **WS frames:** 48 captured across both clients — `40/study-timer` connect, `join_timer_room`, repeated `study-timer:update` (with `workDurationMs`/`breakDurationMs`), and `study-timer:presence` (roster with `count`/`viewers`). Confirms the realtime channel is the transport for both config and run-state sync.
- **Presence:** roster consistently showed "2 studying / Live sync" with both fixtures ONLINE — genuine two-member co-presence, not multi-tab.

## FLAKE / stability

No flakes. Each scenario passed both runs deterministically. Sync latency for S1 was well under the 8s poll budget (frames arrived within ~100ms of Apply). No retries were needed to obtain green.

## Iron-Law note

No FAILs → no triage needed. No production code was modified by this tester. The only test-side observation (main-suite hint-scan wording mismatch) is a harness note, not a product bug; the feature's desktop-visible hint is confirmed present by the focused check and screenshots.
