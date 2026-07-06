# V-1 — jenny (independent intent-verification) — wave-58

**Verdict: APPROVE**

Deployed behavior (merge SHA `65b92fb`, PR #73, now `main` HEAD) satisfies the
*intent* of every acceptance criterion in the `wave-58-spec` contract, not merely
the literal wording. The one divergence from the spec text — a production code
change on a spec that declared "test-only, no production change" — is a healthy
**spec gap**, not drift: honest hardening exposed a real, pre-existing
cross-client delete bug that HAD to be fixed for the assertion to pass. Tagged
below for next wave's P-2 learning.

Methodology: read the authoritative spec (task a1dda389 YAML), read the current
`delete-any-message.spec.ts`, read the full PR #73 delta (production reconcile +
DTO round-trip + socket-handler fix), traced the backend emit contract, and
re-ran the E2E against DEPLOYED prod (`https://web-production-bce1a8...`).
Independent of Karen.

**Live proof:** `pnpm --filter @studyhall/web exec playwright test delete-any-message`
against deployed prod → **2 passed (8.4s)**. Re-run confirmed.

---

## Finding-by-finding (spec section → deployed evidence)

### F1 — AC-1 (hard-assert B receives fan-out; soft-check removed) — MET
- **Spec:** "delete-any-message.spec.ts HARD-ASSERTS … that client B receives
  the message:deleted fan-out … The pass-regardless soft-check
  (.catch(false)+console.log) is REMOVED."
- **Evidence (drift-clean):** `apps/web/e2e/delete-any-message.spec.ts:171` is
  now `await expect(pageB.getByText(bMessageMarker)).toBeHidden({ timeout: 12_000 })`
  — a gating expect. The old block (removed in the PR diff) was exactly
  `.waitFor(...).then(()=>true).catch(()=>false)` + `console.log(... pass regardless ...)`.
  Grep for `catch(false)|catch(() => false)|console.log|soft` in the file → NONE.
- **Confirms**, not diverges.

### F2 — AC-2 (race-free: B's subscription confirmed ESTABLISHED before A deletes) — MET
- **Spec:** "B's socket channel-room subscription is confirmed ESTABLISHED
  before A issues the delete (await a join-ack / ready signal)."
- **Context honored:** at P-2, both reviewers confirmed there is **no join-ack
  primitive** — `joinChannel` (messagingSocket.ts) is fire-and-forget, server
  emits no ack. The spec's "await a join-ack / ready signal" is therefore
  satisfied by an equivalent realtime round-trip proof, which is the only sound
  mechanism available.
- **Evidence:** `spec.ts:138-142` — Step 5b: A sends `aProbeMarker`; B
  hard-asserts `await expect(pageB.getByText(aProbeMarker)).toBeVisible({ timeout: 12_000 })`.
  `message:new` and `message:deleted` fan out to the **same** room
  (`channel:<channelId>` — confirmed at `messaging.gateway.ts:182` and `:196`).
  B receiving the probe proves B's socket is live in that exact room, so the
  subsequent delete fan-out cannot be missed to a join race. This directly
  satisfies edge-case "the join-ack gate must actually confirm B is subscribed
  (not just page-loaded)" — the probe is a realtime-delivery proof, strictly
  stronger than page-load.
- **Confirms.**

### F3 — AC-3 (bounded RETRIED window, not one-shot) — MET
- **Spec:** "assertion uses a BOUNDED RETRIED window (Playwright expect
  auto-retry), NOT a fixed one-shot that flakes."
- **Evidence:** the gate is `await expect(...).toBeHidden({ timeout: 12_000 })`
  (spec.ts:171). Playwright `expect()` auto-retries the matcher until it passes
  or the 12s budget elapses — bounded + retried by construction. The removed
  soft-check used a single `waitFor` swallowed by `.catch`. Edge-case "bounded
  retried window sized so a working fan-out passes reliably but a broken one
  fails": the live run tombstoned well inside the window (whole test 8.4s).
- **Confirms.**

