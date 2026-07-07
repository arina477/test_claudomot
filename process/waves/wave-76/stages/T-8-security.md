# Wave 76 — T-8 Security

**Pattern:** B (Active — live authz probes against prod, BUILD-4 reproduce). Fires: authz crown jewel.
Composed authz: AuthGuard + EntitlementGuard(educatorAdminTools) + EducatorAccessGuard (owner OR manage_assignments via RbacService.can, default-deny).

## 1. Owner/educator gate — NO IDOR (crown jewel)
**Fixture B** (studyhall-e2e-fixture-b, da74148e) — a VERIFIED, NON-owner, member of the school-tier Proof Server with a NULL role (no manage_assignments) — calling both endpoints:
- GET /status → **403** body `{"message":"Educator access required for this server","error":"Forbidden"}`
- GET /analytics → **403** same EducatorAccessGuard message

The 403 body is the **EducatorAccessGuard** message (educator-access.guard.ts:65), NOT an email-verification claim — proving the denial is at the AUTHZ core, not the auth layer. **This is the exact wave-75 T8-F1 leak scenario (authed member passing on the tier gate alone) — now CLOSED.** userId comes only from the verified session (no IDOR: no way to pass a foreign userId).

Positive control: Fixture B temporarily granted a manage_assignments role → both endpoints **200** (educator path works); reverted to NULL role immediately. Owner (Fixture A) → **200** on both.

## 2. Entitlement gate — free tier → 403
Owner (Fixture A) on a FREE-tier server → **403** on both /status and /analytics (educatorAdminTools=false at EntitlementGuard). Even the owner is denied when the tier does not unlock the feature. ✓

## 3. AuthGuard — unauthenticated → 401
No session cookie → **401** on both /status and /analytics. ✓

## 4. Data-safety — no PII / raw content
Live /analytics response keys: memberCount, roleBreakdown{roleId,roleName,memberCount}, messageVolume, assignmentCount, submissionRollup{assignmentCount,submissionCount}, recentActivity{type,count}. Scan for content/email/author_id/username/user_id/message-text: **0 hits — counts and rollups ONLY**. roleId/roleName are role metadata (owner/educator already see these in-product), no per-user PII. ✓

## 5. Malformed :serverId → 400 (T-8 principle #2)
Non-UUID :serverId on the authed path → **400**, not 500. ✓

## Full authz matrix (live, prod)
| Caller | Tier | Result | Guard |
|---|---|---|---|
| Owner (A) | school | 200 | pass all |
| Educator (B, manage_assignments) | school | 200 | pass all |
| Member non-owner/non-educator (B, NULL role) | school | 403 | EducatorAccessGuard |
| Owner (A) | free | 403 | EntitlementGuard |
| Unauthenticated | any | 401 | AuthGuard |
| Any | unknown server | 403 | EntitlementGuard free-default |
| Any | malformed :id | 400 | Zod/param validation |

```yaml
test_pattern: active
evidence:
  - "no-IDOR: verified non-owner/non-educator member (Fixture B) on school tier → 403 w/ EducatorAccessGuard message (NOT email-verif) — wave-75 T8-F1 leak CLOSED"
  - "educator positive: Fixture B w/ manage_assignments → 200 (reverted)"
  - "entitlement: owner on free tier → 403 both endpoints"
  - "auth: unauthenticated → 401 both endpoints"
  - "data-safety: /analytics response is counts/rollups only, 0 PII/content hits"
  - "malformed :serverId → 400 not 500"
findings: []
