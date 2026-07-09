# C-2 — Deploy & verify (wave-85)

Frontend-only change (AssignmentCard toggle-revert + error toast). Web service deployed ONLY — no migration, no env-var change, no api-service deploy.

```yaml
ci_stage_verdict: PASS
armed_verification_failed: false
verdict_source: railway
verdict_evidence:
  - "railway web: deployment 62bae5fd-da5a-4a95-8109-96bd791b43ae status SUCCESS, commit ffcc5562bdb3a3bda789de64a7e3f7e77fe16807 (current origin/main HEAD)"
  - "https://web-production-bce1a8.up.railway.app/: 200 OK"
  - "fresh bundle hash served: assets/index-DbePiYZE.js (pre-deploy was index-8_3REWnd.js — rebuild confirmed)"
  - "app shell serves: <title>StudyHall</title> + id=\"root\" present"
  - "CSP meta intact: default-src 'self'; api (api-production-b93e.up.railway.app https+wss) + storage (t3.storageapi.dev https+wss) + livekit (wss claudomat-test-sgf9259q.livekit.cloud) + Google Fonts (fonts.googleapis.com style-src, fonts.gstatic.com font-src) — identical to wave-84"
deploy_targets:
  - platform: railway-web
    service_id: 107d4255-422a-4b72-b138-0647f9192fe4
    environment_id: bfdcc42f-fe5b-4198-a47a-b08f5940975d
    state: SUCCESS
    commit: ffcc5562bdb3a3bda789de64a7e3f7e77fe16807
    deployment_id: 62bae5fd-da5a-4a95-8109-96bd791b43ae
    verified_at: 2026-07-09T16:59Z
    live_url: https://web-production-bce1a8.up.railway.app/
    http_code: 200
    bundle_hash: assets/index-DbePiYZE.js
    health_url: https://web-production-bce1a8.up.railway.app/
async_monitor_id: ""
canary_status: skipped
canary_skip_reason: "self-use MVP; DAU below threshold. T-5 does the live behavioral probe of the toggle-failure toast."
canary_window:
  start: ""
  duration_minutes: 0
canary_monitor_id: ""
canary_alerts: []
reverted: false
rollback_target: dec8c8d4-d697-4558-b831-abeed38a5502
note: >
  ROLLBACK_TARGET captured before deploy = dec8c8d4-d697-4558-b831-abeed38a5502
  (prior SUCCESS, wave-84 commit 5cb5e789). Not used — new deploy healthy.
  Deploy triggered via serviceInstanceDeploy at current origin/main HEAD ffcc5562;
  build+deploy reached SUCCESS in ~80s. NOTE: new deployment used builder RAILPACK
  vs prior SUCCESS's DOCKERFILE (apps/web/Dockerfile) — build still succeeded, live
  200 + fresh bundle + intact CSP all verified, so the served artifact is correct;
  flagged here for awareness only. Web-service env vars (VITE_API_ORIGIN /
  VITE_STORAGE_ORIGIN / VITE_LIVEKIT_URL) unchanged from wave-84 — CSP rebuilt
  identically (confirmed byte-for-byte against wave-84 allowlist). AssignmentCard
  fix is bundle-internal; behavioral verification deferred to T-5. Canary skipped.
```

## Exit criteria
- Usable Railway credential in hand (Project-Access-Token header). ✓
- Web target shows SUCCESS with current main HEAD commit ffcc5562. ✓
- Live root returns 200; fresh bundle hash served (rebuild happened). ✓
- CSP allowlist intact (api/storage/livekit/fonts from wave-84). ✓
- Canary skip recorded (self-use MVP, below traffic threshold). ✓
- `ci_stage_verdict: PASS`. ✓

## Next
→ T-block. T-5 does the live behavioral probe of the AssignmentCard toggle-failure toast.
