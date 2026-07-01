# Wave 29 — T-5 E2E (SKIPPED)

**Skip reason:** No user-visible UI behavior change. The wave is a backend read-path fallback fix (displayName resolves to userId instead of `''` for empty email local-part / stored-empty display_name) + a dead-schema deletion. No route/screen/component/interaction changed; no new rendered surface. C-2 deploy-verified both services live (api + web serving merge commit fd03d27; api /health → 200). The one behavior delta (never render an empty display name) is asserted deterministically at the unit boundary (T-2, mutation-genuine) — it is not a new user flow requiring browser E2E, and there is no persistent-fixture browser path that would observe it more strongly than the unit test.

```yaml
test_pattern: n/a
skipped: true
skip_reason: "No user-visible UI behavior change (backend resolution + dead-schema delete). C-2 verified api+web live on fd03d27."
findings: []
```
