# Wave 10 — V-3 Gate Verdict (M2 RBAC capstone)

**Block:** V (Verify) · **Stage:** V-3 Fast-fix (block-exit) · **Wave:** 10 · **Milestone:** M2 (LIVE)
**Adjudicator:** head-verifier · **Date:** 2026-06-29
**Spec source:** task `35f191f4-2b63-4c8b-bf7e-a5c074310ec6` (+3 siblings) — `spec-id: wave-10-m2-rbac`

---

## VERDICT: APPROVED

After a bounded one-iteration fast-fix loop. The security core was never in dispute; the two blocking feature-completeness gaps (explicit, unmet, cheap spec ACs) are now resolved-with-evidence and re-verified. The two genuinely M3-adjacent gaps are deferred to M3 with handoff. Verdict is backed by the finding ledger below, not a vibe.

---

## Adjudication of the SPLIT V-1 (Karen REJECT / jenny APPROVE)

The split was on **severity of feature-completeness gaps, NOT security.** Both reviewers + T-9 independently confirmed all 6 security conditions (server-side `can()` default-deny no-IDOR; no-self-promote; guard route-param-only; channel-filter no-enumeration; private default-deny; transactional owner-lockout) and the live 401 boundary. No reviewer was skipped; both emitted evidence-backed findings; the "no security finding" lines were not accepted at face value but corroborated by T-9.

- **Karen is right on the standard.** Findings #1 and #2 are *literal, explicit spec ACs* ("seed default roles on server-create"; "can't delete a role still assigned"). "Safe-by-default" (owner superuser + null-role default-deny) keeps them out of the security bucket, but it does NOT make an unmet AC met. Signing off here would be acceptance-by-assertion — the partial implementation behind a "done" flag.
- **jenny is right on the impact bound.** The M2 success metric ("members join and see the right channels per role") is functionally live via `findServerDetail` server-side filtering; the gaps are correctness-of-feature, not correctness-of-security.

**Ruling:** Both gaps are cheap, bounded, and touch the two surfaces a user actually hits (the roles list on a new server; role deletion). Closing them now is a one-iteration fix, not a rewrite. Deferring an explicit, cheap, unmet AC to M3 is exactly what gets a verifier fired. → FAST-FIX #1 + #2; DEFER #3 + #4 (true M3 forward primitives M3 needs anyway). No spec gap exists (the ACs are unambiguous) so no ESCALATE was warranted.

Independent codebase re-verification before ordering the fix confirmed both findings against reality (`servers.service.ts:58-97` had no roles insert; `rbac.service.ts:171-183` deleted unconditionally).

---

## Fast-fix loop (BOUNDED — declared cap: 1 iteration)

- **Iterations used:** 1 of 1. No scope creep; no rewrite.
- **Routed to:** backend-developer (orchestrator did NOT fix directly).
- **Branch:** `fix/wave-10-rbac-fastfix` · **Commit:** `e3fa699` (off `main` @ `5b1ea32`, BUILD push rule).
- **Diff scope:** 4 files, +93/-15 (2 prod files + 2 spec files).

### Re-verification (each fix vs. its ORIGINAL failing condition)

**FIX 1 — createServer seeds default 'Member' role** (`apps/api/src/servers/servers.service.ts`)
- Prod code: inserts `{server_id, name:'Member', position:0, manage_server/roles/channels/members:false, is_default:true}` inside the same `tx`, between server-insert and member-insert.
- Column-for-column identical to `db/backfill-roles.ts` (create-path and backfill-path now produce identical default roles). Confirmed by read.
- Original failing condition (new server opens with ZERO roles) NO LONGER REPRODUCES.
- Test: `seeds default Member role with is_default=true and all four permission flags false` asserts exact seeded values via `capturedValues[1]`. PASS.

**FIX 2 — deleteRole still-assigned guard** (`apps/api/src/rbac/rbac.service.ts`)
- Prod code: queries `server_members` for `(server_id, role_id)`; throws `ConflictException` (409) if any member assigned, BEFORE the delete. 404 not-found check preserved.
- Original failing condition (silent FK set-null demotion on delete of an assigned role) NO LONGER REPRODUCES.
- Tests: `throws ConflictException (409) when role is still assigned` + `does not delete when assigned` both assert 409 AND `mockDelete` not called (proves the delete path is genuinely blocked). PASS.

### Green-by-suppression check — CLEAN
- No tests disabled, no assertions loosened, no checks removed.
- Suite 169 → 176 passing (7 net new/updated). Typecheck clean.
- Pre-existing createServer index assertions shifted 2→3 / 3→4 to account for the new insert — a correct mechanical adjustment, not a weakening. The "deletes successfully" test updated to a two-call select mock matching the new code path. Verified by reading the test diff.

---

## Finding ledger — disposition of all 4 gaps (+ doc note)

