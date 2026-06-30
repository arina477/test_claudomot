# C-1 — PR, CI & merge (wave-11)

Ops/test-infra wave (verified prod test fixture). No app code changed — diff is config (`project.yaml`, `.gitleaks.toml`) + one script (`apps/api/scripts/re-verify-fixture.sh`) + wave-11 process docs only.

## Branch / push
- Branch: `wave-11-verified-fixture` (already pushed at entry, HEAD `71b6d8c`).
- Repo: `arina477/test_claudomot`. Base: `main`.

## PR
- PR #22 — `chore(test): persistent verified prod test fixture (#wave-11)`
- URL: https://github.com/arina477/test_claudomot/pull/22
- Primary task cited: `4a2ad286`.

## Required CI checks (7) — final authoritative state on HEAD `29f1558`
| Check | Result |
|---|---|
| lint | pass |
| typecheck | pass |
| test | pass |
| build | pass |
| e2e | pass |
| boot-probe | pass |
| secret-scan (gitleaks) | **pass** |

Run 28411089966 conclusion: `success`. `gh pr checks 22` exit 0.

## Fix-up cycles (2) — gitleaks secret-scan
Initial run (HEAD `71b6d8c`, run 28410747924): **secret-scan FAIL** while 6 others passed. `gh run watch --exit-status` returned 0 (last-streamed job was e2e), but `gh pr checks` exit 1 + run conclusion `failure` were authoritative — false-green caught; merge withheld.

- **Finding:** `generic-api-key` on `project.yaml:83`, commit `ab6ce69`, fingerprint `ab6ce69…:project.yaml:generic-api-key:83`. Flagged value = SuperTokens user UUID `21984eb2-8029-4c1b-9e73-bc586a0be4d2` on a YAML **comment** line.
- **Classification (triage routing table):** "leaked secret" → tag `security`. Routed to `security-engineer` per Iron Law (orchestrator did NOT fix directly).
- **Cycle 1 (`166a127`):** removed the comment line from working tree. STILL FAIL — gitleaks scans git **history** over the PR commit range (`bda813f^..HEAD`), so the value at `ab6ce69` was still found. Key lesson: a forward working-tree edit cannot clear a history-range scan.
- **Cycle 2 (`29f1558`):** confirmed FALSE POSITIVE (a SuperTokens user_id is a DB record identifier, not a credential). Added a narrow scoped `.gitleaks.toml`: `[extend] useDefault=true` (all default rules stay live) + a triple-constrained `[allowlist]` (exact commit `ab6ce69` + path `project.yaml` + literal UUID regex). Proven narrow: an unrelated secret-shaped finding still fired under the config; the PR-range scan cleared to 0 leaks. Scanner configured, NOT bypassed — no `--no-verify`, no CI/workflow edits, no history rewrite.

## Merge
- `mergeable: MERGEABLE`, `mergeStateStatus: CLEAN` before merge.
- `gh pr merge 22 --squash --delete-branch` → exit 0.
- State: `MERGED` at 2026-06-30T00:09:41Z. Branch deleted on origin.

```yaml
ci_stage_verdict: PASS
verdict_source: gh
verdict_evidence:
  - "gh pr view 22 state MERGED"
  - "gh pr checks 22 all 7 required checks passed (run 28411089966 conclusion=success)"
  - "secret-scan: gitleaks pass after scoped .gitleaks.toml false-positive allowlist (29f1558)"
  - "merge commit: 57927b12ced8857ea9bfa52a23b4948b536f71fe"
pr_number: 22
pr_url: https://github.com/arina477/test_claudomot/pull/22
branch: wave-11-verified-fixture
required_checks: [lint, typecheck, test, build, e2e, boot-probe, secret-scan]
optional_checks: []
fix_up_cycles: 2
final_commit_sha: 29f1558692a13bd8854c3c58c4220b3c3f3b83ca
merge_strategy: squash
merge_commit_sha: 57927b12ced8857ea9bfa52a23b4948b536f71fe
rebase_cycles: 0
note: "Ops/no-app-code wave. 2 fix-up cycles to clear a gitleaks false positive (SuperTokens user_id, not a credential) via scoped .gitleaks.toml allowlist — routed to security-engineer per Iron Law; scanner never bypassed."
```
