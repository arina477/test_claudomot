```yaml
verdict: PROCEED
verdict_source: ceo-reviewer
mode_applied: HOLD-SCOPE
mode_rationale: |
  This is the opening slice of M4 — the offline-first wedge, arguably the single most
  strategically important milestone on the roadmap. The proposed bundle (idempotent-send
  contract + IndexedDB local store + outbox/optimistic-send integration + offline test
  harness) is the coherent send-SPINE of the M4 success metric, and it is correctly bounded:
  not SCOPE-EXPANSION (over-reaching into CRDT / service-worker PWA / multi-device sync /
  offline-for-every-entity would bloat a first offline wave and delay the falsifiable proof);
  not SCOPE-REDUCTION (you cannot ship "exactly-once on reconnect" without all four pieces —
  drop any and the metric collapses); not SELECTIVE-EXPANSION (no cheap-but-disproportionate
  add exists — the cheapest meaningful extension, read-cache for whole channels beyond the
  outbox, is already in scope). Scope is exactly right; the bar here is execution rigor.
bet_traced_to: "Academic tools + offline-first win students from Discord" (founder_bets, status='live')
milestone_traced_to: "M4 — Offline-first reliability (the wedge)" (in_progress)
proposed_scope_change: |
  None. Hold the four-task bundle as authored.

  Two execution-rigor anchors carried forward for downstream gates (not scope changes):

  1. EXACTLY-ONCE IS THE WHOLE BET, NOT A NICE-TO-HAVE. The falsifier on the live bet is
     "students keep preferring Discord despite offline capability." A first offline experience
     that silently drops OR duplicates a queued message under reconnect is strictly worse than
     no offline mode — it teaches students StudyHall loses their words on bad wifi, which is
     the exact trust failure the wedge exists to win. The success metric's "exactly once, in
     order, no data loss" clause is the load-bearing AC, not the read-cache. The heavy
     fake-indexeddb unit + idempotency-integration emphasis is correct, proportionate rigor —
     this is the rare wave where test depth is a strategic requirement, not gold-plating.
     T-block / V-block should treat the exactly-once + ordering proof as the gating AC.

  2. SEND-SPINE FIRST IS THE RIGHT FIRST CUT. M4's full ## Scope (connection-state indicator,
     pending/failed UI, catch-up keyset pagination) is broader than this bundle. Cutting the
     send spine (idempotent contract → local store → outbox → harness) before the surface
     polish is the correct dependency order: the reconciliation guarantee must exist and be
     proven before the UI that exposes it. The remaining M4 scope is the natural next bundle,
     not a gap in this one.

  Confirmed OUT-of-scope (correctly): CRDT conflict resolution, full service-worker/PWA
  install, offline for non-message entities (servers/assignments/voice), multi-device sync.
  All would over-build a FIRST offline wave and delay the falsifiable proof of the wedge.
drop_rationale: ""
escalation_reason: ""
sibling_visible: false
```

## Brief (ceo-reviewer, P-0 wave-20)

**PROCEED — HOLD-SCOPE.** This is the wedge milestone's opening and the slice is the correct strategic first step.

- **Right thing now? Yes — this IS the wedge.** The single live founder bet pairs "academic tools + offline-first" as the Discord-displacement thesis; M4 is the offline leg, and the bet's named differentiator vs every Tier-1 competitor (Discord / Teams / Notion — all online-only). M3 (real-time messaging, the foundation) closed last wave; M4 is the correct, sequenced next milestone (roadmap M1→M2→M3→M4, "text MVP + the wedge"). No strategic drift.
- **Ambition calibrated.** The send-spine (idempotent contract + IndexedDB store + outbox/optimistic-send + heavily-tested harness) is a coherent 8–9/10 first slice, not half-built and not grandiose. The exactly-once-on-reconnect guarantee is fully covered by these four tasks; nothing in the bundle is droppable without breaking the success metric.
- **The strategic risk to flag downstream (not a scope change):** exactly-once + ordering is the trust foundation — drop-or-dupe on reconnect is *worse* than no offline mode and directly feeds the bet's falsifier. The fake-indexeddb test emphasis is correct rigor; T/V gates should treat the exactly-once + in-order proof as the load-bearing AC.
- **No "real but doesn't matter" risk** — offline reliability IS the wedge and the M4 metric.

Note: 6 of the 10 M4 todo tasks are carried M3 tech-debt re-homed at M3-close (invite-rotation, presence-perf, real-PG test tier, presence-debt, mention-parity, author-presence-dots) — independent backlog, correctly NOT part of this offline bundle.
