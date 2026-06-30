# Wave 15 — T-block review artifacts

**Block:** T (Test)
**Wave topic:** M3 @mentions — parse/resolve/persist + realtime fan-out + my-mentions + composer autocomplete + mention pills + unread-mention badge
**Block exit gate:** T-9
**Status:** gate-passed

```yaml
test_block_status:    complete
stages_run:           [T-1, T-2, T-3, T-4, T-5, T-6, T-8, T-9]
stages_skipped:       [{stage: T-7, reason: "not a heavy wave; additive diff, no perf-sensitive surface"}]
findings_total:       7      # T1-F1 LOW, T2-F1 info, T3-F1 LOW, T4-F1 MED, T5-F1 MED, T6-F1 LOW, T8-OBS info
findings_critical:    0
findings_high:        0
findings_aggregate:   process/waves/wave-15/blocks/T/findings-aggregate.md
journey_map_commit:   bcdfd2b357c08acee5d8afa9ab6e42be43c1eca0
ready_for_verify:     true
```

## Stage deliverables

| Stage | Deliverable file | Pattern | Status | Notes |
|---|---|---|---|---|
| T-1 | process/waves/wave-15/stages/T-1-static.md | ci-verified | done (APPROVED) | lint+typecheck green; 1 prod cast (L-1 carry); biome useSemanticElements:off justified but global (T1-F1 LOW) |
| T-2 | process/waves/wave-15/stages/T-2-unit.md | ci-verified | done (APPROVED) | 471 tests; parseMentions transition-table; H-1/H-2 unit-covered; T2-F1 carry (no real-PG integration tier 02fa8011) |
| T-3 | process/waves/wave-15/stages/T-3-contract.md | ci-verified | done (APPROVED) | 5 schemas; behavioral contract covered via consumers; no dedicated schema test (T3-F1 LOW); type-only, never runtime-parsed |
| T-4 | process/waves/wave-15/stages/T-4-integration.md | mixed | done (APPROVED) | message_mentions unit-mocked + boot-probed + C-2-pg-verified; no real-PG integration tier (T4-F1 MED = carry 02fa8011) |
| T-5 | process/waves/wave-15/stages/T-5-e2e.md | active | done (APPROVED) | all 7 scenarios PASS via bundled-chromium; MCP swarm BLOCKED (T5-F1 MED — chrome-channel absent) |
| T-6 | process/waves/wave-15/stages/T-6-layout.md | active | done (APPROVED) | pills token-compliant (--surface-700/--accent-emerald); WCAG AA 10.08:1; 1440/1280/1024; T6-F1 LOW radius note |
| T-7 | process/waves/wave-15/stages/T-7-perf.md | active | skipped | not a heavy wave; additive diff, no perf-sensitive surface |
| T-8 | process/waves/wave-15/stages/T-8-security.md | active | done (APPROVED) | LOAD-BEARING all 5 PASS live (two-client): H-1 realtime ALIVE, my-mentions IDOR-closed, membership-scoped, 401, no self-badge; secret-grep clean |
| T-9 | process/waves/wave-15/stages/T-9-journey.md | active | pending | journey regen (mention surfaces) + scenario smoke + gate verdict |

## Block-specific context

- **Wave topic:** M3 @mentions data plane + composer autocomplete + pills/unread badge
- **wave_type:** ui + backend + auth (my-mentions authz + membership-scoped resolution → T-8 LOAD-BEARING)
- **Stages skipped (with reasons):** T-7 perf (not heavy wave; recorded skip)
- **Cumulative findings count:** 5 (T1-F1 LOW, T2-F1 info, T3-F1 LOW, T4-F1 MED, T5-F1 MED, T6-F1 LOW, T8-OBS info) — 0 critical, 0 high

## Specs (3)

- `3d238446` — @mention data plane: parse/resolve/persist message_mentions + realtime + GET /me/mentions
- `cd585f04` — composer @autocomplete member-picker
- `c3f3f62a` — mention pills + unread-mention badge

## Carried B-6 accepted debt (surfaced to V-2; NOT T-block blocking decisions)

- **M-1** — migration index omits `DESC` (backward btree scan still correct; comment/SQL drift). Accepted.
- **M-2** — client `@token` extraction mis-tags interior-dot usernames (`@bob.dev` won't render pill). Client/server tokenizer divergence. Cosmetic. Accepted.
- **M-3** — non-idempotent create re-select under identical concurrent posts (UNIQUE+ON CONFLICT bounds blast radius). Pre-existing wave-12 pattern. Accepted.
- **M-4** — edit-diff delete+insert not transactional (reconverges on next edit; no data loss). Accepted.
- **L-1** — document-level capture keydown on open popover. Accepted.
- **L-2** — blur 150ms setTimeout no cleanup. Accepted.
- **L-3** — redundant membership predicate in my-mentions. Accepted.
- **L-4** — self-mention bootstrap badge count (phantom badge on reload). Accepted.
- **L-5** — `nullish` vs `nullable` contract drift across paginated responses. Accepted.
- **L-6** — bootstrap/live overlap can transiently double-count one channel (self-corrects on channel-open). Accepted.

## B-6 H-1 fix (LOAD-BEARING T-8 target)

H-1 (realtime unread badge dead-feature) was found and FIXED pre-merge:
per-user room `user:<userId>` joined on connect; `mention.created` emits to `user:<mentionedUserId>` decoupled from channel rooms; server-side author exclusion; client subscribes once + suppresses active channel.
T-8 must VERIFY this is alive in prod with two distinct authenticated clients (A mentions B in a channel B is not viewing → B receives `mention` event + badge increments).

## Findings aggregation

Findings written incrementally to `process/waves/wave-15/blocks/T/findings-aggregate.md`. Aggregate is the canonical V-2 input.

## Open escalations carried into gate

none

## Gate verdict log

- **Attempt 1 (T-9 Phase 1):** APPROVED — fresh head-tester (agentId ace214d93f8422e6c). 0 critical, 0 high. All 5 load-bearing T-8 checks PASS live two-client. Two MEDIUM (T4-F1 integration tier, T5-F1 MCP misconfig) + 3 LOW carried to V-2 as recorded conditions, not rework. Tightened: V-2 must issue explicit disposition on the 2-wave 02fa8011 integration carry. rework_attempt_cap_remaining: 2. Verdict: process/waves/wave-15/blocks/T/gate-verdict.md.
