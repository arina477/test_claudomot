# P-4 Phase 2 — Jenny spec-drift verification (wave-10, M2 RBAC capstone, multi-spec / 4 blocks)

**Verdict: APPROVE**

**Gate note:** P-4 Phase 1 (Gemini) returned `UNAVAILABLE: no text in response` (`P-4-gemini-review.md`) — this Phase 2 jenny verdict is the operative P-4 spec-drift signal. Scope of this review is planning-gate drift (spec contract vs M2 milestone intent vs `_library.md` #6 / v6b-thinned model vs BOARD binding conditions), NOT an implementation audit — wave-10 is pre-build (no `rbac/` module, no `roles` migration yet; expected at this stage).

## Method
- Spec contract read from DB (`tasks.id=35f191f4`, YAML head — all 4 claimed task ids present).
- Cross-checked against: M2 milestone prose (`milestones.id=41e61975`), `P-3-plan.md`, `_library.md` (#6 + § Modules/§ Databases/§ Security), `product-decisions.md` (BOARD wave-9 binding conditions + RBAC-bundle authoring entry).
- Verified the scaffolds the spec depends on actually exist in the codebase:
  - `apps/api/src/db/schema/servers.ts:25` — `server_members.role_id` (uuid, nullable) ✓ (spec's "existing nullable scaffold")
  - `servers.ts` — `channels.is_private` (boolean, default false, notNull) ✓ (spec's "wave-8 scaffold" for private-channel default-deny)
  - `servers.ts:8` — `servers.owner_id` (text, notNull, FK users.id) ✓ (spec's canonical superuser)
  - `design/server-settings.html` EXISTS ✓ (the shell block 0b9bcf35's roles-tab composes onto; design_gap_flag=TRUE delta is correct)

## Per-block findings

### 35f191f4 — RbacModule (roles + can() + CRUD/assignment) — **MATCHES**
- `roles` table with a SMALL FIXED boolean-flag set (manage_server / manage_roles / manage_channels / manage_members) — matches `_library.md` #6 resolved truth ("`roles` table + channel-level permissions (boolean columns)"). No permission-matrix, no `permissions`/`role_permissions` standalone table (the older table-list at `_library.md:58,144` is *superseded* by #6's boolean-columns model; spec correctly follows the resolved decision, not the pre-resolution list). No drift.
- `RbacService.can(userId, serverId, perm)` SERVER-SIDE, owner_id → superuser (all perms), else role flag, **default-DENY** — matches § Security "RBAC, server-side only. Single entry point." and the M2 "per role" intent.
- Role CRUD gated `can(manage_roles)`; assign-member gated `can(manage_members)`; no self-promote (Member lacks manage_members); userId from session (no IDOR); can't-delete-assigned-role guard. All load-bearing ACs present and verifiable.
- single-role-per-member (#6) respected — `server_members.role_id` FK, no join table. ✓

### 2c927c44 — channel_permission_overrides + ChannelPermissionGuard — **MATCHES**
- Closes M2's success-metric clause "see the right channels per role" — the actual gap this whole bundle exists to fill. Confirmed.
- `channel_permission_overrides` (channel_id, role_id, can_view, unique(channel_id, role_id)) matches #6's `channel_permission_overrides`. Visibility rule encoded correctly: owner-always OR (no-override AND not-private default-visible) OR override.can_view=true; private → default-DENY.
- **findServerDetail filters channels SERVER-SIDE** (non-visible absent from response, not UI-hidden) — closes the enumeration hole; matches the milestone's "see the right channels" as an authorization outcome, not a cosmetic one.
- Guard reads channel/server from **ROUTE PARAMS not body** — matches `_library.md` § Services "Guard reads serverId/channelId from route params, never body" (line 107). No body-spoof surface. M3 reuse noted (correct forward-design, not scope creep).

### 7a10f13d — owner-lockout (last-owner invariant) — **MATCHES (correctness safeguard, not feature-creep)**
- Explicitly named in M2 `## Scope` prose ("owner-lockout safeguard") and `_library.md` § Security ("Owner safeguard: server owner cannot be demoted/removed"). In-scope by milestone definition.
- Transactional re-check / row-lock against concurrent demote+leave race — right-sized correctness, prevents bricking a server. Ownership *transfer* correctly deferred ("invariant just BLOCKS"; transfer = later task) — this is thinning, not gold-plating.

### 0b9bcf35 — role-management UI (server-settings roles tab) — **MATCHES**
- Makes the slice usable (server-settings roles tab per existing `design/server-settings.html`); UI gates by can() BUT server enforces regardless — matches the "server-enforced, not UI-only" security stance (§ Security line 325).
- **NO custom-permission-builder** explicitly stated (fixed flag set) — drift-guard against the matrix/builder the v6b thinning removed. Loading/empty/error/Toast + last-owner-protection surfaced. Right-sized.

## Scope assessment — closes M2 success metric without over-reach
- **Closes the metric:** M2 success metric = "Organizer creates a study server... members join and see the right channels **per role**." Invites/join shipped (waves 8–9); the unmet clause was "the right channels per role" — 2c927c44's per-role server-side channel filtering + 35f191f4's role model close it. After this bundle M2 is closeable → M3 (which reuses ChannelPermissionGuard). Confirmed.
- **No over-reach:** NO permission-matrix, NO custom-permission-builder, NO role hierarchy, NO multi-role-per-member. Each is explicitly excluded in the spec note + per-block ACs. Matches the v6b deliberate thinning (#6 "Many-to-many would over-engineer MVP") and `product-decisions.md` v6b entry #3.
- **single-role-per-member (#6):** respected throughout (FK, not join table). ✓
- **BOARD binding conditions honored:** "RBAC is wave-10's seed, unconditionally" (wave-8 N / wave-9 L dissent conditions) — this IS the wave-10 seed bundle. The authz-critical security note ("server-side re-derivation via can(), route-param-only context, owner-lockout invariant; flags T-8") is fully encoded in the spec and propagated to the P-3 plan's T-8-heavy directive.
- **LAST M2 feature bundle:** confirmed — remaining M2 items are tech-debt follow-ups (browser-E2E, verified-prod fixture, PG-rollback test, permanent-invite-code rotation), not features. No gold-plating in this bundle.

## Drifts / clarifications
- **None blocking.** One documentation nuance (NOT a spec defect): `_library.md` § Modules (line 58) and § Databases table-list (line 144) still name a standalone `permissions` / `role_permissions` table from the pre-v6b branches; the canonical v6b resolution #6 (line 573) supersedes these with the boolean-columns-on-`roles` + `channel_permission_overrides` model that the spec correctly implements. The spec is aligned with the *resolved* truth. Optional housekeeping: an L-block tidy of those two stale table-list rows would remove a future re-litigation trap — non-blocking, no rework.

## Recommendation
APPROVE for build. Spec contract, P-3 plan, milestone intent, and architecture #6 / v6b-thinned model are aligned; the four blocks are right-sized for the M2 capstone and close the success metric with no over-reach. Downstream: T-8 must probe each load-bearing security AC (can() server-side + IDOR; no-self-promote; guard route-params-only + body-spoof; default-deny incl. private channels; server-side channel-list filter / no enumeration; owner-lockout transactional race). For build-time over-engineering check, @code-quality-pragmatist at B-6; for functional verification of the security ACs, @task-completion-validator post-build.
