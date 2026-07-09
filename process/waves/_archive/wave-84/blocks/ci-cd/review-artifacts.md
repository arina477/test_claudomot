# Wave 84 — C-block handoff
```yaml
cicd_block_status:    complete
pr_number:            103   # + hotfix #104 (docker VITE args)
merge_commit:         5cb5e789   # final (wave-84 code + docker fix)
deploy_targets:
  - {platform: railway, service: supertokens-core, deployment: 147bdb40, env: ACCESS_TOKEN_VALIDITY=900}
  - {platform: railway, service: api, deployment: d168b272, commit: 5cb5e789, health: 200, note: "header transport; off stale wave-83"}
  - {platform: railway, service: web, deployment: dec8c8d4, commit: 5cb5e789, note: "CSP now includes t3.storageapi.dev + livekit wss + api https/wss + google fonts"}
env_set:
  web: [VITE_STORAGE_ORIGIN=https://t3.storageapi.dev, VITE_LIVEKIT_URL=wss://claudomat-test-sgf9259q.livekit.cloud, VITE_API_ORIGIN]
  core: [ACCESS_TOKEN_VALIDITY=900]
canary_status:        skipped
open_items:           ["e2e delete-any-message.spec.ts non-required realtime/auth-timing flake (not wave-caused; T-block/next-wave attention)"]
ready_for_test:       true
```
Deploy hit a shipped Docker build-arg defect (web Dockerfile didn't thread the new VITE_ vars → CSP missing storage/livekit; api Dockerfile aborted on the CSP guard). Fixed via hotfix PR #104 (thread VITE args + scope api build --filter=@studyhall/api...; corrected Tigris host to t3.storageapi.dev). Redeployed all 3; live CSP now correct.
