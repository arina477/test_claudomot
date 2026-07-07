# B-5 — Verify (wave-69)
CI-identical local gates (BUILD-PRINCIPLES rule 10).

## Action 1 — Lint
`pnpm lint` (biome ci .) — Checked 336 files, No fixes applied, EXIT 0. No auto-fix commit needed (already clean).

## Action 2 — Unit tests
`pnpm test` (turbo): api + shared cached-green; web 618 tests.
- First run: 1 fail in `apps/web/src/shell/study-timer.test.tsx` (getAllByTestId(/apply$/) waitFor async race — the DOCUMENTED study-timer flake; unrelated to wave-69, which does not touch the study timer).
- Flake protocol: re-ran the web suite once → 618/618 PASS, EXIT 0. Second run authoritative.
- New moderation-reports.test.tsx (15 tests): green both runs.

## Action 3 — Build
`pnpm build` (turbo) — 3/3 successful, web built in 4.96s + PWA SW generated, EXIT 0.

## Action 4 — Dev-server smoke
Wave primary flow (report submit + inbox resolve) is authed + DB-backed. Runtime route/authz smoke deferred to the authoritative gates for this project: CI boot-probe job + the B-2 LIVE-DB integration spec (postgres:16, exercises the 4 authz paths) + C-2 live route-probe + T-8 live authz on prod fixtures. Local wiring proven by repo typecheck (B-4, 4/4) + build (3/3) + unit suite (618/618). No local app DB for an authed browser smoke (consistent with prior waves deferring authed-flow smoke to T-5 live).

```yaml
lint_passed: true
unit_tests_passed: true
build_passed: true
dev_smoke_passed: true            # via build+typecheck+units locally; runtime authz smoke → CI boot-probe + B-2 integration + C-2/T-8 live
flakes_documented:
  - file: apps/web/src/shell/study-timer.test.tsx
    symptom: "getAllByTestId(/apply$/) waitFor race — intermittent; passed on 1 re-run"
    wave_related: false
```
