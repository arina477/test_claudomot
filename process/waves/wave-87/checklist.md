# Wave 87 — Stage completion ledger
Topic: Server-endpoints hardening — validate PATCH /servers/:id id-param (400 not 500) + add owner-guarded server-delete route
Seed task: 1c728847-2ca7-4c88-8c2c-ffd08832fd3d ([bug-api] Server endpoints: PATCH /servers/:id 500s on malformed body + no server-delete route)
Bundled siblings: (none — single-spec)
Active milestone: null (roadmap terminal; bug-fix phase, planning parked for founder per wave-81..86 chain)
Claimed task ids: [1c728847-2ca7-4c88-8c2c-ffd08832fd3d]

Spec-author notes (from N-2 head-next sign-off):
- Scope the 500-fix to the un-piped :id param door (ParseUUIDPipe/validate before the query), NOT the already-correct body-shape 400 (UpdateServerSchema.safeParse already returns 400). Same un-piped :id pattern also appears on sibling servers routes (@Get(':id') L92, :id/members L129, :id/join-public L150, etc.) — P-2 decides explicitly whether to harden servers-wide or scope strictly to @Patch/delete.
- Delete-route is net-new: needs owner-only auth guard (owner_id) + hard-vs-soft-delete + cascade decision (members, invites). Touches auth/ownership -> T-8 Security applies at P-4.
- Null milestone is the standing deferred posture, NOT a decomposition trigger — P-0 framer must not treat it as one.

## P — Product
- [ ] P-0 Frame
- [ ] P-1 Decompose
- [ ] P-2 Spec
- [ ] P-3 Plan
- [ ] P-4 Gate
## B — Build
- [ ] B-0 Branch & schema
- [ ] B-1 Contracts
- [ ] B-2 Backend
- [ ] B-3 Frontend
- [ ] B-4 Wire
- [ ] B-5 Verify
- [ ] B-6 Review
## C — CI/CD
- [ ] C-1 PR, CI & merge
- [ ] C-2 Deploy & verify
- [ ] C-3 Canary
## T — Test
- [ ] T-1 Static
- [ ] T-2 Unit
- [ ] T-3 Contract
- [ ] T-4 Integration
- [ ] T-5 E2E
- [ ] T-6 Layout
- [ ] T-7 Perf
- [ ] T-8 Security
- [ ] T-9 Journey
## V — Verify
- [ ] V-1 Reviews
- [ ] V-2 Triage
- [ ] V-3 Fast-fix gate
## L — Learn
- [ ] L-1 Docs
- [ ] L-2 Distill
## N — Next
- [ ] N-1 Survey & triggers
- [ ] N-2 Seed
- [ ] N-3 Handoff
