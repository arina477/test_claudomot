# C-2 — Deploy & Verify (wave-82)

```yaml
stage: C-2
wave: 82
owner: head-ci-cd
ci_stage_verdict: PASS
verdict_source: railway
wave_shape: frontend-only        # WEB service only; no schema change → no DB migration
migration_required: false

verdict_evidence:
  deployment_id: 9a66622e-66e6-4034-9435-e2c11092054b
  deployment_status: SUCCESS
  commit_sha: b22457a96bad534289c662600e94c80decbb3c4a   # main HEAD merge commit; transient-401 auth fix
  commit_binding: confirmed        # deployment.meta.commit == triggered commitSha
  deploy_trigger: serviceInstanceDeploy(environmentId, serviceId, commitSha)  # GraphQL, Project-Access-Token
  created_at: "2026-07-09T11:15:14.173Z"
  build_time_observed: ~2min (BUILDING @ 11:15:14 → SUCCESS by 11:16:56 poll tick)
  poll_method: inline (30s cadence, terminal at tick 3; well under 10-min cap)
  health_probe:
    url: https://web-production-bce1a8.up.railway.app/
    http_code: 200
  fresh_bundle:
    js: assets/index-CesvhXg_.js
    css: assets/index-Dd6fIRQx.css
    note: fresh hash served — deploy rebuilt the Vite web bundle
  app_shell:
    title: StudyHall
    root_div: present (id="root")
  behavioral_note: >
    Auth transient-401 fix is JS-bundle-internal; not curl-assertable. C-2 bar =
    fresh 200-serving bundle + SUCCESS deploy at the fix commit. T-block runs the
    live behavioral probe of the auth fix.

deploy_targets:
  - service: web
    service_id: 107d4255-422a-4b72-b138-0647f9192fe4
    environment: production
    environment_id: bfdcc42f-fe5b-4198-a47a-b08f5940975d
    url: https://web-production-bce1a8.up.railway.app
    deployment_id: 9a66622e-66e6-4034-9435-e2c11092054b
    status: SUCCESS
  # api (7358a103…), postgres (8d177be8…), supertokens (73ca977a…) NOT touched this wave

canary_status: skipped
canary_skip_reason: >
  DAU below canary threshold (self-use MVP, <1000 DAU). T-block synthetic probes
  are the post-deploy signal.

prod_state: clean          # no test artifacts left in prod
note: >
  Frontend-only wave. WEB redeployed from main HEAD (merge commit) via Railway
  serviceInstanceDeploy pinned to commitSha. No migration (no schema change).
  Deploy reached SUCCESS; health 200; fresh bundle hash confirms rebuild; app
  shell serves. Canary skipped (DAU below threshold). PASS.
```
