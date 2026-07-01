# Wave 26 — V-1 Reviews summary

Karen + jenny spawned in parallel, independent, against live prod (web 4a703d92 / index-BAcJ6YNx.js, api 539c476d) + merges 1543a4e (#38) + 12b5ec2 (#39 self-presence fix).

## Karen (source-claim) — APPROVE
All 7 load-bearing claims TRUE (V-1-karen.md): shared PresenceDot (token color, aria-hidden on inner dot only = B-6 a11y fix), member-panel refactored (no residual dot-hex), AuthorPresenceDot tri-state `if(!hasPresence)return null`, hasPresence accessor + single socket, self-presence chain end-to-end (profile.ts userId → controller → ProfileContext seedSelfPresence → presenceSocket idempotent seed), deploy hash match. T-5 critical GENUINELY fixed (real regression test presence-dots.test.tsx:298-317 asserts dot absent-before/present-after-seed). Antipattern-clean; deferrals documented. 1 info note: PresenceDot:47 `#121214` is the ring-MASK bg (not dot color) — legitimate.

## jenny (semantic-spec) — APPROVE
All 5 ACs + self-author edge met in DEPLOYED behavior (V-1-jenny.md): AC1+self (emerald online dot on self-authored row, live T-5 2/2), AC2 (shared token), AC3 (unknown→null, self-fix scoped to profile.userId only — degrade intact), AC4 (single socket), AC5 (member panel unregressed). **Spec-gap watch CLEARED:** no away/idle state exists (PresenceStatus enum online|offline), so seedSelfPresence→online-while-connected is a FAITHFUL satisfaction of the self-edge, not a fabricated default; server presence:offline still overwrites. No drift (consistent with product-decisions; study-status correctly deferred). 1 low note (J1): same #121214 ring-mask hex (polish; the "no hex" AC scopes to dot color, tokenized).

## Findings → V-2
1. **J1 (jenny, LOW polish):** PresenceDot ring-mask uses `#121214` hex — out of the AC's dot-color scope; single value in one shared component. → accepted-debt (micro-polish, non-blocking).
2. **B-6 P2 / T-7 (MEDIUM):** per-row presence subscription (O(rows×events) callback) → backlog task 07361daf (future perf lift). Non-blocking.
3. **67881a58 (LOW):** Playwright MCP chrome-absent (existing task, bundled-chromium substitute). Noise/known-carry.

```yaml
karen_verdict: APPROVE
karen_findings_count: 0
jenny_verdict: APPROVE
jenny_findings_count: 1
spec_drift_count: 0
spec_gap_count: 0
findings:
  - {source: jenny, id: J1, severity: LOW, kind: polish, desc: "PresenceDot ring-mask #121214 hex — out of dot-color AC scope"}
  - {source: B-6/T-7, id: P2, severity: MEDIUM, kind: bug-perf, desc: "per-row presence subscription — future perf lift"}
  - {source: T-5, id: 67881a58, severity: LOW, kind: bug-infra, desc: "Playwright MCP chrome-absent"}
```
