# V-1 Semantic-spec verification — jenny — wave-23

**Wave:** 23 (M5 bundle 2 — delegated assignment-organizer authz)
**Spec source:** DB `tasks.description` of `8aa67564-a142-4628-b658-f020d4d2872c` (2-block multi-spec: 8aa67564 + edbdea8f)
**Deployed:** api `https://api-production-b93e.up.railway.app`, web `https://web-production-bce1a8.up.railway.app`
**Merged:** #35 (`489c86a`), C-block LIVE (`67355e8`), T-block gate-passed (`b0f2e95`)

## Verdict: **APPROVE**

All 14 acceptance criteria across both spec blocks MATCH deployed + merged behavior. Every carried BOARD condition is reflected. Zero spec-drift (code-wrong). Two immaterial spec-gaps (spec-wrong / under-specified) noted below — neither is a functional defect, neither blocks ship.

---

## Spec 1 — 8aa67564 (dedicated `manage_assignments` permission)

| AC | Verdict | Evidence |
|---|---|---|
| Permission union 4→5 incl. `manage_assignments`; `can()` resolves against caller's server role | **MATCHES** | `apps/api/src/rbac/rbac.service.ts:38-43` (union has all 5); `can()` :49-92 returns `role[permission] === true` |
| Non-owner with `manage_assignments=true` can POST/PATCH/DELETE + presign; owner superuser short-circuits before flag lookup | **MATCHES** | `can()` owner short-circuit `rbac.service.ts:63-65` (before member/role load); 4 organizer routes all gated via `assertOrganizer` (service.ts:231/343/411/477) |
| `manage_assignments=false` / no role → 403 on every organizer route; member reads unchanged | **MATCHES** | `assertOrganizer` throws Forbidden on `can()=false` (service.ts:60-66); `can()` default-denies null role / missing role (rbac.service.ts:79-88); GET routes carry no `assertOrganizer` (controller.ts:88,127) |
| `roles.manage_assignments` boolean NOT NULL DEFAULT false, additive migration 0011 | **MATCHES** | `0011_rainy_wild_child.sql:1` `ADD COLUMN ... boolean DEFAULT false NOT NULL`; single additive ALTER, no existing-column changes |
| Backfill `=true` where `manage_channels=true` (no silent privilege loss); owners unaffected via superuser | **MATCHES** | `0011...sql:3` `UPDATE roles SET manage_assignments=true WHERE manage_channels=true`; owners never carry a role (superuser path) |
| Role create/update DTOs accept flag; `roleToDto` returns it; persists + reflects on read | **MATCHES** | `packages/shared/src/rbac.ts` CreateRoleSchema:56/UpdateRoleSchema:70/RolePermissionsSchema:12; `createRole`/`updateRole` persist (rbac.service.ts:132/168); `roleToDto` returns it (rbac.service.ts) |
| `can()` fail-closed on absent/undefined flag | **MATCHES** | `role[permission] === true` strict-equality — undefined→false (rbac.service.ts:91); missing role row → false (:87) |
| Single call-site swap `manage_channels`→`manage_assignments` at `assertOrganizer`; no other `can()` sites change | **MATCHES** | `assignments.service.ts:61` now `can(...,'manage_assignments')`; grep confirms remaining `manage_channels` `can()` sites are legitimate (channel-override controller, message-moderation) — untouched |

**Edge cases:** owner-no-flag→200 (superuser, MATCHES); missing-column mid-deploy→deny-no-500 (strict eq, MATCHES); migrated `manage_channels` role still posts (backfill, MATCHES); default Member all-false→403 (MATCHES).

## Spec 2 — edbdea8f (`/me/permissions` + CTA gate)

| AC | Verdict | Evidence |
|---|---|---|
| `GET /servers/:serverId/me/permissions` → owner flag + 5 booleans, SESSION-derived | **MATCHES** | `ServerPermissionsController.getMyPermissions` uses `req.session.getUserId()` only (rbac.controller.ts); `getEffectivePermissions` returns `owner` + 5 flags (rbac.service.ts) |
| Never reads client userId (IDOR-safe) | **MATCHES** | No `@Query`/`@Body` userId in the handler — identity exclusively from session guard; **LIVE probe unauth → 401** (`?userId=` cannot even reach handler) |
| Non-member → 403; member gets own perms only | **MATCHES** | `getEffectivePermissions` throws Forbidden when not owner + not member (rbac.service.ts); owner→all-true branch present |
| Assignments CTA visible iff owner OR `manage_assignments` (replaces wave-22 owner-only) | **MATCHES** | `AssignmentsPanel.tsx:94` `isOrganizer = perms.owner || perms.manage_assignments`; fetched from `/me/permissions` (:71-88) |
| Non-owner w/ permission sees CTA + completes create end-to-end (client + server agree) | **MATCHES** | client gate (`manage_assignments`) == server gate (`assertOrganizer`→`can(...,'manage_assignments')`) — same predicate both sides |
| No permission → no CTA; forced create → honest 403 readable message, no dead button | **MATCHES** | CTA hidden when `!isOrganizer` / loading / fetch-error (panel :71-94); `AssignmentForm.tsx:251` surfaces `err.message` (API 403 body "Insufficient permissions: organizer (manage_assignments) required") as `submitError` |

