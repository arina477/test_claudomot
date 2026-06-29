# Wave 9 stage completion

> Seeded by wave-8 N-3. Active milestone: M2 — Servers, channels & membership (`41e61975-c92e-49b1-9ae5-45498dd04925`, in_progress).
> Bundle: M2 invite-completion (production-grade the LIVE invites/join slice). Adopted by BOARD `N-1-seed-priority-wave-9` (5 APPROVE / 1 ABSTAIN / 1 REJECT).
> Seed task: `863c10ef-4f58-4451-9172-d319e751ec07` — Invite-revoke endpoint + UI.
> Bundled siblings:
> - `08ff762f-c4fb-4f80-87f6-e12796a2a485` — 8a: Backfill servers.invite_code for pre-existing rows
> - `5331b7d5-511c-4370-9d86-b6729b60ced5` — 8b: Share modal defaults to permanent invite code
> claimed_task_ids (B-0 claims this batch; L-2 closes it): [863c10ef, 08ff762f, 5331b7d5]
> UI wave (share-modal default + invite-revoke UI) — D-block expected unless P-1 flags otherwise.
>
> BINDING CONDITIONS from the wave-9 seed BOARD decision (P-0/P-3 MUST honor):
> 1. **P-3 must spec the invite_code backfill (08ff762f) as idempotent + collision-safe** against the existing `UNIQUE(servers.invite_code)` constraint: CSPRNG codes, re-runnable, applied via a COMMITTED migration (NOT auto-migrate-on-boot). [risk-officer]
> 2. **Invite-revoke (863c10ef) must surface an honest "this link no longer works" affordance** to a member clicking a revoked link + a path to request re-invite; revoke authorization re-derived server-side, never from client-supplied invite/server id. [user-advocate] — T-8 Security stage applies (invite surface = auth-adjacent).
> 3. **RBAC is wave-10's seed, unconditionally.** M2's success-metric "members see the right channels per role" clause is UNMET. Next-wave (wave-10) N-1 MUST prioritize RBAC decomposition (server_members.role_id + channel-level permissions + channel_permission_overrides + owner-lockout safeguard) over any remaining/new non-RBAC follow-ups. The 3 M2 test/E2E follow-ups (46f16288, 4a2ad286, 25523fb0) remain seed candidates but do NOT preempt RBAC. [strategist + industry-expert + counter-thinker + realist]

PRODUCT:
- [ ] P-0 Frame (discover + reframe)
- [ ] P-1 Decompose
- [ ] P-2 Spec
- [ ] P-3 Plan
- [ ] P-4 Gate

DESIGN (skip block if non-UI wave):
- [x] D-1 Brief
- [x] D-2 Variants (with bounded iteration)
- [x] D-3 Review & adopt

BUILD:
- [ ] B-0 Branch & schema
- [ ] B-1 Contracts
- [ ] B-2 Backend
- [ ] B-3 Frontend
- [ ] B-4 Wiring
- [ ] B-5 Verify
- [ ] B-6 Review

CI/CD:
- [x] C-1 PR, CI & merge (PR #19 MERGED; merge SHA 371b9fe; all 7 checks green)
- [x] C-2 Deploy & verify (api+web SUCCESS new revisions; 8a backfill no-op; canary skipped DAU<1000)

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
- [x] V-1 Independent reviews (Karen + jenny, parallel)
- [x] V-2 Triage
- [x] V-3 Fast-fix loop (or close) — APPROVED, Phase 2 skipped (empty queue)

LEARN:
- [x] L-1 Docs (CHANGELOG #19 revoke+permanent-default; M2 11 done, stays in_progress; RBAC→wave-10 flagged)
- [x] L-2 Distill (3 tasks done; CI-PRINCIPLES bypass adjudicated — 4 reverted, 1 re-promoted; deploy-verification rule)

NEXT:
- [ ] N-1 Survey & triggers
- [ ] N-2 Seed
- [ ] N-3 Handoff
