# Wave 27 — V-1 Reviews summary

Karen + jenny in parallel, independent, against live prod (api 855f1ea1 +index, web 328b1ae9 index-Dr2UkTXH.js) + merge 87b6ef7.

## Karen (source-claim) — APPROVE
All 7 load-bearing claims VERIFIED (V-1-karen.md): Spec A index in schema (servers.ts:59) + migration 0012 (CREATE INDEX ... user_id) + presence.service EMPTY diff (index-only, no rewrite) + EXPLAIN proof genuine (harnessExplainWithSeqscanOff pinned-connection BEGIN/SET LOCAL/EXPLAIN/ROLLBACK, mutation-sane, CI-executed). Spec B ONE list-level subscription (MessageList:1515, per-row removed) + **CARRY-B PRESERVED** (AuthorPresenceDot memo'd on derived scalar status; author-B flip does NOT re-render author-A — the P-4 binding carry, VERIFIED) + behavior-preserving (tri-state/AC4/self-seed) + commit-per-spec (Spec-A→6a546c7b apps/api, Spec-B→07361daf apps/web, no cross-spec). Antipattern clean (6th override legit, sibling re-home confirmed). 1 LOW: test comment misnames the memo mechanism (cosmetic).

## jenny (semantic-spec) — APPROVE
Both specs MATCH deployed behavior (V-1-jenny.md). Spec A behavior-preserving (index transparent to results; co-member set unchanged; EXPLAIN Index Scan T-4). Spec B behavior-preserving — dots render IDENTICALLY live (emerald rgb(16,185,129) = byte-for-byte T-5 DOM; unknown→no-dot AC3; single socket; self-seed intact). CARRY-B = perf-preservation (behavior-identical). No drift (consistent w/ product-decisions + journey annotation). Note: CLAUDOMAT_DB_URL is the brain DB (not app prod DB) → index verified via the authoritative T-4 CI EXPLAIN proof + migration 0012 + schema, not direct pg_indexes.

## Findings → V-2
1. LOW cosmetic: presence-dots.test comment misnames memo mechanism ("custom areEqual" vs plain memo-on-scalar) — flagged B-6 P3 + T-9 + V-1. Behavior correct. → accepted-debt.
2. LOW infra: Playwright MCP chrome-absent (67881a58, existing task, bundled-chromium substitute). → noise.

```yaml
karen_verdict: APPROVE
jenny_verdict: APPROVE
spec_drift_count: 0
spec_gap_count: 0
carry_b_confirmed: true          # P-4 binding carry (per-author render-scoping) VERIFIED preserved
findings:
  - {source: karen/jenny, severity: LOW, kind: cosmetic, desc: "test comment misnames memo mechanism"}
  - {source: T-5, severity: LOW, kind: bug-infra, desc: "Playwright MCP chrome-absent (67881a58)"}
```
