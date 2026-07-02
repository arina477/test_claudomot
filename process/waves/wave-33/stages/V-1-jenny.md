# V-1 — jenny (spec-conformance review, wave-33)

**Wave:** 33 (M6 hardening — malformed non-UUID route param → 400 before DB, project-wide)
**Task:** `a2dd9f3d-1b93-4dfc-a6a8-5afded4a3354`
**Spec source:** DB `tasks.description` YAML head (spec-id `wave-33-spec`, 7 ACs).
**Under test:** DEPLOYED PROD `api-production-b93e` — merge `e1a64f6` (squash of the wave-33 fix PR #46), confirmed ancestor of `HEAD`; T-8 target deployment `d69feba2`.
**Shipped diff (`e1a64f6`, apps/api):** `auth/auth.exception.filter.ts` (+28), `auth/pg-error-utils.ts` (+48), `auth/auth.exception.filter.spec.ts` (+226), `test/integration/malformed-uuid-params.spec.ts` (+251). No other production source touched.
**Mandate:** deployed behavior ↔ spec INTENT. Distinguish spec-DRIFT (code wrong) vs spec-GAP (spec wrong). Not source-claim truth (karen). No fixes.

## Method

- Read authoritative spec from the DB row (7 ACs + edge-cases + keep-out).
- Read the shipped filter + helper source at `e1a64f6` (mechanism verification).
- Corroborated deployed behavior from T-8's live prod matrix (`process/waves/wave-33/stages/T-8-security.md`, 10-row matrix, two verified fixtures, revision `d69feba2`).
- Own independent live spot-probe against prod `api-production-b93e` for the auth-boundary ACs I can reach without a fixture (unauth paths).

## AC-by-AC (intent match)

| AC | Intent | Deployed evidence | Verdict |
|----|--------|-------------------|---------|
| **AC1** | authed + malformed UUID → **400 not 500**, no row read/returned, no leak; cast fails at execution before row access | T-8 row 1a: `GET /channels/not-a-uuid/voice/participants` → 400 `{"statusCode":400,"message":"Bad Request"}`. Filter maps PG `22P02` (invalid_text_representation) → `BadRequestException` — the cast fails during the parameterised WHERE, so no row is accessed. Clean-body leak-grep (stack/SQL/SQLSTATE/driver/table) = zero matches. | **MATCH** |
| **AC2** | voice participants malformed → 400 (F-32-T-8-1 instance) | T-8 row 1a live PASS (same as AC1). | **MATCH** |
| **AC3** | `POST /channels/:id/voice/token` malformed → 400 (wave-31 twin) | T-8 row 1b: state-changing POST → 400, same clean body. | **MATCH** |
| **AC4** *(load-bearing "root cause not patch")* | ≥1 NON-voice authed UUID-param route → 400 | T-8 rows 2a `GET /servers/not-a-uuid/members` → 400 AND 2b `GET /channels/not-a-uuid/messages` → 400. **Two** distinct non-voice controllers, not one. Mechanism is a single global `@Catch()` filter over all ~30 UUID params across 7 controllers — structurally project-wide, not a 2-route patch. | **MATCH (exceeds — 2 routes)** |
| **AC5** | clean generic 400 body, no stack/DB/driver/internal leak | Full body `{"statusCode":400,"message":"Bad Request"}`; T-8 leak-grep zero matches. Filter emits a hard-coded generic body — never echoes the caught error. | **MATCH** |
| **AC6** | valid-UUID behavior UNCHANGED (200/401/403/404/503/domain-400 all preserved) | T-8 rows 3b (non-member valid → 403), 3c (member valid + creds-unset → 503, not 400), 3d (member valid TEXT channel → existing domain-400 with **distinct** body "Participants can only be listed for voice channels"), E1 (valid nonexistent → 403 byte-identical). Two distinct 400 paths confirmed byte-distinct: new malformed-format-400 vs existing domain-400. Filter forwards any `HttpException` BEFORE the 22P02 branch (a `DrizzleQueryError` is never an `HttpException` — branches provably non-overlapping), so no valid-UUID path is altered. No regression on wave-31/32 voice contracts. | **MATCH** |
| **AC7** | unauth + malformed → 401 (guard-first); malformed handling never downgrades/leaks auth state | T-8 row 3a: unauth voice route → 401. **My own live prod spot-probe:** `GET /channels/not-a-uuid/voice/participants` (unauth) → 401 `{"message":"unauthorised"}` AND `GET /servers/not-a-uuid/members` (unauth) → 401 — confirmed on both a voice and a non-voice route. Filter code: `AuthGuard` runs before the controller/DB query; SuperTokens' own errorHandler sends 401 (`headersSent=true`, caught first) — the 22P02 branch can only fire after auth succeeds. | **MATCH (independently re-verified live)** |

## keep-OUT conformance (bounded, no scope creep)

- **ONE mechanism, not a 30-param sweep:** shipped diff = a single global `@Catch()` filter branch + one shared helper (`isInvalidTextRepresentation`, walks ≤2 `.cause` levels for SQLSTATE `22P02`, mirrors the existing `isUniqueViolation`). Zero `ParseUUIDPipe` additions, zero per-route pipes. **CONFORMS.**
- **No broad error-normalization / envelope refactor:** the 22P02 branch is inserted AFTER `HttpException`-forward and BEFORE the generic-500 fallthrough — a single narrow branch. All other error paths (HttpException-forward, generic-500, SuperTokens headersSent-guard) are unchanged. **CONFORMS — no envelope refactor.**
- **No fuzz battery / all-routes E2E:** shipped tests = 18 unit (filter spec) + 10 targeted real-DB integration cases. Targeted regression only. **CONFORMS.**
- Diff is ~76 production LOC across 2 files — inside the P-3 ~40-80 LOC envelope.

## Spec-gap detection (did deployed behavior reveal anything the spec didn't anticipate?)

None material. Two observations, both non-blocking and NOT drift:

1. **AC1 "amended wording" is honest.** The spec's amended AC1 says the malformed cast "fails at query execution before any row access" — this is architecturally accurate for the shipped mechanism: it is NOT a pre-DB format-reject (no `ParseUUIDPipe`); the query is issued, Postgres rejects the cast (`22P02`), and the filter maps the resulting error to 400. No row is read because the cast fails during predicate evaluation. The spec correctly describes execution-time rejection, not pre-query rejection. No gap.
2. **AC4 over-satisfied** (2 non-voice routes vs the spec's "at least one"). Strengthens the root-cause claim; not a gap.

## Journey-map fidelity (F-32-T-8-1-RESOLVED note)

`command-center/artifacts/user-journey-map.md` — the wave-33 annotation is accurate:
- Line 224 (page-10 pre-join): "Malformed-UUID robustness (wave-33, LIVE): a non-UUID `channelId` on this authed path now returns **400** (was 500) via the project-wide `22P02`→`BadRequestException` global filter."
- Line 226 (access-control note): F-32-T-8-1 "**RESOLVED (wave-33, verified LIVE)**" — describes the global-filter root cause (NOT a per-route `ParseUUIDPipe` sweep), proven live on voice AND non-voice routes, auth boundary (401 guard-first / uniform-403 / 503 creds-guard) unchanged.

Both notes match what shipped (mechanism, scope, and preserved-boundary claims all correct). **FIDELITY CONFIRMED.**

## Verdict

```yaml
verdict: APPROVE
stage: V-1
reviewer: jenny
spec_id: wave-33-spec
task_id: a2dd9f3d-1b93-4dfc-a6a8-5afded4a3354
deployed_under_test: {api: api-production-b93e, merge: e1a64f6, t8_deployment: d69feba2}
acs_evaluated: 7
acs_match: 7
drift_found: []          # no code-wrong-vs-spec instances
gap_found: []            # no spec-wrong instances; AC1 amended wording is accurate
keep_out_conformance: PASS   # one bounded global-filter mechanism; no 30-param sweep; no envelope refactor; targeted tests only
independent_live_probe:
  - {route: "GET /channels/not-a-uuid/voice/participants (unauth)", observed: 401, ac: AC7, verdict: MATCH}
  - {route: "GET /servers/not-a-uuid/members (unauth)", observed: 401, ac: AC7, verdict: MATCH}
journey_map_fidelity: CONFIRMED
rationale: >
  Deployed behavior matches spec INTENT on all 7 ACs. The malformed-UUID→500 is now
  →400 project-wide via a single bounded global 22P02→BadRequestException filter (root
  cause, not a per-route patch) — AC4 proven on TWO non-voice routes, exceeding the
  "at least one" bar. The auth boundary is provably untouched: the 22P02 branch runs
  only after AuthGuard succeeds and after HttpException-forward, so 401 guard-first,
  uniform-403 enumeration gate, 503 creds-guard, and the existing domain-400 all survive
  byte-identical (AC6). I independently re-verified AC7 live on prod (unauth+malformed →
  401 on both voice and non-voice). The 400 body is a clean generic envelope with a
  zero-match leak-grep (AC5). keep-OUT fully honored — one mechanism, ~76 LOC, no
  ParseUUIDPipe sweep, no error-envelope refactor, targeted tests only. No spec-drift, no
  spec-gap; the AC1 amended "fails at query execution" wording is architecturally accurate
  for the shipped execution-time-reject mechanism. Journey-map F-32-T-8-1-RESOLVED
  annotation matches what shipped.
next_action: PROCEED (karen runs source-claim-truth in parallel; head-verifier gates at V-3)
```
