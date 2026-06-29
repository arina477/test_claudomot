# P-4 Phase 2 — Spec-drift verification (jenny)

**Wave 9 — M2 invite-completion (multi-spec, 3 blocks)**
**Verdict: APPROVE**

Independently verified the spec contract (task `863c10ef` YAML head, claims `08ff762f` + `5331b7d5`), the P-3 plan, the M2 milestone prose (DB), and the wave-9 BOARD binding (`product-decisions.md:149-156`) against the actual codebase. All three block specs faithfully encode the BOARD binding conditions and the milestone scope; no gold-plating; no RBAC pull-forward.

## Per-block findings

### 08ff762f — 8a backfill (servers.invite_code) — MATCHES
- AC mandates a **committed app-side BACKFILL SCRIPT** (NOT pure-SQL migration), idempotent (`WHERE invite_code IS NULL` → re-run no-op), per-row 23505 collision-retry vs `UNIQUE(invite_code)`, CSPRNG `randomBytes(16).toString('base64url')`, run at C-2 — NOT auto-migrate-on-boot.
- Matches the BOARD binding verbatim (`product-decisions.md:154`: idempotent + collision-safe + CSPRNG + committed migration + re-runnable).
- Grounded in real code: generator at `apps/api/src/servers/servers.service.ts:25`; 23505 retry pattern at `:223-225`. `pgcrypto` correctly noted unavailable → app-side generator reused. Schema `servers.invite_code` is UNIQUE (`apps/api/src/db/schema/servers.ts:11`), so the collision-safety requirement is real, not theoretical.
- Minor (cosmetic, non-blocking): the P-3 plan **commit subject** (`a112b4a`) says "gen_random_bytes" — a stale carry-forward. The P-3 plan *body* (`P-3-plan.md:4`) and all spec ACs correctly reject gen_random_bytes for the locked app-side pattern. Spec content is internally consistent; only the commit message is stale. No rework needed.

### 5331b7d5 — 8b share modal permanent-default — MATCHES
- AC: modal shows the server's PERMANENT `servers.invite_code` as the default link; does NOT mint a fresh ad-hoc invite on every open; ad-hoc (max_uses/expiry) demoted to explicit secondary; NULL-code graceful fallback; copy+Toast retained.
- Matches the wave-8 8b drift-fix intent and the two-tier-invite architecture decision (`product-decisions.md:36` item 4).
- Drift target confirmed real: `apps/web/src/shell/InviteShareModal.tsx:81-90` currently calls `createInvite(serverId)` inside a `useEffect` on open — exactly the ad-hoc accumulation the spec stops. The fix is correctly scoped to the actual defect.

### 863c10ef — invite-revoke (seed) — MATCHES
- AC: owner/creator-gated revoke (`servers.owner_id` OR `invites.created_by`, else 403), `invites.revoked=true`, idempotent re-revoke; revoked → 404 on BOTH preview and join; honest revoked-link UI affordance + confirm + Toast.
- Matches the BOARD binding: server-side re-derived authz never from client-supplied id (`:155`), honest "link no longer works" affordance (`:155`), invite-lifecycle completion.
- Grounded in real code: `invites.revoked` col (`schema/invites.ts:18`), `invites.created_by` (`:12`), `servers.owner_id` (`schema/servers.ts:8`) all exist. Wave-8 read path already filters revoked — `servers.service.ts:374` (`AND NOT invites.revoked`) and the `invite.revoked` 404 guard at `:38` — so the "confirm both honor it" AC is verifiable, not aspirational.
- T-8 correctly flagged (revoke = access-control surface).

## Scope / deferral — CORRECT
- **NO RBAC**: milestone success-metric "see the right channels per role" is RBAC and is explicitly deferred to wave-10 unconditionally per BOARD binding (`product-decisions.md:153`). Spec and plan both state RBAC = wave-10; `revoke` authz uses owner_id||created_by with "RBAC-admin deferred to wave-10" — **no role_id pull-forward**. Confirmed: no `role_id` / role-table code in this branch (git log + grep clean).
- kick/ban, server-settings: out of scope, not pulled in. Correct.
- No gold-plating: 8b "generate limited invite" is optional-secondary, not built out; permanent-code rotation explicitly out of scope (revoke applies to `invites`-table rows only — stated in the revoke edge-cases).

## Gemini-flag disposition — ACCEPTABLE FOLLOW-UP (not a blocking gap)
**Flag:** 8b makes the permanent `servers.invite_code` the default link, but revoke only covers ad-hoc `invites` rows → a leaked permanent link is irrevocable (no rotate-permanent endpoint this wave).

**Disposition: legitimate observation, correctly out of scope for wave-9. Do NOT add a rotate-permanent endpoint here.** Reasoning:
1. **Stated scope is explicit and bounded** — the spec names ad-hoc revoke + the 2 drift fixes; permanent-code rotation is *deliberately* excluded in two places (revoke AC edge-cases + P-3 plan:11). Pulling rotation in would be the exact scope-creep P-4 exists to catch.
2. **Zero exposure** — 0 prod servers (per 8a AC). No permanent code has been shared, so nothing is leakable today. The risk is forward-only.
3. **The two-tier model is the mitigation by design** — the BOARD-locked architecture (`product-decisions.md:36`#4) gives organizers ad-hoc invites *with* revoke for any link they actually distribute; the permanent code is the low-friction default, and rotation is a natural, cheap H2/later-polish follow-up, not a wave-9 completeness requirement.
4. **No spec contradiction** — the spec does not *claim* to make all invite links revocable; it claims ad-hoc revoke. The flag is a future-feature suggestion, not unmet AC.

**Recommended (non-blocking):** track "rotate/regenerate permanent invite_code" as an M2 seed candidate for a later polish wave (alongside the 3 deferred test/E2E follow-ups), so it is captured rather than lost. This belongs in N-1 triage, not a wave-9 rework.

## Recommendation
APPROVE for P-4 gate. No spec rework required. One cosmetic note (stale "gen_random_bytes" in the P-3 commit subject) and one tracked follow-up (permanent-code rotation) — neither blocks. Build proceeds 8a → 8b → revoke as specced.
