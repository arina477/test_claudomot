# V-1 jenny — semantic-spec verification (wave-25: mention parser parity + editMessage atomicity)

**Verifier:** jenny (V-1). **Method:** DEPLOYED-BEHAVIOR-vs-SPEC-INTENT — not source-claim truth (that is Karen's lane). I verified the shipped behavior on live prod + the CI-executed integration tier + a code-read of the exact deployed commit.

**Deployed state independently confirmed:**
- API `https://api-production-b93e.up.railway.app/health` → `{"status":"ok","service":"studyhall-api","version":"0.0.1"}` (live now).
- Web `https://web-production-bce1a8.up.railway.app/` serves `index-qlKaiziB.js` — the exact fresh-build bundle C-2 attributed to `dbe55a2` (deployment `25a010b0`). API deployment `b0251962`. Both are the LATEST deployment per C-2's GraphQL `deployments(first:1)` check → `dbe55a2` code is genuinely live (not a stale-health false-green; C-2 caught and corrected a stale-image gap first).
- CI run **28512345221** `test` job SUCCESS; the integration tier executed 5 spec files / 15 tests non-zero.

---

## VERDICT: **APPROVE**

All five acceptance criteria are met in deployed behavior. The headline fix (`@bob.dev`-style interior-punctuation on a RESOLVED handle → pill + trailing plain text) works on live prod, the unresolved-handle → plain-text gate holds, and editMessage atomicity (rollback + fails-loud-in-CI) is proven by a genuinely-executed real-Postgres integration spec. One **spec-gap** (not a drift, not blocking) is flagged below: a residual split-boundary divergence that the spec's own "Verify" note anticipated.

---

## Findings (each: spec section → deployed behavior; drift = code wrong / gap = spec didn't anticipate)

### F1 — AC1 (shared slug grammar extracted; server imports it) — MET
- **Spec:** slug grammar `[a-zA-Z0-9_-]+` extracted to a single exported constant in packages/shared; server parseMentions imports it; behavior-preserving.
- **Deployed behavior:** `packages/shared/src/mentions.ts:28` exports `MENTION_TOKEN_SLUG_SRC = 'a-zA-Z0-9_-'` + `MENTION_TOKEN_SLUG_RE` + `extractMentionSlug`, re-exported from the package index. Server `apps/api/src/messaging/mentions.ts:15` imports `MENTION_TOKEN_SLUG_SRC` from `@studyhall/shared` and rebuilds `TOKEN_RE = /(?:^|\s)@([a-zA-Z0-9_-]+)/g` from it (`mentions.ts:44`). Behavior-preservation proven: `mentions.spec.ts` (37 unit tests) green in CI. **No drift.**

### F2 — AC2 (client imports the SAME slug grammar; `@bob.dev` → pill) — MET (intent), with a benign implementation nuance
- **Spec:** client renderBodyWithMentions imports the SAME shared slug grammar and tokenizes identically to the server, so `@bob.dev` (server resolved+persisted as `bob`) renders as a PILL with `.dev` trailing text.
- **Deployed behavior — headline fix HOLDS on live prod:** T-5 live evidence (`t5-evidence/s2-pass1.png`, `s2-pass2.png`, both passes) shows `ping @studyhallfixturea.done` → `@studyhallfixturea` emerald PILL + `.done` plain trailing, NOT swallowed and NOT rendered as whole-token plain text. Verified against the deployed `index-qlKaiziB.js`. `renderBodyWithMentions` (`apps/web/src/shell/MessageList.tsx:567`) calls `extractMentionSlug(part)` then slices `trailing = part.slice(1 + slug.length)` (`:572`) — exactly the `@handle` + trailing-text split the AC requires.
- **Implementation nuance (NOT a drift):** the client does not *literally* `import` the runtime value from `@studyhall/shared`; it uses a physical mirror at `apps/web/src/shell/mentionSlug.ts` (`MENTION_TOKEN_SLUG_SRC` + `extractMentionSlug`), consumed at `MessageList.tsx:46`. This is a documented CJS-avoidance pattern (shared is CJS-only; vite/rollup cjs-module-lexer cannot resolve the value export through the `Object.defineProperty` re-export getter — same established convention as `messagingSocket.ts`). Parity is enforced by `apps/web/src/shell/mention-slug-parity.test.ts`, a contract test that imports BOTH the shared original and the local mirror and asserts byte-for-byte string equality of `MENTION_TOKEN_SLUG_SRC` **and** behavioral parity across a 13-row table — including a load-bearing class-boundary probe (`@pre.fix` → `pre`) that goes RED if the char class widens even when the SRC strings still match letter-for-letter. This satisfies AC2's *intent* — "same slug grammar, identical intra-token tokenization" — via a drift-guarded mirror rather than a direct import. I judge the AC's "imports the SAME shared slug grammar" as functionally satisfied: there is a single canonical slug source, and any drift breaks CI. **No drift.**

### F3 — AC3 (unresolved handle → plain text; pill-vs-plain still server-mentions-gated) — MET
- **Spec:** a handle the server did NOT resolve (not in the message's mentions map) still renders plain text (no false pill); the shared grammar only governs tokenization; pill-vs-plain is driven by the server-resolved mentions map.
- **Deployed behavior:** `MessageList.tsx:568` looks the extracted slug up in `mentionMap` (built from `msg.mentions`, `:554-557`); only a hit (`ref && slug != null`, `:569`) renders `<MentionPill>` — a miss falls through to plain `<span>{part}</span>` (`:584`). T-5 live evidence: S3 `hey @nobodyxyz12345 there` → `pills: []`, handle stays bare text (both passes); S4 mixed `@studyhallfixturea meet @ghost99nonexistent` → exactly one pill + one plain, same message (`s4-pass1/2.png`). Gate is genuinely server-mentions-driven, not blanket-pilling. **No drift.**

### F4 — AC4 (editMessage mention-diff wrapped in one db.transaction) — MET
- **Spec:** editMessage's UPDATE messages + DELETE + INSERT message_mentions is wrapped in a single `db.transaction()` so a partial failure rolls back.
- **Deployed behavior:** `apps/api/src/messaging/messages.service.ts:698` — `const updated = await db.transaction(async (tx) => { ... })` wraps the `tx.update(messages)` (`:699`), conditional `tx.delete(message_mentions)` (`:710`), and conditional `tx.insert(message_mentions)` (`:721`). Diff (toRemove/toInsert) is pre-computed outside the txn (`:687-690`); the three WRITES are the atomicity boundary. Mirrors the createReply/createServer transaction pattern. **No drift.**

### F5 — AC5 (real-Postgres integration spec asserts atomic rollback; ACTUALLY executes in CI, not false-green) — MET
- **Spec:** an integration spec asserts editMessage rolls back atomically on mid-txn failure (0 orphan/partial rows) and ACTUALLY executes in CI (nonzero per CI-PRINCIPLES rule 5); FAILS LOUD on missing DATABASE_URL_TEST (never silent-skip-green).
- **Deployed / CI behavior:**
  - Spec `apps/api/test/integration/edit-message-mentions-rollback.spec.ts` fault-injects a REAL mid-txn failure by wrapping `pool.connect()` so the returned client's `query()` throws on the `INSERT INTO message_mentions` (`:245`). After the throw, it asserts via a SEPARATE harness pool (distinct TCP connections — genuine cross-connection commit-visibility proof, not a SUT mock): `message_mentions` still has exactly alice's pre-edit row (`countRows === 1`, `:261`), alice present + bob absent (`:270,274`), and message content still `@alice` / `is_edited === false` (`:283-284`). This is a genuine 0-partial-rows atomicity assertion.
  - **Actually executed, non-zero, green (AC5 core):** CI run 28512345221 `test` job → `pnpm test:ci` runs `vitest run --reporter=verbose && vitest run --config vitest.integration.config.ts`. The integration invocation log shows `test/integration/edit-message-mentions-rollback.spec.ts > ... > commits UPDATE + DELETE + INSERT on successful edit 67ms` AND `> rolls back UPDATE + DELETE when message_mentions INSERT fails mid-txn 53ms` — both PASS with real timings, inside `Test Files 5 passed (5) / Tests 15 passed (15)`. The `test` job supplies `DATABASE_URL_TEST` + a `postgres:16` service in the SAME job (`.github/workflows/ci.yml:38-46`), so `SKIP` is false and the spec runs for real (T-4 also notes a prior CI cycle caught it hanging at 5000ms → fixed in a730caf; i.e. it genuinely executes, it's not inert). **No false-green; no drift.**

### F6 — EDGE CASES — MET (all six)
- `@bob.dev` resolved → PILL: HOLDS (F2, T-5 S2). Handle not in map → plain: HOLDS (F3, T-5 S3). Trailing punctuation `@bob,` → both sides strip via `extractMentionSlug` longest-slug-run (parity table row `@alice!` → `alice`, `@bob.dev` → `bob`; server `parseMentions('@alice, ...')` → `['alice']` per `mentions.spec.ts:73`): both sides strip consistently. Mid-txn failure → real ROLLBACK → 0 partial rows: HOLDS (F5). Removing all mentions → DELETE runs / INSERT no-op / txn commits: the code guards `toInsert.length > 0` (`:720`) and `toRemove.length > 0` (`:709`), so an all-removals edit runs DELETE only and commits — matches the edge. Integration spec FAILS LOUD on missing DATABASE_URL_TEST: **see F7 gap** — in CI it fails-loud-by-running-for-real; locally it emits an explicit `it.skip('SKIPPED: DATABASE_URL_TEST is not set...')` (`:289-293`), which is a *labeled* skip, not a silent green.

### F7 — SPEC-GAP (bug-spec, NOT blocking): split-boundary residue — anticipated by the spec's own Verify note
- **Nature:** GAP (spec did not fully unify the SPLIT boundary; the code is deliberately scoped, so this is not code-wrong / not a drift). Only the intra-token SLUG grammar was unified this wave; the token SPLIT boundary remains divergent:
  - Server: `(?:^|\s)@([a-zA-Z0-9_-]+)` — requires start-of-string or whitespace before `@` (word-boundaried; mid-word `@` ignored).
  - Client: `content.split(/(@\S+)/)` — matches ANY `@` including mid-word.
- **Observed divergence (traced, not deployed-tested):** for a mid-word `@` (`word@bob`, `email a@bob`), the server does NOT resolve `bob` (word-boundary), so `bob` is absent from the message's `mentions` map → the client's AC3 gate renders it PLAIN. So in the common case the split-boundary residue is **neutralized by the server-mentions-map gate** and produces NO false pill.
- **The one exotic over-pill case:** if the SAME resolved username also appears mid-word later in the same message — e.g. `"hi @bob and word x@bob"` — the server resolves `bob` once (via the word-boundaried `@bob`), so `bob` IS in the map; the client then pills BOTH the word-boundaried `@bob` AND the mid-word `x@bob`'s `@bob` token, because pill-vs-plain is keyed only on slug-in-map. This yields an extra pill the server never counted as a distinct mention. It requires a resolved handle to recur mid-word in the same message — exotic, not the AC2 headline case, and it can NEVER produce a false pill for an *unresolved* user (AC3's specific guarantee is intact).
- **AC2 intent judgment:** AC2's headline intent ("the `@bob.dev` pill fix" + "client and server agree on token boundaries") is met for interior/trailing punctuation on resolved handles (F2). The literal AC2 phrase "agree on token boundaries" is only *partially* true — intra-token slug boundaries agree; the outer split boundary still differs. Per the V-1 prompt's spec-gap watch, I flag this as a **spec-gap (bug-spec)**, **not blocking**: it is explicitly OUT OF SCOPE per the spec ("grammar rewrite / a full shared tokenizer framework" excluded), the spec's own Verify note pre-identified it as residue, and it produces no user-visible harm in the resolved+unresolved cases the ACs actually enumerate. Recommend a backlog note (a future wave could unify the split boundary or route the client through a shared tokenizer) — not a REWORK for this wave.

---

## Drift vs gap summary
- **Drift (code wrong vs spec): NONE.**
- **Gap (spec didn't anticipate / scoped-out residue): 1** — F7 split-boundary divergence, non-blocking, spec-anticipated, backlog-worthy.
- **Out-of-scope items correctly not implemented** (grammar rewrite, full shared tokenizer, pill UI redesign, reminders): confirmed absent — no scope creep.

**Recommendation to head-verifier (V-2/V-3):** APPROVE the wave. Carry F7 as a Low-severity spec-gap backlog note (unify the client SPLIT boundary or adopt a shared tokenizer in a later wave); no fast-fix required this wave.
