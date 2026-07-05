# T-3 — Contract (wave-49 study timer)

**Pattern:** A (verified-via-CI). Project-internal Zod/shared-type contracts (no external SDK this wave).

## Action 1 — Pattern decision
B-1 authored project-internal contracts in `packages/shared/src/study-timer.ts` (StudyTimerSchema + event payload types + event-name consts). No third-party SDK → Pattern A; CI `test` + `typecheck` jobs authoritative. No Pattern B probe needed.

## Action 2 — CI evidence + coverage
CI `test` + `typecheck` green on merge commit. Contract surface traced:
| Contract (B-1) | Exercised by |
|---|---|
| `StudyTimerSchema` {serverId, phase, runState, endsAt, remainingMs, running, updatedBy} | service `rowToDto` emits it (server side); widget consumes typed DTO (client side) — round-tripped in service spec + widget test |
| `STUDY_TIMER_UPDATE_EVENT` payload {serverId, timer} | gateway emit + widget subscription; typecheck enforces shape both sides |
| `STUDY_TIMER_PRESENCE_EVENT` payload {serverId, viewers[], count} | gateway presence emit + widget roster subscription |
| `STUDY_TIMER_JOIN_ERROR_EVENT` (added B-6 fix) | gateway join-failure emit; additive, typed |

**Boundary-drift check (the expensive class):** server emits and client consumes are both bound to the SAME shared Zod types (single source in packages/shared) — no hand-duplicated interface that could drift. tsc project-refs would fail the build on any field mismatch; it passed. Negative cases (invalid runState/phase) constrained by the Zod literal unions.

## Action 4 — Coverage audit
Every B-1 contract surface traced to a passing test/typecheck. New fields (endsAt nullable in paused/idle, remainingMs derived) covered by widget state tests. No contract gap.

```yaml
test_pattern: ci-verified
skipped: false
contracts_audited: [StudyTimerSchema, STUDY_TIMER_UPDATE_EVENT, STUDY_TIMER_PRESENCE_EVENT, STUDY_TIMER_JOIN_ERROR_EVENT]
ci_evidence:
  - "C-1 typecheck (tsc project refs) PASS on b2f2bec — enforces shared-type shape both sides"
  - "C-1 test job PASS — service emits + widget consumes round-tripped"
active_probe_results: []
infrastructure_gap_recorded: false
findings: []
```
