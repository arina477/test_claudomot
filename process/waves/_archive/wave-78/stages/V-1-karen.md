# V-1 Karen — wave-78 (member-profile-card UX polish) source-claim verification

**Verdict: APPROVE**
**Axis:** load-bearing CLAIMS true in merge tree + deployed prod (NOT spec conformance — jenny's axis).
**Merge commit:** `855e81171fe0f5bfdbd87f9f256cc0db8f708496` (PR #97, squash-merged).
**Deployed prod:** api `https://api-production-b93e.up.railway.app` (/health 200) · web `https://web-production-bce1a8.up.railway.app` (200).
**Findings:** 6/6 claims APPROVE · 0 REJECT · 1 documented hash-provenance note (non-blocking).

---

## Claim 1 — Files exist on merge tree — **APPROVE**

`git ls-tree -r 855e811` confirms all five load-bearing files present:

- `packages/shared/src/profile.ts`
- `apps/api/src/users/users.service.ts`
- `apps/web/src/pages/ProfilePage.tsx`
- `apps/web/src/shell/MemberProfileCard.tsx`
- `apps/api/test/integration/profile-academic-role-clear.integration.spec.ts`

(Merge diff also includes the two web unit tests `profile-academic.test.tsx` + `member-profile-card.test.tsx`.)

---

## Claim 2 — Fail-closed branch is real (allowlist form, not old fail-open) — **APPROVE**

`apps/web/src/shell/MemberProfileCard.tsx:211-219` (exact branch):

```
.catch((err) => {
  // Retryable ONLY for a transport failure: a non-HttpError throw, or a
  // 5xx server error. Every other HttpError status → the safe 'hidden'.
  if (!(err instanceof HttpError) || err.status >= 500) {
    setState({ kind: 'error' });
  } else {
    setState({ kind: 'hidden' });
```

This is the FAIL-CLOSED allowlist form: `error` state is reachable ONLY for a non-`HttpError` throw OR `status >= 500`; every other status (401/403/404/410/429/…) collapses to the uniform `hidden` anti-oracle. Confirmed NOT the old `!== 404` fail-open form (no `!== 404` anywhere in the file). File header (lines 55-58, 187-201) documents the anti-oracle rationale.

**Hash-provenance note (non-blocking):** The prompt asserted this fix landed via commit `1fca71a`; `git merge-base --is-ancestor 1fca71a 855e811` returns FALSE (not an ancestor). PR #97 was **squash-merged**, so original per-commit hashes do not survive as ancestors of the merge commit. The squash commit body (visible in both Railway deploy `meta.commitMessage` and `git show 855e811`) explicitly contains the B-6 leg: `"fix(profile): B-6 fail-closed card error state (retryable only for 5xx/transport)"` and `"docs: B-6 wave-78 review APPROVE — head-builder + /review (1 high fixed: fail-closed anti-oracle)"`. The FIX CONTENT is verifiably present in the merge tree (quoted above); only the cited hash is stale. Not a missing-fix; a claim-hash mismatch. No fix required.

---

## Claim 3 — Service undefined-vs-null write path — **APPROVE**

`apps/api/src/users/users.service.ts`:

- Param type (line 73): `academicRole?: AcademicRole | null | undefined;`
- Patch column type (lines 85-86): `// wave-78 B-2: string | null so a cleared role writes SQL NULL.` → `academic_role: string | null;`
- Gate (lines 118-120): `if (fields.academicRole !== undefined) { patch.academic_role = fields.academicRole; }`

Three-way behavior correct: `undefined` → filtered out (column untouched / partial PATCH); `null` → assigned to a `string | null` patch field → Drizzle `.set()` writes SQL NULL; enum string → writes the string. Gates on `!== undefined` exactly as claimed.

---

## Claim 4 — Contract (profile.ts) — **APPROVE**

`packages/shared/src/profile.ts`:

- Write schema (lines 39-42):
  ```
  academicRole: z.preprocess(
    (v) => (v === '' ? null : v),
    z.enum(ACADEMIC_ROLES).nullable().optional(),
  ),
  ```
  Matches claimed `z.preprocess('' → null, z.enum(...).nullable().optional())` exactly.
- Read schemas untouched: `ProfileResponseSchema.academicRole` (line 18) = `z.enum(ACADEMIC_ROLES).nullable()`; `PublicProfileSchema.academicRole` (line 67) = `z.enum(ACADEMIC_ROLES).nullable()`. Both still `.nullable()`, no preprocess added — untouched as claimed.

Web editor plumbing consistent: `ProfilePage.tsx:363` sends `academicRole: academicRole === '' ? null : academicRole`; state seeded `data.academicRole ?? ''` (line 180). Editor empty→null confirmed.

---

## Claim 5 — Deploy hash match + live probe — **APPROVE**

Railway GraphQL (`backboard.railway.com/graphql/v2`, `Project-Access-Token`, project `ae55c191-...`), `deployments(first:1, input:{projectId, serviceId})`. Service ids resolved via project query: api=`7358a103-0a4f-44e6-9468-3d02d045531e`, web=`107d4255-422a-4b72-b138-0647f9192fe4` (both prefixes match the claim).

- **api** latest deployment `911784fb-...`: `status: SUCCESS`, `commitHash: 855e81171fe0f5bfdbd87f9f256cc0db8f708496`, branch `main`.
- **web** latest deployment `a66b49ab-...`: `status: SUCCESS`, `commitHash: 855e81171fe0f5bfdbd87f9f256cc0db8f708496`, branch `main`.

Live probes:
- `GET /profile/00000000-0000-0000-0000-000000000000` (unauth) → **401** (as claimed).
- `GET /health` → 200; web root → 200.

---

## Claim 6 — No migration + test-honesty antipattern check — **APPROVE**

**No migration:** `git show 855e811 --name-only` full changed-file list contains NO migration / drizzle / `.sql` / `schema.ts` file (grep `migrat|drizzle|\.sql|schema\.ts` → NONE). Schema unchanged; `users.academic_role` was already nullable text (pre-existing). Confirmed.

**Test-honesty (`profile-academic-role-clear.integration.spec.ts`):** REAL, not decorative. It asserts the full set→clear→NULL round-trip against real Postgres via the pg-harness:
- `readAcademicRole()` reads back via `harnessQuery` on a **separate harness connection** (`SELECT academic_role FROM users WHERE id = $1`) — proves committed cross-connection visibility, not in-session SUT state.
- Test 1: set `'educator'` → asserts `'educator'`; then `academicRole: null` → asserts `harnessQuery` cell `.toBeNull()` AND `findById().academic_role` `.toBeNull()` (genuine SQL NULL read-back).
- Test 2: undefined-not-clobbered — after `'educator'`, updates a different field only, asserts `academic_role` stays `'educator'` (proves `undefined ≠ null`).
- Test 3: set `'staff'` → persists `'staff'`.
- Test 4: idempotent clear from already-null → stays NULL.

`describe.skipIf(SKIP)` guard on `DATABASE_URL_TEST` is a standard integration-suite env gate (assertions are genuine when the var is set), not a hollow/always-green pattern. No claimed-but-fake test, no deferred-undocumented work detected.

---

## Antipattern sweep summary

| Antipattern | Result |
|---|---|
| Claimed-but-fake file | none — all 5 present on tree |
| Fail-open masquerading as fail-closed | none — allowlist form verified line 215 |
| Decorative / hollow test | none — real cross-connection pg read-back |
| Stale/false deploy-green | none — both services SUCCESS @ 855e811 |
| Undocumented deferred work | none |
| Silent schema/migration drift | none — zero migration files, schema untouched |
| Stale claim hash | 1 note (Claim 2, `1fca71a` non-ancestor) — content present via squash; NON-BLOCKING |

**FINAL VERDICT: APPROVE** — all six load-bearing claims are TRUE in the merge-commit tree and the deployed prod. The single discrepancy (cited fix hash `1fca71a` not an ancestor) is explained by squash-merge and does not affect correctness: the fail-closed fix content is verifiably in the tree and deployed.
