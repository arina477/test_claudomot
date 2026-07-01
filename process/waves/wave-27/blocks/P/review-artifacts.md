# Wave 27 — P-block review artifacts

**Block:** P (Product)
**Wave topic:** Server presence perf — getCoMemberUserIds full server_members scan per connect (optimize before scale)
**Block exit gate:** P-4
**Status:** gate-passed

## Stage deliverables
| Stage | Deliverable file | Status | Notes |
|---|---|---|---|
| P-0 | stages/P-0-frame.md | done | PROCEED + accepted SELECTIVE-EXPANSION (bundle client 07361daf → 2-spec presence-perf) + problem-framer index-correction; M5 park-or-key escalation sharpened |
| P-1 | stages/P-1-decompose.md | done | multi-spec (2 specs); under-floor PRECEDENT-APPLICATION override-ship (6th); design_gap_flag=false → skip D |
| P-2 | stages/P-2-spec.md | done | multi-spec, 2 spec blocks to 6a546c7b.desc |
| P-3 | stages/P-3-plan.md | done | Spec A server_members(user_id) index (database-administrator) ∥ Spec B MessageList subscription lift (react-specialist); B-1 skip |
| P-4 | blocks/P/gate-verdict.md | done | head-product APPROVED + karen+jenny APPROVE; Gemini UNAVAILABLE (non-block); gate-passed |

## Block-specific context
- **Wave topic:** `presence.service.getCoMemberUserIds` does a full `server_members` scan on every /presence connect/reconnect. Optimize (SELECT DISTINCT / index / cache). Source wave-14 V-2 (M-1/KI-1). Now hotter after wave-26 shipped author-avatar presence dots (a new presence consumer on every message row).
- **Spec-contract short-circuit:** no-prior-spec → full P-1..P-3.
- **Roadmap milestone:** M5 (a5232e16) in_progress. Class=product-feature, Tier=T3. Re-homed presence/perf debt under active M5 (M5 scope is assignments). wave row milestone backfilled = M5.
- **wave_db_id:** 246e65b9-8358-4c06-b958-19b2db721a2a (wave_number 27).
- **design_gap_flag:** FALSE (server index migration + client subscription refactor; no new UI) → skip D.
- **claimed_task_ids:** [6a546c7b, 07361daf] (SELECTIVE-EXPANSION: client sibling 07361daf re-homed to M5 + parented under seed; multi-spec).
- **Tier-3 product decisions resolved this wave:** none (backend perf optimization; no money/security/major-UX tradeoff).
- **Autonomous mode active during P-block:** automatic.
- **Carry:** wave-26 spawned `07361daf` (CLIENT per-row presence-subscription perf, unassigned queue) — the client half of presence perf; this seed is the SERVER half. P-0 may consider whether they're one coherent perf slice. Resend-key M5 blocker record-only.

## Open escalations carried into gate
- **M5 park-or-key fork** (founder decision, 6th-wave recurrence) — sharpened per ceo-reviewer; elevate to first-class blocking founder fork at P-4 (provide Resend key → build reminders → close M5, OR park M5 + pivot). Recorded to founder digest 2026-07-01.

## Gate verdict log
<appended by fresh head-product spawn at P-4 Action 1>

## Binding B-block carries (P-4 Phase 2)
- **CARRY-A (applied):** Spec A (server_members index + migration + query-plan test) routes to `postgres-pro`, NOT database-administrator (karen rule-11 fix).
- **CARRY-B (jenny LOW):** Spec B react-specialist MUST preserve wave-26 CARRY-1 per-author render-scoping when lifting to a single list subscription (a dot re-renders only on ITS author's change; not whole-list on any event). Justify if whole-list chosen. task-completion-validator confirms at V.

