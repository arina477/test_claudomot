# V-1 Karen — wave-14 source-claim verification (M3 presence layer)

**Verdict: REJECT** — ship-blocking functional defect F-4 confirmed in deployed code.

- Deployed: `main @ ef6afbf` (PR #26). api `https://api-production-b93e.up.railway.app`, web `https://web-production-bce1a8.up.railway.app`.
- Scope of this review: source-claim verification of the three wave-14 specs (presence namespace, typing indicators, member-list panel) against live code + live endpoints. NOT a re-run of the full T-suite.
- Bottom line: the **infrastructure** (namespace, auth reuse, ref-counting, member panel, routes, no-migration) is genuinely built and live. The **typing-indicator feature is claimed-working-but-fake** — the core user-visible behavior (showing "X is typing" to other viewers) does not work as built. F-4 is real, root-caused, and confirmed in shipped code.

---

## Per-claim verdicts

### Claim 1 — Files exist as claimed → VERIFIED
All present and substantive (not stubs):
- `apps/api/src/presence/presence.service.ts` (211 lines)
- `apps/api/src/presence/presence.gateway.ts` (387 lines)
- `apps/api/src/presence/presence.module.ts` (13 lines)
- `apps/api/src/common/ws-auth.ts` (94 lines)
- `apps/api/src/servers/servers.controller.ts:76` — `@Get(':id/members')` exists
- `apps/web/src/shell/presenceSocket.ts` (215 lines), `MemberListPanel.tsx` (306 lines), `useTyping.ts` (167 lines), `usePresence.ts` (51 lines)
- `packages/shared/src/presence.ts` (101 lines)

### Claim 2 — Exports / registration → VERIFIED
- `PresenceModule` registered in `apps/api/src/app.module.ts:36` (imported `:10`).
- `PresenceGateway` declares `@WebSocketGateway({ namespace: '/presence' })` at `presence.gateway.ts:79-85`.
- **Shared ws-auth used by BOTH gateways** — `installWsAuthMiddleware` imported in `presence.gateway.ts:71` (called `:102`) AND `messaging.gateway.ts:27` (called `:83`). Genuinely factored, not duplicated. Value-import DI lesson honored (`presence.gateway.ts:74-77`, `presence.module.ts:9`).
- **PRESENCE_EVENTS values match client literals** — server `packages/shared/src/presence.ts:87-100` vs client mirror `presenceSocket.ts:36-43`: `presence:snapshot` / `presence:online` / `presence:offline` / `typing:start` / `typing:stop` / `typing:active` all identical. (Client deliberately re-declares the constants rather than runtime-importing them — documented CJS/rollup workaround at `presenceSocket.ts:32-35`; values verified equal by inspection.)

### Claim 3 — Routes live → VERIFIED
Live probes against the deployed api:
- `GET /health` → **200**
- `GET /servers/<uuid>/members` unauthed → **401** (auth guard live; no presence/membership leak)
- `GET /this-route-does-not-exist-zzz` (control) → **404**
- web root → **200**

### Claim 4 — Deploy serves merge commit, no migration → VERIFIED
- `git diff --name-only 71633ac ef6afbf` touching `drizzle/ | *.sql` returns **empty** — wave-14 introduced **no migration**, matching the in-memory presence claim (spec `data:` "No new table"; plan §Data model "No schema delta"). The `0006_wave13_*` migration in the broader range is wave-13's, not wave-14's.
- C-2 confirms both revisions SUCCESS; live endpoints above confirm the merge commit is serving.

### Claim 5 — Presence test files exist (+31 unit / +37 contract) → VERIFIED (existence)
- `apps/api/src/presence/presence.service.spec.ts` (12.3 KB)
- `apps/api/src/presence/presence.gateway.spec.ts` (22.1 KB)
- `packages/shared/src/presence.spec.ts` (13.7 KB)
Files exist and are substantial. I did not independently re-run the 419-count total (out of V-1 scope — that is T-block's gate); existence + size are consistent with the claimed coverage additions. **Caveat: see F-4 — the typing tests are present but encode the broken behavior (coverage theater), so the green suite does NOT prove typing works.**

### Claim 6 — F-4 typing fan-out → **WRONG (claim that typing works is false); F-4 defect CONFIRMED**

**This is the load-bearing finding. The B-6/T-block flag is correct — typing fan-out is genuinely broken in shipped code.**

Root cause (single mechanism, `presence.gateway.ts:381-386`):

```
private emitTypingActive(channelId: string, selfUserId: string): void {
  const typers = this.presenceService.getTypers(channelId, selfUserId);   // excludes the ACTOR
  this.server
    .to(`presence:channel:${channelId}`)                                  // broadcasts to WHOLE room
    .emit(PRESENCE_EVENTS.TYPING_ACTIVE, { channelId, typers });
}
```

- `emitTypingActive` is always called with `selfUserId` = the **actor** who just typed (call sites `:344` handleTypingStart, `:369` handleTypingStop, `:341` TTL-expiry, `:205` disconnect-cleanup).
- `getTypers(channelId, excludeUserId)` (`presence.service.ts:196-210`) strips `excludeUserId` from the returned list.
- The result — actor removed — is then broadcast to the **entire** `presence:channel:<channelId>` room via one `server.to(room).emit(...)`.

**Consequence:** when User A starts typing, every OTHER viewer (B, C) receives a typers list with **A removed** — i.e. they are never told that A (the only one actually typing) is typing. If A is the sole typer, all recipients get `typers: []`. The exclusion that should be *per-recipient* (don't show me my own typing) is instead applied *globally to the broadcast*, so it strips the wrong person for everyone else.

This directly violates spec AC (task 58633934): *"Other members CURRENTLY VIEWING the same channel see a '<name> is typing…' line"* — they will not, because the broadcast never contains the actor's name for them.

**Coverage theater confirmed (why the green suite missed it):** the gateway test `presence.gateway.spec.ts:373-407` mocks `PresenceService.getTypers` to return a fixed list and only asserts (a) the fan-out fires on the right room and (b) the payload has the right `channelId`. It never exercises the real self-exclusion-vs-whole-room interaction and never asserts the *actor appears in what a recipient receives*. With the service mocked, the bug is structurally invisible. Existence of tests ≠ correctness of behavior.

**Correct fix shape (for V-2/V-3 triage, not implemented here):** the actor-exclusion must be per-recipient, not per-broadcast. Either (a) emit the full typers list to the room and let each client filter out its own userId, or (b) use `socket.broadcast.to(room)` from the actor's socket with the full list (actor naturally excluded as sender) while the actor's own client suppresses self locally. The current "compute one actor-excluded list, send to everyone" model is structurally wrong.

---

## Severity-ranked gap summary

| # | Gap | Severity | Evidence |
|---|---|---|---|
| F-4 | Typing fan-out broadcasts an actor-excluded list to the whole channel room → other viewers never see the actor typing (sole typer → recipients get `[]`). Core typing AC unmet. | **Critical** | `presence.gateway.ts:381-386` + `presence.service.ts:196-210`; spec task 58633934 AC |
| — | Typing unit test asserts fan-out fires but mocks `getTypers` and never asserts recipients see the actor → green suite gives false confidence. | **High** (test honesty) | `presence.gateway.spec.ts:373-407` |

Presence (online/offline + multi-tab ref-count + membership-scoped fan-out + snapshot), member-list panel, ws-auth reuse, routes, and the no-migration claim are all VERIFIED with no gaps found at the source level.

---

## Recommendation
**REJECT** at V-1. Route F-4 to V-2 triage as **Critical** with the fix-shape above; the fix is small and well-localized (the broadcast model in `emitTypingActive` + a recipient-side or sender-broadcast adjustment) and must land with a test that asserts a *recipient* receives the actor in `typers` (not a mocked `getTypers`). Everything else in the wave is genuinely shipped and live — only the typing feature is claimed-working-but-fake.
