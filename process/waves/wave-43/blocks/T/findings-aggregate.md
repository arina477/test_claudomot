# Wave 43 — T-block findings aggregate

## T-2 (unit)
- [LOW] T2-F1 — no dedicated unit tests for new scheduling service methods (esp. recurrence expansion); covered at T-4/T-8.
## T-3 (contract)
- [LOW] T3-F1 — Create/Update refine + .datetime() negative cases asserted at T-4, not standalone contract tests.

## T-4 (integration)
- 22/22 scheduling real-PG cases PASS in CI (run 28693093402). Recurrence expansion + authz + IDOR + validation all verified.
- [LOW→resolved] T4-F1 — createSession lacked a service-level defensive weekly-recurrenceUntil guard (HTTP already Zod-protected); T-4 caught it, fixed e7f1f7a, api redeployed. Resolved this wave.

## T-5 (E2E live)
- All 6 scenarios PASS (create/weekly-5-occurrence/edit/delete-confirm/validation/no-non-goals). Student read-only view blocked (single-account) → T-4.
- [LOW] T5-F1 — Esc restores focus to BODY not the trigger (WCAG 2.4.3). B-3 minor.
- [LOW] T5-F2 — detail panel not live-refreshed after edit (cosmetic state-sync).
## T-8 (security)
- CLEAN 0 findings. Unauth→401, IDOR (404 + serverId-smuggle stripped), bad-UUID→400 (M3 doesn't manifest here), validation→400, recurrence 90d cap no-DoS, rate-limit→429, no leak, secret clean. Two-user 403 from T-4.

## T-6 (layout)
- Layout PASS + token PASS (0 violations) @1440/1280/1024.
- [MAJOR] T6-F1 — at 1024 with detail drawer open, members panel doesn't collapse (DS §9) → agenda card crushed to 28px (no overflow; 1280/1440 clean). B-3/D responsive gap → V-2.
- [INFO] T6-F2 — amber today/soon not exercisable (far-future fixtures).
- [LOW] T6-F3 — modal CTA "Create Session" vs design "Save" (copy).
