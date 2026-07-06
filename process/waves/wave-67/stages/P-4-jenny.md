# P-4 jenny (Phase 2) — DRIFT audit, wave-67 (M11 server-discovery bundle #1)

**Role:** spec-vs-prior-decisions + spec-vs-journey-map drift check.
**Artifacts read:** seed `tasks` row 609c9bdd (YAML spec-contract, 3 blocks + prose, via `$CLAUDOMAT_DB_URL`); `P-3-plan.md`; `P-0-frame.md`; `P-1-decompose.md`; `P-2-spec.md` (pointer); `command-center/product/product-decisions.md` (M12-close/M11-promotion L722-726, M11 decomposition L728-734, wave-67 floor-override L736-739, plus the full invite/membership decision lineage waves 8/9/28); `command-center/artifacts/user-journey-map.md` (page-11 create-server, page-12 invite-preview/join, invite-share modal, invite-code rotation).
**Independent code cross-checks:** `apps/api/src/db/schema/servers.ts` (confirmed NO is_public/description/topic today — only id/name/owner_id/invite_code/created_at); `servers_members` idempotent `UNIQUE(server_id,user_id)`; `servers.controller.ts:153 joinViaInvite → JoinResult` (membership core exists as claimed).

**VERDICT: APPROVE — no material drift.** invite-only → opt-in-discoverable is an ADDITIVE evolution consistent with the founder-directed M11 promotion (Option A). Every spec-contract absence-claim and reuse-claim was verified accurate against the live codebase. Per-item findings below.

---

## Judged question 1 — opt-in visibility vs StudyHall's privacy posture → **MATCH**

- Spec A: `is_public boolean NOT NULL DEFAULT false`; existing rows stay private (backward-compatible); **no backfill**; `GET /servers/discover` returns ONLY `is_public=true`; "Private servers NEVER appear in /discover regardless of search" is an explicit AC + repeated as an edge-case ("existing private servers → excluded"). Spec C join gate rejects non-public (404/403), explicitly "NOT a backdoor into private servers."
- Verified in code: `servers.ts` today has no visibility column → every existing server is structurally private. The default-false + no-backfill design means the migration exposes ZERO existing communities. This is the privacy-SAFE direction of the change.
- **No conflicting decision.** There is no prior "servers are public" posture to violate; the existing posture is invite-gated, and opt-in-public strictly preserves it for every non-opting server. Consistent with StudyHall's documented 404-as-non-leak resolver convention (PD L475, wave-8/9 invites, /me/mentions) — the join gate uses the same 404/403 non-leak posture.
- Matches the P-0 frame's carried privacy invariant ("opt-in visibility, no backfill") and the wave-67 floor-override note ("Opt-in visibility (is_public default false) verified at P-0", PD L739). No drift.

## Judged question 2 — reuse joinViaInvite core, no second abstraction, don't weaken invite path → **MATCH**

- Spec C AC1: `joinPublicServer` "reuses the joinViaInvite idempotent core (INSERT ... ON CONFLICT (server_id,user_id) DO NOTHING RETURNING, transactional) ... The invite path is NOT weakened." Returns the SAME `JoinResult` shape (AC2) so the client reuses existing post-join handling. `data` contract: "no schema change" for the join (existing table + existing UNIQUE idempotency).
- Plan §membership: explicitly chose SIBLING METHOD sharing the core over generalizing joinViaInvite with an optional-invite param — rationale "keeps the invite path's validation intact; shares only the transactional insert." This is exactly the codebase's established approach (idempotent ON CONFLICT re-join, JoinResult shape) proven live in the journey map (page-12 `POST /invites/:code/join`: "Idempotent re-join: ON CONFLICT(server_id,user_id) DO NOTHING").
- Verified in code: `joinViaInvite(): Promise<JoinResult>` exists (servers.controller.ts:153 / service); `server_members` carries the `UNIQUE(server_id,user_id)` idempotency the spec relies on. Decomposition binding-reuse note (PD L731) matches.
- **No drift.** The invite path (`POST /invites/:code/join`, invite-preview, rotation, share-modal) is untouched by all three specs; `GET /servers` findMyServers is explicitly UNCHANGED. This is additive, not a membership-model rewrite. No second membership abstraction introduced.

## Judged question 3 — /discover surface + ServerRail entry-point vs app-shell/journey → **MATCH (new-route, needs T-9 entry, not a contradiction)**

