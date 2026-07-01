# CI Principles — <Your Project>

Cross-wave CI / deploy / canary / PR-convention rules promoted from L-2 distill. Append-only; numbered sequentially. Read at every C-block stage.

---

## Contract for new rules

Format (deterministic; karen + L-2 linter reject anything that doesn't match):

```
N. <one-line declarative rule, ≤120 chars, ending in a period>
   Why: <one-line causal explanation, ≤100 chars, ending in a period>
```

Hard limits: rule line ≤ 120 chars; why line ≤ 100 chars; entry = exactly 2 non-empty lines.

Forbidden tokens (rule or why line, case-insensitive): `we`, `our`, `the team`, `during wave-`, `wave-<N>`, `because ... because`, em-dash (`—`), any parenthetical longer than ~5 words.

### GOOD

```
4. Never mock the database in integration tests.
   Why: A passing mock that doesn't match prod schema masks broken migrations.
```

### REJECTED — multi-clause prose

```
4. We've found that mocking the database, while convenient, can sometimes lead
to issues during integration testing because the mock might not accurately
reflect the production schema, especially after migrations...
```

Reasons: prose voice (`We've found`), runs > 1 line, hedging (`can sometimes`), war-story preamble.

### REJECTED — wave reference

```
4. After wave-7's auth bug, always validate session tokens at the edge.
```

Reason: cites a wave; rules outlive the wave they were learned from.

### REJECTED — non-falsifiable

```
4. Write good error messages.
```

Reason: not falsifiable; can't be checked by any subsequent reviewer.

### Authoring discipline

- Before adding: grep for the concept; do not add a near-dup.
- Number sequentially; renumber on insert.
- Group under an existing H2 unless ≥3 new rules share a theme.
- Wave-specific ("broke once") stays in `process/waves/wave-<N>/blocks/L/observations.md` until a second wave confirms.

---

## Promotion path

Promoted at L-2 Distill from `process/waves/wave-<N>/blocks/L/observations.md` by `karen` (rule-quality vetter) when an observation appears across 2+ waves AND head-ci-cd approves. Maximum 1 rule promoted per wave per file (cap is per-file, not per-wave — multiple principles files may each receive one). See `claudomat-brain/blocks/learn/stages/L-2-distill.md`.

---

## Project configuration (authored at v11 onboarding)

Three sections below are populated at `claudomat init` from the v6 DevOps branch + founder Q&A. Update them via L-2 distill (or directly when CI / deploy / canary topology changes between waves).

### Deploy targets

```yaml
# Format: one entry per environment. Railway bring-your-own; project/services
# provisioned + back-filled at first deploy (C-2 Action 0).
deploy_targets:
  - environment: production
    platform: railway
    branch: main
    healthcheck_url: "https://<railway-domain>/health"   # back-filled at first deploy
    deploy_status_command: "railway status --service api"
    rollback_command: "railway rollback --service api --to=<sha>"
    notes: "API + web + postgres (+ supertokens/livekit) as Railway services over private network. WebSocket needs sticky sessions; LiveKit needs UDP/WebRTC support — verify at first deploy. Run drizzle migrations before app boot."
  - environment: preview
    platform: railway
    branch: "pr-* preview"
    healthcheck_url: "https://<pr-preview-domain>/health"
    deploy_status_command: "railway status"
    rollback_command: "n/a (ephemeral PR environment)"
    notes: "Railway PR preview environments. Do NOT share production Postgres before a real cohort onboards (devops.md risk)."
```

### Canary configuration

```yaml
# Consumed by C-3 deploy & verify (canary phase) and `/canary` skill.
# self-use-mvp: canary disabled until real users arrive (also gated by
# project.yaml deploy_targets[].canary_threshold_dau=1000). Lenient thresholds
# recorded for when it's enabled at launch (M7). Smoke routes still run.
canary:
  enabled: false
  duration_minutes: 15
  rollback_threshold:
    error_rate_pct: 2.0
    p95_latency_delta_ms: 500
  smoke_routes:
    - "https://<railway-domain>/health"
    - "https://<railway-domain>/"
  alert_destination: none
```

### PR conventions

```yaml
# Consumed by C-1 PR creation. Defaults: AI footer on, auto-merge off, squash.
pr_conventions:
  title_format: "<type>: <short description>"   # see C-1 stage file for type list
  title_max_chars: 70
  body_template: claudomat-default
  required_reviewers: []                        # solo founder; none required
  required_labels: []
  ai_attribution_footer: true
  auto_merge_after_ci: false
  merge_strategy: squash                        # mirrors project.yaml: merge_strategy
```

---

## Rules

1. Verify a deploy via the platform deployment-state endpoint reading status SUCCESS, never via /health alone.
   Why: /health can return 200 from the prior revision and hide a crashed or wrong-revision deploy.

2. Probe a new-only route for a 404-to-auth-gated-status flip after deploy-state SUCCESS before passing.
   Why: A SUCCESS with the new route still 404ing proves the prior revision serves, a false-green.

3. Gate merge on per-job conclusions from `gh run view --json jobs`; never on `gh run watch --exit-status` alone.
   Why: The watch tool reflects the last-streamed job state, not the aggregate required-job result.

4. Run the formatter check command at the wiring stage before commit, not only the test and typecheck commands.
   Why: A file committed without the formatter passes a local test run but fails the CI format gate.

5. Assert a nonzero executed-count from the CI integration job log; a green exit with zero specs run is a false-green.
   Why: A stripped env var makes the integration tier skip all specs yet still exit the job green.

6. Run CI on every push to main, including docs and bypass pushes, or scope the linter to source files only.
   Why: A direct-to-main push that skips CI hides breakage until the next feature PR runs.
