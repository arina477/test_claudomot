# Wave 73 — T-block findings aggregate

(no findings yet)

## T-8 Security (live prod) — ALL PASS
- no-IDOR: Fixture A + B each see ONLY their own privacy_events; `?userId` ignored (session identity wins); no path-param route. The critical AC holds.
- PII discipline: privacy_settings_changed context = {visibilityFrom/To, whoCanDmFrom/To} enum values ONLY — no email/display_name/token.
- best-effort non-blocking: PUT /profile/privacy 200 in ~152ms (hook adds no latency/failure). Endpoint 401 unauth (guarded).
- secret grep: 0 real credentials (LIVEKIT test-fixture string is test-only).
- NOTE (not a finding): block/unblock live probe N/A — the tester guessed the wrong block route path; the block/unblock hooks are CI-integration-verified (privacy-events.spec asserts user_blocked/user_unblocked rows).

## T-5 E2E / T-6 Layout (live prod) — ALL PASS
- Panel renders on /settings/privacy; **the hook→endpoint→panel path works LIVE** (a "You changed your privacy settings (visibility X → Y)" row appeared after a real settings change); plain-language labels; skeleton (not spinner); clean layout 1440/1024, no regression/token-violation.
- **[LOW/monitoring] SPA cold-nav hydration race:** on first cold direct navigation to /settings/privacy the panel briefly didn't render + the GET hadn't fired (other panels rendered first); resolved on next navigation; endpoint healthy throughout. Not a feature defect → V-2 (monitoring/low).
