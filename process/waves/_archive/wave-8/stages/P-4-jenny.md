# P-4 Phase 2 — jenny spec-drift verification (wave-8, M2 invites/join)

**Verdict: APPROVE**

Multi-spec wave, 4 blocks. Verified the spec-contract head of task `c7443638` (the 4-spec YAML) against: the M2 milestone prose (`41e61975`), `_library.md` (locked arch — esp. decisions #3 invites-in-ServersModule + #4 two-tier invite, § Security, § Databases), `P-3-plan.md`, `product-decisions.md`, and the **as-built wave-7 codebase** (servers schema, ServersModule, the two auth guards). No implementation exists yet (pre-B) — this is spec/plan ↔ locked-architecture ↔ milestone alignment, not code-vs-spec.

Scope is correctly drawn: delivers the **join half** of M2's success metric (multi-user unlock) and correctly defers the "per role" half (RBAC), kick/ban, server-settings, leave, and all realtime (M3). No gold-plating, no M3 pull-forward. One real plan-vs-arch drift to fix at B (carry-forward A, confirmed). Two pre-existing arch-vs-as-built divergences the spec correctly inherits (minor, non-blocking).

---

## Per-block findings

### c7443638 — Two-tier invite backend (CSPRNG) — **MATCHES**
- **Two-tier model MATCHES arch #4 (canonical, locked):** permanent `servers.invite_code` (UNIQUE, backfilled in migration) + ad-hoc `invites` table (time/use-limited: `max_uses` null=unlimited, `uses`, `expires_at`, `revoked`). This is locked architecture + milestone scope ("two-tier invites"), NOT gold-plating.
- **CSPRNG codes MATCH § Security intent:** ≥128-bit, `crypto.randomBytes(16)→base64url` (~22 chars, 128 bits) for both code surfaces; non-enumerable. Aligns with arch's "no sequential IDs — avoids enumeration" (UUID PKs + CSPRNG codes layered).
- **Member-gated create MATCHES** the milestone's membership/access-control intent: `createInvite` 403s non-members. Reasonable: only people already inside can mint links.
- **Schema lands in ServersModule's table set** — `invites` is listed under ServersModule ownership in arch (`servers`, `server_members`, `channels`, `categories`, `invites`, `bans`). Consistent. Verified wave-7 already co-locates `servers/server_members/categories/channels` in one `apps/api/src/db/schema/servers.ts` file (arch's "one file per table" is not how wave-7 built it — placement of `invites` should follow the as-built ServersModule convention; see carry-forward A).
- Edge cases (collision retry, backfill, non-member 403) present and correct.
- **Minor (non-blocking):** the spec adds a `revoked` column + join honors `NOT revoked`, but no revoke endpoint/UI is in any of the 4 specs this wave. Acceptable schema-forward (single boolean, default false; avoids a later migration). Flag only so B doesn't mistake the missing revoke surface for a gap.

### 77e2041a — Invite-preview + join API — **MATCHES**
- **Public minimal preview MATCHES § Security + arch #4:** `GET /invites/:code` is unguarded (public), returns minimum-summary only `{server:{id,name,memberCount}}` — NO member list, NO channels. Resolves BOTH ad-hoc `invites.code` AND permanent `servers.invite_code` in one endpoint (arch #4: "Invite preview resolves both"). Invalid/revoked/expired/maxed → 404/410.
- **Public-by-omission is correct against the AS-BUILT codebase, verified:** wave-7 applies `@UseGuards(AuthGuard)` per-route on every servers endpoint; the only `APP_GUARD` is `ThrottlerGuard` (rate-limit), not an auth guard. So a route with no guard is genuinely public — the plan's "no global guard to exempt" claim is accurate. (Arch § Services line 105 envisioned a *global* `JwtAuthGuard` + allowlist; wave-7 chose per-controller guards. The spec correctly follows as-built — see minor note below. Security outcome is identical.)
- **Verified-atomic join MATCHES the security posture, verified against the guards:** `POST /invites/:code/join` uses `@UseGuards(AuthGuard)`. Confirmed `apps/api/src/auth/auth.guard.ts` runs full `verifySession()` WITH global claim validators — and `session-no-verify.guard.ts`'s own header documents that the shared `AuthGuard` carries "full global claims including EmailVerification REQUIRED … fail-closed globally." So `AuthGuard` = verified-email gate exactly as the spec's "EmailVerification REQUIRED" demands. Unauthed→401, unverified→403 (INVALID_CLAIMS) is the natural SuperTokens behavior — matches the spec ACs.
- **No conflict with the wave-3 low-friction verification decision** (product-decisions 2026-06-29): that decision exempts only `/me` + app-shell via `SessionNoVerifyGuard` and explicitly reserves "sensitive actions may gate later." Joining a server is a sensitive access-control action → gating it on verified email is the sanctioned tightening, not a contradiction. The frontend (72fc08ea) correctly carries the unverified→verify prompt.
- **Atomicity MATCHES the concurrency AC:** conditional `UPDATE invites SET uses=uses+1 WHERE … uses<max_uses RETURNING` (no overshoot) + `INSERT server_members ON CONFLICT (server_id,user_id) DO NOTHING` (idempotent re-join). Verified the `server_members` table actually has `UNIQUE(server_id, user_id)` and a nullable `role_id` — so the ON CONFLICT target is real and the insert needs no role (no RBAC dependency). Permanent code path skips the use-counter (never maxes/expires) — correct.

