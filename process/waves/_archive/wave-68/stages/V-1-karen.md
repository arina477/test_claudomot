# V-1 Karen — wave-68 reality assessment (StudyHall M11 publish-write-half + memberCount fix)

**Verdict: APPROVE**

Verified against merged/deployed main. HEAD = `98dd773` (past merge `1b5a184`, PR #83). No production code deltas between `1b5a184` and `98dd773` (only journey/test-principle docs). All six load-bearing claims hold in the shipped state — the three highest-risk seams (owner-gate ordering + row-unmodified, memberCount real-count with CI-run live-DB proof, wired post-save reconcile) are confirmed by direct code + test + CI-config inspection.

---

## Claim-by-claim findings (file:line + evidence)

### Claim 1 — updateServer owner-gate — CONFIRMED
`apps/api/src/servers/servers.service.ts:451-490` `updateServer(serverId, userId, patch)`:
- **Ordering is correct and load-bearing:** load server (`:456`) → `if (!server) NotFoundException` (`:458-460`) → `if (server.owner_id !== userId) ForbiddenException` (`:462-464`) → **then** build partial SET (`:470-473`) → UPDATE (`:475-479`). The 403 throws BEFORE any write. Partial update touches only supplied fields (`is_public !== undefined`, `'description' in patch`, `'topic' in patch`); `null` clears, omitted stays.
- **Route + guard:** `apps/api/src/servers/servers.controller.ts:105-118` — `@Patch(':id')` + `@UseGuards(AuthGuard)`; body Zod-validated (`UpdateServerSchema.safeParse` → 400 on failure `:112-114`); userId from `req.session.getUserId()` (`:116`).
- **Test asserts row-unmodified on non-owner (the load-bearing security assertion):** `apps/api/test/integration/update-server-member-count.spec.ts:138-162` — seeds known state `description='original', topic='original-topic', is_public=false`, calls updateServer as `NON_OWNER_ID` with `'hacked'` values, asserts `.rejects.toBeInstanceOf(ForbiddenException)` (`:151`), then **re-SELECTs the row and asserts all three columns unchanged** (`:159-161`). This is a real-Postgres row read, not a mock. Also covers 404-missing (`:167-171`) and partial-update-leaves-is_public-untouched (`:121-133`).

### Claim 2 — memberCount fix (LEFT JOIN, real count) — CONFIRMED, incl. CI actually runs it
`apps/api/src/servers/servers.service.ts:598-655` `discoverServers`:
- `memberCountExpr = sql<number>\`count(${server_members.user_id})::int\`` (`:612`); `.leftJoin(server_members, eq(server_members.server_id, servers.id))` (`:637`); `.groupBy(servers.id)` (`:639`). LEFT JOIN preserves 0-member rows → returns 0, not NULL/missing. Same expr reused in `orderBy(desc(memberCountExpr), ...)` (`:642`).
- **Real-Postgres test asserts the real count:** `update-server-member-count.spec.ts:214-225` seeds 3 public servers with 0/1/2 members and asserts `byId[A]===0, byId[B]===1, byId[C]===2`; plus a dedicated "0 not NULL/missing, typeof number" test (`:236-244`) and ordering-by-count test (`:246-255`).
- **CI actually runs it (not skipped):** `apps/api/package.json:12` `test:ci` = `vitest run ... && vitest run --config vitest.integration.config.ts`; integration config includes `test/integration/**/*.spec.ts` (`apps/api/vitest.integration.config.ts:25`). `.github/workflows/ci.yml:39-46` provides `image: postgres:16` + `DATABASE_URL_TEST: postgres://test:test@localhost:5432/studyhall_test` and runs `pnpm test:ci` (`:53`). The spec's `SKIP = !process.env.DATABASE_URL_TEST` (`:30`) is therefore **false** in CI → `describe.skipIf(SKIP)` runs. Live-DB tier ran, not skipped, matching the merge claim.

### Claim 3 — Read-contract + pre-populate + post-save reconcile (the wired seam) — CONFIRMED
- **Read contract carries the fields:** `ServerDetail.server` includes `is_public`, `description`, `topic` — `servers.service.ts:193-202` (`findServerDetail` return). `ServerSummaryWithInvite`/shared types expose them.
- **Pre-populate from selectedDetail.server:** `apps/web/src/shell/ChannelSidebar.tsx:340-352` passes `initialIsPublic={selectedDetail.server.is_public}`, `initialDescription={selectedDetail.server.description}`, `initialTopic={selectedDetail.server.topic}` into `ServerOverviewSettings`, which seeds state from them (`ServerOverviewSettings.tsx:162-172`).
- **Post-save reconcile seam is wired (load-bearing):** `ChannelSidebar.tsx:352` `onSaveSuccess={refetchDetail}`; `refetchDetail` from `ServerContext` (`ServerContext.tsx:45,272,290`). `ServerOverviewSettings.tsx:272` calls `onSaveSuccess?.()` after the successful PATCH — so post-save the context re-fetches detail and re-open reflects persisted values (no stale revert). This is the exact seam T-5 confirmed persists-on-reopen.

### Claim 4 — Frontend surface — CONFIRMED
- `ServerOverviewSettings.tsx`: owner-gate `isOwner = ownerStatus === 'owner'` (`:152`); `canSave = isOwner && dirty && !overLimit && saveStatus !== 'saving'` (`:305-306`) — Save hidden/gated for non-owners; fields `disabled={!isOwner}` (`:602,:645`) render read-only for members. Defense-in-depth vs the backend 403.
- `api.updateServer` client: `apps/web/src/auth/api.ts:876`.
- Overview entry point: `ChannelSidebar.tsx:264-268` (`aria-label="Server settings — Overview"` → `setOverviewPageOpen(true)`), overlay at `:338-352`.

### Claim 5 — Shared UpdateServer DTO — CONFIRMED
`packages/shared/src/servers.ts:108-113` — `UpdateServerSchema = z.object({ is_public: boolean.optional(), description: string.max(500).nullable().optional(), topic: string.max(100).nullable().optional() })`; exported `UpdateServer` type + barrel exports at `packages/shared/src/index.ts:26,40`. Server + controller import the same schema/type — single contract source.

### Claim 6 — Private-exclusion — CONFIRMED
- Query filters `eq(servers.is_public, true)` as the base WHERE (`servers.service.ts:615`, combined at `:626`) applied over the LEFT JOIN/GROUP BY.
- **Integration test asserts a private server is absent:** `update-server-member-count.spec.ts:265-292` seeds a private (`is_public=false`) server with **2 members** (so a broken filter would float it to the top via memberCount DESC) and asserts `returnedIds` does NOT contain it (`:282`), `find(...)` is undefined (`:286`), and the 3 public servers still present (`:289-291`). T-8 corroboration (only public surfaces) is consistent.

---

## Bullshit-detection notes (nothing blocking)

- **No over-engineering flagged.** The `updateServer` `setFields as Record<string, unknown>` cast (`:470-477`) is a documented, contained Drizzle dynamic-`.set()` narrowing workaround — pragmatic, not a smell.
- **Known limitations are documented, not hidden:** cross-page memberCount drift under offset pagination (`:585-591`) and rotate-vs-join race (`:390-403`) are explicitly out-of-scope and orthogonal to this wave's claims. Acceptable.
- **Defense-in-depth is real, not theater:** owner-gate enforced independently at backend (`:462`) AND frontend (`canSave`/`disabled`), with the security test proving the backend gate blocks the write even if the UI is bypassed.

## Severity ledger
No Critical / High / Medium / Low findings. All load-bearing claims — owner-gate ordering + row-unmodified test, memberCount real-count with a CI-executed live-Postgres assertion, and the wired `onSaveSuccess={refetchDetail}` post-save reconcile seam — are true in the merged/deployed state.

**APPROVE.**
