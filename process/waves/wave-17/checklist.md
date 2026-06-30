# Wave 17 stage completion

> Seeded by wave-16 N-3. Active milestone: M3 — Real-time messaging (`6198650e-f4e0-44dc-9b0a-6550f01f9f82`, in_progress).
> Seed task: `25523fb0-edef-46e4-928b-55e78495d181` — Add a real-Postgres mid-transaction-failure rollback test for create-server.
> Bundled siblings: none (single-task bundle).
> claimed_task_ids (B-0 claims this batch; L-2 closes it): [25523fb0-edef-46e4-928b-55e78495d181]
> Slice: real-PG (or in-process-PG) integration test forcing a mid-transaction failure in create-server; asserts no orphan server/category/channel/membership rows persist (carry from wave-7 V-3 + T-9/Karen significant). P-0 should stand up the real-PG / in-process-PG test harness this wave — it is self-contained (does not require 02fa8011 built first) and the harness it establishes is reusable by 02fa8011 later.
> Pending ritual outcomes affecting P-0:
>   - M3 feature scope NOT yet shipped — thread replies (thread_parent_id) + file/image attachments. Once M3 top-level seedable todos reach 0, a future N-1 Action 7 fires milestone-decomposition for the next M3 feature bundle.
>   - STALE-CLAIM cleanup candidates (P-0 to consider re-parent/re-decompose into seedable rows): 02fa8011 (Real-PG integration test tier, wave-14), 6a546c7b (presence perf, wave-14), d23a0740 (presence code-debt, wave-14), c18b8089 (mention parity + edit-diff txn, wave-15) — all status=todo but carry a closed wave's wave_id so the N-2 seed query cannot pick them. 02fa8011 is a 2-wave carry (14+15 V-2 lineage); a 3rd recurrence should escalate per V-3.
>   - Unassigned queue (2): 67881a58 (Playwright MCP bundled-chromium reconfig), 4e994e96 (biome lint-warning cleanup) — P-0 walks the unassigned queue and assigns what it can.

PRODUCT:
- [x] P-0 Frame (discover + reframe)
- [x] P-1 Decompose
- [x] P-2 Spec
- [x] P-3 Plan
- [x] P-4 Gate

DESIGN (skip block if non-UI wave):
- [ ] D-1 Brief
- [ ] D-2 Variants (with bounded iteration)
- [ ] D-3 Review & adopt

BUILD:
- [ ] B-0 Branch & schema
- [x] B-1 Contracts (SKIP)
- [x] B-2 Backend (SKIP)
- [x] B-3 (integration test)
- [x] B-4 Wiring
- [x] B-5 Verify
- [ ] B-6 Review

CI/CD:
- [ ] C-1 PR, CI & merge
- [ ] C-2 Deploy & verify
- [ ] C-3 Canary

TEST:
- [ ] T-1 Static
- [ ] T-2 Unit
- [ ] T-3 Contract
- [ ] T-4 Integration
- [ ] T-5 E2E
- [ ] T-6 Layout
- [ ] T-7 Perf
- [ ] T-8 Security
- [ ] T-9 Journey

VERIFY:
- [ ] V-1 Independent reviews (Karen + jenny, parallel)
- [ ] V-2 Triage
- [ ] V-3 Fast-fix loop (or close)

LEARN:
- [ ] L-1 Docs
- [ ] L-2 Distill

NEXT:
- [ ] N-1 Survey & triggers
- [ ] N-2 Seed
- [ ] N-3 Handoff
