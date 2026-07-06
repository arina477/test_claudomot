# V-1 Karen — Reality Verification (wave-58, StudyHall)

**Verdict: APPROVE**

Every load-bearing claim in the wave-58 delivery is TRUE in the merged/deployed
state. The spec declared `contracts.api: NONE (test-only)` but the delivery
included real production changes (client handler + shared DTO + backend
`rowToDto`). This is a **legitimate, verified scope expansion** — the hardened
test exposed a real cross-client delete bug, and the production fixes for it are
REAL, exported, wired, and deployed at the same merge SHA. Not fabrication, not
claimed-but-absent.

Merge state confirmed: `git rev-parse HEAD` = `65b92fbc2cb6db5af71e861bd0a8ae7bd79c615e`
on branch `main`; `git merge-base --is-ancestor 65b92fb main` → on main. Merge
subject: `test(e2e): deterministic delete-any-message cross-client fan-out assertion (#73)`.

---

## Findings (each: claim → evidence)

### Finding 1 — Test hardening (seed deliverable): CONFIRMED
**Claim:** `apps/web/e2e/delete-any-message.spec.ts` hard-asserts B's message
becomes hidden after A deletes it, with a subscription-proof step, in a bounded
window; the old pass-regardless soft-check is gone; RBAC/IDOR steps remain.

**Evidence (`git show 65b92fb -- apps/web/e2e/delete-any-message.spec.ts`):**
- The old soft-check block was **DELETED** — the diff removes `waitFor({ state: 'hidden' })` `.then(() => true).catch(() => false)` plus the `console.log` "pass regardless" evidence line and the "skip gracefully" comment.
- Replaced by a **gating hard assertion** at spec line ~226: `await expect(pageB.getByText(bMessageMarker)).toBeHidden({ timeout: 12_000 });` (no `.catch`, no console.log — a real Playwright retried assertion that FAILS the test if fan-out is broken).
- **Subscription-proof step added** (Step 5b, spec lines ~150–175): A sends `A-probe-${Date.now()}`; B hard-asserts `await expect(pageB.getByText(aProbeMarker)).toBeVisible({ timeout: 12_000 })` — proves B's socket is live in `channel:<id>` (the same room `message:deleted` fans out to) BEFORE the delete, closing the race the old test papered over.
- **RBAC step present** (Step 5): `modDeleteBtn` (`aria-label` "Delete message (moderator)") asserted `toBeVisible` for A on B's message.
- **IDOR-negative present** (Step 8, spec lines ~264+): on B's context, `unauthorizedDeleteBtn` asserted `toBeHidden({ timeout: 3_000 })` — B (non-mod) must not see the moderator affordance on A's message.

