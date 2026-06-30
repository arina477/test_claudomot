# Wave 20 — V-3 Fast-fix

## Phase 1 — Gate verdict (fresh head-verifier spawn)
**APPROVED** with a non-empty fast-fix queue → proceed to Phase 2.
Verdict at `process/waves/wave-20/blocks/V/gate-verdict.md`. Karen APPROVE 7/7 (wedge proven, mutation-sensitive — not assertion-only); jenny APPROVE + 1 Medium drift (cursor-format-drift). V-2 triage classified the lone Medium as a fast-fixable client bug against a correct server contract (NOT a spec gap), routed to V-3 fast-fix, <20 LOC declared, no B-block re-entry. Gating AC (exactly-once+in-order, e29f6566 AC2) unaffected → APPROVED-with-queue, not REWORK.

## Phase 2 — Fast-fix loop (1 round, cap 3)

### Finding: cursor-format-drift (Medium, jenny DRIFT-1)
Client seeded `lastSeenCursorRef` with a raw `createdAt` ISO string → server `?after=` `decodeCursor` returned null → 400 silently swallowed → AC4 keyset catch-up non-functional on the client (socket `message:new` replay masked it). Server forward cursor correct; only client seeding wrong.

- **Iron Law:** spawned `react-specialist` (NOT fixed directly). Budget: 20 net production LOC, abort-if-over instruction issued.
- **Target B-stage (mapping):** jenny spec-drift in UI → B-4 (offline composer / client wiring).
- **Fix (commit `f521f15`, main):** added `encodeForwardCursor(createdAt, id)` helper at `useMessages.ts:55-58` mirroring the server `base64url(created_at|id)` codec; converted all 4 forward-cursor seed sites (`:155` catch-up append, `:225` initial listMessages, `:244` offline cache fallback, `:304` socket message:new) to encode the NEWEST loaded message. **9 net production LOC** (13+/4-) — under budget. Outbox/drain/send spine untouched.
- **Test added (closes jenny's gap):** `apps/web/src/features/sync/forwardCursor.test.ts` — 3 tests round-tripping a client-synthesized cursor through an inlined copy of the SERVER decode contract; asserts client cursor decodes to `[iso, id]` and a raw ISO decodes to null (bug reproduction). No test weakened (no green-by-suppression).
- **Independent re-verify (orchestrator, before commit):** Node round-trip through the exact server path (`Buffer.from(cursor,'base64url')` + `new Date(iso)` validity) → `[ISO, id]`; old raw-ISO bug → null. Failing condition no longer reproduces.
- **CI/local green:** web typecheck 0 errors; vitest 179/179 (was 174 + 5 new); biome 0 on both changed files. Pushed to main (automatic mode, branch merged → direct push; required status checks run async post-push).

### Re-verification (both required APPROVE)
- **Karen (scoped, re-fire):** APPROVE — 5/5 claims confirmed: helper matches server codec byte-for-byte; all 4 sites opaque-encoded, zero bare `.createdAt` survive; forward direction correct (newest msg, not backward nextCursor); round-trip test non-tautological (inlines server decode + bug-reproduction negative test); `git show f521f15 --stat` touches only useMessages.ts + new test — outbox spine untouched.
- **jenny (re-fire):** APPROVE — DRIFT-1 RESOLVED: client emits server-compatible opaque cursor at all sites; catch-up succeeds instead of 400; AC3↔AC4 spec conflict reconciled; gating AC + idempotency byte-unchanged. Non-blocking caveat: round-trip test inlines (vs imports) the codecs → a true E2E client→server cursor integration recommended as a **Low** test-hardening follow-up (not blocking; contract equivalence proven three ways).

### Non-blocking follow-up logged
- L (Low, test-hardening): replace the inlined-codec round-trip with a true E2E client→server `?after=` integration (real `encodeForwardCursor` import + HTTP + real `decodeCursor`, assert non-400 + correct rows). Mitigation this wave: orchestrator + Karen diffed inlined copies against production — identical. Candidate for a future M4 test wave / L-2 observation.

## Disposition: clean APPROVE
Wedge already proven (T-block ratified + Karen V-1). This fast-fix closes the catch-up leg. Both re-verifiers APPROVE; loop converged in 1 of 3 rounds; no suppression. V-block exits to L.

```yaml
phase1_head_verifier_verdict: APPROVED
skipped: false
queue_items_processed: 1
queue_items_fixed: 1
queue_items_moved_to_b_re_entry: []
fast_fix_rounds: 1
loc_per_fix:
  cursor-format-drift: 9
re_verification:
  karen: APPROVE
  jenny: APPROVE
cap_escalation: false
escalation_destination: ""
findings: []
```
