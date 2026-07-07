# Wave 76 — T-4 Integration

**Pattern:** B (Active — live probe + APP_DB ground-truth). Fires: service.

## Aggregate correctness — live API vs APP_DB ground truth
Server: "Fixture Proof Server" ad62cd12 (rich data).

| Metric | Live API | APP_DB ground truth | Verdict |
|---|---|---|---|
| memberCount | 2 | 2 | MATCH |
| messageVolume | 482 | 482 non-deleted (757 incl-deleted) | MATCH — **soft-delete excluded** (275 deleted msgs correctly dropped) |
| assignmentCount | 2 | 2 non-deleted (7 incl-deleted) | MATCH — **soft-delete excluded** (5 deleted asgmts correctly dropped) |
| submissionCount | 2 | 2 (over non-deleted assignments) | MATCH |
| session_scheduled | 24 | 24 non-deleted | MATCH |
| roleBreakdown | Member=0, No role=2 | 0 / 2 | MATCH — reconciles to memberCount |

Soft-delete exclusion is proven live at the DB level for messages and assignments; submissions correctly scoped to non-deleted parent assignments.

## Empty-server → zero aggregates (200, not error)
Empty school-tier server 7a2f57c5 (owner-only, 0 msgs/asgmts): live → **200** with `memberCount:1, messageVolume:0, assignmentCount:0, submissionRollup:{0,0}, recentActivity all 0`. Zero-valued aggregates, not an error. ✓

## 404-vs-403 disposition (head-builder flag)
**Unknown serverId → 403 (not spec's 404).** Root cause (code-verified, deterministic):
- `EntitlementGuard` runs before `EducatorAccessGuard`. `EntitlementsService.resolveForServer(unknownId)` finds no subscription row → `?? 'free'` → `educatorAdminTools:false` → **403 thrown at EntitlementGuard**, before the guard that would resolve existence.
- Even if it reached `EducatorAccessGuard`, `RbacService.can` returns false (default-deny) for a non-existent server (rbac.service.ts:62).
- **Disposition: ACCEPTABLE (deny-is-deny, no existence enumeration).** Both /analytics and /status spec-text says 404 for unknown server, but the composed guard stack returns 403 uniformly. This is a **spec deviation but a SECURITY-POSITIVE one**: it prevents unauthenticated/unauthorized server-existence enumeration via status-code differentiation. Surfaced as a LOW finding (spec-vs-impl doc drift), not a defect — the 403 is the safer behavior and matches the primary spec block 682e0912's own AC ("a caller who is not a member of the server → 403").

```yaml
test_pattern: active
evidence:
  - "live analytics counts match APP_DB ground truth exactly (member/message/assignment/submission/session/role)"
  - "soft-delete exclusion proven: messageVolume 482 (not 757), assignmentCount 2 (not 7)"
  - "empty school server → zero aggregates 200"
  - "unknown serverId → 403 (EntitlementGuard free-default), not 404 — deny-is-deny, acceptable"
findings:
  - {severity: low, location: "educator-tools endpoints /analytics + /status", description: "Spec text says unknown serverId → 404; live composed guard returns 403 uniformly (EntitlementGuard free-default + RbacService.can default-deny). Security-positive (no existence enumeration); recommend reconciling spec text to 403. Non-blocking."}
```
