# N-2 — Seed (wave-27 bundle)

**Block:** N (Next), stage N-2. **Mode:** `automatic`. **Owner:** head-next.
**Active milestone:** `a5232e16` — M5 — Academic tooling: assignments (`in_progress`).

## Action 1 — Pick the seed

Three top-level M5 seed candidates (`todo`, `wave_id IS NULL`, `parent_task_id IS NULL`). Full `tasks.description` read for each. Selection reasoning:

| Candidate | Verdict | Reasoning |
|---|---|---|
| **`6a546c7b` — Presence perf: `getCoMemberUserIds` full-membership scan per connect** | **SELECTED (seed)** | wave-26 just added a NEW class of presence consumer — author-avatar dots on **every** message row — so the full `server_members` scan on every connect/reconnect is now MORE load-relevant than when this was filed (wave-14 V-2 M-1/KI-1). It is server-side, **test-covered**, and has a concrete acceptance sketch (SELECT DISTINCT / index / cache), so it is verifiable at V-block. Coherent smallest-viable slice for a wave. Highest-value workable M5 item. |
| `d058283d` — Rotate permanent server `invite_code` (owner-gated) | Defer | The task carries its OWN measured trigger: *"before first real external users / any pre-launch link distribution."* StudyHall is pre-launch at ~0 servers with no external users — that condition has **not fired**, so blast radius is ~0. Deferring is a measured deferral by the task's own trigger, not anticipatory. Not the right seed now. |
| `d23a0740` — Presence/members code-debt (displayName empty-fallback + schema/wire wrapper) | Defer | Non-blocking cleanup + a latent contract trap with *"no live mismatch today."* Low-value as a standalone wave seed. Better folded into a future substantive slice by the decomposition ritual, or its own eventual cleanup wave. |

**Seed:** `6a546c7b-e459-46a6-95f2-d00707353308` — "Presence perf: getCoMemberUserIds full-membership scan per connect".

## Action 2 — Load siblings

`SELECT ... WHERE parent_task_id='6a546c7b' AND status='todo' AND wave_id IS NULL` → **0 rows.** Single-task bundle (valid).

**Considered-and-rejected sibling — `07361daf`** (client per-row presence-subscription lift; wave-26 B-6/T-7/V-2 spawn, currently `milestone_id IS NULL`, unassigned):
- **Authority:** N-2 only READS existing bundle structure. Making `07361daf` a sibling would require assigning it to M5 (`UPDATE milestone_id`) AND re-parenting it (`UPDATE parent_task_id`) — both are out-of-ritual writes N-2 is not authorized to perform. Bundle authoring is the decomposition ritual's / P-1's job.
- **Coherence:** even setting authority aside, `6a546c7b` is a **server-side** membership-scan query optimization; `07361daf` is a **client-side** React per-row subscription lift. Different layers, different code paths, no shared smallest-viable slice — combining them would be bundle-cramming (bundle-bloat anti-pattern).
- **Disposition:** left in the unassigned queue. Wave-27's P-0 unassigned-queue walk may assign it to M5; if it lands under M5 it becomes a candidate seed (or ritual-authored sibling) for a later presence-perf wave.

## Action 3 — Validate the bundle

`SELECT id, status, wave_id, milestone_id, parent_task_id FROM tasks WHERE id = ANY([6a546c7b])`:

| Check | Expected | Actual | Pass |
|---|---|---|---|
| `status` | `todo` | `todo` | ✓ |
| `wave_id` | NULL | NULL | ✓ |
| `milestone_id` | `a5232e16` (M5) | `a5232e16` | ✓ |
| `parent_task_id` | NULL (seed) | NULL | ✓ |

**Validation: PASS.**

## Action 5 — Emit claimed_task_ids

`claimed_task_ids = [6a546c7b-e459-46a6-95f2-d00707353308]` — propagates to N-3 handoff (`.last-wave-completed.yaml`), B-0 Action 1 (claim batch), and L-2 Action 1 (close batch).

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed task id: 6a546c7b-e459-46a6-95f2-d00707353308"
  - "bundled siblings: 0"
  - "validation: pass"
seed_task_id: 6a546c7b-e459-46a6-95f2-d00707353308
seed_task_title: "Presence perf: getCoMemberUserIds full-membership scan per connect"
bundled_sibling_ids: []
claimed_task_ids:
  - 6a546c7b-e459-46a6-95f2-d00707353308
active_milestone_id: a5232e16-62d5-4a7b-8fdb-3f7ceda9d09d
queue_exhausted: false
validation_failed: false
note: >
  Single-task bundle. Seed chosen for load-relevance (wave-26 added author-avatar presence dots →
  more presence consumers → full-membership-scan-per-connect is now hotter), verifiability
  (server-side + test-covered), and coherence. invite-rotation deferred by its own unfired
  "before first external users" trigger; cleanup deferred as low-value-alone. Client-side presence
  perf (07361daf) deliberately NOT bundled — different layer + unassigned + out-of-ritual to attach.

head_signoff:
  verdict: APPROVED
  stage: N-2
  reviewers: {}
  failed_checks: []
  rationale: >
    Bundle WIP-limited to one seed + zero siblings — no bundle bloat. Seed has parent_task_id IS
    NULL; milestone_id = active M5; wave_id NULL; status todo (re-validated against the DB in
    Action 3, all four checks pass). No out-of-ritual INSERT/UPDATE: the seed was authored by the
    milestone-decomposer ritual (wave-14 V-2 follow-up), and 07361daf was correctly rejected as a
    sibling rather than hand-attached. No dependency inversion (single task). All N-2 exit
    checkboxes tick. Ready for N-3 handoff.
  next_action: PROCEED_TO_N-3
```
