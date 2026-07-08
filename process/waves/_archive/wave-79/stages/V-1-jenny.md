# V-1 jenny — wave-79 semantic spec-conformance verification

**Wave:** 79 — M13 leg-3a: server-blind end-to-end DM encryption
**Axis:** SEMANTIC spec conformance of DEPLOYED behavior vs the SPEC CONTRACT intent (beyond ACs the T-block tested). Independent of Karen's source-claim axis.
**Deployed:** merge `0fa0f5f`, LIVE — api `https://api-production-b93e.up.railway.app` · web `https://web-production-bce1a8.up.railway.app`.
**Method:** live HTTP probes (curl, unauth) + authenticated browser session (Playwright, real SDK-managed session as Fixture A `21984eb2`) driving GET/PUT/POST against prod, DOM inspection of the deployed DM view, plus persisted-state inspection of the A↔B conversation (`5f62052f`). Fixture B userId `da74148e-132e-4faf-a526-a34c28e7481b` (co-member of proof server ad62cd12).
**Spec source:** seed task 60bda5be `description` (`/tmp/wave79-spec.txt`), incl. the "## P-4 Phase-2 BINDING CORRECTIONS" override section.

---

## VERDICT: **APPROVE**

Deployed behavior conforms to the spec contract's semantic intent on every load-bearing invariant. All 5 P-4 BINDING CORRECTIONS are honored live. The two security-critical crown jewels — the **server-blind invariant** and the **honest fail-closed indicator** — are proven against live production state, not merely asserted. Findings enumerated below are non-blocking (0 blocking; 3 total: 1 semantic OBSERVATION, 2 GAPs the spec under-specified). No DRIFT (code-wrong-vs-spec) found.

---

## Protocol 1 — AC semantics (deployed behavior vs each AC's INTENT)

### Server-blind invariant (task 491cb85d AC1) — CONFORMS (crown jewel, proven live)
The single encrypted message in the A↔B conversation, fetched via `GET /dm/conversations/:id/messages`, returns:
- `content: null` — server stores NO readable plaintext.
- `ciphertext` = base64 of `{"iv":"T66bo/z4jiCRCxnw","ct":"C2NRTZID..."}` — an opaque AES-GCM envelope; the `ct` is ciphertext, not readable text.
- `senderKeyRef` = the sender's ECDH-P256 SPKI public key; `envelopeVersion: 1`.
The server cannot read this message. Backward-compatible plaintext path preserved: 29 prior plaintext messages carry `content` set + `ciphertext/senderKeyRef/envelopeVersion` all NULL (AC3 — no regression). **Intent met: the server is provably blind to encrypted DM content.**

### who_can_dm gate + uniform 404 no-oracle (task 60bda5be AC2) — CONFORMS
- `GET /profile/:userId/encryption-key`: A (co-member, who_can_dm permits) fetching B's real key → **200** `PublicKeyResponse`. Self-fetch → 200.
- 404 no-oracle matrix is **byte-identical (75 bytes)** across nonexistent-user / malformed-`:userId` (`not-a-uuid`, `zzzzz`) — all return `{"message":"Encryption key not found","error":"Not Found","statusCode":404}`. `diff` confirms identical bodies. Malformed → 404, not 500 (no ParseUUIDPipe leak / no stack-trace oracle).
- Unauth GET → 401; unauth PUT → 401.
**Intent met: no oracle distinguishes hidden/blocked/nonexistent/no-key/malformed; a key-fetch leak = a visibility leak, and none exists.** (Note under Findings: the who_can_dm-vs-profile_visibility *distinction* could not be dynamically toggled — see F-J1.)

### Honest indicator fails closed (task 3fb88f44 AC3) — CONFORMS (crown jewel, proven live in the deployed DM view)
In the live A↔B DM thread (30 message indicators, DOM-inspected):
- **29 plaintext-history messages** → `data-state="not-encrypted-plaintext"`, aria "Not encrypted", **no `e2e-lock-affordance`**.
- **The 1 encrypted envelope message** → `data-state="cannot-decrypt"`, aria "Message cannot be decrypted on this device", **no lock** (this browser context lacks the private key the message was encrypted for → honestly degrades, does NOT show a false lock).
- **`totalLocks` in the entire document = 1**, and that sole `e2e-lock-affordance` (emerald `#10b981` filled shield-check) lives **exclusively in the conversation header** (`inHeader:true, inMsg:false`), never on any message row.
**Intent met: the per-message honesty surface never shows a padlock without proof of encryption; plaintext-fallback and cannot-decrypt both render non-lock glyphs.** The header lock is a conversation-capability signal (both peers have registered keys — verified live), state `encrypted`, aria "Messages are encrypted on your device and decrypted on theirs" — see semantic OBSERVATION F-J2.

