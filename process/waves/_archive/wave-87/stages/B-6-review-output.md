# Wave 87 — B-6 /review output (Phase 2)

**Scope:** code diff of `wave-87-join-default-role` vs `main` — `apps/api/src/servers/servers.service.ts` (+40) and `servers.service.spec.ts` (+193). Remainder of the 835-line diff is process/docs artifacts (not code-reviewed). Specialist-army + Codex passes not dispatched: the reviewable production surface is 40 lines and already cleared by the multi-agent gate (head-product + karen + jenny + head-builder), so a 7-specialist + cross-model army is disproportionate. Ran the critical structural pass + the mandated outside-diff Enum/Value-Completeness scan.

## Critical pass (SQL safety / races / trust boundary / enum-value completeness / shell)
- **SQL & Data Safety:** VERIFIED SAFE. `resolveDefaultRoleId` uses Drizzle parameterized `eq`/`and`/`asc` — no string interpolation, no raw SQL. (confidence 9/10)
- **Race / Concurrency:** VERIFIED SAFE. Role resolution + insert run inside the SAME existing transaction; `onConflictDoNothing` unchanged (membership-dup race still handled; re-join preserves existing role, no reset path). No new race. (confidence 9/10)
- **Trust boundary / Shell / LLM:** N/A — no LLM output, no shell, no external input beyond the already-validated serverId/userId. (confidence 10/10)
- **Enum & Value Completeness (outside-diff scan):** grepped every `role_id` NULL-dependence across apps/api + apps/web + packages. RBAC consumers (`rbac.service.ts:80/314`, `moderation.service.ts:164`, `messages.service.ts:1803`) all use `if (!member.role_id)` to treat a member as implicit base / default-deny-management; a member with the all-false default 'Member' role resolves IDENTICALLY (role lookup returns all-false flags), so NO regression. `backfill-roles.ts` `WHERE role_id IS NULL` correctly no-ops for new members (they now have a role). (confidence 9/10)

## Findings
- **[INFORMATIONAL] (confidence 8/10) `apps/api/src/billing/educator-analytics.service.ts:104-113`** — the `roleBreakdown` analytics has a synthetic "No role" bucket keyed on `isNull(server_members.role_id)`, emitted only when `> 0`. After this change new joiners carry the default 'Member' role, so they count under the 'Member' role row instead of the "No role" bucket, which trends to empty (only truly default-less legacy servers keep it). **Non-breaking:** the breakdown still reconciles to `memberCount` (each member counted exactly once — moved, not duplicated/dropped). This is the CORRECT consequence of the invariant — the "No role" bucket was a symptom of the NULL-on-join drift and correctly empties, matching the backfill's intent. No fix required. Refines jenny's "no user-visible change": there is one educator-facing analytics delta (the "No role" bucket disappearing for fully-roled servers), and it is a correction, not a regression.
  - **Action:** accepted (correct behavior). Flag for T-9 Journey: note the educator-analytics "No role" bucket behavior alongside retiring finding F67-T5-2.

## Verdict
No CRITICAL, no HIGH. One INFORMATIONAL (accepted — correct behavior). No AUTO-FIX or ASK items. `/review` Phase 2 → PASS.
