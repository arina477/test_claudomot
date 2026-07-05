# N-1 — Survey & triggers (wave-52)

**Block:** N (Next), stage N-1 of N-1 → N-2 → N-3. **Mode:** `automatic`. **Gate owner:** head-next.

Closes out wave-52 (joinable focus room shipped LIVE; L-1 + L-2 complete, 2 principles promoted: T-5 rule 3 E2E-handshake, PRODUCT rule 5 floor-carve-out). Reads the milestone state machine off the live brain DB, walks the trigger ladder, and verdicts the milestone disposition + next-bundle seed priority for N-2. No DB writes this tick (no transitions fire).

---

## Survey phase (Actions 1–4) — captured from live Postgres

All signals re-read from the four canonical tables this tick (not a sidecar / bash-var hand-off).

### Action 1 — Active milestone
```
84e17739-af5e-4396-beb9-b6f3d6836fc4 | M8 — Educator tools & deeper academics | in_progress
```
Exactly one `in_progress` row → invariant 1 (≤1 active) holds. `active_milestone = M8`.

### Action 2 — `todo` queue (by created_at)
```
3e507bc0  M9  — Monetization: freemium tiers                    (head)
97d65b49  M10 — Compliance & data rights
8d88e691  M11 — Growth: server discovery
36378340  M12 — Offline-first moat
b7400254  M13 — Institution partnerships & portable identity
```
`next_todo_id = 3e507bc0` (M9). Queue depth 5 → **no stockout**.

### Action 3 — M8 child-task summary
```
open_count=8   done_count=33   seed_candidates=8
```
All 8 open tasks are top-level (`parent_task_id IS NULL`) AND unassigned (`wave_id IS NULL`) → all 8 are seedable.

### Action 4 — Unassigned queue depth
```
13
```

---

## Trigger phase (Actions 6–10)

### Action 6 — Active milestone closure check → NO CLOSE (drain in progress)

**Mechanical rule:** closure `in_progress → done` requires ALL child tasks terminal (invariant 3). `open_count = 8 ≠ 0` → **M8 does NOT close this tick.** Mechanically blocked.

**LLM scope-shipped judgment (informational — drives disposition):** M8's substantive `## Scope` is **SHIPPED**. Mapping the 33 done tasks against each `## Scope` bucket + the `## Success metric`:

| `## Scope` bucket | Shipped-by (done task ids) | Verdict |
|---|---|---|
| Educator/Facilitator role (P3) + light moderation | `6cf06f99` RBAC role, `6ddddc2d` delete-any-message + member timeout, `ca43eb12` delete E2E | SHIPPED |
| Assignment collect/return (NO grading) | `db8e082a` collect backend+UI, `b859984b` return action, `1746f72a` submissions roster, `8d971bc2` test hardening | SHIPPED |
| Class scheduling/calendar | `535bdb8c` backend+authoring UI, `1216146e` detail view, `cdf81427` member calendar, `0308cdf1` DTO+tests | SHIPPED |
| Study-group tools (shared timers/Pomodoro, sessions, whiteboard) | `1387d845`+`cb81bf03`+`c3daf6d3`+`832b83b7`+`f4b3659e` full study-timer, `ef84b378`+`d123d9e0`+`aad849ac` joinable focus rooms | SHIPPED (whiteboard explicitly H2-deferred per milestone prose) |
| Direct + group DMs (first slice per Success metric) | `a48f1910` schema+spine, `1ceffdc9` UI, `32f5d29e` Socket.IO fan-out, `d8264800` offline-tolerant, `10967558` startable DMs, `03ccf636`/`379978a4`/`39fc1c5e` correctness | SHIPPED |
| Message search | *(no dedicated done task; not present in the 8 open either)* | not slice-1 headline; `## Success metric` first-slice = "direct + group messages", search deferred |

**Judgment:** the 8 open tasks carry **NO net-new headline scope** — every one hardens or polishes a surface already shipped (see Action-7 table). The milestone's mvp-critical claim (a class cohort runs coursework end-to-end without falling back to Discord) is met: teacher side live (roles, assignment collect/return, scheduling) AND students hold private 1:1 + small-group DMs, realtime + offline-tolerant. → **drain-to-close**, NOT re-decompose.

