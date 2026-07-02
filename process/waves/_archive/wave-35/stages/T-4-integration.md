# Wave 35 — T-4 Integration (Pattern A — ci-verified)
Schema + service integration: migration 0014 (users +profile_visibility +who_can_dm) applied to prod at C-2 (47/47 backfilled 'everyone'); CI test job ran against a Postgres service container (green). Roster-enforcement integration (listServerMembers filter) + privacy service DB round-trip have **no dedicated integration test**; behavior verified by code-read (B-6) + live reproduction (T-8). Migration is additive/defaulted → no data-integrity risk. Finding (coverage-gap) recorded.
```yaml
mask_mode_signoff: PASS
test_pattern: ci-verified
evidence: ["migration 0014 applied prod (C-2), 47 rows backfilled", "CI test job green vs Postgres container"]
findings: [{severity: MEDIUM, location: "roster filter + privacy service DB round-trip", description: "no automated integration test; live-verified at T-8"}]
