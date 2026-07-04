# Wave 42 — T-block findings aggregate

## T-2 (unit)
- [LOW] T2-F1 — no dedicated unit tests for the new submission service methods (submit/presign/list/return); behavior covered at T-4 integration + T-8 live security. Non-blocking coverage-hardening opportunity.

## T-3 (contract)
- [LOW] T3-F1 — SubmitAssignmentSchema.refine (text-or-attachment) negative case asserted at T-4, not a standalone contract test.

## T-4 (integration)
- [LOW] T4-F1 — attachment presign path not integration-covered (no S3 creds in CI); verified live at T-8.
- [LOW] T4-F2 — new integration spec initially failed CI biome lint (tsc-only local check before push); L-2 candidate (biome ci before pushing test files).

## T-5 (E2E live)
- [LOW] T5-F1 — student "Your Work" submit+edit BUTTON UI uncovered (single-account: A owns all servers; fixture-B broken). Backend submit + resubmit-clears-return proven LIVE via API + T-4. Restore non-organizer fixture (task c50f3040).
- [LOW/infra] T5-F2 — Playwright MCP chrome-channel broken; direct-playwright executablePath bypass works; .mcp.json patched for future sessions. L-2 candidate.
- Educator roster + Return dialog (role=dialog, Esc+focus-restore, emerald RETURNED badge) + no-grading all PASS live.

## T-6 (layout)
- Layout PASS + token PASS at 1440/1280/1024 (no overflow, tokens exact).
- [LOW] T6-F1 — Return control is centered modal vs design anchored popover (tokens+a11y equivalent).
- [LOW] T6-F2 — dialog focus-ring alpha 0.2 vs 0.4 (hue correct).
- [LOW] T6-F3 — empty student-name slot when displayName null (null-coalesced, no crash; consider username fallback).

## T-8 (security)
- CLEAN — 0 findings. Unauth→401, IDOR anti-spoof (other-server key/traversal/injection rejected), cross-assignment return→400, bad-UUID→400, rate-limit→429, cookies HttpOnly+Secure, no grade leak, secret-grep clean. Two-user 403 negatives cited from T-4 real-PG.
