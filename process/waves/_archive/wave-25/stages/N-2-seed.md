# N-2 — Seed (wave-25 → wave-26 bundle)

Owner: head-next (spawn-pattern, N-block). Mode: `automatic`. N-2 identifies the next bundle; it writes no `status`/`wave_id` (B-0 of wave-26 claims; L-2 closes).

Active milestone: `a5232e16-62d5-4a7b-8fdb-3f7ceda9d09d` (M5 — Academic tooling: assignments, in_progress).

## Action 1 — Pick the seed

M5 has 4 top-level seed candidates (`parent_task_id IS NULL`, `wave_id IS NULL`, `status='todo'`). M5's own `## Scope` (assignments module + Resend reminders) is cred-blocked on the founder's Resend API key (escalated; sole M5-close blocker) — so the actionable M5 backlog is the inherited presence/invite debt these 4 rows represent. LLM judgment across the four (full descriptions read from `tasks.description`):

| id | title | verdict |
|---|---|---|
| d058283d | Rotate permanent server invite_code (owner-gated) | **Defer.** Its own TRIGGER: "before first real external users / any pre-launch link distribution." At ~0 servers the blast radius is ~0 and the trigger has not fired. Pulling now = premature work. |
| **10b9d18e** | **Presence dots on message-author rows + DM/member affordances** | **SEED.** Highest user-visible value: a reader sees at a glance whether a message author is online. Was chrome-absent-blocked; T-5 just promoted the bundled-chromium rule → UI verification now genuinely unblocked, which changes the calculus specifically in this task's favor. Design ref `design/server-channel-view.html` present. Reuses the existing presence-dot primitive + single presence store (no divergent presence source) → coherent, self-contained, end-to-end verifiable. |
| 6a546c7b | Presence perf: getCoMemberUserIds full scan | **Defer.** Explicitly "Non-blocking", "Fine at self-use-mvp scale", optimize "before multi-server scale" — a threshold not reached. Now-covered by tests. Pulling now = gold-plating. |
| d23a0740 | Presence/members code-debt (displayName fallback + unused schema) | **Defer.** Explicitly "Non-blocking cleanup"; latent schema trap with no live mismatch today. Low value, no user-visible impact. |

Seed = **10b9d18e-5071-41dc-85de-ef257b9dfde0** — "Add presence dots to message author rows and DM/member affordances".

## Action 2 — Load siblings

`WHERE parent_task_id = '10b9d18e…' AND status='todo' AND wave_id IS NULL` → **0 rows**. Single-task bundle (valid). The other 3 candidates are *separate top-level seed candidates*, not siblings, and each is explicitly deferred/non-blocking against a threshold that has not fired — bundling them would be cross-concern scope-cramming (security rotation + perf optimization + code cleanup) that does not form one smallest-viable slice with the presence-dot feature. WIP-limited to one seed.

## Action 3 — Validate the bundle

`SELECT id, status, wave_id, milestone_id, parent_task_id FROM tasks WHERE id = ANY($claimed_task_ids)`:
```
10b9d18e-5071-41dc-85de-ef257b9dfde0 | todo | (null) | a5232e16-62d5-4a7b-8fdb-3f7ceda9d09d | (null)
```
- status = 'todo' ✓
- wave_id IS NULL ✓
- milestone_id = active M5 ✓
- (no siblings to check) ✓

Validation: **pass**.

## Verdict

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed task id: 10b9d18e-5071-41dc-85de-ef257b9dfde0"
  - "bundled siblings: 0"
  - "validation: pass"
seed_task_id: 10b9d18e-5071-41dc-85de-ef257b9dfde0
seed_task_title: "Add presence dots to message author rows and DM/member affordances"
bundled_sibling_ids: []
claimed_task_ids: ["10b9d18e-5071-41dc-85de-ef257b9dfde0"]
active_milestone_id: a5232e16-62d5-4a7b-8fdb-3f7ceda9d09d
queue_exhausted: false
validation_failed: false
note: "Single-task bundle. Presence-dot feature (user-visible) unblocked by the T-5 bundled-chromium rule promotion. Other 3 M5 candidates deferred (invite-rotation trigger not fired at ~0 servers; perf + code-debt both explicitly non-blocking below their scale thresholds) — future-wave seeds, not siblings."

head_signoff:
  verdict: APPROVED
  stage: N-2
  reviewers: {}
  failed_checks: []
  rationale: >
    Bundle WIP-limited to one seed (single-task bundle) — no bloat. Seed 10b9d18e is the
    highest user-visible slice of M5's workable (presence/invite) backlog; the T-5 bundled-chromium
    promotion moved its UI verification from blocked to unblocked, which specifically raises its value
    over the three deferred candidates (each non-blocking against an unreached threshold). Seed has
    parent_task_id NULL; zero siblings loaded; DB re-validation confirms status='todo', wave_id NULL,
    milestone_id = active M5. claimed_task_ids populated for B-0 claim / L-2 close. No out-of-ritual
    INSERT (no decomposition fired — candidate pre-existed). Every N-2 exit checkbox ticks.
  next_action: PROCEED_TO_N-3
```
