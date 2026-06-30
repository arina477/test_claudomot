# Wave 22 — T-8 Security (LOAD-BEARING — multi-tenant academic authz RATIFIED)
```yaml
verdict: PASS
ratified:
  - "(a) organizer can(manage_channels) default-deny — assertOrganizer (L60-66) gates create/update/delete/presign; non-organizer → 403 (mockInsert not called). PROVEN."
  - "(b) cross-server attachment-key IDOR FIX — validateAndHeadAttachment anchored ^attachments/<serverId>/[A-Za-z0-9._-]+$ (L117-118) BEFORE head+INSERT; serverId route-derived (create)/existing.server_id row (update), NEVER client. CROSS_SERVER+PATH_TRAVERSAL→400 (head/insert not called); valid→passes. The /review-caught High CLOSED."
  - "(c) per-member status isolation — toggleStatus inserts user_id: SESSION userId (AssignmentStatusSchema has no user_id field); test asserts persisted user_id===MEMBER_ID; A can't set B. PROVEN."
  - "(d) non-member list → 403 (assertMember real server_members lookup). PROVEN."
  - "(e) /assignments/:id IDOR-safe — server_id from the fetched ROW (get/update/delete/toggle), never client param. PROVEN."
  - "H2 NoSuchKey/NotFound→400, infra→5xx. CONFIRMED."
live: "C-2 curl 401 on the assignments route; gitleaks clean at C-1"
```
