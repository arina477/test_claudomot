# Architecture Branch: Test

branch: test
version: v6
status: draft
last_updated: 2026-06-26
authors: v6 architecture pass

---

## Summary

StudyHall is a dark-themed desktop communication app (PWA) backed by NestJS + Postgres, Socket.IO realtime, LiveKit voice/video, and an IndexedDB-backed offline-first sync engine. The test architecture covers five distinct concerns, ordered by testing difficulty:

1. **Offline-first** (the wedge, feature 12) — cache reads, outbox queue, reconnect reconciliation, and conflict resolution; the hardest-to-test surface and the highest-value investment.
2. **Realtime** (Socket.IO messaging and presence, features 7–8, 14) — requires two-client or network-frame verification; single-client assertions are insufficient (see anti-pattern in test-writing-principles rule §12).
3. **Voice/video** (LiveKit, feature 13) — SFU media plane is opaque to test code; boundary-level mock strategy is mandated.
4. **Standard HTTP/service/component** (all other H1 features) — covered by the Vitest + Supertest + RTL stack.
5. **End-to-end user flows** (F1–F9 from user-journey-map) — Playwright MCP live swarm, persona-partitioned.

The test stack is locked in `stack-decisions.md`: **Vitest** (unit + integration), **Supertest** (HTTP layer), **React Testing Library** (component), **Playwright MCP** (live E2E swarm). No substitutions without a new stack-decisions entry.

---

## Inventory

### Layer map (T-1 through T-9)

| T-layer | Tool | Scope | Location |
|---------|------|-------|----------|
| T-1 Static | Biome + `tsc --noEmit` | Lint + type-check all packages | CI job; no test files |
| T-2 Unit | Vitest | Pure functions, service logic in isolation, React component render + interaction | co-located `*.unit.test.ts` / `*.unit.test.tsx` |
| T-3 Contract | Vitest + Zod parse assertions | `@studyhall/shared` Zod schemas; API response shapes | co-located `*.contract.test.ts` |
| T-4 Integration | Vitest + Supertest + real Postgres | NestJS service + controller + DB round-trips; offline sync engine state transitions | `packages/api/tests/integration/` |
| T-5 E2E | Playwright MCP swarm | Full user flows F1–F9 against a deployed or local-full-stack environment | `packages/web/tests/e2e/` |
| T-6 Layout | Playwright screenshot baselines | Critical dark-theme component visual regression | `packages/web/tests/layout/` |
| T-7 Perf | Vite bundle-size CI assertion + Playwright `performance.measure` | Bundle size budget; messaging channel TTI | `packages/web/tests/perf/` |
| T-8 Security | Vitest (unit) + Supertest (HTTP) | RBAC guards, IDOR, JWT lifecycle, rate-limit smoke | `packages/api/tests/security/` |
| T-9 Journey | Playwright MCP + manual audit | Regenerate `user-journey-map.md`; scenario smoke across all 16 pages | Per T-9 stage file |

### Package-level coverage targets

| Package | Coverage target | Tier-1 branch coverage | Notes |
|---------|----------------|------------------------|-------|
| `packages/api` (NestJS) | every service method has ≥1 happy + error path | 80% branch on Auth, RBAC, offline-sync service | Integration-weighted; unit covers pure logic |
| `packages/web` (React SPA) | every exported component has ≥1 render + interaction test | 80% branch on offline store module, connection-state machine | RTL-weighted |
| `packages/shared` (Zod schemas) | 100% schemas have parse-valid + parse-invalid tests | n/a (no branches — data schemas) | Cheap; must be complete |
| `packages/offline-sync` | 80% branch coverage | 80% (Tier 1 — the wedge) | See §Hard-to-test surfaces |

T-1 / T-2 / T-3 fire on every wave with code changes. T-4 fires when a service, controller, or DB schema is touched. T-5–T-9 follow block-dispatcher skip rules.

---

## Conventions

### File naming and co-location

