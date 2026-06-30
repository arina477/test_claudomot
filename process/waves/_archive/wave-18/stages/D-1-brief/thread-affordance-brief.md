# Design Brief — in-list thread affordance

## 1. What we need
On a parent message row that has replies (reply_count > 0), a compact, clickable cue showing the reply count + last-reply timestamp, opening the thread panel.

## 2. Where it lives
`design/server-channel-view.html` — attached to a message-row (the MESSAGE LIST rows, ~L194+), below/within the row. Composes onto the canonical channel view; only shown when reply_count>0.

## 3. Audience + states
Member viewing the channel. States: **none** (reply_count==0 → no affordance), **has-replies** ("N replies · last reply 3m ago"), **hover/focus**, **viewer-mentioned-in-thread** (optional emphasis — out of scope this wave; keep neutral).

## 4. DESIGN-SYSTEM.md references (≥6)
- `--surface-700` — affordance chip background (subtle, inline under the row); hover `--surface-600`.
- `--radius-md` — chip corner (§4).
- `--text-secondary` (0.60) — "N replies" + timestamp metadata; ≥4.5:1 on the row surface (rule 1).
- `--accent-emerald` — the reply-count number OR a small thread glyph accent (restrained; the "active conversation" cue).
- Typography §2 — small (`text-[12px]`/text-xs) metadata scale, matching timestamps.
- `--glow-focus` — emerald focus-visible ring (keyboard).
- Phosphor icon — a thread/chat-branch glyph (e.g. ph-chats-circle or ph-arrow-bend-down-right) consistent with the file's icon set.

## 5. Responsive contract
- Single line; truncates gracefully at narrow widths ("N replies").
- Sits indented under the message body, aligned with content.

## 6. Interaction patterns
- Shown only when reply_count>0. Click/Enter opens the thread panel for that parent. Hover → `--surface-600` fill. Focus-visible → emerald ring.
- Live-updates count + timestamp on the thread realtime event (no reload).

## 7. Data shape
From MessageResponse.{replyCount, lastReplyAt} on the parent row.

## 8. Prior art (match)
- server-channel-view.html message-row metadata (timestamps, `--text-secondary`) — match the small muted metadata.
- reaction-pill row (the chip family) — the affordance is a sibling chip treatment (distinct purpose).
- ConnectionStateIndicator / member-list "Online — N" count pattern — count + label idiom.

## 9. Success criteria (≥5)
- [ ] Shows "N replies · last reply <relative time>" only when reply_count>0; hidden otherwise.
- [ ] Click/Enter opens the thread panel; hover + focus-visible states; emerald accent on the count/glyph.
- [ ] Metadata text ≥4.5:1 on the message-row surface (rule 1, calculated).
- [ ] Single line, truncates at narrow width; indented under the message body.
- [ ] Tokens only (no invented hex); Phosphor thread glyph consistent.
- [ ] Distinct from the reaction-pill (different purpose/treatment).

## 10. Non-goals
Per-user unread-in-thread badge; participant avatars on the affordance; thread-following; nested-thread indication.

## 11. Reviewer briefing
Verify the affordance reads as a "open the thread" cue (not a reaction), metadata ≥4.5:1, emerald accent restrained, hidden at reply_count==0, keyboard-operable. Distinct from reaction-pill.

mask_mode_signoff: PASS
signoff_note: ""
