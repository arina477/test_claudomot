# Karen P-4 Phase-2 — wave-71 (M14 Block UI-polish) claim verification

**Verdict: APPROVE**

The plan's load-bearing claims are TRUE against the codebase. Every enrichment
target exists in the claimed shape, every reuse pattern the plan leans on is
real (not aspirational), and every named specialist is registered in AGENTS.md.
This is an honestly-scoped additive polish wave with no fabricated foundations.

---

## Per-claim results

### 1. MemberListPanel block affordance is hardcoded block-only + live-state pattern exists — VERIFIED
`apps/web/src/shell/MemberListPanel.tsx:546-566` — the Block affordance is a
single unconditional `<button>` gated only on `!isSelf`; it always renders
`ProhibitIcon` with `aria-label={`Block ...`}` and calls `onBlock(...)`. There
is NO `isBlocked` lookup anywhere on the row — confirmed by grep (no `isBlocked`
token in the file). So FINDING-1 (always "Block") is real.

The live-state pattern the plan claims to reuse also exists in the SAME file:
- **Mute:** `isMuted(mutedUntil)` helper at :69-71; `memberIsMuted` derived at
  :438; `mutedUntil` plumbed on the member DTO; `onMutedChange` updates member
  state live at :768-769.
- **Presence:** `usePresence()` → `getStatus`/`tick` at :699; online/offline
  partition via `getStatus(m.userId) === 'online'` at :776; `data-presence-tick`
  re-render key at :787.

The block affordance is genuinely the lone hardcoded (non-state-reflecting) one
— matches the spec's REUSE note exactly.

### 2. listBlocks is a flat SELECT with NO JOIN — VERIFIED
`apps/api/src/blocks/blocks.service.ts:137-141` — `listBlocks` is
`db.select().from(userBlocks).where(eq(userBlocks.blocker_id, ...))` then
`.map(rowToDto)`. No JOIN. `rowToDto` (:37-49) emits only `id / blocker_id /
blocked_id / created_at`. Clean enrichment target; the no-IDOR `WHERE
blocker_id` scoping the plan says stays unchanged is right here.

### 3. BlockSchema returns bare FK ids, no display fields — VERIFIED
`packages/shared/src/blocks.ts:24-29` — `BlockSchema` = `{ id, blocker_id,
blocked_id, created_at }`, all bare. `BlockListResponseSchema` (:36-38) wraps
`z.array(BlockSchema)`. This is exactly the DTO the enrichment extends
(backward-additive).

### 4. BlockedUsersPanel renders the UUID fallback — VERIFIED
`apps/web/src/shell/BlockedUsersPanel.tsx:263-268` — the `getBlocks().then`
maps each block with `displayName: b.blocked_id` (the raw FK UUID),
`username: ''`, `avatarUrl: null`. This is the render target for spec-A AC3.
FINDING-2 (raw UUIDs) is real.

### 5. An existing displayName+avatar member-display JOIN exists to mirror — VERIFIED
`apps/api/src/dm/dm.service.ts` `getDmCandidates` (:805-851) is the canonical
projection: `.innerJoin(users, ...)` selecting `users.display_name` +
`users.avatar_url` + `users.username`, mapped `displayName: display_name ??
username ?? user_id` (the same fallback appears at :337, :390, :470 for DM
participants). This is a REAL, in-repo JOIN shape listBlocks can mirror
column-for-column — and its `?? username ?? user_id` fallback already satisfies
spec-B edge-cases (no displayName → username; never the raw UUID). Not
hand-waving.

### 6. getBlocks + unblockUser exist in api.ts (wave-70) — VERIFIED
`apps/web/src/auth/api.ts` — `unblockUser` (:974-975, `DELETE /blocks/:id` →
void, idempotent), `getBlocks` (:982-983, unwraps `{blocks}` → `Block[]`).
`blockUser` also present (:963-967). All three wave-70 client methods are live.

### 7. Specialists in AGENTS.md — VERIFIED
`command-center/AGENTS.md`: `react-specialist` (:82), `typescript-pro` (:83),
`backend-developer` (:70) — all three plan-named executors registered and
pre-built. No fabricated agent names.

### 8. One-fetch-feeds-both antipattern claim is grounded — VERIFIED (grounded, not hand-waving)
The claim is that ONE `GET /blocks` fetch can feed both the BlockedUsersPanel
list AND the MemberListPanel blocked-id Set. Grounded because:
- Both surfaces consume the identical `api.getBlocks()` client method
  (api.ts:982) returning `Block[]` — BlockedUsersPanel already calls it
  (BlockedUsersPanel.tsx:258); MemberListPanel would call the same.
- The list needs the enriched rows (name+avatar); the member Set needs only
  `blocked_id` — both are fields on the SAME enriched `Block[]`. One response
  trivially serves both projections (`.map` for the list, `new Set(b =>
  b.blocked_id)` for the Set).
The plan's "shared hook (useBlocks) or lifted fetch" is a real, standard React
sharing pattern, not a fiction. Load-bearing claim holds.

---

## Reality-check notes (non-blocking, for the executor)

- **Web-side wiring is net-new, not "reuse".** The plan's reuse language is
  accurate for the *pattern* (mute/presence live-state) and the *server JOIN
  shape* (getDmCandidates), but MemberListPanel today has zero blocks fetch —
  B-3 must ADD the fetch, the Set, the `isBlocked` prop threading down to the
  member row, AND the Block↔Unblock branch (label swap + `unblockUser` wire +
  optimistic/refetch Set update). That's real new code, correctly assigned to
  react-specialist. Not a one-liner; the plan sizes it honestly (own tests
  called out).
- **`rowToDto` must change shape, not just the query.** B-2 enriches the JOIN;
  `rowToDto` (:37-49) currently hard-types a 4-field row. It has to be widened
  (or replaced) to carry the joined display fields — a straightforward but
  required edit the plan implicitly covers under "return enriched DTO".
- **Loading-state fail-safe (spec-A edge-case) is a genuine acceptance bar.**
  While `GET /blocks` is in-flight the affordance must default to "Block"
  (fail-safe) with no flicker-driven wrong action. The executor should not skip
  this — it's a testable AC, not decoration.

None of the above weakens the APPROVE — they are execution reminders, not gaps
in the plan's foundations.

## Cross-agent collaboration
- **@task-completion-validator** — at V-1, confirm the member-row toggle
  actually flips Block↔Unblock end-to-end against a live blocked pair (not just
  a mocked Set), and that BlockedUsersPanel shows a real name (not the UUID).
- **@jenny** — verify spec-B AC1 "reuse the existing display-projection" is
  literally the getDmCandidates JOIN shape, and spec-A AC2 "own row suppresses
  Block (isSelf, unchanged)" survives the toggle rewrite.
- **@code-quality-pragmatist** — watch B-3 doesn't introduce a second blocks
  fetch (the one-fetch invariant) or over-abstract the shared hook.
