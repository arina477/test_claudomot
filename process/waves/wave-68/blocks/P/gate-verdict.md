# Wave 68 — P-4 Verdict

**Reviewer:** head-product (fresh spawn, agentId head-product@P-4-phase1)
**Reviewed against:** process/waves/wave-68/blocks/P/review-artifacts.md
**Attempt:** 1  (1 = first gate)
**Phase:** 1 (head-product)

## Verdict
APPROVED

## Rationale

Wave-68 is a keystone wave that converts wave-67's inert discovery READ path into a working, publishable growth feature — it maps cleanly to one live milestone (M11 Growth: server discovery, 8d88e691, in_progress) with no orphan scope. The three load-bearing requirements are all explicit and independently verifiable in the spec contract embedded in task 2bd37c4c's `description`:

1. **Owner-authz (security, the load-bearing one).** AC1 requires the publish/update to be OWNER-gated in the SERVICE layer (`server.owner_id !== req.session.getUserId() → 403 ForbiddenException`, reusing the established `servers.service.ts ~:368` idiom; 404 on missing). AC2 is a dedicated HARD AC: a non-owner calling `PATCH /servers/:id` is rejected 403 AND the servers row is NOT modified, with a test that asserts the update was never applied. The P-3 plan routes this to backend-developer at B-2 (`updateServer owner-reject — non-owner 403, row unmodified`) in the pg-harness/service tier. Publishing exposes a server to a public directory, so a missing/weak owner-gate would be the reframe failure mode — it is present, service-side, and non-owner-reject-tested. Correctly flagged for the T-8 security stage in the T-block.

2. **memberCount live-DB test (AC7, hard AC).** The spec makes a real-Postgres integration test (pg-harness / real-DB tier, explicitly NOT a mock) a hard acceptance criterion — seed public servers with 0/1/2+ members, assert `GET /servers/discover` returns `memberCount == real count`. This is exactly the guard wave-67 lacked (its unit test mocked memberCount, so the always-0 correlated-subquery bug shipped green). P-3 routes it to backend-developer/pg-harness at B-2. The fix approach (LEFT JOIN server_members + GROUP BY, replacing the correlated scalar subquery) is deterministic and avoids the Drizzle correlation ambiguity that produced 0.

3. **Opt-in + unpublish (AC3).** `is_public` default-false is preserved with no backfill (no wave changes existing servers' visibility); `is_public=false` retracts the server from the directory; the owner can toggle public↔private both ways idempotently. Sound and low-risk.

The plan is coherent and architecture-respecting: PATCH over a dedicated `/publish` endpoint (justified — one owner-gated partial mutation covers is_public + description + topic); reuse of the existing server-settings Overview shell + DESIGN-SYSTEM form primitives (design_gap_flag=false correctly set — no net-new visual surface warrants a D-block), explicitly avoiding the superseded Roles-tab permission matrix; no schema change (columns exist from wave-67 migration 0024). No gold-plating — moderation, ranking, and trending are correctly deferred (premature at zero users). Every AC maps to a plan step with an assigned specialist (AC1-3→B-2, AC4 DTO→B-1, AC5→B-3, AC6→B-2, AC7→B-2), all specialists present in AGENTS.md.

**Labeling note (not a defect):** the gate prompt references "8 ACs / AC9"; the spec's `acceptance-criteria` array contains 7 enumerated items. This is a numbering artifact, not a missing criterion — all substantive criteria the judge enumerates are present (owner-gate = AC1, non-owner-reject = AC2, opt-in/unpublish = AC3, shared DTO = AC4, settings UI = AC5, memberCount fix = AC6, memberCount live-DB test = AC7). Nothing load-bearing is absent.

**Strategic flag (forwarded, not a blocker):** the P-0 moderation-before-public-LAUNCH note (sequence: publish now → moderation next → launch) is a future/founder signal carried from ceo-reviewer. It is correctly NOT a wave-68 blocker — this wave ships opt-in publish (low-risk); the public-LAUNCH go/no-go and its moderation prerequisite remain founder-reserved. Recorded here for downstream carry.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3

---
## Phase 2 — merged verdict (Karen + jenny + Gemini) → PASS → B-0
- **Karen: APPROVE** (afc9fa9b) — all 6 load-bearing claims VERIFIED: owner-gate idiom (servers.service.ts:368/:408 — use :408 owner-ONLY for updateServer), owner_id at schema:25; no PATCH exists (net-new), routes use req.session.getUserId(); memberCount bug at :550-554; pg-harness real-DB tier EXISTS (apps/api/test/integration/pg-harness.ts + vitest.integration.config + 15+ integration specs); ServerSummary/Detail + is_public/description/topic present; api.updateServer net-new. **MATERIAL B-3 SCOPE CORRECTION (non-blocking):** the server-settings OVERVIEW surface does NOT exist as a component — the only "Server settings" entry (ChannelSidebar.tsx:257-266) opens ServerRolesPage.tsx (Roles-only, 1754 lines, spec forbids touching it). design/server-settings.html shows Overview/Roles/Members tab chrome but only builds Roles content. → **B-3 must BUILD the publish/Overview settings surface NET-NEW** (new component + entry point/route), reusing DS form primitives + the isOwner gate pattern (ServerRolesPage.tsx:675) + the design tab-chrome as visual reference. NOT "extend existing." design_gap_flag stays false (settings-page shell designed in server-settings.html + fields are standard DS primitives; B-block design-gap fallback catches any real mid-build gap).
- **jenny: APPROVE** (a80ee146) — no material drift; owner-gated publish MATCHES shipped invite revoke/rotate owner-authz; opt-in+unpublish MATCHES wave-67 posture (L739); memberCount fix+live-DB test = the wave-67 V-3 DEFER folded (L745); Overview-shell reuse (not Roles) MATCHES design (server-settings.html:3-10 Roles-superseded); moderation-before-launch consistent (L732/739); journey addition (settings publish toggle activates F12 directory) = T-9 addition.
- **Gemini: UNAVAILABLE** (exit 3, 429). Degradable.
Karen + jenny APPROVE + Gemini UNAVAILABLE = gate-pass. design_gap_flag=false → B-0. CARRY to B-3: build Overview settings surface net-new (per karen). CARRY to T-8: exercise the owner-only publish gate (non-owner → 403).
