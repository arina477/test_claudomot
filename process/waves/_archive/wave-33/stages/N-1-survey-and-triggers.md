# N-1 — Survey & triggers (wave-33)

Canonical state read live from Postgres (`founder_bets` / `milestones` / `tasks` / `waves`) — no sidecar / bash-var hand-off.

## Survey phase (Actions 1–4)

**Action 1 — active milestone:**
`8702a335-90ec-40ff-8c7d-a91bb7790a27` — M6 Voice/video study rooms — `in_progress`. Exactly one row (invariant OK).

**Action 2 — `todo` queue (7 rows):** highest-priority = M7 `6e2f68d8-dd04-44c5-b2e1-b9c6f28e9007` (H1, T4, product-polish).

| id | title | Horizon | Tier | LiveKit-required? | Buildable w/o keys |
|---|---|---|---|---|---|
| 6e2f68d8 | M7 — Privacy controls, notifications & launch polish | H1 | T4 | No | **YES** — settings/privacy page, notifications polish, Sentry, privacy/terms stubs, empty/error states, deploy verification |
| 84e17739 | M8 — Educator tools & deeper academics | H2 | T5 | No | YES — educator role, assignments (no grading), DMs, study-group tools (Socket.IO, not media) |
| 3e507bc0 | M9 — Monetization: freemium tiers | H2 | T5 | No | YES — Stripe (needs Stripe keys, not LiveKit) |
| 97d65b49 | M10 — Compliance & data rights | H2 | T5 | No | YES — privacy-rights UI, consent, export/delete, audit log |
| 8d88e691 | M11 — Growth: server discovery | H2 | T6 | No | YES — public discovery, browse/join |
| 36378340 | M12 — Offline-first moat | H3 | T6 | No | YES — full content sync, conflict-resolution UI |
| b7400254 | M13 — Institution partnerships & portable identity | H3 | T6 | No | YES — admin console, B2B2C, portable identity |

`next_todo_id = 6e2f68d8` (M7). **All 7 todo milestones are buildable WITHOUT LiveKit keys** — only M6's two remaining scope items (screen-share + audio-fallback) are credential-blocked.

**Action 3 — M6 child-task summary:** `open=0 done=4 seed_candidates=0` (total 4). All four done: token-mint (d8a85de0), client join surface (1dd1f2ca), occupancy indicator (78f51968), param-validation hardening (a2dd9f3d, done at L-2 this wave).

**Action 4 — unassigned queue depth:** `12`.

## Trigger phase (Actions 6–10)

**Action 6 — closure check → NO CLOSE.** M6 `open_count=0` BUT LLM-judged scope NOT shipped: M6 `## Scope` = talk + screen-share + audio-fallback + occupancy. Only talk (join+token) and occupancy are shipped; **screen-share + audio-fallback remain undecomposed**. M6 `## Success metric` ("drop in + talk + screen-share + degrade to audio-only gracefully") is NOT met. **M6 stays `in_progress`.** Fall through to Action 7.

**Action 7 — decomposition trigger → SUPPRESSED (park-or-key fork).** `seed_candidates=0` AND scope not shipped would normally fire `milestone-decomposition`. **NOT FIRED.** Reason: the only remaining M6 scope (screen-share + audio-fallback) is **credential-blocked** — both require LiveKit keys (`LIVEKIT_API_KEY/SECRET/URL`). Verified absent: `railway variables --service api | grep -c LIVEKIT` → **0**. This is the **3rd consecutive point** at which credential-independent M6 work has run out (w31 token-mint, w32 occupancy, w33 hardening — all credential-independent slices now consumed). Firing decomposition here would author a cred-blocked screen-share/audio-fallback bundle that cannot ship — the exact anti-pattern the ceo-reviewer MANDATORY flag (carried through every wave-33 block) forbids. Recorded trigger outcome: **park-or-key fork** — the loop cannot productively continue M6 without founder input (LiveKit keys OR a decision to park M6 and pivot).

