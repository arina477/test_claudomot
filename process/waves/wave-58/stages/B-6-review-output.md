# B-6 Review (Phase 2 — Test-correctness) — wave-58 delete-fanout-assert

**Branch:** `wave-58-delete-fanout-assert` @ `a691ef7`
**Scope:** TEST-ONLY — `apps/web/e2e/delete-any-message.spec.ts` (+24 / −16, 1 file)
**Change:** Replaced a pass-regardless soft-check of the cross-client `message:deleted`
fan-out with (a) a subscription-proof round-trip (A sends a probe, B hard-asserts it
arrives) + (b) a gating hard-expect on B's delete tombstone.

**Verdict: CLEAN — APPROVED.** No Critical / High / Medium issues. Two Low
(informational / optional-polish) notes.

---

## Hunt results

### 1. Gating — is the fan-out assertion a real gating expect?
**PASS.** Step 7 (line 170) is now:
```ts
await expect(pageB.getByText(bMessageMarker)).toBeHidden({ timeout: 12_000 });
```
No residual `.catch`, no `.then(() => true/false)`, no `console.log` soft-log, no skip.
The old `waitFor(...).then().catch()` "pass regardless" pattern is fully removed
(confirmed in diff — the entire soft block and its evidence `console.log` are deleted).
A broken fan-out path now FAILS the test. The probe assertion (line 142) is likewise a
hard `expect(...).toBeVisible({ timeout: 12_000 })` — no catch. Both are genuine gates.

**Tombstone semantics verified against source:** on `message:deleted`, the client
(`useMessages.ts:380`) sets `{ isDeleted: true, content: null }`, and `MessageList.tsx:1031-1052`
renders "This message was deleted" with the original content removed. So
`getByText(bMessageMarker)` genuinely transitions to hidden — `toBeHidden` is a correct
and observable signal for tombstone delivery, not a false-positive on a still-present node.

### 2. Flake risk
**LOW / acceptable.**
- **Marker collision:** three prefixes — `A-sent-`, `B-sent-`, `A-probe-`. `getByText` is a
  substring match, but none is a substring of another, so no cross-marker text collision.
  `Date.now()` values are produced at distinct `await` points (network round-trips between
  them) → different timestamps; even on a hypothetical same-ms tick the prefixes disambiguate.
- **Bounded windows:** 12s for both realtime assertions (probe arrival, delete fan-out) is
  reasonable against a Railway-hosted socket round-trip — consistent with the 10-15s windows
  already used elsewhere in this file. Not tight-flaky.
- **Probe → delete interference:** the delete target selector is
  `getByRole('article').filter({ hasText: bMessageMarker }).last()` — filtered on `B-sent-`,
  which the probe article (`A-probe-`) does not contain. The probe cannot be mis-targeted as
  the deletion subject. `.last()` is defensive against duplicate matches. No interference.

### 3. Subscription-proof validity
**PASS — sound.** Verified against `apps/api/src/messaging/messaging.gateway.ts`:
- `message.created` → `this.server.to('channel:${channelId}').emit('message:new', ...)` (line 169)
- `message.deleted` → `this.server.to('channel:${channelId}').emit('message:deleted', ...)` (line 196)

Both fan out to the **identical** room `channel:<channelId>`. B receiving A's probe
(`message:new`) therefore proves B's socket is joined to the exact room that later delivers
`message:deleted`. The comment's claim that `join_channel` is fire-and-forget with no ack is
accurate (`messagingSocket.ts:104-106` emits `join_channel` with no callback;
gateway `handleJoinChannel` does `socket.join(...)` server-side and emits no ack back).
The proof correctly closes the race the old comment described. Channel/context is correct:
both A and B navigate the SAME server (`ad62cd12`) / `#general` (`93982063`) via
`navigateToGeneralChannel`, and the probe is sent by A into that same channel B is viewing.
No hole.

### 4. No scope creep
**PASS.** RBAC/IDOR steps unchanged — Step 8 (B does NOT see the moderator-delete affordance
on A's message, `toBeHidden`) is byte-identical to `main`. The delete-affordance visibility
assertion (Step 5, moderator button visible to A) is unchanged. Diff is confined to Steps 5b
(new probe) and 7 (hardened tombstone assert). Test-only; no app/source code touched.

---

## Notes (Low — optional, non-blocking)

- **L1 (informational):** The probe adds a permanent extra message (`A-probe-<ts>`) to the
  shared proof channel `#general` on every run, alongside the pre-existing `A-sent-` /
  `B-sent-` accumulation. This channel already grows unbounded per run (no teardown of posted
  messages); the probe is one more line per run, not a new class of leak. If channel-history
  bloat is ever addressed, fold the probe into that cleanup. No action required now.

- **L2 (polish):** Line 143 comment says A "can optionally confirm their own probe appeared"
  but the test does not assert A's own probe visibility. This is intentional and correct (B's
  receipt is the actual proof), but the dangling "optionally" phrasing could read as a TODO.
  Consider trimming the parenthetical for clarity. Cosmetic only.

---

## Exit
Test hardening is correct, gates properly, and the subscription-proof is validated against
gateway source. Recommend **APPROVED** — proceed to B-6 head-B gate verdict.
