# Wave 88 — P-0 Frame

## Discover

- **wave_db_id:** f7d399c2-6867-495c-83bc-116083976f16 (wave_number 88, running)
- **Prior-work citation:** wave-79 B-6/review F3 + T-8 F-T8-2 (origin finding). Client-side senderKeyRef rejection shipped wave-79 (F2). `dm-encryption.integration.spec.ts` exists.
- **Roadmap milestone:** unassigned (roadmap complete; bug-fix phase).
- **Spec-contract short-circuit verdict:** `no-prior-spec` → full P-1..P-3.
- **wave_touches:** DM auth / crypto integrity → **SECURITY WAVE** (T-8 fires; P-4 security-scope-tightened gate applies).

### N-2 seed dissolution (before re-seed)
- Original N-2 seed **6eed0fc2** (SW cache-bust) **CANCELLED at P-0** — already shipped: `VitePWA({registerType:'autoUpdate'})` injects `skipWaiting()+clientsClaim()+cleanupOutdatedCaches()` by default (verified in generated `dist/sw.js` since wave-81). Stale-backlog false premise (both P-0 reviewers DROP). Superseded by ef37743b (reload-toast, UX polish — not pulled). head-next's N-2 premise check missed that `autoUpdate` implies skipWaiting.
- Also evaluated **db90252a** (createServer TOCTOU) — technically live but explicitly UNREACHABLE (100k placeholder cap) + deferred to the unstarted M9 paid-tier slice → not a valid bug-fix-phase pull.
- Re-seeded on **1f48f4db** (server-side DM senderKeyRef validation) — a verified-live genuine security-correctness bug.

## Reframe

### Seed 1f48f4db framing
`dm.service.ts sendMessage` writes an encrypted DM envelope's `senderKeyRef` verbatim into `dm_messages` with NO validation that it equals the author's registered public key. The recipient client already fails closed on a mismatch (wave-79 F2), so recipients are protected — this is server-side defense-in-depth on the crypto-integrity path.

### problem-framer verdict — PROCEED
`stages/P-0-problem-framer.md`. Gap LIVE (re-verified: `dm.service.ts` sendMessage :648-664 writes `sender_key_ref: input.senderKeyRef` verbatim; Zod only checks XOR/length). Fix safe on both feared dimensions: (1) **server-blindness intact** — `senderKeyRef` is the sender's base64 SPKI *public* key, registry stores the public key → check compares two public strings; (2) **key-rotation antipattern cannot fire** — `user_encryption_keys` has `UNIQUE(user_id)` + upsert-replace rotation (migration 0031), so "current registered key" is single-valued.

### ceo-reviewer verdict — PROCEED (HOLD-SCOPE)
`stages/P-0-ceo-reviewer.md`. Worth doing at proposed scope: closes a genuine server-side authz gap on the encrypted-DM trust surface (wedge-relevant), cheap at 0 users. Near the DROP boundary (LOW, recipient already protected) but earns PROCEED as legitimate crypto-integrity defense-in-depth.

### Merge — PROCEED to P-1
Both reviewers converge PROCEED (no conflict, no BOARD, no hard-stop). mvp-thinner not spawned (no active `product-feature` milestone). Disposition: **PROCEED.**

### Spec constraints carried to P-2 (correctness-critical)
1. **Validate on WRITE only** (DM send path), never retroactively on list/read.
2. **Fail OPEN when the author has no registered key** (keyless-sender fallback + register-then-send race) — do not block a legitimate send.
3. **1:1 encrypted send only, unconditional** (no feature flag).
4. Validate against the author's currently-registered key (single-valued per UNIQUE(user_id)); T-8 negative test confirming a post-rotation send is NOT rejected is prudent.

### Final framing the rest of P-block will use
**Add a server-side defense-in-depth check on the DM send path: reject a send whose `senderKeyRef` != the author's currently-registered public key, failing OPEN when the author has no registered key.** Public-material comparison only (preserves server-blind E2E). Write-path only. T-8 verifies: mismatch rejected, matching send accepted, keyless-author send allowed (fail-open), post-rotation send accepted.

## Backlog-thinning signal (informational; founder-deferred — NOT a decision here)
4th+ consecutive N-2 seed to evaporate at P-0 (wave-83 ParseUUIDPipe, wave-87 PATCH-500, wave-88 SW-cache-bust already-shipped; db90252a deferred-unreachable). Roadmap complete; the remaining bug-fix backlog is thinning to marginal LOW/defense-in-depth/deferred/test-debt/polish items. Surfaced for the founder's next checkpoint as a possible "time for a validation / strategic re-plan push" signal. roadmap-planning stays founder-deferred; the loop continues on the legitimate (if LOW) bugs that remain. Recorded to `process/session/updates/` for the founder digest.
