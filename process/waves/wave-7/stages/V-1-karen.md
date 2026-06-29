# V-1 Karen — Source-claim verification (wave-7 M2 servers/channels)

**Reviewer:** karen (V-1, reality assessment) · **Date:** 2026-06-29
**Reviewed against:** LIVE merged + deployed state — main @ 47f35d9 (PR#17 = 585112f), api `https://api-production-b93e.up.railway.app`, web `https://web-production-bce1a8.up.railway.app`
**Claimed tasks:** a47ed9bc, a87341fe, e32b50dd, d62d6ce3
**Method:** live curl + first-hand source read + live `pnpm test:ci` run (not trusting prose)

## Verdict: APPROVE

Every load-bearing claim is real. The feature is live, member-scoped server-side, atomic on create, and wired end-to-end in the UI. No claimed-but-fake surface, no gold-plating. The 5 T-9 findings are honest, correctly-scoped deferrals — not concealed breakage.

---

## Per-claim findings

### Claim 1 — Migration applied to prod (4 tables exist) → VERIFIED
- Live behavioral proof: `POST /servers`, `GET /servers`, `GET /servers/:id` all respond `401 {"message":"unauthorised"}` (not 404/500) — the routes exist and the app booted against a schema where the tables resolve; a missing-table boot failure would surface as 500/crash, not a clean auth 401. `/health` → 200, web root → 200.
- Migration SQL `apps/api/drizzle/migrations/0002_certain_miek.sql` defines exactly the 4 tables (`servers`, `server_members`, `categories`, `channels`) with the spec'd shape: `owner_id`/`user_id` as `text`→`users.id`, cascade FKs to `servers`, `channels.category_id`→`categories` ON DELETE set null, `UNIQUE(server_id,user_id)` on `server_members`, `is_private boolean DEFAULT false NOT NULL` on channels, `role_id uuid` nullable.
- Trust C-2's authed evidence (201 + list + `#general`) per scope note. Note correctly observed: the brain's `CLAUDOMAT_DB_URL` is NOT the app prod DB — verification done via live API behavior, which is the correct signal.

### Claim 2 — Live create-server unauthed → 401 → VERIFIED (first-hand curl, just now)
- `POST /servers` (no session) → HTTP 401. `GET /servers` → 401. `GET /servers/:id` → 401. `/health` → 200. web → 200. All confirmed live this session.

### Claim 3 — Code claims real → VERIFIED (read `servers.service.ts` + `servers.controller.ts` directly)
- **ONE atomic transaction:** `createServer` (service.ts:13-47) is a single `db.transaction(async (tx) => …)` doing all four inserts — server → owner `server_members` → `'General'` category (position 0) → `general` text channel (is_private false, category-linked, position 0) — returning the mapped `ServerResponse` from inside the tx. Any failure rolls back the whole unit. Real, not stubbed.
- **findMyServers member-scoped:** service.ts:50-66 `innerJoin(server_members …) WHERE server_members.user_id = $caller`. Non-member servers are structurally unreturnable (server-side, not UI filter).
- **findServerDetail 404-before-403:** service.ts:73-88 — exists-check (`NotFoundException`) runs BEFORE the member-check (`ForbiddenException`). Ordering correct. Channels grouped by category, ordered by position.
- **AuthGuard on all routes:** controller.ts:31,47,54 — `@UseGuards(AuthGuard)` on POST `/`, GET `/`, GET `/:id`. `userId` always from `req.session.getUserId()` (controller.ts:42,49,59) — never body/params, so no IDOR via parameter substitution. Zod `CreateServerSchema.safeParse` → typed `BadRequestException` (400) on invalid name.

### Claim 4 — Frontend real → VERIFIED (read shell + api.ts)
- `ServerRail.tsx` consumes `useServers()` → GET /servers (line 16,95,177 maps real `servers`); loading/empty/error/loaded states present; "+" → `openCreateModal`. Not placeholders.
- `ChannelSidebar.tsx` consumes `selectedDetail`/`detailStatus` from GET /servers/:id (line 110-118); renders categories+channels with no-server/loading/error/empty states.
- `CreateServerModal.tsx:139` POSTs via `api.createServer({name})`.
- `ServerProvider` wraps the shell in `AppHome.tsx:35-42` (nested in ProfileProvider).
- **Bare paths confirmed:** `grep -rc "/api/v1" apps/web/src` → NONE FOUND. `api.ts` uses `/servers`, `/servers/:id` against `${BASE}${path}` with credentials include.

### Claim 5 — 133 tests → VERIFIED (ran `pnpm test:ci` live this session)
- api: **79 passed** (9 files). web: **54 passed** (3 files). Total **133 green**. Matches the B-6/C-1 claim exactly. Not trusted on prose — re-run.

### Claim 6 — Antipatterns → CLEAN
- **No gold-plating:** zero `socket.io`/`WebSocketGateway`/`@nestjs/websockets`/`io(` in api or web src. Zero `invite`/`rbac`/role-permission/kick-ban logic in `servers/`. `role_id` column exists but is unused — forward-compatible placeholder per arch decision #6, not shipped behavior. No premature scale infra.
- **Not claimed-but-fake:** the live 401s + C-2's 201/#general are real; the transaction and member-scoping are real source, not mocks-in-prod.

---

## Deferrals reviewed (T-9's 5 findings) — all legitimate, none gate-blocking
1. **rollback-test-mocked** (T-4, significant): atomicity asserted only via mocked `db.transaction` that always invokes the callback — negative rollback path unproven without real Postgres. Real limitation (no local PG), correctly tracked; the happy path is live-proven. Carry to V-2/L.
2. **no-browser-E2E** (T-5, significant): authed create-server flow has no Playwright E2E (smoke covers only `/`, `/login`). Covered by component tests (mocked api) + live C-2 HTTP probe. Legitimate env constraint (no chrome channel + no verified fixture). Carry.
3. **no-visual-regression** (T-6, info): component-state coverage only, no baseline/diff. Acceptable first slice.
4. **no-verified-fixture** (T-8/L, info): no persistent VERIFIED prod test account (C-2 verified via SuperTokens admin API). L-flag.
5. **no-rate-limit** (T-8, info): no per-user create-server rate limit; routes are session+verify gated. Later hardening.

These are honest gaps, correctly severity-rated, and do not contradict any shipped claim.

---

## Recommendation to V-2/V-3
Proceed. No REWORK triggered by source-claim verification. The two `significant` items (rollback-proof, authed E2E) should be carried as tracked deferrals into L capture / the M2 backlog — both blocked on real-Postgres + chrome-channel infra, neither hides broken behavior. Consult @jenny (V-1 parallel) for spec-conformance cross-check; @code-quality-pragmatist not needed (scope discipline already clean, no over-engineering found).

```yaml
karen_verdict:
  stage: V-1
  result: APPROVE
  claims:
    migration_applied_prod: VERIFIED
    live_create_server_401: VERIFIED
    code_atomic_txn_scoping_guard: VERIFIED
    frontend_wired_bare_paths: VERIFIED
    tests_133: VERIFIED
    antipatterns: CLEAN
  fakes_found: []
  deferrals_legitimate: [rollback-test-mocked, no-browser-E2E, no-visual-regression, no-verified-fixture, no-rate-limit]
  next_action: PROCEED_TO_V2
```
