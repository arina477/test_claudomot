# Wave 47 — P-3 Plan

## Approach
- **GET /dm/candidates (new).** Read-only aggregate: the DISTINCT set of users who are members of ANY server the caller belongs to (server co-members), minus the caller, minus who_can_dm='nobody', joined to users for displayName/avatar. **Chosen over** reusing GET /servers/:id/members per-server + client-side union (rejected: N round-trips, client dedup, still server-gated — doesn't fix the entry point) and over a global directory (rejected: founder-reserved stranger-DM risk). Single query: `server_members sm2 WHERE sm2.server_id IN (SELECT server_id FROM server_members WHERE user_id=$caller) AND sm2.user_id != $caller`, join users, filter who_can_dm != 'nobody', distinct on user_id. Failure domain: read-only, no writes; blast radius = one new GET.
- **Picker rewire + id-space fix.** StartDmPicker candidate source: getServerMembers(serverId) → getDmCandidates(); DmHome drops the serverId prop/gate; currentUserId sourced from the true users.id (not profile.username). No schema, no new UI surface (reuses design/direct-messages.html picker + states).

## Data model / API / deps
- Data: NO schema change (read-only over server_members + users).
- API: `GET /dm/candidates` → `DmCandidate[]` {userId, displayName, avatarUrl?} (shared DmCandidateSchema).
- Deps: none. SDK: N/A.

## File-level steps
**B-1 Contracts:** packages/shared/src/dm.ts (+index) — DmCandidateSchema — **typescript-pro**.
**B-2 Backend:** apps/api/src/dm/dm.service.ts (getDmCandidates) + dm.controller.ts (GET /dm/candidates) + dm.service.spec.ts (co-members union, self-exclude, who_can_dm='nobody' exclude, dedup across servers, empty) — **node-specialist**.
**B-3 Frontend:** apps/web/src/auth/api.ts (getDmCandidates) + apps/web/src/shell/StartDmPicker.tsx (source→dm/candidates, remove serverId prop, empty-state copy) + apps/web/src/shell/DmHome.tsx (remove serverId gate; currentUserId = true users.id) + apps/web/src/shell/useDm.ts (F7 optimistic author if the id-space fix needs a touch there) + dm.test.tsx (startable flow, self-exclusion, optimistic-author-not-Unknown) — **react-specialist**.
**B-4/B-5:** repo typecheck; biome 0; unit+integration (dm candidates service ↔ DB); dev/live smoke of the startable flow.

## Specialist routing (AGENTS.md-validated): typescript-pro, node-specialist, react-specialist ✓.
## Parallelization: B-1 contracts → B-2 backend ∥ (after contracts) → B-3 frontend after B-2 (consumes /dm/candidates). No D-block (design_gap_flag=false).

## Self-consistency: every AC → step (10967558 → B-1/B-2/B-3; 379978a4 → B-3); specialists assigned; no dep; design_gap_flag=false referenced. Clean.

```yaml
p_stage_verdict: COMPLETE
design_gap_flag: false
specialists: [typescript-pro, node-specialist, react-specialist]
schema_change: false
new_deps: 0
next: P-4
