# Wave 19 — T-block findings aggregate (V-2 input)
## Resolved this block
- C-1 (was Critical, B-6): send-time trusted client descriptors → RATIFIED FIXED at T-8 (server-derived HeadObject size/type + anchored channel-key regex; IDOR+size-bypass+type-spoof closed; tests executed in CI; live 401).
## Non-blocking → V-2 (all)
- F-1 (Med): no integration/e2e for the wired controller+guard / C-1 send path (unit-only) → cheap on wave-17 02fa8011 pg-harness (attachment-association rollback spec).
- F-2 (Med): live two-client attachment upload+render not run (Playwright chrome channel absent, recurring) — covered by CI e2e + API 401 smoke. Env gap.
- F-3 (Low): channel_id/object_key divergence no schema CHECK (C-1 makes it API-unreachable).
- F-4 (Low): resolveAttachmentUrl null→url:'' — file-chip empty-href guard owed.
- F-5 (Low): headAttachment NoSuchKey → 5xx not 400 (fail-closed UX nit).
- F-6 (Low): reply-path C-1 test symmetry incomplete (same helper, behavior covered).
- F-7 (Low): optimistic+socket double-render window (pre-existing, self-heals).
## Known carries / L-2 candidates
- 9 pre-existing wave-14 biome warnings (task 4e994e96).
- C-block CI lessons (head-ci-cd noted for L-2, NOT written to principles): (1) gate on per-job CI conclusions not gh-run-watch exit (RECURRING — 3rd instance after waves 17/18 false-greens; strong L-2 candidate); (2) B-5 lint/test local-vs-CI divergence; (3) flaky server-roles updateRole test (fixed with waitFor not-disabled).
- prod test-data accumulation (no DELETE /servers/:id).
