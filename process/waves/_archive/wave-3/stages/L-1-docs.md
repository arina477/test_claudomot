# Wave 3 — L-1 Docs

## CHANGELOG (Added)
Appended 3 terse, present-tense bullets under `[Unreleased] > Added` in `CHANGELOG.md`, citing `(#5)`:
- Account screens (sign up / log in / verify email / reset password) wired to the live backend.
- Editable profile page (display name).
- Email-verification reminder banner; app stays usable while unverified.

Range: `CHANGELOG.md:18-20` (3 bullets appended after the wave-1 foundation block). Headline + ≤5 bullets cap respected.

## Milestone delta — M1 (5a6efc9e-9de7-4594-a75d-d45e30d9a417)
- L-2 set both claimed tasks `done` (9aae8255 auth frontend, a3328023 /me verify-gating).
- M1 child-task counts after close: **4 done / 6 open / 0 cancelled.**
  - done: cbf25dd5 (scaffold), b9118041 (auth backend), 9aae8255 (auth frontend), a3328023 (/me gating).
  - open: 2a655960 (profile customization+avatar), 839af17f (rate-limit), a1299e88 (Resend domain), a7667fb7 (CI Node-20 deprecations), c51589cd (CI browser E2E), e38c306e (API version alignment).
- M1's CORE (app shell + auth backend + auth frontend) is now shipped, but `open_count = 6 > 0` and the `## Scope` is not fully shipped (profile customization/avatar split out + open). **No transition — M1 stays `in_progress`.** Mechanical, no ambiguity → no escalation, no product-decisions append (append fires on transition only).
- `open_count = 6` is above the brain fallback threshold (< 3), so no `backlog-stockout` flag for N-1.

## README touchups
Added one plain-language line under the Live table noting accounts are live (sign up / log in / verify / reset / display name). `README.md:15`.

## Commits
FS docs committed in one batch (see L-block commit). No DB milestone UPDATE (no transition).

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md:18-20"
  - "README.md:15"
  - "milestone M1 5a6efc9e: 4 done / 6 open — no transition (in_progress retained)"
changelog_entry_added: true
roadmap_milestones_progressed: [{milestone: "M1 (5a6efc9e)", before: in_progress, after: in_progress}]
roadmap_skip_reason: ""
readme_sections_touched: ["Live"]
note: "M1 core (shell+auth backend+auth frontend) shipped; 6 open children keep M1 in_progress. Mechanical delta, no judgment escalation."
```
