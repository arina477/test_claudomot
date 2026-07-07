# P-4 Phase-2 Claim Verification — Karen — wave-70 (M14 Block feature)

**VERDICT: APPROVE**

All 7 load-bearing claims in the P-3 plan + spec-A contract check out against the codebase. The DM HIDE seams exist, the reuse targets (schema mirror, DM gate idiom, Zod style refs) are real, all four specialists are registered, `user_blocks` is genuinely net-new, and the spec-D member-row defect is present exactly as described. No hand-waving found. The plan is grounded in reality and safe to execute.

---

## Per-claim findings

### Claim 1 — DM HIDE-predicate seams exist — VERIFIED
All five DmService methods exist in `apps/api/src/dm/dm.service.ts`. Cited line numbers are accurate to within a couple lines:
- `createConversation` — `apps/api/src/dm/dm.service.ts:201` (plan said :201) ✓
- `listConversations` — `apps/api/src/dm/dm.service.ts:382` (plan said :382) ✓
- `sendMessage` — `apps/api/src/dm/dm.service.ts:494` (plan said :494) ✓
- `listMessages` — `apps/api/src/dm/dm.service.ts:576` (plan said :576) ✓
- `getDmCandidates` — `apps/api/src/dm/dm.service.ts:685` (plan said :685) ✓
Five for five, exact. The seams the HIDE predicate layers onto are real.

### Claim 2 — reports.ts is a valid schema-mirror reference — VERIFIED
`apps/api/src/db/schema/reports.ts` exists (69 lines). It demonstrates exactly the conventions the plan wants `user_blocks` to mirror:
- `uuid('id').primaryKey().defaultRandom()` — `reports.ts:41`
- text FK to users: `text('reporter_id').notNull().references(() => users.id)` — `reports.ts:42-44`
- NO pgEnum — status/target_type are `text` with app-layer Zod validation, explicitly documented — `reports.ts:28,45,55`
- index convention: `index('reports_target_server_status_idx').on(...)` — `reports.ts:61-63`
- `timestamp(..., { withTimezone: true }).defaultNow().notNull()` — `reports.ts:57`
- `InferSelectModel`/`InferInsertModel` type exports — `reports.ts:67-68`
The mirror target is a clean, direct template for the `user_blocks` DDL (UNIQUE(blocker_id, blocked_id) is the one net-new construct not present in reports.ts, but that's an additive Drizzle primitive, not a convention conflict).

### Claim 3 — user_blocks is genuinely net-new — VERIFIED
`ls apps/api/src/db/schema/` returns 14 files; NO `user-blocks.ts` / `blocks.ts` (grep for `block` returned exit 1 / no match). `apps/api/src/db/schema/index.ts` has 13 exports, none block-related. No user-to-user block primitive exists. Confirmed net-new — the "NEW table WINS" architecture-delta rationale (no reuse of wave-41 server-scoped ModerationService) is sound.

### Claim 4 — MemberListPanel exists + Report renders unconditionally, no self-guard — VERIFIED (the spec-D defect is real)
`apps/web/src/shell/MemberListPanel.tsx` exists (30 KB). The Report button (`report-member-btn-${member.userId}`) is rendered inside `MemberItem` at `MemberListPanel.tsx:516-534` with NO conditional wrapper — unlike the moderation kebab immediately below it, which IS gated (`{canModerate && ...}` at `:537`). `MemberItemProps` (`MemberListPanel.tsx:413`) carries no `selfUserId` / `viewerId` / `isSelf` prop, and nothing threads a session/profile userId into the component. The defect (Report affordance shows on the viewer's own row) is present exactly as spec-D describes, and the fix-host is confirmed.

### Claim 5 — shared Zod-contract style references exist — VERIFIED
- `packages/shared/src/reports.ts` exists (4.4 KB) — the ReportSchema serialization/camelCase-DTO reference spec-B cites.
- `packages/shared/src/privacy.ts` exists (741 B) — clean Zod idiom (`z.object`, `z.enum`, `z.infer` typed exports at `privacy.ts:9-21`). Solid style template for `blocks.ts`.

### Claim 6 — all four specialists exist in AGENTS.md — VERIFIED
- `postgres-pro` — `command-center/AGENTS.md:81` ✓
- `react-specialist` — `command-center/AGENTS.md:82` ✓
- `typescript-pro` — `command-center/AGENTS.md:83` ✓
- `backend-developer` — `command-center/AGENTS.md:70` ✓
All four registered; routing table in the plan is executable.

### Claim 7 — "reuse the DM-visibility idiom / isBlockedBetween helper" is grounded, NOT hand-waving — VERIFIED
DmService already has the exact inline per-seam gate pattern the plan proposes to mirror:
- `isParticipant(conversationId, userId)` — `apps/api/src/dm/dm.service.ts:120` — a per-query counterpart-id boolean check hitting a join table, called inline at each read seam (the IDOR-safe 404 gate).
- `enforceWhoCanDm(targetId, ...)` — `apps/api/src/dm/dm.service.ts:135-176` — a per-target permission gate invoked in a loop before any write in `createConversation` (`:237-239`).
A `isBlockedBetween(a, b)` helper reused at each of the 5 seams is a structurally identical addition to an established idiom — not a second permission system. The plan's INLINE-per-seam-WINS trade-off (a global interceptor "can't see the per-query counterpart id") is corroborated: `isParticipant` / `enforceWhoCanDm` are exactly per-query, counterpart-scoped checks. Reuse claim is real.

---

## Notes for the head-product gate
- Zero WRONG, zero UNVERIFIED. Nothing to rework at the plan level.
- Minor (non-blocking): the plan's :201/:382/:494/:576/:685 line refs are already labelled "approximate" and match to the exact `async <method>(` declaration line — no drift risk for the executor.
- Spec-D fix and spec-C block affordance both land in `MemberListPanel.tsx`; the plan's SERIAL-under-one-react-specialist call (avoiding parallel edit conflict) is the right sequencing given both touch `MemberItemProps`.
