# Wave 79 — V-block Gate Verdict (Phase 1)

**Stage:** V-3 (block exit gate)
**Block:** V (Verify)
**Wave:** 79 — M13 leg-3a: server-blind E2E DM encryption (key registry + encrypted envelope + client Web-Crypto + honest fail-closed indicator)
**Deployed:** merge `0fa0f5f`, LIVE — api `https://api-production-b93e.up.railway.app` · web `https://web-production-bce1a8.up.railway.app`
**Mode:** automatic · **Security-critical**
**Verdict source (head-verifier agentId):** head-verifier / claude-opus-4-8
**Attempt:** 1

---

## VERDICT: **APPROVED**

The security posture holds and the V-2 triage is sound. Both crown-jewel invariants — **server-blind persistence** and the **honest fail-closed indicator** — are PROVEN against live production state (not asserted), by two independent axes (Karen source/reality, jenny semantic/deployed-behavior) plus the merge-blocking CI integration matrix. 0 blocking findings; 3 non-blocking correctly tasked (`wave_id=NULL`, seedable); 4 noise correctly dismissed with measured evidence. No REWORK-worthy hole found: no suppressed finding lets the server read an encrypted DM, and no path shows a false padlock.

---

## Judgment against the security bar

### 1. Karen + jenny sound + evidence-backed; server-blind PROVEN (not assumed) — YES
- **Karen (reality axis)** verified server-blind three ways, none by assertion: (a) live prod-DB schema probe over `DATABASE_PUBLIC_URL` — `user_encryption_keys` present with **zero private-key columns**, `dm_messages.content is_nullable=YES`, envelope cols present; (b) content-NULL traced through every server egress — the two `logger.debug` calls log IDs only, last-message preview uses a fixed `'Encrypted message'` placeholder, gateway `toDto` passes ciphertext verbatim / never decrypts; (c) integration spec is real (`pg-harness` real Postgres, separate-connection SELECT read-backs incl. `count(*) WHERE content IS NOT NULL = '0'` — a no-plaintext-anywhere proof), not mocked.
- **jenny (semantic axis)** fetched the single live encrypted message: `content:null` + opaque AES-GCM `{iv,ct}` envelope on the wire; 29 prior plaintext rows carry content with envelope NULL (AC3 no-regression). Independent of Karen's axis and mutually corroborating.
- **extractable=false** confirmed at source (`generateKey(EC_PARAMS, false, …)`, no `privateKey` export anywhere; IndexedDB stores the non-extractable handle) AND live (smuggled `privateKey` PUT field silently stripped; no private column). **Not acceptance-by-assertion.**

### 2. V-2 triage correct — no load-bearing item downgraded to noise — YES
- **F5 timing oracle → noise:** legitimately closed. T-8 **measured** uniform ~0.10s across permitted / not-permitted / no-key. Measured absence, not premature dismissal.
- **F8 rate-limit → noise:** legitimately RESOLVED. T-8 confirmed ThrottlerGuard active — 429 with no state leak, window resets. Measured.
- **F-J2 header capability-lock over-read → non-blocking:** correctly non-blocking. The ship-blocker honest-indicator AC gates the **per-message** lock, which is proven fail-closed (`totalLocks=1`, sole `e2e-lock-affordance` header-only / `inMsg:false`, cannot-decrypt row shows no lock). The header is a truthful *capability* signal (both peers keyed + one real encrypted envelope exists). Per-message layer is authoritative — the over-read is a UX-polish nuance, correctly tasked (`ae1c82a5`) not suppressed.
- **F-J1 (who_can_dm-vs-visibility distinction not live-toggleable) → noise:** acceptable. The gate's POSITIVE side (permitted co-member → 200) and the byte-identical uniform-404 negative shape are proven live; the specific-axis distinction rests on the merge-blocking CI integration matrix + Karen's source read of the `canDm` seam. Coverage gap honestly disclosed, fixture-B-password already tracked. Not green-by-suppression.

### 3. B-6 crypto fixes (F2/F4/F7) in the deployed merge tree — CONFIRMED, no regression
- Karen verified all three by **content in `0fa0f5f`** — the correct method for a squash-merge (ancestry would be misleading). **F2** sender-auth: shared secret derived against the author's server-registered key; mismatched `envelopeSenderKeyRef` fails closed. **F4** no side-effecting regen: missing private key → `{ok:false}` cannot-decrypt, never rotate/re-register. **F7** proof-based delivered row: label derives from real wire outcome, absent → fail-closed non-lock. jenny corroborated F7 live (the cannot-decrypt message renders no false lock). No regression signal.

### 4. REWORK-worthy gap (false-negative / green-by-suppression / privacy hole) — NONE
- No suppressed finding would let the server read an encrypted DM (server-blind proven live + in CI; all egress paths traced) or show a false lock (per-message fail-closed proven; `totalLocks=1` header-only).
- Write-boundary mutual-exclusivity enforced live (both content+envelope → 400; partial envelope → 400) — plaintext cannot be smuggled alongside ciphertext.
- The two coverage gaps (F-J1 distinction; group/keyless-peer not live-constructible — group is P-4-deferred scope) are honestly disclosed and backstopped by CI + structural fail-closed defaults. Legitimate coverage limits, not defects.

---

## Disposition

- **Blocking:** none.
- **Non-blocking tasks (carry forward, seedable, `wave_id=NULL`):**
  - `0e58af8e` — DM auth-guard race (MED, most impactful; cross-cutting auth/UX)
  - `1f48f4db` — server-side senderKeyRef validation (crypto hardening / defense-in-depth)
  - `ae1c82a5` — header indicator capability-semantic polish (UX honesty)
- **Follow-up recommendation (non-gating):** add Fixture B credentials + a group/keyless-peer fixture to the verification brief so the who_can_dm-vs-visibility distinction and group/plaintext-fallback indicator states can be live-exercised next crypto leg (closes F-J1 + F-T8-1 coverage gaps).
- **Fast-fix cycles run:** 0 (no blocking findings; nothing entered the V-3 fast-fix loop).

**Gate closes APPROVED. Proceed to L-block.**