- Spec B: new React Router v7 `/discover` route rendering `ServerDiscoverPage`, reachable "near ServerRail '+' / mirroring the create-server modal entry in AppShell.tsx"; explicitly "Does NOT reimplement ServerContext's member-scoped list (separate surface)"; honest cold-start empty-state AC.
- Journey-map reality: page-11 create-server modal lives at the ServerRail "+" entry (map L114); page-12 `/invite/:code` is the current PUBLIC route pattern for entering a server from outside membership. `/discover` is a NEW route in the same family (an authed browse surface) — it does not overwrite or contradict any documented flow. The member-scoped ServerContext list stays the source of truth for the rail; discovery is a parallel surface.
- The map's server-join flows are all invite-mediated today; `/discover` ADDS a non-invite entry path. That is a net-new journey node, correctly flagged: `design_gap_flag: true` (→ D-block for the page) and the spec/plan defer the map entry to T-9 (a Journey regen adds the route). **This is a journey ADDITION requiring a T-9 map entry, not a contradiction of an existing flow** — exactly as the prompt anticipates. No drift.
- Minor (non-blocking) note for downstream stages, NOT a drift: the entry-point is specified as "near ServerRail" mirroring the create-server modal affordance but is not yet pinned to an exact component/interaction — B-3/D-block owns the concrete placement. This is appropriate open scope at spec/plan level, not a gap.

## Judged question 4 — M11 framing vs the just-recorded M12-close + M11-promotion decisions → **MATCH**

- PD L722-726 (M12 CLOSED, founder Option A + M11 promoted): founder declared the offline moat done at read-path completeness and delegated the next-theme pick; M11 (Growth: server discovery) promoted → in_progress with a Claudomat-authored **working, founder-adjustable** success metric: "public study-server directory — browse/search, see community info, one-click join."
- The wave-67 spec is a verbatim decomposition of that working metric: browse/search (Spec A discover API + Spec B search UI), see community info (name/description/topic/memberCount cards), one-click join (Spec C). Every AC traces to a named metric clause (mvp-thinner OK, P-0 frame; PD L738). The bundle is the "foundational first M11 slice" recorded at decomposition (PD L728-729).
- M9 (monetization) + M10 (compliance) correctly untouched as founder-reserved; M11 correctly identified as the clean buildable growth product-feature (PD L725). The floor-override (PD L736-739, precedent-application, no BOARD) is consistent with the established wave-21/23-27/50/53/65/66 sub-floor lineage and does not alter scope.
- **No drift.** Framing is fully consistent with the founder Option-A directive and the promotion/decomposition record.

## Judged question 5 — does public-discovery contradict any prior "invite-only by design" decision? → **NO — intentional additive evolution, not a reversal**

- Searched product-decisions.md + journey-map for any explicit "servers are invite-only by design" / "closed network by design" product decision. **None exists.** Invite-only is an ARCHITECTURAL FACT of the current build (no visibility column; `GET /servers` is member-scoped findMyServers; the only outside-in entry is `/invite/:code`) — recorded as a *state of the code* at M11 decomposition (PD L729: "Servers today are 100% invite-gated (grep-confirmed)"), NOT as a deliberate permanent-privacy product principle.
- The distinction the prompt asks for holds cleanly: this is **evolution (invite-only → opt-in-public is additive)**, not a **reversal**. No opt-out server changes behavior; the invite path is preserved intact; visibility is a new opt-in capability, not a policy flip on existing communities. The one governing privacy input — the founder's M11 promotion under Option A — AUTHORIZES exactly this directory.
- Related privacy decisions checked for conflict: the 404-non-leak resolver convention (PD L475) — the join gate CONFORMS to it; invite-code rotation/leak-handling (wave-28) — untouched. No prior decision is contradicted.

---

## Cross-cutting notes carried forward (advisory, NOT drift, do not block APPROVE)

- **Honest empty-state is a first-class AC** (Spec B) — correctly present; the directory renders empty until owners opt in (cold-start). Matches the ceo-reviewer P-0 COLD-START flag (P-0 frame). Keep it a hard T-4/T-5 assertion, not just copy.
- **Moderation-before-public-LAUNCH + GTM directory-seeding** are strategic follow-ups (P-0 frame strategic_notes; PD L739) — out of THIS build's scope by design; noted so they are not lost. No effect on the wave-67 spec's correctness.
- **T-9 obligation:** the new `/discover` route + its ServerRail entry-point MUST land as a new journey-map node at T-9 (the map has no discovery entry today). Flagging so the Journey stage adds it rather than treating the surface as pre-existing.

**Overall: APPROVE.** All 5 judged items MATCH; no DRIFTS; no conflicting prior decision cited because none exists. The spec+plan is internally consistent with the M12-close/M11-promotion/decomposition/floor-override record and additively consistent with StudyHall's invite-gated membership posture and journey map.
