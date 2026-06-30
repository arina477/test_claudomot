## Wave 20 stage completion

**Wave:** 20
**Active milestone:** eb2a1688 — M4 Offline-first reliability (the wedge) [in_progress]
**Seed task:** 92d85e0e-87de-459a-8f84-468ad3bc4135 — Idempotent message-send contract (UNIQUE idempotency_key + replay-safe POST)
**Bundled siblings (3):**
- 7332a4b8-9815-402b-8bac-c6d164039422 — IndexedDB local store foundation (cached reads + outbox table)
- 9a4ab31d-3628-4980-9e43-54c20c6801b2 — Outbox enqueue + optimistic-send integration into the M3 send-path
- e29f6566-60a2-49bd-aa40-90578a77ddf8 — Offline send-path test harness (fake-indexeddb unit + idempotency integration)
**claimed_task_ids:** [92d85e0e, 7332a4b8, 9a4ab31d, e29f6566]

### Pending P-0 inputs carried from wave-19 N-block
- **SDK-research dependency (rule: external-sdk-integration-rules.md):** wave-20 is the picking wave for M4's offline bundle. P-0 MUST frame the IndexedDB-wrapper choice (likely Dexie) + fake-indexeddb test shim as an SDK-research item (SDK-doc at command-center/dev/SDK-Docs/). NO founder credential-ask expected — client-side only, no external service. The bundle does NOT assume Dexie is pre-wired.
- **Unassigned queue + M4 backlog:** P-0 walks the unassigned queue (depth 2) AND should surface the 6 re-homed M3 tech-debt tasks now living under M4 (invite-rotation d058283d, presence-dots 10b9d18e, real-PG test tier 02fa8011, presence-perf 6a546c7b, presence-debt d23a0740, mention-parity c18b8089) — these are independent backlog, NOT part of this wave's authored offline-first bundle.

PRODUCT:
- [x] P-0 Frame
- [x] P-1 Decompose
- [x] P-2 Spec
- [x] P-3 Plan
- [x] P-4 Gate APPROVED

DESIGN (skip block if non-UI wave):
- [ ] D-1 Brief
- [ ] D-2 Variants (with bounded iteration)
- [ ] D-3 Review & adopt

BUILD:
- [ ] B-0 Branch & schema
- [ ] B-1 Contracts
- [ ] B-2 Backend
- [ ] B-3 Frontend
- [ ] B-4 Wiring
- [ ] B-5 Verify
- [ ] B-6 Review

CI/CD:
- [ ] C-1 PR, CI & merge
- [ ] C-2 Deploy & verify (canary armed when real users > 1000)

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
