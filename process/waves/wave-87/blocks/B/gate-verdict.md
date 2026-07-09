# Wave 87 — B-6 Verdict

**Reviewer:** head-builder (fresh spawn)
**Reviewed against:** process/waves/wave-87/blocks/B/review-artifacts.md
**Attempt:** 1  (1 = first gate, 2+ = post-rework)

## Verdict
APPROVED

## Rationale
The implementation matches the spec contract and the P-3 plan exactly, and every acceptance criterion is satisfied by construction plus a load-bearing test. The plan mandated a single shared private resolver `resolveDefaultRoleId(tx, serverId)` plus a one-line `role_id` stamp on each of the two existing join inserts, deliberately NOT factoring a fully-shared `insertMembership` helper (plan Alt-C rejected) so each call site keeps its own `onConflictDoNothing`/`returning` shape — the diff does precisely this (`servers.service.ts` +38/-2), no more. The resolver is correct against the schema I verified directly: `roles` has `is_default boolean NOT NULL default false` and `position integer NOT NULL default 0` (`db/schema/servers.ts:47,54`), and `server_members.role_id` is an existing nullable `uuid` FK with `onDelete: 'set null'` (`:68`) — so no schema/migration is needed and B-0/B-1 SKIP are correct. Four independent correctness checks pass: (1) **LIMIT 1 is genuinely load-bearing** — there is no unique index on `(server_id, is_default)`, so multiple default rows are schema-possible; `.orderBy(asc(roles.position), asc(roles.id)).limit(1)` picks deterministically, and all default roles carry identical all-false flags so the choice is permission-immaterial (AC edge-case satisfied). (2) **Null fallback never throws** — `row?.id ?? null` returns null for a zero-default legacy server, and both call sites insert `role_id: null`, preserving pre-change behavior (AC3). (3) **`onConflictDoNothing` genuinely preserves an existing member's role on re-join** — neither join path issues any UPDATE to `server_members.role_id`; the insert is skipped on conflict, so an already-assigned role is never reset to default (AC4 holds by construction, confirmed by the public-join test asserting the tx mock has no `update` method at all). (4) **Transaction handle is used correctly** — resolution runs on the same `tx` inside the already-open transaction, after `serverId` is resolved in both the ad-hoc (`:763`) and permanent (`:778`) invite branches, so the resolver always receives the correct server id; the `.returning()` → `newMemberJoined` → conditional atomic use-count consume (`:787-812`) is entirely untouched, so AC5 (use-count/gating/counts unchanged) holds. The tests are real tripwires, not coverage theater: B-5 records a verified revert-check where reverting the production `role_id` stamp turned AC1/AC2/AC3 red (5 failures) while AC4 stayed green, and the tests capture the actual `.values(...)` argument passed to the insert rather than mocking the system under test. 828/828 unit green, typecheck + build + biome clean. No unguarded door (this is behavior-preserving data-hygiene, correctly reframed at P-0 as NOT a security change — RBAC already treats NULL ≡ default-Member; `wave_touches` excludes auth so no P-4 security-tightened gate applies), no contract drift (no API/type/schema change), no gold-plating (the over-abstraction was explicitly declined), and no deviation from plan (B-2 logs `deviations: none`; the only follow-up was a doc-comment reposition). No `/review` (Phase 2) blocker anticipated.

## Cascade
n/a (APPROVED — no rework)

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 2
