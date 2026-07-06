# V-1 jenny — spec-compliance verification (wave-68, M11 publish-write-half + memberCount fix)

**Verdict: APPROVE**

Deployed behavior matches the spec-contract intent. The M11 write-half works (owner can publish → server appears in /discover → retract works) and the wave-67 `memberCount:0` bug is genuinely fixed in deployed reality. All 8 acceptance criteria are implemented, owner-gated server-side, and proven live (T-5/T-6/T-8) + CI-corroborated on the real-Postgres integration tier. No spec drift, no gaps.

- **Spec source:** DB `tasks` row `2bd37c4c-eca8-4eda-900b-0276fe46f1b3` (`wave-68-spec`, single-spec, 8 ACs + folded F67-T5-1 memberCount fix).
- **Merge:** `1b5a184` (`feat: publish servers to the discovery directory + fix member counts (#83)`) — deployed; repo HEAD is past it (`98dd773`). BOTH services live.
- **Deployed:** web `https://web-production-bce1a8.up.railway.app` (200), api `https://api-production-b93e.up.railway.app`.
- **Fixture:** studyhall-e2e-fixture (A); T-8 non-owner fixture (B-owned) created+deleted for the attack test.

## AC-by-AC verification (spec vs deployed reality)

| AC | Spec intent | Verified evidence | Status |
|----|-------------|-------------------|--------|
| AC1 | PATCH /servers/:id owner-gated partial update {is_public?, description?, topic?}, returns ServerSummary, touches no other columns | `servers.service.ts:451-491` `updateServer` — 404-if-missing, 403-if-not-owner, partial SET (only present fields; `'description' in patch` / `'topic' in patch` / `is_public !== undefined`), returns `{id,name,ownerId}`. Controller `servers.controller.ts:105-118` `@Patch(':id') @UseGuards(AuthGuard)` + Zod parse. Deployed unauth PATCH → **401** (AuthGuard active, not 200/500). | MET |
| AC2 | SECURITY (hard): non-owner PATCH → 403 AND row NOT modified; a test asserts it | Service `owner_id !== userId → ForbiddenException` BEFORE any write (`:462`). Live-DB test `update-server-member-count.spec.ts:137-162` asserts 403 + row completely unchanged (is_public/description/topic all still original). **T-8 proved live:** non-owner (fixture A) PATCHing B's server → 403, target row UNMODIFIED in Postgres (HACKED payload zero effect). | MET |
| AC3 | opt-in + unpublish; is_public only changes when provided; default false; unpublish retracts from /discover; idempotent both ways | `is_public` only set when `!== undefined` (`:471`); partial-update test proves is_public untouched when only description sent. **T-5 proved live:** publish → /discover flips 0→1; unpublish (toggle OFF + Save) → /discover flips 1→0; partial-update kept desc/topic. | MET |
| AC4 | Shared UpdateServer Zod/DTO (partial, capped lengths); reuse ServerSummary/ServerDetail | `packages/shared/src/servers.ts:108-113` `UpdateServerSchema` = `{ is_public?: boolean, description?: string.max(500).nullable().optional(), topic?: string.max(100).nullable().optional() }`. Exported at `index.ts:26,40`. Response reuses ServerSummary. | MET |
| AC5 | Settings UI: owner-reachable Overview shell, publish toggle + description/topic fields, DS primitives, Save→api.updateServer, reflects current state, owner-only publish control, don't touch Roles matrix | `apps/web/src/shell/ServerOverviewSettings.tsx` — `isOwner` gate via getMe vs ownerId (`:141,152`), `role=switch` Toggle (`:82-101`), description/topic fields pre-populated from initial state (`:162-164`), `handleSave` builds partial patch → `api.updateServer`. Client method `apps/web/src/auth/api.ts:876-883` PATCH `/servers/:id`. Non-owners see fields read-only, publish toggle hidden. Roles matrix untouched (separate `ServerRolesPage`). 13 overview tests (owner-sees/non-owner-doesn't). **T-5/T-6 proved live** pre-populate + post-save persist + dialog close-reopen reconcile (B-6 fix). | MET |
| AC6 | memberCount FIX: /servers/discover returns REAL server_members count (was always 0); 0-member→0, N-member→N | `servers.service.ts:612-648` `discoverServers` rewritten to `LEFT JOIN server_members + GROUP BY servers.id`, `count(server_members.user_id)::int`. LEFT JOIN preserves 0-member rows. **T-5 proved live:** /discover card rendered "2 members" (real count) vs DB ground-truth 2 — was permanently 0 in wave-67. Bug genuinely CLOSED. | MET |
| AC7 | memberCount LIVE-DB test (hard): real-Postgres, seed 0/1/2+ members, assert memberCount == real | `update-server-member-count.spec.ts:176-266` — real pg-harness (NOT mocked), seeds 3 public servers with 0/1/2 members, asserts memberCount 0/1/2, plus 0-is-number-not-null + ordering + **PRIVATE-EXCLUSION** (private server with members never leaks into /discover). | MET |
| AC9 | live-DB test RAN in CI | `.github/workflows/ci.yml:35-55` `test` job with `postgres:16` service + `DATABASE_URL_TEST` env → `pnpm test:ci`. T-9 map records the integration tier ran GREEN (memberCount 0/1/2, private-exclusion, updateServer non-owner→403 row-unmodified) — the live-DB guard the wave-67 mocked unit test lacked. | MET |

