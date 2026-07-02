# C-1 — PR, CI & merge (wave-37 notifications)

**Stage:** C-1 | **Block:** C (CI/CD) | **Owner:** head-ci-cd | **Mode:** automatic (`--auto` authorized)

## Branch push (Action 1)
- Branch `wave-37-notifications` already pushed at HEAD `5725747ec1b01562e09da4ef53413c8e5514330b` (B-6 gate-passed commit). Remote ref matched local; no re-push or force-push required.

## PR (Actions 2–5)
- **Title:** `feat: persistent in-app notifications (bell, panel, unread API)` (64 chars, under 70)
- **Number:** 51
- **URL:** https://github.com/arina477/test_claudomot/pull/51
- **Base:** main | **Head:** wave-37-notifications
- Body carries Summary / Test plan / Spec contract (primary 0b33df33 + claimed 0b33df33, f3f52d9a, edac03e0) / Wave artifacts + AI-attribution footer.

## Required checks (Actions 6–7, run 28622699260)
All seven required checks on HEAD `5725747` — run conclusion `success`:

| check | outcome | duration |
|---|---|---|
| lint | pass | 25s |
| typecheck | pass | 33s |
| test | pass | 1m26s |
| build | pass | 34s |
| secret-scan (gitleaks) | pass | 8s |
| e2e | pass | 58s |
| boot-probe | pass | 1m0s |

Four core jobs (lint, typecheck, test, build) all ran + passed — none skipped/cancelled/no-op. Secret-scan (gitleaks) ran + passed — no secret in diff. No flake re-run needed (documented flake `apps/web/src/shell/server-roles.test.tsx` did not fail).

## CRITICAL — notifications integration-executed evidence (Action 3, false-green guard)
Pulled the **test-job log** (job 84882043926) and confirmed the security-value tier PROVABLY EXECUTED, not skipped, against the **postgres:16** service container (log: `docker pull postgres:16` in Initialize containers):

- **`test/integration/notifications-authz.spec.ts`** — 6 tests ran, 0 skipped, all ✓, with real-DB latencies (54ms / 173ms / 407ms / 201ms / 203ms / 84ms — not 0ms mock stubs):
  - sanity: users table has 2 real rows after seed (non-trivial real-DB write proof → DATABASE_URL_TEST reached vitest)
  - owner-404: B calling markRead on A notification → 404; A stays unread; A marks own read successfully
  - markRead idempotent (double-mark stable)
  - markAllRead scoped (A read, B untouched)
  - mention dedup: double-emit for same (user, message) → exactly 1 row
  - listForUser scoped to A only, correct unreadCount + enrichment
- **`src/notifications/notifications.controller.spec.ts`** — 14 tests ran, 0 skipped, all ✓ (method-drift: markRead=PATCH, markAllRead=POST, list=GET; structural IDOR/session-scoping proofs).
- Aggregate API test batches: 521 + 333 + 57 + 37 passed; **0 skipped** across entire test job (the single "skipped" log token is the benign pnpm `resolution step is skipped`, not a test).

Verdict on the guard: **integration tier executed against postgres:16 — PASS.** Not a false green.

## Mergeable + merge (Actions 10–12)
- `gh pr view 51` → `mergeable: MERGEABLE`, `mergeStateStatus: CLEAN`, no rebase needed.
- Merged via `gh pr merge 51 --squash --delete-branch --auto` (automatic mode authorizes `--auto`).
- PR state: **MERGED** at 2026-07-02T21:30:19Z.
- Remote branch `wave-37-notifications` deleted.
- Local main synced (`git checkout main && git pull --rebase`) → HEAD `86b73239b364a83f6ec83a9c9eb52c6d5017fd80` (matches merge commit).

## Migrations note
Migrations 0015 (notifications table) + 0016 (assignment_reminder partial-unique) are committed as SQL files and travel with this merge. They are NOT applied here — they apply explicitly (drizzle-kit migrate, in order) at **C-2** before the new revision serves.

```yaml
ci_stage_verdict: PASS
verdict_source: gh
verdict_evidence:
  - "gh pr view 51 state MERGED (mergedAt 2026-07-02T21:30:19Z)"
  - "gh pr checks 51 — all 7 required checks passed (run 28622699260 conclusion success)"
  - "notifications integration tier executed vs postgres:16: notifications-authz.spec.ts 6/6 ran+passed 0 skipped (real-DB latencies), notifications.controller.spec.ts 14/14; 0 test skips job-wide"
  - "merge commit: 86b73239b364a83f6ec83a9c9eb52c6d5017fd80"
pr_number: 51
pr_url: https://github.com/arina477/test_claudomot/pull/51
branch: wave-37-notifications
required_checks: [lint, typecheck, test, build, secret-scan, e2e, boot-probe]
optional_checks: []
notifications_integration_executed:
  spec: test/integration/notifications-authz.spec.ts
  postgres_service: "postgres:16"
  tests_ran: 6
  tests_skipped: 0
  controller_method_drift_spec: src/notifications/notifications.controller.spec.ts
  controller_tests_ran: 14
  false_green_guard: PASS
fix_up_cycles: 0
flake_reruns: 0
final_commit_sha: 5725747ec1b01562e09da4ef53413c8e5514330b
merge_strategy: squash
merge_commit_sha: 86b73239b364a83f6ec83a9c9eb52c6d5017fd80
rebase_cycles: 0
note: "Migrations 0015+0016 committed, applied at C-2 not C-1."
```

## head_signoff
```yaml
head_signoff:
  verdict: APPROVED
  stage: C-1
  reviewers: {}
  failed_checks: []
  rationale: >
    All four core CI jobs (lint, typecheck, test, build) plus gitleaks secret-scan, e2e,
    and boot-probe ran and passed on HEAD 5725747. The wave's security value — the owner-404
    authz boundary + mention dedup — was proven to EXECUTE against the postgres:16 service:
    notifications-authz.spec.ts ran 6 real-DB tests (non-zero latencies, DATABASE_URL_TEST
    reached vitest) with 0 skipped, and the controller method-drift spec ran 14 tests. No
    false green. PR squash-merged to main (86b7323), branch deleted, local main synced.
  next_action: PROCEED_TO_C-2
```
