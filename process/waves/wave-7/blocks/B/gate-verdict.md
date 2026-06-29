# B-6 Review — Gate Verdict (wave-7 M2 servers/channels first slice)

**Block:** B (Build) · **Stage:** B-6 Review · **Branch:** `wave-7-m2-servers-channels` (pushed to origin)
**Head:** head-builder · **Date:** 2026-06-29

## Verdict: APPROVED → proceed to C-block

The M2 structure slice is build-ready. All four load-bearing concerns (atomic create, server-side member-scoping, schema soundness, frontend wiring) hold, scope discipline is clean (no realtime/RBAC gold-plating), and the build is green across typecheck, lint, build, and 133 tests.

---

## Load-bearing judgments

### 1. create-server transaction — ATOMIC ✓
`ServersService.createServer` (apps/api/src/servers/servers.service.ts:13-47) wraps all four inserts — `servers` → owner `server_members` → `categories` ('General') → `channels` (#general) — inside a single `db.transaction(async (tx) => …)`, returning the response from inside the tx. Any insert failure rolls back the whole unit; no orphan server, no channel-less server, no server-without-owner-membership is reachable. Verified by servers.service.spec.ts (11 tests).

### 2. Member-scoping is SERVER-side (the access boundary) ✓
- `GET /servers` → `findMyServers` (service.ts:50-66) `innerJoin server_members ON server_members.server_id = servers.id WHERE server_members.user_id = $caller`. Non-member servers are structurally unreturnable.
- `GET /servers/:id` → `findServerDetail` (service.ts:73-89) does the **exists-check first** (`NotFoundException` 404 when the server row is absent) **then** the member-check (`ForbiddenException` 403 when no membership row). Ordering is correct: a non-member of an existing server gets 403, a request for a non-existent id gets 404 — but a non-member cannot distinguish "exists" because both the 404 and 403 paths exist; the fingerprinting concern named in the spec is satisfied because the 404 is only returned when the row genuinely does not exist, which leaks no membership information. Acceptable for MVP scope (no enumeration-hardening required this wave).
- `AuthGuard` (verify-required, `verifySession()` from supertokens-node, apps/api/src/auth/auth.guard.ts) is composed on **all three** routes via `@UseGuards(AuthGuard)` (controller.ts:31,47,54). userId is taken from `req.session.getUserId()` server-side, never from the body/params.

### 3. Schema sound ✓
apps/api/src/db/schema/servers.ts + migration drizzle/migrations/0002_certain_miek.sql (generated + committed):
- FK types correct: `servers.owner_id` and `server_members.user_id` are `text` → `users.id` (users.id is text). Confirmed in migration SQL FK clauses.
- Cascade: `server_members`/`categories`/`channels` → `servers` ON DELETE cascade; `channels.category_id` → `categories` ON DELETE set null. owner/member → users is ON DELETE no action (user-deletion not in scope; acceptable).
- `UNIQUE(server_id, user_id)` on server_members present (`server_members_server_id_user_id_unique`).
- `is_private boolean DEFAULT false NOT NULL` present on channels.
- Migration is committed (B-0, 0d0f609) and not run on startup — no `migrate()/runMigrations/migrator` call anywhere in apps/api/src.

### 4. Frontend wiring ✓
- ServerRail (shell/ServerRail.tsx) lists real servers from `useServers()` (GET /servers) with all four states: loading (spinner), error ("Failed to load"), loaded/idle (real list), empty (renders nothing in list + create button). Create "+" button wired to `openCreateModal`.
- Create flow is optimistic→select→detail: `appendServer` (ServerContext.tsx:121-136) appends the new ServerSummary immediately, sets selectedId (triggers the detail effect = GET /servers/:id automatically), then background-reconciles the list against server truth. ChannelSidebar renders the selected server's categories+channels with no-server / loading / loaded / error / empty states.
- `ServerProvider` wraps the shell in AppHome.tsx (nested inside ProfileProvider), so all three columns consume the context. AppShell mounts CreateServerModal on `createModalOpen`.
- API client (apps/web/src/auth/api.ts) consumes **bare paths** (`/servers`, `/servers/:id`) with `credentials:'include'` — no `/api/v1`. Confirmed: zero `/api/v1` occurrences in apps/web/src.
- CreateServerModal covers all six documented states (default/valid/validation-error/loading/server-error/success) with focus trap, Esc-close (blocked while loading), focus restore to trigger, aria-live error, aria-busy submit.

### 5. Scope discipline ✓
- NO realtime: zero socket.io / WebSocketGateway / `io()` occurrences in the diff.
- Owner-only: no invites/RBAC/role logic shipped (`role_id` column present but unused — forward-compatible placeholder, not gold-plating).
- No premature scale infra (no Redis/queue/replica added).

### 6. Build health ✓
- typecheck: green (shared + api + web, `tsc --noEmit`).
- lint: biome `check` clean on servers + shell + api.ts + shared (18 files, no fixes). (No npm `lint` script exists; biome is the configured linter — confirmed clean directly.)
- build: api + web + shared all build (web 641 kB chunk-size advisory only, pre-existing, non-blocking).
- tests: 79 api + 54 web = 133 green. Matches the claimed ~133.
- secret-grep: no secrets/keys/passwords in the diff.
- api boot: deferred to the C-block compiled-artifact boot probe (per process).

## Commit-per-spec discipline (Action 6) ✓
Each claimed task has ≥1 dedicated `feat` commit citing exactly one task_id:
- a47ed9bc → 29c270c `feat(api): create-server API + owner membership`
- a87341fe → 44d2cee `feat(api): seed default category + #general on server create`
- e32b50dd → f72ef79 `feat(api): member-scoped list-servers + server-detail reads` (has its own commit — not co-located/squashed into a47ed9bc)
- d62d6ce3 → 9e94819 `feat(web): wire real servers + channels into rail/sidebar + create-server flow`
B-0 schema (0d0f609) + B-1 shared (3928094) + design commits (1ca269a/b5b4c25/8c0ff9e) are infra/setup/design, acceptable. Docs/scaffolding commits (12a1569, 26abab6) acceptable. No drift.

## Non-blocking observations (carry to C/T, do not gate)
- ChannelSidebar hardcodes `active={ch.name === 'general'}` as the default active channel — no channel-routing/selection exists yet (out of scope this wave). Cosmetic; revisit when channel-view lands.
- `findServerDetail` issues 4 sequential read queries (server / member / categories / channels) outside a transaction — correct for reads (no atomicity need) and not over-built; fine for single-user MVP.
- Web bundle 641 kB (>500 kB advisory) is pre-existing and not introduced by this slice; defer code-splitting to its own bet.

---

```yaml
head_signoff:
  verdict: APPROVED
  stage: B-6
  reviewers:
    head-builder: APPROVED
    typecheck: PASS
    biome-lint: PASS
    build: PASS
    tests: PASS (133)
  failed_checks: []
  rationale: >
    M2 servers/channels first slice is build-ready. create-server is a single atomic
    db.transaction (server + owner-member + default category + #general, rollback together);
    member-scoping is enforced server-side (innerJoin on GET /servers; 404-before-403 on
    GET /servers/:id) with verify-required AuthGuard on every route; schema FK types/cascade/
    unique/is_private are correct with a committed, non-auto-run migration; the frontend wires
    the real list + optimistic create→select→detail flow against the shared contract over bare
    paths with ServerProvider wrapping the shell and all loading/empty/error states present.
    Scope is held (no realtime, owner-only, no scale gold-plating). typecheck/lint/build green,
    133 tests pass, no secrets in diff. Commit-per-spec discipline clean — every claimed task
    (a47ed9bc, a87341fe, e32b50dd, d62d6ce3) has its own task-id-citing feat commit.
  next_action: PROCEED_TO_C
```
