# Wave 22 — B-2 Backend
```yaml
files: [assignments/{service,controller,module}.ts + 2 specs, app.module.ts]
authz: "assertOrganizer(userId,serverId) = SINGLE rbac can(userId,serverId,'manage_channels') call site (G3; owner passes via superuser; manage_assignments follow-on = 1-line swap). All organizer ops route through it. Member routes = server-membership. /assignments/:id derive serverId from the assignment ROW (rule-4 IDOR-safe)."
attachment: "validateAndHeadAttachment(key) → FilesService.headAttachment server-derives size+type BEFORE the assignment_attachments INSERT (createAssignment + updateAssignment); >10MB→413, disallowed→400 (wave-19 anti-spoof, karen carry 1)"
soft_delete: "softDeleteAssignment sets is_deleted=true; does NOT DELETE assignment_status (karen carry 2 — CASCADE is hard-delete only); listAssignments WHERE is_deleted=false HIDES it + its status. Tested: mockDelete never called."
status: "toggleStatus ON CONFLICT(assignment_id,user_id) DO UPDATE state; one-per-member; isolation (A's upsert targets (assignment,user_A), can't touch user_B)"
routes: ["POST /servers/:serverId/assignments (organizer)", "GET /servers/:serverId/assignments (member, due-sorted +myStatus)", "GET /assignments/:id (member)", "PATCH /assignments/:id (organizer)", "DELETE /assignments/:id (organizer soft-delete)", "PUT /assignments/:id/status (member toggle)", "+ attachment presign/confirm (organizer)"]
tests: "379 pass (+33: rule-4 non-organizer-403 x3 + non-member-403, status-isolation, soft-delete-hides-not-removes, headAttachment-before-insert, upsert-one-per-member); typecheck+shared-build+biome clean"
```
