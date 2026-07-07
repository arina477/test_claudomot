# T-1 — Static (wave-78)

**Pattern:** A — Verified-via-CI. Not re-executed; C-1 is authoritative.

## Action 1 — CI evidence (merge commit)
C-1 `verdict_evidence` (`process/waves/wave-78/stages/C-1-pr-ci-merge.md`), CI run **28905313490**, headSha **8fe9bd6** (→ squash-merged 855e811):
- **lint** job: pass (27s).
- **typecheck** job: pass (44s).
Both static jobs GREEN on the single merge-candidate SHA. No missing job → no C-1 defect.

## Action 2 — Coverage audit + bypass grep
Wave diff `31b7550..855e811` (source: `.ts`/`.tsx`). Bypass grep (`@ts-expect-error|@ts-ignore|: any|as any|as unknown as`):
```
NO BYPASSES
```
New/changed files are all typechecker-covered:
- `packages/shared/src/profile.ts` — `z.preprocess` + `.nullable().optional()`; inferred `UpdateProfileInput['academicRole'] = 'student'|'educator'|'staff'|null|undefined` (B-1 verified).
- `apps/api/src/users/users.service.ts` — param + column type widened to `| null`; three-way undefined/null/string is type-expressed, not cast.
- `apps/web/src/shell/MemberProfileCard.tsx` — 4th `FetchState 'error'` added to a discriminated union; branch is `HttpError && status===404` vs else. No `any`.
- `apps/web/src/pages/ProfilePage.tsx` — payload typed `UpdateProfileInput` (imported from shared).

## Action 3 — Discipline note
The null-tolerance is expressed through the type system end-to-end (shared inferred type → service `| null` param → drizzle nullable text col) with zero escape hatches. No new lint rule needed. Candidate T-1 note: none.

## Action 4 — Mask-mode self-check
- C-1 cites both lint + typecheck on merge commit ✓
- Bypass grep ran, recorded ✓
- Findings concrete ✓

```yaml
mask_mode_signoff: PASS
signoff_note: ""
test_pattern: ci-verified
evidence:
  - "C-1 lint job: run 28905313490 green (27s), headSha 8fe9bd6"
  - "C-1 typecheck job: run 28905313490 green (44s), headSha 8fe9bd6"
findings: []
ts_bypasses_in_wave_diff: 0
```
