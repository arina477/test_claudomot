# D-1 Brief — Invite-create/share modal (new, compose-only)

## §1 What we need
Within a server, an "Invite people" affordance opens a modal showing the shareable invite link (the full `/invite/:code` URL) with one-tap copy-to-clipboard and a Toast confirmation. Minimal — compose from existing primitives; no role/permission UI.

## §2 Where it lives
- File: `design/invite-share.html` (new; staged at `design/staging/invite-share.html`).
- Entry: server header / sidebar "Invite people" action within a server the visitor is a member of.
- Modal overlays the existing app shell (server rail + channel sidebar + canvas).

## §3 Audience + states
Audience: an owner or member who wants to bring cohort-mates in. In-scope states:
- **default** — modal open, permanent shareable link displayed read-only with a **Copy link** button.
- **copied** — copy succeeded → Toast ("Invite link copied") + transient button affordance (check icon).
- **loading** — brief skeleton if the link must be fetched/generated (permanent code is available by default, so this is minimal).
- **error** — link could not be loaded/generated → inline alert + Retry.
Explicitly OUT: ad-hoc invite configuration (max-uses/expiry pickers), role assignment, revoke/kick/ban UI — all deferred.

## §4 DESIGN-SYSTEM.md references (primitives consumed)
1. **Colors** — `--surface-900` (modal), `--surface-950` (link field), `--surface-700/800` (controls), `--accent-emerald` (Copy/primary + success), `--danger` (error) (§1).
2. **Typography** — Geist sans; `text-xl` modal title, `text-sm` body, `text-xs` helper; **Geist Mono** for the link string (§2).
3. **Spacing** — 4px base; modal header/body/footer padding 16px, control gaps 8px (§3).
4. **Radius** — `--radius-lg` (modal), `--radius-md` (link field + buttons) (§4).
5. **Shadow/elevation** — `--shadow-pop` (modal), scrim `rgba(0,0,0,0.6)`, `--glow-focus` focus ring (§5).
6. **Icons** — Phosphor: `ph-link`/`ph-share-network`, `ph-copy`, `ph-check`, `ph-x` (close), `ph-warning-circle` (§7).
7. **Components** — **Modal/Dialog** (header+body+footer, focus-trap, Esc closes, `role="dialog"` `aria-modal`), **Button** (primary/secondary), **Toast/Snackbar** (`role="status"`, emerald accent, 4–6s auto-dismiss), **Input** (read-only link field) (§8).

## §5 Responsive contract
Centered modal `max-w-[460px]`, scrim over the dimmed app shell. ≥1024 unchanged. Link field truncates with the full URL still copyable. Comfortable at 1440+.

## §6 Interaction patterns
- Copy link → writes the full `/invite/:code` URL to clipboard → Toast + button morphs to check briefly, then reverts.
- Link field is read-only, select-all on focus/click for manual copy fallback.
- Modal: focus traps inside; Esc + scrim-click + close button all dismiss; focus restores to the triggering control on close.
- Keyboard: Tab order = close → link field → Copy → done; emerald focus-visible ring throughout.

## §7 Data shape
Permanent server code from server detail: `servers.invite_code` → composed link `https://<origin>/invite/<invite_code>`. (Optional ad-hoc `createInvite` is out of scope for this minimal modal.)

## §8 Prior art (visual language to match)
- `design/create-server.html` — the exact modal pattern (header/body/footer, focus-ring discipline, dimmed app-shell behind, state-showcase layout).
- `design/server-rail-sidebar.html` — the chrome the modal overlays.
- `design/invite-join.html` — the destination the shared link opens (visual coherence).

## §9 Success criteria
- [ ] Modal reuses the `create-server.html` Modal pattern (header + body + footer, `role="dialog"` + `aria-modal`, Esc/scrim/close dismiss, focus-trap + focus restore).
- [ ] Shareable link shows the **full** `/invite/:code` URL in a read-only Geist-Mono field with a clear **Copy link** primary button.
- [ ] Copy success surfaces a Toast (`role="status"`, emerald accent) AND a transient button confirmation.
- [ ] Default / copied / loading / error states all rendered.
- [ ] Every interactive element has a visible emerald focus-visible ring; link field is keyboard-selectable.
- [ ] Only DESIGN-SYSTEM tokens; dark-theme text/control contrast meets WCAG AA.
- [ ] No role/permission/revoke/kick UI present.

## §10 Non-goals
No max-uses/expiry pickers, no ad-hoc invite generation UI, no role/permission assignment, no revoke/kick/ban, no member management.

## §11 Reviewer briefing
Confirm the modal is a faithful compose of the locked Modal/Button/Toast/Input primitives (no new component class). Verify the link is the full URL and copy feedback is unambiguous. Confirm minimal scope (no deferred role UI leaked in). Audit focus-trap, Esc handling, contrast, and keyboard copy path.

```yaml
mask_mode_signoff: PASS
signoff_note: "Compose-only from locked primitives; create-server.html is the exact modal template."
```
