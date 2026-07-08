# Wave 78 — B-2 Backend

backend-developer implemented the service write-path (task 4be3b084).
- `apps/api/src/users/users.service.ts`: param `academicRole?: AcademicRole | undefined` → `AcademicRole | null | undefined`; patch column type `academic_role: string` → `string | null`. Gate `if (fields.academicRole !== undefined) { patch.academic_role = fields.academicRole; }` UNCHANGED — now yields the three-way: undefined→filtered (leave); null→SQL NULL (drizzle emits NULL on nullable text col); enum string→string.
- `profile.controller.ts` forwards `parsed.data` as-is (L61), no hand-narrowing that drops null → untouched (correct). READ path / visibility resolver untouched.
- New integration spec `apps/api/test/integration/profile-academic-role-clear.integration.spec.ts` (real pg-harness, through the service): (1) set 'educator' then null → academic_role NULL; (2) set 'educator' then update displayName only (academicRole absent) → stays 'educator'; (3) set 'staff' → 'staff'; (4) clear-from-null idempotent → NULL. Header notes non-enum→400 is a Zod-boundary concern, not the service.
- Local: tsc --noEmit exit 0; biome clean; vitest collects all 4. Full run deferred to CI (no local postgres server reachable — pg client only, no server binary/docker; same infra dependency as every existing integration spec). CI runs `pnpm --filter @studyhall/api test:ci` on postgres:16.
- Commit a7fa31d5. No deviations.

```yaml
skipped: false
fast_path_active: false
specialists_spawned: [backend-developer]
files_implemented: [apps/api/src/users/users.service.ts, apps/api/test/integration/profile-academic-role-clear.integration.spec.ts]
deviations: []
simplify_applied: true
```