### Private key never transmitted (task 3fb88f44 AC1 / task 60bda5be AC3) — CONFORMS
- `PublicKeyResponse` = exactly `{userId, publicKey, algorithm, createdAt}` — no email, no private material (JSON key-set + substring scan clean).
- A smuggled `privateKey` field in a PUT body was silently stripped by the Zod schema (PUT still 200, self-key re-fetch shows only public material; "SMUGGLED"/"private" absent). No private-key column exists (migration 0031). Journey-map/T-8 additionally proved `export('pkcs8')` throws `InvalidAccessError` (non-extractable CryptoKey) — I did not re-verify the browser-storage internals but confirmed nothing private ever reaches the server.

### Plaintext fallback for keyless peer (task 491cb85d AC/edge, task 3fb88f44 AC4) — CONFORMS (structurally)
Spec: peer with no key → GET key 404 → client sends plaintext + not-encrypted indicator, no crash/false lock. The uniform-404 path is proven; the not-encrypted plaintext indicator is proven on all 29 plaintext rows. A live keyless-peer round-trip was not constructible (both fixtures have keys) — same limitation the T-block noted (F-T8-1). Fail-closed default is structurally sound: absent proof → not-encrypted.

---

## Protocol 2 — P-4 BINDING CORRECTIONS conformance (all 5 honored live)

1. **who_can_dm gate, NOT profile_visibility** — CONFORMS. Key-fetch gated on DM-ability (A gets B's key as a permitted co-member; uniform 404 for not-permitted). The dedicated `DmService.canDm/enforceWhoCanDm` seam is the gate (per journey map + Karen's source axis). Dynamic proof of the *distinction* (who_can_dm=nobody + profile_visibility=everyone → key 404 but PublicProfile 200) blocked by fixture-B-password absence — see F-J1; covered by the merge-blocking integration matrix.
2. **user_id is text FK, not uuid** — CONFORMS (semantic-observable): every existing users FK is the opaque SuperTokens text id (`21984eb2-...`, `da74148e-...`); the endpoints resolve keys against these text ids without FK failure. Migration 0031 declares `user_id TEXT FK` per journey map.
3. **listConversations "Encrypted message" preview for NULL content** — CONFORMS, proven live twice: `GET /dm/conversations` returns `lastMessage.content: "Encrypted message"` for the NULL-content encrypted last message (API), AND the deployed DM conversation-list UI renders "Encrypted message" as the B-conversation preview. No crash, no blank, no plaintext leak (there is none).
4. **Group DMs (≤10) OUT OF SCOPE — plaintext-fallback + NOT-encrypted, never a false lock** — CONFORMS structurally. No group thread was constructible from the single-recipient probe surface (same as F-T8-1). The fail-closed design (design/e2e-indicator.html has a distinct `group`=slashed-shield "Not encrypted" state) + the proven per-message not-encrypted default make a false group lock unreachable. Not live-exercised with an actual group thread.
5. **algorithm z.enum + reject encrypted-AND-plaintext-both** — CONFORMS, both proven live at the write boundary:
   - `PUT /profile/encryption-key` with `algorithm:"RSA-NONSENSE-9000"` → **400** `"Invalid enum value. Expected 'ECDH-P256-AES-GCM'"` (bounded z.enum, single pinned algorithm). Empty publicKey → 400 "must not be empty". Oversized (100k) → 400 "must not exceed 2000 characters".
   - `POST /dm/conversations/:id/messages` with **both** content + envelope → **400** "must carry either plaintext content OR an encrypted envelope (ciphertext), never both and never neither"; **neither** → 400 (same); **partial** envelope (ciphertext w/o senderKeyRef+envelopeVersion) → 400 "requires ciphertext, senderKeyRef, and envelopeVersion together". Server-blindness enforced at the write boundary — plaintext cannot be smuggled alongside ciphertext.

---

## Protocol 3 — Contract conformance (endpoint/DTO shapes)

