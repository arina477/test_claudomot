# Design Brief — unread-mention affordance

## 1. What we need
A badge/highlight signalling the viewer has an unread mention — surfaced where they'll notice it (channel sidebar entry and/or a message-list jump affordance), clearing once viewed.

## 2. Where it lives
`design/server-channel-view.html` — primarily the CHANNEL SIDEBAR (Pane 2, L120+) channel rows (a mention badge on the channel that has the unread mention); optionally a "jump to mention" cue. Composes onto canonical view.

## 3. Audience + states
A member with an unread mention elsewhere. States: **none** (no unread), **unread-mention** (badge with count), **viewing** (clears on view).

## 4. DESIGN-SYSTEM.md references (≥6)
- `--accent-emerald` — mention badge (academic accent = "you're mentioned"; distinct from generic unread).
- `--radius-full` — badge pill shape (§4).
- `--text-primary` on emerald badge — count text, ≥4.5:1.
- Typography §2 — badge count at small/`text-[11px]` scale.
- `--surface-900` channel-sidebar bg (the badge sits on it).
- `--text-secondary`→`--text-primary` — channel name emphasis bump when it has an unread mention (§1 text).

## 5. Responsive contract
- Badge sits at the channel row's right edge; persists at narrow widths (sidebar drawer).
- Count truncates ("9+") beyond cap.

## 6. Interaction patterns
- Badge appears on the channel row when an unread mention lands (driven by realtime mention event + my-mentions); channel name gains emphasis.
- Clears when the viewer opens/reads that channel.
- Distinct from a generic unread-message dot (mention badge = emerald count pill; plain unread = subtle dot, if any).

## 7. Data shape
Per-channel unread-mention count from client store (realtime mention event + GET /me/mentions + last-read).

## 8. Prior art (match)
- server-channel-view.html channel-sidebar rows (L120-154) — channel row + active/unread treatment to extend.
- DESIGN-SYSTEM emerald active-indicator usage — emerald = focus/you signal.
- Reaction-pill emerald-ring (reactedByMe) — emerald "this is yours" precedent.

## 9. Success criteria (≥5)
- [ ] Emerald count badge on the channel row with an unread mention; channel name emphasized.
- [ ] Badge count text ≥4.5:1 on emerald; emerald badge distinct from any generic unread dot.
- [ ] "9+" truncation beyond cap.
- [ ] Clears on view (show before/after states).
- [ ] Persists at narrow width (sidebar drawer).
- [ ] Tokens only; restrained (no neon); same family as the channel sidebar.

## 10. Non-goals
A notification inbox/center (feature #14, later); cross-server mention aggregation surface; sounds/desktop notifications; @role badges.

## 11. Reviewer briefing
Verify the mention badge is distinguishable from generic unread, emerald count ≥4.5:1, clears-on-view shown, and it does NOT creep into a notification-center (stays a per-channel badge). Rule 1 contrast check.

mask_mode_signoff: PASS
signoff_note: ""
