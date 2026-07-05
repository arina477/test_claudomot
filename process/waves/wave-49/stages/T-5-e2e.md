# T-5 — E2E (wave-49 study timer)

**Pattern:** B (active-execution) against LIVE prod (web-production-bce1a8, api-production-b93e). 2 `ui-comprehensive-tester` instances, partitioned scenarios. Fixtures A + B on shared server `ad62cd12`.

## Scenario verdicts

| # | Criterion | Tester | Verdict (2 runs) | Evidence |
|---|---|---|---|---|
| S1 | Shared timer syncs live across members (Start on A → B sees running countdown, no reload) | 1 | **PASS** | ~253ms fan-out over `/study-timer` WS; 2 distinct userIds in `viewers[]` |
| S2 | Both clients' countdown agree (authoritative endsAt) | 1 | **PASS** | 0s diff |
| S3 | Pause/Reset propagate live | 1 | **PASS** | running→paused→idle observed on both, ~255ms |
| S4 | Ephemeral "N studying" roster 2→1→2 (join/leave on mount/unmount) | 1 | **PASS** | `study-timer:presence` count tracks live viewers |
| S5 | Roster live-only/non-persisted; timer resurrects from server (compute-on-read) | 1 | **PASS** | reload → roster = live viewers, timer continues at right remaining |
| S6 | State matrix idle/running-work/paused/resumed/idle | 2 | **PASS** | testid-verified per state |
| S7 | Compute-on-read reload persistence (anti-drift) | 2 | **PASS** | drift 0s / −1s vs endsAt-derived |
| S8 | a11y: aria-live phase, aria-atomic paused, button controls, reduced-motion | 2 | **PASS** | attributes confirmed; colon-blink suppressed under reduced-motion |
| S9 | narrow-viewport (<1024) slim-bar phase indicator | 2 | **FAIL (BUG-1)** | inline `border` shorthand clobbers `.timer-phase-work` border-left |
| S10 | loading skeleton + graceful error/retry | 2 | **PASS** | skeleton→widget; induced-offline → error state + Retry recovers |

## Must-verify outcomes (P-4 jenny + B-6 carries)
- **Real-time cross-client sync (B-6 namespace fix) — VERIFIED LIVE in prod** with 2 distinct authenticated users. Socket frames captured: `join_timer_room` → `study-timer:update {phase,runState,endsAt}` → `study-timer:presence {viewers[],count}`.
- **Roster is ephemeral / non-persisted (P-4 jenny carry) — VERIFIED.** Presence is live-broadcast only; timer state persists (server-anchored endsAt), roster does not.
- **Phase transition is not a disguised loop (P-4 jenny carry)** — no per-server tick observed; transition covered by T-2 unit (one-shot idempotent) + T-4 integration. (Wall-clock 25/5-min auto-advance not observable in E2E — fixed durations; out of T-5 scope by design.)

## Findings (→ V-2)
- **BUG-1 (finding, tester severity MAJOR / AC-severity non-blocking):** `<1024px` slim-bar phase indicator never renders. Root cause: `StudyTimerWidget.tsx:476` inline `border: '1px solid rgba(255,255,255,0.06)'` shorthand outranks stylesheet `.timer-phase-work { border-left: 2px solid #10b981 }` (`globals.css:310-315`). Break/amber branch presumed same. Deterministic (computed border-left = 1px grey at 800px despite phase class present). One-line CSS fix (drop border-left from the inline shorthand, or set individual border-top/right/bottom). Core timer fully functional; this is a narrow-viewport visual affordance only. Routed to V-2 for triage (candidate V-3 fast-fix). Iron Law: NOT fixed at T-5.

## Non-findings
- `401 /auth/session/refresh` cold-load — benign SuperTokens refresh probe.
- `429` rate-limits — test artifact from aggressive concurrent automated loops on one fixture; not reproducible at normal pacing; no feature-side root cause.

```yaml
test_pattern: active
skipped: false
testers_spawned: 2
scenarios:
  - {id: S1, criterion_ref: shared-realtime-sync, verdict: PASS, evidence_path: stages/T-5-tester-1.md}
  - {id: S4, criterion_ref: ephemeral-presence-roster, verdict: PASS, evidence_path: stages/T-5-tester-1.md}
  - {id: S5, criterion_ref: roster-nonpersist+compute-on-read, verdict: PASS, evidence_path: stages/T-5-tester-1.md}
  - {id: S6, criterion_ref: control-state-matrix, verdict: PASS, evidence_path: stages/T-5-tester-2.md}
  - {id: S7, criterion_ref: compute-on-read-persistence, verdict: PASS, evidence_path: stages/T-5-tester-2.md}
  - {id: S8, criterion_ref: a11y-carries, verdict: PASS, evidence_path: stages/T-5-tester-2.md}
  - {id: S9, criterion_ref: narrow-viewport-slimbar, verdict: FAIL, evidence_path: stages/T-5-tester-2.md}
  - {id: S10, criterion_ref: loading-error, verdict: PASS, evidence_path: stages/T-5-tester-2.md}
flakes_observed: []
fix_up_cycles: 0   # BUG-1 is non-blocking → surfaced to V-2, not a T-5 fix-up (core ACs all PASS)
findings:
  - {severity: medium, scenario: S9, description: "slim-bar phase indicator not rendered <1024px — inline border shorthand clobbers stylesheet border-left; one-line CSS fix; candidate V-3 fast-fix"}
```
