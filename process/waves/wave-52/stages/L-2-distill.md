# L-2 — Distill (wave-52)

## Inputs
- knowledge-synthesizer: 5 observations, 2 STRONG candidates targeting DIFFERENT files.
- karen (rule-quality vetter): APPROVED both candidate texts verbatim.
- head-learn: gated observation-capture + ≤1-promotion-per-file bar.
- Deterministic L-2 linter: PASS on both candidate files (limits + no forbidden tokens; "micro-waves" ≠ `wave-[0-9]+`).

## Promotions (2 — one per file, within the per-file cap)

### T-5.md rule 3 (from obs-1, STRONG — E2E-handshake)
```
3. Cover a realtime feature's initial server-push handshake with a real-socket E2E, not event-round-trip unit tests.
   Why: A mocked socket skips the initial client verb, leaving the first-push path untested.
```
Linter: rule=116≤120, why=92≤100, 2 non-blank lines, forbidden=none → PASS.
Evidence: the focus-room live-blocking skeleton bug (client connected to `/study-room` but never emitted the initial `subscribe_server_rooms` verb; server only pushed the rooms list on room-JOIN). Unit tests mocked both socket + events and missed it; the real-socket T-5 E2E caught it (2-distinct-user, socket frames captured). Fixed in-cycle (backend `subscribe_server_rooms` handler a70cc02 + frontend emit-on-mount/reconnect 7534f4c; PR #67 → 725f7b6).

### PRODUCT-PRINCIPLES.md rule 5 (from obs-4, STRONG — floor carve-out)
```
5. When mvp-thinner returns floor_constraint_active with zero split candidates, waive the floor; no BOARD is required.
   Why: The floor targets wasteful greenfield micro-waves; a feature with no valid split is exempt.
```
Linter: rule=118≤120, why=99≤100, 2 non-blank lines, forbidden=none → PASS.
Evidence: recurring sub-floor reuse-heavy-slice override across waves 50/51/52 (obs-B 3rd instance). The only split candidate drove residual further sub-floor; mvp-thinner `floor_constraint_active` + zero valid split + reviewer scope-endorse → resolve-by-rule override, no BOARD (board-process anti-pattern #1: resolve routine sizing by rule, never convene).

## Held / not promoted
- obs-2, obs-5: single-instance, HOLD in observations until a 2nd wave confirms.
- obs-3 (HOLD, 1st instance): head-verifier at V-3 directly appended a rule to VERIFY-PRINCIPLES.md, bypassing the L-2 karen-vet + linter path (rule 12 violation). Reverted in-wave (`git checkout -- command-center/principles/VERIFY-PRINCIPLES.md`, restored to rule 4). Legitimate L-2 candidate on the discipline gap, but 1st instance → HOLD; promote only if a 2nd wave repeats the bypass.

## Task closes (this wave's bundle)
- d123d9e0 (backend join-presence) — done.
- aad849ac (focus-room UI panel) — done.
- ef84b378 (room-scoped timer) — done.
(marked done via head-learn, commit b4b6ee7.)

## Cap compliance
2 promotions across 2 DISTINCT files (T-5.md, PRODUCT-PRINCIPLES.md) = 1 per file → within the per-file cap. No file received >1.
