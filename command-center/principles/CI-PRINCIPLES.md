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
# Format: one entry per environment
deploy_targets:
  - environment: <production | staging | preview>
    platform: <railway | netlify | vercel | aws | other>
    branch: <main | staging | pr-* preview>
    healthcheck_url: <https://...>
    deploy_status_command: <e.g. "railway status --service api">
    rollback_command: <e.g. "railway rollback --service api --to=<sha>">
    notes: <any quirks — cold-start time, DB-migration step ordering, secrets refresh>
```

### Canary configuration

```yaml
# Consumed by C-3 deploy & verify (canary phase) and `/canary` skill.
canary:
  enabled: <true | false>
  duration_minutes: <e.g. 15>
  rollback_threshold:
    error_rate_pct: <e.g. 1.0>
    p95_latency_delta_ms: <e.g. 200>
  smoke_routes:
    - <https://prod-url/path>
    - <https://prod-url/another>
  alert_destination: <slack:#deploys | email:ops@... | none>
```

### PR conventions

```yaml
# Consumed by C-1 PR creation.
pr_conventions:
  title_format: "<type>: <short description>"   # see C-1 stage file for type list
  title_max_chars: 70
  body_template: claudomat-default              # or path to project-specific template
  required_reviewers: []                        # GitHub usernames; empty = no required reviewers
  required_labels: []                           # e.g. ["wave"]
  ai_attribution_footer: <true | false>         # include "🤖 Generated with Claude Code" footer
  auto_merge_after_ci: <true | false>           # only for trusted-author PRs; defaults false
```

---

## Rules

_(no rules yet — promoted from L-2 distill across waves)_
