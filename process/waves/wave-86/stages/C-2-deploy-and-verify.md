# C-2 — Deploy & Verify (wave-86)

```yaml
ci_stage_verdict: PASS
verdict_source: railway
stage: C-2
wave: 86
change_class: backend-only            # SuperTokens Session.init antiCsrf:'NONE' explicit + CSRF regression test
migration: none
env_var_changes: none
web_frontend_change: none

deploy_targets:
  - service: api
    service_id: 7358a103-0a4f-44e6-9468-3d02d045531e
    environment_id: bfdcc42f-fe5b-4198-a47a-b08f5940975d
    project_id: ae55c191-4631-4224-b7b2-42f329ed48d7
    live_url: https://api-production-b93e.up.railway.app
    deployment_id: 0f38d1fe-d832-4683-9dd9-1bb4698ed431
    status: SUCCESS
    deployed_commit: a9556248d28d5317275f3e24239929a8c362fdf7   # wave-86 main HEAD (includes antiCsrf commit 83c308a6, PR #106)
    at_new_commit: true

verdict_evidence:
  deployment_id: 0f38d1fe-d832-4683-9dd9-1bb4698ed431
  deployment_status: SUCCESS
  at_new_commit: true
  deployed_commit: a9556248d28d5317275f3e24239929a8c362fdf7
  main_head_at_deploy: a9556248d28d5317275f3e24239929a8c362fdf7
  health_check:
    url: https://api-production-b93e.up.railway.app/health
    http_code: 200
  auth_path_sanity:
    url: https://api-production-b93e.up.railway.app/servers
    origin_header: https://web-production-bce1a8.up.railway.app
    http_code: 401                       # expected without a session — auth guard intact, NOT a 500
    cors_allow_credentials: true
    cors_allow_origin: https://web-production-bce1a8.up.railway.app
    note: >
      401 (not 500) with correct CORS credential/origin echo confirms the
      SuperTokens auth path did not break from antiCsrf:'NONE'. Live behavioral
      proof of CSRF posture (cookie-only forged POST rejected) is T-8's job;
      C-2 confirms the api is healthy and serving the new revision.

  rollback_target: d168b272-9c66-4960-bf3a-909e06ddb56f   # prior SUCCESS (commit 5cb5e789, wave-84)
  reverted: false

canary:
  status: skipped
  reason: self-use MVP

notes:
  - >
    First serviceInstanceDeploy call (no commitSha) redeployed the pinned prior
    commit 5cb5e789 (wave-84), producing SUCCESS deploy 636d1e30 at the STALE
    commit with an identical imageDigest. Detected via at-new-commit check.
    Re-triggered serviceInstanceDeploy with explicit
    commitSha=a9556248... which built + deployed the correct wave-86 HEAD
    (deploy 0f38d1fe, SUCCESS, commit confirmed). Lesson: this api service does
    not auto-track main HEAD on a bare serviceInstanceDeploy — pass commitSha.
  - api Dockerfile is scoped (--filter=@studyhall/api...) since wave-84; built
    cleanly without VITE build args.
```

**Verdict: PASS.** api deployed at wave-86 HEAD (a9556248, includes antiCsrf commit 83c308a6), deployment 0f38d1fe SUCCESS and confirmed at-new-commit, /health 200, auth path returns 401 (intact, not 500). No revert. Canary skipped (self-use MVP).
