# V-1 Semantic-spec verification — jenny — Wave 9 (M2 invite-completion)

Verdict: **APPROVE**

- Spec: `tasks.description` of `863c10ef-4f58-4451-9172-d319e751ec07` (spec-id `wave-9-m2-invite-completion`, 3-block multi-spec).
- Verified against LIVE deployed state: `main @ 371b9fe` (PR #19 merged); HEAD `0dd30ee`; api `https://api-production-b93e.up.railway.app`.
- Method: read live source + C-2 deliverable + live prod HTTP probes + DB task-state checks.

---

## Block 08ff762f — 8a backfill servers.invite_code — MATCHES

Evidence: `apps/api/src/db/backfill-invite-codes.ts`, `apps/api/package.json:16`.

- App-side script, NOT pure-SQL migration — uses `generateCode()` (`randomBytes(16).toString('base64url')`) imported from `servers.service.ts:23`, identical to the wave-8 generator. AC met.
- Idempotent: `SELECT ... WHERE invite_code IS NULL`; per-row `UPDATE ... WHERE id=$2 AND invite_code IS NULL`; `rowCount===0` treated as success (concurrent/no-op). Re-run = no-op. AC met.
- Collision-safe vs `UNIQUE(invite_code)`: per-row `23505` retry loop (MAX_RETRIES=5), throws after exhaustion. Mirrors `createInvite`. AC met.
- Runnable at C-2 via `db:backfill` step (`tsx src/db/backfill-invite-codes.ts`). Confirmed registered. AC met.
- Ran clean on prod (C-2 deliverable `C-2-deploy-and-verify.md:29-31`): `backfill: no servers with NULL invite_code — nothing to do`, exit 0, 0 rows — the expected forward-safety no-op (0 prod servers). Matches BOARD binding (committed, app-side CSPRNG, NOT auto-migrate-on-boot).

## Block 5331b7d5 — 8b share modal defaults to permanent code — MATCHES

Evidence: `apps/web/src/shell/InviteShareModal.tsx`, `apps/api/src/servers/servers.service.ts:findServerDetail`.

- Default link = permanent code: `permanentUrl = inviteCode ? .../invite/${inviteCode} : null` (modal:98), sourced from `props.inviteCode` (← `ServerDetail.server.inviteCode`). Displayed immediately, no mint-on-open. The wave-8 8b drift (ad-hoc mint per open → row accumulation) is fixed. AC met.
- `findServerDetail` exposes `inviteCode: server.invite_code ?? null` (service ~line 150) and is member-gated (404 if no server, 403 if not a member). Member-gated exposure as specced. AC met.
- Ad-hoc/limited generation is an explicit SECONDARY action (`generate-limited-invite`, modal:573). Copy-to-clipboard + Toast retained (modal:176-187, ToastMessage 'copied'). AC met.
- NULL-code graceful fallback present (`null-code` state, modal:416 friendly fallback + generate). AC met.

## Block 863c10ef — invite-revoke endpoint + UI — MATCHES

Evidence: `apps/api/src/servers/servers.controller.ts:InvitesController.revokeInvite`, `servers.service.ts:revokeInvite`, `InviteShareModal.tsx`.

- Endpoint `POST /invites/:code/revoke`, `@UseGuards(AuthGuard)`, `@HttpCode(OK)`. AC met.
- Server-side authorization: `server.owner_id !== callerId && invite.created_by !== callerId` → `ForbiddenException` (403). Owner OR creator only. Sets `revoked=true`. AC met.
- Revoked → 404 on BOTH read paths: `validateInviteActive` throws 404 on `revoked` for preview (`getInvitePreview`) AND join (`joinViaInvite`); join's atomic consume UPDATE additionally re-checks `NOT revoked`. AC met.
- Idempotent: `revokeInvite` sets `revoked=true` unconditionally regardless of current state → re-revoke 200. AC met.
- Permanent `servers.invite_code` is not in `invites` table → revoke resolves by `invites.code`, 404 if absent. Correctly scoped per spec edge-case. AC met.
- UI: per-invite revoke affordance with inline confirm (`revoke-confirm`), `api.revokeInvite(code)`, revoked state + Toast (modal:204-233). AC met.
- Wiring: `InvitesController` + `ServersController` registered in `ServersModule`; `ServersModule` in `app.module.ts:29`. No orphaned controller.

## Live prod probes (deployed-state confirmation)

- `GET /invites/nonexistent-code-xyz` → **404** (preview rejects invalid).
- `POST /invites/anycode/revoke` (unauth) → **401** (AuthGuard live).
- `POST /invites/anycode/join` (unauth) → **401** (AuthGuard live).

(`/healthz` → 404 is route-path-only; deploy authoritatively verified via Railway deployment-state in C-2, not health endpoint.)

## Scope / gold-plating

- Correctly bounded. NO RBAC (deferred to wave-10), no kick/ban, no settings — none present in the diff.
- Permanent-code rotation correctly DEFERRED: task `d058283d` ("Rotate permanent server invite_code") is `status='todo'`, `wave_id` empty — NOT claimed. Service `revokeInvite` docstring + spec edge-case both explicitly exclude it.
- No RBAC pull-forward; authorization is owner/creator only as specced (RBAC-admin explicitly deferred).
- No gold-plating detected.

## Tracked deferrals (acknowledged, not blocking)

- Permanent-code rotation (`d058283d`, wave-10 candidate).
- Session-scoped limited-invites list — no GET-list-invites endpoint; modal tracks only invites created in the current session (documented in modal header). Acceptable; spec did not require a list endpoint.
- Authed E2E for join/revoke happy-path — boundary (401/403/404) covered live + in tests; full authed E2E deferred per T-block.

---

## Findings summary

| Block | Verdict | Severity |
|---|---|---|
| 08ff762f (8a backfill) | MATCHES | — |
| 5331b7d5 (8b permanent-default) | MATCHES | — |
| 863c10ef (revoke) | MATCHES | — |
| Scope bounding / deferrals | Correct | — |

No Critical / High / Medium / Low gaps. Implementation matches the spec contract and BOARD bindings; deployed state confirms the access-control boundaries. **APPROVE.**
