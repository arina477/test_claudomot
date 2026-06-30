# Wave 18 stage completion

> Seeded by wave-17 N-3. Active milestone: M3 — Real-time messaging (`6198650e-f4e0-44dc-9b0a-6550f01f9f82`, in_progress).
> Seed task: `497c2ae6-844b-4910-9f21-677a536d2dc2` — Implement thread-reply data plane and realtime fan-out.
> Bundled siblings: `6c008dd6-d904-457b-966b-dcafe029a7d6` (thread-view panel + parent thread affordance), `0b728319-bc09-4847-bef5-3b9c2f3a228c` (optimistic-send outbox parity for thread replies).
> claimed_task_ids (B-0 claims this batch; L-2 closes it): [497c2ae6-844b-4910-9f21-677a536d2dc2, 6c008dd6-d904-457b-966b-dcafe029a7d6, 0b728319-bc09-4847-bef5-3b9c2f3a228c]
> Slice: thread replies (the first of M3's two remaining success-metric features). Seed = thread-reply data plane + realtime fan-out over /messaging (thread_parent_id already declared in canonical Postgres `messages` schema + IndexedDB store per _library.md — migration is additive: thread index + reply_count/last_reply_at parent columns). Siblings = thread-view panel UI on server-channel-view (reuse message-row/composer/pending-failed primitives) + optimistic-send outbox parity (F5) so M4 offline builds on the same path.
> Ordering provenance: BOARD `N-1-ordering-wave-17` — 7/7 APPROVE B (feature-first over a 3rd consecutive tech-debt wave; ceo BINDING DRIFT note resolved). Threads-first; attachments deferred to a later M3 wave.
> Pending ritual outcomes affecting P-0:
>   - **Likely a UI wave** (`P → D → B → C → T → V → L → N`): the thread-view panel is a design gap — `design/server-channel-view.html` has no thread-panel markup today (per milestone-decomposer). P-0 should evaluate the D-block trigger.
>   - M3 still needs **file/image attachments** (Railway Buckets, ≤10MB) to close — unshipped, unauthored, deferred to a later wave per the BOARD. After threads ships, a future N-1 Action 7 fires decomposition for the attachments bundle; M3 closes when threads + attachments are both shipped.
>   - Parked M3 tech-debt seed candidates (todo, wave_id NULL — NOT cancelled): d058283d (invite_code rotation — BOARD advisory: re-seed as hard-gate at first pre-launch/external-user wave), 02fa8011 (real-PG integration test tier — partially mitigated by wave-17 harness), 6a546c7b (presence perf — realist: cheaply measurable, could flip to fact), d23a0740 (presence code-debt), c18b8089 (mention parser parity — counter-thinker/risk-officer advisory: a persist-path correctness item M4 inherits; fold in or verify, defer ≤1 more wave).
>   - Unassigned queue (2): P-0 walks the unassigned queue and assigns what it can.

PRODUCT:
- [x] P-0 Frame (discover + reframe)
- [x] P-1 Decompose
- [x] P-2 Spec
- [x] P-3 Plan
- [x] P-4 Gate

DESIGN (skip block if non-UI wave):
- [x] D-1 Brief
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
