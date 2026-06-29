# P-4 Phase 2 — Source-Claim Verification (Karen)

**Wave 8 — M2 invites/join (multi-spec, security-tightened gate)**
**Spec task:** c7443638-a32f-460c-887f-ecd575f2cede (+ 77e2041a, 72fc08ea, 54407e1d)
**Scope of this verdict:** claim → live-code verification of the PRE-build plan. No production code exists yet (this is P-4); claims are verified for *implementability against the actual current codebase + locked architecture*, not for "already built."

## VERDICT: APPROVE

The plan is buildable against the live codebase and every load-bearing security mechanism is grounded in real, present code. APPROVE is conditional on the **two carry-forwards below being recorded as binding B-block constraints** — one of them (B) is a genuine defect in the P-3 plan's stated SQL ordering that will violate a spec AC if implemented as written. Both are flagged for B + T-8; neither blocks the gate because the spec ACs already mandate the correct behavior, but B must not copy the P-3 line-13 ordering verbatim.

---

## Per-claim findings

### Claim 1 — CSPRNG codes (`crypto.randomBytes(16).toString('base64url')`, ~128-bit) — **VERIFIED**
- Node v22 (locked in `_library.md` Stack, line 40). `crypto.randomBytes` is core; `base64url` encoding supported since Node 14+. 16 bytes = 128 bits of entropy; base64url of 16 bytes = 22 chars, non-padded, URL-safe. Matches AC ("≥128 bits … ~22+ chars … NOT sequential/low-entropy").
- Non-enumerable: 128-bit random space makes guessing/enumeration infeasible. Consistent with `_library.md` Databases line 162 ("no sequential IDs — avoids enumeration"). VERIFIED.

### Claim 2 — Public route mechanism (no global AuthGuard → un-guarded method is public) — **VERIFIED**
- `apps/api/src/app.module.ts:31-38`: the ONLY `APP_GUARD` is `ThrottlerGuard`. No global `AuthGuard`.
- `apps/api/src/servers/servers.controller.ts`: auth is applied **per-method** via `@UseGuards(AuthGuard)` (lines on `createServer`, `listServers`, `getServerDetail`). Confirms wave-7's per-controller-guard pattern.
- Therefore a method with NO `@UseGuards` is reachable without a session — `GET /invites/:code` will be public. VERIFIED.
- **Note (not a blocker):** the public `GET /invites/:code` still passes through the global `ThrottlerGuard` (10 req/60s per the in-memory config at `app.module.ts:18-23`). This is a *positive* — it rate-limits the public preview endpoint against scripted probing on top of the 128-bit code space. B should be aware the limit applies; if legitimate preview traffic ever trips 10/min the limit is tunable, but for self-use-MVP it is fine.

### Claim 3 — Verified-only join (AuthGuard runs `verifySession` with global EmailVerification REQUIRED, fail-closed) — **VERIFIED**
- `apps/api/src/auth/auth.guard.ts:15`: calls bare `verifySession()` with **no** `overrideGlobalClaimValidators` → the global EmailVerification claim validator (added by `EmailVerification.init({ mode: 'REQUIRED' })`) is enforced. Unauthed → 401; authed-but-unverified → claim-validation failure (403). Aligns with AC ("Unauthed → 401; unverified → 403").
- `apps/api/src/auth/session-no-verify.guard.ts:9,18-21`: explicitly scoped — comment states it is "Used ONLY on routes that must remain reachable for authenticated-but-unverified users (/me, /profile)" and strips the validator via `overrideGlobalClaimValidators: () => []`. It is NOT applied to invites. So `POST /invites/:code/join` under `@UseGuards(AuthGuard)` is verified-only. VERIFIED.

### Claim 4 — Idempotent re-join via `UNIQUE(server_id,user_id)` + `ON CONFLICT DO NOTHING` — **VERIFIED**
- `apps/api/src/db/schema/servers.ts:27`: `server_members` has `unique().on(table.server_id, table.user_id)`. The constraint backing `INSERT … ON CONFLICT (server_id,user_id) DO NOTHING` exists. Idempotent re-join (no duplicate membership row) is sound. VERIFIED.

### Claim 5 — Atomic `max_uses` (conditional `UPDATE … WHERE uses<max_uses RETURNING`) — **VERIFIED**
- A single-row conditional `UPDATE invites SET uses = uses + 1 WHERE code = $1 AND NOT revoked AND (max_uses IS NULL OR uses < max_uses) AND (expires_at IS NULL OR expires_at > now()) RETURNING server_id` is implementable in Drizzle (`db.update().set().where().returning()` or `sql\`\``). Postgres takes a row-level lock on the matched row, serializing concurrent updates → no overshoot on `max_uses=1` (exactly one update returns a row, the rest match zero rows → 404/410). Satisfies the concurrency AC. VERIFIED.
- Permanent `servers.invite_code` path correctly has no use-limit / no increment — resolved as a separate branch.