- Unit and contract tests: co-located with their source file at the same directory level.
  - `auth.service.ts` → `auth.service.unit.test.ts`
  - `MessageBubble.tsx` → `MessageBubble.unit.test.tsx`
  - `message.schema.ts` → `message.schema.contract.test.ts`
- Integration tests: `packages/api/tests/integration/<module>.integration.test.ts`
- E2E tests: `packages/web/tests/e2e/<flow>.e2e.spec.ts` — named after the flow ID from user-journey-map (e.g. `f3-realtime-messaging.e2e.spec.ts`)
- Security tests: `packages/api/tests/security/<module>.security.test.ts`
- Layout baselines: `packages/web/tests/layout/snapshots/` (gitignored; regenerated per T-6 stage)

### AAA structure

Every test body uses explicit `// Arrange`, `// Act`, `// Assert` comment blocks (test-writing-principles rule §2). No exceptions; deviations require an inline comment naming why.

### Mock policy

- **Unit tests (T-2):** mock at the outermost boundary the unit touches — the data-access layer (Drizzle repository), external SDKs (SuperTokens client, LiveKit SDK), and Socket.IO server instance. Never mock internal helpers.
- **Integration tests (T-4):** no mocks for Postgres; use a real test database (see §Test data). Mock only genuinely external I/O that cannot be containerized: SuperTokens Core HTTP calls (nock/msw interceptor), LiveKit server API calls, Railway Buckets S3 calls.
- **Component tests (T-2/RTL):** mock the API client boundary (React Query hooks or fetch interceptor). Never mock React internals or DOM APIs.
- **E2E tests (T-5):** no mocks at all by default; test against the full running stack. Exception: LiveKit media plane (see §Hard-to-test surfaces).
- Mock factories over ad-hoc mocks: when ≥3 tests share a shape, extract to `tests/helpers/factories/<entity>.factory.ts`.

### Frontend component queries

Use `getByRole` / `getByLabelText` / `getByText` exclusively. `getByTestId` is forbidden (test-writing-principles rule §4). This constraint doubles as an accessibility check.

### NestJS controller tests (Supertest, T-4)

- Boot the app via `NestFactory.create(AppModule)` in a `beforeAll` block; call `app.close()` in `afterAll`.
- Assert HTTP status codes + response envelope shape, not internal service call counts.
- Always test: (a) success path, (b) validation rejection (400), (c) auth rejection (401 before 403 — guard stacking order per test-writing-principles rule §9).

### Test isolation

- Each integration test runs inside a Postgres transaction; roll back in `afterEach` unless the test requires committed state (e.g. reconnect-sync tests that spawn two connections).
- `vi.clearAllMocks()` in every `afterEach` in unit suites.
- No `beforeAll` state mutation that bleeds across `it` blocks in unit suites.

---

## Reusability principles

### Test helpers

`packages/api/tests/helpers/` contains:
- `db.ts` — exports `createTestDb()` (spins up a test Postgres connection, runs migrations, returns a Drizzle client) and `truncateAll()` for reset between tests that cannot use transaction rollback.
- `factories/` — entity factories (user, server, channel, message, assignment) using the `@studyhall/shared` Zod schemas as the canonical shape. Factories always produce valid-by-default objects; named overrides per test.
- `app.ts` — exports `createTestApp()` (NestJS `TestingModule` with all providers; integration tests swap specific providers for mocks via `overrideProvider`).
- `socket-client.ts` — exports `createTestSocketClient(url, authToken)` wrapping `socket.io-client` for integration-level socket tests.
- `offline-harness.ts` — see §Hard-to-test surfaces.

`packages/web/tests/helpers/` contains:
- `render.tsx` — custom RTL `render` that wraps the component tree with React Query client, React Router `MemoryRouter`, and the offline-store provider. Every component test uses this wrapper.
- `factories/` — mirrors the API factory shapes for frontend state seeding.
- `socket-mock.ts` — `MockSocketProvider` that replaces the real Socket.IO client with an in-memory event emitter, enabling deterministic event injection in component tests.

### Shared Zod schemas as test contracts

