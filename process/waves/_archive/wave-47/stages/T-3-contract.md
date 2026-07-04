# Wave 47 — T-3 Contract

**Block:** T · **Stage:** T-3 · **Pattern:** B (active — live api) · **Mode:** automatic
**Target:** GET /dm/candidates on live api https://api-production-b93e.up.railway.app (merge 4db10675)

## Contract under test — DmCandidateSchema (packages/shared/src/dm.ts)
Bare `DmCandidate[]`, each `{ userId: string, displayName: string, avatarUrl: string|null }`.
(Deliberately NOT wrapped — mirrors GET /servers/:id/members convention, per schema comment.)

## Executed probes (fixture A, header-mode session)
| case | expected | result |
|---|---|---|
| GET /dm/candidates unauthenticated | 401 | **401** PASS |
| GET /dm/candidates authed (fixture A) | 200 bare array | **200**, `[{...}]` PASS |
| response shape vs DmCandidateSchema | exactly {userId,displayName,avatarUrl}, correct types | **PASS** — all rows exact-key match, userId/displayName non-empty strings, avatarUrl null (A-view) AND non-null URL string (B-view) both observed → nullable branch exercised both ways |
| response is bare array (not wrapped) | top-level JSON array | **PASS** |

Positive AND negative (401) contract cases present. Nullable avatarUrl proven on both branches (A→B row avatarUrl=null; B→A row avatarUrl=real URL).

```yaml
mask_mode_signoff: PASS
test_pattern: active
evidence:
  - "curl unauth GET /dm/candidates → 401"
  - "curl authed (fixture A bearer) GET /dm/candidates → 200 bare DmCandidate[]; python schema-validate exact-key match"
  - "avatarUrl nullable both branches: A-view row null, B-view row real URL string"
findings: []
