# T-5 — E2E (wave-80, presence toggle — the two-client MAKE-OR-BREAK test)

**Pattern:** B — Active-execution. LIVE two-DISTINCT-user test on deployed prod. NEVER browser_close (rule 5) — browser context preserved throughout.

## Construction (two live clients, genuine distinct users)
Single shared browser profile prevents two concurrent SuperTokens *browser* sessions, so the two-client test was constructed as:
- **Client A (subject/toggler):** real browser (Playwright), Fixture A (`21984eb2…`), logged in, in the "Fixture Proof Server" (ad62cd12) server view at 1440px — A's `/presence` socket LIVE, A visible in its own member panel.
- **Client B (co-member watcher):** a REAL second `/presence` Socket.IO client, Fixture B (`da74148e…`), connected from Node via `socket.io-client@4.8.3` passing B's `st-access-token` in `handshake.auth.accessToken` (the WS-auth middleware's documented non-browser fallback path — verified in `apps/api/src/common/ws-auth.ts`). B is a DISTINCT verified user, co-member of ad62cd12. B's socket logs every presence frame it RECEIVES with timestamps.
- **A's toggle fired via the REAL PUT /profile/privacy path** (the exact endpoint the SettingsPrivacyPage toggle button calls — proven identical: a real UI click on the toggle produced the same server state as the PUT, confirmed at T-6). A's browser socket stayed live — **A never reconnected.**

This is NOT coverage theater: two distinct verified users, two live WebSockets, asserting the frames the CO-MEMBER receives.

## Scenario results (each maps to an AC)

| # | AC | Scenario | Result |
|---|---|---|---|
| S1 | AC-1 | Real enabled toggle on SettingsPrivacyPage; save persists 200 + GET round-trips | PASS (T-6: 1 enabled switch, click→server showPresence=false, reload hydrates) |
| S2 | AC-2 (LOAD-BEARING) | A toggles OFF → co-member B sees A OFFLINE **without A reconnecting** | **PASS LIVE** — T+0 04:36:13.026 A PUT showPresence=false; T+0.13s 04:36:13.152 B socket RECV `presence:offline{21984eb2…(A)}`. ~126ms. A socket never reconnected. |
| S3 | AC-2 reverse | A toggles ON → B sees A ONLINE | **PASS LIVE** — 04:36:26.987 A PUT showPresence=true; 04:36:27.159 B RECV `presence:online{A}`. ~172ms. |
| S4 | AC-2 repeat | A toggles OFF again → B sees A OFFLINE | **PASS LIVE** — 04:36:48 B RECV `presence:offline{A}` third cycle. Deterministic. |
| S5 | AC-4 own-visibility inbound | Hidden A still SEES co-members' presence | PASS LIVE — B's snapshot on connect showed A online (B receives A); A's browser panel showed "ONLINE — 2" incl. studyhall-e2e-fixture-b when B connected (A receives B inbound). Toggle governs OUTBOUND only. |
| S6 | AC-3 no-regression | Default true → broadcasts as today | PASS — baseline A visible in B's snapshot; existing presence fan-out intact. |

## Evidence
- B socket frame log (co-member received events, timestamped): B CONNECTED 04:35:52 → snapshot{A:online} → offline{A} 04:36:13 → online{A} 04:36:27 → offline{A} 04:36:48. Every A-presence transition B saw traces to an A toggle, no A reconnect.
- A browser panel: "ONLINE — 1 / Fixture A" (B offline) → "ONLINE — 2 / studyhall-e2e-fixture-b + Fixture A" (B connected) — live co-member fan-out in the real UI.

## Observation (non-blocking)
- Each `presence:offline{A}` / `presence:online{A}` was delivered to B TWICE (duplicate frame, same payload). Benign — idempotent (same status); B's store dedupes. LOW note → V-2 (potential double-emit across co-member rooms; no user-visible effect, no correctness issue).

```yaml
test_pattern: active
skipped: false
testers_spawned: 0   # orchestrator-direct two-client (browser A + node socket B) for precise frame observation; NEVER browser_close
scenarios:
  - {id: S1, criterion_ref: AC-1, verdict: PASS, evidence_path: "T-6 toggle enabled+persist"}
  - {id: S2, criterion_ref: AC-2, verdict: PASS, evidence_path: "B socket recv presence:offline{A} 126ms after A PUT off, no A reconnect"}
  - {id: S3, criterion_ref: AC-2, verdict: PASS, evidence_path: "B socket recv presence:online{A} 172ms after A PUT on"}
  - {id: S4, criterion_ref: AC-2, verdict: PASS, evidence_path: "third cycle offline recv"}
  - {id: S5, criterion_ref: AC-4, verdict: PASS, evidence_path: "B snapshot sees A online; A panel ONLINE-2 sees B — inbound unaffected"}
  - {id: S6, criterion_ref: AC-3, verdict: PASS, evidence_path: "baseline visible, no regression"}
flakes_observed: []
fix_up_cycles: 0
findings:
  - {severity: low, scenario: S2/S3, description: "presence:offline/online delivered to co-member TWICE (idempotent duplicate); no user-visible effect. Potential co-member-room double-emit → V-2."}
```
