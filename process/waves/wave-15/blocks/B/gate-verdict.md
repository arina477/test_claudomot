# Wave 15 — B-6 Verdict

**Reviewer:** head-builder (fresh spawn, Phase-1 gate)
**Reviewed against:** process/waves/wave-15/blocks/B/review-artifacts.md
**Attempt:** 1  (first gate)

## Verdict
APPROVED

## Rationale
The M3 @mentions build implements all three spec tasks faithfully against the locked contract, with the load-bearing surfaces verified line-by-line. The critical username chain — the F-4-class drift that B-4 fixed — genuinely closes end to end: the autocomplete now inserts `member.username` (the canonical handle), the member source (`listServerMembers`) SELECTs `users.username`, the shared `ServerMember` contract carries `username: string | null`, and the resolver matches `lower(users.username) = ANY(tokens)` under an `IS NOT NULL` guard. Inserting `@username` from the picker therefore produces a token the resolver matches, persisting a row — the feature actually works. Security is solid at every door: `GET /me/mentions` derives `viewerUserId` from `req.session.getUserId()` (never a param), is membership-scoped via a `server_members` join on `channels.server_id`, and excludes soft-deleted messages; mention resolution is restricted to members of the channel's server, with the `username IS NOT NULL` guard preventing a NULL-username collision; `@everyone`/`@role` are correctly out of scope (the parser only captures individual username slugs). Schema 0007 is drizzle-generated, mirrors `message_reactions` exactly (FK `ON DELETE CASCADE` on message, `UNIQUE(message_id, mentioned_user_id)`, recency index), and is non-destructive. Persistence is idempotent (`ON CONFLICT DO NOTHING` honoring the UNIQUE), edit add/remove diffing is correct, and realtime rides `mentions[]` on the existing `message.created` → `message:new` fan-out over the `/messaging` gateway — no new namespace, per spec. Typecheck is green across all three packages and the 280-test API suite passes (re-run, confirmed); the combobox ARIA correctly places `role=combobox` + `aria-activedescendant` + `aria-controls` on the focusable textarea, with the listbox/option roles on the non-focusable popover — the textbook WAI-ARIA 1.2 combo-with-list pattern. None of the findings below are correctness- or security-blocking; they are routed to the appropriate downstream block.

## Findings (non-blocking; documented for downstream)

### F-1 (Medium → T-block) — Self-mention unread-badge accuracy gap
`useMentionBadge` increments on `msg.mentions.some(m => m.username === viewerUsername)` without excluding the case where the viewer is also the message **author**. The spec edge-case states "Self-mention → pill but no unread badge" / "no false badge for self-mention." In practice the `activeChannelId` guard suppresses the common path (you self-mention in the channel you are viewing), so the false badge only fires in the narrow race where the author self-mentions then leaves the channel before the socket echo. The pill emphasis (self vs other) is correctly implemented in `MessageList.renderBodyWithMentions`. Route the accuracy hardening (compare `msg.authorId` to the viewer, or skip when author === viewer) and an explicit self-mention badge test to the T-block (T-1/T-4); not a B-block correctness blocker.

### F-2 (Low → accepted) — Web-side mention test coverage thin
Web tests cover the autocomplete username-threading (4 tests) but not the self-mention pill emphasis or the unread-badge edge cases. Backend coverage is strong (24 mentions.spec + 24 messages.service.spec). Coverage expansion belongs to the T-block, not a B re-work.

### F-3 (Low → accepted) — biome `useSemanticElements: "off"` set globally
B-5 disabled `useSemanticElements` project-wide in `biome.json` because the rule false-positived on the valid combobox listbox/option pattern. The B-5 note claims it "can't suppress inline in biome 1.9.4," yet `MentionAutocomplete.tsx` carries inline `biome-ignore` comments for the same rule (lines 299, 310) — so the rule is now suppressed both globally AND inline (redundant). Verdict: the global disable is **acceptable for this self-use MVP** — `useSemanticElements` is a low-value nudge rule and the project already documents the deliberate div-based combobox at the call sites. Preferred follow-up (non-blocking, route to L-2 or a later lint-hygiene task): drop the global override and rely on the inline ignores, OR drop the inline ignores and keep the global — not both. No rework required.

### F-4 (Low → accepted) — Commit-per-spec discipline (multi-spec Action 6)
Commits are organized by B-stage (B-2, B-3) rather than strictly one-`task_id`-per-commit: the B-3 commit (`98acff3`) bundles autocomplete (cd585f04) and pills/unread (c3f3f62a) together, and messages cite stage codes rather than task_ids. All three claimed task_ids are represented in the branch's work (data-plane in B-2, autocomplete + pills/unread in B-3). Rebasing a green, fully-verified branch to split these commits carries more destabilization risk than the cosmetic benefit warrants for a self-use MVP. Accepted as a deviation; no `git rebase -i` required. Recorded so the C-block PR description can map commits → tasks explicitly.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
