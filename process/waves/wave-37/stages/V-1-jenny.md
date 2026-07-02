# V-1 Semantic-Spec Verification — jenny — wave-37 (persistent in-app notifications)

**Verdict: APPROVE**

Deployed/merged state (main @ a601252, PR #51) matches the INTENT of all three spec
blocks (0b33df33 / f3f52d9a / edac03e0). Verified against live prod (api-production-b93e,
web-production-bce1a8) with fixtures A + B, plus source review of the merged code. All
BINDING items honored. No spec-drift found. One honest spec-anticipated NON-GOAL confirmed
as intentional (not a miss).

---

## Method

- Read authoritative spec from `tasks.description` (id 0b33df33) — 3-block multi-spec.
- Confirmed wave-37 merged to `main` (PR #51 `86b7323`, C/T/V stages after).
- Source-reviewed: `notifications.ts` (schema), `notifications.service.ts`,
  `notifications.controller.ts`, `reminder-scan.service.ts`, `messages.service.ts`
  (decoupling), `useNotifications.ts`, `HeaderBell.tsx`, `NotificationsPanel.tsx`, `api.ts`.
- **Live prod behavior tests** with two distinct verified fixtures (A owner, B actor), a
  fresh REST session (proves cross-session durability, independent of any socket/tab state).

---

## Spec 0b33df33 — model + persist-on-mention + list/unread API → PASS

| AC | Deployed evidence | Result |
|---|---|---|
| notifications table + `(user_id, read_at, created_at DESC)` index; additive migration | `apps/api/src/db/schema/notifications.ts:52-91` — table with all spec columns; `notifications_user_read_created_idx` on `(user_id, read_at, created_at DESC)`. | PASS |
| persist-on-mention on BOTH create AND edit; per mentioned user; no self-notify; edit-dedup | LIVE: B posts `@studyhallfixturea` → A's fresh-session GET returns a durable row, `unreadCount` 0→1, `readAt:null`, actor `studyhallfixtureb`, excerpt present. B's own list has **0** self-notify rows for that message. Edit path: B posts no-mention msg, edits to ADD `@a` → exactly **1** row appears; re-edits (mention unchanged) → still exactly **1** row (dedup via `notifications_user_message_mention_uidx`). Source: create emit `messages.service.ts:600-611`, edit emit `:753-764` (only `toInsert` = newly-added), both with `if (mentioned_user_id === author) continue`. | PASS |
| assignment_reminder persist inside send-once guard; no double-write | `reminder-scan.service.ts:266` calls `createForReminder` AFTER the `assignment_reminder` ON CONFLICT send-once gate (`:250-260`) returns a fresh row; `createForReminder` itself is `ON CONFLICT DO NOTHING` on `notifications_user_assignment_reminder_uidx`. Belt-and-suspenders, no double-write. | PASS |
| GET /me/notifications self-scoped (no userId param), newest-first, paginated, unreadCount | LIVE: 200 returns items newest-first + `unreadCount`; `controller.ts:49` derives userId from `req.session.getUserId()` only; unauth → **401**; garbage cursor → **200** first page (`service.ts:decodeCursor` returns null → falls through). Cursor carries µs precision (`created_at::text`) to avoid ms-truncation page-skip. | PASS |

**@OnEvent decoupling (BINDING #4 substrate):** confirmed — `messages/messages.service.ts` has
**zero** notification imports; persistence is entirely `@OnEvent('mention.created')` in
`notifications.service.ts:85`. messages.service untouched by notification concerns.

## Spec f3f52d9a — owner-only read-state (404 non-owner) + mark-all + idempotent → PASS

| AC | Deployed evidence | Result |
|---|---|---|
| PATCH /:id/read owner-only; **404** (not 403) non-owner OR nonexistent; idempotent | LIVE: B PATCH A's notification → **404**; PATCH nonexistent uuid → **404**; unauth → **401**; A PATCH own → **200 {unreadCount:0}**; A PATCH same again → **200** no-op. Deliberate 404 convention (`service.ts:254-258` throws NotFoundException on 0 rows affected — conflates not-found + not-owner). | PASS |
| POST /read-all marks all caller unread; idempotent; unreadCount 0 after | LIVE: POST read-all → **200 {unreadCount:0}**; repeat → **200 {unreadCount:0}** (idempotent). | PASS |
| Controller-level authz 404 (real-PG integration) | `notifications.controller.spec.ts` + `test/integration/notifications-authz.spec.ts` present; live 404 reproduced above. | PASS |

The deliberate 404 (not 403) convention is exactly as BINDING #2 mandates — verified live, not
just asserted in tests.

## Spec edac03e0 — web notifications center → PASS

| AC | Deployed evidence | Result |
|---|---|---|
| Panel lists viewer notifications newest-first, unread styling, §113 states (skeleton not spinner) | `NotificationsPanel.tsx` — loading = `SkeletonRow ×3` (`:497-507`, shimmer not spinner), error = icon+message+`Retry connection` (`:510-551`), empty = icon+headline+CTA (`:554-598`), loaded = list w/ emerald-dot unread + brighter bg / reduced-opacity read (`:147-148`, `:239`). Rows are real `<button>`. | PASS |
| Header bell, server-derived unread count; LIVE mentions-only increment via existing socket | `HeaderBell.tsx` — badge from `unreadCount` (`:38`), 9+ cap; `useNotifications.ts:60-66` seeds count from GET response (server = SoT); `:92-97` `onMention(() => setUnreadCount(n=>n+1))` reuses the existing `mention` socket, no refetch. Reminders NOT live-pushed (comment `:90`). | PASS |
| Click-through navigates + marks-read-on-open; mark-all clears + zeroes bell | `NotificationsPanel.tsx` MentionRow/ReminderRow `handleClick` → `onMarkRead(id)` then navigate then close (`:133-139`, `:212-216`); mark-all button `:451-479` → `markAllRead` → optimistic zero + server-confirmed 0. Client verbs: PATCH single / POST read-all (`api.ts:526-540`) — the earlier POST→404 verb bug is fixed. | PASS |
| Server read_at = SINGLE SOURCE OF TRUTH; useMentionBadge stays independent (drift = NON-GOAL) | Bell/panel unread always reconciled from server `unreadCount` (optimistic then corrected, `useNotifications.ts:116`, `:150`). `useMentionBadge.ts` has **0** references to `useNotifications` / `/me/notifications` — fully independent, no coupling. HeaderBell mounted at `MainColumn.tsx:252`. | PASS |

---

## BINDING checklist (P-0 problem-framer + ceo-reviewer)

1. Server read_at = SoT; useMentionBadge independent — **honored** (0-coupling verified).
2. Owner-only read, **404** not 403 — **honored** (live 404 on non-owner + nonexistent).
3. Bell live = mentions-only; reminders on next fetch; no reminder socket event — **honored**
   (only `onMention` subscribed; no reminder emit anywhere in gateway/service).
4. persist covers CREATE + EDIT, no dup rows, no self-notify — **honored** (live create + edit-dedup + no-self-notify all proven).
5. Retention/cleanup out of scope — **honored** (not built, as specced).

---

## Spec-gap detection

- **Reminder-row live-push gap** (raised in the prompt): this is an **honest spec-anticipated
  NON-GOAL, not a spec miss and not an external-cred deferral.** Spec edac03e0 explicitly states
  "Reminders surface on next fetch — live-push for reminders is a NON-GOAL (no reminder socket
  event; do not add one)." Crucially, the in-app reminder **row persists independent of email**:
  `reminder-scan.service.ts:266` calls `createForReminder` (in-app persist) BEFORE
  `emailService.sendAssignmentReminder` (`:268`), so the durable notification is created even
  if email delivery is unavailable — the persist is not email-cred-gated. The only thing gated
  on the cron/email path is the *email*, not the in-app notification. So the reminder feed row is
  a first-class, credential-independent deliverable; only its *live push* is the documented
  non-goal. No user-facing contradiction: a reminder appears in the panel on the next open/fetch,
  and HeaderBell reloads the panel on every open (`HeaderBell.tsx:45-49`), so it surfaces
  promptly without a socket event.

- **No user-facing contradiction from the two-scope badge design.** The per-channel inline
  mention badge (useMentionBadge, ephemeral per-tab) and the global feed unread (server read_at)
  are two distinct scopes by design; drift between them is the documented NON-GOAL. Since they
  are fully decoupled in code, there is no path where one silently corrupts the other.

- **Nothing deployed behavior revealed that the spec failed to anticipate.** Cursor µs-precision,
  the ON-CONFLICT dedup made real by two partial-unique indexes, the swallow-on-persist-failure
  best-effort semantics, and the SET NULL vs CASCADE FK choices are all documented in-code and
  consistent with the self-use-scale scope the spec declares.

---

## Drift vs Gap summary

- **Spec-drift (code wrong vs spec):** none found.
- **Spec-gap (spec wrong/silent):** none material. The reminder-live-push item is an
  explicitly-declared NON-GOAL that the code honors correctly, not a gap.

**APPROVE** — shipped behavior meets the acceptance criteria's intent on the deployed system,
not merely by test assertion. Live prod evidence corroborates every load-bearing AC.
