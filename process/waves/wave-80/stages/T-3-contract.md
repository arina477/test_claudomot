# T-3 — Contract (wave-80, presence privacy toggle)

**Pattern:** MIXED — Pattern A (CI) for the Zod schema + Pattern B (active live probes) for the PUT/GET boundary on deployed prod.

## Action 1 — Pattern
B-1 authored `packages/shared/src/privacy.ts` (project-internal Zod). CI `test` job green on 4795638 (Pattern A). Additionally ran live active probes (Pattern B) against api-production-b93e because the partial-update no-clobber is the load-bearing contract behavior and deserves a live proof.

## Contract surface (B-1)
- `PrivacySettingsResponseSchema` (GET): showPresence: z.boolean() REQUIRED.
- `UpdatePrivacySchema` (PUT): `.object({profileVisibility, whoCanDm, showPresence}).partial()` — every field OPTIONAL (the B-6 F1 partial fix; send only changed field).

## Action 2/3 — Live probes (fixture A, header-mode SuperTokens session, Bearer st-access-token)

| Probe | Body | Result | Verdict |
|---|---|---|---|
| baseline GET | — | 200 `{everyone,everyone,showPresence:true}` | PASS |
| PARTIAL PUT | `{showPresence:false}` | 200 `{...,showPresence:false}` | PASS |
| GET round-trip | — | 200 showPresence:false | PASS |
| NO-CLOBBER PUT | `{profileVisibility:"server-members"}` | 200 `{server-members, everyone, showPresence:false}` — showPresence UNCHANGED | PASS (F1 fix live) |
| GET after no-clobber | — | 200 showPresence STILL false | PASS |
| invalid boolean | `{showPresence:"yes"}` | 400 `Expected boolean, received string` | PASS |
| empty no-op | `{}` | 200 (no change) | PASS |
| unauth GET | — | 401 | PASS |
| unauth PUT | — | 401 | PASS |
| unknown key | `{bogusField:true}` | **200 (stripped, NOT 400)** | FINDING F-T3-1 (LOW) |

## Action 4 — Coverage
Every B-1 contract field traced to a passing live probe. Negative case (non-boolean → 400) covered. Unauth (401) covered. Partial no-clobber — the wave's highest-risk contract behavior — PROVEN LIVE.

## Finding
- **F-T3-1 (LOW, contract-hygiene):** The schema source comment claims "`.strict()` keeps unknown keys rejected," but the deployed schema is `.object({...}).partial()` WITHOUT `.strict()`. An unknown key (`{bogusField:true}`) is silently STRIPPED and returns 200 instead of 400. NOT a security issue — mass-assignment safe (service maps only the 3 known keys to columns; bogusField never reaches the DB, GET confirms only 3 fields). Documentation/enforcement mismatch only. → V-2.

```yaml
test_pattern: mixed
skipped: false
contracts_audited: [packages/shared/src/privacy.ts (UpdatePrivacySchema partial, PrivacySettingsResponseSchema showPresence)]
ci_evidence: ["C-1 test job CI run 28917150735 green on 4795638"]
active_probe_results:
  - "partial PUT {showPresence:false} → 200, GET round-trips false"
  - "no-clobber: visibility-only PUT preserves showPresence=false (F1 fix live)"
  - "invalid boolean → 400 zod; unauth GET/PUT → 401; empty {} → 200 no-op"
  - "unknown key {bogusField:true} → 200 stripped (NOT 400) — F-T3-1"
infrastructure_gap_recorded: false
findings:
  - {severity: low, contract: "UpdatePrivacySchema .strict()", description: "F-T3-1: unknown keys stripped+200 not rejected+400; comment claims .strict() but schema lacks it. Mass-assignment safe. Doc/enforcement mismatch."}
```