| # | Finding | Karen sev | jenny sev | Adjudicated | Disposition | Status |
|---|---------|-----------|-----------|-------------|-------------|--------|
| 1 | createServer no default-role seed (`servers.service.ts` create txn) | Critical | Low | **High** (explicit AC unmet; safe-by-default) | **FAST-FIX** | RESOLVED-WITH-EVIDENCE (commit e3fa699, re-verified) |
| 2 | deleteRole no still-assigned guard (`rbac.service.ts:171`) | High | Low (minor design) | **High** (explicit AC unmet) | **FAST-FIX** | RESOLVED-WITH-EVIDENCE (commit e3fa699, re-verified) |
| 3 | member-list for role-assignment (no `GET /servers/:id/members`) | — | Low-Med | Low-Med | **DEFER → M3** | CARRIED (M3 needs the endpoint anyway; assign UI not end-to-end usable until then) |
| 4 | guard + owner-lockout wired to no live route | Low (forward) | informational | Low | **DEFER → M3** | CARRIED (spec-anticipated M3 primitives: attach `@UseGuards(ChannelPermissionGuard)`; wire leave/remove/demote HTTP routes) |
| — | "270 tests" claim false (actual 46 RBAC / 175 suite; now 176 post-fix) | Medium (claim integrity) | n/a | Doc note | **NOTE** | Correct the count in L docs; no code. Stop asserting 270. |

Every Critical/High finding is resolved-with-evidence or escalated — none silently dropped.

---

## Carry-forward to N / L handoff (DEFER items + recurring escalation)

1. **M3 onboarding — finding #3:** add `GET /servers/:id/members` (gated; returns members + role_id) to close the role-assignment UI loop.
2. **M3 onboarding — finding #4:** attach `@UseGuards(ChannelPermissionGuard)` to channel-scoped message routes; wire `OwnerLockoutService` (leaveServer/removeMember/demoteOwner) to HTTP routes.
3. **Doc correction:** test-count claim — real number is 176 (post-fix); 270 was never accurate.
4. **ESCALATION-CRITICAL (recurring, 4 waves):** verified-prod-session fixture `4a2ad286` (`status=todo`). Live authenticated **403 non-permitted** core (owner-superuser / per-role channel-filter) is NOT exercised against prod (0 prod servers, no persistent fixture) — covered by unit tests + the live **401** boundary only. This is now the dominant verification blind spot for security-critical RBAC. **L/N should prioritize 4a2ad286** so future auth/RBAC waves can live-verify the authenticated 403 core. Does not block wave-10 (code correct on read + unit-tested), but salience is escalating.

---

## Stage-exit checklist

- [x] T-block prior signoff APPROVED (verified: T-9 APPROVED, 6 conditions).
- [x] Both reviewers ran and emitted evidence-backed findings; no skipped reviewer.
- [x] Author not sole reviewer — independent Karen + jenny.
- [x] Load-bearing claims checked vs codebase reality (createServer txn + deleteRole re-read by adjudicator).
- [x] jenny cross-referenced plan vs journey-map vs decisions; reported drift/deltas.
- [x] "No security finding" probed — corroborated by T-9, not face-value.
- [x] Every finding carries severity + disposition.
- [x] Findings classified before fix; no fix without root cause (both root-confirmed in source).
- [x] Spec-gap routing — N/A (ACs unambiguous; no ESCALATE warranted).
- [x] Fast-fix iteration bound declared (1) and not exceeded.
- [x] Every Critical/High resolved-with-evidence or escalated.
- [x] "Done" = acceptance criteria demonstrably met (re-verified), not merely green suite.
- [x] No finding closed by weakening a test / loosening assertion / disabling a check.
- [x] Each fix re-verified against original failing condition (no longer reproduces).
- [x] No regressions — full API suite re-run (176 pass), typecheck clean.
- [x] Orchestrator did not fix directly — routed to backend-developer.
- [x] Verdict backed by finding ledger.
- [x] Baselines (journey-map regen at T-9 / product-decisions) reflect as-shipped behavior.

```yaml
head_signoff:
  verdict: APPROVED
  stage: V-3
  reviewers: { karen: REJECT-then-resolved, jenny: APPROVE }
  fast_fix:
    iterations: 1
    bound: 1
    branch: fix/wave-10-rbac-fastfix
    commit: e3fa699
    routed_to: backend-developer
    tests: { before: 169, after: 176, suppression: none }
  findings_resolved: [createServer-default-role-seed, deleteRole-assigned-guard]
  findings_deferred_M3: [member-list-endpoint, guard/owner-lockout-route-wiring]
  doc_note: [test-count-claim-correct-to-176]
  escalation_recurring: [verified-prod-fixture-4a2ad286-4-waves]
  failed_checks: []
  rationale: >
    SPLIT adjudicated — security core sound (6 conditions + live 401, undisputed).
    The two blocking gaps are explicit unmet spec ACs (default-role-on-create,
    delete-assigned-role-guard), cheap and bounded; safe-by-default does not make
    an AC met, so deferring would be acceptance-by-assertion. Ordered a bounded
    1-iteration fast-fix (backend-developer), re-verified each fix against its
    original failing condition (both no longer reproduce), confirmed no
    green-by-suppression (176 pass, no assertion weakened). The member-list
    endpoint and guard/owner-lockout route-wiring are genuine M3 forward
    primitives — deferred with handoff. Test-count claim corrected. Recurring
    verified-prod-fixture gap (4a2ad286, 4 waves) escalated to L/N.
  next_action: PROCEED_TO_L
  merge_note: >
    fix/wave-10-rbac-fastfix (e3fa699) must be merged to main before L-block docs
    finalize, so the as-shipped tree reflects the seeded role + delete guard.
```

---

**Block exit:** APPROVED → hand off to **L-block**. The fast-fix branch `fix/wave-10-rbac-fastfix` (e3fa699) must land on main as part of this wave's shipped state. VERIFY-PRINCIPLES.md append handled separately at block exit.
