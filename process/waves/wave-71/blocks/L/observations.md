# Wave-71 L-block observations — knowledge-synthesizer

Append-only. L-2 Distill (karen) reads these; promotes to `*-PRINCIPLES.md` ONLY when an
observation recurs across 2+ waves AND head-verifier approves (max 1 rule/file/wave). Single-wave
observations stay here until a second wave confirms.

---

## L-2 synthesis observations (knowledge-synthesizer)

Inputs read: process/waves/wave-71/stages/ full artifact set (B-1-contracts, B-2-backend,
B-3-frontend, B-5-verify, B-6-review); blocks/B/gate-verdict.md; blocks/B/review-artifacts.md;
blocks/T/gate-verdict.md; stages/V-1-karen.md; stages/V-1-jenny.md.
Prior archives consulted: process/waves/_archive/wave-{67,68,69,70}/blocks/L/observations.md
(4-wave window; explicit recurrence checks for wave-70 obs-2 HOLD and wave-70 obs-3 HOLD).
Principles files read: BUILD-PRINCIPLES.md (14 rules), PRODUCT-PRINCIPLES.md (5 rules),
test-writing-principles.md (§ 7 mocking rules, rules 1-23 + auto-updated entries 24-29).

---

## Explicit verdicts on the two wave-70 held candidates

### wave-70 obs-2 — realtime fan-out for a gated write must be downstream of the gate (HOLD, 1st instance)

**Verdict: NOT CONFIRMED this wave. HOLD maintained.**

Wave-70 obs-2 held the class "at B-6 Phase-2, explicitly confirm that a realtime fan-out for a
new gated write operation is subordinate to the gate (same callstack, after the guard) rather than
a parallel path that could bypass it." Wave-71 introduces zero websocket or realtime changes.
`git diff main...wave-71-block-ui-polish --name-only` does not include `messaging.gateway.ts`,
`dm.service.ts`, or any socket-related file — confirmed by the T-block gate verdict's explicit
"blocks.controller.ts and dm.service.ts NOT in the wave diff at all (zero diff confirmed by name)."
The 5 DM HIDE seams are provably untouched. This wave is not a confirming instance. HOLD maintained.
Watch for any wave introducing a realtime fan-out on a gated write (messaging, notifications,
presence) where the delivery path could become a bypass.

---

### wave-70 obs-3 — a backend list endpoint must include display fields if a UI renders rows by name/avatar (HOLD, 1st instance)

**Verdict: NOT CONFIRMED as a 2nd independent instance. HOLD maintained.**

The judgment: wave-71 was the deliberate remediation of the wave-70 gap. The gap was wave-70
FINDING-2 — GET /blocks returned only UUIDs, the blocked-users panel rendered raw IDs, routed to
task 1c633d2f as a spec-A contract change. Wave-71 B-1/B-2 enriched the endpoint (LEFT JOIN users,
`BlockListItemSchema = BlockSchema.extend({ blockedUser })`, `displayName ?? username ?? 'Unknown user'`).

This is not a new independent instance of the lesson. The lesson would be confirmed by a future
wave where a *different* entity endpoint independently ships a list view whose UI renders rows by
name/avatar but whose spec was written without including the display fields in the DTO — a fresh
instance of the same spec-authoring gap. A remediation wave fixing the known gap from wave-70 is
not structurally independent: the problem was already identified, triaged to a task, and the wave
existed specifically to fix it.

Contrast with wave-70 obs-1 (portal pattern): that wave confirmed obs-3 from wave-69 because the
portal was applied correctly and proactively on a new surface (BlockConfirmDialog), not because
it re-fixed the same ChannelSidebar instance. Here, wave-71 is re-visiting the same surface
(GET /blocks) that wave-70 identified. HOLD maintained. Watch for any wave where a separate
entity endpoint (invitations, reports, mutes, connections) is specced without display fields
while a UI spec for the same entity expects name/avatar rendering.

---

