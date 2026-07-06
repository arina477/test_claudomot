# P-2 — Spec (wave-55) — POINTER
SoT: `tasks.description` of 344eabde. wave_type single-spec; claimed [344eabde]; design_gap_flag false.
Scope: 2-cell 'server-members' privacy truth-table in apps/api/test/integration/dm-candidates.spec.ts — (1) server-members co-member in shared server → INCLUDED; (2) server-members user in disjoint server → EXCLUDED (boundary regression fence). Test-only, reuses pg-harness + insertFixtureUser. No production/schema change. Privacy-scope (who-can-DM differentiator).