Closure does not fall through to Action 7 (that path is for scope-NOT-shipped; here scope IS shipped and seed candidates exist).

### Action 7 — Per-wave decomposition trigger → DOES NOT FIRE

Fires only when `seed_candidates = 0 AND scope NOT shipped`. Here `seed_candidates = 8 ≠ 0` (and scope IS shipped) → **decomposition does NOT fire.** No `milestone-decomposer` spawn. Confirmed.

### Action 8 — Slot promotion + stockout cascade → NEITHER FIRES

`active_milestone != null` (M8 `in_progress`) → **no promotion** (8a skipped). M9 cannot promote while M8 `in_progress` (invariant 2: prior active must reach `done`/`cancelled` first). `next_todo_id != null` (queue depth 5) → **no stockout cascade** (8b skipped, no roadmap-planning). Confirmed.

### Action 9 — Daily-checkpoint trigger → DOES NOT FIRE

Requires `seed_candidates = 0 (no candidate) AND decomposition not fired AND unassigned > 0`. First conjunct fails: `seed_candidates = 8`. Next-claimable is non-null (8 seedable M8 tasks). → **daily-checkpoint does NOT fire.** Confirmed.

### Action 10 — Route proposals per active mode → nothing to route

No ritual proposals fired this tick. Nothing routes to BOARD or `milestone-decomposer`.

---

## Milestone disposition recommendation (LLM judgment for N-2)

**Keep M8 `in_progress`; DRAIN the 8 stragglers wave-by-wave** (state-machine-correct — invariant 3 forbids close while open, and the shipped-scope judgment says these are hardening tail, not new features). Each subsequent wave picks the next-priority seed until `open_count` reaches 0, then N-1 closes M8 and promotes M9.

**N-2 seed-priority ordering** — lead with security/privacy/correctness over pure polish:

| Priority | Task | Why lead / defer |
|---|---|---|
| 1 | `fb1c367a` — non-UUID serverId leaks raw DB error via gateway catch (info-disclosure, F-1) | **Security** — active info-disclosure; app-wide surface. Highest value. |
| 2 | `344eabde` — who_can_dm='server-members' positive-control integration case | **Privacy** — closes a DM-privacy control gap with a positive-control test. |
| 3 | `c5051444` — LIMIT/pagination on getDmCandidates for large-server scale | **Scale** — shares the `/dm/candidates` surface with #4. |
| 4 | `874bd233` — reconcile /dm/candidates throttle policy + message-poll 429 backoff | **Scale/rate-limit** — same `/dm/candidates` + poll surface as #3. |
| 5 | `ff09c4c9` — DM→server return: ServerRail should exit dmHomeActive | **Correctness/nav bug** — user-visible F-1 navigation defect. |
| 6 | `5bcbd27f` — DM off-token surface substitutions (rail / picker / disabled-send) | Design-token polish. |
| 7 | `f8eb49c1` — unit-test buildTypingLabel transition table | Pure test coverage. |
| 8 | `a1dda389` — harden delete-any-message E2E to deterministic hard assertion | Test hardening. |

