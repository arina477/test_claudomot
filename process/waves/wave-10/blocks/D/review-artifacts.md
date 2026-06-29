# Wave 10 — D-block review artifacts

**Block:** D (Design)
**Wave topic:** M2 RBAC — Roles management UI in server settings (roles CRUD, fixed permission flags, per-channel visibility per role, member→role assignment, owner-lockout surfacing)
**Block exit gate:** D-3
**Status:** gate-passed

```yaml
design_block_status:    complete
gaps_resolved:          [roles-management-ui]
gaps_deferred:          []
design_system_updates:  []
canonicalized_at:       2026-06-29T21:55:00Z
canonical_paths:        [design/server-roles.html]
gate_verdict:           APPROVED  # head-designer fresh spawn agentId a4f6652814a19bbd6
```

## Stage deliverables

| Stage | Deliverable file(s) | Status | Notes |
|---|---|---|---|
| D-1 | process/waves/wave-10/stages/D-1-brief/roles-management-ui-brief.md | done | single gap; existing server-settings.html Roles tab is a SPEC VIOLATION (implements forbidden permission-matrix) → must be replaced |
| D-2 | process/waves/wave-10/stages/D-2-variants/roles-management-ui-{variants,iterate}.md | done | /aidesigner gen + 2 token/a11y/states refines; staging committed; token-clean (9 system hex); 4 fixed flags; channel-visibility list; single-role selects |
| D-3 | process/waves/wave-10/stages/D-3-review-and-adopt/roles-management-ui-{plan-design-review,ui-ux-pro-max,accessibility,reconciliation,adopt}.md + blocks/D/gate-verdict.md | done | dual-reviewer + mandatory a11y audit (PASS); head-designer APPROVED; canonicalized to design/server-roles.html |

## Block-specific context

- **Wave topic:** M2 RBAC role-management UI delta into server settings
- **design_gap_flag:** true (carried from P-1 / spec)
- **Gaps inventoried:** roles-management-ui (1 gap)
- **Gaps deferred to bug-design tag:** none
- **3-cap escalations during block:** none
- **DESIGN-SYSTEM.md token additions proposed:** none (token-clean against existing palette)

## Critical D-1 audit finding

`design/server-settings.html` ALREADY contains a "Roles" tab — but it is STALE / SPEC-VIOLATING:
- It implements a **permission × channel MATRIX** (rows "View & Read" / "Send Messages & Speak" / "Manage Messages" across channel columns).
- The spec (task 35f191f4 + block note + 0b9bcf35) **explicitly forbids a permission matrix / custom-builder** and mandates a **SMALL FIXED set of 4 boolean flags**: `manage_server`, `manage_roles`, `manage_channels`, `manage_members`.
- Architecture was "deliberately thinned at v6b" away from exactly this matrix.
- The existing flag names are also wrong (not the 4 fixed flags).
**Verdict:** existing Roles tab fails the audit → D-2 required to author a spec-compliant replacement.

## Open escalations carried into gate

none

## Gate verdict log

<appended by fresh head-designer spawn at D-3>