### 72fc08ea — Invite-join page — **MATCHES**
- Route `/invite/:code`, public-reachable, unauthed→login→return-to-invite, consumes `GET` preview + `POST` join, full state machine (loading / valid / invalid-or-expired / already-member / joining / joined), redirect into server on success. Faithful to the existing design: **`design/invite-join.html` confirmed present** (24.8 KB). Unverified→verify-prompt handled (consistent with the AuthGuard 403 path above). No drift.

### 54407e1d — Invite-create + share UI — **MATCHES**
- Minimal "Invite people" modal: shows shareable `/invite/:code` link (permanent code default, optional ad-hoc generate), copy-to-clipboard + Toast, reuses Modal/Button/Toast primitives. Owner/member only; explicitly **NO role/permission UI**. Matches the spec's minimal-share intent and the deferral posture. No drift.

---

## Scope / deferral audit — all correct

- **Makes M2 multi-user:** delivers the join half of the success metric ("invites the cohort via link, and members join"). ✅
- **NO RBAC — correctly DEFERRED.** The milestone success metric's "see the right channels **per role**" half needs the RBAC bundle (roles, `server_members.role_id` population, channel permissions, `channel_permission_overrides`, owner-lockout). None of that is in scope here. **Confirmed: this wave does NOT close M2** — the per-role visibility half remains. The spec's own note ("Owner/member only; NO RBAC") and the milestone gap are consistent; do not mark M2 shipped at N.
- **NO kick/ban/settings — DEFERRED.** No `bans` table, no server-settings page (`design/server-settings.html` exists but is out of scope this wave). ✅
- **NO realtime — DEFERRED to M3.** No Socket.IO, no messaging, no presence anywhere in the 4 specs. ✅
- **No gold-plating:** two-tier + max_uses/expires_at/revoked are all locked arch #4 / milestone scope, not invented surface. No leave-server, no analytics, no multi-use management UI pulled forward.
- **No M3 pull-forward.** ✅

---

## Carry-forward A — CONFIRMED (B-block correction)

**P-3 plan drifts from locked arch #3.** `P-3-plan.md` line 8 names "**InvitesModule** (`apps/api/src/invites/`)" and the spec's `contracts.api` for c7443638 hedges "ServersModule/**InvitesModule**". Locked arch is unambiguous:
- `_library.md` § Cross-domain decision **#3**: "`invites` table owned by ServersModule (**no standalone Invite module**)."
- `_library.md` § Modules: ServersModule "owns `servers`, `server_members`, `channels`, `categories`, `invites`, `bans`."
- product-decisions 2026-Q2 (v6b) item (1): "ServersModule owns servers/members/channels/categories/invites/bans."

As-built reality matches arch, not the plan: `apps/api/src/invites/` does **not** exist; only `apps/api/src/servers/` (ServersModule) does. **B-block correction: implement invite backend inside ServersModule** (invites service/controller co-located under `apps/api/src/servers/`, `invites` Drizzle schema alongside the existing `servers.ts` table set) — do NOT create a new `apps/api/src/invites/` InvitesModule. `_library.md` wins on conflict (it states so explicitly). Low effort, no functional impact — purely module placement. This is a plan/spec drift from locked arch, not a missing feature.

---

## Minor observations (non-blocking — no rework)

These are **pre-existing wave-7 arch-vs-as-built divergences** the spec correctly inherits (consistency with the live codebase wins; flagging only for completeness, not for fixing in this wave):

1. **Bare-path API.** Arch § Services line 99 says "All REST routes prefixed `/api/v1`"; wave-7 ships bare paths and the spec follows suit ("Bare-path API (no /api/v1, matches existing)"). Correct to stay consistent with as-built.
2. **Per-controller guards vs. global guard + allowlist.** Arch line 105 envisioned a global `JwtAuthGuard` with a `/invite/:code` allowlist; wave-7 uses per-route guards (public = no guard). The spec/plan correctly adapt. Identical security outcome.

Neither warrants a spec change. If desired, a future L-2 distill could reconcile `_library.md` to the as-built path/guard conventions — out of scope for this wave.

---

## Bottom line
**APPROVE.** All 4 blocks MATCH the locked architecture (#3, #4), the M2 milestone intent, and the as-built wave-7 foundation; the load-bearing security ACs (CSPRNG non-enumerable codes, minimal public preview, verified-session atomic join, atomic max_uses, idempotent re-join) are correctly specified and land on real codebase primitives (`AuthGuard` w/ EmailVerification, `UNIQUE(server_id,user_id)`). RBAC/kick-ban/settings/realtime are correctly DEFERRED — **M2 is NOT fully closed by this wave** (per-role channel visibility remains in the RBAC bundle). Carry-forward A confirmed: B must build invites **inside ServersModule**, not a new InvitesModule.
