# T-2 — Unit (wave-80, presence privacy toggle)

**Pattern:** A — Verified-via-CI.

## Action 1 — CI evidence
C-1 `test` job (postgres:16 + pg-harness) pass (1m55s), CI run 28917150735 (required). B-2 reports 814 api unit tests pass (78 in touched modules); B-3 reports web 733/733; shared privacy.spec covers the schema. All executed nonzero in the DB-backed CI suite.

## Action 2 — Coverage audit (modules touched)
- `presence.service.ts` (+getShowPresence, +getShowPresenceBatch): presence.service.spec covers batch co-member lookup + absent→true default.
- `presence.gateway.ts` (3 emit gates + proactive onShowPresenceChanged): presence.gateway.spec covers the gates + proactive emit via Server-double.
- `privacy.service.ts` (partial merge + audit + proactive-emit trigger): privacy.service.spec covers 3-field partial, showPresence-in-payload gating, no-op audit gate.
- `privacy.controller.ts` (400 on bad showPresence): privacy.controller.spec covers boolean 400 + partial bodies.
- `packages/shared/src/privacy.ts`: privacy.spec covers partial schema + boolean field.
- `SettingsPrivacyPage.tsx`: 7/7 incl. enabled-switch, server-default hydrate, partial PUT + preserved siblings, GET round-trip, failure-revert.

## Action 3 — Flake observation
C-1 note: no flake re-run needed (study-timer.test.tsx did not trip). No new flakes.

## Action 4 — Discipline note
Two-subject integration double (real gateway/service/PG + faithful room-routing Server double) is the canonical pattern for realtime honor — avoids single-client coverage theater. Candidate for T-4 principles.

```yaml
test_pattern: ci-verified
skipped: false
evidence:
  - "C-1 test job (postgres:16): CI run 28917150735 green, ~814 api + 733 web + shared"
modules_audited: [presence.service.ts, presence.gateway.ts, privacy.service.ts, privacy.controller.ts, packages/shared/src/privacy.ts, SettingsPrivacyPage.tsx]
new_flakes: []
findings: []
```