**Action 8 — slot promotion → N/A.** `active_milestone != null` (M6 held). No promotion; no stockout (7 `todo` milestones exist).

**Action 9 — daily-checkpoint → NOT FIRED.** Action 9 requires "decomposition was not fired this tick" — true here, but the governing outcome is a founder-reserved strategic + credential hard-stop (park-or-key fork), which supersedes a checkpoint. The fork itself surfaces the pending state to the founder; a redundant checkpoint would double-signal.

**Action 10 — routing (mode `automatic`):** Under `automatic`, decomposition would normally spawn `milestone-decomposer` inline. The ceo-reviewer flag overrides this specific fire: the remaining bundle is cred-blocked, so the decision escalates as a founder-reserved strategic + credential hard-stop rather than a BOARD-resolvable scope call. Routed to the N-3 pause (trigger f) → founder park-or-key fork.

## Verdict

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "active milestone: 8702a335 (M6) in_progress — HELD (scope not shipped)"
  - "todo queue head: 6e2f68d8 (M7, H1, T4, buildable w/o LiveKit)"
  - "active child tasks: open=0 done=4 seed_candidates=0"
  - "unassigned queue depth: 12"
  - "closure: none (M6 scope not shipped — screen-share + audio-fallback undecomposed)"
  - "promotion: none (M6 held active)"
  - "decomposition fired: false (SUPPRESSED — remaining M6 scope credential-blocked; ceo-reviewer flag)"
  - "LiveKit key count on api service: 0 (verified via railway variables)"
  - "rituals fired: [] — park-or-key fork recorded as trigger outcome"
prev_wave: 33
active_milestone_id: 8702a335-90ec-40ff-8c7d-a91bb7790a27
active_milestone_child_summary:
  open: 0
  done: 4
  seed_candidates: 0
next_todo_id: 6e2f68d8-dd04-44c5-b2e1-b9c6f28e9007
unassigned_queue_depth: 12
state_transitions_applied: []
slot_promotion:
  promoted_id: null
  prior_active_id: 8702a335-90ec-40ff-8c7d-a91bb7790a27
decomposition_fired: false
proposals_fired: []
ritual_outcomes:
  - ritual: milestone-decomposition
    outcome_summary: "SUPPRESSED per ceo-reviewer flag — only remaining M6 scope (screen-share + audio-fallback) is LiveKit-credential-blocked (key count 0). Park-or-key fork surfaced to founder instead of authoring a cred-blocked bundle."
    decision: escalate-to-founder-fork
    by: head-next
loop_state: paused
note: "Park-or-key fork: M6 credential-independent work exhausted (3rd point). Remaining M6 scope needs LiveKit keys founder has not provided. Loop cannot productively continue M6 without founder input. next_todo_id M7 is the fully-buildable pivot target. Pause is a MEASURED condition (decomposition-blocked-on-missing-credentials), not an anticipatory 'natural break'."

head_signoff:
  verdict: APPROVED
  stage: N-1
  reviewers: {}
  failed_checks: []
  rationale: >
    Next-claimable computed from the live tasks table (seed_candidates=0 confirmed in
    Postgres, not a sidecar). Exactly one trigger outcome selected — the park-or-key fork
    — with its firing condition cited (seed_candidates=0 + scope-not-shipped + remaining
    scope credential-blocked, LiveKit key count 0). The trigger ladder was walked: closure
    (Action 6) correctly held M6 open because its ## Success metric is unmet; decomposition
    (Action 7) was suppressed precisely because auto-firing it would produce the cred-blocked
    bundle the ceo-reviewer flag forbids — this is not a pipeline stall (the fork surfaces a
    real founder decision) nor a preemptive pause (the blocking condition is measured: keys
    absent AND M6 queue holds only cred-blocked work). M7 (the only H1 todo milestone) is
    captured as the buildable pivot target for the founder's option B. All survey signals
    captured; no invariant violations.
  next_action: PROCEED_TO_N-2
```
