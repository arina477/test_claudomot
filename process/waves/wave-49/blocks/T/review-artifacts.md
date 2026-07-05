# Wave 49 — T-block review artifacts

**Block:** T (Test)
**Wave topic:** M8 study-group tools slice 1 — shared study timer (schema + compute-on-read backend + Socket.IO fan-out + ephemeral presence + widget + phase auto-advance)
**Block exit gate:** T-9
**Status:** in-progress

## Stage deliverables

| Stage | Deliverable file | Pattern | Status | Notes |
|---|---|---|---|---|
| T-1 | stages/T-1-static.md | ci-verified | done | lint+typecheck green on 3835100; 0 prod bypasses |
| T-2 | stages/T-2-unit.md | ci-verified | done | 638 api unit + 397 web (incl. 27 service + 20 widget/socket) |
| T-3 | stages/T-3-contract.md | ci-verified | done | shared Zod contract + 2 socket event payloads |
| T-4 | stages/T-4-integration.md | ci-verified | done | real-PG study-timer.integration.spec.ts ran in CI |
| T-5 | stages/T-5-e2e.md | active | done | 2-client live sync PASS (~253ms), roster ephemeral PASS, compute-on-read PASS; 1 finding (F-1 slim-bar <1024) |
| T-6 | stages/T-6-layout.md | active | done | widget matches design at desktop; F-1 corroborated (inline border clobbers slim-bar) |
| T-7 | stages/T-7-perf.md | active | skipped | not heavy — modest diff, no perf-sensitive path |
| T-8 | stages/T-8-security.md | active | done | IDOR-safe (non-member 403 incl. real foreign running timer), WS session-validated, secret-grep clean; 1 finding (F-2 anti-csrf hardening, pre-existing) |
| T-9 | stages/T-9-journey.md | active | done | head-tester APPROVED + journey regen (162e0c9) |

## Block-specific context

- **Wave topic:** shared study timer (M8 slice 1) — LIVE at api-production-b93e / web-production-bce1a8, merge 3835100, migration 0022 applied.
- **wave_type:** ui + backend + sessions (multi-spec build; 4 claimed tasks).
- **Stages skipped (with reasons):** T-7 (not heavy — study-timer adds a 1s widget interval + one socket namespace; modest diff, no perf-sensitive hot path or bundle concern).
- **Cumulative findings count:** 0 at start.

## Carries into T-block (from P-4 / D-3)
- **P-4 jenny:** verify the presence roster stays NON-persisted (no DB rows) + the phase transition is a one-shot broadcast, NOT a disguised per-server loop. → T-5 / T-8.
- **D-3:** `.btn` transition, slim-bar phase indicator, paused aria-atomic, aria-live phase, prefers-reduced-motion, decorative header icons not controls. → T-6.
- **B-6 carry:** two-client `/study-timer` realtime round-trip deferred here (B unit/integration don't do a real socket namespace round-trip). → T-5.

## Findings aggregation

Findings written incrementally to `process/waves/wave-49/blocks/T/findings-aggregate.md`. Aggregate is the canonical V-2 input.

## Open escalations carried into gate

none

## Gate verdict log

head-tester T-9 attempt-1: **APPROVED**. Coverage honest; two-distinct-user realtime + roster-ephemerality + IDOR + non-loop transition all genuinely evidenced; 2 findings correctly non-blocking → V-2. No rework.

## Status — block exit
```yaml
test_block_status:    complete
stages_run:           [T-1, T-2, T-3, T-4, T-5, T-6, T-8, T-9]
stages_skipped:       [T-7 (not heavy — 1s widget interval + one socket namespace, no perf-sensitive path)]
findings_total:       2
findings_critical:    0
findings_aggregate:   process/waves/wave-49/blocks/T/findings-aggregate.md
journey_map_commit:   162e0c91f1283c92fb42ada6f2279ee75016f0fa
ready_for_verify:     true
gate_status:          gate-passed
```
