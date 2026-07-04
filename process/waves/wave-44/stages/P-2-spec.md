# Wave 44 — P-2 Spec (pointer)
**Source of truth:** seed task 8e54799a description (YAML head + prose). Convenience copy.
**wave_type:** multi-spec (6 tasks) · **design_gap_flag:** false (D skips)
## Per-task ACs (copy) — all polish/coverage on shipped M8 core, drawn from V-2/T-6 triage
- 8e54799a: class-scheduling 1024 responsive (members-panel collapse / detail overlay so agenda card readable), Esc focus-restore to trigger (WCAG 2.4.3), detail-panel refresh after edit, CTA copy.
- 683fec9b: return focus-ring alpha 0.4, username fallback for empty displayName, fix stale manage_channels comment → manage_assignments, (optional) return positioning.
- 8d971bc2: unit tests for assignment submission service methods; attachment-presign integration DEFERRED-IN-TASK (CI lacks S3 creds).
- 8828484f: muted-member indicator right-gutter padding token.
- ca43eb12: re-provision fixture-B (resolves c50f3040) → delete-any 2-client E2E + non-mod-affordance-hidden; DEFER if fixture-B infeasible (backend proven wave-41).
- 0308cdf1: ScheduledSession DTO += createdAt/updatedAt; unit tests for scheduling service (recurrence-expansion cursor).
Blocked-dep: ca43eb12 (fixture-B) + 8d971bc2 attachment (S3 creds) — handled in B per the spec.
