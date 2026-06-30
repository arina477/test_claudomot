# Wave 12 — B-block Gate Verdict (B-6 Review)

**Block:** B (Build) · **Wave topic:** M3 real-time messaging · **Stage:** B-6 Review (block-exit)
**Branch:** `wave-12-m3-messaging` (pushed, HEAD `e0e21bd`)
**Gate owner:** head-builder · **Date:** 2026-06-30

---

## Verdict: APPROVED → hand off to C-block (head-ci-cd)

The four load-bearing security invariants hold, the contract is locked and single-sourced, the
migration is generated+committed (no auto-migrate), idempotency + keyset pagination are correct,
and the suite is green (316 tests; typecheck/build/lint clean). No firing-grade defect present.
Two real-but-non-blocking backend hardening notes are routed to V/H2, not gated here.

---

## Reviewer matrix (independent of author)

| Reviewer | Role | Verdict |
|---|---|---|
| code-reviewer | correctness + security | 4 core invariants HOLD; 3 MAJOR raised (1 false-positive, 2 non-blocking — see adjudication) |
| code-quality-pragmatist | over-engineering (self-use MVP) | Lean where it matters; suggestions are V/L-2 polish, not blockers |
| jenny | spec fidelity (7 ACs) | FIDELITY CONFIRMED on all 7 claims; no Critical/High drift |

## Reviewer adjudication (head reconciliation)

1. **`@nestjs/event-emitter@^3.1.0` vs Nest 10 "peer mismatch" (code-reviewer MAJOR)** — FALSE POSITIVE.
   Verified the published peer range is `@nestjs/common: ^10.0.0 || ^11.0.0`; `pnpm-lock.yaml`
   resolves it cleanly against `@nestjs/common@10.4.22`. No mismatch, no boot risk. API boots and
   wires the gateway (proven: 11 gateway-spec tests pass, DI resolves RbacService, io.use runs).
2. **Non-idempotent (null-key) send race (code-reviewer MAJOR, jenny+pragmatist Low)** — REAL, NON-BLOCKING.
   The web client always sends a `crypto.randomUUID()` idempotency key, so the production path is
   fully idempotent and dedup-safe. The racy fetch-latest path is reachable only by direct API
   callers and violates no AC or security invariant. Routed to V-block / L-2 as a `.returning()`
   cleanup. Not a B-6 blocker.
3. **No live-socket eviction on access revocation (code-reviewer MAJOR)** — REAL, OUT OF M3 SCOPE.
   Join-time gating is server-side and correct (`canViewChannelById` re-derived on every join).
   Evicting an already-joined socket on later RBAC change is a known hardening item; not in the M3
   spec ACs and not firing-grade for a self-use MVP. Noted for V/H2.

---

## Stage-exit checklist (B-6 Review)

- [x] Code reviewed by agents other than its author (code-reviewer, code-quality-pragmatist, jenny) [STABLE]
- [x] code-quality-pragmatist found no over-engineering blocking the MVP scope (suggestions are deferrable polish)
- [x] Every surfaced failure root-cause classified + routed; no debug-by-deploy console.log changes [STABLE]

## Carry-forward gate checks (B-1 / B-2 / B-3 verified at exit)

