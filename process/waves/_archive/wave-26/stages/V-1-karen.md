# V-1 Karen — wave-26 (StudyHall presence dots + self-presence T-5 fix)

**Verdict: APPROVE**

Reality check: every load-bearing claim is TRUE in the merged tree (HEAD `6c65295`, both
`1543a4e` #38 and `12b5ec2` #39 confirmed ancestors) and the deployed state (web bundle
`index-BAcJ6YNx.js` live, api `/health` 200). No claimed-but-fake work, no decorative tests,
no undocumented deferrals. The T-5 critical (self-presence) was genuinely fixed, not just
claimed — the code chain exists end-to-end AND a real regression test asserts the fix.

---

## Claim-by-claim findings (claim + evidence)

### 1. Shared `PresenceDot` component — TRUE
- `apps/web/src/shell/PresenceDot.tsx` exports `PresenceDot` (React.memo), inner dot at
  `:60-68` uses `var(--color-accent-emerald)` (online) / `var(--color-surface-500)` (offline).
  No hard-coded dot hex. `data-testid="presence-dot-inner"` at `:60`.
- **a11y fix correct:** `aria-hidden="true"` is on the INNER decorative dot ONLY (`:55`, the
  `presence-dot-inner` div). The sr-only label (`<span className="sr-only">`, `:51`) sits on the
  OUTER container, which carries NO aria-hidden — so the status stays in the a11y tree.
- Note (non-blocking): the outer container has one inline hex `backgroundColor: '#121214'`
  (`PresenceDot.tsx:47`) — this is the ring MASK background, NOT the dot color. Legitimate;
  it is the original member-panel ring-mask pattern preserved. Not the CARRY-3 token surface.

### 2. Member panel refactored onto PresenceDot — TRUE
- `MemberListPanel.tsx:32` imports `PresenceDot`; `:93` renders `<PresenceDot online={online} />`.
- No residual dot literal: `grep -E '#10b981|#52525b|accent-emerald'` on the file → CLEAN.
- The `#27272a` / `rgba(...)` literals at `MemberListPanel.tsx:84-85` are the AVATAR-background
  colors, not the presence dot — correctly untouched.

### 3. AuthorPresenceDot tri-state — TRUE
- `MessageList.tsx:951` `AuthorPresenceDot`. Unknown gate: **`MessageList.tsx:954`**
  `if (!hasPresence(authorId)) return null` in the initializer, and the render-time gate at
  **`:971`** `if (status === null) return null`. Tri-state `useState<boolean | null>`.
  KNOWN online→emerald, KNOWN offline→muted, UNKNOWN→null (no false-default offline dot).

### 4. hasPresence accessor + single socket — TRUE
- `presenceSocket.ts:158-160` `export function hasPresence(userId)` = `presenceStore.has(userId)`.
- Single socket singleton unchanged: `presenceSocket.ts:44` real `io` import from `socket.io-client`;
  `:96` single `_socket = io(...)`. Not a fake/stub — genuine Socket.IO `/presence` namespace.

### 5. Self-presence fix (the T-5 fix) — TRUE, full chain present
- `packages/shared/src/profile.ts:3-4` `ProfileResponseSchema` includes `userId: z.string()`.
- `apps/api/src/profile/profile.controller.ts:31-39` (and `:58-70` update path) returns `userId`.
- `apps/web/src/shell/ProfileContext.tsx:13` imports `seedSelfPresence`; `:65` calls
  `seedSelfPresence(profile.userId)` on profile load.
- `presenceSocket.ts:191-196` `seedSelfPresence(userId)` seeds self→'online' **idempotently**
  (`if (!presenceStore.has(userId))` guard, then `notifyPresence()`). Idempotency real, not claimed.
- Chain provenance: `git show 12b5ec2` (#39) is the commit that added `seedSelfPresence`, the
  `userId` schema field, and the self-author test — this is the genuine T-5 fix landing, not a
  pre-existing artifact relabeled.

### 6. Deploy hash match — TRUE
- Live web `https://web-production-bce1a8.up.railway.app/` serves `index-BAcJ6YNx.js`
  (≠ prior `index-DBlhKjLW.js`) — new bundle confirmed live.
- api `/health` → HTTP 200.
- api `/profile` userId path: confirmed in code (`profile.controller.ts:39,70`); not live-probed
  (auth session required) — code path is authoritative and merged.

### 7. Antipattern catalog — CLEAN
- **Claimed-but-fake:** none. Every claim maps to real merged code.
- **Decorative tests:** none. `presence-dots.test.tsx` asserts behavior, not existence. The
  **T-5 self-author regression test is REAL** (`presence-dots.test.tsx:298-317`): asserts
  `_store.has(SELF_ID)` false pre-seed, dot ABSENT before seed (`:308`), then after
  `mockSeedSelfPresence(SELF_ID)` asserts `screen.getByText('Online')` present (`:316`) —
  i.e. **dot-present-after-seed is explicitly asserted.** Plus an idempotency test (`:326-342`)
  asserting seed does NOT overwrite an existing 'offline'. The mock (`:50-55`) faithfully mirrors
  the real `if (!_store.has) set→online` guard — not a system-under-test mock.
  AC4 single-socket bound assertion at `:439-450` (`subscribePresenceCallCount === 2` for 2 rows).
- **Undocumented deferrals:** none. All three are documented:
  - DM/hover sibling `fdb444fc` — deferred at P-0, noted `B-0-branch-and-schema.md:3` +
    `P-0-ceo-reviewer.md:8,24`.
  - per-row-subscription perf → V-2 — `B-6-review.md:13,29`, `T-9-journey.md:13,30`.
  - Playwright MCP chrome-absent → bundled-Chromium fallback per promoted T-5 rule 1 —
    `T-5-e2e.md:8-9,86`, `T-9-journey.md:14,31`.

---

## Was the T-5 critical genuinely fixed?
**YES.** Not just claimed:
1. Root cause named + correct: server snapshot excludes self (`getCoMemberUserIds` filters
   self out), so `hasPresence(ownUserId)` was false → own message rows showed no dot.
2. Fix is a real code chain: schema→controller→context→socket seeding, all merged in #39.
3. A real regression test asserts the exact reproduction (own userId absent → dot absent →
   seed → dot present) — `presence-dots.test.tsx:298-317`.

## Severity summary
- Critical / High / Medium / Low blocking findings: **NONE.**
- Informational only: `PresenceDot.tsx:47` ring-mask `#121214` hex is a mask bg (legitimate, not
  a dot-color token). Not a defect.

**APPROVE — hand to jenny (spec-conformance) + V-2 triage. No rework required at V-1.**
