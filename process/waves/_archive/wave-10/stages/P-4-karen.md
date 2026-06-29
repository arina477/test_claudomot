# P-4 Phase 2 — Source-Claim Verification (Karen)

**Wave:** 10 — M2 RBAC capstone (multi-spec, security-tightened gate)
**Scope:** PRE-build plan source-claim verification. RBAC = access control = highest-stakes; every security-load-bearing claim verified claim→code.
**Verdict:** **APPROVE**
**Date:** 2026-06-29

---

## Verdict rationale (one line)

Every scaffold the RBAC plan builds on exists in live code exactly as the plan claims; the security deltas (server-side channel filter, route-param guard, transactional owner-lockout) are real, un-built deltas — not already-done masquerading as work; the plan correctly follows arch decision #6 over the contradictory `role_permissions` row; the only blocker-grade item is the **`permissions` vs `channel_permission_overrides` table-name divergence (claim 6)**, which is a *documentation/naming* disposition, not a build defect — resolved below as **record-the-override** (no rename required). With that disposition recorded at B-0, the plan is build-ready.

---

## Per-claim findings

### Claim 1 — wave-7/8 scaffolds exist (server_members.role_id nullable, servers.owner_id, channels.is_private)
**VERIFIED.** `apps/api/src/db/schema/servers.ts`:
- `server_members.role_id`: line 25 — `role_id: uuid('role_id')` — nullable (no `.notNull()`, no FK yet). Exactly the "existing nullable scaffold" the plan claims (P-3-plan.md:6 adds the FK to `roles.id`).
- `servers.owner_id`: lines 8–10 — `owner_id: text('owner_id').notNull().references(() => users.id)`. Canonical superuser column present.
- `channels.is_private`: line 48 — `is_private: boolean('is_private').default(false).notNull()`. Present, defaults false (= default-visible, which the override visibility rule depends on).
**No false claim.** B-0's job (add `role_id` FK + new tables) is a genuine delta on top of these.

### Claim 2 — findServerDetail takes session userId + currently returns ALL channels (so the server-side channel-filter is a real delta)
**VERIFIED.** `apps/api/src/servers/servers.service.ts:120` — signature is `findServerDetail(userId: string, serverId: string)`. The `userId` comes from `req.session.getUserId()` at the controller (`servers.controller.ts:66`), so the session-userId claim is exact.
**The filter is genuinely NOT done:** lines 143–147 select channels by `eq(channels.server_id, serverId)` only — **no visibility/role/override filtering**. Every channel of the server (including `is_private` ones) is returned to any member (lines 160–168 just map all rows into the category tree). Spec AC `2c927c44` ("FILTERS channels SERVER-SIDE … non-visible channels are absent from the response") is a real un-built delta. **Not claimed-but-fake.**

### Claim 3 — guard-composition supports a route-param-reading ChannelPermissionGuard
**VERIFIED.** `apps/api/src/auth/auth.guard.ts` is a standard NestJS `CanActivate` (lines 5–34). The controller already composes `@UseGuards(AuthGuard)` per-route and reads identifiers via `@Param` (`servers.controller.ts:38,61,64,80,84,122,125,140,144`). A second guard appended — `@UseGuards(AuthGuard, ChannelPermissionGuard)` — reading `@Param('id')`/`@Param('channelId')` from the route is a direct extension of the live pattern, and matches the locked arch contract (`_library.md:107` — "Guard reads `serverId`/`channelId` from route params, never body"). Implementable as planned. The body-spoof-resistance property is structurally satisfied because the guard reads from route params, where the existing controllers already place the IDs.

