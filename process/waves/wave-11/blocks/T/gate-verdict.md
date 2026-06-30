# Wave 11 — T-block gate verdict (T-9 Journey)

**Block:** T · **Wave topic:** verified prod test fixture (ops / test-infra, no app code) · **Gate:** T-9 · **Judged proportionately** (tiny ops wave)

## Phase 1 — gate verdict

```yaml
head_signoff:
  verdict: APPROVED
  stage: T-9
  reviewers:
    self: head-tester (proportionate, direct-verified)
  failed_checks: []
  rationale: >
    Ops/test-infra wave that provisioned a persistent verified prod test fixture
    (studyhall-e2e-fixture, user-id 21984eb2) and closed the 4-wave authed-verification
    gap. No app code, UI, contract, or perf surface changed, so T-2/T-3/T-6/T-7 skips are
    sound. The load-bearing layers hold: T-4 the fixture is VERIFIED LIVE by a real
    user-observable outcome (signin -> POST /servers -> 201 ownerId=21984eb2 on a
    verified-claim-gated privileged route, with the unauthed 401 boundary asserted) — this
    is real delivery proof, not an echo; T-1/T-5 CI green on PR#22. T-8 (load-bearing,
    secrets) is sound: test-accounts.md is gitignored AND untracked (verified directly),
    the operator script reads the SuperTokens API key at runtime from Railway service vars
    (no hardcoded credential, verified directly), and the gitleaks finding was correctly
    adjudicated a false positive (a SuperTokens user_id is a DB record UUID, not a
    credential) and handled with a triple-constrained scoped .gitleaks.toml allowlist
    (exact commit ab6ce69 + path project.yaml + literal UUID) with useDefault=true —
    configured, not bypassed (no --no-verify, no workflow edit, no history rewrite).
    Post-merge CI on main (run 28411140907) is success; the two earlier PR-run failures
    confirm the scanner genuinely fails on the finding, so the narrow allowlist does real
    work rather than blanket-silencing. Proportionate to a no-app-code wave.
  next_action: PROCEED_TO_V
```

### Layer dispositions
| Layer | Verdict | Basis |
|---|---|---|
| T-1 static | PASS | CI lint/typecheck green (PR#22). |
| T-2 unit | SKIP-OK | No app code changed. |
| T-3 contract | SKIP-OK | No shared schema / contract change. |
| T-4 integration | PASS | Fixture VERIFIED live against prod api: signin -> POST /servers -> 201 (ownerId=21984eb2); unauthed -> 401 boundary. User-observable outcome on a privileged, verified-claim-gated route — real delivery, not self-echo. |
| T-5 e2e | PASS | CI playwright green (PR#22; web unchanged). |
| T-6 layout | SKIP-OK | No UI surface. |
| T-7 perf | SKIP-OK | No runtime/bundle change. |
| T-8 security | PASS (load-bearing) | Verified directly: test-accounts.md gitignored + untracked; script reads ST API key at runtime (no committed secret); gitleaks false-positive (user_id != credential) handled via triple-constrained scoped allowlist, useDefault=true — scanner configured not bypassed; secret-scan green on main. |
| T-9 journey | APPROVED | No new user-facing route/screen/flow — see Phase 2. |

### Direct-verification evidence (load-bearing checks re-run by this gate, not inferred)
- `.gitleaks.toml`: `[extend] useDefault = true` retained; `[allowlist]` triple-constrained — `commits=[ab6ce69…]`, `paths=['project\.yaml']`, `regexes=['21984eb2-…']`. Cannot match any other commit/file/value; no rule disabled. Narrow, not blanket.
- `git check-ignore command-center/testing/test-accounts.md` -> IGNORED-OK; `git ls-files` -> not tracked.
- `apps/api/scripts/re-verify-fixture.sh`: reads `ST_API_KEY` via Railway CLI at runtime (lines 37–48); no hardcoded credential.
- `gh run list` main: run 28411140907 (push to main) conclusion `success` — secret-scan passes on main. Earlier PR runs 28410747924 / 28410885828 `failure` — scanner genuinely catches the finding (mutation-sanity: the allowlist is load-bearing, not silencing).
- Merge commit 57927b1 confirmed on main.

## Phase 2 — journey regeneration

```yaml
journey_regen_skipped: true
journey_regen_skip_reason: >
  Test-infra wave only — provisions a persistent verified prod test fixture and an
  operator re-verification script. No new user-facing route, screen, or flow was added,
  removed, or changed (no apps/web/** or new apps/api/src/** endpoint). The canonical
  user-journey-map.md inventory is unaffected, so regeneration is a no-op. Per T-9, the
  skip is recorded with reason rather than silently omitted.
```

## Carry-forward to L (Learn) — CI-verification lesson candidate
- **Observation:** at C-1, `gh run watch --exit-status` returned 0 while secret-scan had actually FAILED (the last-streamed job was e2e); the failure was caught only via the authoritative `gh pr checks` (exit 1) + run conclusion `failure`. Merge was correctly withheld.
- **Angle check:** this is adjacent to but NOT identical to the existing CI-PRINCIPLES deploy-verification rule (authoritative state endpoint over /healthz for *deploys*). The new angle is *CI-check verification specifically*: **trust `gh pr checks` / run conclusion as authoritative, not `gh run watch` exit code, which can false-green when the streamed job is not the failing one.** Recommend L evaluate as a potential new CI-PRINCIPLES rule (binary, recurring across CI waves, costly-if-ignored = a false-green merge). Subject to L's ≤1-promotion-per-wave bar and Karen verification — flagged, not promoted here.
- Secondary (already-known, no new rule): a forward working-tree edit cannot clear a history-range gitleaks scan; the gitleaks-native remediation for a confirmed false positive is a scoped allowlist, never history rewrite or `--no-verify`.
```
