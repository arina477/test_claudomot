# Wave 76 — P-2 Spec (pointer)

**Source of truth:** `tasks.description` of primary task **682e0912-30db-495c-984e-34dd046b1504** (YAML head + `---` + prose). Convenience copy.

- **wave_type:** multi-spec (4 blocks)
- **claimed_task_ids:** [682e0912 (seed), ecf79f4a, 80505bb1, d81e266d]
- **design_gap_flag:** true (Educator Admin Console + analytics dashboard → D-block)

## Acceptance criteria (copy for P-3/D/P-4 reference)

### Spec 1 — 682e0912 educator admin API foundation
Composed authz = AuthGuard + EntitlementGuard(educatorAdminTools) + **EducatorAccessGuard (owner OR member with role.manage_assignments)**. 200 owner/educator+school; 401 unauth; 403 wrong-tier or non-owner/non-educator; 404 unknown server. (NOTE-1: educator predicate is manage_assignments capability, NOT a named role.)

### Spec 2 — ecf79f4a close the wave-75 leak
GET /educator-tools/status now composes EducatorAccessGuard → non-owner/non-educator school-tier → 403 (was 200 for any authed user). Boolean {serverId, enabled} contract PRESERVED (NOTE-2: preserve + compose, not supersede — wave-75 tests still pass).

### Spec 3 — 80505bb1 analytics aggregates API
Server-scoped aggregates (member count + role breakdown, message volume, assignment + submission rollups, recent activity) via Drizzle count/group over shipped tables. Same composed authz gate. Counts/rollups only, no raw content/PII. Empty server → zero aggregates 200. Zod DTOs + contract tests.

### Spec 4 — d81e266d Educator Admin Console UI
New console surface visible ONLY to owner/educator on school tier; hidden otherwise (ServerPlanPanel gating idiom, opaque userId per BUILD-13). Renders analytics + loading/empty/forbidden states. Reuses settings-panel/shell DS; layout from D-block. Component + gating tests through the real parent.

**Carried to P-3/D/P-4:** educator predicate = owner OR manage_assignments; /status preserve+compose; analytics read-only-aggregates-no-new-infra; security-scope tightened gate + T-8; design_gap true → D-block authors the console layout.
