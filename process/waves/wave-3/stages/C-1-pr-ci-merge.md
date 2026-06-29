# Wave 3 — C-1 PR/CI/merge — PASS
PR #5 (feat(web): auth frontend — login/signup/profile + /profile API) squash-merged to main (5eadfae); all 5 CI green. Then a fix-forward: api crash-looped on deploy — root cause @studyhall/shared package.json pointed main/exports to src/index.ts (TS source) → runtime ERR_MODULE_NOT_FOUND on ./health.js. Fixed (devops-engineer) → point exports to dist/index.js; PR #6 (fix(shared)...) merged (b3efa82), 5 CI green.
```yaml
ci_stage_verdict: PASS
prs: [5, 6]
merge_commit: b3efa82
```
