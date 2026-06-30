# Wave 16 — P-4 Phase-2 spec-vs-roadmap drift check (jenny)

**Verdict: APPROVE** — spec is 1:1 with the task's original intent and consistent with roadmap/decisions. No drift.

Task: `46f16288-4c13-4d8c-ad68-6925d1f51d84` (status `todo`, `wave_id` NULL → claimable seed). Spec read live from `tasks.description` (canonical), not the FS pointer.

## Per-item

| # | Check | Result | Evidence |
|---|---|---|---|
| 1 | Spec MATCHES original intent (sign in → create server → assert rail + #general) | **MATCHES** | Original wave-7 V-3 carry framing = "Playwright E2E that signs in as a verified fixture, creates a server, asserts the server appears in the rail with #general." AC#1 = sign in as verified fixture → open create-server modal → create server (unique name) → assert server in rail AND #general in channel sidebar. Exact 1:1; no clause added, none dropped. |
| 2 | No scope creep | **MATCHES** | AC#2 authed-session harness (storageState OR in-test sign-in) is the harness the original framing implicitly requires, not new scope. AC#3 anti-flake + AC#4 unique-name are carries from P-0 (`P-0-frame.md:11` "CARRY: anti-flake discipline") + known server-roles flake — hardening the same test, not widening it. |
| 3 | No scope cut | **MATCHES** | Both asserts present (server in rail AND #general in sidebar). Happy-path indivisible per mvp-thinner (`P-0-frame.md:13`). |
| 4 | Floor-exemption decision coherent + non-conflicting | **MATCHES** | `product-decisions.md:215-218` (wave-16 entry) scopes the LOC-floor exemption to test-coverage/test-infra tech-debt only, on the documented rationale that the floor is a *feature*-sizing heuristic. New process decision; does not touch or contradict any prior entry (no prior LOC-floor ruling exists). Kept single-task to respect the N-2 seed pick — consistent with the N-1 wave-10/wave-12+ notes that the 3 tech-debt tasks stay untouched for N-2 to pick naturally. |
| 5 | Stays a SINGLE happy-path authed E2E (no edge-case balloon) | **MATCHES** | AC set covers exactly one flow. `edge-cases` block explicitly defers empty-name modal validation ("out of scope (happy-path only this wave); deferred to a sibling if needed"). No multi-flow expansion. |
| 6 | Does NOT build real-PG tier (02fa8011) or PG-rollback (25523fb0); those stay separate parked tasks | **MATCHES** | DB confirms all three remain distinct `todo` rows: `02fa8011` (real-PG tier, parked under wave f46bfdf0), `25523fb0` (PG-rollback, `wave_id` NULL), `d058283d` (invite-rotation, `wave_id` NULL). `claimed_task_ids = [46f16288]` only — none folded in. Spec's `sdk` line reuses the *existing* `@playwright/test` + config, builds no new test infra/tier. |
| 7 | Correctly a TEST-INFRA wave that does NOT advance/claim an M3 feature | **MATCHES** | `P-0-frame.md:8,14` "Test-infra wave / Single-task tech-debt test wave"; `:12` ceo-reviewer "don't preempt with threads/attachments." Seed is an M3-attached carry-debt, not an M3 `## Scope` feature. M3 closure still requires threads + attachments (per `product-decisions.md:207` @mentions note: remaining M3 scope = thread replies + attachments). Spec claims no feature delivery and no M3 close. |
| 8 | Create-server flow tested MATCHES journey-map entry | **MATCHES** | Journey-map row 11 / F7 (`user-journey-map.md:33,79,209-210`): `/app` → "+" in rail → single-step name modal → `POST /servers {name}` → 201 → server appended + selected → `#general` shown. Spec's assertion targets (modal → server in rail → #general in sidebar) match the LIVE flow exactly. |

## Notes (non-blocking)
- AC#5 ("does not weaken/skip the existing unauthenticated smoke spec") correctly protects the existing `apps/web/e2e/smoke.spec.ts` — additive, no regression to prior coverage. Consistent, not drift.
- `edge-cases` notes prod-vs-local target ambiguity (verified fixture is a prod fixture); spec defers the choice to the harness doc rather than resolving it. This is an implementation/plan detail (B-block), not a spec-vs-intent drift — flag only if P-3 plan leaves it unresolved.

**Drift sources flagged: none.**
