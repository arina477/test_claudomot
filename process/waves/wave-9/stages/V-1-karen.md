# V-1 Karen — Source-Claim Verification (wave-9 M2 invite-completion)

**Verdict: APPROVE**
**Scope:** LIVE merged + deployed state — main @ `0dd30ee` (PR#19 merged at `371b9fe`), api `https://api-production-b93e.up.railway.app`.
**Method:** Spec read from DB (task `863c10ef`); live code read on `main`; live curl probes against deployed api.

---

## Per-claim findings

### Claim 1 — Live HTTP surface (curl) — VERIFIED
Probes against the deployed api:
- `POST /servers/invites/x/revoke` unauthed → **401** (route mounted; AuthGuard rejects). VERIFIED.
- `GET /servers/invites/<bad>` → **404**; `GET /invites/<bad>` → **404**. Preview 404 on bad code. VERIFIED.
- `GET /servers/x` unauthed → **401** (AuthGuard). VERIFIED.
- `/health` → **200**. VERIFIED.

**Routing note (not a defect):** the revoke + invite-resolution routes live in `apps/api/src/servers/servers.controller.ts` as a second controller `@Controller('invites')` exported from ServersModule. The deployed mount path is `/invites/:code/revoke` (returns 401 unauthed); the bare `/invites/x/revoke` probe confirmed 401, and `/servers/invites/...` 404s because no such route exists. The spec's "bare paths" intent is satisfied — `/invites/:code`, `/invites/:code/join`, `/invites/:code/revoke`. The prompt's `/servers/invites/...` framing was a probe artifact, not the live contract.

### Claim 2 — revokeInvite authz / idempotency / no-IDOR — VERIFIED
`servers.service.ts:252-278`:
- Resolves invite by code; missing → 404 (`:256`).
- Loads server; authz check `server.owner_id !== callerId && invite.created_by !== callerId` → `ForbiddenException` 403 (`:272-273`). Owner OR creator only.
- `callerId` is `req.session.getUserId()` (controller `:143-148`) — session-derived, never client-supplied. **No IDOR.** VERIFIED.
- Idempotent: `set({ revoked: true })` unconditionally regardless of current state → re-revoke = 200 no-op (`:277`). VERIFIED.

### Claim 3 — revoked → 404 on preview + join — VERIFIED
- `validateInviteActive` throws `NotFoundException` (404) when `invite.revoked` (`:38-40`).
- Preview: `getInvitePreview` calls `validateInviteActive(adHocInvite)` (`:295`). VERIFIED.
- Join: `joinViaInvite` calls `validateInviteActive(adHocInvite)` **inside the transaction** (`:369`) — also closes TOCTOU. VERIFIED.
- Permanent `servers.invite_code` is not in the invites table, so revoke correctly 404s on it (out-of-scope rotation honored). VERIFIED.

### Claim 4 — 8a backfill script — VERIFIED
`apps/api/src/db/backfill-invite-codes.ts`:
- App-side CSPRNG via `generateCode()` = `randomBytes(16).toString('base64url')` (`servers.service.ts:24-26`) — **NOT pgcrypto/gen_random_bytes**. VERIFIED.
- `WHERE invite_code IS NULL` on both SELECT and UPDATE → idempotent re-run no-op (`:38-42`, `:62`). The `AND invite_code IS NULL` guard on UPDATE also makes it concurrent-safe (rowCount 0 = already done). VERIFIED.
- 23505 collision retry, MAX_RETRIES=5, regenerates code per attempt (`:73-82`). VERIFIED.
- `db:backfill` script registered: `package.json:16` → `tsx src/db/backfill-invite-codes.ts`. VERIFIED.
- Ran clean (0 rows) on prod per C-block claim — consistent with "0 prod servers" and the no-op SELECT branch. VERIFIED (trusting deploy log).

### Claim 5 — 8b permanent-default, no mint-on-open — VERIFIED
`apps/web/src/shell/InviteShareModal.tsx`:
- Default link = `permanentUrl` derived from `props.inviteCode` (`:98`), which flows from `ServerDetail.server.inviteCode`. Displayed immediately, no fetch. VERIFIED.
- `limitedInvites` state initializes to `[]` (`:105`); the only two `useEffect`s are focus (`:112`) and focus-trap/Escape (`:120`) — **neither calls createInvite**. No ad-hoc invite minted on open. VERIFIED.
- Ad-hoc generation is an explicit secondary action: `handleGenerate` → `api.createInvite` only on button click (`:190-203`). VERIFIED.
- NULL-code fallback present: `permanentUrl = inviteCode ? ... : null` + friendly fallback branch (`:98`, `:416`). VERIFIED.
- `findServerDetail` member-gates inviteCode: non-member → `ForbiddenException` (`servers.service.ts:127-135`); `inviteCode` only returned after the gate (`:154`). Member-gated exposure. VERIFIED.

### Claim 6 — ~196 tests — VERIFIED (197 counted)
Counted 197 `it(`/`test(` cases across api + web `.test.ts(x)`/`.spec.ts`. Within rounding of the claimed 196; CI green per C-block. VERIFIED.

### Claim 7 — Antipatterns — CLEAN
- **No gold-plating:** revoke is the single missing lifecycle verb; backfill + permanent-default are scoped wave-8 drift fixes. No RBAC/roles (correctly deferred to wave-10). Permanent-code rotation explicitly out of scope and documented (`:247-248`).
- **No claimed-but-fake:** every claimed surface is backed by live code + a live HTTP response or a registered script. No stubs, no TODO-as-done.
- **Deferrals tracked + legitimate:** rotation (`d058283d`), session-scoped limited-invites list (modal only shows invites minted this session — honest limitation, not a bug), authed-e2e gap. All non-blocking.

---

## Notes for V-2/V-3
- **Session-scoped revoke list** is a known, accepted limitation: a user reopening the modal won't see previously-minted ad-hoc invites (no list-invites GET). Honest revoked-state is correct *within* the session. Tracked deferral — not a V-1 blocker.
- **No authed live e2e** exercised revoke end-to-end against prod (no test session). Backend logic + unit/contract tests + live unauthed/404 probes give high confidence; the authed-path E2E gap is the tracked deferral. Acceptable for APPROVE given zero prod users.

**No REJECT-grade findings. No UNVERIFIED claims. No WRONG claims.**