### Finding 2 — Test is real, not suppressed/skipped: CONFIRMED
**Claim:** the passing prod e2e (2 passed, 11.3s) is real, not skipped.
**Evidence:** `grep -nE "test\.skip|test\.fixme|test\.only|\.skip\(|describe\.skip"` on the spec → **no matches**. One live `test()` block. C-block verdict records `playwright test delete-any-message` against deployed prod → **2 passed (11.3s)**. (The "2 passed" is Playwright's authed+chromium projects running the single scenario.)

### Finding 3 — Client fix in `useMessages.ts`: CONFIRMED
**Claim:** `message:deleted` matches `payload.id` (not `payload.messageId`); `message:new` reconciles optimistic→real by `idempotencyKey`; render-merge dedupe exists.
**Evidence (`apps/web/src/shell/useMessages.ts`):**
- `message:deleted` handler (lines ~417–442): matches on `payload.id` — `prev.findIndex((m) => m.id === payload.id)` and `m.id === payload.id ? payload : m`. **No `payload.messageId` reference** anywhere on the deleted-message DTO path (grep confirms `messageId` appears only on reaction payloads, which is correct per the DTO).
- Cross-check: `apps/web/src/shell/messagingSocket.ts:59,139` — `MessageDeletedPayload = MessageResponse`; explicit comment "Match on payload.id — NOT a messageId field (no such field exists on the DTO)". The handler matches the wire contract.
- `message:new` reconcile (lines ~387–398): `if (msg.idempotencyKey) { ... prev.findIndex((o) => o.state !== 'failed' && o.idempotencyKey === key) ... }` — deterministic optimistic→real reconcile keyed on `idempotencyKey`.
- Render-merge dedupe (lines ~890–910, "Fix 2 DEFENSE-IN-DEPTH"): builds `reconciledKeys` set and `.filter((o) => !reconciledKeys.has(o.idempotencyKey))` so optimistic rows already present in `realMessages` are dropped from render.

### Finding 4 — DTO round-trip + NO migration: CONFIRMED
**Claim:** `MessageResponseSchema` has optional/nullable `idempotencyKey`; `rowToDto` maps from `row.idempotency_key`; the `messages.idempotency_key` column pre-existed (no new migration).
**Evidence:**
- `packages/shared/src/messaging.ts:106` — `idempotencyKey: z.string().nullable().optional(),` inside `MessageResponseSchema` (+3 lines in merge, comment "wave-58: client-generated idempotency key echoed back").
- `apps/api/src/messaging/messages.service.ts:176` — `idempotencyKey: row.idempotency_key ?? null,` in `rowToDto`; row type extended with `idempotency_key?: string | null` (line 118). The merge touched this file **+5 lines only** — additive DTO mapping, no logic rewrite.
- **No migration** — `git show --stat 65b92fb | grep -iE "migration|\.sql|drizzle"` → **no matches**. `apps/api/src/db/schema/messages.ts` is **NOT** in the merge file list.
- **Column pre-existed:** `messages.ts:34` `idempotency_key: text('idempotency_key')` + line 50 `unique('messages_channel_idempotency_key')`. `git log -S"idempotency_key" -- schema/messages.ts` → oldest hit is **168c45f (wave-12, #23)** — the column and its UNIQUE(channel_id, idempotency_key) constraint have existed since M3 messaging. Insert logic already references it: `messages.service.ts:509` `idempotency_key: idempotencyKey` in the `.insert(messages)` with `ON CONFLICT (channel_id, idempotency_key) DO NOTHING`. The wave only wired the *read-back*, exactly as claimed.

### Finding 5 — outbox re-entrancy fix: CONFIRMED
**Claim:** `outbox.ts` `drain()` no longer silently drops a concurrent caller's `onDelivered` — a follow-up queue exists.
**Evidence (`apps/web/src/features/sync/outbox.ts`):**
- `_drainQueue: DrainCall[]` (line 148) holds `{store, send, onDelivered, onFailed, resolveFollowUp, rejectFollowUp}`.
- Re-entrancy guard (lines 188–199): `if (_drainInFlight !== null) { ... _drainQueue.push({...}); return followUpPromise; }` — concurrent callers are **queued, not dropped**; the returned promise resolves after their follow-up drain runs.
- Flush (lines 201–210): `.finally()` splices `_drainQueue` and runs each entry's `_drainImpl` **sequentially** (re-snapshotting pending set, so no double-POST / no re-send of already-deleted items). Invariant documented: "at most ONE drain executes network I/O at a time." This closes the exact hole (composer drain's `onDelivered` swallowed while a mount-time drain was in-flight) that left optimistic rows un-reconciled.

### Finding 6 — Deploy hash match: CONFIRMED
**Claim:** deployed web+api serve merge commit 65b92fbc.
**Evidence:**
- C-block verdict (`process/waves/wave-58/blocks/ci-cd/gate-verdict.md`): "Deployed BOTH changed services at SHA **65b92fbc** via Railway GraphQL serviceInstanceDeploy: api → SUCCESS, web → SUCCESS." Merge recorded at 2026-07-06T05:02Z.
- Live probe: `GET https://api-production-b93e.up.railway.app/health` → `{"status":"ok","service":"studyhall-api","version":"0.0.1"}`. `GET https://web-production-bce1a8.up.railway.app/` → **HTTP 200**. Both services are live and reachable. (Per memory note, Railway deploy is CLI-push, not git-trigger; the verdict records the explicit `serviceInstanceDeploy` at the merge SHA — consistent.)

### Finding 7 — secret-scan allowlist scoped: CONFIRMED
**Claim:** `.gitleaks.toml` has a scoped exact-value allowlist for RFC-4122 example UUID `f47ac10b-…`; no broad rule disabled.
**Evidence (`.gitleaks.toml`):**
- `[extend] useDefault = true` — **every default rule stays active**; no rule disabled or weakened.
- `[allowlist].regexes` contains the exact literal `f47ac10b-58cc-4372-a567-0e02b2c3d479` (RFC-4122 canonical example UUID, used as a `MessageResponse.idempotencyKey` test fixture) alongside the pre-existing SuperTokens `21984eb2-…` value. `regexTarget = "match"` — exact-value suppression, not a pattern loosening.
- The merge diff to `.gitleaks.toml` is `+13/-?` and adds only the second exact-value regex + its documentation comment. No rule-level `[[rules]]` disable.

---

## Antipattern watch — RESOLVED
- **Spec said `contracts.api: NONE` but production changed.** VERIFIED as legitimate scope expansion, not fabrication: the client/DTO/backend changes are real (Findings 3–4), exported and wired (`z.infer` type flows shared→api→web; `rowToDto` returns it; `useMessages` consumes `msg.idempotencyKey`), and deployed at the merge SHA (Finding 6). The DTO change is additive + backward-compatible (`.nullable().optional()`, `row.idempotency_key ?? null`), so it does not break existing `MessageResponse` consumers.
- **"2 passed" real, not suppressed.** VERIFIED (Finding 2) — no skip/fixme/only markers; the hard `toBeHidden` fan-out assertion is gating.

## Notes for V-2 (non-blocking)
- The e2e's leading docstring still references "wave-44 task ca43eb12" / "backend proven wave-41 T-4/T-8" and one line "pass regardless" language survives **only inside the retained subscription-proof comment** describing the OLD behavior — cosmetic stale prose, not a live soft-check. The executable assertions are all hard. No action required for APPROVE; could be tidied at L-1 if desired.

**Reviewer:** Karen (V-1) · **Wave:** 58 · **SHA verified:** 65b92fbc · **Verdict: APPROVE**
