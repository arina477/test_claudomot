# P-0 Problem-Framer — wave-80 (M13 leg-3b: read-receipt + presence privacy toggles)

Task: 3038a4bc — extend `UpdatePrivacySchema` + `PrivacySettingsResponseSchema` with
`sendReadReceipts` + `showPresence`; add backing columns (migration); honor in the
read-receipt / presence emit paths + privacy.service; surface 2 toggles on
SettingsPrivacyPage.

## VERDICT: REFRAME → descend to option (a) [Descope `sendReadReceipts`]

Ship **only `showPresence`** this wave (it gates a real, currently-ungated presence
broadcast). **Drop `sendReadReceipts` entirely** — schema field, column, and UI toggle.
It gates a feature StudyHall does not have; shipping it as a stored-only preference is
security theater and is rejected on the wave-79 precedent. `sendReadReceipts` +
the read-receipt feature it depends on become a future M13/backlog sibling.

## Evidence (verified against code, not seed prose)

**Claim A — no message read-receipt feature exists: CONFIRMED.**
- `apps/api/src/db/schema/messages.ts` — messages table has `id, channel_id,
  author_id, content, created_at, idempotency_key, is_edited/edited_at,
  is_deleted/deleted_at, thread_parent_id, reply_count, last_reply_at`. **No
  `read_at`, `seen_at`, `delivered_at`, or any per-recipient receipt column.**
- `apps/api/src/db/schema/dm.ts` (dm_messages) — `id, conversation_id, author_id,
  content, ciphertext, sender_key_ref, envelope_version, idempotency_key,
  created_at, deleted_at`. **No read/seen column either.**
- `read_at` exists **only** on `notifications` (`schema/notifications.ts:69`) — that is
  notification-tray read/unread, NOT a sender-visible "seen by X" on a message. Seed's
  scope-hole finding is correct.
- Grep for `seen | readReceipt | mark.?read | message.read` across `apps/api/src`
  returns **zero** message-receipt code. The only `seen` hits are unrelated local
  dedup `Set`s (`presence.service.ts:128`, `messaging/mentions.ts:46`). No emit path,
  no gateway handler, no client "seen" UI. There is nothing for `sendReadReceipts` to gate.

**Claim B — `showPresence` gates the existing presence service: CONFIRMED and honorable.**
- `apps/api/src/presence/presence.gateway.ts` broadcasts `presence:online`
  (line ~174) and `presence:offline` (line ~221) to `presence:server:<serverId>`
  co-member rooms; `presence.service.ts` tracks the in-memory online map.
- Presence today honors **channel visibility** only — it has **no user-level
  "hide my presence" gate** (grep for privacy/showPresence/invisible in the presence
  module = none). So `showPresence` is a real, currently-missing enforcement seam: the
  emit points at gateway ~174/~221 (and the snapshot builder ~163) are the concrete
  honor points. Honest, small, shippable win.

## Symptom-vs-cause

- **Symptom:** "the wave should add two privacy toggles because the decomposer prose
  said M13 leg-3b = read-receipt + presence toggles."
- **Cause:** the milestone prose assumed a read-receipt feature that was never built.
  The *toggle* is not the deliverable; the *user-controllable privacy behavior* is. A
  toggle with no behavior behind it is the symptom-masking artifact — it makes the
  Settings page *look* more complete while changing nothing observable. Fixing the
  symptom (adding the toggle) leaves the cause (no read-receipt capability, and the
  dishonest control) in place.

## Antipattern red-team

- **Placeholder / no-op control = security theater — HARD FLAG on option (b).**
  Shipping a toggle labeled "Send read receipts" that gates nothing is exactly the
  wave-79 anti-pattern, and the code already carries the correction: `dm.service.ts:10`
  — *"who_can_dm enforcement (NEW — previously stored but never enforced)"* — wave-79
  spent effort retrofitting enforcement onto a setting that had been stored-only. A
  privacy control is worse than a cosmetic one: it makes an affirmative claim about the
  user's privacy ("your read receipts are off / on"). A user who toggles it OFF believes
  they are now invisible-on-read when there is no read event at all — the control
  *misleads about privacy*, which is more harmful than the control being absent.
  PRODUCT-PRINCIPLES Rule 1 ("verify every seed claim about what exists or is absent")
  and Rule 2 ("verify the named entity is the real boundary") both fire: `sendReadReceipts`
  names a boundary (the read-receipt emit path) that does not exist.
- **Option (c) [build read-receipt feature first] = scope expansion / gold-plating for
  THIS wave.** It would require: `seen_at`/receipt table + write path, a socket emit,
  sender-visible "seen by" UI, and *then* the toggle — a multi-task feature, not a
  privacy-toggle wave. It also introduces a new product/UX decision (do we even want
  read receipts? many chat products deliberately omit them) that no live bet or founder
  decision has ratified. Not this wave; route as its own milestone/backlog item.

## Recommended reframe: option (a), with rationale

Descope `sendReadReceipts`. Ship `showPresence` alone. Rationale in one paragraph:
of the two proposed toggles, exactly one has a real behavior to gate — `showPresence`
over the live presence broadcast — and it fills a genuine enforcement gap (presence is
currently un-gated at the user level). The other toggle would ship a privacy control
that gates a non-existent feature, actively misleading users about their privacy; the
honest move is to not ship it until the capability it controls exists. A single honest
toggle is a smaller, truthful, fully-verifiable wave and is strictly better than a
two-toggle wave where one toggle is a lie.

## Binding refinements for P-1 / P-2

1. **Scope = `showPresence` ONLY.** P-1 decomposes a single-field change; P-2 spec
   covers exactly one toggle end-to-end. Do NOT carry `sendReadReceipts` into schema,
   migration, service, or UI.
2. **Schema:** add `showPresence: z.boolean()` to BOTH `UpdatePrivacySchema` and
   `PrivacySettingsResponseSchema` in `packages/shared/src/privacy.ts`. Default `true`
   (presence visible today; opt-out preserves current behavior for existing users).
3. **Migration:** ONE backing column `show_presence boolean NOT NULL DEFAULT true` on
   `users` (`apps/api/src/db/schema/users.ts`). Generate + commit the Drizzle migration
   (BUILD convention — do not hand-edit generated SQL).
4. **Honor point is mandatory, not optional (this is the whole point of the wave).**
   The presence emit paths in `presence.gateway.ts` (`presence:online` ~174,
   `presence:offline` ~221, and the `presence:snapshot` builder ~163) MUST consult
   `show_presence`: a user with `show_presence=false` is excluded from co-members'
   online view / snapshot. P-2 must write an acceptance criterion proving a
   presence-hidden user does NOT appear online to a second client (two-client test —
   single-client presence assertions are coverage theater per T-block). Storing the
   column without gating the emit reproduces the exact anti-theater failure this reframe
   exists to avoid.
5. **privacy.service append-event:** the existing `updatePrivacy` change-detection +
   `appendPrivacyEvent('privacy_settings_changed', …)` (privacy.service.ts:67-86) must
   include `show_presence` in the changed-fields diff so toggling it writes an audit
   event; no new event type needed.
6. **UI:** ONE toggle on `SettingsPrivacyPage.tsx`, labeled around presence visibility
   (e.g. "Show when I'm online"). Update `SettingsPrivacyPage.test.tsx` for one toggle,
   not two.
7. **Future sibling (note for N-2 / backlog):** `sendReadReceipts` + the underlying
   message read-receipt feature (seen_at + emit + sender-visible UI + toggle) is a
   separate future M13/backlog task. Do not seed it as shippable now; it depends on a
   product decision (do we want read receipts at all?) that is unratified.
