## Wave 61 stage completion

Seed task: 874bd233 — DM: reconcile /dm/candidates throttle policy + message-poll 429 backoff
Bundled siblings: (none — single-task bundle)
claimed_task_ids: [874bd233-e5fc-4c29-a851-4474b330c0e6]
Active milestone: M8 — Educator tools & deeper academics (84e17739-af5e-4396-beb9-b6f3d6836fc4, in_progress)

LAST DRAINABLE M8 TAIL ITEM. After this seed drains, M8's only remaining task is 999a14d1
(getDmCandidates pagination — do-not-auto-drain, wave-56 deferral stands). At wave-61 N-1 the
next-claimable will go NULL with unassigned_queue_depth>0 → daily-checkpoint fires → founder.
wave-61 is very likely the last autonomous wave before a founder checkpoint.

Pending founder-direction flags (non-pausing, carried from wave-59 N-1 BOARD → wave-60 P-0 foregrounding):
- M12 "Offline-first moat" (36378340) — highest-value AUTONOMOUS next direction; blocked only on founder blessing + a rough success metric (`## Success metric = _TBD by founder_`). Surfaced: checkpoint-2026-07-06-m8-tail-vs-m12-offline-first.md + board-digest-2026-07-06.md. P-0 of this wave should check for a founder answer to the direction flag before framing.
- M9 "Monetization: freemium tiers" (3e507bc0) — FOUNDER-RESERVED (pricing, rule 17); soft flag. NOT board-decidable.

PRODUCT:
- [ ] P-0 Frame (discover + reframe)
- [ ] P-1 Decompose
- [ ] P-2 Spec
- [ ] P-3 Plan
- [ ] P-4 Gate

DESIGN (skip block if non-UI wave):
- [ ] D-1 Brief
- [ ] D-2 Variants (with bounded iteration)
- [ ] D-3 Review & adopt

BUILD:
- [ ] B-0 Branch & schema
- [ ] B-1 Contracts
- [ ] B-2 Backend
- [ ] B-3 Frontend
- [ ] B-4 Wiring
- [ ] B-5 Verify
- [ ] B-6 Review

CI/CD:
- [ ] C-1 PR, CI & merge
- [ ] C-2 Deploy & verify (canary armed when real users > 1000)

TEST:
- [x] T-1 Static (CI SUCCESS)
- [x] T-2 Unit (web 477/477 + api 152/152)
- [~] T-3 Contract (SKIP: no shape change)
- [~] T-4 Integration (SKIP: no schema/boundary change)
- [~] T-5 E2E (SKIP: no journey change)
- [~] T-6 Layout (SKIP: no layout change)
- [~] T-7 Perf (SKIP: not heavy)
- [x] T-8 Security (LIVE probe PASS — override live, global still 10/60s, buckets isolated)
- [x] T-9 Journey (head-tester APPROVED; regen skipped; gate-passed)

VERIFY:
- [x] V-1 Independent reviews (Karen + jenny, parallel)
- [x] V-2 Triage
- [x] V-3 Fast-fix loop (or close) — head-verifier APPROVED; Phase 2 skipped (empty queue)

LEARN:
- [x] L-1 Docs (CHANGELOG #76 Fixed; M8 stays in_progress 42/43; README skip; STOCKOUT→N-1 flag)
- [x] L-2 Distill (874bd233 done; 5 obs; PROMOTE-ZERO — P-0 REFRAME confirmed-by-application of PRODUCT rules #1/#2)

NEXT:
- [ ] N-1 Survey & triggers
- [ ] N-2 Seed
- [ ] N-3 Handoff
