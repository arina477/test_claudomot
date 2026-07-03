# V-1 Semantic-Spec Verification (jenny) — wave-41

**Scope:** Educator role via `moderate_members` (seed 6cf06f99) + light moderation — member timeout + delete-any (sibling 6ddddc2d). Deployed LIVE.
**Method:** Live behavioral probing of the deployed API (api-production-b93e) + deployed frontend source trace. Verifies deployed *intent*, not source-claim truth (Karen's job).
**Verdict:** **APPROVE** — 1 Medium spec-drift (frontend affordance gating), 1 Low (pre-existing), 1 verification limitation. Core moderation intent is delivered and secure.

---

## What was verified LIVE (deployed api, real requests)

| Probe | Spec section | Result |
|---|---|---|
| Timeout B for 5min → `200 {mutedUntil}` ISO | 6ddddc2d AC2, contracts.api | PASS — `{"mutedUntil":"2026-07-03T21:52:30.979Z"}` |
| `mutedUntil` surfaces in member roster DTO | 6ddddc2d AC5 / edge, packages/shared/src/servers.ts:69 | PASS — roster shows B's future `mutedUntil`, A `null` |
| DELETE timeout → `204`, roster reverts to `null` | 6ddddc2d contracts.api | PASS — round-trips cleanly |
| Rank guard: timeout self (owner A) → `403` | 6ddddc2d AC3 ("nor self") | PASS — `{"message":"Cannot moderate yourself",...403}` |
| Validation: `durationMinutes:0` / `99999` → `400` | MemberTimeoutSchema (1–10080) | PASS — Zod field errors, 400 |
| Timeout non-member → `404` error envelope | contract conformance | PASS — `{"message":"Member not found in server",...404}` |
| No-auth timeout → `401` | AuthGuard | PASS — `{"message":"unauthorised"}` 401 |
| Grant/revoke `moderate_members` via PATCH role, GET reflects | 6cf06f99 AC2/AC4 round-trip | PASS — flat payload `{"moderate_members":true}` → DTO reflects → revoke → `false` |
| `moderate_members` present in role-permissions DTO + all Zod schemas | 6cf06f99 AC1, packages/shared/src/rbac.ts | PASS |
| Migration 0018 applied to live DB | 6cf06f99/6ddddc2d data | PASS (indirect: `mutedUntil` + `moderate_members` live in DTOs) |

## What was verified by DEPLOYED-SOURCE trace (could not reproduce live — see limitation)

- **Send-block on channel message AND thread reply (B-6 reply-bypass fix).** Both `createMessage` (messages.service.ts:461) and `createReply` (messages.service.ts:1062) call `assertNotMuted`. Fix is present in deployed code. — matches 6ddddc2d AC2 + edge-case #2.
- **Server-side auto-expiry, no cron.** `assertNotMuted` (messages.service.ts:1744-1758) refuses only when `muted_until > new Date()`; past/NULL ⇒ allowed. — matches edge "muted_until NULL or past → sends allowed; future → refused."
- **Delete-any backend gate + rank guard + fan-out.** Delete gate widened to `can(moderate_members) OR author` (messages.service.ts:831-837); moderator path applies `assertDeleteRankGuard` on the message author (messages.service.ts:846-848); top-level delete reuses the shipped `message.deleted` EventEmitter fan-out (messages.service.ts:978); reply delete emits `thread.reply.deleted` (messages.service.ts:959). — matches 6ddddc2d AC1/AC3.

---

## Findings

### F1 — Medium — DRIFT (frontend): delete-any affordance NOT gated on `moderate_members`
- **Spec:** 6ddddc2d AC5 — "delete-any affordance on the MessageList message hover-actions (**visible only with moderate_members**)." Journey criterion #4 — "a non-moderator sees the muted indicator but **no controls**."
- **Deployed behavior:** `MainColumn.tsx:296` passes `onDelete={deleteMessage}` **unconditionally** (no viewer-permission check; MainColumn never fetches the viewer's `moderate_members`). `RowActions` renders the delete button whenever `onDelete !== null` (MessageList.tsx:1267, 818-822), so a **non-moderator viewer sees a "Delete message (moderator)" affordance on other members' messages.** The builder chose this deliberately — MessageList.tsx:817 comment: "Delete — own messages (+ moderator: show and handle 403 gracefully)." On click by a non-moderator, `useMessages.deleteMessage` (useMessages.ts:721-738) optimistically tombstones locally, the API returns 403, and it reverts — a visible delete→reappear flash rather than a hidden control.
- **Why drift not gap:** the spec explicitly anticipated per-viewer visibility gating; the code has the mechanism (pass `onDelete=null`) but doesn't apply it. Deliberate deviation, not an unforeseen case.
- **Impact:** Non-security (backend authz is correct and verified — the widened gate at messages.service.ts:831-837 enforces `moderate_members`; a non-moderator delete is a true 403). It is a UX/journey drift: a moderator-only control leaks to every viewer and fails with an optimistic-revert flash. **Contrast:** the *timeout* affordance IS correctly gated — `MemberListPanel` renders the kebab only when `canModerate` (MemberListPanel.tsx:506-507,533) and shows a calm inline error on 403 (MemberListPanel.tsx:190-203). Only the delete affordance regresses.
- **Recommendation:** gate `onDelete` for non-own messages on the viewer's `moderate_members` (fetch via `getMyPermissions`, already used by MemberListPanel), so non-moderators see delete only on their own messages. Route to V-3 fast-fix. Non-blocking (graceful degradation; backend safe).

### F2 — Low — pre-existing / out-of-scope: empty role PATCH → 500
- A role PATCH whose body sets no recognized flat field (e.g. `{"permissions":{...}}` nested, or `{}`) returns `500 Internal server error` instead of `400`/no-op. This is the wave-10 role-update path, not wave-41 scope. Correct flat payloads work perfectly (verified). Noted for hygiene only; not a wave-41 defect.

---

## Verification limitation (not a product defect)

**Fixture B credentials are `WRONG_CREDENTIALS_ERROR` on the deployed api.** The task brief states B uses the same password as A; the deployed auth rejects it. B *is* a real member of server `ad62cd12` (appears in the roster), so this is fixture-doc drift, not a product bug. Consequence: the only user with a live, mutable session token is A, who is the server owner (unmuteable/unmoderatable by rank guard). I therefore **could not independently reproduce live**: (a) a muted user's send being refused on channel + thread, (b) auto-expiry via the send path, (c) a non-moderator's 403 on delete/timeout, (d) a moderator deleting another user's message + socket fan-out. All four are verified by deployed-source trace above and were asserted by T-8 (real-PG authz: rank guards, both mute paths, non-moderator 403, no IDOR — commit 94a8f24). Recommend the test-account fixture doc for B be corrected so future V-blocks can reproduce the two-user paths live.

---

## Spec-contract conformance note
No P-2 spec divergence found. The DB `tasks.description` YAML (seed 6cf06f99 + sibling 6ddddc2d) and the deployed behavior agree on endpoints, response shapes ({mutedUntil} ISO 200 / 204 delete / 403-404-401 envelopes), the `moderate_members` gate, rank guard (owner + manage_server/manage_roles + self), and server-side expiry. The sibling's convenience prose matches the seed YAML.
