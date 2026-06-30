# BOARD — N-1-ordering-wave-17

**Convened:** 2026-06-30 (wave-17 N-1, `automatic` mode)
**Decision class:** Milestone scope / sequencing (Tier-3-class → strict 6+/7 bar)
**Bound by:** ceo-reviewer BINDING ordering note at wave-17 P-0 — "3 consecutive tech-debt waves displacing M3 success-metric features = DRIFT."

## Question

wave-18 ordering:
- **(A)** continue draining parked M3 tech-debt per the ritual (next oldest seed = `d058283d` invite-code rotation), OR
- **(B)** prioritize M3's unshipped success-metric FEATURES — defer the parked tech-debt seed candidates so milestone-decomposition authors the **thread replies** (or attachments) bundle, advancing M3 toward closure.

## Context given to all 7 seats

- M3 — Real-time messaging (`in_progress`, T2, product-feature). Success metric: "messages in real time, with reactions, **threads**, and **attachments** working."
- `## Scope` lists thread replies (`thread_parent_id`) + file/image attachments (Railway Buckets, ≤10MB) — both UNSHIPPED, neither decomposed. 15 done tasks cover everything else (messaging core, edit/delete, reactions, presence, typing, member-list, @mentions).
- 5 seedable top-level todos, ALL tech-debt: d058283d (invite rotation), 02fa8011 (real-PG test tier — partially mitigated by wave-17 harness), 6a546c7b (presence perf), d23a0740 (presence code-debt), c18b8089 (mention parser parity).
- wave-16 + wave-17 were 2 consecutive tech-debt/test-infra waves.
- Live founder bet: "Academic tools + offline-first win students from Discord."
- M4 (offline-first wedge) is `## Required by`-downstream of M3.
- Effort: threads lighter (schema + nested UI, self-contained, no SDK/creds); attachments needs storage SDK + possibly founder creds.

## Votes (7 seats — fresh context, parallel, no cross-talk)

| Seat | Vote | Hard-stop |
|---|---|---|
| strategist | APPROVE B | none |
| industry-expert | APPROVE B | none |
| realist | APPROVE B | none |
| user-advocate | APPROVE B | none |
| risk-officer | APPROVE B | none |
| counter-thinker | APPROVE B | none |
| founder-proxy | APPROVE B | none |

**Tally: 7/7 APPROVE B (unanimous). 0 hard-stops. 0 dissent on direction.**

### Per-seat rationale (condensed)

- **strategist** — Roadmap is explicit M1→M2→M3→M4; M4 (the wedge) builds on the messaging path and is downstream of M3. Threads+attachments are the LAST 2 scope items gating M3; closing M3 is the on-sequence path to the differentiator. A 3rd tech-debt wave is the "differentiator-deferred" failure mode; ceo already drew the DRIFT line. Threads-first (no SDK/creds).
- **industry-expert** — Discord/Slack/Revolt all shipped threads+attachments as core chat, not a post-hoc debt pass. Parking *security* tech-debt one wave to complete a metric feature is known-good; no moderation/data-loss exposure here. Threads-first: `thread_parent_id` is a solved self-contained pattern; attachments add object-storage + creds.
- **realist** — Of 5 parked items, 02fa8011 is verified-low-value now (wave-17 harness partially mitigates). d058283d + 6a546c7b are unmeasured hardening/code-smell claims; zero-users = no production exposure/load. (A)'s "real present value" is mostly speculative; both options unproven on demand, but the binding ceo note + least-wishful value tiebreak to B. Cheapest reversible step.
- **user-advocate** — Threads + attachments are felt-missing instantly (F3 lists "reply/thread" + "attach file/image" as core steps; journey map confirms both unshipped). 4/5 tech-debt items are internal/invisible; the one user-facing item (invite rotation) logged "0 prod servers so no live exposure." Ship visible feature first; threads then attachments.
- **risk-officer** — None of the 5 parked items is irreversible. Invite-rotation owner-gated on UNIQUE regeneratable code; presence scan bounded at ≤30-concurrent MVP scale; mention-parser non-destructive. Threads-first is the LOWER-tech-risk ordering: `thread_parent_id` + index already in canonical + IndexedDB schema (additive/expand-contract), and landing it BEFORE M4 offline-sync hardens avoids a later schema change under a live outbox/Dexie surface. Attachments is endpoint-swappable (no lock-in) but adds vendor surface → defer within B.
- **counter-thinker** — Steel-manned (A): only mention-parser parity has a real correctness argument (persist path M4 inherits); the other 4 are scale/security loads whose triggers are dormant at zero-users — draining them now is the gold-plate-before-PMF reference class that sinks pre-PMF teams. "DRIFT" is a real failure mode. (B) framing also flawed ("threads closes M3" is false — needs threads AND attachments) but decision is fully reversible → features win.
- **founder-proxy** — Bet prose: academic + offline-first "layered on top of" the Discord-style model — parity is the floor, threads/attachments unnamed but still required by M3's metric. Wave-4 founder ruling "fold follow-ups in, keep momentum"; wave-9 deferred the exact (A) seed `d058283d` gated on "first real external users / pre-launch link distribution" — trigger NOT fired (self-use-mvp, 0 prod servers). N-1 authored feature slices over these parked items across waves 11–15. (Evidence: product-decisions.md L143-144, L158-159, L179-213; live founder_bets row.)

## Consolidated decision

**APPLY B — prioritize M3 success-metric features. Decompose THREADS first** (lighter, self-contained, `thread_parent_id` already modeled, no new SDK/founder creds; lands before M4 offline-sync hardens — risk-officer's lower-risk ordering). The 5 parked tech-debt seeds remain `todo`, `wave_id IS NULL` (parked, NOT cancelled).

Strict 6+/7 Tier-3 bar cleared (7/7). Clean unanimous decision — no escalation to founder.

## Advisory dissent notes (non-blocking — recorded for future N-1 / P-0)

1. **invite-code rotation (`d058283d`)** — re-seed as a hard-gate candidate at the first pre-launch / external-user wave (its deferral trigger). Do not park indefinitely past M3 closure. (strategist, industry-expert, user-advocate, founder-proxy)
2. **mention-parser parity (`c18b8089`)** — a real persist-path correctness item M4 offline-sync will inherit; fold into the threads wave OR verify green, defer no more than one further wave. (counter-thinker, risk-officer)
3. **presence-perf (`6a546c7b`)** — if cheaply measurable, one profiling run could flip it from code-smell to fact; otherwise correctly deferred at zero-users. (realist)
4. **attachments** — defer within B until after threads; endpoint-swappable storage SDK (no lock-in) but adds vendor surface + likely founder creds. (risk-officer, industry-expert)
