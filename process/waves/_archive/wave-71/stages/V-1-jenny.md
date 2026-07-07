# V-1 jenny — Semantic spec-conformance verdict — wave-71 (M14 Block UI polish)

**Verdict: APPROVE**

**Scope:** Semantic conformance of DEPLOYED behavior to the wave-71 spec contract (tasks row `1193aebf` + sibling `1c633d2f`). This is a spec-INTENT check (does the deployed thing do what the contract meant), distinct from Karen's source-claim truth check.

**Targets:** web `https://web-production-bce1a8.up.railway.app` · api `https://api-production-b93e.up.railway.app`
**Method:** live API exercised end-to-end as Fixture A (`21984eb2-8029-4c1b-9e73-bc586a0be4d2`, `studyhallfixturea`) against Fixture B (`da74148e-132e-4faf-a526-a34c28e7481b`, `studyhallfixtureb`) via Bearer-token session; cross-checked against source (blocks.service.ts, blocks.controller.ts, packages/shared/src/blocks.ts, MemberListPanel.tsx, useBlocks.ts, BlockedUsersPanel.tsx). Auth is header-token (st-access-token as `Authorization: Bearer`), not cookie.
**Date:** 2026-07-07

---

## Spec B — GET /blocks returns the blocked user's display name + avatar (task 1c633d2f)

**CONFORMS (live).** A blocked B, then `GET /blocks` returned:
```json
{"blocks":[{"id":"98677f9b-...","blocker_id":"21984eb2-...","blocked_id":"da74148e-...",
 "created_at":"2026-07-07T05:19:27.685Z",
 "blockedUser":{"userId":"da74148e-...","displayName":"studyhallfixtureb",
   "username":"studyhallfixtureb","avatarUrl":null}}]}
```
- Real display name (`studyhallfixtureb`), NOT a raw UUID. AC met.
- Backward-additive: `blocker_id` / `blocked_id` / `created_at` preserved; `blockedUser` nested object ADDED (matches the "add a blockedUser object" contract option). AC met.
- Shared contract: `BlockListItemSchema = BlockSchema.extend({ blockedUser })`, `displayName` non-nullable, `username`/`avatarUrl` nullable; `avatarUrl` field name matches ServerMemberSchema/DmCandidateSchema convention. AC met.
- Fallback chain deployed: `display_name ?? username ?? 'Unknown user'` (blocks.service.ts:78); `avatarUrl:null` → initials fallback path. Live row had displayName == username (no separate display_name set) — the fallback resolves sensibly. `Unknown user` branch is defensive-only (FK makes it unreachable) — LEFT JOIN preserved so it never 500s. Edge cases sensible.
- Empty list → `{"blocks":[]}` unchanged (confirmed baseline + post-cleanup).

## Spec A — member-row Block affordance reflects state; enriched blocked-users list (task 1193aebf)

**CONFORMS.** Verified the state-reflecting semantics both at source and via the deployed data plane:
- **State reflection / live flip:** `MemberItem.isBlocked = blockedSet.has(m.userId)` derived from `useBlocks().blockedSet`; row renders Block when `!isBlocked`, Unblock when `isBlocked` (MemberListPanel.tsx:559/579). `doBlockUser` optimistically adds to the set (→ flips to Unblock immediately) then refetches; `doUnblockUser` optimistically removes (→ flips to Block). Live flip without reload. AC met. The deployed data that drives this flip is the `blocked_id` set from GET /blocks — which I confirmed live returns the correct blocked id.
- **ONE shared GET /blocks fetch:** `useBlocks` is a module-level store with an in-flight de-dupe guard (`_fetchPromise`); a single fetch feeds both BlockedUsersPanel and MemberListPanel — not two calls. AC met (problem-framer's "one fetch" note honored).
- **isSelf unchanged:** own row still suppresses Block/Unblock (`!isSelf && ...`, MemberListPanel.tsx:559/579) — wave-70 spec-D preserved. AC met.
- **BlockedUsersPanel renders enriched name + avatar:** consumes `item.blockedUser.{displayName, username, avatarUrl}`; avatar `<img src={avatarUrl}>` when present else initials via `getInitials(displayName)`; `@username` shown when present (BlockedUsersPanel.tsx:115-176). Renders name+avatar, never the UUID. AC met.
- **Loading fail-safe:** while loading, `blockedSet` is empty → affordance defaults to Block (neutral, no flicker-driven wrong action). AC met.

## no-IDOR / scoping (both specs)

**CONFORMS (live).** `GET /blocks` takes NO userId param — `blockerUserId` is always `req.session.getUserId()` (blocks.controller.ts:104). A's live list returned exactly the 1 block A created (all `blocker_id == A`). There is no request shape by which A can enumerate B's block list. `WHERE blocker_id = session` scoping unchanged.

## Launch-gate safety UNTOUCHED (wave-70 block + DM HIDE)

**NOT REGRESSED — proven with a clean before/after on prod:**
- With A→B block ACTIVE: `POST /dm/conversations {participantIds:[B]}` → **403** `"a block relationship exists between participants"`; B **hidden** from `GET /dm/candidates` (count 0).
- After UNBLOCK B: `GET /blocks` → `{"blocks":[]}`; B **reappears** in candidates (count 0→1).
- The candidate 0→1 swing proves the HIDE is block-driven, not incidental. The bidirectional predicate (`isBlockedBetween` OR-filter, blocks.service.ts:204-217) is unchanged by this wave — the spec explicitly fenced the DM-HIDE predicate and user_blocks schema out of scope, and neither was touched.

## Edge cases (live)

- Block non-existent user → **404** (defensive existence check). Conforms.
- Self-block → **400** ("Cannot block yourself"). Conforms (isSelf server-side guard intact).
- POST /blocks is idempotent via `onConflictDoNothing` on UNIQUE(blocker,blocked) (source) — not re-exercised live but returns the existing Block DTO on conflict.

## New semantic divergence introduced by the polish?

**None found.** No behavior outside the two specs changed. The one cosmetic note carried from T-5 (member-row affordances are hover-only `opacity-0 group-hover:opacity-100`, needing a wide viewport) is intended hover-reveal UX and pre-dates this wave — a future keyboard/touch-accessibility item, not a wave-71 spec divergence or regression.

## CLEANUP (prod-clean) — COMPLETE

Blocked during this verification and UNBLOCKED after:
- Fixture B `da74148e-132e-4faf-a526-a34c28e7481b` — block row `98677f9b-1c19-4d21-8cb3-a561d929cc9d` created then DELETE-ed (204). Final `GET /blocks` → `{"blocks":[]}`. Prod restored to no-blocks state.

## Findings summary

| Area | Result | Tag |
|---|---|---|
| Spec B — enriched GET /blocks (real name, backward-additive, fallbacks) | CONFORMS (live) | — |
| Spec A — member-row state reflection + live flip + single fetch + isSelf | CONFORMS | — |
| Spec A — BlockedUsersPanel renders name+avatar | CONFORMS | — |
| no-IDOR / own-list scoping | CONFORMS (live) | — |
| Launch-gate safety (block + DM HIDE bidirectional) | NOT REGRESSED (live before/after) | — |
| New semantic divergence | None | — |

**No spec-drift. No spec-gap.** Deployed behavior semantically satisfies the wave-71 contract for both specs and did not regress the wave-70 launch-gate safety.

**VERDICT: APPROVE**
