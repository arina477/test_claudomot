# P-4 Phase 2 — jenny spec-drift verification (wave-6, CI boot-probe)

**Verdict: APPROVE**

Single-spec wave. Task `da242f6b`. Spec verified against the wave-5 L-2 lesson, the P-3 plan, `_library.md` DevOps/CI sections, and the live repo. The spec faithfully and minimally implements the L-2 follow-up with no drift and no gold-plating.

## Verification table (MATCHES / DRIFTS)

| Check | Result | Evidence |
|---|---|---|
| Spec implements the L-2 lesson (pre-merge boot of COMPILED artifact + /health probe, closes the recurring compiled-dist prod-boot class) | **MATCHES** | L-2 (`_archive/wave-5/stages/L-2-distill.md:31,44`) recorded obs-1 as REAL (verified `version.ts` MODULE_NOT_FOUND at compiled boot) and queued `da242f6b` to "close the recurring compiled-dist-boot outage class at the pipeline level." Spec AC-1 boots `node apps/api/dist/src/main.js` (the exact prod entrypoint — confirmed `apps/api/package.json:9` `"start": "node dist/src/main.js"`) and asserts /health 200. |
| Closes the gap BUILD rule 1 leaves open at the pipeline level | **MATCHES** | L-2:32 — BUILD rule 1 ("boot prod artifact before merge") exists as a principle but karen rejected promoting a CI sibling rule as a duplicate; the disciplined resolution was a *task* that enforces the principle in the pipeline, not a new principle. Spec body says exactly this ("BUILD rule 1 exists as a principle; this enforces it in the pipeline"). The current `ci.yml` is source-only at the gate (lint/typecheck/test/build) + an `e2e` job against a static deployed URL — structurally cannot catch a fresh compiled boot crash. Confirmed: `version.ts` is still the try-both-paths fix; a regression there would only surface at compiled boot, which nothing pre-merge currently exercises. |
| Scope is exactly one CI job (+ optional wait-for-health script); no app code change | **MATCHES** | `contracts.api: ["no code change to the app; a CI job + optional wait-for-health script"]`; P-3 Files line: ".github/workflows/ci.yml (+ maybe a small script). No app code." No M2 or unrelated-CI bleed. |
| "Required check" AC matches intent (boot crash blocks merge) | **MATCHES** | AC-4 makes `boot-probe` a required status check via branch protection. Verified current required contexts are exactly `[lint, typecheck, test, build, secret-scan]` (gh branch-protection query) — the 5 the plan says to mirror; adding `boot-probe` as the 6th is consistent and is the whole point of the lesson. |
| No gold-plating (no node matrix, no full prod-parity harness) | **MATCHES** | edge-cases explicitly resist harness creep ("don't over-build"; "prefer `node dist`… docker+HEALTHCHECK only if it better matches prod"). Single vehicle, single node version (`.nvmrc`), bounded poll. Aligns with ceo-reviewer's resist-harness-creep note. |
| Single-spec, `design_gap_flag: false` (CI-only) | **MATCHES** | CI/infra-only wave, no UI surface. Correct. |
| Boot env list is realistic (app actually boots to /health 200 without external services) | **MATCHES** | `/health` (`apps/api/src/health/health.controller.ts`) returns a static `{status,service,version}` with no DB call — boot reaches it without a live DB. `initSuperTokens` (`supertokens.config.ts:26`) sets `connectionURI` from env with a localhost default and registers config (lazy connect, not eager) — a dummy/unreachable URI does not crash module-load. `main.ts` boot reads only `WEB_ORIGIN`/`API_ORIGIN`/`PORT`, all with safe fallbacks. The spec's throwaway-PG + dummy-ST env list is sufficient and matches the real bootstrap. |

## Notes

- **Gemini lazy-init-brittleness concern — confirmed a documented scope boundary, not drift.** The probe targets boot / module-load (the wave-5-class failure). Full SuperTokens connectivity is correctly out of scope (that lives at deploy/e2e). The spec's edge-cases section already states the dummy `SUPERTOKENS_CONNECTION_URI` is acceptable precisely because ST connects lazily — verified true against `supertokens.config.ts`. No action needed.
- **No CLAUDE.md / project.yaml / principles conflict.** The spec respects BUILD rule 1 (enforces, does not duplicate it) and the L-2 disciplined "promote zero, queue a task instead" outcome. Technical-default (CI shape) is applied silently per always-on rule 17 — no founder poll warranted.

## Recommendations
None blocking. At B-block, the implementer should (per P-3 self-consistency note) inspect `main.ts` boot env before locking the env list — already done here and confirmed minimal. Suggest the deliberately-broken-boot sanity check (P-3 Verify line) be retained as evidence the probe actually fails on a crash, so the required check is not green-by-omission.

```yaml
jenny_verdict: APPROVE
spec_id: wave-6-ci-boot-probe
task_id: da242f6b-bce7-49c7-a7cc-69ca4849fc6e
drifts_found: 0
gold_plating_found: 0
scope_creep_found: 0
checks_matched: 7
checks_drifted: 0
```
