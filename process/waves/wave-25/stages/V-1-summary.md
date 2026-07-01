# Wave 25 — V-1 Reviews summary (orchestrator)

Karen + jenny spawned in parallel, independent (no shared context), against live prod (web-production-bce1a8, api-production-b93e) + merge commit dbe55a2.

## Karen (source-claim) — APPROVE
All 7 load-bearing claims TRUE (report: `V-1-karen.md`):
1. Shared slug grammar single-source + DERIVED from `MENTION_TOKEN_SLUG_SRC` (mentions.ts:28/38/64), barrel-exported.
2. Server imports the shared slug (mentions.ts:15/44); mentions.spec.ts 24 tests on real SUT.
3. Client parity via web-local mirror (MessageList.tsx:46 imports ./mentionSlug); parity test imports both + asserts identity incl. `['@pre.fix','pre']` boundary probe.
4. editMessage txn: one `db.transaction` with tx.update/delete/insert (messages.service.ts:698-730).
5. Rollback spec real + executed (pg-harness first import, skipIf, cross-connection assertions; C-1 confirms PASSED 53ms in CI 28512345221).
6. Deploy hash match: live api /health 200, web serving `index-qlKaiziB.js`; deployed bundle contains the slug class.
7. Antipattern catalog clean; documented deferrals not fabrication.
- Non-blocking notes: (a) editMessage pre-reads sit outside the txn by deliberate design (atomicity boundary = the 3 writes, correct for AC4); (b) claim-5 CI-executed fact cross-read from C-1 (spec/skip/assertions independently verified on disk).

## jenny (semantic-spec) — APPROVE
All 5 ACs met in deployed behavior (report: `V-1-jenny.md`):
- F1 AC1 MET; F2 AC2 MET (dot-suffix headline fix holds live T-5 S2; physical mirror + byte-for-byte contract test, single canonical source); F3 AC3 MET (server-mentions-gated, T-5 S3/S4); F4 AC4 MET (txn at :698); F5 AC5 MET (CI 28512345221 both rollback tests executed non-zero, real postgres:16 + DATABASE_URL_TEST, cross-connection 0-partial-rows); F6 all edge cases MET.
- **F7 spec-gap (NOT blocking):** token SPLIT boundary still divergent (client `/(@\S+)/` matches mid-word `@`; server requires `(?:^|\s)@`). Only the intra-token SLUG grammar was unified. NEUTRALIZED by the AC3 server-mentions gate (mid-word `@x`→unresolved→plain, no false pill); the sole over-pill case needs the same resolved username to also appear mid-word in the same message. AC2 intent met; "agree on token boundaries" only partially literally true. Out-of-scope per spec (excludes grammar rewrite / full tokenizer). → bug-spec backlog note.
- No code drift, no scope creep.

## Findings → V-2
1. **F7 (jenny spec-gap, LOW):** mid-word `@` split boundary divergence — bug-spec, backlog (aligns with B-6 accepted-debt + wave-15 mid-word note). Non-blocking.
2. **T-block carry (LOW infra):** Playwright MCP chrome-channel-absent (67881a58, recurring) — bug-infra, non-blocking; bundled-chromium substitute worked.

```yaml
karen_verdict: APPROVE
karen_findings_count: 0                # 2 non-blocking notes, no REJECT findings
karen_false_positives_documented: 0
jenny_verdict: APPROVE
jenny_findings_count: 1                # F7 spec-gap
spec_drift_count: 0
spec_gap_count: 1                      # F7 mid-word split boundary
jenny_false_positives_documented: 0
findings:
  - {source: jenny, id: F7, severity: LOW, kind: spec-gap, desc: "mid-word @ split boundary divergent, neutralized by server-mentions gate, out-of-scope"}
  - {source: T-block, id: 67881a58, severity: LOW, kind: bug-infra, desc: "Playwright MCP chrome-channel-absent; bundled-chromium substitute"}
```

## Exit
Both reviewers APPROVE. 2 LOW non-blocking findings → V-2 triage. → V-2.
