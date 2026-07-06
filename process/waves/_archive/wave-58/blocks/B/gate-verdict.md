# Wave 58 — B-6 Gate Verdict (Phase 1, head-builder independent)

**Block:** B · **Wave:** delete-any-message E2E fan-out hard assertion · **Branch:** `wave-58-delete-fanout-assert` @ `a691ef7` · **Mode:** automatic
**Verdict:** **APPROVED**

## Scope
Test-only. One file: `apps/web/e2e/delete-any-message.spec.ts` (+24/-16). No production change, no schema, no deps, no contract. Confirmed by `--stat` and by diff inspection — the only RBAC/IDOR-adjacent line in the diff is the file header; steps 6 (mod-delete affordance visible to A) and 8 (hidden to non-mod B) are byte-unchanged.

## The key question: does the new assertion genuinely GATE? — YES

### 1. Soft-check removed — PASS
The pass-regardless block at the old `:146-162` is entirely gone. Confirmed removed in diff:
- `.waitFor({ state: 'hidden' }).then(() => true).catch(() => false)` — GONE
- `console.log('[E2E ...] Socket fan-out to B: ... NOT_DELIVERED_IN_WINDOW ...')` — GONE
- the `fanOutDelivered` variable and the `biome-ignore noConsoleLog` — GONE
No residual `.catch` on the fan-out path. No pass-regardless remains.

### 2. The assertion gates — PASS
Replaced with a single real gating expect (new `:170`):
`await expect(pageB.getByText(bMessageMarker)).toBeHidden({ timeout: 12_000 })`
No `.catch`, no `.then`, no try/skip, no `test.skip`. If B never receives the `message:deleted` tombstone, `bMessageMarker` stays visible and the expect throws → test RED. No escape hatch. Bounded retried window (Playwright expect auto-retry, 12s) — passes a working fan-out, fails a broken one.

### 3. The ready-gate is a REAL subscription proof (the critical P-4 carry) — PASS, soundness verified against source
The new Step 5b (`:127-141`) has A send a fresh probe (`aProbeMarker`) and hard-asserts B receives it via realtime:
`await expect(pageB.getByText(aProbeMarker)).toBeVisible({ timeout: 12_000 })` — no catch.

Soundness verified by reading the delivery code, not by trusting the comment:
- **Same room, load-bearing.** `apps/api/src/messaging/messaging.gateway.ts`:
  - `handleJoinChannel` → `socket.join('channel:'+channelId)` (:143), gated by server-side `rbacService.canViewChannelById` (:132) — no client trust.
  - `message:new` → `server.to('channel:'+channelId).emit(...)` (:169)
  - `message:deleted` → `server.to('channel:'+channelId).emit(...)` (:196)
  - `message:new` and `message:deleted` fan out to the **identical** room string. B receiving the probe (`message:new`) is direct proof B's socket is a live member of `channel:<id>` — the exact room that delivers `message:deleted`.
- **Not a page-loaded / "online" wait.** The proof is an end-to-end realtime round-trip through the server room, not a WebSocket-open check. The comment correctly notes `joinChannel` (messagingSocket.ts:104-106 → `emit('join_channel')`) is fire-and-forget with no ack — verified: the gateway sends no ack/event back on successful join, so a round-trip probe is the only available subscription proof (no join-ack primitive exists — matches the P-4 finding).
- **Temporal validity.** Socket.IO room membership is sticky: once `socket.join` completes it persists until `leave_channel`/disconnect. The test issues no leave between the probe (:140) and the delete (:158). B is provably in the room at probe time and remains in it when the delete fires ~microseconds later. The probe closes exactly the race the old NOTE documented.

### 4. No scope creep — PASS
One test file; RBAC/IDOR steps unchanged; no production change. The backend fan-out itself is unmodified (proven wave-41 T-4/T-8); this wave only removes test dishonesty.

## Anti-pattern scan
- Single-client realtime — RESOLVED. This is the fix: two contexts, B asserts on A's action, not its own echo.
- Green-by-suppression — RESOLVED. No catch/skip remains on either gating assertion.
- Debug-by-deploy console.log — RESOLVED. The evidence console.log is deleted.

## Residual note (not blocking)
The full "fails when fan-out broken" proof is CI-only (e2e cannot run locally). Honesty-by-inspection here is complete: by construction the assertion throws if B does not receive the tombstone. Green on CI = the assertion is satisfiable against the real fan-out. head-ci-cd must confirm this spec runs and passes in the CI e2e job (not skipped/quarantined) before merge — carry to C-block.

```yaml
head_signoff:
  verdict: APPROVED
  stage: B-6
  reviewers: { head-builder: APPROVED }
  failed_checks: []
  rationale: >
    The pass-regardless soft-check (.catch(false)+console.log NOT_DELIVERED) is fully removed
    and replaced by a real gating expect(...).toBeHidden with no escape hatch — the test now
    goes RED if B never receives the message:deleted tombstone. The ready-gate is a sound
    subscription proof, not an online/page-loaded wait: A sends a probe and B hard-asserts it
    arrives via message:new, which — verified in messaging.gateway.ts — fans out to the exact
    same 'channel:<id>' room as message:deleted. Socket.IO room membership is sticky and no
    leave occurs before the delete, so B is provably subscribed when the delete fires. No
    join-ack primitive exists, making the round-trip probe the correct proof. Test-only,
    RBAC/IDOR steps byte-unchanged, no production/schema/contract change. All three P-4
    mandatory carries satisfied by logic.
  next_action: PROCEED_TO_B-close
```
