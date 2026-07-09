# Wave 87 — V-3 Verdict

**Reviewer:** head-verifier (fresh spawn, Phase-1 gate)
**Reviewed against:** process/waves/wave-87/blocks/V/review-artifacts.md
**Attempt:** 1  (1 = first gate)

## Verdict
APPROVED

## Rationale
Karen APPROVE and jenny APPROVE both hold under independent spot-check — this was not a rubber stamp. Against `origin/main` (`509aae84`, deployed prod at merge `1d2ef9df`) I re-verified every load-bearing claim rather than accepting the reviewers at face value: `resolveDefaultRoleId` exists verbatim at `servers.service.ts:697-709` (SELECT `is_default=true`, `ORDER BY position ASC, id ASC`, `LIMIT 1`, `row?.id ?? null`, never throws); both `joinPublicServer` (:743) and `joinViaInvite` (:789, ad-hoc + permanent branches converging to one insert) stamp `role_id: roleId`; `.onConflictDoNothing()` is preserved on both inserts so re-join never restamps; PR #107 changed no schema/migration file (the only match was a process doc, not a Drizzle/migration file); the seeded default 'Member' role carries every management flag `false` (`servers.service.ts:102-110`). The behavior-preservation crux (AC5) is real: RBAC `can()` at `rbac.service.ts:80-81` does `if (!member.role_id) return false` (default-deny), so a NULL role and an all-false default role produce an identical permission surface on every gated route — no user-visible change, as designed. The T-4 integration spec is real and merged (4 AC cases against real Postgres; case 4 pre-stamps a DISTINCT 'Moderator' role, the strongest possible restamp tripwire), and PR #108 touches zero production code, so its failing `e2e` job cannot be a wave-87 regression. Karen's independently-reproduced unit tripwire is corroborated: the spec asserts `role_id: 'role-default-1'` (AC1/AC2) and `role_id: null` (AC3) explicitly — reverting the stamp flips exactly those red, so these are genuine regression tripwires, not coverage theater. V-2 triage is sound: 0 blocking, 2 correctly non-blocking, 0 noise, empty fast-fix queue. Both non-blocking findings were verified against source and correctly classified — the e2e flake (`delete-any-message.spec.ts`, moderator realtime/UI) is unrelated to server-join and rides a non-required check that did not gate the merge; the educator-analytics "No role" bucket (`educator-analytics.service.ts:104-113`, `role_id IS NULL` count, emitted only when > 0) empties for fully-roled servers but still reconciles to `memberCount` (members moved, not dropped or duplicated) — a correction of the prior NULL-on-join drift and a spec-gap outside AC5's "permission surface" wording, correctly routed to a product confirm-or-retire task (2c4fe8c3), not silently patched. No acceptance-by-assertion, no spec drift, no reviewer false-negative, no green-by-suppression. One cosmetic note (non-blocking, no rework): jenny cited the RBAC file as `servers/rbac.service.ts` when it actually lives at `rbac/rbac.service.ts` — the line numbers (80, 361) and the behavior she described are exactly right, so the finding is real; only the directory prefix in the citation is off.

## Cascade
Not applicable (APPROVED — no rework).

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
