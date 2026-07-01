```yaml
verdict: PROCEED
verdict_source: problem-framer
matched_antipatterns: []
symptom_vs_cause: run
reasoning: |
  Both seed premises VERIFIED against real code. Part 1: server parseMentions
  (mentions.ts:35, /(?:^|\s)@([a-zA-Z0-9_-]+)/g) captures a `.`-free slug, so
  "@bob.dev" resolves+persists "bob"; the client (MessageList.tsx:559-565)
  splits on /(@\S+)/, strips only TRAILING punctuation ([.,!?;:)]+$), so it
  looks up "bob.dev", misses the "bob" key, and renders the run as plain text.
  Genuine cosmetic divergence, no false pill, no security issue — confirmed.
  Part 2: editMessage (messages.service.ts:668-721) does UPDATE + DELETE +
  INSERT on message_mentions as three unwrapped db. calls (no db.transaction),
  unlike createReply/reply-delete which DO wrap — confirmed non-transactional.
  The seed framing ("align client to server grammar" + "wrap the txn") is the
  right layer and right cause for both. PROCEED. Two cause-level notes below for
  P-1/P-3 to weigh — neither blocks the frame.
proposed_reframe: |
  (n/a — PROCEED)
cause_level_notes_for_p1_p3: |
  NOTE A (shared-tokenizer extraction — the deeper cause, but do NOT over-scope):
  Two parsers that must agree (server mentions.ts vs client
  renderBodyWithMentions) is a classic drift source. The DEEPER fix is a single
  shared tokenizer in packages/shared consumed by both, so they cannot re-drift.
  BUT — two facts temper this: (1) the client is NOT a re-parser. It does not
  re-derive who is mentioned; it trusts the server's mentions[] array and only
  decides how to SEGMENT the display string to place pills. So the real client
  bug is narrower than "wrong grammar": its token boundary (\S+ minus trailing
  punct) does not match the server's slug boundary ([a-zA-Z0-9_-]+), so it hands
  the map a superset key. The minimal correct fix is to make the client extract
  the SAME slug the server would (capture [a-zA-Z0-9_-]+ after the @, treat the
  remainder — ".dev" — as trailing text), which needs only the server's slug
  regex, not a full shared parser. (2) Extracting a shared package for a
  2-consumer, cosmetic-only concern risks premature abstraction (catalog #4) if
  done purely defensively. Recommendation for P-3: prefer exporting the single
  slug regex/constant from packages/shared (one source of truth for the boundary)
  and having the client reuse it — this kills the drift at its root WITHOUT
  standing up a general tokenizer framework. Flag a full shared-tokenizer module
  as OVER-SCOPED unless a third consumer (e.g. server-side highlight, notifications)
  is named.

  NOTE B (part-1 vs part-2 coupling — a P-1 sizing question, NOT a framing fault):
  The two items share the theme "mention correctness" but live in different
  layers (client render segmentation vs server DB write atomicity) and share no
  code. They are independently shippable and independently testable. This is not
  scope-creep-through-coupling (catalog #5) — it is a coherent small debt bundle,
  not two unrelated changes bolted together "while we're in there." I am NOT
  emitting RESCOPE-AUTO-SPLIT; whether to split into two sibling tasks or keep as
  one wave is P-1's sizing call. Signal to P-1: low risk either way; if kept
  together, ensure the spec's acceptance criteria and tests are partitioned by
  layer (a client render test for the tokenizer parity; a server integration test
  that a mid-diff failure rolls back — real PG, matching the wave-24 real-PG tier).

  NOTE C (severity / priority sanity, deferred to ceo-reviewer):
  Both are low-severity, no-data-loss, no-security debt with 0 current users.
  Priority is head-next's call (highest user-visible debt after 3 debt waves);
  framing-wise this is sound. The strategic "is a cosmetic mention-render fix the
  best use of this wave" question is ceo-reviewer's lane, not mine.
sibling_visible: false
```

## Evidence (code read)

- Server parser: `apps/api/src/messaging/mentions.ts:35` — `const TOKEN_RE = /(?:^|\s)@([a-zA-Z0-9_-]+)/g;` slug excludes `.`.
- Server resolve/persist: `apps/api/src/messaging/messages.service.ts:187-216` (`resolveMentions`) — resolves the `.`-free token to a server member and stores its user_id; DTO `mentions[]` carries the stored `username` (`rowToDto` 146-148).
- Client tokenizer: `apps/web/src/shell/MessageList.tsx:547-583` (`renderBodyWithMentions`) — `content.split(/(@\S+)/)` (559), trailing-punct strip `.replace(/[.,!?;:)]+$/, '')` (564), map lookup by full run (565). Interior `.` survives → key miss → plain text.
- editMessage non-transactional diff: `apps/api/src/messaging/messages.service.ts:668-721` — `UPDATE messages` (668), `DELETE message_mentions` (702-710), `INSERT message_mentions` (715-721): three separate `db.` calls, no `db.transaction()`.
- Contrast (already transactional): `createReply` `db.transaction` at :1031; reply soft-delete `db.transaction` at :839. Precedent for wrapping exists in the same file.
- Username has no format constraint at DB (`apps/api/src/db/schema/users.ts:11` `username: text('username')`), so a dotted username can exist but is UNMENTIONABLE by the server parser — reinforces that the client should match the server slug, not the reverse.
- Existing coverage gap: `mentions.spec.ts` tests mid-word `a@b.com` (→ []) and trailing punctuation (:71), but NOT interior-punctuation handles like `@bob.dev` — so this path is presently untested on both sides.

## Disposition

PROCEED. Framing is sound at the right layer and right cause for both parts. Symptom-vs-cause check run: the fix targets the cause (boundary mismatch; missing atomicity), not a symptom. Two cause-level notes handed to P-1/P-3 (prefer exporting the shared slug boundary over a full tokenizer framework; treat the part-1/part-2 split as a P-1 sizing call). ceo-reviewer owns the priority/ambition question.