`@studyhall/shared` Zod schemas are the single source of truth for API request/response shapes. Contract tests (T-3) parse real API responses through these schemas and assert `.success === true`. This catches API/contract drift without duplicating shape assertions in every integration test.

### Playwright page objects

Each flow in the user-journey-map gets a page-object class under `packages/web/tests/e2e/pages/`. Page objects expose action methods (e.g. `sendMessage(text)`, `joinVoiceRoom()`) and query helpers (e.g. `getLatestMessageText()`), never raw locators. Locators use `getByRole` / `getByLabel` / `getByText` mirroring the RTL convention above.

---

## Cross-references

| Concern | Architecture branch |
|---------|-------------------|
| IndexedDB shape + outbox queue schema | `databases.md` §Client-side IndexedDB |
| NestJS module contracts (inputs/outputs) | `modules.md` §Inventory |
| Auth guards + RBAC model | `security.md` |
| Socket.IO namespace + event catalog | `services.md` §Realtime service |
| Test account provisioning | `command-center/testing/test-accounts.md` (filled at v13 / first wave B-5) |
| User-journey-map (persona flows consumed by Playwright swarm) | `command-center/artifacts/user-journey-map.md` |
| Test-writing master guide | `command-center/testing/test-writing-principles.md` |
| Per-layer stage files | `claudomat-brain/blocks/test/stages/T-{1..9}-*.md` |
| T-layer principles (project-specific patterns) | `command-center/principles/test-layer-principles/T-{1..9}.md` |

---

## Stack-specific decisions

### Vitest configuration

- Root config at `vitest.config.ts` (monorepo root); per-package `vitest.config.ts` files extend it.
- Separate test projects for unit (`include: ['**/*.unit.test.*']`) and integration (`include: ['**/tests/integration/**']`) so `pnpm test:unit` and `pnpm test:integration` run independently.
- Integration tests run with `pool: 'forks'` (process isolation) because they hold real DB connections.
- Unit tests run with `pool: 'threads'` (faster).
- `globals: true` — no per-file `import { describe, it, expect } from 'vitest'` boilerplate.
- Coverage via `@vitest/coverage-v8`; thresholds enforced only on Tier-1 packages (`packages/api/src/auth`, `packages/api/src/rbac`, `packages/offline-sync/src`) at 80% branch.

### Supertest + NestJS

Use `@nestjs/testing` `TestingModule` + `supertest(app.getHttpServer())`. Do not start a real TCP listener in tests; call `app.init()` without `.listen()`.

### React Testing Library

`@testing-library/user-event` v14 for all interactions (no `fireEvent`). `@testing-library/jest-dom` matchers imported via `vitest.setup.ts`.

### Playwright MCP swarm

- 5 parallel MCP instances (one per tester agent) per the §15.6 swarm pattern in test-writing-principles.
- Swarm is persona-partitioned: each tester agent owns one or more flows from the user-journey-map and a dedicated test account from `command-center/testing/test-accounts.md`.
- Never `browser_close` mid-swarm (test-writing-principles rule §23).
- Network panel instrumentation installed before navigation for any test touching Socket.IO or LiveKit signaling (rule §13).
- E2E config at `packages/web/playwright.config.ts`; base URL parameterized via `BASE_URL` env var (local full-stack or Railway staging).

### Test database

- A dedicated Postgres database (`studyhall_test`) distinct from `studyhall_dev` and `studyhall_prod`.
- Drizzle migrations applied via `pnpm db:migrate:test` before the integration suite runs.
- CI spins up Postgres via the `services:` block in GitHub Actions (`postgres:16-alpine`); `DATABASE_URL` injected as env var.
- Transaction-rollback isolation by default; `truncateAll()` helper for tests that require committed state.

---

## Hard-to-test surfaces

### 1. Offline-first (the wedge — Tier 1, must be well-tested)

The offline-first engine (`packages/offline-sync`) is the highest-risk, hardest-to-reproduce surface. It has four independently testable concerns:

**a. Cache reads (no network)**

