# Wave 55 — T-block Gate Verdict (T-9)

**Gate:** T-9 Journey / block-exit · **Mode:** automatic · **Reviewer:** head-tester (independent)
**Wave type:** backend / auth · **Topic:** who_can_dm='server-members' 2-cell privacy truth-table (case c) added to DM-candidates real-Postgres integration suite · **Live commit:** 2565f43 · **Production change:** none (test-only)

## Verdict: APPROVED

---

## Phase 1 — T-block honesty

### 1. T-4 integration (KEY layer) — coverage is GENUINE
Independently verified at merged source (`git show 2565f43:apps/api/test/integration/dm-candidates.spec.ts`), not just from the deliverable prose:

- **Positive leg (INCLUDED):** `USER_P_SERVERMEMBERS_COMEMBER` inserted with `who_can_dm='server-members'`, made a co-member of `SERVER_C_SHARED` alongside `CALLER` → `expect(ids).toContain(USER_P_SERVERMEMBERS_COMEMBER)`.
- **Negative leg (EXCLUDED, load-bearing):** `USER_Q_SERVERMEMBERS_DISJOINT` inserted with the SAME `who_can_dm='server-members'` tier but in `SERVER_C_DISJOINT` (distinct server, distinct owner, no shared membership with CALLER) → `expect(ids).not.toContain(USER_Q_SERVERMEMBERS_DISJOINT)`. This is the shared-server privacy fence: it fails on a plausible real bug (a refactor widening `server-members` to leak cross-server). Mutation-sanity satisfied.
- Memberships are genuinely disjoint (positive + negative differ ONLY in shared-server membership, tier held constant) — the test isolates the fence, not the tier predicate. Also asserts `not.toContain(CALLER)` (no self-echo).
- **System-under-test is real:** `sut.getDmCandidates(CALLER)` against a real `postgres:16` CI service (`DATABASE_URL_TEST`), per-test fixtures — NOT mocked. Satisfies real-Postgres integration discipline (no mock-the-SUT).

**Executed, not skipped:** guard is `SKIP = !process.env.DATABASE_URL_TEST`; CI's test job provides `DATABASE_URL_TEST` (postgres:16 service), so `describe.skipIf(SKIP)` did not fire. Both C-1 and T-4 cite the same CI run **28761913177** with `✓ ...(c) who_can_dm=server-members... 78ms` — a measured duration on a `✓` line is a run, not a skip (skips report no timing). 7/7 CI checks green; 18-file integration suite green (no regression).

### 2. Skip honesty — HONEST
- T-3 contract skip: no Zod/DTO/contract change (diff is one test file) — legitimate.
- T-5 e2e / T-6 layout / T-7 perf skips: no user-visible surface, non-UI, not perf-heavy — legitimate for a test-only integration addition.
- T-1 static (lint+typecheck green, 0 ts-bypasses) and T-2 unit (unit suite unaffected — the change is an integration test) correctly marked ci-verified, not skipped. T-2 unaffected claim is sound: no unit under test changed.

### 3. T-8 security — Pattern-A classification is SOUND
No active live pen-probe is required. Judgment: is there NEW production attack surface? No — the change is one test file; the `who_can_dm='server-members'` boundary in production is UNCHANGED and was already pentested (wave-47 T-8). A live probe would only re-confirm unchanged, already-pentested behavior. The strongest available evidence here is precisely the CI-green case (c), which proves the fence live on real Postgres. Secret-grep on the one-file diff is clean (fixture ids/emails only). Classifying as integration-evidence + secret-grep rather than a redundant probe is correct.

### 4. Findings — 0 open, correct
Aggregate reports 0 across all layers. Independently consistent with source + CI evidence; nothing suppressed or deferred.

## Phase 2 — Journey regen
Skipped: backend/test-only wave, zero user-flow or route/endpoint surface change. user-journey-map.md regeneration is a no-op — no flow inventory drift. Legitimate skip per the backend/test-only carve-out.

---

## Rationale
The wave's entire deliverable is a single integration test, and that test is honest: verified at the merged source, it asserts both a positive INCLUDED and a disjoint negative EXCLUDED with the tier held constant so the load-bearing assertion is the cross-server privacy fence — failable by a real leak bug. It runs against a real Postgres CI service (not mocked, not skipped), confirmed executed+passed on run 28761913177. Every non-integration layer skip maps to a genuinely absent surface (no contract, no UI, no perf, no new production attack surface). No coverage theater, no mock-the-SUT, no skip-dishonesty, no open findings.

```yaml
head_signoff:
  verdict: APPROVED
  stage: T-9
  reviewers:
    head-tester: APPROVED
  failed_checks: []
  rationale: >
    Case (c) integration coverage is genuine (positive INCLUDED + disjoint negative
    EXCLUDED, tier held constant, load-bearing fence failable by a real leak),
    executed+passed on real Postgres CI run 28761913177 (not skipped, verified at
    source 2565f43). SUT unmocked. All layer skips honest (no contract/UI/perf/new
    attack surface). T-8 Pattern-A sound (test-only, boundary unchanged + already
    pentested wave-47). 0 open findings. Journey regen a no-op (backend/test-only).
  next_action: PROCEED_TO_V_BLOCK
```
