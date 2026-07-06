# V-1 Karen — source-claim verification (wave-54, StudyHall)

**Verdict: APPROVE**

Scope: verify-and-harden wave (NOT a leak fix — info-disclosure class was closed in wave-53). Verified against merge-commit tree `97c8e99` on `main` (branch --contains: `main`; main HEAD `0b8c985` is one commit ahead — the C+T process commit) and deployed Railway state. All 7 load-bearing claims TRUE. No scope creep, no schema, no genericization of authz-denial strings.

---

## Claim-by-claim findings

### 1. Canonical constant exists + exports WS_GENERIC_ERROR — TRUE
- `apps/api/src/common/ws-errors.ts:15` — `export const WS_GENERIC_ERROR = 'Something went wrong';`
- File is new in the diff (`+15` lines). Doc comment explicitly fences the constant OFF from authz-denial ("Forbidden: …") and payload-validation strings — matches the design intent that authz literals stay distinct.

### 2. In-catch generic literals swapped; Forbidden authz literals UNCHANGED — TRUE
- **study-timer.gateway.ts** (at `97c8e99`):
  - `:52` — `import { WS_GENERIC_ERROR } from '../common/ws-errors';`
  - `:190` — unknown-error catch now emits `message: WS_GENERIC_ERROR` (diff: `-'Internal error checking membership'` → `+WS_GENERIC_ERROR`).
  - `:197` — `'Forbidden: not a member of this server'` PRESENT and unchanged (grep-confirmed in tree; not in diff hunks).
- **messaging.gateway.ts** (at `97c8e99`):
  - `:35` — import present.
  - `:134` — catch emits `WS_GENERIC_ERROR` (diff: `-'Internal error checking channel access'` → `+WS_GENERIC_ERROR`).
  - `:139` — `'Forbidden: cannot view channel'` PRESENT and unchanged.
- Exactly 2 production `.ts` files, one literal swap each. Diff hunks touch only the import line + the single catch-emit line per file — no other logic changed.

### 3. Regression tests across 3 gateways assert the full matrix — TRUE
- **study-timer.gateway.spec.ts** (new, +378): `LEAK-1a` malformed non-UUID → `expect(msg).toBe(WS_GENERIC_ERROR)` (`:204`) + `SQL_LEAK_TOKENS` absence loop `not.toContain` (`:207-208`) + denied; `LEAK-1b` generic Error → generic, no leakage; `LOCK-1` valid-UUID non-member → `expect(msg).toBe('Forbidden: not a member of this server')` AND `not.toBe(WS_GENERIC_ERROR)` (`:275-276`) — specific NOT genericized; `FLOW-1` legit member join works (`:288`).
- **messaging.gateway.spec.ts** (+97): `LOCK-MSG-1` malformed → `toBe(WS_GENERIC_ERROR)` (`:608`) + leak-token loop (`:619`); `LOCK-MSG-2` valid-UUID non-authorized → `toBe('Forbidden: cannot view channel')` + `not.toBe(WS_GENERIC_ERROR)` (`:642-643`); `LOCK-MSG-3` authorized → join succeeds.
- **presence.gateway.spec.ts** (+83): `LOCK-PRES-1` non-UUID → Zod rejects before RBAC/DB, RBAC not called, SQL tokens absent (`:691`); `LOCK-PRES-2` valid-UUID non-authorized → `toBe('Forbidden: cannot view channel')` (`:714`); `LOCK-PRES-3` authorized → join succeeds.
- All three assert the required quartet: malformed→generic, leak-tokens-absent, denied, AND valid-UUID-non-member→specific-Forbidden-preserved.

### 4. No schema/migration — TRUE
- `git show 97c8e99 --stat` grep for migration/`.sql`/drizzle/dexie → NONE. Diff is: constant + 3 specs + 2 one-line gateway swaps + process docs only.

### 5. Deploy serves 97c8e99; /health 200 — TRUE
- `C-2-deploy-and-verify.md:3` — "Deployed commit == merge SHA 97c8e99 on both services (stale-revision guard PASS)."
- `:14-15` — api + web both `state: SUCCESS, commit: 97c8e99`.
- Live probe now: `https://api-production-b93e.up.railway.app/health` → **200**.

### 6. No scope creep — TRUE
- Production gateway diff hunks: grep for `isUuid`/`safeErrorMessage` on the added lines of study-timer + messaging `.ts` → NONE. (isUuid appears only in process-doc prose explaining why B was dropped, never in production code.)
- wave-53 study-room gateway: NOT in the diff file list (`git show --name-only` has no `study-room*gateway.ts`). safeErrorMessage/isUuid untouched.
- No REST controller changes, no shared WS-error filter. Matches the P-0 reframe non-goals exactly.

### 7. websocket-engineer in AGENTS.md — TRUE
- `command-center/AGENTS.md:85` — `websocket-engineer` row present (B-3 realtime gateway work, pre-built VoltAgent).

---

## Bullshit-detection notes
- No coverage theater: the LOCK tests genuinely distinguish generic vs specific by asserting BOTH `toBe(Forbidden…)` AND `not.toBe(WS_GENERIC_ERROR)` on the authz path — a future refactor that genericized the Forbidden string would fail these. This is a real regression lock, not a green-by-assertion.
- The wave is honestly scoped as verify-and-harden: it does not claim to fix a live leak (there is none), and it did not smuggle in the dropped isUuid-B defense-in-depth. Claims match code.
- Only load-bearing gap-of-note (non-blocking): main HEAD is `0b8c985`, one commit past the merge — that is the expected wave-54 C+T process-doc commit, no production code beyond `97c8e99`. Deploy is pinned to `97c8e99`, so deployed == verified tree.

**APPROVE** — every load-bearing claim is true in the merged + deployed state.