### Claim 4 — can() server-side everywhere + default-deny implementable; owner_id-as-superuser sound
**VERIFIED.** The data to resolve `can()` all exists or is being added in B-0: `servers.owner_id` (live), `server_members.role_id` (live, FK added B-0), boolean perm flags on `roles` (B-0). The existing service already demonstrates the exact server-side authz pattern `can()` generalizes — `revokeInvite` (lines 252–278) loads the server, compares `server.owner_id !== callerId` for owner-gating, and the member-gate (`createInvite` lines 188–196, `findServerDetail` lines 127–135) shows the `server_members` lookup → 403 pattern. `can()` is a clean consolidation of patterns already proven in this codebase. Default-DENY is implementable (no role / no flag → false) and the plan states it explicitly (P-3-plan.md:10). owner_id-as-superuser is sound and already the de-facto pattern (revokeInvite owner check).

### Claim 5 — owner-lockout transactional (db.transaction + row-lock/re-check) implementable
**VERIFIED.** The codebase already uses `db.transaction(async (tx) => …)` with in-txn re-validation and atomic conditional UPDATEs for exactly this class of race — see `joinViaInvite` (lines 357–440): resolve-inside-txn (368), `onConflictDoNothing().returning()` (391–395), and a TOCTOU-safe conditional `UPDATE … WHERE uses < max_uses RETURNING` that rolls the whole txn back when it loses the race (411–428). The owner-lockout last-owner invariant (re-check ≥1 owner inside the txn, block 409) is the same shape and is demonstrably implementable here. **Pattern precedent is in-repo, not aspirational.**

### Claim 6 — TABLE NAME divergence: `_library` names it `permissions` (L144) vs spec/plan `channel_permission_overrides`
**CONFIRMED — divergence is real.**
- `_library.md:144` — Databases table list: **`permissions`** | RbacModule | `UNIQUE (channel_id, role_id)`, `INDEX (channel_id)`.
- `_library.md:58` — Modules section also lists the table as **`channel_permission_overrides`** (alongside `roles`, `role_permissions`). So `_library` is **internally inconsistent** — it names the channel-override table `permissions` in the Databases table (L144) AND `channel_permission_overrides` in the Modules section (L58).
- Spec (`2c927c44`) + plan (P-3-plan.md:5) both use **`channel_permission_overrides`**.
- The doc's own conflict rule (`_library.md:5`, "This document wins on any conflict across branches") resolves cross-*branch* drift, but here the conflict is *within* the doc itself — L144 vs L58 — so the rule doesn't cleanly pick a winner.

