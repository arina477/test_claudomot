# Wave 10 stage completion

> Seeded by wave-9 N-3. Active milestone: M2 — Servers, channels & membership (`41e61975-c92e-49b1-9ae5-45498dd04925`, in_progress).
> Bundle: M2 RBAC/roles slice (closes the "members see the right channels per role" success-metric clause). Authored by milestone-decomposer (commit 73791d8), per BOARD pre-authorization — RBAC is wave-10's unconditional seed (wave-8 N 5-1-1; re-affirmed wave-9 L; wave-9 binding condition #3).
> Seed task: `35f191f4-2b63-4c8b-bf7e-a5c074310ec6` — Build RbacModule: roles table, RbacService.can(), role CRUD + assignment.
> Bundled siblings:
> - `2c927c44-0b29-485d-9640-33401624b973` — Channel-level permission overrides + ChannelPermissionGuard
> - `7a10f13d-413f-46a2-a006-f60c0ab529f2` — Owner-lockout safeguard: last-owner invariant across demote/remove/leave
> - `0b9bcf35-a6f1-40df-9da3-e9135307b900` — Role-management UI in server settings (roles tab, member assignment, channel visibility)
> claimed_task_ids (B-0 claims this batch; L-2 closes it): [35f191f4, 2c927c44, 7a10f13d, 0b9bcf35]
> UI wave (role-management UI in server-settings) — D-block expected unless P-1 flags otherwise.
>
> BINDING CONDITIONS / CARRY-FORWARDS (P-0/P-3 MUST honor):
> 1. **RBAC is authz-critical → T-8 Security applies + P-4 security-scope-tightened gate.** Authorization MUST be re-derived server-side via RbacService.can() with route-param-only context (never client-supplied role/permission trust). Owner-lockout last-owner invariant must be race-safe.
> 2. **VERIFIED-PROD-FIXTURE 4a2ad286 is B-block escalation-critical (from wave-9 L obs-3).** Wave-10 is the 3rd consecutive authed-feature wave without a verified prod fixture for live C-2/T-8 verification, and RBAC's authed permission paths NEED live verification. Wave-10 should establish the fixture (or pull 4a2ad286 into the wave) so RBAC's authed paths can be live-verified. 4a2ad286 remains an unbundled M2 seed_candidate.
> 3. **Naming reconciliation for P-2:** M2 scope prose says `channel_permission_overrides`; architecture _library.md names the RbacModule table `permissions` (UNIQUE(channel_id, role_id)) — same semantics; P-2 picks the canonical name.
> 4. **Dependency sequencing (B-block):** seed → (channel-perm 2c927c44 ∥ owner-lockout 7a10f13d) → role-UI 0b9bcf35 last.

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
- [x] C-1 PR, CI & merge — PR #20 MERGED (squash 3cf63bf); all 6 required checks + e2e green
- [x] C-2 Deploy & verify — api+web RUNNING (fresh revisions); migration 0004_green_madripoor applied + verified; backfill-roles clean; RBAC 401 boundary live; canary skipped (<1000 DAU); 403 + verified-prod-fixture (4a2ad286) carried to L

TEST:
- [x] T-1 Static
- [x] T-2 Unit
- [x] T-3 Contract
- [x] T-4 Integration
- [x] T-5 E2E
- [x] T-6 Layout
- [~] T-7 Perf (skip — not heavy)
- [x] T-8 Security
- [x] T-9 Journey

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
