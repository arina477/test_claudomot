# Wave 28 — P-2 Spec (pointer)

**Source of truth:** the spec contract is the fenced YAML head + `---` + prose in `tasks.description` for row **d058283d-a979-4528-9cd6-3ff48b4cfbc1** (written via UPDATE at P-2 Action 5). This file is the convenience copy.

- **wave_type:** single-spec
- **claimed_task_ids:** [d058283d]
- **design_gap_flag:** false

## Acceptance criteria (copy)
1. Server owner POST /servers/:id/invite-code/rotate → 200 `{ invite_code }`, new code ≠ prior.
2. After rotate: GET /invites/<old-code> → 404 AND POST /invites/<old-code>/join → 404 (leaked link dead).
3. After rotate: GET /invites/<new-code> → 200 preview AND POST /invites/<new-code>/join → 200 (new link admits members).
4. Non-owner authenticated member → 403 (owner-ONLY; no invite-creator path unlike revoke).
5. Non-existent server id → 404.
6. Unauthenticated → 401; unverified → 403 (AuthGuard, consistent with other /servers routes).
7. CSPRNG regenerate (base64url ~128-bit, `generateCode()`); 23505 collision → retry ≤5 then 409.

## Contracts (copy)
- **API:** `POST /servers/:id/invite-code/rotate` — AuthGuard; path `:id`; no body; 200 → `{ invite_code: string }`; errors 401/403/404/409.
- **Data:** no schema delta / no migration — writes existing `servers.invite_code` UNIQUE column in place; old link invalidated implicitly.
- **Types:** inline response DTO on ServersController (`{ invite_code }`); NOT added to packages/shared (no client consumer this wave).
- **SDK:** none.

## Edge cases (copy)
- 23505 collision → retry ≤5 (mirror createInvite) → 409 exhausted.
- Concurrent owner rotate → last-write-wins, all prior codes dead, documented (no lock at 0 users).
- Owner-ONLY authz: member/other-server-owner → 403.
- Ad-hoc `invites` rows unaffected (separate table).

## Keep-OUT (P-0 reviewers)
rate-limiting · audit-log · client regenerate-link UI — all gold-plating / demand-gated.

## Security carry → P-4 security gate + T-8
owner-only · CSPRNG unpredictability · proven old-link invalidation · no-rate-limit is a documented decision not an omission.

→ P-3 Plan.