**Disposition: RECORD-THE-OVERRIDE (use `channel_permission_overrides`; do NOT rename to `permissions`).** Rationale:
1. `channel_permission_overrides` is the self-documenting name; `permissions` is dangerously generic for a table that is specifically the *channel × role can_view override* table (it is not a general permissions store — role permission flags are boolean columns on `roles` per #6, see claim 7). Naming it `permissions` would actively mislead future readers into thinking it's the RBAC permission catalog.
2. `_library` itself uses `channel_permission_overrides` at L58, so this choice is consistent with one of the two in-doc names, not a clean break from the architecture.
3. The spec, plan, and shared-types (`packages/shared/src/rbac.ts` planned `ChannelOverride`) all already align on `channel_permission_overrides`.

**Required B-0 action (gate condition, not a blocker to APPROVE):** Append a one-line entry to `command-center/product/product-decisions.md` recording the deliberate use of `channel_permission_overrides` over the `_library.md:144` `permissions` name, and (recommended) fix `_library.md:144` to read `channel_permission_overrides` so the doc stops contradicting itself. The `UNIQUE (channel_id, role_id)` + `INDEX (channel_id)` from L144 carry over unchanged.

### Claim 7 — arch contradiction: `_library.md:58` `role_permissions` table vs decision #6 (boolean cols on roles); #6 wins; plan follows #6
**VERIFIED — plan follows #6 correctly.**
- `_library.md:58` (Modules section) lists `roles`, **`role_permissions`**, `channel_permission_overrides` as RbacModule-owned tables.
- Decision #6 (`_library.md:573`): "Roles: single-role-per-member (`server_members.role_id` FK) + `roles` table + channel-level `permissions` (boolean columns) + `channel_permission_overrides`. **No many-to-many role join tables.**" #6 is in the "Resolved cross-branch decisions (v6b)" table, which is the doc's authoritative conflict-resolution layer — it explicitly bans the join-table model that a `role_permissions` table implies.
- Plan (P-3-plan.md:4): `roles` table carries `manage_server bool`, `manage_roles bool`, `manage_channels bool`, `manage_members bool` as **boolean columns on the roles row** — no `role_permissions` join table. Spec AC `35f191f4` says the same ("a SMALL FIXED set of boolean flags … NOT a permission matrix").
**The plan follows #6, not the stale L58 `role_permissions` reference.** (Note the L58 `role_permissions` listing is leftover and contradicts #6 — same internal-inconsistency class as claim 6's L144. Recommend B-0 also strike `role_permissions` from L58 when fixing the table name, but this is doc-hygiene, not a build blocker, because the plan already builds the #6-correct model.)

### Claim 8 — specialists in AGENTS.md
**VERIFIED.** `command-center/AGENTS.md`: `head-designer` (L44), `backend-developer` (L70), `postgres-pro` (L81), `react-specialist` (L82). `database-administrator` is named in the plan as `database-administrator/postgres-pro`; `postgres-pro` is the catalog entry that covers the Drizzle/Postgres schema+migration work (L81), so the B-0 data-model owner is covered. All four plan-named specialists resolve to real catalog agents.

### Claim 9 — antipatterns (gold-plating / claimed-but-fake)
**VERIFIED — no gold-plating, no fake completion.**
- **No gold-plating:** plan + spec explicitly hold the line on the v6b-thinned model — SMALL FIXED 4-flag set, NO permission-matrix, NO custom-permission-builder, NO role hierarchy, single-role-per-member (#6). Spec AC `0b9bcf35` even bans the custom-builder in the UI ("NO custom-permission-builder (fixed flag set)"). Ownership transfer is correctly deferred to a later task — the invariant just blocks last-owner-removal (spec `7a10f13d`). This is appropriately scoped, not over-built.
- **No claimed-but-fake:** the two highest-risk deltas were independently checked against live code and confirmed un-built: channel filtering in `findServerDetail` is absent (claim 2), and there is no RbacService / can() / guard / roles table anywhere in `apps/api/src/` today. The plan describes work that genuinely does not exist yet.

---

## Disposition summary

| # | Claim | Finding |
|---|-------|---------|
| 1 | scaffolds (role_id nullable / owner_id / is_private) | VERIFIED |
| 2 | findServerDetail(userId) returns ALL channels (filter is real delta) | VERIFIED |
| 3 | guard composition supports route-param ChannelPermissionGuard | VERIFIED |
| 4 | can() server-side + default-deny + owner-superuser | VERIFIED |
| 5 | owner-lockout transactional implementable | VERIFIED |
| 6 | table name `permissions` (L144) vs `channel_permission_overrides` | CONFIRMED divergence → **RECORD-OVERRIDE** (keep `channel_permission_overrides`; record in product-decisions; fix L144) |
| 7 | `role_permissions` (L58) vs #6 boolean-cols; #6 wins | VERIFIED — plan follows #6 |
| 8 | specialists in AGENTS.md | VERIFIED |
| 9 | antipatterns (gold-plating / fake) | VERIFIED — none |

## Gate conditions carried into B-0 (do NOT re-open the gate; track at build)
1. **Table-name override recorded.** B-0 appends a one-line entry to `command-center/product/product-decisions.md` noting `channel_permission_overrides` is used over the `_library.md:144` `permissions` name, and fixes `_library.md:144` to match. Carry the `UNIQUE (channel_id, role_id)` + `INDEX (channel_id)` from L144.
2. **Doc hygiene (recommended, non-blocking):** strike the stale `role_permissions` from `_library.md:58` when editing — the built model is #6's boolean-columns-on-roles.

**VERDICT: APPROVE** (with the two B-0 carry-forward conditions above; both are doc/record actions, neither blocks the build).
