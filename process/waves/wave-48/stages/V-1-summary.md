# Wave 48 — V-1 Independent reviews summary

**Stage:** V-1 (Karen + jenny, parallel, independent — no shared context)
**Wave:** DM candidate privacy negative-case integration test (TEST-ONLY; merge c79343b7; no production/schema/API/UI change)

## Verdicts

| Reviewer | Axis | Verdict | Findings |
|---|---|---|---|
| Karen | Source-claim (load-bearing claims true?) | **APPROVE** | 7 claims verified TRUE, 0 contradictions, 0 antipatterns |
| jenny | Semantic-spec (delivered behavior matches spec ACs?) | **APPROVE** | 5 findings, 0 blocking, 0 spec-drift, 1 non-blocking spec-GAP |

## Karen (source-claim) — key evidence
1. Real SUT: `dm-candidates.spec.ts:25` imports `./pg-harness` FIRST (sets DATABASE_URL=DATABASE_URL_TEST at eval), SUT `dm.service` imported after (`:38`); real `new DmService(emitter)` (`:71`) → real `getDmCandidates` (`:105`/`:142`). Lazy db Proxy (`db/index.ts:31`) binds to test PG. No mocked `.where()`.
2. Real WHERE predicate exists in SUT: `dm.service.ts:702-708` — `inArray(server_id, callerServerIds)` + `ne(user_id, callerId)` + `ne(who_can_dm,'nobody')`. Assertions map to real predicates.
3. Positive control present: `USER_Y_EVERYONE` asserted returned (`:110`) alongside nobody-exclusion (`:113`) — negative cannot pass vacuously.
4. Real disjoint user: `USER_Z_DISJOINT` in a non-shared server; asserts absence (`:147`) + length 0 (`:150`).
5. Backward-compat harness param: `pg-harness.ts:104` `whoCanDm … = 'everyone'` defaulted; 3-arg callers unaffected.
6. NO production code: `git show --stat c79343b7` — only two `test/integration/*` files under `apps/`; all other diff files are `process/waves/wave-48/**` `.md`.
7. CI ran green not skipped: `C-1-pr-ci-merge.md` shows both assertions `✓` + 60ms/49ms real-PG timings on postgres:16, integration `17 passed`; `ci_stage_verdict: PASS`.

## jenny (semantic-spec) — key evidence
- **F1 AC1 (nobody exclusion) — APPROVE, no drift.** everyone-control user Y (same SERVER_S as excluded nobody-user X) isolates `ne(who_can_dm,'nobody')` (`dm.service.ts:706`) as SOLE cause of X's absence — exclusion by policy, not by isolation. Real predicate, not a mock.
- **F2 AC2 (negative isolation) — APPROVE, no drift.** Disjoint Z filtered by real `inArray(callerServerIds)` (`:704`); `toHaveLength(0)` is strictly stronger than `not.toContain`; the `:684` empty-servers short-circuit does NOT fire (caller has 1 server → full JOIN walked).
- **F3 AC3 (harness param) — APPROVE, no drift.** 4th param `whoCanDm='everyone'` default matches DB column default; 2-/3-arg callers unaffected.
- **F4 AC4 (CI-green + positive retained) — APPROVE, no drift.** Both `✓` at 60ms/49ms; integration 17/17; skip guard did not fire; positive control + self-exclusion live inside assertion (a); diff additive.
- **F5 core claim (coverage REAL, §26) — APPROVE, no drift; 1 non-blocking spec-GAP.** Both counter-examples genuinely proven with a differential a pre-filtering mock could not fake. The one gap — `who_can_dm='server-members'` not exercised at integration — is a spec-GAP (unanticipated positive-control extension), already logged by T-block as LOW (`findings-aggregate.md`), weakens no AC, correctly deferred.

## Probe of clean verdicts (anti-pattern: reviewer false-negative)
Both APPROVEs on a non-trivial-but-small change are evidence-backed at line level, not vibe. The load-bearing vacuous-negative risk was explicitly grappled with (positive control isolates the predicate as sole cause of exclusion), and the empty-servers short-circuit path was checked. No skipped reviewer; independence preserved. Probe satisfied.

## Convergence with T-block
The one non-blocking item both jenny (F5 spec-gap) and the T-block LOW finding surface is the SAME item (server-members value not exercised at integration) — deduped in V-2, not double-counted.

```yaml
karen_verdict: APPROVE
karen_findings_count: 0            # 7 claims verified TRUE; 0 defects
karen_false_positives_documented: 0
jenny_verdict: APPROVE
jenny_findings_count: 1            # 1 non-blocking spec-gap (dedupes with T-block LOW)
spec_drift_count: 0
spec_gap_count: 1
jenny_false_positives_documented: 0
findings:
  - {source: jenny, kind: spec-gap, severity: LOW, summary: "who_can_dm='server-members' value not exercised at integration layer (future positive-control); dedupes with T-block LOW finding #1"}
```