**Bundle shape advice for N-2:** the highest-priority item `fb1c367a` (info-disclosure) is a self-contained security seed — recommend a **single-seed bundle** (0 siblings) to keep WIP tight and the security fix un-entangled. NOTE the DM-hardening cluster `c5051444` (#3) + `874bd233` (#4) share the `/dm/candidates` surface and are a natural themed 2-task bundle for a *later* wave — but N-2 should NOT reach for them this tick over the security item. N-2 picks the oldest `parent_task_id IS NULL` seed by the ritual's `created_at` rule; if the created_at order does not match this priority, N-2's seed-selection judgment should prefer the security seed and record the deviation. Final seed/sibling pick is N-2's call against the DB.

---

## Rituals — none fire

- **daily-checkpoint:** does NOT fire (seed candidates exist; next-claimable non-null).
- **roadmap-planning:** does NOT fire (todo queue non-empty, depth 5; no stockout).
- **milestone-decomposition:** does NOT fire (`seed_candidates = 8 > 0`; scope shipped).

Confirmed — Action 10 routes nothing.

---

## Pause check → LOOP CONTINUES

No measured pause trigger fires (rule 13, `automatic` mode):
- **(b)** STATUS unchanged — `status-check.yaml` reads `STATUS: RUNNING`, no other agent flipped it.
- **(d)** No hard-stop: no gate-verdict hard-stop, no monitor-task wait, no infra-readiness sentinel, no DB error (all queries returned clean).
- **(e)** No founder message since last tick.
- **(f)** No `process/session/.loop-paused.yaml` present.

No `.loop-resume.yaml` present. This is a straggler-drain tick with shipped headline scope — an anticipatory "natural break" pause here would be a rule-13 violation. **Brain decides breaks at N-3, not N-1.** `loop_state: ready` → proceed to N-2.

---

```yaml
head_signoff:
  verdict: APPROVED
  stage: N-1
  reviewers: {}
  failed_checks: []
  rationale: >
    All N-1 survey signals (Actions 1–4) were computed this tick from the live
    Postgres milestones/tasks tables, not a sidecar. Exactly zero triggers fired,
    each with its firing condition cited: closure blocked mechanically (open=8≠0)
    though M8's substantive ## Scope is LLM-judged shipped (educator role,
    assignment collect/return, scheduling, study-group tools incl. joinable focus
    rooms, DM first-slice all have done tasks among the 33; whiteboard + message-
    search are prose-deferred, not slice-1 headline); decomposition suppressed
    (seed_candidates=8>0, scope shipped); no promotion/stockout (M8 active, todo
    queue depth 5); daily-checkpoint suppressed (next-claimable non-null). The 8
    open tasks carry no net-new headline scope — all polish/hardening. Disposition:
    keep M8 active, drain wave-by-wave, security/privacy/correctness ahead of
    polish. No measured pause trigger (b/d/e/f) fired. Loop continues to N-2.
  next_action: PROCEED_TO_N-2

n_stage_verdict: COMPLETE
verdict_evidence:
  - "active milestone: 84e17739-af5e-4396-beb9-b6f3d6836fc4 (M8, in_progress)"
  - "todo queue head: 3e507bc0-bce5-4f3b-b22a-d3c887fc0548 (M9); queue depth 5"
  - "active child tasks: open=8 done=33 seed_candidates=8 (all 8 top-level, wave_id NULL)"
  - "unassigned queue depth: 13"
  - "closure: none (open=8≠0 mechanically blocks; ## Scope LLM-judged shipped — drain-to-close)"
  - "promotion: none (M8 in_progress; invariant 2 blocks M9)"
  - "decomposition fired: false (seed_candidates=8>0, scope shipped)"
  - "rituals fired: []"
prev_wave: 52
active_milestone_id: 84e17739-af5e-4396-beb9-b6f3d6836fc4
active_milestone_child_summary:
  open: 8
  done: 33
  seed_candidates: 8
next_todo_id: 3e507bc0-bce5-4f3b-b22a-d3c887fc0548
unassigned_queue_depth: 13
state_transitions_applied: []
slot_promotion: none
decomposition_fired: false
proposals_fired: []
ritual_outcomes: []
loop_state: ready
note: >
  Straggler-drain tick. M8 substantive scope shipped; 8 open tasks are polish/
  hardening tail with no net-new headline scope. Recommended N-2 seed priority
  (security/privacy/correctness first): fb1c367a (info-disclosure, F-1) →
  344eabde (DM privacy control) → c5051444 (DM scale/LIMIT) → 874bd233 (DM
  throttle/backoff) → ff09c4c9 (DM→server nav bug) → 5bcbd27f (token polish) →
  f8eb49c1 (unit test) → a1dda389 (E2E hardening). Bundle-shape advice: single-
  seed bundle on fb1c367a (0 siblings) to keep the security fix un-entangled;
  c5051444+874bd233 share /dm/candidates and are a natural 2-task themed bundle
  for a LATER wave, not this tick. No DB writes applied (no transitions). Loop
  continues to N-2 under automatic mode — no measured pause trigger fired.
```