### Claim 6 — Carry-forward A: invites live in ServersModule (arch #3), NOT a standalone module — **CONFIRMED (binding B constraint)**
- `_library.md:570` decision **#3**: "`invites` table owned by ServersModule (no standalone Invite module)." Reinforced by **#2** (`_library.md:569`, ServersModule owns servers/server_members/channels/categories/bans) and the Modules section (`_library.md:57`, ServersModule owns `invites`). `_library.md:5`: "This document wins on any conflict across branches."
- **DRIFT:** `P-3-plan.md:8` proposes "InvitesModule (apps/api/src/invites/)" — a standalone module directory. The spec AC for c7443638 hedges ("ServersModule/InvitesModule"), but the locked architecture is unambiguous and authoritative.
- **CONFIRMED.** B MUST fold invite logic (service + controller + Drizzle schema for the `invites` table and the `servers.invite_code` column) into **ServersModule** — not a new `apps/api/src/invites/` module. The `invites` schema file co-locates with the existing `servers.ts` schema (extend or sibling under the same module). Flag B-block.

### Claim 7 — Carry-forward B: re-join must NOT double-increment `uses` (ordering defect) — **CONFIRMED (binding B + T-8 constraint)**
- This is a **real defect in the P-3 plan's stated ordering**, not a hypothetical. `P-3-plan.md:13` describes: conditional `UPDATE … uses=uses+1 … RETURNING server_id` **first**, then `INSERT server_members … ON CONFLICT DO NOTHING`. For an **already-member re-join**, that order increments `uses` even though the membership INSERT is a no-op — directly violating spec AC 77e2041a ("re-join = no-op 200, doesn't double-increment") and edge-case "re-join existing member → 200 no-op."
- **CONFIRMED.** Correct ordering for B (ad-hoc code path): attempt the membership INSERT first and detect whether it created a new row — e.g. `INSERT … ON CONFLICT (server_id,user_id) DO NOTHING RETURNING id`; **only if a row is returned (genuinely-new membership)** perform the conditional `uses` increment. If no row returned (already a member), short-circuit to 200 with no increment. The whole sequence stays in one transaction so the atomic `max_uses` guard (Claim 5) still holds for genuinely-new joins. T-8 MUST add a test: re-join by an existing member does not advance `uses`; and the `max_uses=1` concurrency test must use *distinct* users (not a re-joining user) to exercise the real overshoot guard. Flag B-block + T-8.

### Claim 8 — Specialists present in AGENTS.md — **VERIFIED**
- `head-designer` ✓, `backend-developer` ✓, `postgres-pro` ✓ (plan's "database-administrator/postgres-pro" — `postgres-pro` is the registered Drizzle/Postgres agent), `react-specialist` ✓ — all present in `command-center/AGENTS.md`. VERIFIED.

### Claim 9 — Antipatterns (gold-plating / claimed-but-fake) — **VERIFIED clean**
- **Two-tier invites are NOT gold-plating.** Locked as arch **#4** (`_library.md:571`): permanent `servers.invite_code` + ad-hoc time/use-limited `invites`, single preview endpoint resolves both. This is the standard Discord-aligned pattern. Gemini's "dual-source complexity" flag is acknowledged but **not a defect** — it is a deliberate, locked architectural decision with a clear rationale (permanent share-link UX + revocable ad-hoc access control), and the complexity is bounded (one extra column + one branch in the preview/join resolver). Defensible.
- No RBAC / kick-ban / server-settings / realtime in scope — spec + plan both explicitly defer (spec note line, plan lines 1-2 / 16-26). No scope creep.
- **No claimed-but-fake:** this is a pre-build plan; nothing is asserted as already implemented. The `design/invite-join.html` artifact referenced by spec 72fc08ea **exists** (`design/invite-join.html`, 24871 bytes) — the D-block "validate/compose" framing (P-3 line 17) is accurate, not a fabricated dependency.

---

## Summary

| # | Claim | Result |
|---|-------|--------|
| 1 | CSPRNG 128-bit base64url codes | VERIFIED |
| 2 | No global AuthGuard → un-guarded GET is public | VERIFIED |
| 3 | AuthGuard = verified-only (EmailVerification REQUIRED); NoVerify scoped to /me+/profile | VERIFIED |
| 4 | `UNIQUE(server_id,user_id)` backs idempotent ON CONFLICT re-join | VERIFIED |
| 5 | Atomic conditional `UPDATE … WHERE uses<max_uses RETURNING` | VERIFIED |
| 6 | **Carry-forward A** — invites in ServersModule, not standalone (arch #3) | CONFIRMED — binding B constraint (P-3 drifts) |
| 7 | **Carry-forward B** — no double-increment on re-join (ordering) | CONFIRMED — binding B + T-8 constraint (P-3 line-13 ordering is defective as written) |
| 8 | Specialists in AGENTS.md | VERIFIED |
| 9 | No gold-plating / claimed-but-fake; two-tier defensible | VERIFIED clean |

**Gate disposition:** APPROVE. The two carry-forwards are not gate-blockers (the spec ACs already mandate the correct behavior and the architecture is authoritative), but they MUST be carried into the B-block brief as binding constraints, because the P-3 plan as written drifts on both (proposes a standalone InvitesModule; proposes an increment-then-insert ordering that double-counts re-joins). Head-product should attach both to the B-0/B-2 handoff and T-8 should own the re-join non-increment + distinct-user concurrency tests.
