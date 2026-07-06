# Wave 56 — B-6 Gate Verdict (Phase 1)

**Block:** B · **Gate:** B-6 · **Reviewer:** head-builder (independent) · **Mode:** automatic
**Branch:** `wave-56-dm-candidates-limit` @ `577c452` · **Task:** c5051444
**Scope:** Defensive LIMIT on the unbounded `getDmCandidates` Drizzle query.

## Verdict: APPROVED

## Judged against the diff (2 files: `apps/api/src/dm/dm.service.ts`, `apps/api/test/integration/dm-candidates.spec.ts`)

### 1. Fix is correct — PASS
- `export const DM_CANDIDATES_LIMIT = 500;` added.
- Signature `getDmCandidates(callerId, limit: number = DM_CANDIDATES_LIMIT)` — injectable, defaults to 500.
- `.limit(limit)` appended **after** `.orderBy(users.id, asc(users.display_name))`, before the in-memory sort. DISTINCT ON key (`users.id`) still leads orderBy → `.limit` is a plain row cap on the deduped set; `selectDistinctOn` is not broken.
- Controller unchanged (not in diff) → production still calls `getDmCandidates(callerId)`, no 2nd arg → default 500.
- `who_can_dm` predicate (`ne(users.who_can_dm, 'nobody')` + co-membership join), `DmCandidate` DTO, and schema all unchanged.

### 2. KEY WATCH (P-4 carry) — test NON-VACUOUS — PASS
Case (d) inserts **3 eligible co-members** (`USER_D1/D2/D3`, all in `SERVER_D_SHARED` with the caller, all `who_can_dm='everyone'`) and asserts:
- `getDmCandidates(CALLER_D, 2).length <= 2` — the load-bearing bite. With 3 eligible rows and cap=2, this assertion **FAILS if `.limit` is removed** (would return 3 > 2). Genuine `> CAP eligible → ≤ CAP` proof.
- `capped.length > 0` — guards "capped, not broken".
- `getDmCandidates(CALLER_D).length === 3` — default cap 500 >> 3 → MVP-scale unchanged (all 3 returned).
- `DM_CANDIDATES_LIMIT === 500` is a sanity assert, NOT the sole proof.

Non-vacuity does not rely on cases (a)/(b)/(c); fresh non-colliding fixtures (`...-0002-000000000005`, `dm-cand-d-*`). Honesty-by-inspection holds: 3 inserted > 2 injected cap, so the assertion cannot pass with `.limit` absent. (Runs on CI — no local PG; inspection confirms the topology bites.)

### 3. No scope creep — PASS
- Exactly 2 files touched; case (d) is the only test addition.
- No cursor / offset / pagination / load-more UX / typeahead / ranking. AC-B (deferred seed 999a14d1) not pulled in.
- No controller / DTO / predicate / schema change.

### Auth / idempotency / realtime — N/A
Defensive read cap only; no auth surface, no writes, no socket path. Route guard composition unchanged from prior waves.

---

```yaml
head_signoff:
  verdict: APPROVED
  stage: B-6
  reviewers: { head-builder: APPROVED }
  failed_checks: []
  rationale: >
    Fix is correct — `.limit(limit)` sits after orderBy without breaking selectDistinctOn,
    defaults to the exported DM_CANDIDATES_LIMIT=500, controller unchanged so production
    uses the default. Predicate/DTO/schema untouched. The new integration case (d) is
    non-vacuous: it inserts 3 eligible co-members and asserts an injected cap of 2 truncates
    to <= 2 (would fail if .limit were removed) while the default-cap call returns all 3,
    proving MVP-scale behaviour is unchanged. No scope creep — deferred AC-B (999a14d1)
    not pulled in. Non-vacuity verified by inspection (case (d) runs on CI, no local PG).
  next_action: PROCEED_TO_C
```
