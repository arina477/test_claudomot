# P-0 — Frame (wave-56)

## Discover
- wave_db_id 1d2ff0fa (wave 56). Seed c5051444 (wave-47 V-2 T-7 INFO deferral). Milestone M8 (in_progress), backfilled. Short-circuit: no-prior-spec. No Tier-3.
- Prior context: M8 substantive scope shipped; M9-Monetization flagged for founder (wave-55 N-1, non-pausing).

## Reframe
**Original framing:** add LIMIT + cursor/pagination to `getDmCandidates` (unbounded query) for large-server scale.

**Verified:** `getDmCandidates` (dm.service.ts:679-723) is genuinely unbounded — `selectDistinctOn` over `inArray(server_id, callerServerIds)`, NO `.limit()`/cursor/offset, then an in-memory `.sort()` over the full set.

**All three reviewers converged (decisive):**
- **problem-framer — REFRAME (antipattern #4 premature abstraction):** ship ONLY the defensive `LIMIT` (cause-layer correctness cap, no UX, always-safe); the cursor/pagination + load-more UX is premature-at-zero-users, exactly what the wave-47 fence + the seed's own prose deferred.
- **ceo-reviewer — SCOPE-REDUCTION (self-correcting its wave-55 flag):** "my wave-55 'high-leverage' call over-valued a zero-user scale concern — walking it back." KEEP the bare defensive LIMIT (latent-bug correctness, protects every future wave); DROP pagination/keyset/load-more + server-side typeahead (founder-reserved). If the cap can't land without pagination scaffolding → drop the task entirely this wave.
- **mvp-thinner — THIN:** split AC-A (defensive LIMIT, keep — scale-independent safety, ~5-20 LOC) from AC-B (cursor/pagination + load-more UX, defer — trace test: success metric holds without it; wave-47 already fenced pagination out of the DM MVP).

**Disposition — REFRAME + accept THIN split. PROCEED with AC-A only.** Wave-56 ships ONLY a defensive server-side `LIMIT` on getDmCandidates (an unbounded co-member query is a latent bug regardless of scale; cheap, always-safe, reversible). The cursor/pagination + load-more UX (AC-B) split to deferred top-level M8 seed **999a14d1** (a real large-server scaling wave, with usage data — NOT auto-drained at zero users). This resolves the tension: ceo-reviewer's scale-correctness value is fully captured by the LIMIT (the leverage is the unbounded-query cap, not the UI), and the wave-47 fence stays intact.

**Final framing:** wave-56 adds a defensive `LIMIT <N>` (a generous cap, e.g. a few hundred) enforced IN-QUERY before the in-memory sort in `getDmCandidates`, so the DM-candidate list can never return an unbounded result set. Plus a unit/integration assertion that the cap is applied. `claimed_task_ids = [c5051444]`. design_gap_flag FALSE (LIMIT-only, no client/UX change — the load-more affordance is deferred AC-B). Sub-floor → P-1 override-ship by rule. NO cursor/pagination, NO load-more UI, NO typeahead/ranking (deferred/founder-reserved).