Unit tests (T-2, Vitest): instantiate the sync engine with a real Dexie instance pointed at a fake-IndexedDB (via `fake-indexeddb` npm package — no browser required). Seed the local DB directly. Assert that `getMessages(channelId)` returns cached rows and that no network calls are made. The `fake-indexeddb` approach keeps these tests fast, deterministic, and runnable in Node.

**b. Outbox queue (offline send)**

Unit tests: set the engine to disconnected state (`engine.setConnected(false)`). Call `sendMessage(text)`. Assert the message appears in the `outbox` table in fake-IndexedDB with `status: 'pending'` and does NOT emit a socket event. Verify the optimistic local ID is returned immediately to the caller.

Integration tests (T-4): use `createTestSocketClient` but drop the connection before the send. Assert the outbox row is persisted in the real Postgres test DB after reconnect and flush (see §c).

**c. Reconnect sync**

Integration tests (T-4) — these cannot use transaction rollback because they require two commits:
1. Seed server-side messages M1, M2 in the test Postgres DB (simulating messages received while offline).
2. Instantiate the sync engine with fake-IndexedDB containing an outbox entry O1.
3. Call `engine.reconnect(serverCursor)` against the real NestJS test server via `createTestSocketClient`.
4. Assert: O1 is flushed (socket `message:send` emitted, Postgres row created), M1 and M2 are pulled into the local cache, and the local cursor advances.
5. Assert idempotency: calling `reconnect` a second time with the same cursor does not duplicate rows.

E2E tests (T-5, Playwright): navigate to a channel, use `page.context().setOffline(true)` to simulate network loss, compose a message (assert it appears locally with a pending indicator), call `page.context().setOffline(false)`, assert the pending indicator resolves and the message appears in a second browser context (cross-client verification per rule §20).

**d. Conflict resolution**

Unit tests: the conflict resolver is a pure function `resolve(localVersion, serverVersion) → resolvedMessage`. Test all conflict cases via the transition matrix approach (test-writing-principles §10): `(local-edit, no-server-edit) → local wins`, `(local-edit, server-edit) → last-write-wins by server timestamp`, `(local-delete, server-edit) → local-delete wins`, etc. Use the factory to produce versions with controlled `updatedAt` timestamps. Illegal transitions (missing required fields on either version) must throw a typed error, not silently discard.

**Offline test helper (`offline-harness.ts`)**

Exports:
- `createOfflineEngine(options)` — engine instance backed by `fake-indexeddb`, connected to a real or mock socket, with controllable `connected` state.
- `dropConnection(engine)` / `restoreConnection(engine, serverCursor)` — deterministic network-state switches for integration tests.
- `assertOutboxLength(engine, n)` — assertion helper that reads fake-IndexedDB directly.

### 2. Realtime — Socket.IO message delivery and presence

**Single-client tests are insufficient** for verifying Socket.IO delivery (test-writing-principles anti-pattern §12: "One user 'sees their own message' claim = real-time works"). Two-client or network-frame verification is required.

**Unit tests (T-2):** test the message dispatch service (`MessageGateway`) in isolation using the NestJS `@nestjs/testing` socket mock. Assert that `server.to(channelId).emit('message:new', payload)` is called with the correct shape. This verifies the server emits — not that the client receives.

**Integration tests (T-4):** use `createTestSocketClient` to connect two authenticated test clients (sender and receiver) to the test NestJS server. Sender calls the `message:send` socket event. Assert: (a) the receiver's socket client receives `message:new` within a timeout, (b) the Postgres row is committed, (c) a third client that joins the channel after the send does NOT receive the same event again (no replay). Presence: assert `presence:join` is emitted to the channel room when a client connects, and `presence:leave` when it disconnects.

**E2E tests (T-5, Playwright):** open two browser contexts with two test accounts in the same channel. Sender types and sends. Assert the message appears in the receiver context's viewport. Install the `WebSocket` network interceptor before navigation to capture socket frames as network-layer evidence (rule §14).

### 3. Voice/video — LiveKit

LiveKit's media plane (WebRTC ICE negotiation, DTLS, media tracks) is not E2E-testable in headless Playwright without real network conditions and media devices. The testing boundary is drawn at the LiveKit signaling layer.