## Focus-question findings

1. **publish→discover→memberCount matches spec intent — CORROBORATED.** T-5 proved the full loop live end-to-end (Overview pre-populated from real state → toggle ON + desc + topic → Save → PATCH 200 → persisted to Postgres → close/reopen re-populates → /discover flips 0→1, card renders name/desc/topic + correct member count + Join → unpublish → /discover flips 1→0). Deployed AuthGuard confirmed live (unauth discover 401, unauth PATCH 401). No edge drift found.

2. **memberCount:0 bug genuinely FIXED in deployed reality — CONFIRMED.** The wave-67 correlated-scalar-subquery (0-at-runtime Drizzle binding defect) is replaced by LEFT JOIN + GROUP BY. T-5 rendered "2 members" (real) on the live /discover card vs wave-67's permanent 0. Guarded by a real-Postgres test asserting 0/1/2 — the exact test tier the wave-67 mocked unit test lacked (which is how the bug shipped green). The wave-67 spec-drift (F67-T5-1) is folded + closed.

3. **No remaining drift from the 8 ACs.** Owner-gate is server-side (NestJS `ForbiddenException`), not merely a UI hide — verified in code + proven live at T-8 with an attack payload. Length caps enforced by Zod (400 on overflow). Partial semantics correct (`'description' in patch` distinguishes "clear to null" from "omit"). No response-shape change on /discover. No schema change (columns exist from migration 0024). Roles matrix untouched.

4. **Empty-directory is now POPULATABLE — M11 read+write halves COMPLETE for discovery.** wave-67 shipped read (GET /discover + browse UI + one-click join); wave-68 ships write (owner publish + description/topic). The loop that made prod's directory permanently empty is closed: an owner can now opt a server into the directory. Discovery is functionally complete.

## Cross-reference checks
- **user-journey-map.md** (page-17 `/discover`, F12; new "Server Settings — Overview / Publish-to-directory" surface at line 394) — T-9 regen (`last_updated_wave68`) accurately documents the write-half LIVE + memberCount fix + owner-gate server-side + prod restored clean. Consistent with deployed reality.
- **product-decisions.md** — M11 = Growth/discovery milestone (v10 roadmap, H2). No wave-68-specific decision entry required (no Tier-3/scope-change resolved this wave; a straightforward decomposed bundle). Not a gap.

## Standing strategic item (informational, NOT a V-1 blocker)
- **Moderation deferral before public LAUNCH still stands.** The directory is now publicly populatable by any owner; there is no content-moderation / abuse-report surface for public listings. This was a deliberate deferral (self-use-mvp scope; moderation is a pre-LAUNCH strategic item, not an M11 write-half AC). Not spec drift — carry to N-1/roadmap as the standing item before public launch. No user-facing exposure yet at self-use-mvp scale.

## Verdict rationale
Deployed matches spec intent on every AC. The write-half works, the memberCount:0 bug is genuinely fixed in deployed reality (proven live at both UI + API), the security owner-gate is server-side + attack-proven, and the mandatory live-DB test tier that was missing in wave-67 now RAN GREEN in CI. Prod was left clean (T-8 fixtures deleted, target server restored private, /discover back to honest empty). No drift, no gap. **APPROVE.**
