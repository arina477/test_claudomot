# L-1 Docs — wave-40 (avatar endpoint hardening)

## Scope
Wave-40 hardened the avatar endpoints so malformed / edge input yields clean 4xx
(400/404) instead of 500. Backend-only robustness fix; no user-facing behavior
change on valid input. Task `7525b759` (done, marked by L-2).

## CHANGELOG delta
Appended one bullet under `## [Unreleased] › Fixed` (keep-a-changelog):
- Avatar image requests now return a clean error instead of a server error on
  odd input (NUL/control-byte user id → 400; confirming a never-uploaded avatar
  → 404). Hardening fix, no change for normal use. (#54)

Classification: **Fixed** (robustness/500→4xx hardening). PR **#54** cited.

## README
**Skipped.** No user-facing setup/env/CLI/quick-start change — internal error-code
hardening only. Skip recorded.

## Milestone delta — M7 (`6e2f68d8`)
- Task disposition: **13 done / 1 open**.
- Open task: `a1299e88` (Resend email domain) — **BLOCKED**, founder-credential-gated.
- open_count = 1 > 0 → **M7 does NOT close. Stays `in_progress`.** No milestone
  close performed.
- **Buildable-complete note (for the record):** this wave EXHAUSTS M7's BUILDABLE
  scope. The single remaining open task is founder-credential-blocked (Resend
  email domain), not buildable. M7 is "buildable-complete, awaiting founder
  credential." N-block will surface the founder-credential-fork pause. This is a
  note, not a close — M7 retains real open scope, just not buildable.

## Doc coverage check (L-1 exit)
- Every shipped surface that changed is a backend error-path change on the avatar
  endpoints — captured by the CHANGELOG Fixed entry (#54). No new routes,
  endpoints, or env vars → no journey-map / SDK-doc delta required.
- No blame language; observation is system-level (error-path hardening).

---
```yaml
head_signoff:
  verdict: APPROVED
  stage: L-1-docs
  reviewers: {}
  failed_checks: []
  changelog:
    file: CHANGELOG.md
    section: "Unreleased › Fixed"
    bullets_added: 1
    pr_cited: 54
  roadmap_milestones_progressed:
    - milestone: M7
      id: 6e2f68d8
      status_before: in_progress
      status_after: in_progress
      task_tally: { done: 13, open: 1 }
      open_blocked: { id: a1299e88, reason: "Resend email domain — founder-credential-gated" }
      note: "buildable-complete; M7 BUILDABLE scope exhausted, only open task founder-credential-blocked; N-block surfaces founder-credential-fork. Not a close."
  readme: SKIPPED (no user-facing setup/env/CLI change)
  commit_sha: 7d2b6da435e4a099656e89c416aa9bd23002d81e
  rationale: >
    L-1 docs closeout for wave-40 avatar hardening. CHANGELOG carries the single
    #54 Fixed entry (500→4xx). README correctly skipped — no user-facing surface.
    M7 stays in_progress (1 open founder-blocked task); recorded as
    buildable-complete for N-block's founder-credential-fork. No blame, doc
    coverage complete.
  next_action: PROCEED_TO_L-2
```
