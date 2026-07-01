# C-1 — PR, CI, Merge (wave-28)

**Branch:** `wave-28-invite-rotate` (HEAD 45bee74) → `main`
**Spec:** owner-only `POST /servers/:id/invite-code/rotate` (CSPRNG rotate to invalidate leaked permanent invite link; backend-only apps/api; no schema/migration).
**Mode:** automatic (BOARD owns approval; `--auto` authorized).

## PR

- **#41** — https://github.com/arina477/test_claudomot/pull/41
- Title: `feat: rotate permanent server invite_code (owner-gated)`
- Base `main` ← head `wave-28-invite-rotate`. No direct-to-main push; CI gate is real.

## Required checks — final green re-run on HEAD 6eb62e4 (run 28532913181)

| check | conclusion |
|---|---|
| test | success |
| typecheck | success |
| lint | success |
| build | success |
| boot-probe | success |
| e2e | success |
| **secret-scan (gitleaks)** | **success** |

**7/7 green.** `secret-scan` (gitleaks 8.24.3, blocking) passed in 11s on HEAD `6eb62e4` — the false-positive entropy finding is now suppressed by the corrected allowlist. Run `28532913181` conclusion=success, all seven required jobs succeeded.

**Prior runs (for the record):** `28532301006` (HEAD 45bee74) and `28532557839` (HEAD 99e0cf3) — both 6/7, secret-scan FAILURE (see fix-up cycles below).

## Fix-up cycle 1 — gitleaks `process/**` allowlist (commit 99e0cf3, devops-engineer) — INEFFECTIVE

devops-engineer pushed `99e0cf3` adding a `process/**` path allowlist to `.gitleaks.toml`. Re-run `28532557839` reproduces the IDENTICAL finding (same file, line, fingerprint). **Root cause of the ineffective fix:** the allowlist was authored as a top-level `[[allowlists]]` **array-of-tables** appended below the existing singular `[allowlist]` table. gitleaks' top-level global-allowlist key is the **singular `[allowlist]`** table; a second document-root `[[allowlists]]` block is not the recognized global-allowlist key and is silently ignored during config parse. The `process/.*` path allowlist therefore never took effect, and the entropy false positive in `process/waves/wave-28/blocks/B/gate-verdict.md:26` was still reported → exit code 2 → job fails. The `[[allowlists]]` entries must be folded INTO the singular `[allowlist]` table (e.g. as additional `paths`), not added as a sibling array-of-tables. This is a `ci-config` fix routed to devops-engineer per Iron Law — NOT fixed by head-ci-cd directly.

## Secret-scan finding — RESOLVED (was false positive)

- **File:** `process/waves/wave-28/blocks/B/gate-verdict.md` line 26
- **Rule:** `generic-api-key` — Entropy 3.807
- **Fingerprint:** `45bee74d3997e1cff86ec5a46641d793607d1098:process/waves/wave-28/blocks/B/gate-verdict.md:generic-api-key:26`
- **Content:** prose describing auth posture — `...server-side-at-every-door): auth at the guard, RBAC/ownership in the service.` No credential present.
- **Classification:** FALSE POSITIVE. Gitleaks' generic-api-key entropy heuristic matched a hyphenated descriptive noun-phrase in a wave process deliverable. No secret was committed; no rotation required. This was a scanner-tuning gap, not a leak.
- **Resolution:** commit `6eb62e4` folded the `process/.*` path into the singular `[allowlist].paths` array (the sibling `[[allowlists]]` array-of-tables form of cycle 1 was silently ignored by gitleaks config parse). Local gitleaks 8.24.3 confirmed zero leaks on both full-history and `main..HEAD` scans; the UUID FP remained suppressed. CI run `28532913181` reproduces the clean result — secret-scan green in 11s.

## Fix-up cycle 2 — gitleaks singular-allowlist fold (commit 6eb62e4, devops-engineer) — VERIFIED

devops-engineer folded `process/.*` into the singular `[allowlist].paths` array. Root cause of cycle 1's ineffectiveness (a document-root `[[allowlists]]` array-of-tables is NOT gitleaks' recognized global-allowlist key — only the singular `[allowlist]` table is honored) is fully addressed. Verified locally (full-history + `main..HEAD`, zero leaks) AND in CI (run `28532913181`, secret-scan success).

## Verdict

**MERGED.** PR #41 squash-merged to `main` with `--delete-branch --auto`; mergeStateStatus was CLEAN, mergeable=MERGEABLE at merge time. All 7 required checks green on HEAD `6eb62e4`. No merge over a red check occurred at any point — the gate held across two fix-up cycles until secret-scan genuinely passed. Merge commit `8996230d417ea60d14830ead458a1afdbc90af3b`.

## Local main

Synced. `git -c rebase.autostash=true pull --rebase` fast-forwarded local `main` 2182380 → 8996230 (= merge commit). Autostash cleanly reapplied the two brain-vendored working-tree files (claudomat-brain/VERSION, stage-v13-handoff.md); they remain uncommitted per handoff instruction — NOT committed.

---
```yaml
ci_stage_verdict: PASS
verdict_source: gh
pr_number: 41
pr_url: https://github.com/arina477/test_claudomot/pull/41
pr_head_sha: 6eb62e434d6ec4591d6e5f2a25fe6f602ef03c3e
final_run_id: 28532913181
prior_run_ids:
  - 28532301006  # HEAD 45bee74 — secret-scan FAILURE
  - 28532557839  # HEAD 99e0cf3 — secret-scan FAILURE (cycle 1 ineffective)
required_checks:
  test: success
  typecheck: success
  lint: success
  build: success
  boot-probe: success
  e2e: success
  secret-scan: success
secret_scan_resolution: false-positive-resolved
secret_scan_finding_file: process/waves/wave-28/blocks/B/gate-verdict.md:26
secret_scan_finding_fingerprint: 45bee74d3997e1cff86ec5a46641d793607d1098:process/waves/wave-28/blocks/B/gate-verdict.md:generic-api-key:26
fix_up_cycles: 2
fix_up_cycle_1:
  commit: 99e0cf33092399ad114c4552ac55e91d0d6639b3
  author: devops-engineer
  change: added process/** allowlist to .gitleaks.toml
  outcome: INEFFECTIVE — authored as sibling [[allowlists]] array-of-tables; gitleaks honors only the singular [allowlist] table, so the process/** path allowlist was silently ignored. Same finding reproduced.
fix_up_cycle_2:
  commit: 6eb62e434d6ec4591d6e5f2a25fe6f602ef03c3e
  author: devops-engineer
  change: folded process/.* into the singular [allowlist].paths array
  outcome: VERIFIED — local gitleaks 8.24.3 zero leaks on full-history + main..HEAD (UUID FP still suppressed); CI run 28532913181 secret-scan success in 11s.
routed_to: devops-engineer (ci-config)
merge_commit_sha: 8996230d417ea60d14830ead458a1afdbc90af3b
main_synced: true
main_synced_to: 8996230d417ea60d14830ead458a1afdbc90af3b
mergeable: MERGEABLE
merge_state_status: CLEAN
pr_state: MERGED
branch_deleted: true
head_signoff: APPROVED
```
