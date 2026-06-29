# Wave 6 — P-4 Verdict

**Reviewer:** head-product (fresh spawn)
**Reviewed against:** process/waves/wave-6/blocks/P/review-artifacts.md
**Attempt:** 1  (1 = first gate)
**Phase:** 1 (head-product)

## Verdict
APPROVED

## Rationale
This single-spec wave adds one pre-merge CI job that boots the compiled production
entrypoint (`node apps/api/dist/src/main.js`) against a throwaway Postgres plus dummy
env, polls `/health` until 200 on a bounded timeout, and fails the build on a boot
crash — closing the 4×-recurring "CI-green-but-crashes-at-prod-first-boot" class
(wave-5 version.ts MODULE_NOT_FOUND, wave-2 init-order, wave-3 shared-pkg) that
source-level lint/typecheck/test/build and the deployed-URL e2e job structurally
cannot catch. The load-bearing boot-envelope risk the problem-framer flagged is
verified RESOLVED against the real code: (1) `/health` is an unauth, `@SkipThrottle`
static route whose only nontrivial call is `API_VERSION`, computed once at module-load
— precisely the crash surface the probe must exercise; (2) the DB pool is lazy
(`apps/api/src/db/index.ts` defers `new Pool` to first property access), so a throwaway
PG is provided for connect-time coverage but `/health` needs no live query; (3)
critically, `supertokens.init()` in `auth/supertokens.config.ts` only *registers* config
and assembles the recipe list at bootstrap — it opens NO socket to the SuperTokens core,
which connects lazily on first SDK call, and `/health` invokes no SDK function. Therefore
a dummy `SUPERTOKENS_CONNECTION_URI` does NOT crash boot: a good build reaches `/health`
200 (no false-fail) and the probe genuinely boots the compiled artifact (no false-pass).
The envelope is sound; the plan's `node dist` vehicle matches prod parity exactly
(`apps/api/package.json` start + Dockerfile CMD both `node dist/src/main.js`); scope is
held to one job with no node matrix / smoke suite / prod-parity harness (not gold-plated);
`design_gap_flag=false` is correct (CI-config only); and the single-spec sub-floor override
is justified (no mergeable siblings — other M1 items are founder-blocked, high-leverage
safety net traceable to the live bet via M1 foundation reliability). Build-ready.

## Stage-exit checklist (Phase 1)
- [x] P-0 Frame: root-cause fix at the CI layer (not symptom-chasing individual MODULE_NOT_FOUND bugs); maps to live bet + M1 milestone (5a6efc9e); falsifiable signal (job fails on broken boot, passes on `/health` 200); problem-framer + ceo-reviewer verdicts present and reconciled (both PROCEED).
- [x] P-1 Decompose: single seed, no siblings; floor-override reasoned (no mergeable partner, founder-blocked siblings); no dependency on unbuilt out-of-bundle task.
- [x] P-2 Spec: ACs enumerated and independently verifiable; boot/timeout/crash states specified; non-goals implied via HOLD-SCOPE (no matrix/harness); spec contract embedded as fenced YAML head of task da242f6b description.
- [x] P-3 Plan: reuses the existing `test` job's postgres-service pattern (no parallel mechanism); introduces no MVP-excess infra; each plan step maps to an AC and produces an observable CI artifact.
- [x] Load-bearing boot-envelope claim verified against main.ts + supertokens.config.ts + db/index.ts + health.controller.ts (see Rationale).
- [x] Security-scope note: this wave adds NO auth/session/cookie/rate-limit surface — it only *exercises* the existing boot path with dummy env. The tightened security gate does not apply (no new sensitive surface); the existing auth code is unchanged.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 2

---
## Phase 2 — Karen + jenny + Gemini — PASS
- **Karen APPROVE** — all source claims VERIFIED vs live: prod entrypoint = `node dist/src/main.js` (package.json:9 + Dockerfile:23); supertokens.init registers config + connects lazily (no boot crash on dummy URI); /health unauth + only API_VERSION (the wave-5 crash surface); db pool lazy; main.ts bootstrap().catch→exit(1); ci.yml test job has postgres:16 to mirror; devops-engineer cataloged. No gold-plating. BUILD NOTE: include PORT (main.ts:123) in the boot env.
- **jenny APPROVE** — 7/7 MATCH; faithful to the wave-5 L-2 follow-up (enforce BUILD rule 1 at pipeline level); scope exactly one CI job, no app code, no creep; boot-probe as the 6th required check matches intent; no gold-plating.
- **Gemini CONCERN (non-material)** — dummy-URI relies on lazy-init (brittle if SDK later eager-connects); documented scope boundary (probe = boot/module-load class; full ST-connectivity = deploy/e2e), future-upgrade risk, not a defect.
GATE: PASS → B-block. CARRY: include PORT + DATABASE_URL(throwaway PG) + dummy SUPERTOKENS_CONNECTION_URI in the boot env; make boot-probe a required branch-protection check.
