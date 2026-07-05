# T-2 — Unit (wave-49 study timer)

**Pattern:** A (verified-via-CI). Merge 3835100 / CI green b2f2bec.

## Action 1 — CI evidence
C-1 `test` job (Vitest, Postgres v16 service) ran green on merge commit — includes all unit suites.
- api unit: **638/638** pass (incl. `study-timer.service.spec.ts` — 27 study-timer service cases: compute-on-read, one-shot idempotent auto-advance, self-heal, pause-heal-overdue regression, membership gating).
- web: **397/397** pass (incl. `study-timer.test.tsx` widget states/countdown-derivation/controls/a11y + `studyTimerSocket.test.ts` namespace-assertion + reconnect re-join).

## Action 2 — Coverage audit
| New surface (B-2/B-3) | Unit coverage |
|---|---|
| `study-timer.service.ts` compute-on-read (`rowToDto`, remainingMs derivation) | ✓ service spec |
| one-shot `armAutoAdvance` + idempotent `doPhaseAdvance` (WHERE ends_at=$expected) | ✓ service spec |
| `selfHealIfOverdue` / `computeCurrentPhase` (work→break→work walk) | ✓ service spec |
| pause-heal overdue-running (C-1 High regression) | ✓ new test asserts remainingMs>0 |
| `assertMember` 403 gating | ✓ service spec |
| StudyTimerWidget states (idle/running-work/running-break/paused/loading/error) | ✓ widget test |
| countdown derives from endsAt (anti-drift) | ✓ widget test |
| studyTimerSocket `/study-timer` namespace + reconnect re-join | ✓ socket test (regression guard) |

New surface is well-covered; no untested pure-function gaps.

## Action 3 — Flake observation
C-1 documented + hardened 2 pre-existing web flakes (`study-timer.test.tsx` paused two-render race; `server-roles.test.tsx` React-19 passive-effect race — verified 27 consecutive clean runs). No new flakes introduced by the wave surface. `turbo pnpm -w test` combined-run startup crash remains a documented local flake (CI authoritative).

## Action 4 — Discipline note
- Mock-cast convention (`as unknown as MockFn`, `emitter as any`) confined to spec files — consistent with repo pattern.
- Compute-on-read testing pattern (assert derived value vs stored anchors) is canonical for time-based features — candidate T-2.md note.

```yaml
test_pattern: ci-verified
skipped: false
evidence:
  - "C-1 test job (Vitest + PG16 service): PASS on b2f2bec — 638 api unit + 397 web"
modules_audited: [study-timer.service, study-timer.controller, study-timer.gateway, StudyTimerWidget, studyTimerSocket]
new_flakes: []
findings: []
```
