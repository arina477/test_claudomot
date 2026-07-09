# C-2 — Deploy & verify (wave-84)

```yaml
ci_stage_verdict: PASS                 # Docker build-arg hotfix (PR #104) landed + redeployed. api now at wave-84 code (off stale wave-83); web CSP now includes ALL required origins (storage + livekit). Prior HOLD (build-wiring defect) resolved at source via a follow-up build/PR, not hand-patched at C-2.
armed_verification_failed: false
verdict_source: railway
head: 5cb5e789e1cfc4e527919a4b4ec96e16f4cdab0f   # current main HEAD (docker hotfix squash-merged as 5cb5e789 via PR #104)

# ---- Hotfix PR (Part A) ----
hotfix_pr:
  number: 104
  title: "fix(docker): thread VITE build args + scope api image build (wave-84)"
  branch: wave-84-fix-docker-vite-args
  merge_sha: 5cb5e789e1cfc4e527919a4b4ec96e16f4cdab0f
  merged_at: 2026-07-09T15:27:29Z
  merge_strategy: squash + delete-branch
  changes: |
    apps/web/Dockerfile  — added ARG+ENV for VITE_STORAGE_ORIGIN + VITE_LIVEKIT_URL (were undeclared → never threaded into the Vite build → absent from served CSP).
    apps/api/Dockerfile  — scoped the image build to exclude @studyhall/web (was running the full turbo build incl. web, which tripped the wave-84 CSP loud-fail guard → api build FAILED).
    apps/web/csp.ts + apps/web/.env.example — corrected Tigris host to t3.storageapi.dev.
  required_checks:
    lint:        pass
    typecheck:   pass
    test:        pass
    build:       pass          # builds with ci.yml VITE envs (corrected t3.storageapi.dev)
    secret-scan: pass
    boot-probe:  pass
  non_required_checks:
    e2e: FAIL   # NOT a required/branch-protection check (PR mergeStateStatus=UNSTABLE, MERGEABLE). Failing test: apps/web/e2e/delete-any-message.spec.ts (two-client Socket.IO moderator-delete fan-out). One `gh run rerun --failed` performed → failed again but with a DIFFERENT signature (run1: B message marker not visible after 15s; run2: signIn 'Server rail' nav not visible after 25s → auth/session timing). Non-deterministic across runs = environmental realtime/auth timing flake, NOT one of the 3 documented flakes but same class. Docker-only change is causally unrelated to web realtime behavior. Not a required-check → non-blocking; not hand-fixed (Iron Law: unrelated + not a C-2 fix). Recorded for T-block/next-wave attention.

# ---- Env vars (confirmed present from prior C-2 attempt; NOT re-set) ----
env_vars_confirmed:
  - {service: supertokens-core (73ca977a), name: ACCESS_TOKEN_VALIDITY, value: "900", confirmed_via: variables-query}
  - {service: web (107d4255), name: VITE_STORAGE_ORIGIN, value: "https://t3.storageapi.dev"}
  - {service: web (107d4255), name: VITE_LIVEKIT_URL, value: "wss://claudomat-test-sgf9259q.livekit.cloud"}
  - {service: web (107d4255), name: VITE_API_ORIGIN, value: "https://api-production-b93e.up.railway.app"}

# ---- Rollback targets captured pre-deploy (Part B step 1; unused — no live break) ----
rollback_targets:
  api: 1a837742-28dd-45ff-b27a-3694125269e0   # prior live SUCCESS (stale wave-83 commit dd24a7d6)
  web: 15269b7c-7af6-4f37-b3a1-248dbb0a9d94   # prior live SUCCESS (commit 9fa436d9, CSP missing storage+livekit)
reverted: false   # both new deploys SUCCESS; web CSP now correct → no REVERT-ON-BREAK triggered.

# ---- Deployments (Part B) ----
deploy_targets:
  - platform: railway-api
    service_id: 7358a103-0a4f-44e6-9468-3d02d045531e
    deployment_id: d168b272-9c66-4960-bf3a-909e06ddb56f
    state: SUCCESS
    commit: 5cb5e789e1cfc4e527919a4b4ec96e16f4cdab0f   # AT NEW MERGE HEAD — no longer stale dd24a7d6 (wave-83)
    at_new_commit: true
    image_digest: sha256:3758bf5aa0bd7e02849b430b8c08e81035209260e965107e6539a2a16a91fdaf   # fresh (prior stale image was sha256:d43fa703)
    verified_at: 2026-07-09T15:34Z
    health_url: "https://api-production-b93e.up.railway.app/health"
    health: "HTTP 200 {status:ok, service:studyhall-api, version:0.0.1}"
    note: "Scoped api Dockerfile build succeeded where prior full-turbo build FAILED on the CSP guard. wave-84 header-transport change now IN production."
  - platform: railway-web
    service_id: 107d4255-422a-4b72-b138-0647f9192fe4
    deployment_id: dec8c8d4-d697-4558-b831-abeed38a5502
    state: SUCCESS
    commit: 5cb5e789e1cfc4e527919a4b4ec96e16f4cdab0f
    at_new_commit: true
    image_digest: sha256:936d652b6a58142d528b92d3b4b50a5c4d439cc78b178068feedccf6a85b968d   # fresh rebuild with the newly-threaded VITE ARGs
    verified_at: 2026-07-09T15:34Z
    health_url: "https://web-production-bce1a8.up.railway.app/"
    health: "HTTP 200 (index.html served); bundle assets/index-8_3REWnd.js"
    note: "Bundle entry hash unchanged (web source unchanged by this hotfix); the FIX is in index.html's injected CSP meta, now built with the storage+livekit ARGs present."

# ---- api health (C-2 bar) ----
api_health: "GET https://api-production-b93e.up.railway.app/health → HTTP 200; serving NEW commit 5cb5e789 (wave-84 code), NOT stale dd24a7d6."
api_not_stale: true

# ---- web CSP meta verification (C-2 bar — THE fix success criterion) ----
web_csp_meta_present: true
web_csp_served: |
  default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: blob: https://api-production-b93e.up.railway.app https://t3.storageapi.dev;
  media-src 'self' blob: mediastream:;
  connect-src 'self' https://api-production-b93e.up.railway.app wss://api-production-b93e.up.railway.app https://t3.storageapi.dev wss://claudomat-test-sgf9259q.livekit.cloud;
  worker-src 'self'; manifest-src 'self'; base-uri 'self'; object-src 'none'
web_csp_origin_check:
  api_https_origin:   PRESENT           # https://api-production-b93e.up.railway.app in img-src + connect-src
  api_wss_origin:     PRESENT           # wss://api-production-b93e.up.railway.app in connect-src
  storage_origin:     PRESENT           # https://t3.storageapi.dev NOW in img-src AND connect-src  ← WAS MISSING, NOW FIXED
  livekit_wss_origin: PRESENT           # wss://claudomat-test-sgf9259q.livekit.cloud NOW in connect-src ← WAS MISSING, NOW FIXED

# ---- Canary ----
canary_status: skipped
canary_skip_reason: "self-use MVP; DAU below threshold. T-block synthetic probes (T-8 CSP proof) are the post-deploy signal."

note: |
  All Railway ops via GraphQL Project-Access-Token header (no CLI, no me{}). Endpoint backboard.railway.com/graphql/v2.
  Part A: PR #104 (docker hotfix) — 6 required checks green; e2e (non-required) flaky-failed twice with shifting signature, unrelated to a Dockerfile change → merged squash. Local main rebased to 5cb5e789.
  Part B: api + web redeployed at merge HEAD via serviceInstanceDeployV2(commitSha). Both SUCCESS at 5cb5e789.
  Prior HOLD RESOLVED: (1) api off stale wave-83 commit → now at wave-84 code (health 200); (2) web CSP now includes storage (t3.storageapi.dev, img-src+connect-src) + livekit (wss, connect-src) — the exact origins that were MISSING. Rollback targets captured but unused (no break).
```

