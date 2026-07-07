# N-1 — Survey & triggers (wave-75)

**Block:** N (Next), stage N-1. **Mode:** automatic. **Head:** head-next (owns N-block).
**Prev wave:** 75 (M9 mock-payment freemium upgrade path — shipped LIVE + verified; L-2 promoted 0 principles).

---

## Survey phase — signals captured (Actions 1–4, verified from live Postgres)

- **Wave (running):** `e977f3b9-b7e4-42f7-a2aa-828988946c39` (wave_number 75) — found via `WHERE status='running'`. Not yet closed (N-3 closes).
- **Active milestone (Action 1):** `3e507bc0-bce5-4f3b-b22a-d3c887fc0548` — *M9 — Monetization: freemium tiers*, `status='in_progress'`. Exactly one `in_progress` — invariant #1 holds.
- **`todo` queue (Action 2):** one row — `b7400254-…` *M13 — Institution partnerships & portable identity* (`## Horizon H3`, far-horizon). `next_todo_id = null` for promotion purposes: **M9 is active and unshipped, so no promotion is due** (invariant #2 forbids promoting over an un-closed active milestone). M13 is NOT promoted.
- **M9 child-task summary (Action 3):** `open_count = 3`, `done_count = 6`, `seed_candidates = 3`. All three open tasks are `todo` / `wave_id IS NULL` / `parent_task_id IS NULL` → structurally seedable.
- **Unassigned queue depth (Action 4):** `22`.

### The three open M9 tasks (read each task's own description)

| id | title | own-description verdict |
|---|---|---|
| `db90252a` | createServer TOCTOU hardening | *"UNREACHABLE at the current free placeholder (100_000)… Belongs with the real-charging M9 slice (Stripe + real prices/limits). Not blocking now."* Untestable until a restrictive server-count cap ships, which needs real charging (fenced). |
| `ab75b8d8` | Merge PR #94 (pg-harness subscriptions upsert integration test) | *"confirm 6 required checks green on #94, squash-merge + delete branch."* An ops/merge action awaiting CI-green — not a wave. Upsert already proven live at T-5. |
| `ecf79f4a` | owner/member authz check on educator-tools endpoint | *"Harmless now (boolean-only stub, no PII, no mutation)… Load-bearing prerequisite of the real educator-tools slice, not this wave."* Defensive-now; becomes load-bearing only when the FENCED real educator tools expose actual server data. |

---

## Trigger phase (Actions 6–10)

### Action 6 — Active milestone closure check → NO CLOSE
M9 `open_count = 3 ≠ 0` → closure invariant #3 fails on the count alone. Independently, the milestone's core remaining VALUE — **real charging** (Stripe Checkout/webhooks/customer-portal) — is unbuilt and founder-reserved (rule 6, account-issued credentials). `## Success metric` (mock self-upgrade free→server_pro, entitlements immediate) was **MET LIVE at T-5**, so the *fenced-autonomous* portion of M9 is effectively complete, but the milestone as a whole is NOT shipped. **M9 stays `in_progress`.** No premature-close.

### Action 7 — Per-wave decomposition trigger → NOT FIRED
Precondition `seed_candidates = 0` is **FALSE** (`seed_candidates = 3`). The active queue already holds three top-level seedable tasks; the decomposition ritual would refuse at Step 1 validation (a seed candidate exists). **No milestone-decomposer spawn. No INSERT.**

Disposition of the three existing seed candidates is the real N-1 judgment (below) — the *structural* trigger for authoring a NEW bundle does not fire.

### Action 8 — Slot promotion + stockout cascade → NOT APPLICABLE
`active_milestone != null` (M9 still `in_progress`) → no promotion. `todo` queue is non-empty (M13) → no stockout, roadmap-planning NOT fired.

### Action 9 — Daily-checkpoint trigger → NOT FIRED
Requires "no seed candidate found." `seed_candidates = 3` ≠ 0, so the checkpoint ladder condition is not met. (Note: `ab75b8d8` merge-#94 is an ops action better surfaced as a direct-merge item than a wave seed — flagged to N-3 in the note, not fired as a checkpoint here.)

### Action 10 — Route proposals per mode → nothing to route
No ritual proposal fired (no decomposition, no roadmap-planning, no daily-checkpoint). Nothing to route to BOARD / milestone-decomposer.

---

## Disposition — (B) measured founder-reserved pause

**Both anti-patterns weighed honestly:**

- **Ship-plumbing-to-dodge-pause (the risk of option A):** Bundling the three open tasks into a "substrate hardening" wave-76 fails the value test *by each task's own description.* `db90252a` is provably unreachable at current caps and self-identifies as belonging to the fenced real-charging slice — a hardening fix no test can exercise. `ecf79f4a` is a boolean-only stub with no PII/mutation and self-identifies as a prerequisite of the fenced real-educator-tools slice — defensive-ahead-of-a-fence. `ab75b8d8` is a merge-button press, not wave work. Three low-value items are **not** more wave-worthy than one; the calculus is value, not count. Authoring an autonomous wave here would produce a green diff with no verifiable end-user value — the exact dodge-the-pause failure mode.

- **Pause-when-autonomous-value-exists (the risk of option B):** Ruled out. The autonomous, credential-free value M9 could ship — the mock upgrade path + entitlements substrate + real TIER_CAPS + "Your plan" panel — is **already shipped and verified live** (wave-75, merge 3b94e276, V-block APPROVED, T-5 metric MET LIVE). What remains autonomously is plumbing-ahead-of-a-fence and an ops merge. There is no un-shipped autonomous value being abandoned.

- **Where the real remaining value is:** M9's core remaining value is **real charging**, which requires founder-issued Stripe API keys (rule 6, account-issued credential — a class the brain cannot self-resolve). This is a measured hard-stop (trigger **d**), not an anticipatory "natural break."

- **Precedent (wave-74):** chose B (pause) when the lone open task was the untestable TOCTOU. The queue went 1→3, but the two additions are wave-75 V-2/B-6 follow-ups that themselves cite the fenced slice as their home, plus a merge action. The count changed; the value did not. B remains correct.

**N-3 (not run now) will execute the pause:** write `process/session/.loop-paused.yaml` + set `STATUS: BLOCKED` with `pause_evidence.trigger: d-hard-stop-verdict`, `measurement.shape: infra-readiness`→no; correct shape is a founder-reserved credential hard-stop → `measurement` cites rule-6 Stripe-key fence as the founder-reserved value gate. The three open tasks stay queued (wave_id NULL, seedable) for the moment charging unblocks. No milestone close, no decomposition, no promotion applied at N-1.

---

## Recommended loop_state: `paused`

Rationale: no autonomous seed is worth a wave-76 loop; M9's remaining value is founder-reserved (Stripe keys). N-2 is effectively skipped (no bundle authored — the existing seedable tasks are deferred, not seeded); N-3 writes the measured pause. If the founder later provides Stripe keys (or resolves via `.loop-resume.yaml`), the three queued tasks become the natural bundle for the real-charging M9 slice and the loop resumes.

---

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "active milestone: 3e507bc0 (M9 — Monetization: freemium tiers, in_progress)"
  - "todo queue head: b7400254 (M13, H3 far-horizon) — NOT promoted (M9 active + unshipped)"
  - "active child tasks: open=3 done=6 seed_candidates=3"
  - "unassigned queue depth: 22"
  - "closure: none (M9 open_count=3, real charging unbuilt + founder-reserved)"
  - "promotion: none (active slot occupied by unshipped M9)"
  - "decomposition fired: false (seed_candidates=3, not 0 — trigger precondition unmet)"
  - "rituals fired: []"
prev_wave: 75
active_milestone_id: 3e507bc0-bce5-4f3b-b22a-d3c887fc0548
active_milestone_child_summary:
  open: 3
  done: 6
  seed_candidates: 3
next_todo_id: null            # M13 exists but is not promotable over an unshipped active milestone
unassigned_queue_depth: 22
state_transitions_applied: []
slot_promotion:
  promoted_id: null
  prior_active_id: 3e507bc0-bce5-4f3b-b22a-d3c887fc0548
decomposition_fired: false
proposals_fired: []           # no decomposition / roadmap-planning / daily-checkpoint fired
ritual_outcomes: []
open_task_disposition:
  decision: defer-all-three (no autonomous wave-76 seed authored)
  tasks:
    - {id: db90252a, title: "createServer TOCTOU hardening", verdict: "defer — untestable at current caps; self-cited to fenced real-charging slice"}
    - {id: ab75b8d8, title: "Merge PR #94 (subscriptions upsert integration test)", verdict: "defer — ops/merge action, not wave work; surface as direct-merge item"}
    - {id: ecf79f4a, title: "educator-tools owner/member authz check", verdict: "defer — boolean-only stub, no PII/mutation; prerequisite of fenced real-educator-tools slice"}
  all_remain_seedable: true    # wave_id NULL, parent NULL, status todo — recoverable when charging unblocks
disposition: B-measured-founder-reserved-pause
pause_recommendation:
  trigger: d                   # hard-stop — founder-reserved credential (real Stripe keys, rule 6)
  measurement:
    shape: founder-reserved-credential-fence
    milestone: M9 (3e507bc0)
    fenced_value: "real charging — Stripe Checkout/webhooks/customer-portal (account-issued credential, rule 6)"
    autonomous_value_status: "SHIPPED + verified live wave-75 (mock upgrade path, entitlements, TIER_CAPS, Your-plan UI; T-5 success metric MET LIVE)"
    open_tasks_deferred: 3
    checkpoint_surfaced_at: "process/session/updates/founder-checkpoint-2026-07-07-m9.md (item 2 pricing already resolved by 2026-07-07 delegation; item 1 Stripe keys outstanding)"
  executed_by: N-3            # N-1 does NOT write .loop-paused.yaml or STATUS; N-3 Action performs the pause
loop_state: paused
note: >
  N-1 fired no ritual: closure fails (M9 open=3, core charging unbuilt + founder-reserved), decomposition
  precondition unmet (seed_candidates=3, not 0), no promotion (active slot occupied by unshipped M9), no
  stockout (M13 todo present). The three seedable open tasks are all either untestable-ahead-of-a-fence
  (db90252a), an ops/merge action (ab75b8d8), or defensive-ahead-of-a-fence (ecf79f4a) — none worth an
  autonomous wave-76. Disposition B (measured founder-reserved pause, trigger d) — mirrors wave-74's clean
  pause; count 1→3 does not change the value calculus. N-3 executes the pause. ab75b8d8 (merge #94) is an
  ops action better handled as a direct-merge/checkpoint item than a wave seed — flagged for N-3/founder,
  not acted on at N-1 (merging is not an N-1 write). No DB writes applied at N-1.
```
