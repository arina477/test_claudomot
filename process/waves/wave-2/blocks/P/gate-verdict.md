# Wave 2 — P-4 Verdict

**Reviewer:** head-product (fresh spawn, agentId head-product-wave2-p4-phase1)
**Reviewed against:** process/waves/wave-2/blocks/P/review-artifacts.md
**Attempt:** 1  (1 = first gate, 2+ = post-rework)
**Phase:** 1 (head-product)

## Verdict
REWORK

## Rationale
The framing, decomposition, acceptance criteria, security specification, and dependency sequencing are all build-ready and genuinely strong — the 9 ACs are falsifiable and observable, every non-happy path is named (duplicate email, wrong credentials, expired/used tokens, refresh-revoke, Resend send-failure, Postgres/core unreachable), the security-scope surface is specified to the tightened gate's bar (httpOnly + SameSite=Lax + Secure-in-prod cookies, anti-CSRF per the Lax default, self-generated vs founder-supplied secret split per rule 6, rate-limiting explicitly routed to T-8), scope is correctly held to SuperTokens recipe defaults with no MFA/OAuth/roles gold-plating, and the DB-before-auth ordering with the SuperTokens-core-needs-Postgres dependency is sequenced correctly. However, one load-bearing defect blocks the gate: the spec and plan introduce a NEW `profiles` table (apps/api/src/db/schema/profiles.ts, user_id PK) created by a post-signup hook, which directly contradicts the locked architecture. The architecture library — which "wins on any conflict across branches" — assigns the app user record to the `users` table owned by UsersModule (line 56; auth-dataflow line 515 says "UsersModule creates row in `users` table with matching id"), and resolved cross-branch decision #5 (line 572) states explicitly: "single `users` table ... No separate `profiles`/`privacy_settings` tables." Building `profiles` now plants a parallel, divergent schema substrate that every later M-block (UsersModule, profile reads, who-can-DM enforcement) would either consume incorrectly or have to migrate off. This is the architecture-blind-plan anti-pattern and must be reconciled before any code is written.

## Rework instructions

### Stages requiring rework
- P-2: replace the new `profiles` table with the architecture-locked `users` table (owned by UsersModule) in the spec contract (AC-1, contracts.data) embedded in tasks.b9118041.description.
- P-3: re-derive the data-model + file-level steps from the corrected spec (users table, UsersModule ownership) and re-route schema-file ownership accordingly.

### Per stage

