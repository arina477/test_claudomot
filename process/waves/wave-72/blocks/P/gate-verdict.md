# Wave 72 — P-4 Verdict

**Reviewer:** head-product (fresh spawn)
**Reviewed against:** the tightened seed spec (task 9658fb0b) + process/waves/wave-72/stages/P-3-plan.md
**Attempt:** 2  (attempt 1 = REWORK for 2 security-AC tightenings; both now verified landed)
**Phase:** 1 (head-product)
**Gate class:** SECURITY-SCOPE-TIGHTENED (wave_touches ∩ {auth, sessions, user-deletion} ≠ ∅ → high security bar)

## Verdict
APPROVED

## Rationale
Both attempt-1 security blockers are verified landed in the tightened spec, and under the tightened bar the security ACs are now airtight: a deleted account can neither re-authenticate via EITHER door nor leave a named PII residue on its row. The frame, decomposition, and plan — already APPROVE-grade at attempt 1 — still hold. This is a clean pass of the targeted P-2 tightening, not a re-frame.

## Rework fixes verified (the two attempt-1 blockers)

### Fix 1 — Re-auth guard on BOTH doors (AND, not AND/OR) — LANDED
The RE-AUTH BLOCK acceptance-criterion on the seed (9658fb0b) now reads: *"Add the guard in BOTH doors, each independently + each T-8-verifiable (AND, not AND/OR — a replayed pre-deletion session token or a refresh rotation must NOT re-authenticate a scrubbed account): (i) the SuperTokens signIn override (supertokens.config.ts — which today overrides only signUp; add signIn) rejects a login for a user whose local users.deleted_at IS NOT NULL; AND (ii) the session-verify path (verifySession middleware / a session override) rejects an existing/refreshed session for a deleted user. Both required — session-revoke alone leaves the session door open."*
- BOTH doors, hard AND, "not AND/OR" stated verbatim: PASS. The attempt-1 seam ("AND/OR" made door (ii) optional) is closed.
- Each door independently T-8-verifiable, and the edge-cases enumerate both the fresh-sign-in-rejected and the replay/refresh-rejected paths: PASS.
- Spec notes `supertokens.config` today overrides only signUp (both signIn + session-verify are net-new): PASS.
- Confirms `deleteUser` (hard/irreversible) stays deferred — the guard, not SuperTokens deletion, enforces the block; soft-delete stays reversible: PASS.
- **P-3 B-2 names both override sites** — verbatim: *"supertokens.config.ts (add BOTH a signIn override AND a session-verify guard — deleted_at re-auth block on both doors; today only signUp is overridden)"*. The binding, load-bearing step the builder claims against is airtight.
- Threat closed: a replayed pre-deletion session token or refresh-token rotation can no longer re-establish an authenticated context for a scrubbed account.

### Fix 2 — PII scrub includes avatar_key — LANDED
The ERASURE acceptance-criterion now scrubs *"display_name/username/email/avatar_url AND avatar_key (users.ts:13 — the stored-avatar storage key; nulling avatar_url but leaving avatar_key is a PII-linked residue)"* and the null-set explicitly lists *"null email/avatar/avatar_key"*. The residual storage-key pointer on the scrubbed row is cleared. No named PII column on the users row is left unscrubbed. PASS.

## Full checklist re-confirmed (attempt 2)

**P-0 Frame — PASS.** Right-to-erasure is the correct symmetric first slice of M10 (right-to-access already shipped); maps to the live privacy-first / institutional-credibility bet; founder picked M10 + granted public-launch GO. Soft-delete + PII-scrub + session-revoke + `deleted_at` re-auth block is the right reversible default — no gold-plating (no hard-delete/purge job, 30-day grace, audit-log infra, or consent flows this slice). problem-framer findings (split-identity re-auth, owned-server orphaning) both carried into ACs. Falsifiable signal present.

**P-1 Decompose — PASS.** Multi-spec bundle above the floor, coherent: DTO (spec B) → API+service+schema (spec A) → Danger-Zone UI (spec C). One seed + only the siblings that must ship together for the erasure claim to hold end-to-end. Deferred scope (hard-delete/purge, email-verify, 30-day grace, transfer/cascade of owned servers) explicitly split to later M10 slices. `design_gap_flag = false` (settings-privacy.html Panel 5 covers UI) → no D-block. No dependency on an unbuilt out-of-bundle task.

**P-2 Spec — PASS.** ACs enumerated + independently verifiable across all three specs. Non-happy states covered: confirmation absent/false → 400 (Zod); no-IDOR (session callerId, no userId param); owner-block 409 with server list; already-deleted idempotent; delete-failure non-destructive + error surfaced; on-success logout+redirect. Non-goals named. Auth/session/user-deletion surface flagged for this tightened gate. Full spec contract embedded as the fenced YAML block at the head of the primary task's `description` (verified via DB read). Security ACs re-confirmed airtight: no-IDOR own-account-only; owned-server block-if-owner 409 + list; PII scrub incl. avatar_key; session-revoke-all; leave-all-servers + clear presence; re-auth block on BOTH doors; reversible soft-delete / no-hard-delete.

**P-3 Plan — PASS.** Reuses established architecture (mirrors AccountDataService/privacy.controller/privacy.module + session idiom + message soft-delete/tombstone convention) — no parallel path. Soft-delete chosen precisely to avoid a destructive ~20+ NO-ACTION-FK cascade; no MVP-scale infra (Redis/multi-replica/billing) introduced. Each step maps to a bundle task + observable artifact: B-0 (deleted_at + migration), B-1 (DTO), B-2 (endpoint + BOTH re-auth doors + owned-server guard + pg-harness integration), B-3 (frontend). Every AC → ≥1 step. Specialists (postgres-pro, typescript-pro, backend-developer, react-specialist) all present in AGENTS.md.

