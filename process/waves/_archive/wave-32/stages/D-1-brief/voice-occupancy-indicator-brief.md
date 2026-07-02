# Design Brief — Voice occupancy indicator (pre-join "who's inside")

**Wave:** 32
**Parent stage invoking:** P-1 (design_gap_flag: true)
**Blocking current wave:** yes
**Mode:** automatic (inherited from process/session/.autonomous-session)

## 1. What we need

A **pre-join occupancy indicator** on the voice-study-room entry surface: before a user joins a study room, show a live count of who's already inside plus their identities (avatars + names), so they can decide whether to hop in. This is the "study-room door left open — 3 people already studying" affordance that fights voice cold-start. The wave-31-adopted `voice-study-room.html` designs the IN-ROOM states (count chip in the header + participant tiles once you're connected) but NOT this pre-join glance-before-you-join surface.

## 2. Where it lives

- **Route / file path:** `apps/web/src/shell/VoiceStudyRoom.tsx` (wave-31 component) — the pre-join / entry state, above the "Join room" control. New sub-component `apps/web/src/shell/VoiceOccupancyIndicator.tsx`.
- **Navigation entry:** user clicks a voice channel in the ChannelSidebar → lands on the voice-study-room entry surface (pre-join) → the occupancy indicator sits here, before they click Join.

## 3. Audience + state

- **Who sees it:** any authenticated member of the server/channel (same membership gate as the wave-31 token-mint — a non-member never reaches this surface; the endpoint returns uniform 403).
- **States to design:**
  - **loading** — count/identities being fetched (first poll in flight).
  - **empty (nobody inside)** — 0 participants: the calm "door's open, be the first" invitation.
  - **populated (1–N inside)** — count + member avatars/names (bounded display, overflow "+N").
  - **error** — the occupancy fetch failed (fail-soft: show nothing intrusive / a muted "couldn't load who's here" — never blocks the Join action).

## 4. DESIGN-SYSTEM.md references (REQUIRED)

- **Colors:** `--surface-800` (entry panel fill, § 1), `--surface-900` (count-chip fill, § 1), `--border-hairline` (chip + panel border, § 1), `--text-primary` (member names, § 1), `--text-secondary` (count + "studying now" label, § 1), `--accent-emerald` (presence dot on in-room avatars, § 1 / `--presence-voice`).
- **Typography:** `text-xs` 12px (count chip + "N studying now" label), `text-sm` 14px (member names), `text-2xl` (empty-state headline, § 2).
- **Spacing / radius:** 4px base scale, panel padding 16px, avatar-cluster gap 8px (§ 3); `--radius-full` avatars + count chip pill, `--radius-lg` entry panel (§ 4).
- **Shadows:** `--shadow-sm` on the entry panel (§ 5).
- **Icons:** Phosphor `ph-users` (count chip — matches the in-room header chip at voice-study-room.html:279), Phosphor line-weight 16–20px (§ 7).
- **Components to reuse:** **Avatar** primitive (§ 8, radius-full, initials fallback on `--surface-600`, emerald voice presence ring), **Badge/Pill** count chip (§ 8), **Empty state** primitive (§ 8, centered icon + headline + one-line), **VoiceRoomTile** visual language (§ 8).

## 5. Responsive contract

Per DESIGN-SYSTEM.md § 9 (desktop app; breakpoints 1024 / 1280 / 1440+):
- **Desktop full (1440+):** count chip + horizontal avatar cluster (up to ~6 avatars) + "+N" overflow, names on hover/tooltip.
- **Desktop compact (1280):** same, avatar cluster caps at ~5 before "+N".
- **Tablet (1024):** count chip + avatar cluster caps at ~4 + "+N"; the pre-join panel stays centered.
- **Narrow (<1024, degraded):** count chip + "N studying now" text label; avatars collapse to the count only (still usable).

## 6. Interaction patterns

