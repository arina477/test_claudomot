# L-1 — Docs (wave-23)

**Wave:** 23 — M5 bundle 2, delegated assignment-organizer authz
**Claimed tasks:** 8aa67564 (manage_assignments permission split) + edbdea8f (/me effective-permissions + assignments CTA gate)
**Ship state:** LIVE — PR #35 merge 489c86a; api 0ebf493d + web 31fca925; migration 0011; V-block APPROVED.

## Action 1 — CHANGELOG entry

Appended a new `### Changed` section under `## [Unreleased]` (keep-a-changelog order: Added → **Changed** → Fixed), 2 bullets at **CHANGELOG.md:53-56**:

- Delegated assignment management: owner can grant a dedicated "Manage Assignments" permission to a non-owner member (TA / study-group co-lead) — post/edit/remove assignments without channel-management rights. (#35)
- Role editor gains the per-role "Manage Assignments" toggle; the "New Assignment" CTA now shows for owners OR anyone holding the permission (was owner-only). (#35)

**Classification: Changed, NOT Security.** This is preventive authorization hardening on an already-shipped feature (#34 assignments, wave-22). Nothing shipped vulnerable — the wave-22 path required manage_channels (owner-held) and was never exploitable; this wave splits a narrower dedicated permission off it. Per L-1 Action 1: "preventive security in the same wave goes in Added/Changed." Security section is reserved for shipped-vulnerability-patched-after-the-fact only. Consistent with wave-19/wave-22 IDOR-preventive precedents.

## Action 2 — Milestone delta

M5 (a5232e16) `in_progress`. Census after L-2 set both claimed rows `done`:

```
done | open
   5 |   10
```

- `open_count = 10 ≠ 0` → **NO** `milestones` UPDATE. Mechanical non-close; M5 stays `in_progress`. RECORD-only.
- M5 is multi-wave: the reminders arc (Resend cron + NotificationsModule) remains cred-blocked (founder API-key ask), plus 6 re-homed M3/M4 debt rows + 4 wave-22 V-2 follow-ons.
- `open = 10 ≥ 3` (brain-fallback threshold) → **no backlog-stockout flag** for N-1.

## Action 3 — README touchups

**SKIPPED.** No new env var, CLI command/flag, install step, or dependency landed this wave. The new `GET /servers/:serverId/me/permissions` endpoint reuses existing auth/session wiring; migration 0011 is applied via the standard C-block deploy path (no new setup surface). Consistent with the w13–22 README cut.

## Action 4 — Commit

FS-side touchup committed + pushed to `main`: **599703c** — `docs: L-1 wave-23 closeout (changelog)`.
(Milestone progression required no DB write — non-close.)

## PRINCIPLES guard

No `*-PRINCIPLES.md` touched — that is L-2's lane (concurrent). Write-outside-L-block guard honored.

---

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md:53-56"
  - "milestones row UPDATE: none (M5 a5232e16 non-close — open_count=10)"
  - "commit: 599703c"
changelog_entry_added: true
changelog_section: Changed
roadmap_milestones_progressed: []
roadmap_delta_recorded: [{milestone: "a5232e16 (M5)", status: in_progress, done: 5, open: 10, action: "record-only, no close"}]
backlog_stockout_flag: false
roadmap_skip_reason: ""
readme_sections_touched: []
readme_skip_reason: "no new env var / CLI / install step / dependency this wave"
note: "Assignment-authz change classified Changed not Security (preventive hardening on shipped #34, nothing shipped vulnerable). M5 multi-wave: reminders arc cred-blocked + re-homed debt + V-2 follow-ons keep it in_progress."
```