## obs-1 — WARNING (1st INSTANCE): every mutation on state owned by a shared store must route through the store; bypassing to the raw API client silently defeats the store's optimistic set

**Source artifacts:**
- process/waves/wave-71/stages/B-6-review.md (Phase-2 /review Run 1: "[P0] member-row Block never
  flipped to Unblock — BlockConfirmDialog called api.blockUser directly, bypassing the useBlocks
  store (blockedSet never updated), masked by a wholesale-mocked test"; fix-up 98c6958:
  "BlockConfirmDialog → useBlocks().blockUser (store owns the single api.blockUser call + optimistic
  add + rollback-on-failure)")
- process/waves/wave-71/blocks/B/gate-verdict.md (Attempt 2 rationale: "BlockConfirmDialog.tsx now
  destructures const { blockUser } = useBlocks() … The dialog no longer owns the network call at
  all; it delegates to the store, which is the single owner of the optimistic blockedSet mutation
  that drives the row flip"; "Exactly ONE api.blockUser call site exists in the entire web tree:
  useBlocks.ts:122, inside doBlockUser")

**Assessment:** The P0 was structural, not incidental: BlockConfirmDialog imported `api.blockUser`
directly instead of calling the store's `doBlockUser/blockUser` method. Because the store's
`blockedSet` never received the optimistic add, every subscriber of the store — including the
MemberItem that computes `isBlocked = blockedSet.has(userId)` — saw stale state. The row never
flipped from Block to Unblock after a successful block action, defeating the primary UX guarantee
of the wave. The defect was invisible to isolated component tests because those tests wholesale-mocked
`useBlocks`, so the mocked `blockUser` stub was called and the test passed — while the production
dialog bypassed the store entirely.

The generalizable lesson is distinct from the testing side of this failure: when a shared module-level
store owns a slice of UI state (optimistic set, subscription model), every component that triggers a
mutation must delegate that mutation to the store's own method — not call the underlying transport
directly. A component that calls the API client directly has decoupled the network call from the
state update; the state owner is not informed, and every surface that derives UI from that state
renders stale.

**Near-dup check vs existing BUILD-PRINCIPLES rules 1-14:**
- Rule 12 (test through real parent caller): rule 12 is a TESTING rule — it prescribes how to
  write the test so the wiring is proven. This observation is about the production mutation routing
  itself (where the API call must live), not about how to test it. Distinct: rule 12 prevents the
  mask; this prevents the bug. Not a near-dup.
- Rule 5 (in-flight coalescing flag): different class (async loop dedup, not state-owner bypass).
- No existing rule prescribes "route all mutations through the state owner, not the raw API client."
- Not a near-dup.

**Pre-shaped candidate (for future 2nd instance — NOT a nomination; 1st instance only):**
```
15. Route every mutation through the module or store that owns the optimistic state, not the raw API client.
    Why: A direct API call bypasses the state owner; subscribers render stale state until the next full refetch.
```
Rule line = 115 chars. PASS (<=120).
Why line = 95 chars. PASS (<=100). No forbidden tokens. PASS.
Near-dup vs BUILD rules 1-14: PASS.
Candidate file: BUILD-PRINCIPLES rule 15 candidate.

**Severity:** warning (shipped as a P0 caught by Phase-2 /review after Phase-1 APPROVED;
  the primary UX guarantee of the wave — member row flips Block→Unblock — was broken in production
  until the fix-up commit; a real user would have seen the row stay on "Block" after blocking).
**Candidate principles file:** BUILD-PRINCIPLES rule 15 candidate.
**Cross-wave recurrence:** FIRST INSTANCE. HOLD.
**Promotion flag:** HOLD — 1st instance; watch for any wave introducing a component that
  triggers a mutation on optimistic state managed by a shared store/context/hook.

---

## obs-2 — INFORMATIONAL: "never mock the system under test" is already canon; wave-71 is a confirming application of that existing rule

**Source artifacts:**
- process/waves/wave-71/stages/B-6-review.md ("the old block-toggle test mocked useBlocks +
  hand-mutated the set, so it passed while production was broken"; "This is the classic
  mock-the-system-under-test failure mode, and it is exactly why an independent Phase-2 reviewer
  exists on top of the gate")
- process/waves/wave-71/blocks/T/gate-verdict.md ("block-dialog-store.test.tsx explicitly does
  NOT mock useBlocks (the system under test); it mocks only the api-layer boundary
  (api.blockUser/getBlocks), renders the real MemberListPanel, drives the real BlockConfirmDialog,
  and asserts the user-observable DOM flip … This is the opposite of both coverage theater and
  mock-the-system-under-test.")
- command-center/testing/test-writing-principles.md § 7: "Never mock the system under test." — ALREADY CANON.

**Assessment:** The mask that allowed the P0 to survive Phase-1 was a wholesale mock of `useBlocks`
in the existing block-toggle test suite. Rather than importing and running the real `useBlocks`
store, those tests substituted a manual stub and directly mutated the stub's returned set — proving
only that the mocked interface was called, not that the store's real optimistic mutation propagated.
When `BlockConfirmDialog` bypassed the store, the mock-based tests could not detect it.

The corrective test (`block-dialog-store.test.tsx`) mocked only the api layer boundary and ran
the real `useBlocks` store — exactly the "mock at the boundary, not deeper" and "never mock the
SUT" principles in test-writing-principles.md § 7. This wave is a strong confirming application
of an existing rule, not a new promotable class. The rule already covers this; the observation
is informational only.

**Severity:** informational (existing rule confirmed in application; no new rule warranted).
**Candidate principles file:** none (rule already exists in test-writing-principles.md § 7).
**Promotion flag:** NO — existing canon. Log for pattern-reinforcement context only.

---

## obs-3 — INFORMATIONAL: status check on all standing prior observations from the 5-wave window

| origin | class | wave-71 status |
|--------|-------|----------------|
| wave-70 obs-2 (HOLD — 1st instance) | Realtime fan-out for a gated write must be downstream of the gate in the same callstack | NOT CONFIRMED. Zero websocket/realtime changes this wave; DM HIDE seams provably untouched. HOLD maintained. |
| wave-70 obs-3 (HOLD — 1st instance) | A backend list endpoint must include display fields if UI renders rows by name/avatar | NOT CONFIRMED as independent 2nd instance. Wave-71 is the deliberate remediation of the wave-70 gap on the same GET /blocks endpoint — not a new independent instance of the same spec-authoring class. HOLD maintained; watch for a different entity endpoint falling into the same gap. |
| wave-69 obs-2 (HOLD — held after cap; DB read-modify-write atomicity) | Enforce read-modify-write status flip at the DB layer via conditional UPDATE or SELECT FOR UPDATE, not only an in-app check | NOT CONFIRMED. Wave-71 introduces no read-modify-write status flip, no report-resolution pattern, no competing-write race. HOLD maintained. |
| wave-64 obs-1 (HOLD) | createObjectURL Blob must pair src-change revoke AND unmount revoke | NOT CONFIRMED. Wave-71 introduces no Blob, no createObjectURL, no image object URL. HOLD maintained. |
| wave-60 obs-1 (STRONG HOLD) | Hardcoded palette hex in .tsx files where consumable CSS tokens exist | NOT CONFIRMED. Wave-71 web changes are useBlocks.ts (JS/state only), BlockedUsersPanel.tsx (renders displayName/username), MemberListPanel.tsx (toggle wiring), BlockConfirmDialog.tsx (P0 fix: delegates to store). No new hardcoded palette hex. STRONG HOLD maintained. |
| wave-58 obs-A (HOLD) | Hardening a pass-regardless soft-check into a gating assertion exposes a masked production defect | NOT CONFIRMED. No existing soft-check converted to a gating assertion this wave. HOLD maintained. |
| wave-58 obs-B (HOLD) | Prod-baseURL e2e is post-deploy verification, not a pre-merge gate | NOT CONFIRMED. Pattern classification not stress-tested this wave. HOLD maintained. |
| wave-59 obs-3 (HOLD) | Test a multi-branch pure formatter with a single it.each table | NOT CONFIRMED. Wave-71 tests are store integration (block-dialog-store.test.tsx), enrichment integration (3 real-DB cases), and component unit tests. No multi-branch pure-function formatter. HOLD maintained. |
| wave-57 obs-1 (HOLD) | Interactive nav/rail button shipped with no onClick from a prior wave | NOT CONFIRMED. All wave-71 interactive affordances ship wired (blockUser/unblockUser delegate to store). HOLD maintained. |
| wave-52 obs-3(a) (HOLD) | VERIFY: independently re-probe load-bearing claims before accepting verdict | CONFIRMED BY APPLICATION. Karen git-verified all 7 file-existence claims (git cat-file), P0 fix single-call-site (`git grep api.blockUser(` → 1 site), safety-untouched claim (git diff --name-only confirms controller/dm.service not in diff), and live curl probes (POST/GET /blocks → 401). Jenny independently live-exercised both specs end-to-end (Block → flip → GET /blocks → enriched DTO; DM HIDE bidirectional before/after). Head-verifier confirmed no cross-endorsement. Still HOLD for VERIFY rule 5 candidacy. |

**Severity:** informational (status checks only; no new confirmations beyond obs-1 which is a
  1st-instance HOLD; all other HOLDs maintained).
**Candidate principles file:** none.
**Promotion flag:** NO (status check only).

---

## Summary table

| id | title (short) | severity | recurrence | candidate file | disposition |
|----|---------------|----------|------------|----------------|-------------|
| wave-70 obs-2 verdict | Realtime fan-out for a gated write downstream of the gate | informational | NOT CONFIRMED this wave | none | HOLD maintained |
| wave-70 obs-3 verdict | List endpoint display fields | informational | NOT CONFIRMED as independent 2nd instance (remediation wave, not new class instance) | none | HOLD maintained |
| obs-1 | Every mutation on shared-store-owned state must route through the store, not the raw API client | warning | FIRST INSTANCE | BUILD-PRINCIPLES rule 15 candidate | HOLD — 1st instance |
| obs-2 | Mock-SUT mask confirmed; existing test-writing-principles § 7 "never mock the SUT" already canon | informational | EXISTING RULE confirmed in application | none | NO PROMOTION — already canon |
| obs-3 | Status check on standing prior observations from 5-wave window: no new confirmations | informational | — | none | STATUS CHECK ONLY |

**Observations emitted (knowledge-synthesizer): 3 (obs-1 through obs-3; plus two explicit held-candidate verdicts)**
**Severities: 1 warning (obs-1), 2 informational (obs-2, obs-3)**
**Promotion-eligible from knowledge-synthesizer section: none this wave (obs-1 is 1st instance).**
**Cap note: no candidates have cleared the recurrence bar. The per-file per-wave cap is not in play.**
**Nominations for karen vetting: none (obs-1 is held pending a 2nd confirming wave).**

---
## L-2 promotion outcome (wave-71)
- PROMOTED: 0 (no candidate cleared the 2-wave recurrence bar).
- HELD (1st instance): obs-1 (route every mutation through the store/module that owns the optimistic state, not the raw API client — the P0 class). Live BUILD candidate for a future confirming wave.
- wave-70 obs-2 (realtime fan-out gate topology): NOT confirmed (no realtime touch). obs-3 (list endpoint display fields): NOT confirmed as independent 2nd instance (wave-71 was the REPAIR of that gap, not a fresh instance). Both HOLD maintained.
- mock-SUT lesson already canon (test-writing-principles §7); the P0-fix test (block-dialog-store.test.tsx) is a confirming application.