#### P-2
- **What's wrong:** The spec contract (YAML head of tasks.b9118041, AC-1 + contracts.data) creates a standalone `profiles` table keyed by SuperTokens userId. The locked architecture mandates a single `users` table owned by UsersModule and explicitly forbids a separate `profiles` table (architecture _library.md decision #5, line 572; UsersModule ownership line 56; auth-dataflow line 515).
- **Heuristic fired:** Architecture-blind plan / spec-vs-architecture drift — the spec invents a parallel persistence mechanism for a record the locked architecture already assigns to an existing table + module.
- **What "good" looks like:** AC-1 reads "...a row appears in the app `users` table (owned by UsersModule), keyed by the SuperTokens userId." contracts.data names the `users` table (user_id PK = SuperTokens userId, email unique, display_name nullable, created_at, updated_at — plus room for the architecture's profile_visibility / who_can_dm columns which UsersModule owns, even if unused this wave) at apps/api/src/db/schema/users.ts. The SuperTokens core auth tables remain core-managed (unchanged). No reference to a `profiles` table anywhere in the contract.
- **Re-do instructions:**
  1. Open the spec contract in tasks.b9118041.description (YAML head). In AC-1, change "profiles table" → "`users` table (owned by UsersModule)".
  2. In contracts.data, rename the Drizzle table from `profiles` → `users`; schema file path from `apps/api/src/db/schema/profiles.ts` → `apps/api/src/db/schema/users.ts`. Keep user_id (PK, = SuperTokens userId, text), email (unique), display_name (nullable), created_at, updated_at. Optionally note that architecture-owned profile_visibility / who_can_dm columns belong on this table but are out of scope this wave (UsersModule populates them later) — do NOT add a separate table for them.
  3. Leave the "SuperTokens self-hosted core owns its own auth tables" line untouched (that is correct and unchanged).
  4. Re-write the convenience pointer at process/waves/wave-2/stages/P-2-spec.md AC-1 to match (users table, not profiles).
  5. Confirm no other AC or edge-case references `profiles`.

#### P-3
- **What's wrong:** The plan's Data model section + B-1 step + B-3 post-signup hook all reference the `profiles` table / profiles.ts and "profiles row keyed by userId," inheriting the P-2 conflict.
- **Heuristic fired:** Architecture-blind plan (downstream cascade from the P-2 spec defect).
- **What "good" looks like:** Data model section, B-1 schema step, and the B-3 post-signup hook all reference `users` (apps/api/src/db/schema/users.ts) owned by UsersModule; the unique(email) constraint stays. Specialist routing unchanged (postgres-pro / backend-developer own the users schema; supertokens-integration owns the post-signup hook that inserts the users row). Self-consistency sweep item 6 (data+API contracts concrete) re-verified against the corrected table name.
- **Re-do instructions:**
  1. In the Data model section, replace every `profiles` → `users` and `profiles.ts` → `users.ts`; keep the column set and unique(email).
  2. In B-1, change the schema-file path to apps/api/src/db/schema/users.ts.
  3. In B-3, change "inserts the app profiles row" → "inserts the app users row (UsersModule-owned schema)."
  4. Re-run the self-consistency sweep (items 1, 6) and confirm AC-1 still maps to a concrete step against the `users` table.

### Cascade

P-block cascade rules (apply where the rework stage is the trigger):

- **Trigger stage:** P-2 spec → P-3 (approach + plan derive from spec).
- **Stages that must re-run after the above:** P-3 (data model + B-1 + B-3 steps, already itemized above).
- **Stages that stay untouched:** P-0 frame (framing, founder-bet mapping, scope-hold, and dependency sequencing are all correct and unaffected), P-1 decompose (single-spec, design_gap_flag=false, claimed_task_ids unchanged — the rename does not alter bundle shape).

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 2

---

# Wave 2 — P-4 Verdict

**Reviewer:** head-product (fresh spawn, agentId head-product-wave2-p4-phase1-attempt2)
**Reviewed against:** process/waves/wave-2/blocks/P/review-artifacts.md
**Attempt:** 2  (1 = first gate, 2+ = post-rework)
**Phase:** 1 (head-product)

## Verdict
APPROVED

## Rationale
The single load-bearing defect that blocked attempt 1 — a net-new `profiles` table contradicting locked architecture decision #5 (single `users` table owned by UsersModule; no separate `profiles`/`privacy_settings` tables) — is fully resolved across every surface the rework instructions named. The spec data-contract in tasks.b9118041.description now reads "single `users` table (UsersModule-owned, per architecture decision #5 — NO separate profiles table)" at apps/api/src/db/schema/users.ts (id PK = SuperTokens userId, email unique, display_name nullable, created_at, updated_at), and AC-1 now asserts a row in "the app users table (UsersModule-owned) keyed by the SuperTokens userId"; the SuperTokens-core-owns-its-own-auth-tables line is preserved untouched. P-3 is consistent end-to-end: the Data model section (users at schema/users.ts, UsersModule-owned, decision #5 cited, unique(email) kept), the B-1 schema step (schema/users.ts), the B-3 UsersModule step (owns users table, inserts the users row on signup), and the parallelization map + self-consistency sweep item 6 all reference `users`, never a `profiles` table. This now matches _library.md decision #5 (line 572) and the auth dataflow (line 515, "UsersModule creates row in `users` table"). Two residual `profiles` strings remain but neither is load-bearing or a contradiction: P-1-decompose.md line 7 is a stale primitive-count parenthetical inside a sizing rubric on a stage attempt 1 explicitly left untouched (it does not define the data contract, does not flow to the build, and the rubric's PROCEED verdict is unaffected); P-0-ceo-reviewer.md line 17 is the milestone's own feature-name title "M1 Foundation (app shell, auth & profiles)" — the product feature "user profiles," not a database table. Everything validated at attempt 1 still holds and was re-confirmed: 9 falsifiable, independently verifiable ACs with every non-happy path named (duplicate email, wrong credentials, expired/used verify+reset tokens, refresh-revoke, Resend send-failure, Postgres/core unreachable); the security-scope tightened gate is specified to bar (httpOnly + SameSite=Lax + Secure-in-prod cookies, anti-CSRF per the Lax default, self-generated vs founder-supplied secret split per rule 6, verify/reset token flows, rate-limit explicitly routed to T-8); scope held to SuperTokens recipe defaults with no MFA/OAuth/account-linking/roles gold-plating; DB-before-auth ordering with the core-needs-Postgres dependency sequenced correctly; specialists present in AGENTS.md; deps versioned. No new defects introduced by the fix.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 1

---

# Wave 2 — P-4 Verdict

**Reviewer:** head-product (fresh spawn, Phase-2 merge + Gemini-CONCERN triage)
**Reviewed against:** process/waves/wave-2/blocks/P/review-artifacts.md
**Attempt:** 2  (post-rework; Phase 1 APPROVED attempt 2)
**Phase:** 2 (Karen + jenny + Gemini merged)

## Verdict
APPROVED — gate PASS

## Rationale
Phase 1 = APPROVED (attempt 2). Phase 2 reviewers: Karen APPROVE (load-bearing claims verified), jenny APPROVE (no spec-vs-bet / spec-vs-journey drift), Gemini = one material CONCERN — cross-service user-creation atomicity: a post-signup-hook failure after the SuperTokens auth user is created leaves a partially-provisioned user (auth user exists, no `users` row). jenny independently flagged the same as spec-gap G-1. The concern is real (canonical two-systems-no-shared-transaction hazard, inherent to SuperTokens-core-owns-auth-tables + UsersModule-owns-`users`-table) but is now adequately addressed at the spec level and does NOT require P-stage rework. The spec (tasks.b9118041.description edge-cases) now encodes G-1 with a binary acceptance bar ("a partially-provisioned user must not persist"), two architecturally-sound bounded strategies — (a) insert the `users` row inside the SuperTokens signUpPOST/functions override so a DB failure fails the signup (fail-closed, no orphan auth user; this is a superset of Gemini's own compensation-logic SUGGESTION), or (b) lazy self-heal where `/me`/verifySession creates the missing row on first authenticated hit — and explicit downstream validation routing (T-8 Security + V-block). This is exactly what a spec should deliver: a known, well-scoped B-block implementation requirement with a verifiable invariant and named validation gates; the (a)-vs-(b) choice is correctly deferred to B-block against the captured invariant. P-3 already supports it — B-3 names the signUpPOST/functions override owned by supertokens-integration, the home for strategy (a) — so no plan rework is needed. Forcing further P-stage rework would be spec gold-plating. Two reviewer nits also resolved: migrations path aligned to apps/api/drizzle/migrations (per _library.md resolution #14); db:seed noted to need a tsx devDep.

## Phase 2 reviewer matrix
| Reviewer | Verdict | Effect |
|---|---|---|
| Karen | APPROVE | load-bearing claims verified; proceed |
| jenny | APPROVE (G-1 independently flagged, now encoded in spec) | no unresolved drift; proceed |
| Gemini | material CONCERN — triaged, addressed at spec level (G-1 edge-case + acceptance bar + T-8/V-block routing); NOT material enough for P-stage rework | log + proceed |

## Security-scope tightened gate
APPLIES (wave_touches ∩ {auth, sessions, cookies, user-creation} ≠ ∅). Forced-second-Phase-2-iteration trigger did NOT fire: requires first Phase 2 = BLOCK with >2 medium-or-higher findings; actual = Karen APPROVE + jenny APPROVE + 1 advisory Gemini CONCERN (now encoded) = zero BLOCK, one advisory finding, below threshold. No forced iteration. T-8 Security MUST still run downstream (carried-forward obligation); the G-1 edge-case explicitly routes to it.

## Gate-pass evidence
- Phase 1 head-product verdict = APPROVED (attempt 2)
- Phase 2: Karen APPROVE, jenny APPROVE, Gemini CONCERN triaged + cleared
- Spec contract present in tasks.b9118041.description as YAML head + `---` + prose (P-2 Action 5)
- design_gap_flag = false → next block is B-0 (no D-block)

## Footer
- verdict_complete: true
- gate: PASS
- rework_attempt_cap_remaining: 1
- next: B-0 Branch & schema (design_gap_flag=false)
