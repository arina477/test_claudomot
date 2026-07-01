# Wave 29 — T-block findings aggregate

Canonical V-2 input. Findings appended incrementally by each T-stage.

## Findings

_No findings. Every FIRED layer (T-1 static, T-2 unit, T-4 integration, T-9 journey) passed with adequate coverage; the 5 new displayName-guard tests are mutation-genuine (fail under the old `??`) and executed nonzero in CI. The dead-schema deletion has zero consumers. No regression, no coverage gap, no flake._

## Skipped-layer coverage notes (not findings)

- T-3 contract skipped: the only shared-schema change is a DELETION of unused code; no consumer-facing contract shape changed. No contract-test surface to cover.
- T-5/T-6 skipped: no user-visible/UI change. displayName resolution is a backend read-path fallback; no rendered surface differs beyond "no longer renders empty string" which is asserted at the unit boundary.
- T-8 skipped: no auth/authz/session/CSRF/rate-limit surface. displayName is a display string; the deleted schema was never wired to any endpoint.

## Carries (informational, NOT wave-29 regressions — pre-existing, tracked elsewhere)

- Playwright MCP chrome-channel-absent (task 67881a58, recurring) — not exercised this wave (no E2E fired); bundled-chromium substitute remains the standing workaround. No new impact.
- M5 reminders arc Resend-key-blocked — founder-pending, record-only, not a test finding.
