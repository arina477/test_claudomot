# V-2 Triage — wave-67
Inputs: T-block findings (2) + Karen (memberCount WRONG claim) + jenny (memberCount spec-drift, role_id spec-gap). Both APPROVE.
Classification:
- **F67-T5-1 memberCount:0 — BLOCKING→V-3 FAST-FIX.** Spec-drift (jenny): spec A AC says memberCount=COUNT(server_members) but deployed returns 0 for every server (T-5 DB-cross-checked; Karen confirmed WRONG claim). Root cause: the correlated scalar subquery in discoverServers (servers.service.ts:550-554) is textually correct but returns 0 at runtime (Drizzle correlation/binding issue). Bounded single-file backend query fix → V-3 fast-fix candidate (<20 LOC est; likely switch to LEFT JOIN + groupBy or fix the sql correlation). Real user-visible correctness bug (every card shows 0 members). Fix in-wave + re-deploy api.
- **F67-T5-2 role_id:NULL — NON-BLOCKING** → task dc4abee3 (unassigned, RBAC intent). PRE-EXISTING parity (joinViaInvite core also inserts NULL role_id — jenny confirmed, not a wave-67 regression). Cross-cutting membership/RBAC investigation; not this wave's fix.
- **Coverage-gap note (Karen+jenny) → L-2:** the api unit test mocks memberCount, so it passed while the real SQL returns 0 — mocked-DB unit tests miss real-query bugs; the live T-5 probe caught it. L-2 observation candidate.
```yaml
findings_input_count: 2
findings_blocking: [{id: F67-T5-1, source: T-5/Karen/jenny, summary: "discover memberCount:0 (spec-drift, broken correlated subquery)", fast_fix_candidate: true}]
findings_non_blocking: [{id: F67-T5-2, source: T-5/jenny, summary: "join-public role_id NULL (pre-existing parity)", task_id: dc4abee3-1e41-41aa-a76b-c65a6b38e457, milestone_id: null}]
findings_noise: []
fast_fix_queue: [F67-T5-1]
b_block_re_entry_required: []
