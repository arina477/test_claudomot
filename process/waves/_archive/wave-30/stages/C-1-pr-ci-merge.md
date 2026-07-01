# C-1 — PR, CI & merge (wave-30 — M5 assignment due-date reminders)

**Block:** C (CI/CD) · **Stage:** C-1 · **Mode:** automatic · **Head:** head-ci-cd

## Summary

Opened PR #43 for `wave-30-assignment-reminders`, watched all 7 required CI checks to
green on the migration-bearing HEAD (`db752ce`), verified the integration tier actually
EXECUTED the reminder-scan cron correctness cases (CI rule 5), then squash-merged to main
and synced local main. Zero fix-up cycles.

## Branch push

- Branch already on origin at C-1 entry (HEAD `db752ce80b4c32e3142f1702f0f3d7f22577ea1d`).
  No re-push / force-push required — clean B-6 → C-1 handoff.

## PR

- **Number:** 43
- **URL:** https://github.com/arina477/test_claudomot/pull/43
- **Base ← Head:** `main` ← `wave-30-assignment-reminders`
- **Title:** `feat: assignment due-date reminders (cron + Resend email)`

## Required checks (workflow run 28543197997, event=pull_request)

All 7 jobs on the single CI workflow run are required and all passed on HEAD `db752ce`:

| Check        | Result | Duration | Notes |
|--------------|--------|----------|-------|
| lint         | pass   | 27s      | 0 errors (7 pre-existing warnings, non-blocking) |
| typecheck    | pass   | 37s      | |
| test         | pass   | 1m12s    | **units + api integration tier executed** (see CI-rule-5 proof below) |
| build        | pass   | 37s      | migration-bearing schema compiled clean |
| boot-probe   | pass   | 59s      | compiled API booted against Postgres 16 schema; `/health` → ok |
| secret-scan  | pass   | 16s      | gitleaks-action@v3; `.gitleaks.toml` allowlists `process/**`; no leak |
| e2e          | pass   | 55s      | Playwright smoke + authed create-server against live web URL |

Run conclusion: `success`.

## CI rule 5 — integration tier executed (NOT skipped)

`apps/api` `test:ci` runs `vitest run` (units) **AND**
`vitest run --config vitest.integration.config.ts` (real-Postgres integration). The `test`
job log shows the reminder-scan cron cases actually ran against the Postgres 16 service,
with live `[ReminderScanService]` NestJS log lines proving the real code path fired:

- (b) member with `state=done` is NOT reminded — passed
- (c) send-once: second scan inserts 0 new reminder rows and sends 0 new emails — passed
- (d) past-due assignment (`due_date < now`) is NOT reminded — passed
- (e) assignment due > 24h out is NOT reminded (outside window) — passed
- (a) no-status member reminded / "reminder already sent … skipping" — path exercised

Integration summary: `Test Files 8 passed (8)`, `Tests 29 passed (29)`, nonzero. This is
the live proof of cron correctness — not a coverage-theater skip.

## Merge

- **Mergeable state pre-merge:** `mergeable: MERGEABLE`, `mergeStateStatus: CLEAN`
- **Strategy:** squash (`--squash --delete-branch --auto`; `--auto` authorized under
  `automatic` mode — BOARD owns approval)
- **PR state:** MERGED @ 2026-07-01T19:43:53Z
- **Branch deleted on origin:** yes
- **Fix-up cycles:** 0 · **Rebase cycles:** 0

## Local main sync

- `git -c rebase.autostash=true pull --rebase origin main` → fast-forward `ac78386..81dc821`.
- Autostash created + reapplied cleanly for the two brain-vendored uncommitted files
  (`claudomat-brain/VERSION`, `claudomat-brain/onboarding/stages/stage-v13-handoff.md`) —
  they remain **uncommitted** (not swept into the merge, per instruction).
- Local main HEAD now `81dc8210be89d0b87fed2e110d73db72b07db094` (== origin merge commit).

## ⚠️ HANDOFF TO C-2 — migration 0013 must apply BEFORE api cutover

**`apps/api/drizzle/migrations/0013_smooth_tattoo.sql`** creates the `assignment_reminder`
table and is registered in `meta/_journal.json`. The new NotificationsModule `@Cron` scan
reads/writes this table on its first hourly tick. **C-2 MUST run `drizzle-kit migrate`
against the prod DB (public proxy) BEFORE the api service serves the new revision** —
otherwise the cron scan hits a missing-table error at runtime.

- Migration ordering: **apply 0013 → then cut over the api revision** (never rely on
  auto-migrate-on-boot).
- Env-var scope reminder for C-2: `RESEND_API_KEY_AUTH` must be present in the **api**
  Railway service scope (the cron/email path needs it); web must not receive it. Founder
  supplied the Resend key 2026-07-01; confirm it is live in the api service before cutover.
- Railway is CLI-push (`railway up`), NOT git-triggered — merge to main does NOT deploy.
- Deploy verification (C-2): read the Railway deployment-state endpoint
  (`railway deployment list --json --service api | jq -e '.[0].status == "SUCCESS"'`),
  confirm serving revision == deployed revision — NOT a bare `/health` that can answer
  from a stale revision.

---

```yaml
ci_stage_verdict: PASS
verdict_source: gh
verdict_evidence:
  - "gh pr view 43 state MERGED (mergeCommit 81dc8210be89d0b87fed2e110d73db72b07db094)"
  - "gh pr checks 43 — all 7 required checks passed (run 28543197997, conclusion success)"
  - "test job log: api integration tier executed reminder-scan.spec.ts cron cases (b/c/d/e) real-Postgres; Test Files 8 passed, Tests 29 passed"
  - "local main synced: git rev-parse HEAD == 81dc8210be89d0b87fed2e110d73db72b07db094"
pr_number: 43
pr_url: https://github.com/arina477/test_claudomot/pull/43
branch: wave-30-assignment-reminders
required_checks: [lint, typecheck, test, build, boot-probe, secret-scan, e2e]
optional_checks: []
fix_up_cycles: 0
final_commit_sha: db752ce80b4c32e3142f1702f0f3d7f22577ea1d
merge_strategy: squash
merge_commit_sha: 81dc8210be89d0b87fed2e110d73db72b07db094
rebase_cycles: 0
note: "Includes migration 0013_smooth_tattoo.sql (assignment_reminder) — C-2 MUST drizzle-kit migrate prod before api cutover; confirm RESEND_API_KEY_AUTH in api service scope. Railway is CLI-push not git-trigger."

head_signoff:
  verdict: APPROVED
  stage: C-1
  reviewers: {}
  failed_checks: []
  rationale: >
    All four core CI jobs (lint, typecheck, test, build) plus boot-probe, secret-scan, and
    e2e ran and passed on the migration-bearing HEAD — none skipped or cancelled. The test
    job executed the api integration tier against the Postgres 16 service; the reminder-scan
    cron correctness cases fired with live ReminderScanService logs (CI rule 5 satisfied — no
    coverage theater). gitleaks passed (process/** allowlisted). CI permissions are
    least-privilege (contents: read). PR branched off main and targeted main; no direct-to-main
    bypass. Migration 0013 is committed AND journal-registered (no orphaned migration). PR
    squash-merged CLEAN; local main fast-forwarded to the merge commit with the two
    brain-vendored files left uncommitted. Migration-0013-apply-before-cutover flagged to C-2.
  next_action: PROCEED_TO_C-2
```
