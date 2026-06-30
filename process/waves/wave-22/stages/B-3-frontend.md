# Wave 22 — B-3 Frontend
```yaml
files: [DESIGN-SYSTEM.md (--danger-text #f87171 promoted), styles/globals.css (--color-danger-text + .status-toggle), auth/api.ts (8 assignment calls), shell/{AssignmentCard.tsx (getUrgency+chip), AssignmentForm.tsx, AssignmentsPanel.tsx, ServerContext.tsx, ChannelSidebar.tsx (Workspace entry), MainColumn.tsx}, assignments.test.tsx]
danger_text_promotion: "added --danger-text #f87171 to DESIGN-SYSTEM §1 (6.30:1 vs --danger 3.93:1) + wired --color-danger-text in globals.css (Tailwind v4 @theme)"
chip_logic: "getUrgency(dueDate,isDone,now): overdue (dueAt<now → #f87171/--danger-text NOT #ef4444); dueSoon (0≤dueAt-now<48h → amber #f59e0b ph-clock); normal (≥48h → no chip muted Due:); isDone overrides → done (card-done modifier). Pure exported fn."
toggle: "real <input type=checkbox data-testid=status-toggle> + label; wrapper stopPropagation (no modal open); optimistic + revert on PUT fail"
organizer_form: "isOrganizer = myUserId===ownerId (client owner-only); New-Assignment CTA + empty-CTA only when organizer; SERVER always enforces can(manage_channels) 403"
verify: "web typecheck+build clean (no CJS, type-only shared); biome 0; 215 web tests (+21: getUrgency x7, chip-states x5, toggle x4, panel x5)"
deviations: ["organizer client-gate owner-only (ServerMember lacks roleId; no /me/roles API) — a non-owner manage_channels organizer doesn't see the client CTA but the server accepts their POST. Server-correct; client UX gap → V-2."]
```
