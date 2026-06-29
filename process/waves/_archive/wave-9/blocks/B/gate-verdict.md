# Wave 9 — B-6 Gate Verdict

**Block:** B (Build) · **Wave topic:** M2 invite-completion · **Stage:** B-6 Review
**Branch:** `wave-9-m2-invite-completion` (pushed) · **Multi-spec, commit-per-spec**
**Gated by:** head-builder (fresh spawn) · **Date:** 2026-06-29

---

## Verdict: APPROVED

Every B-6 stage-exit checkbox ticks from concrete artifacts. No load-bearing defect.
Independent reviewers (code-reviewer + code-quality-pragmatist) confirm correctness and
proportionate MVP scope. Phase-2 secret-grep clean. Hand off to C-block.

---

## Tasks → commits (commit-per-spec, Action 6)

| Task | Spec | Commit(s) | ≥1 commit |
|---|---|---|---|
| 08ff762f | 8a backfill | f7b3bf3 | yes |
| 5331b7d5 | 8b invite_code expose | ad725a7 (api) + 3859b61 (web) | yes |
| 863c10ef | revoke | 9f196a8 (api) + 3859b61 (web) | yes |

Frontend commit 3859b61 cites both 5331b7d5 + 863c10ef — tightly-coupled single modal; acceptable.
Docs commit 260cf74 records B-2/B-3/B-5.

---

## Load-bearing judgments (all PASS)

**revoke authz (access control — security-sensitive).** `ServersService.revokeInvite`
(servers.service.ts:252-278) resolves the invite, loads the server, gates on
`server.owner_id !== callerId && invite.created_by !== callerId → ForbiddenException`.
`callerId` comes from `req.session.getUserId()` (controller:146) — never request body/params.
No IDOR. `invites.created_by` is notNull in schema, no null-bypass on the creator branch.
Tests: owner-revokes (200), creator-non-owner-revokes (200), non-owner/non-creator → 403,
code-not-in-table → 404, idempotent re-revoke → 200.

**revoked → 404 both paths.** `validateInviteActive` (servers.service.ts:38-40) throws
`NotFoundException` on `revoked`. `getInvitePreview` calls it (line 295); `joinViaInvite`
calls it inside the txn (line 369). So GET /invites/:code AND POST /invites/:code/join both
404 after revoke. Re-revoke idempotent (sets revoked=true unconditionally). Tests:
post-revoke-preview 404 (service.spec:900), revoked-join 404-in-txn (service.spec:758).

**8a backfill.** App-side CSPRNG via shared `generateCode()` (randomBytes(16).base64url) —
no pgcrypto (grep-confirmed absent). Idempotent: `SELECT ... WHERE invite_code IS NULL` +
UPDATE re-asserts `AND invite_code IS NULL` (concurrency-safe re-run no-op). 23505
collision-retry up to 5 attempts. NOT boot-wired — reachable only via `db:backfill` package
script (own pg.Pool); grep confirms no reference in main.ts / app.module.ts / ServersModule.
No auto-migrate-on-startup.

**8b mint-on-open removed (T-8 regression guard).** InviteShareModal derives `permanentUrl`
purely from the `inviteCode` prop (line 98); `createInvite` invoked ONLY in `handleGenerate`
(line 193), wired solely to explicit Generate/New/Retry onClick. No useEffect/mount call.
Permanent code is the default. `findServerDetail` exposes `inviteCode` member-gated (403 for
non-members before return); NULL fallback `server.invite_code ?? null`. Shared schema
`ServerSummaryWithInviteSchema` adds `inviteCode: z.string().nullable()` — single source,
DTO derives. Regression-guard test present (invite-share.test.tsx: "does NOT call createInvite on open").

**4 P-4 T-8 conditions — all test-covered:** (1) 8a idempotent + 23505 — verified by read
(one-shot script, no unit spec; nit, not defect); (2) revoke 403 non-owner/creator — tested;
(3) revoked → 404 both paths — tested; (4) 8b no ad-hoc row on plain open — tested.

**Scope discipline.** NO RBAC / kick-ban / settings. Permanent-code rotation correctly
EXCLUDED (deferred follow-up d058283d). Known gap (session-scoped limited-invites list — no
GET endpoint to list ad-hoc invites) is honestly noted in the modal header comment — intentional
deferral, not a defect.

---

## Build health

- Tests: 123 API + 73 web = 196 passed, 0 failed.
- typecheck: green (shared + api + web).
- build: green (api + web PWA).
- lint: no separate `lint` script (biome runs in CI/typecheck path); not a blocker.
- api boots: confirmed at C boot-probe (carry).
- Static imports only.

---

## Reviewer matrix

| Reviewer | Verdict | Material findings |
|---|---|---|
| code-reviewer | PASS (no blocker/major) | minor: revoke-UI treats 404 as transient (session-scoped list makes 404 unlikely); nits: no backfill unit test, cosmetic log counter |
| code-quality-pragmatist | PASS — backend proportionate | UI nits only: inline SVGs vs icons.tsx, hand-rolled toast, duplicated error banner; no behavior/contract change |
| Phase-2 secret-grep | CLEAN | no secrets/keys/tokens in diff |

Independent-reviewer requirement satisfied (reviewers are NOT the author). No reviewer-verdict conflict.

---

## Non-blocking follow-ups (route to L-2 / future wave, NOT gate-blocking)

1. Revoke UI: treat HTTP 404 from `api.revokeInvite` as effectively-revoked rather than a
   retryable transient error. Minor; session-scoped list makes a real 404 unlikely.
2. Extract the four inline SVGs in InviteShareModal to `icons.tsx` (matches the `TrashIcon`
   convention this wave already half-followed); de-dup the generation-error banner; reconsider
   the in-modal bespoke toast. UI-layer simplification, no contract change.
3. Optional: add a unit spec for the backfill collision-retry / idempotent-UPDATE branches.

## Rejected approaches / trade-off lineage (for L-2 distill)

- Rejected pgcrypto / `gen_random` for backfill — chose app-side `randomBytes` to keep the
  CSPRNG path identical to runtime invite generation and avoid an SQL-extension dependency.
- Rejected auto-running the backfill on boot — kept it a standalone `db:backfill` script so a
  destructive/data-touching pass is never coupled to startup (schema-drift / auto-migrate guard).
- Rejected permanent-code rotation this wave — deferred (d058283d); revoke covers ad-hoc invites
  only, permanent code returns 404 from the invites table, which is correct and documented.
- Candidate principle for L-2 (NOT promoted here — L-2 owns the ≤1-rule bar):
  "Reuse the existing icon module for new SVGs instead of inlining raw `<svg>` in components."

---

```yaml
head_signoff:
  verdict: APPROVED
  stage: B-6
  reviewers:
    code-reviewer: PASS
    code-quality-pragmatist: PASS
    secret-grep: CLEAN
  failed_checks: []
  rationale: >
    All B-6 stage-exit checkboxes tick from concrete artifacts. revoke authz is server-side
    (owner_id OR invites.created_by, callerId from session, no IDOR); revoked invites 404 on both
    preview and join with idempotent re-revoke; 8a backfill is app-side CSPRNG, idempotent on
    WHERE invite_code IS NULL, 23505-retried, and a standalone script (not boot-wired / not
    auto-migrate); 8b defaults to the member-gated permanent invite_code with no ad-hoc mint on
    plain modal open. 196 tests pass; typecheck + build green; secret-grep clean. The two
    independent reviewers (not the author) found only UI-layer quality nits and one minor 404-UX
    item, none load-bearing. Scope held to invite-completion; rotation and RBAC correctly deferred.
  next_action: PROCEED_TO_C
```
