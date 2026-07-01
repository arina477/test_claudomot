# Wave 29 — T-3 Contract (SKIPPED)

**Skip reason:** No contract-test surface CHANGED. Part 2 DELETED an unused shared schema (`ServerMembersResponseSchema` + `ServerMembersResponse` type + barrel re-export) with ZERO source consumers (grep `ServerMembersResponse` across apps/ + packages/ → 0 hits). The `GET /servers/:id/members` endpoint wire is UNCHANGED — it returns bare `ServerMember[]` (confirmed: `listServerMembers(): Promise<ServerMember[]>` in servers.controller.ts), and `ServerMemberSchema` itself is untouched. Deleting dead code does not introduce or change any consumer-facing API/SDK/Zod contract. AC4 (deletion + green typecheck) and AC5 (bare-array wire unchanged) are covered at T-1 (typecheck) + T-2 (return-shape), not T-3.

```yaml
test_pattern: n/a
skipped: true
skip_reason: "No new/changed API/SDK/Zod contract; part 2 is a dead-code deletion (0 consumers), members wire unchanged (bare ServerMember[])."
findings: []
```
