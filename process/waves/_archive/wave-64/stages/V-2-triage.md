# V-2 Triage — wave-64
Inputs: T-block findings-aggregate (0), Karen V-1 (0 findings, 1 advisory), jenny V-1 (2 non-blocking gaps). Karen APPROVE + jenny APPROVE → 0 blocking. No dedup needed (distinct sources).
Classification:
- **g1 (jenny) — NON-BLOCKING** → task db3ade72 (milestone M12). Offline-serve unreachable on COLD offline open because message LIST doesn't hydrate offline (pre-existing message-surface limitation, not a wave-64 regression; attachment caching itself verified). Overlaps M12 offline-first moat scope → milestone_id=M12. Future bundle wires channel/message-list read path to the Dexie messages cache offline (mirrors DM/assignments/schedule read-through), unlocking cold reachability; pairs with remaining M12 conflict-resolution UI.
- **g2 (jenny) — NOISE**. Lightbox reuses parent hook's resolved src rather than resolving independently — BETTER in practice (single write-through), satisfies spec intent ("both surfaces cache-on-view"). Expected/preferable behavior, not a defect.
- **karen advisory — NOISE**. v1→v4 test opens fresh IDB (all migrations on empty store) vs persisted-v3 in-place; the LOAD-BEARING v3→v4 test DOES a real close/reopen row-survival cycle, so rule-11 intent is covered. Advisory only.
Fast-fix queue: EMPTY (0 blocking). No B re-entry. → V-3 Phase 1 gate only; Phase 2 skips.
```yaml
findings_input_count: 3
findings_blocking: []
findings_non_blocking: [{id: g1, source: V-1-jenny, summary: "message list doesn't hydrate offline; cold-open offline-serve unreachable", task_id: db3ade72-6504-4700-93b1-9d99b4098f38, milestone_id: 36378340-0ea5-428e-bc94-03750fb103f6}]
findings_noise:
  - {id: g2, source: V-1-jenny, summary: "lightbox reuses parent hook src", rationale: "better in practice (single write-through); satisfies spec intent"}
  - {id: adv, source: V-1-karen, summary: "v1->v4 test uses fresh IDB", rationale: "load-bearing v3->v4 test covers row-survival with real close/reopen"}
fast_fix_queue: []
b_block_re_entry_required: []
```