**P-4 Gate — PASS.** Every upstream checkbox ticked from concrete artifacts (DB spec read + P-3-plan.md read), not inferred. Both attempt-1 blockers verified resolved. `design_gap_flag = false` → handoff routes to B-block.

## Non-blocking notes (do not gate)
- **P-3 Approach §2 stale phrasing:** the Approach prose (§2) still carries the attempt-1 "signIn override (and/or session-verify)" wording. This is stale narrative — the *binding* step (B-2) and the spec AC (source of truth per always-on rule 7) both mandate BOTH doors as a hard AND. Flagged for the builder to ignore §2's "and/or" in favor of B-2 + the AC. Does not gate.
- **Owned-server FK rationale (carried from attempt 1):** the block-if-owner guard is correctly required (a server whose owner shows "Deleted user" is a real integrity/UX problem), but under soft-delete the `servers.owner_id → users.id` FK never fires (owner row is UPDATEd, not DELETEd). Guard's true justification is data-integrity/UX, not a DB constraint. B-2 should not chase a phantom FK error.
- **Founder-facing items:** (a) compliance-regime pick (soft-delete-default vs hard-delete/GDPR-purge) and (b) M10 success metric (TBD) remain correctly dispositioned as non-blocking daily-checkpoint items in `process/session/updates/`. Neither blocks this slice.

## Verification basis (attempt 2)
- Tightened seed spec (task 9658fb0b) read directly from `tasks.description` — both fixes present verbatim in the RE-AUTH BLOCK and ERASURE acceptance-criteria.
- `process/waves/wave-72/stages/P-3-plan.md` read — B-2 names BOTH override sites (signIn AND session-verify); no schema/approach change; users.deleted_at unchanged.
- Load-bearing codebase claims (supertokens.config signUp-only today, users.avatar_key present, servers.owner_id NO ACTION, privacy/ module reuse real) were verified at attempt 1 and are unchanged by this AC-only tightening — re-verification of shipped code is Phase-2 (karen) scope.

## Handoff
APPROVED → exits Phase 1. Orchestrator runs Phase 2 (karen load-bearing-claim verification + jenny spec-vs-bet drift + gemini) on this security-scope-tightened wave. On final clearance, route to B-block (`design_gap_flag = false`). Carry forward to the builder: T-8 must independently verify BOTH re-auth doors reject `deleted_at IS NOT NULL` (fresh-login path AND refreshed/replayed-session path); and post-delete `users.avatar_key IS NULL`.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 1

---

# Wave 72 — P-4 Verdict (Phase 2 — Karen + jenny + Gemini merged)

**Phase:** 2
**Attempt:** 2 (post-Phase-1 APPROVED)

## Verdict
APPROVED — exit P-block.

## Per-reviewer status
| Reviewer | Verdict | Notes |
|---|---|---|
| karen (load-bearing claims) | **APPROVE** | 9/9 spot-checks VERIFIED. account-data.service:9,52 (mirror shape); privacy.controller:27,38 + privacy.module:10; supertokens.config:37 overrides signUp ONLY (grep signIn/verifySession → none → both-doors genuinely net-new); users.ts avatar_key:13 present, no deleted_at yet; servers.ts:25-27 owner_id→users.id NO ACTION; supertokens-node@24.0.2 Session.revokeAllSessionsForUser real; SettingsPrivacyPage + settings-privacy.html:557 Panel 5; specialists all in AGENTS.md. |
| jenny (spec-vs-bet drift) | **APPROVE** | Erasure = faithful right-to-ERASURE half of the data-rights pair (access half shipped wave-35). Soft-delete regime MATCHES the 2026-07-07 M10-promotion decision (product-decisions L800: soft-delete default, hard-delete = founder compliance-regime flag). Copy-reconcile handled as sound spec-gap. Owned-server block-if-owner MATCHES never-orphan invariant (wave-10/20/21). No blocking drift. |
| Gemini (cross-model) | **UNAVAILABLE** | Helper exit=3, HTTP 429. Non-blocking per P-4 Action 3 (passes on APPROVE or UNAVAILABLE). Recorded, not retried. |

## Merge result
karen APPROVE + jenny APPROVE + Gemini UNAVAILABLE → **gate passes**. Security-scope-tightened wave: Phase-1 attempt-1 REWORK (2 findings) + attempt-2 APPROVED already satisfied the ≥2-Phase-2-iterations-guaranteed rule via the rework loop; Phase 2 clean on first pass. No further iteration forced.

## Carry-forward to B-block (builder must honor)
1. **B-2 AppModule registration (karen watch-item):** privacy.module.ts self-documents PrivacyModule was NOT yet registered in AppModule (deferred prior wave). B-2's "PrivacyModule wired" AC MUST land the AppModule registration this time — else POST /profile/delete never mounts. Verify the route is reachable, not just defined.
2. **Both re-auth doors (spec AC, source of truth):** signIn override AND session-verify guard, hard AND. Ignore P-3 Approach §2's stale "and/or" narrative (non-binding).
3. **avatar_key in scrub set:** post-delete users.avatar_key IS NULL (T-8-verified).
4. **Owned-server guard = data-integrity/UX justification**, not a phantom FK error (soft-delete UPDATEs the owner row, never DELETEs — FK never fires).
5. **T-8 must independently exercise:** no-IDOR own-account-only; re-auth-blocked on BOTH doors (fresh-login AND replayed-session); owner-block 409 + server list; PII-scrub-no-residue incl. avatar_key.

## Footer
- verdict_complete: true
- phase2_complete: true
- gate: PASSED
- next: B-0 (design_gap_flag=false → skip D-block)
