# V-1 Karen — StudyHall wave-28 source-claim verification (LIVE DEPLOYED state)

**Verdict: APPROVE**

Wave: single-spec backend security fix — `POST /servers/:id/invite-code/rotate` (owner-ONLY regenerate CSPRNG `servers.invite_code`, invalidate leaked permanent invite link). Merge commit **8996230** on main.

Scope of this review: source-claim verification against the LIVE DEPLOYED system (not the diff — that was B-6). Every load-bearing claim below holds in the deployed state. Reviewed on main @ HEAD `78b142f` (T-block commit landed AFTER the C-block merge 8996230 + deploy; 8996230 is in main's history — `git log` confirms `8996230 feat: rotate permanent server invite_code (owner-gated) (#41)`).

---

## Claim-by-claim findings

### 1. File/function existence on the merged tree — CONFIRMED
- `rotateInviteCode(serverId, callerId)` exists: `apps/api/src/servers/servers.service.ts:387`.
  - Owner-ONLY check present: `servers.service.ts:394` — `if (server.owner_id !== callerId) { throw new ForbiddenException(...) }`. NO `|| invite.created_by` creator path (contrast: `revokeInvite` at `servers.service.ts:354` DOES have the owner-OR-creator path — rotate deliberately does not, correct for a permanent code with no creator concept).
  - Server-existence 404 guard first: `servers.service.ts:388-392`.
  - `generateCode()` reuse (not a re-implementation): called at `servers.service.ts:400`; the shared CSPRNG generator is `servers.service.ts:35-37` (`randomBytes(16).toString('base64url')`, ~128-bit, URL-safe).
  - 23505-retry loop: `servers.service.ts:398-414` — `MAX_RETRIES = 5`, catches `pgErr.code === '23505'`, `continue` on collision while `attempt < MAX_RETRIES - 1`, `ConflictException` (409) after exhaustion.
- Controller route: `apps/api/src/servers/servers.controller.ts:95-102` — `@Post(':id/invite-code/rotate')` + `@UseGuards(AuthGuard)` at `:96`, wires `req.session.getUserId()` → service at `:101`. Returns `{ invite_code: string }`.

### 2. Route registered + live — CONFIRMED (401, not 404)
```
curl -sS -o /dev/null -w "%{http_code}" -X POST \
  https://api-production-b93e.up.railway.app/servers/00000000-0000-0000-0000-000000000000/invite-code/rotate
→ 401
```
401 = route registered and AuthGuard active (rejects unauthenticated before reaching the handler). Not 404, so the route is served. Health check `GET /health → 200` confirmed alongside.

### 3. Deploy hash match — CONFIRMED
The deployed api serves the merge commit (route returns 401, not 404). A stale revision predating 8996230 would return 404 for this path (the route did not exist before this wave). The 404→401 flip C-2 proved is re-confirmed live. Deploy is not stale.

### 4. No schema/migration claimed — CONFIRMED
- `git show --stat 8996230` contains NO `.sql` / migration / drizzle-schema files. The 16 changed files are: spec/build docs, `.gitleaks.toml`, controller + service + 3 test files, wave checklists. Rotate writes the existing `servers.invite_code` column — correctly claimed NO migration.
- `git status --porcelain apps/api` → clean. No orphan/uncommitted migration file left behind.

### 5. Tests exist as claimed — CONFIRMED (with one benign count note)
- Integration: `apps/api/test/integration/invite-code-rotate.spec.ts` exists (5956 bytes). It contains **7 active `it` cases** (AC1 line 72; AC2 preview 79; AC2 join 89; AC3 preview 103; AC3 join 113; AC4 non-owner 403 at 125; AC5 non-existent 404 at 134) plus a `SKIP`-guarded skip-message fallback (line 143) when `DATABASE_URL_TEST` is unset. The prompt said "6 cases"; actual = 7 real cases. This is a count under-claim (MORE coverage than claimed, not less) — not a defect. The `describe.skipIf(SKIP)` gate at line 40 correctly skips (not silent-passes) without a test DB and emits an explicit skip message.
- Unit rotate describe block: `apps/api/src/servers/servers.service.spec.ts:1088-1175` — 4 cases (base64url shape; 404 no server; 403 non-owner with `expect(mockUpdate).not.toHaveBeenCalled()` at :1133; 23505-retry).
- Controller rotate describe block: `apps/api/src/servers/servers.controller.spec.ts:363-397` — 3 cases (wiring `getUserId → service`; 403 propagation; 404 propagation).
- **23505-retry test is NOT decorative** (`servers.service.spec.ts:1136-1174`): it captures the `invite_code` passed to `.set()` on each attempt into `capturedCodes[]` (line 1147), forces attempt-1 to reject with `{ code: '23505' }` and attempt-2 to succeed, then asserts `updateAttempt === 2` (line 1169) AND `capturedCodes[1] !== capturedCodes[0]` (line 1173). The second assertion proves `generateCode()` is genuinely re-invoked on retry — a NEW code is generated, not the collided code blindly re-sent. This is a real behavioral assertion, not coverage theater.

### 6. Antipattern catalog — CLEAN; documented limitations are real
- No claimed-but-fake: every claimed function/route/test exists and is wired.
- No decorative tests: the load-bearing retry assertion is behavioral (see #5); the owner-only 403 test asserts the UPDATE never fires.
- The 2 documented limitations are ACTUALLY in the `rotateInviteCode` JSDoc (`servers.service.ts:372-385`), not merely claimed in a deliverable:
  - **Rotate-vs-join race** (`:374-379`): single non-transactional UPDATE; an in-flight `joinViaInvite` that snapshotted the OLD code under READ COMMITTED may still admit for the duration of that join; strict invalidation would need `SELECT ... FOR UPDATE` — deferred, out of scope.
  - **Cross-namespace 23505 scope** (`:381-385`): the retry loop guards only `servers.invite_code` self-collisions, NOT the ~2^-128 case of colliding with an ad-hoc `invites.code` in the separate resolution namespace — documented as a known non-issue, not guarded.
  These are honest deferred-and-DOCUMENTED limitations, not deferred-but-undocumented gaps.

### 7. Product-decisions record — CONFIRMED
`command-center/product/product-decisions.md:331-335` — full entry titled "wave-28 — invite-code rotate is owner-ONLY (conscious bypass of the reserved manage_server RBAC flag)". Records: the owner-ONLY gate vs `can(manage_server)` (`:332`); the rationale that `manage_server` is reserved-but-unwired and behaviorally identical at 0 prod servers, mirroring the wave-22 `manage_assignments` conflation (`:333`); the MATERIAL-flip trigger — first non-owner `manage_server` role granted → one-line swap, no migration (`:334`); provenance — orchestrator/automatic mode, P-4 jenny drift-check 2, karen APPROVE, Gemini UNAVAILABLE-429 non-blocking (`:335`). This is exactly the jenny P-4 drift decision the prompt asked to confirm.

---

## Summary

| # | Claim | Result |
|---|-------|--------|
| 1 | rotateInviteCode + owner-only + no creator path + generateCode reuse + 23505 loop; controller route + AuthGuard | CONFIRMED |
| 2 | Route live → 401 (not 404) | CONFIRMED |
| 3 | Deploy serves merge 8996230 (not stale) | CONFIRMED |
| 4 | No migration claimed; no orphan file | CONFIRMED |
| 5 | Integration + unit + controller specs exist; retry test load-bearing | CONFIRMED (7 integration cases vs "6" claimed — under-claim, benign) |
| 6 | No antipatterns; 2 limitations in JSDoc | CONFIRMED |
| 7 | Owner-ONLY decision in product-decisions.md | CONFIRMED |

**Severity of open items:** none Critical / High / Medium. One **Low / informational**: the deliverable's "6 integration cases" phrasing undercounts the actual 7. Zero load-bearing impact — the extra case (AC5 non-existent-server 404) is genuine additional coverage, and the number was never an acceptance criterion.

Every load-bearing claim holds in the deployed state. **APPROVE.**