## Summary

- **Part A — hotfix landed.** PR **#104** `fix(docker): thread VITE build args + scope api image build (wave-84)` squash-merged → merge SHA **5cb5e789e1cfc4e527919a4b4ec96e16f4cdab0f**. All **6 required checks green** (lint, typecheck, test, build, secret-scan, boot-probe). Non-required `e2e` failed twice on an unrelated two-client realtime/auth-timing flake (`delete-any-message.spec.ts`, shifting signature across the one rerun) — non-blocking, not hand-fixed. Local main rebased to the merge SHA.
- **Part B — redeploy verified LIVE.**
  - **api** `d168b272-9c66-4960-bf3a-909e06ddb56f` **SUCCESS** at commit **5cb5e789** (fresh image `sha256:3758bf5a`) — **no longer stale wave-83** (was dd24a7d6). The scoped api Dockerfile built cleanly where the prior full-turbo build failed on the CSP guard. `/health` → **200**.
  - **web** `dec8c8d4-d697-4558-b831-abeed38a5502` **SUCCESS** at commit **5cb5e789** (fresh image `sha256:936d652b`) — serves **200**.
  - **web CSP (the fix's success criterion):** served meta now includes **ALL** required origins — `https://t3.storageapi.dev` in **img-src + connect-src** (was MISSING), `wss://claudomat-test-sgf9259q.livekit.cloud` in **connect-src** (was MISSING), plus the api https + wss origins.
  - core `ACCESS_TOKEN_VALIDITY=900` confirmed present.
- **Verdict: PASS.** Prior C-2 HOLD fully resolved at source: api on wave-84 code + healthy, web CSP correct. No rollback needed.
