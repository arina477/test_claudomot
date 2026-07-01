# V-1 Karen — wave-29 source-claim verification (LIVE @ fd03d27)

**Verdict: APPROVE**

Scope: single-spec presence/members code-debt cleanup (seed d23a0740). Part 1 = displayName fallback `??`→`||` at 2 read sites. Part 2 = DELETE unused `ServerMembersResponseSchema` + type + barrel re-exports. Verified on `main` @ HEAD `133ae78`, which has `fd03d27` (the C-block merge, PR #42) as a confirmed ancestor — deployed state.

Every load-bearing claim holds. Findings below cite claim + evidence.

---

## Finding 1 — Part-1 code present as claimed | VERIFIED

**Claim:** servers.service.ts:249 = full `||`-chain (NOT `??`); presence.gateway.ts:125 = `||`-chain with `?.` preserved.

**Evidence:**
- `apps/api/src/servers/servers.service.ts:249` → `displayName: r.displayName || r.email.split('@')[0] || r.userId,` — full `||`-chain, both `??` gone. Exact P-4 LOCKED form.
- `apps/api/src/presence/presence.gateway.ts:125` → `const displayName = userRow?.display_name || userRow?.email?.split('@')[0] || userId;` — both `??`→`||`, optional-chaining `?.` on `userRow?` and `?.email?.split` preserved (correct — `userRow` can be undefined from the destructured empty result).

Both sites match the plan's locked form (P-3 steps 4+5) exactly. No `A ?? B || C` syntax error, no `?? (B||C)` variant that would miss the stored-empty guard.

## Finding 2 — Part-2 deletion complete | VERIFIED

**Claim:** `ServerMembersResponseSchema` + `ServerMembersResponse` GONE from servers.ts; BOTH barrel re-exports GONE from index.ts; `ServerMemberSchema`/`ServerMember` still live; ZERO remaining source refs.

**Evidence:**
- `packages/shared/src/servers.ts` (full read, 65 lines): `ServerMemberSchema` (:58-63) + `ServerMember` type (:64) present and intact. NO `ServerMembersResponseSchema`, NO `ServerMembersResponse` anywhere in the file.
- `packages/shared/src/index.ts`: value re-export block (:14-23) exports `ServerMemberSchema` but NOT `ServerMembersResponseSchema`; type re-export block (:24-33) exports `ServerMember` but NOT `ServerMembersResponse`. Both dead re-exports gone — no dangling `:34` type ref that B-4 typecheck would have caught (the P-4 REWORK concern is resolved).
- Grep across `apps/` + `packages/` (excluding `dist/`, `node_modules/`) for `ServerMembersResponseSchema` → **ZERO**. For `ServerMembersResponse` → **ZERO**. Deletion is complete and genuinely dead.

## Finding 3 — Deploy hash match + live health | VERIFIED

**Claim:** api + web serve fd03d27; api /health 200 + web root 200.

**Evidence:**
- `fd03d27` confirmed in main history (`refactor: presence/members code-debt cleanup (#42)`) and is an ancestor of HEAD.
- Live re-confirm: `GET https://api-production-b93e.up.railway.app/health` → **200**; `GET https://web-production-bce1a8.up.railway.app/` → **200**.
- C-2 deployment-state SUCCESS for both services accepted as source of truth for the served hash; live 200s corroborate.

## Finding 4 — No orphan migration | VERIFIED

**Claim:** no migration claimed; no orphan migration file.

**Evidence:** Plan §Data model = "No schema/migration. No DB change." `git diff --name-only fd03d27~1 fd03d27` touches ONLY the 6 source/spec files (servers.service.ts + .spec, presence.gateway.ts + .spec, shared/index.ts, shared/servers.ts) plus wave-29 process artifacts. No `*migrations*` path in the merge. No orphan migration exists.

## Finding 5 — Tests exist + honest | VERIFIED

**Claim:** 5 new displayName-guard tests (servers.service.spec ×4 + presence.gateway.spec ×1); the stored-empty test asserts fall-through to local-part (would fail under old `??`).

**Evidence:**
- `servers.service.spec.ts:1291` describe block `— displayName empty-fallback guard (wave-29)`: exactly **4** `it()`:
  1. `:1308` empty local-part + null display_name → falls through to `userId` (asserts `.not.toBe('')`, `:1321`)
  2. `:1324` stored-empty display_name `''` + normal email → falls through to local-part `'alice'` (`:1336`)
  3. `:1339` normal email + null display_name → local-part `'bob'`
  4. `:1353` non-null display_name → that value `'Carol Jones'`
- `presence.gateway.spec.ts:660` describe block `— handleConnection displayName empty-fallback guard (wave-29)`: exactly **1** `it()` (`:696`, empty local-part + null display_name → `USER_ID`, asserts `.not.toBe('')` at `:710`). Verified 1 real `it(` (earlier count noise was comment lines).
- **Honesty check (would-fail-under-old-`??`):** test 2 (`display_name=''` → expect `'alice'`). Under old `r.displayName ?? r.email.split('@')[0] ?? r.userId`, `''` is non-nullish so `??` returns `''`, and the assertion `toBe('alice')` fails. The test genuinely discriminates the fix from the old form — not coverage theater. Test 1 (empty local-part) similarly relies on `''` being falsy for `||` to fall through; passes with `||`, fails (returns `''`) with `??`.

Count = 4 + 1 = **5**, exactly as claimed. Tests are honest.

## Finding 6 — Antipattern catalog (incl. rule 2) | VERIFIED

- **Deletion targeted the right unused entity (rule 2 — dead code):** `ServerMembersResponseSchema` was the `{ members: [...] }` wrapper; the live wire for `GET /servers/:id/members` returns a bare `ServerMember[]` (unchanged, no controller/API step in the plan). Grep proves ZERO source consumers. The retained `ServerMemberSchema`/`ServerMember` are the element type still in live use. Correct entity deleted; no live contract touched.
- **Operator fix at the right layer:** the empty-string bug is a read-time resolution defect (falsy-but-defined local-part `''`). Fix applied at the exact two resolution sites (service read-map + gateway connection handler), display-string only, never used as a key — no boundary/transaction/permission surface. Right layer, minimal blast radius.

## Finding 7 — Product-decisions: wave-28 override-ship gap | CONFIRMED STILL OPEN (L-1 item, non-blocking)

**Claim:** the wave-28 override-ship gap jenny flagged at P-4 (no wave-28 floor-merge entry in product-decisions.md) still exists.

**Evidence:** `command-center/product/product-decisions.md` logs consecutive floor-merge override-ship entries for w23 (:300), w24 (:306), w25 (:312), w26 (:318), w27 (:325) — then jumps to a wave-28 entry (:331) that is an **RBAC invite-rotate drift** decision, NOT a P-1 floor-merge / override-ship record. Grep for `wave-28.*floor` / `wave-28 P-1` → no match. The under-floor override-ship rationale for wave-28 was never logged. The gap jenny flagged at P-4 is real and still open.

This is an **L-1 reconciliation / docs item**, not a wave-29 code defect — it does not block V-block APPROVE. Flagged for L-1 to backfill the missing wave-28 floor-merge entry.

---

## Summary

| # | Claim | Verdict | Severity |
|---|---|---|---|
| 1 | Part-1 `||`-chain both sites (`?.` preserved) | VERIFIED | — |
| 2 | Part-2 deletion complete, zero source refs, `ServerMember*` live | VERIFIED | — |
| 3 | Deploy hash fd03d27 + api/web 200 | VERIFIED | — |
| 4 | No orphan migration | VERIFIED | — |
| 5 | 5 honest guard tests (4+1); stored-empty fails under old `??` | VERIFIED | — |
| 6 | Dead-code deletion + right-layer operator fix | VERIFIED | — |
| 7 | wave-28 override-ship product-decisions gap still open | CONFIRMED | Low (L-1 docs, non-blocking) |

Every load-bearing claim holds in the deployed state. The one open item (finding 7) is a wave-28 documentation backfill for L-1, not a wave-29 functional defect.

**Verdict: APPROVE.**