**Edge cases:** non-member→403 (MATCHES); `?userId` ignored (session-only, MATCHES); owner→CTA (owner:true branch, MATCHES); revoked-between-loads→CTA disappears next load (perms re-fetched per `serverId` effect, MATCHES); force-POST→honest 403 (MATCHES).

**LIVE probes:** unauth `/me/permissions` → **401** (endpoint routed + auth-gated, as specified). `/healthz` → 404 (project uses Railway deployment-state, not /healthz — expected, not a defect).

---

## BOARD conditions (all reflected in deployed behavior)

1. **No-silent-privilege-loss backfill + `can()` fail-closed** — MATCHES (0011 UPDATE + strict-eq deny).
2. **`/me/permissions` session-scoped IDOR-safe** — MATCHES (session-only identity; unauth 401 probe confirms no client-userId reach path).
3. **Honest 403 CTA path (not dead/silent button)** — MATCHES (AssignmentForm surfaces API message).
4. **Owner-lockout / self-demotion guardrails extend** — MATCHES by design: `owner-lockout.service.ts` intact; owner is superuser (never role-bound), and `manage_assignments` is not an admin-critical flag, so it introduces no new lockout vector.
5. **Reminders DEFERRED (cred-blocked)** — CORRECTLY OUT: no cron / NotificationsModule / Resend wiring introduced this wave; consistent with wave-22 deferral + pending-founder-asks. M5 correctly NOT over-claimed complete (reminders + grading/rubrics/submissions remain).

## Prior-decision drift check
- Matches wave-22 `manage_assignments` deferral + BOARD P-1-floor-merge (6/7 override-ship): dedicated permission split shipped, reminders held. **No drift.**
- RBAC model consistent — boolean flags on `roles`, single `can()` authz path, no parallel authz mechanism introduced. **No drift.**
- Journey continuity: assignments panel + role create/update flows intact (`manage_assignments` is a token-level add to existing role DTOs, no new surface); no dead-ends. **Intact.**

## Spec-gaps (spec-wrong / under-specified — NOT drift, NOT blocking)

- **GAP-1 (Low) — malformed `serverId` → 500 post-auth.** Spec 2 edge-cases enumerate non-member/`?userId`/owner/revoked/force-POST but NOT a non-UUID `:serverId`. An authenticated caller passing a non-UUID hits `eq(servers.id, <bad>)` → Postgres `22P02` → 500 (the case T-8 flagged). LIVE probe shows the **auth guard shields the unauth path** (non-uuid → 401), so it is authenticated-only, non-security, non-data-leak. Spec section: edbdea8f `edge-cases`. Recommend a `z.string().uuid()` param guard as a follow-on hardening ticket; immaterial to this wave's authz intent.
- **GAP-2 (Info) — "presign/confirm" attachment wording.** Spec 1 AC-2 says organizer can "presign/confirm assignment attachments," but there is no separate `confirm` endpoint — attachment confirmation is folded into the organizer-gated `createAssignment` (validates the attachment key before insert, service.ts:231-). Gate coverage is complete (presign + create both `assertOrganizer`-gated); the spec merely over-enumerates a route that was consolidated. No behavioral gap.

## Cosmetic (non-blocking, not counted as drift)
- Stale comments still reference `manage_channels` in the assignments module (`assignments.controller.ts:44`, `assignments.service.ts:56,221`) while the live code (service.ts:61) correctly uses `manage_assignments`. Comment-only; zero runtime effect. Recommend a comment sweep at L-1.

---

**Bottom line:** Deployed + merged behavior faithfully implements the 2-block spec intent and every carried BOARD condition with no spec-drift. The two gaps are spec-side (under-specification), the more notable one (GAP-1) already surfaced by T-8 and shielded from the unauth path. **APPROVE.**
