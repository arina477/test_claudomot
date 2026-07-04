# Wave 44 — P-3 Plan

## Approach section
### Architecture deltas
- No architectural change — all edits to shipped modules. **No new migration** (0308cdf1's created_at/updated_at columns already exist on scheduled_sessions from migration 0020; only the DTO/shared-schema projection is added). No new deps. No new env vars.
- **Responsive fix (8e54799a T6-F1):** the class-scheduling shell must collapse the members panel (or overlay the detail drawer) at ≤1024 when the detail opens — a CSS/layout change in the ClassCalendar/shell responsive rules (mirror the DESIGN-SYSTEM §9 collapse the assignments/other panels already do). **Alt:** overlay the detail drawer as a modal at ≤1024. Approach: prefer collapsing the members panel (consistent with §9) unless the shell structure makes the overlay simpler; B-3 decides against the shipped shell.
### Data model — none (columns exist).
### API contracts — GET/list/detail scheduled-session responses gain createdAt/updatedAt (additive, non-breaking).
### New deps — none.

## Plan section — file-level steps by B-stage
**B-0 Branch:** branch wave-44-m8-polish; no schema (schema_skipped). No deps.
**B-1 Contracts:** `packages/shared/src/scheduling.ts` ScheduledSessionSchema += createdAt/updatedAt (string). *typescript-pro* (task 0308cdf1).
**B-2 Backend:**
- `apps/api/src/scheduling/scheduling.service.ts` sessionRowToDto emit created_at/updated_at → createdAt/updatedAt. *node-specialist* (0308cdf1).
- `apps/api/src/assignments/assignments.{controller,service}.ts` fix stale `manage_channels` comment → manage_assignments (doc-only). *node-specialist* (683fec9b).
- **fixture-B re-provision** (for ca43eb12): reset fixture-B password via the self-hosted SuperTokens admin API (or recreate the account) + update gitignored command-center/testing/test-accounts.md. *node-specialist* / orchestrator test-infra op (resolves un-stranded c50f3040). If infeasible → defer ca43eb12 E2E in-task.
**B-3 Frontend:**
- `apps/web/src/shell/{ClassCalendar,SessionForm,SessionDetail}.tsx` — 8e54799a: 1024 members-panel-collapse/detail-overlay, Esc focus-restore to trigger, detail-panel refresh after edit, CTA copy. *react-specialist*.
- `apps/web/src/shell/SubmissionsRoster.tsx` (+ AssignmentCard) — 683fec9b: return focus-ring alpha 0.4, username fallback for empty displayName, (optional) return positioning. *react-specialist*.
- `apps/web/src/shell/MemberListPanel.tsx` — 8828484f: muted-indicator right-gutter padding token. *react-specialist*.
**B-5 Verify + tests (authored here / B-2/B-3):**
- UNIT tests: assignment submission service methods (8d971bc2) + scheduling service incl. recurrence-expansion cursor (0308cdf1). *test-automator*.
- E2E: delete-any 2-client fan-out + non-mod-affordance-hidden (ca43eb12) — CONDITIONAL on fixture-B re-provision; else deferred-in-task. *test-automator* (direct-playwright or Playwright spec).
- 8d971bc2 attachment-presign integration: DEFERRED-IN-TASK (CI lacks Tigris/S3 creds).

### Specialist routing (validated vs AGENTS.md)
typescript-pro (shared) ✓ · node-specialist (api + fixture-B) ✓ · react-specialist (web) ✓ · test-automator (unit + E2E) ✓. All in AGENTS.md.

### Parallelization
- B-1 (shared DTO) first. B-2 (backend: DTO emit + stale comment + fixture-B) ∥ B-3 (web polish — distinct files) after B-1. Tests (B-5) after the code they cover.

### Self-consistency sweep
1. Every AC maps to a step: 8e54799a→B-3 responsive/a11y; 683fec9b→B-2 comment + B-3 focus/username; 8d971bc2→B-5 unit (attachment deferred); 8828484f→B-3 padding; ca43eb12→B-2 fixture-B + B-5 E2E (conditional); 0308cdf1→B-1 schema + B-2 DTO + B-5 unit ✓.
2. Each step has a specialist ✓. 3. No file in 2 parallel batches ✓. 4. design_gap_flag=false → no D-block ✓. 5-8. no arch/deps/SDK ✓.
**Sweep clean.**
