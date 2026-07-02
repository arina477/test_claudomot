# Wave 35 — P-4 Verdict

**Reviewer:** head-product (fresh spawn, agentId head-product-w35-p4-attempt1)
**Reviewed against:** process/waves/wave-35/blocks/P/review-artifacts.md
**Attempt:** 1  (1 = first gate, 2+ = post-rework)
**Phase:** 1 (head-product)

## Verdict
REWORK

## Rationale
The P-block is aimed at a live bet (M7 privacy-first differentiation vs Discord), correctly scoped to the buildable settings-privacy slice, and the hardest call — Path A (profile-visibility enforced now; who-can-DM persisted with no privacy-theater toggle) — is faithfully carried through both spec and plan. The profile-visibility enforcement AC is honestly written as a SERVER-side response exclusion ("in the response, row/fields excluded, never client-side-only"), the who-can-DM treatment is honest (binding AC: no control appears active while enforcing nothing), data-export is self-scoped with no userId param, the Sentry PII-scrub AC and SDK pre-build checklist are present, and non-happy states (401/400/no-row-defaults/empty/DSN-unset no-op/loading-error-empty) are covered. One load-bearing defect blocks approval: the spec contract's structured `data:` field for the seed hard-specifies a separate `privacy_settings` table (user_id PK/FK, updated_at), while the P-3 plan explicitly rejects that table and commits to two additive columns on the existing `users` table. Since the spec in tasks.description is the source of truth B-0 claims against (always-on rule 7), a builder reading it will construct a table the plan never builds, while B-1's file steps modify users.ts — a guaranteed build-time divergence. The columns-on-users architecture is the correct, convention-matching choice; the fix is to align the spec's data-contract to it, not to change the plan. Narrow, single-edit rework.

## Rework instructions  (only if REWORK)

### Stages requiring rework
- P-2 spec: align the seed's `data:` contract to the settled columns-on-users data model (source-of-truth spec in tasks.description of 56a50862).

### Per stage

#### P-2 spec
- **What's wrong:** The spec contract's `contracts.data` for seed task 56a50862 reads `["privacy_settings (user_id PK/FK, profile_visibility enum default 'everyone', who_can_dm enum default 'everyone', updated_at) + Drizzle migration; enum contract locked to future DM guard"]` — a dedicated `privacy_settings` table with its own PK/FK and updated_at. P-3 Plan § Architecture deltas explicitly considers and REJECTS that exact table ("separate privacy_settings table — rejected: adds a join + a table for two scalar prefs, against convention") and instead adds `profile_visibility` + `who_can_dm` text columns (NOT NULL DEFAULT 'everyone') to the existing `users` table, validated at the Zod/app layer (no pg enums). The spec data-contract and the plan therefore prescribe two different, incompatible data models on the wave's primary task. The seed's `## Acceptance` prose is already model-agnostic ("new column/table + migration"), so only the structured `data:` line is stale — but that line is load-bearing because B-0 builds from the tasks.description contract.
- **Heuristic fired:** H-P-05 spec-vs-plan drift on a load-bearing data contract (builder's reasonable interpretation of the source-of-truth spec diverges from the plan's file steps — table vs columns).
- **What "good" looks like:** The spec's `data:` contract for 56a50862 names exactly the data model the plan will build — additive columns on `users`, text NOT NULL DEFAULT 'everyone', app/Zod-layer enum validation (not pg enums), one drizzle-kit migration, enum contract locked to the future DM guard. Spec, AC prose, and plan then agree on one data model with zero interpretive gap; Karen's Phase-2 claim check on the data contract would return VERIFIED.
- **Re-do instructions:**
  1. Query the current contract: `psql "$CLAUDOMAT_DB_URL" -At -c "SELECT description FROM tasks WHERE id='56a50862-790e-4868-a5c5-305b08b81e40';"`
  2. In the YAML head, under the seed's `contracts.data`, replace the `privacy_settings` table line with: `"two additive columns on the existing users table: profile_visibility text NOT NULL DEFAULT 'everyone', who_can_dm text NOT NULL DEFAULT 'everyone'; enum values validated at the Zod/app layer (everyone|server-members|nobody), NOT pg enums; one drizzle-kit-generated additive migration (online, backfill via default, reversible); enum contract locked to the future DM guard (feature #21)"`.
  3. Leave the `## Acceptance` prose as-is (already model-agnostic) OR tighten "new column/table" → "new columns on users"; do not touch the behavioral ACs — they are correct.
  4. Re-write the full `tasks.description` (YAML head + `---` + prose body) back to the row via UPDATE, preserving every other field verbatim.
  5. Update the convenience copy at `process/waves/wave-35/stages/P-2-spec.md` § "Key edge/error states" if it references the table (it currently says "no-row→defaults" which stays valid for the columns model — a users row always exists post-signup, so first read returns column defaults; keep the no-500 guarantee).

### Cascade

P-block cascade rules (apply where the rework stage is the trigger):

| Trigger stage | Stages that must re-run downstream |
|---|---|
| P-0 frame | P-1, P-2, P-3 |
| P-1 decompose | P-2 (claimed_task_ids), P-3 (parallelization map) |
| P-2 spec | P-3 (approach + plan derive from spec) |
| P-3 plan | (terminal — only itself) |