- [x] **Zod single source** — `packages/shared/src/messaging.ts` is the contract; controller derives DTO via `SendMessageSchema.safeParse`. No off-contract fields.
- [x] **Migration generated + committed** — `drizzle/migrations/0005_boring_satana.sql` matches schema (UNIQUE(channel_id, idempotency_key), both FKs, channel cascade, btree index). No startup auto-migrate.
- [x] **Protected routes compose guards** — `@UseGuards(AuthGuard, ChannelMessageGuard)` on POST + GET; order correct (session attached before RBAC read).
- [x] **WS auth at upgrade, not first message** — `messaging.gateway.ts` `server.use()` (io.use) in `afterInit`; cookie `sAccessToken` primary + `handshake.auth` fallback; `getSessionWithoutRequestResponse` + `assertClaims(isVerified)`; fail-closed `catch → next(Unauthorized)`; `socket.data.userId` attached. Tested (gateway spec, 11 tests).
- [x] **No cross-channel leak** — `join_channel` re-derives `canViewChannelById` server-side (joins only on true); `@OnEvent('message.created')` → `server.to('channel:<id>').emit` room-only, never `server.emit` broadcast-all. Tested.
- [x] **Author no-spoof** — `author_id = req.session.getUserId()` in controller; `SendMessageSchema` has no `authorId` field. IDOR-safe (channelId from `@Param` only).
- [x] **Channel-gating server-side, private default-deny** — `canViewChannel`: private → `overrideCanView === true` only. Tested (403 non-member private channel).
- [x] **Idempotency** — `ON CONFLICT(channel_id, idempotency_key) DO NOTHING` + canonical re-fetch; UNIQUE enforces no dup on outbox flush. Tested.
- [x] **Pagination cursor/keyset, never offset** — `(created_at, id)` DESC keyset with tiebreak, `limit+1` sentinel, no OFFSET.
- [x] **Offline/optimistic path** — `useMessages.ts` renders optimistic pending row (client idempotencyKey) before POST; confirm/fail→retry reuses key; id-dedup prevents doubling; channel-switch leaves old room + joins new.
- [x] **No scale gold-plating** — single-pod in-memory Socket.IO adapter; no Redis / multi-replica / queue. IoAdapter wired in `main.ts`; `EventEmitterModule.forRoot()` in `app.module.ts`.
- [x] **Build health** — 316 tests pass (api 200 incl. gateway 11 + guard 5; web 116); typecheck FULL TURBO green; biome lint clean; build green. Static imports only.
- [x] **No secrets in diff** — secret-grep of added lines clean (only session-cookie names, idempotency keys, env-var reads).

## Commit-per-spec (Action 6)

| Task | Commit | Coverage |
|---|---|---|
| B-0 schema/event-emitter | `28839a5` | messages table + EventEmitterModule |
| B-1 shared contract | `3d92252` | Zod messaging.ts |
| a0c322b4 (REST) | `c68abea` | messages REST + canViewChannelById + ChannelMessageGuard |
| 723b5b6a (gateway) | `f602b95` | Socket.IO WS-upgrade auth + room fan-out |
| d999d29c (UI) | `495e799` | optimistic message UI |
| B-2/B-3/B-5 records | `e0e21bd` | stage docs |

Each spec task → ≥1 dedicated commit. ✓

---

## Handoff notes to downstream blocks

- **C-2 (head-ci-cd):** Verify Railway WS-Upgrade passthrough — HTTP `/healthz` green does NOT prove
  the `/messaging` Socket.IO namespace is live. Do not false-green on a dead WS server.
- **T-8 / V (realtime proof):** The **two-client <1s** real-time delivery proof is a T-8/V concern and
  is NOT verified at B-6 (single-process gateway-spec tests prove fan-out logic, not cross-client
  wire delivery). `realtime_verified` remains FALSE at B-block exit — must be proven downstream.
- **V-block / L-2 deferrals (non-blocking, routed):** (1) collapse null-key `createMessage` to a
  `.returning()` insert to remove the racy fetch-latest path; (2) consider live-socket eviction on
  RBAC revocation (H2 hardening).

---

```yaml
head_signoff:
  verdict: APPROVED
  stage: B-6
  reviewers:
    code-reviewer: invariants-hold-3-major-adjudicated
    code-quality-pragmatist: lean-suggestions-deferrable
    jenny: fidelity-confirmed-7-of-7
  failed_checks: []
  rationale: >
    All four firing-grade security invariants verified present and tested — WS-upgrade auth runs at
    connect via io.use (not first message, fail-closed, assertClaims), channel-gating is server-side
    and default-deny (canViewChannelById, IDOR-safe route-param), fan-out is room-scoped never
    broadcast-all with server-side join re-derivation (no cross-channel leak), and author_id is
    session-derived (no spoof). Contract is Zod-single-sourced; migration generated+committed with no
    auto-migrate; idempotency UNIQUE-enforced; pagination keyset not offset; single-pod no-Redis (no
    scale gold-plating). 316 tests / typecheck / build / lint green; diff secret-clean. The three
    code-reviewer MAJORs adjudicate to one false-positive (event-emitter peer range includes Nest 10,
    resolves clean) and two real-but-non-blocking backend notes (null-key send race is unreachable on
    the production keyed path; live-socket revocation eviction is out of M3 scope) — both routed to
    V/H2, neither an AC or invariant violation. realtime_verified stays FALSE (two-client wire proof
    is a T-8/V concern, flagged in handoff).
  next_action: PROCEED_TO_C
```
