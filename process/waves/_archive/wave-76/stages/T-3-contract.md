# Wave 76 — T-3 Contract

**Pattern:** B (Active — live probe against prod). Fires: new API + DTO.

## Live contract verification (prod api-production-b93e, merge d8d4d9e6)

### GET /servers/:serverId/educator-tools/analytics
Owner (Fixture A) on school-tier server → **200** with body matching `ServerAnalyticsSchema`:
```json
{"memberCount":2,"roleBreakdown":[{"roleId":"a850...","roleName":"Member","memberCount":0},{"roleId":"","roleName":"No role","memberCount":2}],"messageVolume":482,"assignmentCount":2,"submissionRollup":{"assignmentCount":2,"submissionCount":2},"recentActivity":[{"type":"message_sent","count":482},{"type":"assignment_submitted","count":2},{"type":"session_scheduled","count":24}]}
```
All 6 schema fields present with correct types: memberCount (int), roleBreakdown (array of {roleId,roleName,memberCount}), messageVolume (int), assignmentCount (int), submissionRollup ({assignmentCount,submissionCount}), recentActivity (array of {type,count}). Non-negative ints throughout. **Matches ServerAnalyticsSchema.**

### GET /servers/:serverId/educator-tools/status (wave-75 contract PRESERVED)
Owner on school-tier → **200** `{"serverId":"ad62cd12-...","enabled":true}`. Matches `EducatorToolsStatusSchema` ({serverId, enabled}). The wave-75 boolean contract is preserved (not superseded) per spec block ecf79f4a.

## Status codes across the composed authz (contract)
- 200 owner/educator + school (both endpoints) ✓
- 401 unauthenticated (both) ✓
- 403 wrong-tier / non-owner-non-educator (both) ✓
- 400 malformed :serverId (non-UUID) — not 500 ✓ (T-8 principle #2)

```yaml
test_pattern: active
evidence:
  - "live GET /analytics owner+school → 200, body validates against ServerAnalyticsSchema (6 fields, correct types)"
  - "live GET /status owner+school → 200 {serverId, enabled:true} — wave-75 contract preserved"
  - "malformed :serverId → 400 (not 500)"
findings: []
