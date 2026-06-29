# L-1 — Docs (wave-4 profile customization)

## Action 1 — CHANGELOG entry
Appended 2 bullets under `## [Unreleased] / ### Added` (CHANGELOG.md:20-21), keep-a-changelog format, terse, user-facing language, cited (#10):
- "Profile customization: pick a unique @username and a personal accent color that carries across the app. (#10)"
- "Avatar upload on the profile page; image delivery turns on once storage is configured, and the page stays usable until then. (#10)"

All wave-4 user-facing surface goes to **Added** (new feature from spec). No Fixed entry: the dup-username 500→409 defect was caught + fix-forwarded in-wave (PR#11) before any released version — never shipped to a user-facing release. No Security entry: no prior-shipped vulnerability was patched.

## Action 2 — Milestone delta (JUDGMENT — flagged for N-1, no DB write)
M1 — Foundation: app shell, auth & profiles (`5a6efc9e-9de7-4594-a75d-d45e30d9a417`, in_progress).

Done/open breakdown (post L-2 task-close):
- **done_count = 5, open_count = 7.** `open_count != 0`, so the mechanical "all-children-terminal → transition to done" rule (L-1 Action 2 step 2) does NOT fire. No automatic transition.

The 7 open children are ALL hardening/infra follow-ups, NOT core foundation features:
| id | status | title |
|---|---|---|
| 839af17f | todo | Add rate limiting to auth endpoints (@nestjs/throttler) |
| a1299e88 | todo | Verify a Resend domain for transactional email |
| c51589cd | todo | Add CI browser E2E job (Playwright + chromium) |
| e38c306e | todo | Align API version reporting with package.json |
| a7667fb7 | todo | Clear CI Node-20 GitHub Actions deprecation warnings |
| 478e9d43 | todo | Enable branch protection on main (require PR + green CI) |
| 84e09891 | todo | Set Railway Bucket creds + verify avatar upload live |

### head-learn assessment (for N-1 disposition)
M1's FEATURE scope — dark app shell + full auth backend + auth frontend + profile customization (username/accent/avatar) — is **ALL SHIPPED LIVE**. The non-avatar profile surface is live-verified (username set/dup-409/bad-400, accent, 4-field profile); avatar real-upload is path-built + 503-graceful, gated only on founder-supplied Railway Bucket creds.

The 7 open children read as out-of-feature-scope tail-work: CI/test hardening (c51589cd, e38c306e, a7667fb7, 478e9d43), security hardening (839af17f rate-limit), and external-credential readiness (a1299e88 Resend domain, 84e09891 avatar bucket). None deliver a new foundation feature; all are operational/hardening.

**This is a genuine close call** — milestone `## Scope` (features) appears shipped, but per roadmap-lifecycle M1 stays in_progress while open children remain unless those children are judged out-of-milestone-scope tail. That re-scoping decision is N-1's (head-next) call, not L-1's. **Recommendation to N-1:** consider closing M1 + reassigning the 7 hardening/infra follow-ups to a hardening / M-later milestone, OR keep M1 open. **L-1 default applied: leave M1 in_progress, NO DB milestone write, flag for N-1.** (Mode is `automatic`; had this been a mechanical close it would run without escalation, but it is an ambiguous re-scope judgment, deferred to N-1 per brief.)

`roadmap_skip_reason`: not skipped — milestone evaluated; mechanical transition did not fire (open_count=7); ambiguous re-scope flagged to N-1.

## Action 3 — README touchup
Surgical edit to README.md:16 — extended the "Accounts are live" line to name profile customization (display name, unique @username, accent color). No new env var / CLI / install step / breaking change, so env table and quick-start untouched.

## Action 4 — Commit
FS docs (CHANGELOG + README) committed directly to main (project allows direct doc commits; prior L-1 closeouts shipped this way). SHA recorded in footer.

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md:20-21 (Added, 2 bullets, #10)"
  - "milestone M1 5a6efc9e: NO DB write — open_count=7, mechanical transition did not fire; re-scope judgment flagged to N-1"
  - "README.md:16 profile-customization touchup"
  - "commit: <see git below>"
changelog_entry_added: true
roadmap_milestones_progressed: []
roadmap_skip_reason: "M1 evaluated: open_count=7 (all hardening/infra tail-work); mechanical transition did not fire; ambiguous feature-scope-shipped re-scope judgment flagged to N-1 (head-next) — no L-1 DB milestone write"
readme_sections_touched: ["Live (accounts line)"]
note: "M1 feature scope (shell+auth+profile customization) shipped live; 7 open children are hardening/infra. N-1 to decide M1 close+reassign vs keep-open."
```
