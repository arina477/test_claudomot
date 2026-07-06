# B-1 — Contracts (wave-69)
Specialist: typescript-pro. Shared Zod contracts for the reports feature in `packages/shared`.

## Authored (`packages/shared/src/reports.ts` + index export)
- z.enum value domains: `ReportTargetType` (server|member|message), `ReportStatus` (open|resolved|dismissed), `ResolveReportAction` (timeout|delete_message|dismiss) + inferred types.
- `CreateReportSchema` (POST /reports body): target_type, target_server_id?(uuid), target_user_id?(string), target_message_id?(uuid), reason(min1 max1000 trim) + `.superRefine` cross-field rule (member⇒target_user_id, message⇒target_message_id, server⇒target_server_id). `CreateReport` type.
- `ReportSchema` (entity DTO, snake_case mirroring the DB row — so B-2 can return the raw Drizzle row with minimal mapping): id/reporter_id/target_type/target_server_id/target_user_id?/target_message_id?/reason/status/created_at/resolved_at?/resolved_by?. `Report` type.
- `ResolveReportSchema`: { action: ResolveReportAction }. `ResolveReport` type.

## Verify
- `pnpm --filter @studyhall/shared typecheck` exit 0 (isolated — consumer breakage in api/web is expected, written B-2/B-3). biome clean.

## Deviations (adjudicated — accepted)
1. Enum value+type share a name → barrel omits redundant `export type` for the 3 enums (value export carries the type); matches sibling modules. OK.
2. ReportSchema uses snake_case field names per spec ("mirror the DB row"); sibling RESPONSE DTOs are camelCase, but snake_case here means B-2 returns the raw row with less mapping (DB columns are snake_case). Consistent with wave-68 UpdateServerSchema snake_case is_public. OK.
3. target_user_id/reporter_id are z.string() not .uuid() (text user ids from SuperTokens, matching DB text FK + rbac.ts userId:z.string()). OK.
(Note: agent said "Clerk" — StudyHall uses SuperTokens; cosmetic mischaracterization, immaterial.)

```yaml
skipped: false
contracts_authored: [packages/shared/src/reports.ts, packages/shared/src/index.ts]
sdk_regenerated: false
fast_path_approved: false
deviations: [enum-export-style, snake_case-entity-DTO, text-user-id]
```
