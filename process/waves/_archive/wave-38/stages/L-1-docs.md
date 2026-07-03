# L-1 — Docs (wave-38, avatar storage go-live)

## Action 1 — CHANGELOG

Appended 3 bullets under `[Unreleased] → Added` (CHANGELOG.md:69-71), citing PR #52:

- Message attachments now live end-to-end (storage wired to Tigris S3).
- Avatar image storage wired end-to-end on the backend; **in-app upload entry point is a tracked follow-up** (c208e91e) — deliberately NOT claiming "students can now upload avatars".
- Private-bucket + expiring signed-link render and rate-limited upload endpoints.

Placed under **Added** (not Security): the presigned-GET private-bucket render and `@Throttle` rate-limit are preventive controls shipped with the feature — nothing shipped-then-patched, so Security section does not apply (L-1 Action 1 rule).

## Action 2 — Milestone delta

M7 (launch-ops, `6e2f68d8`): 11 done / 3 open.
- `a1299e88` Resend-domain — BLOCKED (founder-blocked email half)
- `c208e91e` avatar-UI-wiring — TODO
- `7525b759` endpoint-hardening — TODO

`open_count = 3 > 0` → **M7 does NOT transition; stays `in_progress`.** Mechanical, no judgment escalation (clearly not done). Avatar-storage half of launch-ops delivered; Resend email half remains founder-blocked.

## Action 3 — README

Skipped. No user-facing quick-start/env/CLI change — the storage wiring is backend-internal and `PUBLIC_API_URL` is deploy-internal env, not a documented user-facing var.

## Action 4 — Commit

`docs: L-1 wave-38 closeout (changelog)` → pushed to main.

---

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md:69-71"
changelog_entry_added: true
roadmap_milestones_progressed:
  - {milestone: M7, before: in_progress, after: in_progress}
roadmap_note: "Avatar-storage half of launch-ops delivered (attachments live, avatar backend round-trip end-to-end). M7 stays in_progress: open_count=3 (a1299e88 Resend-domain BLOCKED, c208e91e avatar-UI-wiring TODO, 7525b759 endpoint-hardening TODO). Email half still founder-blocked."
roadmap_skip_reason: ""
readme_sections_touched: []
readme_skip_reason: "backend storage wiring only; PUBLIC_API_URL is deploy-internal; no user-facing quick-start/env/CLI change"
note: "Honesty guard: CHANGELOG does not claim in-app avatar upload — UI entry point tracked as follow-up c208e91e."
commit_sha: "<filled post-commit>"
```