- **PUT /profile/encryption-key**: 200 `{ok:true}` on store/rotate; 400 on bad-algo/empty/oversized; 401 unauth. Conforms.
- **GET /profile/:userId/encryption-key**: 200 `PublicKeyResponse{userId,publicKey,algorithm,createdAt}` | uniform 404 | 401. **No email, no private material.** Conforms.
- **Envelope DTO** on DM message: `{content, ciphertext, senderKeyRef, envelopeVersion, ...}` with content nullable + envelope fields nullable (plaintext rows carry content, envelope NULL; encrypted row carries ciphertext+ref+version, content NULL). Conforms.

## Protocol 4 — User-journey continuity

The DM-encryption journey is continuous and dead-end-free: keygen-on-first-use → public registered via PUT (200) → peer key fetched via GET (200 for keyed co-member / clean 404 for keyless) → outgoing encrypted as an envelope (content-null server-blind persist) → conversation-list shows "Encrypted message" preview → thread renders honest per-message indicators → undecryptable envelope degrades to a calm "cannot decrypt on this device" state (observed live), not a crash. The header capability lock + per-message states give a coherent, honest read of the conversation. No broken-back, no unhandled-error surface encountered.

## Protocol 5 — Spec-gap detection

- **F-T5-1 (auth-guard race, MEDIUM, already carried to V-2)** — corroborated: my curl-obtained SuperTokens session repeatedly hit `{"message":"try refresh token"}` 401 on write/verifySession routes (`PUT` key, `POST` message, `/auth/session/refresh`) while `SessionNoVerifyGuard` GET routes worked with the same cookies; the browser SDK-managed session succeeded on the identical writes. This is a real, reproducible token-verification/refresh sensitivity on the DM/write path — the spec did not anticipate the SessionNoVerifyGuard-vs-AuthGuard behavioral split under a transient-stale access token. Non-blocking (recovers on re-nav/SDK refresh), already filed.
- **Group-DM & keyless-peer honesty (spec-anticipated, not live-constructible)** — the spec correctly deferred group E2E and specified plaintext-fallback; the deployed single-recipient DM surface offers no way to construct a group or keyless-peer thread for a live indicator probe, so those two indicator states are verified structurally (design + fail-closed default) not dynamically. This is the F-T8-1 gap; it is a *coverage* gap, not a behavioral defect.

---

## Findings (0 blocking)

- **F-J1 (GAP, non-blocking, coverage):** The who_can_dm-vs-profile_visibility *distinction* (P-4 Correction #1) could not be dynamically proven live because Fixture B's password is not in the verification brief — I could not set B to `who_can_dm=nobody` while keeping `profile_visibility=everyone` and observe key→404 + PublicProfile→200. The gate's POSITIVE side is proven (permitted co-member → 200) and the uniform-404 negative shape is proven; the specific-axis distinction rests on the merge-blocking integration matrix + Karen's source axis. Recommend the verification fixture sheet include B's credentials for future crypto/privacy waves.
- **F-J2 (OBSERVATION / minor semantic, non-blocking):** The conversation **header** shows an emerald "End-to-end encrypted" lock (state `encrypted`) whenever both peers have registered keys — a *capability* claim — even in a thread where every currently-rendered message is plaintext-history or cannot-decrypt. This is spec-consistent (the honest-indicator AC gates the *per-message* lock, which is correctly fail-closed here, and the header truthfully reflects that new messages ARE sent encrypted — the one encrypted envelope proves it). It is not DRIFT. Flagging only because a user could over-read the header lock as "all messages here are encrypted"; the per-message layer correctly disambiguates. No action required; note for future UX polish if desired.
- **F-T8-2 (LOW, already carried):** server does not validate `senderKeyRef` against the sender's registered key — low risk under the server-blind model (server can't read either way). Not re-litigated; confirmed the field is persisted opaquely.

---

## Prod hygiene
Left CLEAN. All my write probes to `POST /dm/conversations/:id/messages` were 400-rejected (mutual-exclusivity) → zero test messages persisted (conversation total unchanged at 30; the one "smuggle"-matching row is a pre-existing 2026-07-04 pentest artifact, not mine). My PUTs re-registered Fixture A's own valid ECDH-P256 public key (state unchanged) and the smuggled-private field was stripped (public-only, no private material stored). B's state untouched (no B login possible).
