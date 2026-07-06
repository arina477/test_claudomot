# Wave 67 — P-4 Verdict

**Reviewer:** head-product (fresh spawn, Phase 1 gate review)
**Reviewed against:** process/waves/wave-67/blocks/P/review-artifacts.md
**Attempt:** 1  (first gate)
**Phase:** 1 (head-product)

## Verdict
APPROVED

## Rationale
Wave-67 is the coherent, minimal first bundle of the freshly-promoted M11 (Growth: server discovery) milestone — it turns StudyHall from invite-only into a discoverable network, the network-effect leg of the "win students from Discord" founder bet. The three-spec bundle (public-visibility schema + directory API, discovery/browse UI, one-click public join) is a single browse→see→join vertical where every AC traces to M11's explicit success metric, and both scope reviewers (mvp-thinner, ceo-reviewer HOLD-SCOPE) fenced against expansion — ranking, trending, categories, and moderation all sort an empty shelf at zero users and are correctly deferred to later bundles. The wave's key risk is the new membership-write door, and the two security-critical guarantees are BOTH explicit, testable acceptance criteria, not implied: (1) public join is gated on `servers.is_public=true` server-side and rejects a non-public server with 404/403 — no backdoor into private communities, and the invite path is not weakened; (2) visibility is opt-in via `is_public boolean NOT NULL DEFAULT false` with no backfill, so no existing private server is ever exposed and private servers never appear in the directory regardless of search. The ceo-reviewer's cold-start flag is resolved into an explicit Spec B AC: an honest empty-state that reads as intentional, not broken, alongside loading and error states. The plan respects the locked architecture (columns on the existing `servers` table rather than a second table; a sibling join method that shares only the invite path's transactional idempotent insert; a standalone discovery surface separate from the member-scoped ServerContext), introduces no new infrastructure, and maps every AC across all three specs to a build step with a validated specialist. The sub-floor multi-spec override-ship is defensible precedent-application, and design_gap_flag=true is correct (the new /discover page routes P→D→B). Downstream note for the T-block: this wave adds an authenticated membership-WRITE endpoint (`POST /servers/:id/join-public`), so `wave_touches ∩ {auth, user-membership-write}` ≠ ∅ — the T-8 Security stage MUST run and must specifically exercise the is_public server-side gate (reject-private assertion) plus join idempotency; flag carried for the Phase 2 security-scope tightened gate.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3

---
## Phase 2 — merged verdict (Karen + jenny + Gemini) → PASS → D-block
- **Karen: APPROVE** (a1bf6bf2) — all 6 load-bearing claims VERIFIED @ line: servers pgTable schema.ts:14 (no is_public/description/topic yet); Drizzle db:generate mechanism real (drizzle.config.ts + package.json:14); joinViaInvite idempotent core servers.service.ts:505-588 (onConflictDoNothing().returning() L539-543, JoinResult={serverId}); GET /servers findMyServers controller:54-59 untouched; server_members UNIQUE(server_id,user_id) schema.ts:61; React Router v7 + api.ts pattern + ServerContext.refetch() all present. B-block notes: place join-public on ServersController (not InvitesController; same ServersService); non-public-reject gate is net-new logic.
- **jenny: APPROVE** (a784aa3a) — no material drift; opt-in visibility MATCHES existing invite-only privacy (no backfill exposes existing servers); joinViaInvite-core reuse MATCHES membership approach; /discover is an additive new journey node (no conflicting "invite-only by design" decision exists — it's an architectural fact, not a permanent principle); M11 framing matches the founder Option-A + working metric. Advisories: honest empty-state as a hard test assertion; T-9 must add /discover journey node.
- **Gemini: UNAVAILABLE** (exit 3, HTTP 429). Degradable — does not block.
Karen + jenny APPROVE + Gemini UNAVAILABLE = gate-pass. design_gap_flag=true → D-1 Brief. DOWNSTREAM: T-8 security stage MUST exercise the is_public server-side join gate (reject-private) + idempotency.
