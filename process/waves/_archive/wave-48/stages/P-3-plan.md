# Wave 48 — P-3 Plan
## Approach
Test-ONLY. Reuse the shipped integration harness (apps/api/test/integration/pg-harness.ts insertFixtureUser/Server/Membership + the presence-comembers.spec.ts real-PG pattern). Add a backward-compatible who_can_dm param to insertFixtureUser (default 'everyone'). Author 2 negative-case integration assertions against getDmCandidates: (a) shared-server co-member with who_can_dm='nobody' → excluded; (b) disjoint user (non-shared server) → hidden. Chosen over unit-mock assertions (rejected: mocks pre-filter, don't exercise the WHERE — the exact coverage-theater this wave fixes). No production/schema/API change.
## Data/API/deps: none (read-only; test-only). No migration. No new deps.
## File-level steps
- B-2 (test): apps/api/test/integration/pg-harness.ts (who_can_dm param) + apps/api/test/integration/dm-candidates.spec.ts (NEW, or extend presence-comembers.spec.ts) with the 2 assertions — **node-specialist**.
- No D-block (design_gap_flag=false); no B-1 contracts (no new types); no B-3 frontend.
- B-4/B-5: typecheck; biome 0; run the new integration spec (real PG) + full api suite pass.
## Specialist routing (AGENTS.md): node-specialist ✓.
## Self-consistency: every AC → B-2 step; specialist assigned; design_gap_flag=false; no deps. Clean.
```yaml
p_stage_verdict: COMPLETE
design_gap_flag: false
specialists: [node-specialist]
schema_change: false
next: P-4
