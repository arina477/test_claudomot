# Wave 29 — P-2 Spec (pointer)

**Source of truth:** YAML head + prose in `tasks.description` for row **d23a0740-0326-4748-a158-62e69ea733e7**. This is the convenience copy.

- **wave_type:** single-spec · **claimed_task_ids:** [d23a0740] · **design_gap_flag:** false

## Acceptance criteria (copy)
1. Empty email local-part (email `@…` or malformed) + null display_name → displayName falls through to userId, never `''` (presence.gateway.ts + servers.service.ts).
2. Normal email + no display_name → local-part used (happy path unchanged).
3. Non-null display_name → that value (unchanged).
4. `ServerMembersResponseSchema` + `ServerMembersResponse` type + barrel re-export DELETED from packages/shared; repo + shared typecheck green (zero source consumers).
5. GET /servers/:id/members wire unchanged — bare `ServerMember[]`.

## Contracts (copy)
- **Types:** DELETE `ServerMembersResponseSchema` (servers.ts:66-68) + `ServerMembersResponse` (:69) + barrel re-export (index.ts:23). Verify 0 source consumers first.
- **API:** GET /servers/:id/members — no change (bare `ServerMember[]`).
- **Data/SDK:** none.

## Edge cases (copy)
- `@example.com` → `''` → falls through; `''`/malformed → falls through.
- Fix: middle `??` → `||` at both sites (presence.gateway.ts:125, servers.service.ts:249).
- If a live consumer of the schema is found at B → align-to-bare-array instead of delete + note deviation.

## Keep-OUT (P-0 mvp-thinner)
No adjacent presence/members refactors — exactly the two fixes.

→ P-3 Plan.
