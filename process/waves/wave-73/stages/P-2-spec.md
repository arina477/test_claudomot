# Wave 73 — P-2 Spec (pointer)

**Source of truth:** the spec contract lives in the primary task's `tasks.description` (row `156aa2ee-1235-4de1-b85e-995e88440eaa`) as a fenced YAML head + `---` + prose. This file is a convenience pointer.

**wave_type:** multi-spec (3 self-contained spec blocks).
**claimed_task_ids:** [156aa2ee (privacy_events table + AppendPrivacyEvent service + 4 write hooks), 03940edd (shared privacy-event Zod DTO), 5a2521bc ("Your privacy activity" read list)].
**design_gap_flag:** false.

## Acceptance-criteria summary (per spec)
- **03940edd (DTO):** shared PrivacyEventType z.enum (account_deleted/data_exported/privacy_settings_changed/user_blocked/user_unblocked) + PrivacyEvent + PrivacyEventListResponse schemas/types; isolated typecheck.
- **156aa2ee (backend):** privacy_events table (reports.ts idiom, no pgEnum, actor_id text FK no-cascade, jsonb context minimal non-PII, (actor_id, created_at desc) index) + migration; AppendPrivacyEvent append-only service (no update/delete; validates event_type vs shared enum); best-effort AFTER-commit NON-BLOCKING write hooks at 4 shipped seams (deleteAccount, exportAccountData, privacy-settings update, block/unblock) — a logging failure MUST NOT fail/rollback the user action; **LIVE-DB per-seam integration test asserting a real privacy_events row after each of the 4 actions** (problem-framer binding refinement).
- **5a2521bc (read UI):** GET /profile/privacy-events (session-only callerId, no-IDOR, own events, created_at desc) + "Your privacy activity" reverse-chron read-only panel on /settings/privacy (plain-language labels, relative timestamps, loading skeleton, empty state, error+retry) reusing existing DS list/panel patterns.

## Key edge cases
- hook logging failure → user action still succeeds (best-effort, no 500); actor soft-deleted → event row persists (append-only, no cascade); context never carries PII; no-IDOR on the read route; empty/error states on the panel.
