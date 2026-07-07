# T-3 — Contract (wave-69) [Pattern A — CI-verified]
API surface added: POST /reports, GET /servers/:serverId/reports?status, POST /servers/:serverId/reports/:reportId/resolve. Shared Zod contracts (CreateReportSchema/ReportSchema/ResolveReportSchema) are the single source consumed by BOTH api (validation) + web (api client) — repo-wide typecheck (CI) proves server↔client contract alignment (no drift). CreateReportSchema.superRefine enforces target-type⇒required-id. Status query validated (ReportStatus.safeParse→400).
Coverage: contract shape verified by typecheck + unit + the T-4 integration tier (real request/response). No OpenAPI/SDK codegen in this project (typed shared package IS the contract).
```yaml
mask_mode_signoff: PASS
test_pattern: ci-verified
evidence: ["repo typecheck (run 28832468543) proves shared Zod ↔ api/web consumer alignment", "CreateReportSchema.superRefine cross-field rule"]
findings: []
```
