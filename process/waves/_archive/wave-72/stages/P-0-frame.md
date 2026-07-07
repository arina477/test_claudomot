# P-0 — Frame (wave-72, first M10 Compliance slice)

## Discover
- wave_db_id: 94b5b301-2032-413c-8acf-151adba58c11 (wave_number 72; waves.milestone_id = M10)
- Prior-work: right-to-ACCESS (data export) already shipped (GET /profile/data/export, AccountDataService, SettingsPrivacyPage "Download my data"). This wave adds right-to-ERASURE.
- Roadmap milestone: M10 (97d65b49, in_progress — founder-promoted at resume; Class=product-feature; FIRST slice). Bet: differentiation — privacy-first / institutional credibility.
- Spec-contract short-circuit: no-prior-spec (seed is prose). Full P-1..P-3.
- Public-launch context: the founder granted the public-launch GO (directory going live) — which is WHY M10 was picked (real users → data-rights matters).

## Reframe (all PROCEED/OK — continue to P-1)
**Bundle:** account self-deletion / right-to-erasure — seed 9658fb0b (API+service), siblings e11f8746 (shared DTO) + 898490b1 (Settings › Privacy "Delete my account" UI).

**problem-framer: PROCEED (2 notes)** — soft-delete default is SOUND (users.id has ~20+ NO-ACTION FKs → naive hard-delete = FK violations / full destructive cascade; matches the shipped message tombstone convention; satisfies the practical erasure right when the full frame is honored [inaccessible + PII-scrubbed + sessions-revoked + off all rosters]). Note 1: compliance-regime → surface-to-founder (Tier-3, non-blocking; proceed on soft-delete). **Note 2 (SPEC-GAP for P-2 — the real completeness risk):** (a) owned-server/cross-table disposition — servers.owner_id is NO ACTION; P-2 must enumerate what happens to a deleted user's owned servers / authored messages / memberships / blocks / reports / DMs (lean block-if-owner for self-use MVP, OR transfer/orphan-tombstone); (b) **CRITICAL: identity is SPLIT — SuperTokens owns the auth user (signUp mirrors result.user.id into the local users row). True erasure MUST delete/disable the SuperTokens auth user, not only revoke sessions + scrub the local row, or the account can RE-AUTHENTICATE.** P-4 must catch a happy-path that scrubs only the local users row.

**ceo-reviewer: PROCEED (HOLD-SCOPE)** — right first M10 slice (missing symmetric half of data-rights; most-expected data right the moment a public product holds user data; correct-by-default regardless of regime). Soft-delete-first = right pragmatic call (reversible, matches convention, retains scrubbed records for future audit, doesn't foreclose hard-delete later; hard-delete-first + needing-retention-later is a one-way door). HOLD scope (expansions gate on the unset regime). Founder-facing note rides ALONGSIDE (non-blocking): set the regime emphasis (FERPA/COPPA/GDPR) + a concrete M10 metric early — shapes LATER slices (audit-log/consent/hard-delete-purge), not this one. Do NOT re-pause (founder just resumed; wave-41/M8 TBD-metric precedent).

**mvp-thinner: OK (blocked on metric)** — M10 metric _TBD_ → contract rule: OK + flag (thinness analysis unrunnable without a metric). The 3-task bundle is legitimately-sized (contract→backend→UI triad, one verb "delete my account"; no thinness smells). Flags: MISSING_SUCCESS_METRIC (founder-set before FUTURE M10 bundles can be certified; not blocking this one) + COMPLIANCE_REGIME_CHANGES_THE_AC_SET (a strict hard-delete regime would pull a minimal deletion audit-log entry IN + change referential handling).

**Mediation:** no conflict — all converge on the 3-task erasure slice, soft-delete default, HOLD scope. 

**Disposition: PROCEED to P-1.** wave-72 = account self-deletion (soft-delete + PII-scrub + session-revoke + **SuperTokens auth-user deletion/disable** + owned-server/cross-table disposition), soft-delete regime default.

**Carries to P-2/P-3 (load-bearing):**
1. SPEC-GAP (P-2 MUST spec): owned-server/cross-table disposition (block-if-owner default) + the CRITICAL SuperTokens auth-user deletion (not just local-row scrub + session revoke).
2. P-4 security-scope-tightened gate + T-8 (auth/session/user-deletion boundary).
3. FOUNDER-FACING (non-blocking checkpoint, NOT a re-pause): compliance-regime pick (hard vs soft delete) + M10 success metric — recorded for the founder's next engagement; proceed on the soft-delete default meanwhile.
