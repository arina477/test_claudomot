## Wave 79 stage completion

**Milestone:** M13 — Institution partnerships & portable identity (b7400254-9c16-4b97-a898-2619b949fc5e)
**Seed:** 60bda5be-a592-437c-94e5-4ac11a5231f4 — Add per-user public-key registry for encrypted DMs
**Siblings:**
- 491cb85d-05df-4cec-b7d7-27a980608b97 — Store encrypted DM envelope alongside plaintext content
- 3fb88f44-2aa6-498f-a93e-faa9b4455b89 — Client-side DM encryption in the web direct-message view
- 3038a4bc-8eeb-49aa-ab3c-096e1ff5b8e1 — Add read-receipt and presence privacy controls to settings
**claimed_task_ids:** [60bda5be, 491cb85d, 3fb88f44, 3038a4bc]
**Note:** M13 leg-3 — richer privacy/E2E posture vs Discord/Telegram (encrypted DMs + presence/read-receipt privacy controls). This is the LAST autonomous leg of M13; after it ships, only the founder-fenced items (B2B2C go-to-market + _TBD_ success metric) remain, so expect a milestone-disposition decision at N-1 next cycle. Wave touches auth/crypto/message-content → expect T-8 security-scope tightened gate at P-4, and likely a small D-block gap for an encrypted-conversation indicator. todo-milestone queue EMPTY — if M13 closes after this leg, N-1 fires roadmap-planning (stockout).

PRODUCT:
- [x] P-0 Frame (discover + reframe)
- [x] P-1 Decompose
- [x] P-2 Spec
- [x] P-3 Plan
- [x] P-4 Gate

DESIGN (skip block if non-UI wave):
- [x] D-1 Brief
- [x] D-2 Variants (with bounded iteration)
- [x] D-3 Review & adopt

BUILD:
- [x] B-0 Branch & schema
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
