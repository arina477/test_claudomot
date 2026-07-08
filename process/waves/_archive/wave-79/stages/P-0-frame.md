# Wave 79 — P-0 Frame

## Discover section
- **wave_db_id:** fce323ed-02eb-4b39-8e98-f9ac9b29b67d (wave_number 79; milestone_id backfilled → M13 b7400254)
- **Prior-work citation:** M13 leg-1 (educator console, wave-76) + leg-2 (portable academic identity, wave-77/78) shipped. This leg-3 reuses the shipped fail-closed `profile-visibility.service` (+ sharesServer helper), append-only `privacy.service`, `dm.service` (idempotency + blocking), messaging gateway. Extends users/dm schema + packages/shared/src/privacy.ts.
- **Roadmap milestone:** M13 — Institution partnerships & portable identity (in_progress). leg-3 = LAST autonomous leg. ## Class product-feature.
- **Spec-contract short-circuit verdict:** `no-prior-spec` (decomposer prose, no fenced YAML head → full P-1..P-3).
- **Product-decision resolutions:** SECURITY-scope (E2E crypto). Decision to build leg-3 made at N-1 decomposition (logged). This P-0 SPLIT the bundle (see reframe). Crypto approach (Web Crypto, server-blind, private-key-browser-only) is in-scope engineering, no founder-credential dependency. Recorded the E2E v1 posture (key-loss/no-multi-device/plaintext-fallback/honest-indicator) to product-decisions 2026-07-08.

## Reframe section
- **Original framing:** 4-task bundle — public-key registry (60bda5be) + server-blind encrypted DM envelope (491cb85d) + client-side web DM encryption (3fb88f44) + read-receipt/presence privacy toggles (3038a4bc).
- **problem-framer: PROCEED + 5 binding refinements** — genuine cause-level E2E, server-blind verified against live code (plaintext content→NULL when encrypted; private key never leaves browser; not ciphertext-alongside-plaintext theater). Reused primitives confirmed present. **Two decomposer-prose drifts (must build, not assume):** (a) `dm_messages.content` is `text().notNull()` today → migration must relax NOT NULL; (b) no soft-delete/tombstone column exists → seed's "tombstoning applies" has nothing to inherit; define it. **Task-4 scope hole:** `sendReadReceipts` gates a read-receipt feature that DOES NOT EXIST (no table/emit path) — descope or build-first.
- **ceo-reviewer: SELECTIVE-EXPANSION** — leg earns ~3,200 LOC now (moat-builder, honest non-wedge framing; last autonomous M13 leg → moves M13 to founder-disposition). browser-only-key + plaintext-fallback v1 is the right altitude (not Signal-grade gold-plating). Task 4 = cheap standalone win, lead with it to de-risk. **Indicator-honesty is the make-or-break AC** — never a padlock on plaintext-fallback; T-8 must attack "does the server ever see plaintext when UI claims encrypted?"
- **mvp-thinner: THIN** — E2E chain (1→2→3) is mvp-critical + IRREDUCIBLE (registry alone=dead code; envelope alone=unpopulated column; client is where the claim becomes true+observable). Task 4 (read-receipt/presence) crypto-INDEPENDENT (shares no code/schema edge), standalone-shippable → split to its own M13 sibling wave. Metric-absence honesty: structural split (dependency-graph fact), not metric-forced.
- **Mediation outcome (ceo-reviewer SELECTIVE-EXPANSION-keep vs mvp-thinner THIN-split, on task 4):** **THIN split accepted.** Decisive: problem-framer's independent scope-hole finding (task 4 hides an unbuilt read-receipt subsystem) means keeping it would balloon the E2E wave OR ship a dead toggle — both bad inside a security-critical release. mvp-thinner's structural argument (crypto-independent, no shared edge) is sound. ceo-reviewer's "cheap win" honored: task 4 is NOT cut, just deferred to a focused leg-3b with its own P-block to resolve the read-receipt gap. E2E chain gets undiluted T-8 security review.
- **Sibling task extracted:** 3038a4bc re-parented to `parent_task_id=NULL` → standalone M13 seed (wave_id NULL, todo) → leg-3b, N-1 picks it up next.
- **Disposition:** **REFRAMED (split)** — proceed to P-1 with the 3-task E2E chain.
- **Final framing:** ship M13 leg-3a — server-blind end-to-end DM encryption: per-user public-key registry, encrypted DM envelope (plaintext NULL when encrypted, plaintext-fallback for keyless peers), client-side Web-Crypto encrypt/decrypt with an honest E2E indicator.

### Binding refinements carried to P-2/P-3 (LOAD-BEARING, security-critical)
1. **Server-blind invariant = hard AC** with a non-happy proof (server never persists plaintext for an encrypted DM); drives the mandatory T-8 security gate + P-4 security-scope tightened gate.
2. **Migration must** relax `dm_messages.content` NOT NULL AND explicitly define ciphertext + sender-key-ref + envelope-version + tombstone/soft-delete semantics (nothing to inherit — build it).
3. **Honest E2E indicator (ship-blocker):** NO lock icon on a plaintext-fallback message; the indicator fails closed (shows "not encrypted" unless provably E2E). Anti-security-theater.
4. **Key-loss / no-multi-device / plaintext-fallback** named as accepted E2E v1 constraints (recorded in product-decisions, not silently shipped).
5. **Peer-key-fetch endpoint (GET /profile/:userId/encryption-key) MUST route through the shipped fail-closed visibility gates** (mirror who_can_dm) — a key-fetch leak is a profile-visibility leak.

**claimed_task_ids:** [60bda5be-a592-437c-94e5-4ac11a5231f4 (seed), 491cb85d-05df-4cec-b7d7-27a980608b97, 3fb88f44-2aa6-498f-a93e-faa9b4455b89]