- **Poll refresh:** the indicator updates on a bounded interval (~10–15s) while the pre-join surface is visible; stops on join or unmount (NOT a standing websocket — bounded poll only).
- **Hover:** avatar → tooltip with member display name (`aria-describedby`). Count chip → tooltip "N studying now".
- **No click affordance on the indicator itself** — it's informational; the Join action is the separate existing control (no join-from-avatar; that's keep-OUT).
- **Motion:** count/avatar changes fade in per § 6 (200ms color fade, no bounce); respect `prefers-reduced-motion`.
- **Accessibility:** the indicator is a `role="status"` `aria-live="polite"` region so screen readers hear "3 studying now: Alice, Bob, Carol"; count conveyed in text, not color alone; avatars carry `alt` = display name.

## 7. Data shape

- **Endpoint:** `GET /channels/:channelId/voice/participants` (AuthGuard + membership gate) → `200 { count: number, participants: [{ userId: string, displayName: string }] }`.
- **Empty payload:** `{ count: 0, participants: [] }` (nobody inside — render the empty state).
- **Loading:** no payload yet (first poll in flight) — render the loading state.
- **Error payload:** non-200 (503 creds-unset, or network) — render the fail-soft error state; never block Join.
- **Display fallback:** `displayName` is derived server-side with a null-safe fallback (never empty); the client renders it verbatim.

## 8. Prior art (match this visual language)

- **Count chip** → match `design/voice-study-room.html:278-281` (the in-room header `ph-users` + count pill — reuse EXACTLY for pre-join continuity).
- **Member avatar tile / avatar + name + emerald presence dot** → match `design/voice-study-room.html:289-296` (participant tile) — the pre-join avatars are the compact form of these.
- **Empty / calm invitation state** → match `design/voice-study-room.html:368-384` (the "No one else here yet — the door's open" alone-state) + the DESIGN-SYSTEM empty-state primitive.

## 9. Success criteria (APPROVE checklist)

- [ ] Uses exactly the DESIGN-SYSTEM.md tokens listed in § 4 (no new hex values, no invented tokens).
- [ ] Renders all four states from § 3 (loading, empty, populated, error).
- [ ] Count chip is visually identical to the in-room header chip (voice-study-room.html:278-281) for continuity.
- [ ] Populated state shows member avatars + names with a bounded cluster + "+N" overflow (no unbounded list).
- [ ] Empty state is the calm "door's open" invitation, not an alarming/empty-error look.
- [ ] Responsive per § 5 (degrades to count-only text below 1024).
- [ ] `role="status"` aria-live region; count in text not color-alone; avatar `alt` = display name.
- [ ] Error state is fail-soft (muted, never blocks the Join control).
- [ ] All icon references are real Phosphor names (`ph-users`).

## 10. Non-goals

- Presence rings / speaking indicators / who's-muted (in-room concern; keep-OUT).
- Live websocket push occupancy (bounded poll only).
- Join-from-avatar / click-a-face-to-join (keep-OUT).
- Occupancy history / "was here 5 min ago" (keep-OUT).
- Animations beyond the calm 200ms fade.
- Redesign of the wave-31 in-room states (this is the pre-join surface only).

## 11. Reviewer briefing (D-3 review & adopt)

`/plan-design-review` should score: visual hierarchy (count vs identities vs Join CTA), spacing rhythm (avatar cluster), brand coherence (calm academic, count-chip continuity with wave-31), edge-case handling (empty/overflow/error).
`/ui-ux-pro-max` should verify: brief § 9 criteria match, the pre-join → join UX flow sensibility (does seeing "3 studying" plausibly pull a hop-in?), accessibility minimums (role=status, alt text, contrast), Phosphor icon audit, DESIGN-SYSTEM token audit (no invented tokens).

```yaml
mask_mode_signoff: PASS
signoff_note: "All placeholders replaced; §4 cites 7+ primitives; §8 names 3 prior-art regions in the adopted voice-study-room.html; §9 has 9 checkboxes. Bounded extension of the wave-31 surface — no new tokens expected."
```
