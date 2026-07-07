# Wave 77 — T-3 Contract

Pattern: **active** (live probes against prod api-production-b93e, merge commit 633f362e). Project-internal Zod contracts (no external SDK). CI also validated shapes in the test job; T-3 confirms LIVE.

## Contracts audited (from B-1 a51e281d)
- `UpdateProfileSchema` += optional bounded academic fields (pronouns 40 / bio 500 / institution 120 / program 120 / academicRole z.enum(student|educator|staff) / academicYear 40).
- `PublicProfileSchema` (NEW) — cross-server safe allowlist; email CONFIRMED ABSENT.

## Live probes (as Fixture A, bearer session)
1. **GET /profile (self)** → 200; body carries all 6 academic fields (+ userId/username/displayName/avatarUrl/accentColor). No email, no profile_visibility exposed. PASS.
2. **PATCH /profile academic fields** → 200; body = full ProfileResponse with persisted values. **GET /profile after PATCH reflects the change (round-trip). PASS.**
3. **PATCH /profile invalid enum** (`academicRole:"professor"`) → **400** with fieldError "Expected 'student' | 'educator' | 'staff', received 'professor'". Negative case PASS.
4. **GET /profile/:userId (visible target)** → 200 PublicProfile shape: `{userId, username, displayName, avatarUrl, accentColor, pronouns, bio, institution, program, academicRole, academicYear}` — **email ABSENT, profile_visibility ABSENT.** PASS.

## Coverage trace
Every B-1 contract surface traced to a live probe. New fields covered specifically (not just contract overall). Negative case (invalid enum) covered.

```yaml
test_pattern: active
skipped: false
contracts_audited: [UpdateProfileSchema academic fields, PublicProfileSchema, ProfileResponseSchema]
active_probe_results:
  - "GET /profile self → 200, 6 academic fields present, no email"
  - "PATCH /profile → 200, round-trip confirmed via subsequent GET"
  - "PATCH /profile invalid academicRole → 400 field error"
  - "GET /profile/:userId visible → 200 PublicProfile, email ABSENT"
infrastructure_gap_recorded: false
findings: []
```
