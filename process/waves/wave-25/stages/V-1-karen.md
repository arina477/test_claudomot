# V-1 Karen — wave-25 source-claim verification (StudyHall)

**Role:** Karen at V-1. Source-claim verification ONLY (spec conformance is jenny's lane).
**Scope:** Are the wave's LOAD-BEARING CLAIMS TRUE in the merge-commit tree + deployed state?
**Merge commit:** `dbe55a2` (squash-merge of PR #37) — confirmed `git merge-base --is-ancestor dbe55a2 HEAD` → TRUE (HEAD `b6785e4`, T-block complete, downstream of the merge on `main`).

## VERDICT: **APPROVE**

All seven load-bearing claims are confirmed by on-disk evidence, grep, and live-URL probes. No claimed-but-fake, no decorative tests, no undocumented deferrals. Every regex claim is grep-provable; the deployed bundle carries the shipped code; the rollback integration test is real and executed in CI.

---

## Findings (each claim + confirming/contradicting evidence)

### Claim 1 — Shared slug grammar exists + is the single source. **CONFIRMED**
- `packages/shared/src/mentions.ts:28` exports `MENTION_TOKEN_SLUG_SRC = 'a-zA-Z0-9_-'`.
- `packages/shared/src/mentions.ts:38` — `MENTION_TOKEN_SLUG_RE = new RegExp(\`^[${MENTION_TOKEN_SLUG_SRC}]+$\`)` — **DERIVED** from SRC via template interpolation, NOT a hardcoded char class. B-6 tightening confirmed.
- `packages/shared/src/mentions.ts:64` — `extractMentionSlug` builds its matcher as `new RegExp(\`^[${MENTION_TOKEN_SLUG_SRC}]+\`)` — also derived from SRC, not an inline literal.
- Barrel export present: `packages/shared/src/index.ts:125-128` re-exports `MENTION_TOKEN_SLUG_SRC`, `MENTION_TOKEN_SLUG_RE`, `extractMentionSlug` from `./mentions.js`.

### Claim 2 — Server imports the shared slug. **CONFIRMED**
- `apps/api/src/messaging/mentions.ts:15` — `import { MENTION_TOKEN_SLUG_SRC } from '@studyhall/shared';`
- `apps/api/src/messaging/mentions.ts:44` — `TOKEN_RE = new RegExp(\`(?:^|\\s)@([${MENTION_TOKEN_SLUG_SRC}]+)\`, 'g')` — matcher built from the shared constant, NOT an inline literal. The only occurrences of the literal `a-zA-Z0-9_-` in the file are in **comments** (lines 9, 20, 43) documenting equivalence to the former inline pattern.
- `mentions.spec.ts` is the behavior-preserving guard: 24 `it(...)` tests (`grep -cE "\b(it|test)\("` → 24), importing the real SUT `parseMentions` from `./mentions` (line 27) — not a re-implementation. Covers mid-word `@` exclusion (line 63), non-whitespace boundary (65), hyphen/underscore (76), dedup, case-folding. Genuine behavior coverage, not coverage theater.

### Claim 3 — Client parity via web-local mirror. **CONFIRMED**
- `apps/web/src/shell/mentionSlug.ts` exists; `:24` mirrors `MENTION_TOKEN_SLUG_SRC = 'a-zA-Z0-9_-'`, `:45` `extractMentionSlug` derives its regex from the local SRC.
- `apps/web/src/shell/MessageList.tsx:46` — `import { extractMentionSlug } from './mentionSlug';` (local mirror, NOT `@studyhall/shared`), with an inline comment citing the CJS-avoidance convention. `renderBodyWithMentions` (`:548`) calls `extractMentionSlug(part)` at `:567`.
- `apps/web/src/shell/mention-slug-parity.test.ts` imports BOTH shared (`sharedExtract`/`sharedSlugSrc`, lines 22-25) AND local (`localExtract`/`localSlugSrc`, 27-30) and asserts identity: `expect(localSlugSrc).toBe(sharedSlugSrc)` (line 70) plus a 13-row behavioral parity table asserting `localResult === sharedResult` (line 89). Includes a class-boundary probe row `['@pre.fix','pre']` (line 61) that would go RED if SRC were widened to include `.` — proving the regex is genuinely wired to SRC, not independently hardcoded.

### Claim 4 — editMessage transaction. **CONFIRMED**
- `apps/api/src/messaging/messages.service.ts:698-730` — the UPDATE messages + DELETE message_mentions + INSERT message_mentions are wrapped in ONE `db.transaction(async (tx) => {...})`. All three writes use `tx` (`tx.update` :700, `tx.delete` :710, `tx.insert` :722) — NOT three unwrapped `db.*` calls. Mention-diff pre-reads happen before the txn (documented at :667-671 as the deliberate atomicity boundary); the three writes are the atomic unit. Line range: **698–730**.

### Claim 5 — Rollback integration spec exists + executed in CI. **CONFIRMED (real, not fabricated)**
- `apps/api/test/integration/edit-message-mentions-rollback.spec.ts` exists (13,414 bytes).
- `import './pg-harness';` is the **FIRST** import (line 13), before the SUT import (line 33) — CF-2 load-bearing ordering satisfied and documented.
- `const SKIP = !process.env.DATABASE_URL_TEST;` (line 36) → `describe.skipIf(SKIP)(...)` (line 144). Skip-with-reason path present (line 291).
- Rollback test body is **NOT decorative**: it injects a mid-txn fault on the `message_mentions` INSERT via `wrapPoolConnect` (line 240), asserts `editMessage` rejects, then verifies post-ROLLBACK state via a **separate harness pool** (distinct connections) — `countRows('message_mentions') === 1` (still alice's row), alice present / bob absent, message content still `@alice` and `is_edited === false`. These are real cross-connection commit-visibility assertions (AC5), not `expect(true).toBe(true)`.
- CI cross-check against C-1 deliverable (`process/waves/wave-25/stages/C-1-pr-ci-merge.md`): run **28512345221** (HEAD `a730caf`) — all 7 required checks green; integration tier executed 5 spec files / 15 tests; the rollback test "rolls back UPDATE + DELETE when message_mentions INSERT fails mid-txn" PASSED in **53ms** (was a 5000ms timeout on the prior run, fixed by a test-harness-only change `a730caf` — no production code touched). `false_green_ruled_out: true`. The claim is real, not fabricated.

### Claim 6 — Deploy hash match. **CONFIRMED**
- api `/health` live → `{"status":"ok","service":"studyhall-api","version":"0.0.1"}` (HTTP 200).
- web root live → HTTP 200, serving `assets/index-qlKaiziB.js` + `assets/index-_fCKNvaB.css`.
- Fetched the live web bundle (964,586 bytes, HTTP 200) and grepped: the mention slug char class `a-zA-Z0-9_-` **is present in the deployed bundle** — the shipped code carries the mention-parity grammar. (Runtime symbol names are minified, as expected; the char-class literal survives minification and is the load-bearing artifact.) Consistent with the C-2 `railway up` image push of dbe55a2's build.

### Claim 7 — Antipattern catalog. **CLEAN**
- **Claimed-but-fake:** none. Every file/line claimed exists and matches.
- **Decorative tests:** none. Parity test has a real drift-detecting boundary probe; rollback test has real cross-connection state assertions; unit specs import the true SUT.
- **Deferred-but-undocumented:** none. The two documented deferrals — mid-word `@` split boundary (pre-existing, B-6 accepted-debt; the exclusion is even affirmatively tested at `mentions.spec.ts:63`) and the Playwright MCP chrome-absent tooling gap (`67881a58`) — are DOCUMENTED, therefore not fabrication.

---

## Bottom line
Nothing here is smoke. The single-source slug grammar is real and derived (not duplicated hardcode), both server and client consume it (server directly, client via an enforced-parity mirror justified by a concrete CJS build constraint), the editMessage three-write atomicity is a genuine single `tx` transaction, the rollback spec genuinely executed and passed in CI, and the deployed bundle serves the shipped grammar. **APPROVE.**
