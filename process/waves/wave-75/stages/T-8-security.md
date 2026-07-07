# Wave 75 — T-8 Security

**Pattern B — Active-execution against LIVE prod.** wave_type includes `auth` (payments) → fires. The crown-jewel stage: reproduces the negative paths (BUILD-4) live. Fixtures A (owner) + B (studyhall-e2e-fixture-b) via SuperTokens header-mode signin. Applicable probes: auth_smoke (AuthGuard), csrf/authz (owner-check + IDOR), secret_grep (always).

## Probe 1 — Owner-check / no-IDOR (the core BUILD-4 negative)
Fixture B attempts to change the tier of a server Fixture A owns (0c8192da, then at tier=school):

| Step | Result |
|---|---|
| tier BEFORE B's attempt (read via owner A) | **school** |
| B POST /billing/tier {targetTier:"free"} on A's server | **403** `{"message":"Not authorized to change this server plan"}` |
| tier AFTER B's 403 (read via owner A) | **STILL school** — UNMODIFIED |

**PASS — no-IDOR proven side-effect-free** (test-principle #28: asserted the target row is UNMODIFIED after the 403, not merely that the status was 403). Owner-check runs 404→403→mutate; B never reaches the write.
- Also: B GET /billing/plan on A's server (B is not a member) → **403** ("Not a member of this server"). ✓

## Probe 2 — Educator-tools entitlement gate (fail-closed → unlock)
| Step | Result |
|---|---|
| GET /educator-tools/status on a FREE server (as owner A) | **403** `{"message":"This feature requires a plan with 'educatorAdminTools' enabled"}` |
| upgrade the server → school (POST tier) | 200, entitlements {512000,100,educatorAdminTools:true} |
| GET /educator-tools/status on the SCHOOL server | **200** `{"enabled":true}` |

**PASS — fail-closed → unlock proven end-to-end** (free 403 → school 200). The EntitlementGuard defaults closed (declared flag always fails-closed; only a no-metadata route is pass-through).

## Probe 3 — AuthGuard (verification-REQUIRED — P-4 SessionNoVerifyGuard hole closed)
| Probe | Result |
|---|---|
| Unauthenticated POST /billing/tier | **401** |
| Unauthenticated GET /billing/plan | **401** |
| Unauthenticated GET /educator-tools/status | **401** (AuthGuard fires BEFORE EntitlementGuard — 401 before 403, guard-stacking order correct) |
| Malformed bearer token POST /billing/tier | **401** (not 500 — robust) |
| Malformed bearer token GET /educator-tools/status | **401** |

**PASS — the P-4-caught SessionNoVerifyGuard hole is truly closed live.** All three endpoints use the verification-REQUIRED `AuthGuard` (confirmed in source: billing.controller.ts + educator-tools.controller.ts both `@UseGuards(AuthGuard[, EntitlementGuard])`). 401 precedes 403 (no route-existence leak via 403-before-401).

## Probe 4 — Non-regression: create-server still works (free maxServersPerOwner non-restrictive)
Fixture A (owner of 646+ servers) POST /servers {name:"..."} → **201** (created 0c8192da + 37a55026). free.maxServersPerOwner=100_000 >> 646 → gate non-restrictive. **PASS** — the wave-74 free-cap regression is NOT reintroduced.

## Probe 5 — Secret / credential-leak grep (always runs)
`git diff 3b94e276^..3b94e276 -- '*.ts' '*.tsx' '*.env*' | grep -iE 'api[_-]?key|secret|token|password|bearer ...'` → the only matches are code COMMENTS about the `BILLING_PROVIDER` DI token + the "test checkout, no charge" disclosure copy. **ZERO real credential strings.** secret_grep_findings: [] (required-empty for APPROVED). C-1 secret-scan (gitleaks) also passed.

## Observation — educator-tools status readable by any authenticated non-member (design note, not a mutation IDOR)
Probed: Fixture B (authenticated, NOT a member of A's school server) GET /educator-tools/status → **200 {enabled:true}**. This is BY DESIGN: EntitlementGuard gates purely on the server's resolved tier, and the educator-tools controller composes only `AuthGuard + EntitlementGuard` (NO owner/member check — documented in entitlement.guard.ts: "does NOT perform an owner/member check"). So any authenticated user can read the boolean *status* of any server whose tier unlocks the flag. It is NOT a mutation IDOR (no write, no PII) and leaks only "this server is on a school-tier plan." Surfaced to V-2 as a **medium** finding to weigh: the real educator tools (fenced) MUST add an owner/member check before exposing any server-scoped data; the status endpoint's current behavior is acceptable for a boolean-only stub but should not be the template for the real tools. Guard's design comment already flags "compose with an owner/member check separately when the endpoint requires one" — the follow-up slice must honor that.

## Triage
- Probe 1-4: all PASS, no fix-up needed. Fix-up cycles: 0.
- No critical (auth bypass / session hijack / secret leak) findings. One medium design-note (educator-tools membership) → V-2.

## Findings
- **T8-F1 (medium)** — GET /educator-tools/status has no owner/member check (composes only AuthGuard + EntitlementGuard); any authenticated user reads the boolean status of any tier-unlocked server. Not a mutation IDOR / no PII (boolean-only stub), but the fenced real educator tools MUST add an owner/member gate before exposing server data. V-2 to weigh.

```yaml
test_pattern: active
skipped: false
auto_promoted: false
applicable_probes: [auth_smoke, csrf, secret_grep]
auth_smoke:
  positive: ["Fixture A + Fixture B signin OK (header mode)"]
  negative: ["unauth POST/GET tier → 401", "unauth educator-tools → 401", "malformed bearer → 401 (not 500)"]
csrf_results:
  - "owner-check no-IDOR: Fixture B POST tier on A's server → 403, tier UNMODIFIED (still school) — side-effect-free per test-principle #28"
  - "B GET plan on A's server (non-member) → 403"
  - "educator-tools gate: FREE → 403 fail-closed; SCHOOL → 200 unlock (end-to-end)"
  - "AuthGuard verification-required: unauth → 401 on all 3 endpoints; 401 precedes 403 (guard stacking correct)"
  - "non-regression: Fixture A (646 servers) create-server → 201 (free maxServersPerOwner non-restrictive)"
session_results: null
rate_limit_results: null
secret_grep_findings: []
fix_up_cycles: 0
findings:
  - {severity: medium, category: authz, description: "GET /educator-tools/status lacks owner/member check (AuthGuard+EntitlementGuard only); any authed user reads boolean tier-status of any server; not a mutation IDOR / no PII; fenced real educator tools MUST add member gate", remediation: "add owner/member check to the real educator-tools endpoints when the fenced slice ships"}
```
