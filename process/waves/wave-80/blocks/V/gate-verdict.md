# Wave 80 — V-block Exit Gate Verdict (Phase 1)

**Stage:** V-3 Fast-fix / block exit
**Gate:** V (Verify)
**Attempt:** 1
**Wave topic:** presence (online-status) privacy toggle — M13 leg-3b (`show_presence` honored server-side)
**Merge commit (LIVE):** `4795638125301c0685864a3a5f58001373720059` (PR #99, deployed)
**Mode:** automatic
**agentId:** head-verifier (V-block gate, Phase 1 Attempt 1)

---

## VERDICT: **APPROVED**

The privacy honor holds, proven LIVE (not assumed); V-2 triage is sound; the two non-blocking carries are correctly non-blocking and neither is a privacy hole. No REWORK-worthy gap, no green-by-suppression, no reviewer false-negative found on independent re-verification.

---

## Judgment against the privacy honor bar

### 1. Are Karen + jenny sound + evidence-backed? Is the honor PROVEN LIVE?
**Yes — sound and independently corroborated.** I re-verified the make-or-break mechanism directly against the merge tree (`git show 4795638:...`), not by reading the reviewers' summaries:
- `presence.gateway.ts`: `onShowPresenceChanged` (line 371) is a genuine **proactive toggle-time re-broadcast** — runs under `withPresenceLock` (378), syncs every live socket's cached `s.data.showPresence` (387), finishes with `reconcileHiddenUser` (422). NOT a reconnect path.
- Gated in `privacy.service.ts:134` on `showPresenceInPayload && showPresenceChanged && presenceGateway` — a visibility-only PUT does not re-broadcast presence.
- The 3 passive emit paths gate on the flag: online (284), offline (338, cached flag, no disconnect-time DB query), snapshot co-member batch (263 `visible` gate).
- **jenny proved this LIVE end-to-end** with two real Socket.IO clients: A `PUT {showPresence:false}` → B received `presence:offline` for A ~101ms later while `a.connected === true` (no reconnect); un-hide ~97ms. This is the headline AC-2 / P-4 #1 mechanism, observed on prod — not acceptance-by-assertion.
- **Karen verified live prod** independently: deploy hash == merge SHA (Railway GraphQL probe), migration column state confirmed on prod (`boolean | NO | true`), 401 unauthed, health 200.

Both reviewers operate on independent axes (Karen source-truth; jenny semantic conformance) and converge. No rubber-stamp: the crown-jewel claim is backed by a live two-client observation, which is the correct standard for a realtime honor gate.

### 2. Was V-2 triage correct? Are the B-6 fixes in the deployed tree?
**Yes.** V-2 downgraded nothing load-bearing. I confirmed the three B-6 findings are fixed **by content in the merge tree** (dispositive against squash-merge drift):
- **F1 clobber:** `UpdatePrivacySchema...partial()` (shared/privacy.ts:35); service builds `setValues` from `!== undefined` guards only (privacy.service.ts:76–78) — untouched columns never written. jenny proved no-clobber live (visibility-only PUT left `showPresence:false` intact).
- **F2 connect-vs-toggle race:** closed by `withPresenceLock` per-user mutex + `reconcileHiddenUser` on both the connect broadcast (296) and the toggle path (422).
- **F3 audience:** union of live sockets' cached `serverIds`, matching the disconnect invariant.
These are in the deployed tree, not regressed.

### 3. The 2 non-blocking — correctly non-blocking? Neither a privacy hole?
**Correct on both.**
- **`.strict()` comment/code mismatch (T-8 F-T3-1):** the comment (privacy.ts:27) claims `.strict()` rejects unknown keys, but the chain is `.object({...}).partial()` with NO `.strict()`. Verified in tree. Harmless: Zod default `.object()` strips unknown keys, and the service allowlists exactly 3 keys via `!== undefined` guards — no mass-assignment, no dynamic column write. An unknown key cannot make a hidden user visible, cannot clobber, cannot reach the DB. Cosmetic doc defect. Task 6e28e2cb (wave_id NULL, seedable). Correctly non-blocking.
- **Duplicate proactive/reconcile presence emit (T-5 F-T5-1):** idempotent — identical `{userId}` status; client presence store dedupes. No user-visible effect, no cross-tab clobber, no leak (both frames say the SAME thing). Task f9985cea. Correctly non-blocking.

Neither carry lets a hidden user be seen online, and neither introduces a cross-tab clobber.

### 4. Any REWORK-worthy gap (false-negative / green-by-suppression / suppressed privacy violation)?
**None found.**
- Outbound emit surfaces are exhaustively gated (online / offline / snapshot); the proactive path closes the already-online mid-session case; `reconcileHiddenUser` under the mutex closes the connect-vs-toggle race in both orderings.
- Inbound view intentionally unaffected (hidden user still sees co-members) — documented, spec-conformant (P-4 #2), and proven live.
- Truthfulness is honestly bounded (P-4 #5): the control claims only "appear offline," never "hide activity"; study-timer / focus-room rosters are separate modules and the copy does not over-claim. This is the anti-theater bar the wave set for itself, and it is met.
- Audit event fires with no PII (enums + booleans only). Migration `DEFAULT true NOT NULL`, no backfill — no accidental exposure of existing users.

No load-bearing claim is unproven; no privacy hole is suppressed under a non-blocking label.

---

## Fast-fix cycles run: 0 (queue empty; 0 blocking)

## Carries into N-block (both wave_id NULL, seedable — NOT gate blockers)
- `6e28e2cb` — add `.strict()` OR correct the stale comment (contract hygiene).
- `f9985cea` — dedup co-member-room presence emit (realtime hygiene).

## Gate exit
APPROVED. Proceed to L-block (L-1 Docs → L-2 Distill → N).
