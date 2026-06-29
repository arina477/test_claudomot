# N-2 — Seed (wave-9 → wave-10 bundle)

> head-next gate pending below. Bundle = RBAC seed + 3 siblings under M2.

## Action 1 — Pick the seed
Seed = `35f191f4-2b63-4c8b-bf7e-a5c074310ec6` — "Build RbacModule: roles table, RbacService.can(), role CRUD + assignment". `parent_task_id IS NULL`, `wave_id IS NULL`, `status='todo'`, `milestone_id=M2`. Oldest top-level todo authored for the unshipped RBAC scope slice (the 4 tech-debt rows are NOT feature seeds — RBAC is the BOARD-bound wave-10 seed).

## Action 2 — Load siblings
- `2c927c44-0b29-485d-9640-33401624b973` — Channel-level permission overrides + ChannelPermissionGuard
- `7a10f13d-413f-46a2-a006-f60c0ab529f2` — Owner-lockout safeguard: last-owner invariant
- `0b9bcf35-a6f1-40df-9da3-e9135307b900` — Role-management UI in server settings

All 3: `parent_task_id = 35f191f4` (seed), `status='todo'`, `wave_id IS NULL`.

## Action 3 — Validate the bundle (DB-confirmed)
All 4 rows: `status=todo`, `wave_id IS NULL`, `milestone_id=41e61975-c92e-49b1-9ae5-45498dd04925`. Seed `parent_task_id IS NULL`; siblings `parent_task_id = seed.id`. Validation PASS.

## Dependency sequencing (B-block consumes; flat bundle, no DAG metadata)
seed (RbacModule + roles table + RbacService.can() + role assignment) is the sole hard prerequisite → channel-permission (2c927c44, needs can()) + owner-lockout (7a10f13d, needs role-assignment paths) in parallel → role-management UI (0b9bcf35, consumes seed + both API siblings) last. No sibling defines a contract against an unbuilt later sibling.

## Carry-forward to wave-10 (from wave-9 L obs-3)
**Verified-prod-fixture task 4a2ad286 is escalation-critical for wave-10 B-block.** Wave-10 is the 3rd consecutive authed-feature wave without a verified prod fixture for live C-2/T-8 verification — and RBAC's authed permission paths NEED live verification. Wave-10 should prioritize establishing the fixture (or pull 4a2ad286 into the wave). NOT bundled into the RBAC seed (it is tech-debt, not an RBAC sibling); rides into the N-3 handoff note.

## Security flag (downstream)
RBAC is authz-critical. Authorization must be re-derived server-side via RbacService.can() (never client-supplied role/permission trust); owner-lockout invariant must be race-safe. Flags T-8 Security + P-4 security-scope-tightened gate. Naming reconciliation for P-2: M2 scope prose says `channel_permission_overrides`; _library.md names the RbacModule table `permissions` (UNIQUE(channel_id, role_id)) — same semantics, P-2 picks canonical name.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed task id: 35f191f4-2b63-4c8b-bf7e-a5c074310ec6"
  - "bundled siblings: 3"
  - "validation: pass"
seed_task_id: 35f191f4-2b63-4c8b-bf7e-a5c074310ec6
seed_task_title: "Build RbacModule: roles table, RbacService.can(), role CRUD + assignment"
bundled_sibling_ids:
  - 2c927c44-0b29-485d-9640-33401624b973
  - 7a10f13d-413f-46a2-a006-f60c0ab529f2
  - 0b9bcf35-a6f1-40df-9da3-e9135307b900
claimed_task_ids:
  - 35f191f4-2b63-4c8b-bf7e-a5c074310ec6
  - 2c927c44-0b29-485d-9640-33401624b973
  - 7a10f13d-413f-46a2-a006-f60c0ab529f2
  - 0b9bcf35-a6f1-40df-9da3-e9135307b900
active_milestone_id: 41e61975-c92e-49b1-9ae5-45498dd04925
queue_exhausted: false
validation_failed: false
note: "Verified-prod-fixture 4a2ad286 carried to wave-10 as B-block escalation-critical (not bundled into RBAC seed)."
```

---

```yaml
head_signoff:
  verdict: APPROVED
  stage: N-2
  reviewers: {}
  failed_checks: []
  rationale: >
    Gated against live DB (not the pasted validation). Re-ran N-2 Action 3 directly:
    all 4 rows confirmed status=todo, wave_id IS NULL, milestone_id=41e61975-c92e-49b1-9ae5-45498dd04925
    (M2, confirmed in_progress). Seed 35f191f4 has parent_task_id IS NULL; all 3 siblings carry
    parent_task_id = 35f191f4 (self-FK shape correct); zero grandchildren under any sibling
    (flat one-level bundle, no illegal nesting). Provenance: bundle authored by the milestone-decomposer
    ritual fired inline at N-1 Action 7/10 (commit 73791d8, decision-logged), NOT hand-INSERTed.
    WIP limit respected — one seed + 3 tightly-scoped siblings; sequencing is acyclic
    (seed → channel-perm 2c927c44 + owner-lockout 7a10f13d in parallel → role-UI 0b9bcf35 last),
    no sibling contracts against an unbuilt later sibling. RBAC scope match verified incl the
    owner-lockout last-owner-invariant safeguard sibling. Seed-selection decision is correct and
    contractually mandated: 5 top-level todo/unassigned candidates exist under M2 (the 4 tech-debt
    rows 46f16288/4a2ad286/25523fb0/d058283d are also parent_task_id-NULL seed candidates), but
    wave-9 checklist binding condition #3 makes RBAC the unconditional wave-10 seed and bars the
    tech-debt rows from preempting it; the decomposer correctly left those 4 untouched
    (not re-parented, not closed, not modified — DB-confirmed). claimed_task_ids = [35f191f4,
    2c927c44, 7a10f13d, 0b9bcf35] matches the array B-0 claims and L-2 closes. 4a2ad286 carry-forward
    to wave-10 B-block is noted for the N-3 handoff. All N-2 stage-exit checkboxes ticked.
  next_action: PROCEED_TO_N-3
```
