# C-1 — PR, CI & Merge (wave-89)

**Wave:** 89 — a11y fix: focus the first errored academic-identity profile field on failed save
**Stage:** C-1 (PR & CI gate → merge)
**Owner:** head-ci-cd
**Primary task:** 45f0a88d (single-spec)
**Change class:** WEB (frontend). C-2 deploy targets the web service.

---

## PR

- **Number:** #110
- **URL:** https://github.com/arina477/test_claudomot/pull/110
- **Title:** `fix(profile): focus the first errored academic field on failed save`
- **Head:** `wave-89-focus-errored-profile-field` → **Base:** `main`
- **Merge strategy:** squash (branch deleted on merge)

## CI — run 29054747801

Per-job conclusions read from `gh run view --json jobs` (CI-PRINCIPLES rule 3 — not `watch` alone):

| Job | Required | Conclusion |
|---|---|---|
| lint | yes | success |
| typecheck | yes | success |
| test | yes | success |
| build | yes | success |
| secret-scan | yes | success |
| boot-probe | yes | success |
| e2e | no | failure (non-blocking) |

**All 6 required checks green.** `mergeable: MERGEABLE`, `mergeStateStatus: UNSTABLE` (UNSTABLE = a non-required check failed; does not block).

## Flake handling

- **study-timer.test.tsx (B-5 ledgered flake):** did NOT appear. The `test` job passed on the first run — no re-run performed, no re-run needed.
- **e2e failure (non-required):** `delete-any-message.spec.ts` failed at the `signIn` helper (Server-rail navigation not visible post sign-in) and downstream message fan-out assertion. This is the known non-required e2e sign-in / realtime flake class — a messaging/moderator spec, unrelated to the profile academic-field change. No profile-academic or wave-89 file involved. Per briefing + CI-PRINCIPLES rule 11 (prod-baseURL e2e is non-required), does not block.

## Merge

- **Merged:** yes
- **Merge commit SHA:** `b27277db04547c8c49b5f7c501fe6de68ddf4a12`
- **Merged at:** 2026-07-09T22:34:01Z
- Local `main` rebased/fast-forwarded to the merge commit; stray wave-89 P-block doc commit dropped (patch already upstream).

**Hand-off to C-2:** deploy the **web** service at merge commit `b27277db04547c8c49b5f7c501fe6de68ddf4a12`.

---

```yaml
head_signoff:
  verdict: APPROVED
  stage: C-1
  reviewers: {}
  failed_checks: []
  rationale: >
    All six required CI jobs (lint, typecheck, test, build, secret-scan, boot-probe)
    ran and passed on run 29054747801, read from per-job conclusions. The sole failure
    is the non-required e2e job, failing in delete-any-message.spec.ts at the sign-in /
    realtime fan-out step — the known non-blocking flake class, unrelated to the profile
    academic-field change and touching no wave-89 file. The B-5-ledgered study-timer flake
    did not appear; the test job passed first-run so no re-run was needed. PR #110 was
    squash-merged to main at b27277db04547c8c49b5f7c501fe6de68ddf4a12; local main synced.
  next_action: PROCEED_TO_C-2
  block_state:
    pr_url: https://github.com/arina477/test_claudomot/pull/110
    ci_run_id: "29054747801"
    merge_commit_sha: b27277db04547c8c49b5f7c501fe6de68ddf4a12
    change_class: web
    deploy_monitor_path: null
    canary_monitor_path: null
    rollback_ready: false
```
