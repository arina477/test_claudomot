# Wave 28 — T-8 Security

**Pattern B (active-execution).** THE key layer for this wave. Auto-promoted to `auth` for T-8 purposes: the wave touches an authorization boundary (owner-ONLY credential rotation) though wave_type is single-spec/backend. Live probes run against deployed prod `https://api-production-b93e.up.railway.app` (deployment 48c515e9 SUCCESS, merge 8996230).

**applicable_probes:** [auth_smoke (authz boundary), csrf/state-change (SameSite), secret_grep]. Session-lifecycle + rate-limit probes not applicable (no new session code; no-rate-limit is a documented decision — see below).

## Action 1 — Auth / authorization boundary (LIVE, full matrix)

Drove the REAL owner-vs-non-owner authorization matrix against prod using the two persistent verified prod fixtures (co-members of proof server `ad62cd12`): fixture A = OWNER (`studyhall-e2e-fixture`, userId 21984eb2...), fixture B = NON-owner member (`studyhall-e2e-fixture-b`, userId da74148e...). This is a genuine load-bearing verification (T-8 principle rule #1: authz core needs a real verified session, not just a 401 probe), NOT reliance on the integration tier alone.

| Probe | Expected | LIVE result | Verdict |
|---|---|---|---|
| Unauthenticated `POST /servers/:id/invite-code/rotate` | 401 | **401** (AuthGuard) — re-confirms C-2 | PASS |
| Authenticated NON-owner member (fixture B) rotate | 403 | **403** `{"message":"Not authorized to rotate this server's invite code","error":"Forbidden","statusCode":403}` | PASS — owner-ONLY authz proven with a real verified non-owner session |
| Authenticated OWNER (fixture A) rotate | 2xx + `{invite_code}` new != old | **201**, `PGrHRTlwNuPz_xLYhe2cRg` != old `DfXqa4F7nVJCqge9_uY5pA`, base64url 22-char | PASS (status is 201 not 200 — see finding F28-T8a) |
| AC2 old-link invalidation: old code preview | 200 -> 404 after rotate | **200 (pre) -> 404 (post)** — leaked link genuinely dead | PASS |
| AC2 old-link join | dead | **401** (auth gate before resolve; code no longer stored) | PASS |
| AC3 new-link admits: new code preview | 200 | **200** | PASS |

## Action 2 — CSRF / origin (SameSite defense)
State-changing POST is session-cookie-authed (SuperTokens, `SameSite=Lax` per product-decisions #10). No token-based CSRF surface added; the rotate route inherits the app-wide AuthGuard + SameSite cookie model. Header-mode bearer flow (used for these probes) is origin-independent by design. No new CSRF exposure.

## Action 3 — CSPRNG unpredictability (LIVE)
5 consecutive owner rotations against prod produced 5 distinct 22-char base64url codes with no sequential/monotone/predictable pattern:
`MZg8ktY9F0KhoksJFzBd6w`, `O--Fa1dLyqfnodU12mAF7w`, `VpoocmyR-bQne3e5LEgxxA`, `4IndSuFi49AeklbnjymXzw`, `8Ue5vK3qEKRE_21_xdQJow`.
Source: `generateCode() = randomBytes(16).toString('base64url')` (~128-bit CSPRNG, node:crypto) — reused from createInvite. Not a counter, not enumerable. Unpredictability confirmed at the live layer.

## Action 4 — Rate limit (documented decision, not a gap)
No rate-limit on the rotate endpoint. This is a DOCUMENTED decision (P-2 spec keep-OUT line 34: "no-rate-limit is a documented decision not an omission"; P-2 keep-OUT line 31 lists rate-limiting as demand-gated gold-plating). At self-use-MVP / 0 prod servers, owner-gated rotation has no abuse surface. NOT flagged as a gap.

## Action 5 — Secret / credential leak grep (ALWAYS runs)
`git show 8996230 -- apps/**/*.ts *.env*` grepped for api-key/secret/password/bearer -> **0 matches**. gitleaks (secret-scan, blocking) also green at C-1 (run 28532913181, after the process/** allowlist false-positive was resolved in the singular [allowlist] table). `secret_grep_findings: []`.

## Action 6 — Triage
No critical/high. Two LOW findings (F28-T8a spec-vs-impl 201-vs-200; F28-T8b 403-vs-404 existence oracle, B-6 accepted-debt) -> V-2 (findings-aggregate). No wave revert; no B-block re-entry.

## Deliverable
```yaml
test_pattern: active
skipped: false
auto_promoted: true                    # backend wave touching auth boundary (owner-ONLY authz)
applicable_probes: [auth_smoke, csrf, secret_grep]
auth_smoke:
  positive: ["owner A rotate -> 201 {invite_code} new!=old base64url"]
  negative: ["unauth -> 401", "non-owner member B -> 403 (owner-ONLY authz LIVE)"]
csrf_results: ["session-cookie + SameSite=Lax model inherited; no new CSRF surface"]
session_results: null                  # no new session code
rate_limit_results: ["none — documented decision (P-2 keep-OUT L31/L34), not a gap"]
secret_grep_findings: []
csprng_live: ["5 consecutive rotations distinct 22-char base64url, no pattern — randomBytes(16) CSPRNG"]
old_link_invalidation_live: ["old preview 200->404, old join 401 after rotate — leaked link dead (AC2)"]
fix_up_cycles: 0
findings:
  - {severity: LOW, category: spec-vs-impl, description: "AC1 says 200; live returns 201 (NestJS @Post default); body correct", remediation: "loosen AC to 2xx or add @HttpCode(200)", id: F28-T8a}
  - {severity: LOW, category: authz-oracle, description: "403-vs-404 existence oracle (non-owner 403 reveals server exists); B-6 accepted-debt, spec-conformant AC4", remediation: "none — matches findServerDetail precedent, non-secret UUIDs", id: F28-T8b}
```
