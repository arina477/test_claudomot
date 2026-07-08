# P-0 Problem-Framer — wave-79 (M13 leg-3: richer privacy / E2E DMs)

**Agent:** problem-framer (fresh context)
**Method:** symptom-vs-cause + PRODUCT-PRINCIPLES § Antipatterns red-team; all seed premises verified against live code (not decomposer prose).
**Milestone:** M13 (`## Class = product-feature`), leg-3 — the LAST autonomous M13 leg (identity-verification / B2B2C / success-metric are founder-reserved and correctly NOT in this bundle).

---

## VERDICT: **PROCEED** — with 5 binding refinements carried to P-2/P-3

This is a genuine, cause-level wave. The envelope design is truly server-blind (plaintext column goes NULL when a message is encrypted), not "ciphertext-alongside-plaintext" security theater. The reused primitives (fail-closed `profile-visibility.service`, append-only `privacy.service` audit, mature DM idempotency/blocking) exist and are correctly targeted. No reframe or split is warranted. Refinements below are constraints to lock at spec time, not defects that change the wave's shape.

---

## Symptom-vs-cause

- **Cause-level, confirmed.** The problem being solved is "the server can read every DM." The fix operates at the correct layer: keypair generation + encryption happen client-side (Web Crypto, private key never leaves the browser), the server stores only public key material (`user_encryption_keys`) and opaque ciphertext envelopes. This is real E2E, not a symptom-patch (e.g., "encrypt at rest with a server-held key," which would leave the server able to read — that would have been the wrong-layer trap, and the design avoids it).
- **Server-blind invariant is real.** Task 2's description explicitly persists ciphertext and leaves plaintext `content` NULL when encrypted. Verified this is a true server-blind path, not the misleading-title antipattern the prompt warned about.

## Premise verification (against live code)

| Seed claim | Reality | Note |
|---|---|---|
| `user_encryption_keys` is new | Confirmed absent — zero refs in codebase | Genuinely new; not a rebuild (rule 1 ✓) |
| `profile-visibility.service` is fail-closed, exposes profile_visibility/who_can_dm | Confirmed — documented FAIL-CLOSED, HIDDEN-default branches; `sharesServer()` reusable helper at L121 | Reuse target correct (rule 2 ✓) |
| `privacy.service` has append-only audit | Confirmed — `AppendPrivacyEventService.append()`, emits only on real change | Task-4 audit hook lands on real infra ✓ |
| `packages/shared/src/privacy.ts` exists | Confirmed — exports PROFILE_VISIBILITY / WHO_CAN_DM / Update+Response schemas | Extension point real ✓ |
| DM idempotency + backward-compat plaintext path | Confirmed — `UNIQUE(conversation_id, idempotency_key)` + onConflictDoNothing | Mature, reusable ✓ |
| **"leaves plaintext content NULL"** | **`dm_messages.content` is `text().notNull()` TODAY** | **DRIFT — see Refinement 2** |
| **"soft-delete tombstoning apply to ciphertext rows"** | **`dm_messages` has NO soft-delete / `deleted_at` column today** | **DRIFT — see Refinement 2** |
| `sendReadReceipts` / `showPresence` exist | Confirmed absent; presence emits unconditionally; NO read-receipt path exists at all | See Refinement 4 |

## Antipattern red-team

- **Security-theater (false lock icon):** The plaintext-fallback path (DM to a peer with no registered key) is the highest-risk honesty surface. The seed calls for a "calm indicator when a conversation is E2E vs plaintext-fallback" — acceptable IF the indicator never shows a lock/secure state on a fallback-plaintext message. **Binding — Refinement 3.**
- **Over-claiming / key-loss trap:** Private-key-in-browser-only means clear-storage / lost-device = permanently unreadable history + no multi-device. This is a *known, acceptable* E2E v1 posture — but only if named explicitly as a carried constraint, not silently shipped. **Binding — Refinement 5.** Not a blocker.
- **Demo-path tunnel vision:** Backward-compat plaintext path + "peer has no key yet" is the real (non-demo) path and is in-scope — good. No tunnel vision.
- **Wrong-layer:** None. Crypto is client-side; server is blind.
- **Task-4 thinness (read-receipt/presence toggles in an E2E-crypto wave):** These two privacy toggles are a *separable* privacy-settings concern with near-zero coupling to the crypto tasks (different tables, different services, no shared code path). This is a **P-1 thinness flag, NOT a reframe** — decomposer bundled a coherent "richer privacy" theme, which is defensible, but P-1 should confirm task-4 isn't padding the bundle and can stand or split cleanly. Additionally, task 4 as written silently assumes a read-receipt emit path exists to gate — **it does not** (no read-receipt feature ships today). **Refinement 4.**

---

## Binding refinements → P-2 (spec) / P-3 (plan)

1. **Server-blind invariant (load-bearing, security-critical).** Spec MUST state as a hard AC: when a message is stored encrypted, the plaintext column is NULL and the server never receives/logs plaintext. Add a non-happy AC proving the server cannot reconstruct plaintext from stored columns. This is the wave's core promise — it drives the **security-scope tightened gate at P-4** (auth/DM/cookies scope → T-8 Security stage is mandatory this wave).

2. **Migration must relax `content NOT NULL` and add the tombstone the seed assumes.** Decomposer prose drifts: `dm_messages.content` is `text().notNull()` today and there is NO soft-delete column. The Drizzle migration MUST (a) make `content` nullable (or split into `content` + `ciphertext` + `envelope_version` + `sender_key_ref` with a CHECK that exactly one of plaintext/ciphertext is populated), and (b) define the tombstone semantics for ciphertext rows explicitly rather than "inherit" a soft-delete that does not exist. Spec must not assume either exists.

3. **Honest E2E indicator (anti-security-theater AC).** The conversation indicator MUST NOT display any lock/secure/"encrypted" affordance on a message sent via the plaintext-fallback path. Spec needs an explicit AC: fallback-plaintext renders as visibly NOT-E2E (and ideally warns before first plaintext send to a keyless peer). A false lock icon is a ship-blocker at V/T-8.

4. **Task-4 scope guard.** `showPresence` gates an existing (unconditional) presence emit — fine. But `sendReadReceipts` has **no read-receipt feature to gate today** — no table, no emit path. P-1 must resolve: either (a) task-4 read-receipt toggle is descoped/deferred (a toggle over a non-existent feature is a no-op), or (b) the wave explicitly owns building the read-receipt emit path first, which materially grows the bundle beyond ~3,200 LOC. Flag to head-product at P-1. Presence toggle can proceed as-is.

5. **Key-loss + no-multi-device: name it, don't hide it.** Spec's carried-constraints section MUST state plainly (founder-facing, plain language): losing the device or clearing browser storage makes past encrypted messages permanently unreadable, and encrypted DMs work on one browser only (no multi-device). This is an accepted E2E v1 limitation — recorded, not solved this wave. Also record in `command-center/product/product-decisions.md` at P-2/P-3 as a deliberate posture, so it does not read as an accident later.

## Gate note for downstream
- Security-scope tightened: **YES** (touches DM content, key registry, profile-visibility reuse). T-8 Security stage + P-4 security gate are non-optional this wave.
- Fail-closed reuse: the new `GET /profile/:userId/encryption-key` MUST route through `profile-visibility.service` (or its `sharesServer()` helper) so peer-key fetch honors the SAME who_can_dm/profile_visibility gates as profile fetch — a key-fetch leak is a profile-visibility leak. Spec MUST state which gate governs key fetch (recommend: mirror `who_can_dm`, since fetching a key implies intent to DM).
