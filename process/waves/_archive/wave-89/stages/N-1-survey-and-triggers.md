# N-1 — Survey & triggers (wave-89)

head-next owns this N-block. Mode: automatic. STATUS: RUNNING.

## Survey signals (Actions 1–4)

- **Active milestone (Action 1):** none. `SELECT ... WHERE status='in_progress'` → 0 rows. All 14 milestones are `status='done'` (M1–M14). Roadmap COMPLETE.
- **`todo` queue head (Action 2):** null. `SELECT ... WHERE status='todo'` (milestones) → 0 rows.
- **Active-milestone child summary (Action 3):** N/A (no active milestone).
- **Unassigned queue depth (Action 4):** 31 (`status='todo' AND milestone_id IS NULL`). Of these, 30 have `parent_task_id IS NULL` (seed candidates).

## Trigger phase (Actions 6–10)

- **Action 6 — closure:** no active milestone to close. No-op.
- **Action 7 — decomposition:** no active milestone. No-op.
- **Action 8 — slot promotion / stockout cascade:** `active_milestone == null` AND `next_todo_id == null`. Normally this fires roadmap-planning (`milestone-stockout`). **NOT fired** — founder standing directive `2026-07-09 fix-bugs` reserves the strategic re-plan for the founder (wave-80 precedent: roadmap-planning is FOUNDER-RESERVED; no agent, not even BOARD, chooses the next strategic direction). Roadmap-planning remains FOUNDER-DEFERRED. The loop continues in bug-fix mode, draining the unassigned queue (consistent with waves 82–89).
- **Action 9 — daily-checkpoint:** NOT fired this tick. Condition (a) requires "no seed candidate found" — but a genuinely-actionable seed WAS found this tick (see critical evaluation below). Daily-checkpoint fires only on a true stockout; the backlog is not stocked out.
- **Action 10 — routing:** no rituals fired.

## ⚠️ CRITICAL EVALUATION — is the actionable bug backlog stocked out? (NO)

The brief flagged a 4th-no-op risk: the last ~5 N-2 seeds evaporated/no-op'd (wave-83 ParseUUIDPipe already-fixed, wave-87 PATCH-500 already-handled, wave-88 SW-cache-bust already-shipped + db90252a deferred-unreachable, wave-89's own 45f0a88d shipped-but-no-op). Mandate: rigorously premise-verify remaining candidates against current code before seeding OR declaring stockout.

Walked the full `status='todo' AND parent_task_id IS NULL` backlog (30 candidates). Premise-verified the strongest bug-shaped ones against current code (Explore agent, file:line evidence):

| Candidate | Task id | Verdict | Evidence |
|---|---|---|---|
| PWA manifest icon 404 | `024a1483` | **LIVE-AND-REACHABLE** | `apps/web/vite.config.ts:46-49` manifest references `/icons/icon-192.png` + `/icons/icon-512.png`; `apps/web/public/` does not exist; only icon file is `src/shell/icons.tsx` (React comps, not manifest assets) → both manifest icons genuinely 404 on every install/route |
| x-powered-by header | `8f0221cb` | ALREADY-FIXED | `apps/api/src/common/security-headers.ts:60` (helmet.xPoweredBy on by default) + passing test `security-headers.spec.ts:127-130` asserts header null |
| UpdatePrivacySchema `.strict()` | `6e28e2cb` | DOC-MISMATCH-ONLY | `packages/shared/src/privacy.ts:27-35` comment claims `.strict()` but code is `.object().partial()`; unknown keys stripped (200), mass-assignment safe — not a functional bug |
| createServer TOCTOU | `db90252a` | LIVE-BUT-UNREACHABLE | `servers.service.ts:76-90` read-then-insert gate; `entitlements.service.ts:52` free cap = 100_000 placeholder (max observed 646) — deferred-unreachable |

**Also self-labeled non-actionable-as-a-bug-wave (per task descriptions, not re-verified in depth):** `fd2dc5a7` transient-401 (author-labeled "none are correctness or security defects"), `3b878f96` shared error-toast ("milestone-shaped consistency initiative, not a single bug"), `54ec742c` DELETE /servers ("feature, needs-design, founder/BOARD design touch — not a bug fix"), `ed34c749` hydration race ("not a functional defect"), plus a long tail of test-stabilization / lint / a11y-polish / doc-reconcile items.

**DECISION: NOT a stockout.** `024a1483` (PWA icon 404) is a genuinely-actionable, reachable, real functional defect — the manifest 404s on every PWA install for an offline-first product where installability is a core capability. Unlike wave-89's `45f0a88d` (unreachable error state → no-op), the icon assets are concretely absent and fail on every page load. It clears the bar the last 3–4 no-op seeds failed. Per the honest-judgment mandate, a real bug exists → seed it; do NOT manufacture a stockout.

## Deliverable

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "active milestone: null (all 14 milestones done; roadmap complete)"
  - "todo queue head: null"
  - "active child tasks: N/A (no active milestone)"
  - "unassigned queue depth: 31 (30 seed candidates)"
  - "closure: none"
  - "promotion: none"
  - "decomposition fired: false"
  - "rituals fired: [] (roadmap-planning FOUNDER-DEFERRED per 2026-07-09 fix-bugs directive; daily-checkpoint not fired — actionable seed found, no stockout)"
prev_wave: 89
active_milestone_id: null
active_milestone_child_summary:
  open: 0
  done: 0
  seed_candidates: 0
next_todo_id: null
unassigned_queue_depth: 31
state_transitions_applied: []
slot_promotion:
  promoted_id: null
  prior_active_id: null
decomposition_fired: false
proposals_fired: []
ritual_outcomes: []
loop_state: ready
note: "Roadmap complete + FOUNDER-DEFERRED re-plan (bug-fix phase). NOT stocked out — premise-verified 024a1483 (PWA icon 404) as LIVE-AND-REACHABLE real functional defect; seeding wave-90 with it. 3 other verified candidates were already-fixed / doc-mismatch / unreachable."
head_signoff:
  verdict: APPROVED
  stage: N-1
  reviewers: {}
  failed_checks: []
  rationale: "Survey signals computed from live tasks/milestones tables. Rigorous premise-verification (file:line evidence) distinguished a genuinely-actionable reachable bug (024a1483 PWA icon 404) from already-fixed/unreachable/doc-mismatch candidates — avoiding both a false stockout and a 4th no-op seed. Roadmap-planning correctly withheld per founder's FOUNDER-RESERVED re-plan directive. Backlog is NOT stocked out; loop continues."
  next_action: PROCEED_TO_N-2
```
