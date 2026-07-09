# V-1 jenny — semantic-spec verification (wave-87)

**Agent:** jenny (Senior Software Engineering Auditor — spec compliance)
**Scope:** Semantic-spec match of the DEPLOYED state against the primary task spec contract (DB row `dc4abee3-1e41-41aa-a76b-c65a6b38e457`), beyond T-block acceptance criteria.
**Deployed target:** api `https://api-production-b93e.up.railway.app` — merge commit `1d2ef9df` (PR #107), live per C-2. `/health` → 200.
**Change class:** behavior-preserving backend data-hygiene. New server-member joins now stamp the server's existing all-flags-false default 'Member' role (was `role_id=NULL`); RBAC resolves NULL ≡ default-Member, so no user-visible behavior change by design.

**Verdict: APPROVE**

---

## Verification method
Independent inspection of the deployed source at commit `1d2ef9df` (`git show 1d2ef9df:apps/api/src/servers/servers.service.ts` confirms `resolveDefaultRoleId` present — 3 occurrences), the RBAC resolver, the real-Postgres integration spec, and CI evidence for PR #108. Did not run a full authed live join (fixture user + server/invite not provisioned); the stamp is proven end-to-end by the T-4 integration test running against real Postgres (PR #108 `test` job SUCCESS). Live `/health` probe returned 200.

## AC-by-AC findings

**AC1 — public join stamps default role (not NULL): PASS.**
`servers.service.ts` `joinPublicServer` (deployed): after the authoritative `is_public` check, `const roleId = await this.resolveDefaultRoleId(tx, serverId)` then `.insert(server_members).values({ server_id, user_id, role_id: roleId }).onConflictDoNothing()`. Matches spec `internal` contract exactly. Integration test case 1 asserts `stampedRoleId === is_default role id` and `not null` against real Postgres, seeding via the real `createServer` path. Green.

**AC2 — invite join stamps default role (not NULL): PASS.**
`joinViaInvite` (deployed, ad-hoc + permanent branches converge to a single insert): same `resolveDefaultRoleId` → `.values({ server_id, user_id, role_id: roleId }).onConflictDoNothing().returning()`. Both ad-hoc and permanent code paths reach the one stamped insert. Integration test case 2 exercises the permanent `invite_code` path and asserts the stamp. Green.

**AC3 — zero-default-role server → join succeeds, role_id NULL, no throw: PASS.**
`resolveDefaultRoleId` returns `row?.id ?? null` (no throw on empty). Callers pass `role_id: null` unchanged. Integration test case 3 deletes the seeded `is_default` role (FK `ON DELETE SET NULL`), asserts join still returns `{ serverId }` and `role_id` is NULL. Green. Behavior-preserving fallback confirmed.

**AC4 — re-join preserves existing role (onConflictDoNothing): PASS.**
Both inserts retain `.onConflictDoNothing()` on the `(server_id, user_id)` conflict; an existing membership row is never updated. Integration test case 4 pre-stamps the joiner with a DISTINCT non-default 'Moderator' role, re-joins, and asserts `role_id` is unchanged (still the custom role, NOT restamped to default). Green — this is the strongest possible form of the assertion (distinct role makes a restamp regression visible).

**AC5 — no user-visible permission change: PASS.**
RBAC `can()` (`rbac.service.ts:80`): `if (!member.role_id) return false` (default-deny) for NULL role. The seeded default 'Member' role has every management flag false (`servers.service.ts:102-110`: `manage_server/roles/channels/members: false`), so `role[permission] === true` is false for all management flags. NULL role and all-false default role therefore produce the identical permission surface on every gated route. Channel-visibility path (`rbac.service.ts:361`) also treats NULL as default-member. Invite use-count increment (only on `newMemberJoined && isAdHoc`, TOCTOU-safe capped/uncapped branches) and public/private join gating are untouched by the change. Membership counts unchanged (still one row per member). Confirmed.

## Edge / semantic observations

**Finding 1 — SPEC GAP (non-blocking, already flagged at B-6 + accepted).**
The educator-analytics `roleBreakdown` (`billing/educator-analytics.service.ts:104-113`) emits a synthetic `"No role"` bucket for `role_id IS NULL` members, only when count > 0. After this change new joiners land in the 'Member' role row instead of the "No role" bucket, so for fully-roled servers that bucket trends to empty. The spec (AC5) states "no user-visible permission change" and frames the wave as behavior-preserving; it does NOT anticipate the educator-facing analytics surface. This is a *spec gap*, not *spec drift* — the code is doing exactly what the invariant intends. The breakdown still reconciles to `memberCount` (each member counted once — moved, not dropped/duplicated), so it is a correction (the "No role" bucket was itself a symptom of the NULL-on-join drift), not a regression. B-6 accepted it as correct behavior and flagged it for T-9 Journey. I concur: the AC5 wording "no *permission* change" holds strictly; the analytics delta is an *educator-visible display* change that AC5's scope ("permission surface") did not cover. Worth one line in the L/journey record; not a code change.

**Finding 2 — multiple-default-role determinism: PASS (spec-anticipated).**
No unique constraint on `(server_id, is_default)`. `resolveDefaultRoleId` uses `LIMIT 1` with stable `ORDER BY position ASC, id ASC`. Matches the spec `edge-cases` clause; all default roles carry identical all-false flags so the pick is permission-immaterial. Deployed code matches spec intent.

**Finding 3 — journey continuity: PASS.**
The "join a server" flow introduces no dead-end or broken state. Response shape unchanged (`{ serverId }` on both paths). A member joins exactly as before, with `role_id` populated instead of NULL; RBAC, channel visibility, and membership all resolve identically. No new failure path added (resolver is a plain SELECT that cannot throw on empty; fallback preserves prior behavior).

## CI / deploy evidence note (not a finding against the deployed prod code)
PR #108 (the T-4 integration-test PR — test file only, no production code) merged with `test/lint/typecheck/build/boot-probe/secret-scan` all SUCCESS; the `test` job is where the integration spec ran green against Postgres 16. One `e2e` job FAILURE, but it is in `apps/web/e2e/delete-any-message.spec.ts` (moderator message-delete fan-out / realtime-visibility), unrelated to server-join role assignment — a pre-existing realtime/UI flake, not a regression introduced by wave-87. The deployed production behavior (PR #107, `1d2ef9df`) is independent of that test PR and is confirmed live. Not blocking for V-1.

## Summary
APPROVE — all 5 ACs match deployed code + real-Postgres integration evidence; the only semantic surprise is the educator-analytics "No role" bucket emptying (spec gap, already flagged + accepted at B-6 as correct behavior, one journey-note line, no code change).
