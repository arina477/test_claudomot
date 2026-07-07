# Wave 77 — B-1 Contracts
Extended `packages/shared/src/profile.ts` + index.ts (ESM named exports):
- ProfileResponseSchema + UpdateProfileSchema += optional bounded academic fields (pronouns 40 / bio 500 / institution 120 / program 120 / academicRole z.enum(['student','educator','staff']) / academicYear 40).
- NEW `PublicProfileSchema` + type `PublicProfile` — cross-server safe-field allowlist (userId/username/displayName/avatarUrl/accentColor/pronouns + academic fields); **email CONFIRMED ABSENT**.
- `ACADEMIC_ROLES` const + `AcademicRole` type. NO pgEnum; PROFILE_VISIBILITY not re-declared. Shared typecheck clean; Biome clean.
```yaml
skipped: false
contracts_authored: [packages/shared/src/profile.ts, packages/shared/src/index.ts]
deviations: []
```
Commit: f9ee379 (task: a51e281d)