### F4 — AC-4 (test FAILS if fan-out breaks; verifiable-gating) + RBAC/IDOR unchanged — MET
- **Spec:** "test now FAILS if B does not receive the fan-out (verifiable —
  reverting the fan-out would fail it). The RBAC/IDOR portions … are UNCHANGED
  and stay green."
- **Gating verifiable by construction:** line 171 is a bare `await expect`, no
  `.catch`, no soft wrapper — if B's tombstone never appears the matcher
  exhausts its 12s budget and throws, failing the test. The wave's own history
  is the empirical proof it gates: the hardened assertion FAILED across cycles
  1-3 (DIAG instrumentation commit 4685429 captured B's WS frames precisely
  because :171 was red) until the production fan-out path was actually fixed —
  i.e. a broken fan-out demonstrably fails this test.
- **RBAC/IDOR untouched:** the PR diff to the spec file adds only Step 5b
  (probe) and swaps the soft-check for the hard assertion. Step 3 (A sees
  "Delete message (moderator)" on B's msg → `spec.ts:150-153`), Step 6
  confirm-delete affordance, and Step 8 (B does NOT see mod-delete on A's msg →
  `spec.ts:183-187` `toBeHidden`) are byte-unchanged from the wave-44 baseline.
  Both green in the live run.
- **Confirms.**

---

## The scope-expansion call: SPEC GAP (not drift) — tag for P-2 learning

- **What the spec said:** `contracts: { api: NONE (test-only, no production
  change), test: soft-check→hard assertion }`; P-2 pointer: "Test-only."
- **What deployed:** PR #73 additionally ships a **production fix** —
  `packages/shared/src/messaging.ts` (adds `idempotencyKey` to
  `MessageResponseSchema`), `apps/api/.../messages.service.ts` `rowToDto`
  (maps `idempotency_key → idempotencyKey`, no migration), `messagingSocket.ts`
  (`MessageDeletedPayload` retyped from `{messageId, channelId}` →
  `MessageResponse`), and `useMessages.ts` (deterministic key-matched optimistic
  reconcile + `message:deleted` handler reading `payload.id` +
  `confirmedIdToKeyRef` tombstone-own-message path).
- **Why this is a GAP, not uncontrolled drift — the load-bearing root cause:**
  the old client handler matched deletes on `payload.messageId`, but the backend
  gateway emits the **full `MessageResponse` DTO** (`messaging.gateway.ts:196`
  `emit('message:deleted', message)`), which has **no `messageId` field**. So
  `m.id === payload.messageId` compared against `undefined` and NEVER matched —
  cross-client tombstones were **silently dropped in production**. Separately,
  the author's own client kept a stuck optimistic copy because `drain()`'s
  `onDelivered` was dropped by a re-entrancy guard. Both are genuine
  user-visible defects on a moderation feature (a moderator deletes a message;
  other members' — and the author's own — clients keep showing it). The spec's
  "test-only" framing simply **under-anticipated** that an honest race-free
  gating assertion would surface real bugs. The correct engineering response was
  to fix them — a pass-by-suppression alternative (keeping the assertion soft)
  would have been the actual violation.
- **Scope is bounded and healthy:** the fix is minimal and reuses the existing
  `idempotency_key` column (no DB migration), the DTO field is
  `nullable().optional()` (backwards-compatible), and the reconcile is
  identity-based (exact key match) rather than a content heuristic. No
  gold-plating observed.
- **P-2 learning tag:** *When a spec hardens a "pass-regardless" soft-check into
  a gating assertion, do NOT pre-declare `api: NONE / test-only`. Hardening a
  previously-masked path routinely surfaces the production defect the soft-check
  was hiding; the spec should budget a production-fix contingency (or at minimum
  flag the contract as `test + potential-production` pending B-block findings).*

---

## Independence note
Verdict reached without sight of Karen's output. Verification rests on: the DB
spec YAML, the current test file, the full PR delta, the backend emit contract
(`messaging.gateway.ts:196`), and a live re-run against deployed prod (2 passed).

**APPROVE.**