- **Stages that must re-run after the above:** P-3 plan — re-confirm only. P-3 already prescribes the columns-on-users model, so no substantive change is required; the re-run is a consistency check that the plan's § Data model and B-1 steps now match the corrected spec data-contract verbatim (they already do). No parallelization-map or file-step changes expected.
- **Stages that stay untouched:** P-0 frame, P-1 decompose. Bundle composition, wave_type=multi-spec, design_gap_flag=false, claimed_task_ids, and the Path A framing are all sound and unaffected.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 2

---

# Wave 35 — P-4 Verdict

**Reviewer:** head-product (fresh spawn, agentId head-product-w35-p4-attempt2)
**Reviewed against:** process/waves/wave-35/blocks/P/review-artifacts.md
**Attempt:** 2  (1 = first gate, 2+ = post-rework)
**Phase:** 1 (head-product)

## Verdict
APPROVED

## Rationale
The attempt-1 REWORK defect is resolved. The seed's structured `contracts.data` line in `tasks.description` of 56a50862 now specifies exactly the data model P-3 builds — two additive columns on the existing `users` table (`profile_visibility` / `who_can_dm`, `text NOT NULL DEFAULT 'everyone'`), enum validated at the Zod/app layer (no pg enums), one drizzle-kit migration, enum contract locked to the future DM guard — with no separate `privacy_settings` table. This is verbatim-consistent with P-3 § Data model (line 18), § Architecture deltas (which explicitly rejects the table for convention reasons), and the B-1 file steps that modify `users.ts`; the `## Acceptance` prose stays correctly model-agnostic and the behavioral ACs are untouched. A builder reading the source-of-truth spec now constructs the same schema the plan builds — the guaranteed build-time divergence is gone, and Karen's Phase-2 data-contract claim check will find spec↔plan agreement. Nothing else regressed: Path A is carried faithfully through spec and plan (profile-visibility server-enforced as an honest response-exclusion on the roster + profile-read paths; who-can-DM persisted with the binding AC that no control appears active while enforcing nothing); every AC is falsifiable and maps to ≥1 plan step; the Sentry SDK pre-build checklist and PII-scrub AC (`sendDefaultPii:false` + `beforeSend`) are present and the DSN-unset no-op keeps the build credential-independent; data-export is self-scoped with no userId param; and the non-happy states (401 / 400-invalid-enum / no-row-defaults-no-500 / empty / DSN-unset no-op / loading-error-empty across surfaces) are all specified. Framing maps to a live bet (M7 privacy-first differentiation vs Discord), the bundle is correctly scoped with design_gap_flag=false, and the security-scope tightened gate is engaged for the user-data-authz + data-export surfaces. No new blocking defect. Proceed to Phase 2 (Karen + jenny + Gemini).

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 1

---

## Phase 2 — merged verdicts (recorded by orchestrator)

| Reviewer | Verdict | Notes |
|---|---|---|
| **karen** | **APPROVE** | All 7 load-bearing claims VERIFIED against real code (users.ts text-cols, servers.service:223-253 roster+member-gate, profile self-only, shared Zod home, RRv7 inline routes, Sentry absent, DESIGN-SYSTEM §113). Non-blocking Medium: visibility selector `everyone`≡`server-members` on the only live surface → potential privacy-theater in the selector; also `@sentry@^9` may be a major behind (B verifies installed version), `email`-in-select is a displayName fallback (already stripped from response — defense-in-depth, not live leak). |
| **jenny** | **APPROVE** | No drift vs user-journey-map or product-decisions. Path A faithfully reflected; columns-on-users matches v6b architecture decision; data-export stays out of M10 compliance regime; Sentry runtime scrub additive to H2-deferred lint guard. Non-blocking: AC4 over-specified a non-existent other-user read path (green-by-assertion risk); confirm who-can-DM AC filed in feature-list #21 (CONFIRMED present). |
| **Gemini** | **UNAVAILABLE** | HTTP 429 (rate-limited). Non-blocking per gate rule — helper already retried once; gate proceeds on karen + jenny. Raw: `stages/P-4-gemini-review.md`. |

**Merge result: GATE PASSED.** karen + jenny APPROVE; Gemini UNAVAILABLE (does not block). Security-scope tightened gate: first Phase-2 pass returned no BLOCK (both APPROVE) → no forced second iteration required.

**Non-blocking reviewer findings incorporated into the spec before B (correctness + anti-theater consistency):**
1. Added HONEST VISIBILITY SELECTOR AC (karen) — rendered control must not present `everyone`/`server-members` as two live-but-identical choices; enum stays 3-valued server-side (locked for feature #21), UI collapses to behaviorally-honest options today.
2. De-asserted AC4 (jenny) — enforcement AC now scoped to the real live roster surface (nobody-hiding), not the not-yet-built other-user profile-read path; V-block verifies against the real surface.
Deferred to B/T (not spec changes): drop `@sentry` hard `^9` pin — install + record resolved major; T-8 re-examines `email`-in-select.

## Footer (Phase 2)
- gate_passed: true
- next_block: B (design_gap_flag=false)
