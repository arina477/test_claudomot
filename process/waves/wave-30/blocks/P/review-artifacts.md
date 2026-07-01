# Wave 30 — P-block review artifacts

**Block:** P (Product)
**Wave topic:** M5 assignment due-date REMINDERS arc — cron scan + NotificationsModule + Resend email (the M5 bet headline, now unblocked)
**Block exit gate:** P-4
**Status:** gate-passed

## Stage deliverables
| Stage | Deliverable file | Status | Notes |
|---|---|---|---|
| P-0 | process/waves/wave-30/stages/P-0-frame.md | done | PROCEED×3; LEFT-JOIN done-exclusion catch; email-only (in-app=M7); fixed 24h window; N-block dispose-M5-tasks carry |
| P-1 | process/waves/wave-30/stages/P-1-decompose.md | pending | |
| P-2 | process/waves/wave-30/stages/P-2-spec.md | done | 3 spec blocks → 4a4c2715.description; LEFT-JOIN + insert-before-send + E1/E2/E3 baked into ACs |
| P-3 | process/waves/wave-30/stages/P-3-plan.md | done | postgres-pro (B-0 table) + node-specialist (B-2 module/cron/email/integration); B-1/B-3 skip; @nestjs/schedule new dep |
| P-4 | process/waves/wave-30/blocks/P/gate-verdict.md | done | head-product APPROVED; karen+jenny APPROVE; Gemini UNAVAILABLE-429; gate-passed. Carries: TOCTOU-rowcount, LEFT-JOIN, T-9 journey-live, N-block M5-disposition |

## Block-specific context
- **Wave topic:** M5's sole unbuilt `## Scope` item — assignment due-date reminders. Founder resolved the park-or-key fork → **Path A** (build reminders); supplied the Resend key, now set on the Railway `api` service (`RESEND_API_KEY_AUTH`) + exported locally. The credential blocker is cleared → this wave builds the reminders arc end-to-end.
- **Bundle (multi-spec, claimed_task_ids = [4a4c2715, c5c30363, 0ba853e2]):**
  - **seed 4a4c2715** — `NotificationsModule` + `@Cron` scan: find assignments due within a reminder window, resolve recipients from `server_members`, send each eligible member (not already `done`) a reminder via `EmailService` (Resend). Idempotent (send-once), membership-respecting. Needs `@nestjs/schedule` (not yet a dep).
  - **sibling c5c30363** — `assignment_reminder` tracking table + Drizzle migration (idempotency substrate: `UNIQUE(assignment_id, user_id)` + `ON CONFLICT DO NOTHING`).
  - **sibling 0ba853e2** — branded due-soon reminder email template + `EmailService.sendAssignmentReminder` (unit-tested).
- **Codebase grounding (decomposer-verified):** `EmailService` (apps/api/src/email/email.service.ts) is ALREADY wired to Resend (non-throwing sendEmail) — no separate wiring sibling. `assignments` (due_date, is_deleted, index (server_id,due_date)), `assignment_status.state`, `server_members`, `users.email` all exist. Resend SDK docs at `command-center/dev/SDK-Docs/Resend/resend.md`.
- **Spec-contract short-circuit verdict:** no-prior-spec (prose bundle; full P-1..P-3).
- **Roadmap milestone:** M5 (a5232e16) in_progress. Class=product-feature, Tier=T3. This wave targets M5's SUCCESS METRIC directly ("members get a reminder before it is due") → closing this likely CLOSES M5.
- **wave_db_id:** 869ac982-954b-4560-8cb1-877ad8d829b2 (wave_number 30).
- **design_gap_flag:** unset — to be set at P-1 (likely FALSE — backend cron + email; the email TEMPLATE is HTML but is a shipped-artifact rendered server-side, not a new app UI page; D-block likely skips, but the email template's visual/brand may warrant a design check — P-1 judges).
- **External SDK:** Resend (already integrated via EmailService) + `@nestjs/schedule` (new dep) → external-SDK-integration-rules apply at P-3; SDK docs present.
- **Security surface:** sends email to users (user-comms) + a cron with DB access → T-8 may consider (no auth-flow change, but user-data-in-email + no-double-send + no-leak-across-servers).

## Open escalations carried into gate
- None — the M5 park-or-key fork is RESOLVED (Path A, founder 2026-07-01; recorded product-decisions.md). This wave executes that decision. If it closes M5's success metric, N-block promotes the next milestone (M6 voice/video).

## Gate verdict log
<appended by fresh head-product spawn at P-4 Action 1>
