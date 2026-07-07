# P-1 — Decompose (wave-72, M10 account self-deletion)
## Maximum rubric: none trip. ~12-18 files (erasure service+controller+specs, SuperTokens auth-user delete, owned-server/cross-table disposition, shared DTO, Danger-Zone UI + typed-confirm + api fn + tests); ~2,500-3,200 net LOC (decomposer ~2,000-2,800 + the P-0 spec-gap additions: SuperTokens auth-user deletion + owned-server disposition ~+400-600); ~8-12 primitives. Under all caps (60 files, 60 primitives, 5,000 LOC).
## wave_type + floor
claimed_task_ids.length = 3 → **wave_type: multi-spec**. Floor: >2,500 net LOC OR ≥6 specs.
Estimate ~2,500-3,200 net LOC (with the SuperTokens auth-user deletion + owned-server/cross-table disposition the P-0 problem-framer flagged as load-bearing) → **clears the multi-spec floor** (>2,500). No RESCOPE.
## Verdict: PROCEED
claimed_task_ids = [9658fb0b (erasure API + service + SuperTokens auth-user delete + owned-server disposition — SEED), e11f8746 (shared account-deletion DTO), 898490b1 (Delete-my-account Danger-Zone UI + typed-confirm)]
## design_gap_flag: false (CORRECTED)
```yaml
design_gap_flag: false
missing_surfaces: []
```
CORRECTION: the Delete-my-account Danger-Zone is ALREADY DESIGNED — `design/settings-privacy.html` "Panel 5: Danger Zone (Deletion)" has the delete-account section, the "Delete account" button, a "Delete Account" confirm dialog (warning icon), and a consequence-acknowledgment checkbox. The erasure API + DTO are non-UI. So NO new UI surface → D-block SKIPS → B directly.
**NOTE for P-2/P-3 (design ↔ default reconciliation):** the settings-privacy.html Danger-Zone copy says deletion "requires email verification and initiates a 30-day grace period." That implies a soft-delete + grace-period + purge-after-30-days flow (which aligns WELL with the soft-delete default — soft-delete now, optional purge later). P-2 must decide: implement the full email-verification + 30-day-grace flow the mockup shows, OR a simpler immediate soft-delete+scrub+session-revoke (deferring the grace-period/email-verify to a later M10 slice). Reconcile the mockup's implied flow with the seed's soft-delete default; if the grace-period is deferred, the UI copy may need a minor adjustment (a B-3 note) OR the grace-period is speced in. Lean: implement soft-delete + session-revoke + SuperTokens-auth-user-disable now; the 30-day-grace purge job is a natural later M10 slice — but the mockup's copy sets the user expectation, so P-2 decides.
```yaml
wave_type: multi-spec
verdict: PROCEED
claimed_task_ids: [9658fb0b-567a-44f7-b873-c8d110e7d391, e11f8746-e85f-4900-ac82-a08c50f147d3, 898490b1-e658-4968-adfd-e75a85c75864]
floor_merge_attempt: 0
design_gap_flag: false
```