**What IS testable:**

- **Unit (T-2):** the NestJS `VoiceRoomService` method that calls `livekit-server-sdk` to create/delete rooms and generate access tokens. Mock the LiveKit server SDK at the boundary (`vi.mock('livekit-server-sdk')`). Assert: correct room name, correct participant identity, correct grants in the generated token. Assert error paths: SDK throws → service returns a typed `LiveKitError`.
- **Integration (T-4):** the `POST /voice-rooms/:channelId/join` endpoint via Supertest. Mock the LiveKit SDK as above. Assert: 200 with `{ token: string, wsUrl: string }` for an authorized member; 403 for a non-member; 401 for unauthenticated.
- **Component (T-2/RTL):** the `VoiceRoom` React component renders the LiveKit `<LiveKitRoom>` provider with the correct props (token, serverUrl, room name). Mock `@livekit/components-react` at the module boundary — replace `<LiveKitRoom>` with a stub that exposes props via `data-testid` attributes for assertion only (exception to the no-testid rule, justified by the need to assert props on a mocked external component boundary).
- **E2E (T-5, Playwright):** verify the user can navigate to the voice channel route (`/servers/:id/voice/:channelId`), the LiveKit `<LiveKitRoom>` mounts (DOM presence check), the mic/cam toggle controls render. Do NOT assert media track state — that requires real hardware and real ICE. Mark media-plane assertions as `// NOT E2E TESTABLE — requires real ICE/DTLS; covered by LiveKit's own test suite`.

**What is NOT testable in this suite:** ICE candidate exchange, DTLS handshake, audio/video track encoding, SFU routing, screen-share capture. These are infrastructure concerns owned by LiveKit's SDK test suite. Document them as explicit scope exclusions in `packages/web/tests/e2e/f4-voice-video.e2e.spec.ts` header comments.

---

## Risk / open items

| # | Risk | Severity | Mitigation |
|---|------|----------|------------|
| 1 | `fake-indexeddb` behavior diverges from real browser IndexedDB in edge cases (cursor iteration, index ordering) | Medium | Run a subset of offline-sync unit tests in a real browser via Playwright `page.evaluate` injection at T-5 for the highest-risk paths (conflict resolution, cursor advance). |
| 2 | Reconnect-sync integration tests require committed Postgres state and cannot use transaction rollback; test DB may accumulate state across runs | Medium | Use `truncateAll()` in `afterAll` for reconnect-sync describe blocks; mark these tests as `@slow` and exclude from the default watch mode. |
| 3 | Two-client Socket.IO integration tests are order-sensitive (receiver must be connected before sender emits) | Medium | Use `Promise.race([receiverReady, timeout(2000)])` in the arrange step; assert the receiver is connected before proceeding to Act. |
| 4 | Playwright E2E against the full local stack requires all services running (NestJS, Postgres, Socket.IO, SuperTokens); brittle in CI if startup order is wrong | High | Add a `wait-on` step in the GitHub Actions E2E job that polls `GET /health` on the API before starting Playwright. |
| 5 | LiveKit voice/video media plane is completely untestable at E2E level | Known/accepted | Documented in §Hard-to-test surfaces; boundary mock is the mandated strategy. Revisit if LiveKit introduces a test-room SDK. |
| 6 | Test account provisioning not yet populated | Blocker for T-5 | `command-center/testing/test-accounts.md` filled at v13 / first wave B-5. E2E tests cannot run against prod auth until then. |
| 7 | Offline-first `packages/offline-sync` package does not exist yet (exact library chosen at v6) | Blocking for T-2/T-4 offline tests | Test harness design in this document is library-agnostic (Dexie + custom sync layer assumed as primary candidate); revisit `offline-harness.ts` design when library is locked. |
| 8 | Coverage thresholds on `packages/offline-sync` (80% branch, Tier 1) cannot be enforced in CI until the package exists | Low until v6 | Add the threshold to `vitest.config.ts` as a commented block with a `TODO(v6-offline)` marker; uncomment when the package is created. |
