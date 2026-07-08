# Wave 80 — P-block Gate Verdict (P-4)

- **Gate:** P-4 (Product block exit)
- **Attempt:** 1
- **Phase:** 1
- **Reviewer:** head-product (fresh independent spawn)
- **agentId:** head-product/wave-80/P-4/attempt-1/phase-1
- **Mode:** automatic
- **Date:** 2026-07-08
- **Wave:** 80 — M13 leg-3b, presence (last-seen) privacy toggle (single-spec, descoped from read-receipt+presence bundle)

## VERDICT: APPROVED

The reframe is sound, the load-bearing honor point is pinned server-side with a two-client proof, and the plan is concrete with real specialists. Two non-blocking carry-forward notes to B/T (below) — neither is a P-block gap; the design intent that answers both is already explicit in the spec.

---

## Judgments

### 1. Descope reframe — SOUND
- showPresence gates the EXISTING presence service (presence.gateway online/offline broadcast, currently ungated at user level). sendReadReceipts gates a feature that does not exist (`read_at` is notification-tray read state, not a sender-visible message "seen-by"). Verified against code by all 3 P-0 reviewers; unanimous descope, no mediation conflict.
- Anti-theater reasoning is correct. A stored/disabled no-op sendReadReceipts toggle would assert a privacy guarantee it cannot honor — worse than absent. The decisive precedent (ceo-reviewer) is StudyHall's OWN convention: whoCanDm ships DISABLED as a "Beta Feature" affordance (pointerEvents:none) precisely because its enforcement surface isn't built. A no-op presence-parallel toggle is off the table by that precedent, not by opinion. Correct application of BUILD-17 / anti-security-theater.
- Deferral hygiene correct: read-receipt subsystem + toggle → sibling task 12f6135e with **wave_id NULL** (matches the N-2 seedability requirement — a non-null wave_id would strand it). Decision logged to product-decisions 2026-07-08.
- Shipping one honest control over a two-toggle wave where one lies is the right call.

### 2. Load-bearing honor point — PINNED (server-side + two-client)
- Spec AC-2 requires: `show_presence=false` → the presence service does NOT broadcast the user's online/offline/last-seen to co-members, proven with a TWO-CLIENT test (A toggles off → B's presence view no longer shows A online). Single-client is explicitly named as coverage theater across P-0/P-1/P-2/P-3.
- Server-side gate is unambiguous: P-3 rejects the client-filter alternative outright ("leaks presence over the wire; the gate must be server-side"). The gate lives at the presence.gateway/presence.service emit paths (~163/174/221), excluding false users from the fan-out — not a client render filter.
- Own-visibility-only semantics correct: AC-4 — a hidden user STILL receives/sees others' presence; the toggle governs outbound visibility only. Edge-cases enumerate toggle-off-mid-session and toggle-back-on.

### 3. Real working control — YES
- AC-1 explicit: a REAL working toggle, NOT a disabled-Beta affordance, because presence is a live feature. P-3 B-3 reinforces "reuse the existing privacy-toggle pattern; NOT the disabled-Beta affordance used for who_can_dm." Correctly distinguishes this from the whoCanDm case (whose enforcement surface is absent).

### 4. Floor-waiver (rule 5) — CORRECTLY APPLIED
- Max-size rubric: no threshold tripped (~6-9 files, ~4 primitives, ~300-500 LOC). Single-spec floor is net LOC >1,500 — not met on raw size.
- Rule-5 waiver is legitimate: mvp-thinner returned THIN and its split (deferring the read-receipt subsystem to 12f6135e) was already applied at P-0; the remaining showPresence slice is "a complete AC that stands as a wave" (NOT OVER-CUT) with zero further valid split candidates. Rule 5 exempts a feature with no valid split.
- Critically, the waiver did NOT expand by re-admitting the dishonest toggle to pad LOC — the exact anti-pattern the reframe removed. Correct restraint. `floor_merge_attempt: 0`, `floor_waived: true` with a valid basis.
- design_gap false is correct: field-addition to the already-adopted SettingsPrivacyPage privacy-toggle pattern (profileVisibility/whoCanDm already render there) using existing DS tokens — not a new component/page/flow. No D-block. Confirmed.

### 5. Plan concreteness — HOLDS
- Every AC maps to a file-level step: column+field (B-0 migration / B-1 privacy.ts schema fields), persist+audit (B-2 privacy.service + AppendPrivacyEventService), honor point (B-2 presence.gateway/service emit gate), toggle (B-3 SettingsPrivacyPage), two-client honor proof (B-2 integration + T-5 e2e).
- Every step has a real AGENTS.md specialist: postgres-pro (B-0), typescript-pro (B-1), backend-developer (B-2), react-specialist (B-3). All present and correctly routed. No D-block.
- Migration: `ALTER users ADD show_presence boolean NOT NULL DEFAULT true` — DEFAULT true = no backfill, existing users stay visible (no behavior change on migrate). Correct; also avoids a table rewrite on modern Postgres.
- Audit event on change specified (B-2). Separate-table alternative rejected with rationale (one boolean belongs on the shipped privacy model). No new deps, no new SDK. Self-consistency sweep present and passes.

### 6. Security-scope advisory — two-client honor test is the right bar; full T-8 tightened gate NOT warranted
- The CLAUDE.md security-scope trigger fires on auth / payments / user-creation / cookies / CSRF / rate-limits / sessions. This wave touches privacy-visibility only and hits none of those surfaces, so the P-4 security-scope **tightened** gate is not triggered.
- The two-client honor test IS the correct security bar here: it proves the server withholds presence data over the wire (the actual privacy guarantee), which is the only security-bearing behavior in scope. Recommend a lightweight T-7 assertion that a `show_presence=false` user's presence never appears in co-member WS traffic, folded into the T-5 two-client e2e — no standalone tightened gate needed.

---

## Carry-forward notes to B/T (non-blocking; do not reopen P)

1. **Two-client assertion must be at the wire/emit level, not UI-only.** The spec/plan phrase the proof as "B's presence view no longer shows A." Design intent is unambiguously server-side exclusion (client-filter is explicitly rejected), but a UI-only assertion could technically pass even under a client-filter regression. The B-2 integration test and T-5 e2e must assert on what crosses the socket to client B (the presence event / subscription payload), not merely on B's rendered UI. This closes the client-filter escape hatch and is what makes the honor point verifiable. Pin at B-2/T-5.
2. **N-1 disposition point stands.** After this ships, M13 reaches its last-authored leg → founder-disposition point. Surface to founder/BOARD at N-1; do not auto-close the milestone.

## Gate outputs
```yaml
verdict: APPROVED
attempt: 1
phase: 1
wave_type: single-spec
claimed_task_ids: [3038a4bc-8eeb-49aa-ab3c-096e1ff5b8e1]
deferred_sibling: 12f6135e   # read-receipt subsystem+toggle, wave_id NULL
floor_waived: true
design_gap_flag: false
security_tightened_gate: not-warranted
load_bearing_verified: [server-side-honor, two-client-proof, own-visibility-only, real-toggle-not-beta, audit-event]
carry_forward: [wire-level-two-client-assertion, N-1-M13-disposition]
```
