# Wave 22 — T-block findings aggregate (V-2 input)
## Ratified this block
- Multi-tenant academic authz PROVEN (T-8): organizer-403, cross-server attachment IDOR fix (the /review High, CLOSED), per-member isolation, non-member-403, /assignments/:id IDOR-safe. Chip logic + D-3 contrast (T-6).
## Non-blocking → V-2 (no Critical/High)
- F22-T-1 (Med): /assignments/:id IDOR-derivation holds in code but lacks an explicit controller-spec assertion → bug-test-debt follow-on.
- F22-T-2 (Low): client organizer CTA owner-only vs server can(manage_channels) (safe under-grant) → /me/roles follow-up.
- F22-T-3 (Low): rowToDto N+1 (per-row status+attachment subqueries, not a JOIN) → bug-perf, non-regression, 0-user scale.
- F22-T-4 (Low): optimistic-revert assumes opposite state (visual-only).
- F22-T-5 (Low): Playwright chrome-absent (recurring; 67881a58).
- F22-T-6 (Low): 9 pre-existing biome warnings + the biome-format-drift-passes-local-fails-CI lesson (head-ci-cd noted, 2nd instance w19+w22 → L-2 candidate).
## Known carries
- 6 re-homed M3/M4 tech-debt under M5 backlog; manage_assignments dedicated-flag follow-on (wave-22 G2).
