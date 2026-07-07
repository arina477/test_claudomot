# Wave 71 — T-block findings aggregate

## T-5 (E2E, live)
- [PASS] Member-row Block↔Unblock LIVE toggle (P0 fix) proven — flips without reload, full cycle 2×. Enriched blocked-users list shows real names (not UUID). Own-row suppressed. Cross-surface store consistency. 0 console errors.
- [MINOR / a11y, not wave scope → V-2] member-row block/mod affordances hover-only + wide-viewport; future a11y pass.
## T-8 (Security, live LIGHT)
- [PASS] GET /blocks enrichment no-IDOR preserved (own-list only); secret-grep clean. Block authz + 5 DM HIDE seams UNTOUCHED (zero diff) — wave-70 T-8 launch-gate proof remains valid.
## T-6 (Layout)
- [PASS] enriched list (name+avatar) + toggle render (T-5 live-confirmed); block-ui.html D-3 design covers both; no new finding.
