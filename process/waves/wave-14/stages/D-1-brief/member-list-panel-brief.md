# Design Brief — Member-list panel (live presence)

## 1. What we need
The right-hand sidebar of server-channel-view, turned from the current "minimal shell" (server-channel-view.html L463-517) into a real member roster: members grouped **Online / Offline**, each row = avatar + display name + a presence dot, updating live as presence:online/offline arrive.

## 2. Where it lives
Pane 4 (right sidebar) of `design/server-channel-view.html` — the existing `<!-- PANE 4: RIGHT SIDEBAR (member list — minimal shell; out of D-block scope) -->` region. Composes onto the canonical channel view; no new page/route.

## 3. Audience + states
Authenticated server member viewing a channel. States: **loading** (skeleton rows), **loaded** (grouped roster), **empty** (only self — "No one else here yet"), **member offline↔online** (row animates between groups), **narrow viewport** (panel collapses per §9).

## 4. DESIGN-SYSTEM.md references (≥6)
- `--surface-900` (#121214) — member-list sidebar background (§1, explicitly "member list").
- `--border-hairline` — left divider from the main canvas (§1).
- `--text-primary` (0.92) member name; `--text-secondary` (0.60) group headers/metadata; `--text-muted` (0.40) offline-dimmed names (§1 text).
- `--presence-online` = `--accent-emerald` (#10b981); `--presence-offline` = `--surface-500` (#52525b) — the presence dots (§1 Accent/presence mappings, already tokenized).
- `--radius-full` — avatar + presence-dot shape (§4).
- `--radius-md` — member-row hover fill (§4); hover uses `--surface-700` (§1).
- Group header type: `text-[11px] font-bold uppercase tracking-widest text-zinc-500` (matches existing L467 "Online — N" header).

## 5. Responsive contract
- ≥1280px: panel visible at ~240px fixed width.
- ≤1024px: panel collapses (per server-channel-view §9 compact rule, L78) — toggled, not always-on; rail + channel sidebar persist.
- The "Online — N" / "Offline — N" count headers always show the live count.

## 6. Interaction patterns
- Row hover → `--surface-700` fill, `--radius-md`. Focus-visible → emerald `--glow-focus` ring.
- Online group sorted above Offline; offline rows dimmed (`--text-muted` name, `--presence-offline` dot).
- A member going offline animates from the Online group to Offline (gentle, ≤200ms; no layout jank) per §6 motion.
- (Click affordance to a profile/DM is out-of-scope this wave — row is presentational; keep it click-ready but no action.)

## 7. Data shape
`MemberListEntry { userId, displayName, avatarUrl?, status: 'online'|'offline' }` composed from existing server-members fetch × presence store. Header counts derived. No new endpoint.

## 8. Prior art (match this visual language)
- `design/server-channel-view.html` L463-517 (the current minimal shell — Online header + dot pattern to extend).
- `design/server-channel-view.html` channel-sidebar (Pane 2, L120-154) — sidebar row/hover/section-header language to mirror.
- `design/server-roles.html` — member-row + avatar + role rows for roster-row styling.

## 9. Success criteria (APPROVE checklist)
- [ ] Members grouped Online / Offline with live count headers.
- [ ] Each row: avatar (`--radius-full`) + name + presence dot (emerald online / surface-500 offline).
- [ ] Offline rows visibly de-emphasized (muted name) but ≥4.5:1 contrast on `--surface-900`.
- [ ] Loading (skeleton) + empty ("no one else here yet") states present.
- [ ] Collapses at ≤1024px per §9; no layout break at narrow width.
- [ ] Uses only DESIGN-SYSTEM tokens (no invented hex); presence dots use the existing `--presence-*` mappings.
- [ ] Online-above-Offline ordering; row hover + focus-visible states.

## 10. Non-goals
Click-to-profile / DM actions; role-grouping (Online/Offline only this wave); idle/away state (deferred); voice presence ring (M5 voice); author-row presence dots (deferred task 10b9d18e).

## 11. Reviewer briefing
Verify presence-dot color mapping matches §1 exactly; offline contrast ≥4.5:1; the panel reads as the same sidebar family as Pane 2; no neon; collapse behavior matches §9. Token discipline is the load-bearing check.

mask_mode_signoff: PASS
signoff_note: ""
