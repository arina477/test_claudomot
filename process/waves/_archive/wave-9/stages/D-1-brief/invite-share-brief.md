# Design Brief — invite-share (M2 invite-completion delta)

**Wave:** 9
**Parent stage invoking:** P-3 (design_gap_flag true; mockup exists from wave-8 → validate + compose delta)
**Blocking current wave:** yes (B-3 frontend consumes this for tasks 5331b7d5 / 863c10ef)
**Mode:** automatic (inherited from `process/session/.autonomous-session`)

## 1. What we need

Refine the existing `design/invite-share.html` "Invite people" modal so (a) the DEFAULT shown link is the server's PERMANENT invite link (not a freshly-minted ad-hoc invite), with "Generate a limited invite" demoted to an optional secondary action; and (b) the modal gains an honest REVOKE affordance for the server's active limited (ad-hoc) invites — a list, each row with a revoke control, a confirm step, and a "revoked" state.

## 2. Where it lives

- **Route / file path:** `design/invite-share.html` (existing — refine in place via `design/staging/invite-share.html`). Frontend: `InviteShareModal` opened from a server (server header / channel header "Invite people" action).
- **Navigation entry:** "Invite people" action inside a server. Modal overlay; the dimmed server shell sits behind.

## 3. Audience + state

- **Who sees it:** server members (default permanent-link copy is shown to any member); the revoke list + secondary "generate limited invite" action are owner/creator-only (server `owner_id` OR invite `created_by`). No role/RBAC UI this wave.
- **States to design (in scope):**
  1. **default — permanent link shown** (the canonical primary state; permanent server invite + Copy).
  2. **copied** (success feedback: button morph + Toast).
  3. **loading** (link generating / list loading — skeleton).
  4. **error** (link failed to load; retry).
  5. **limited-invites list — populated** (owner/creator: list of active ad-hoc invites with revoke control).
  6. **limited-invites list — empty** (owner/creator: no ad-hoc invites yet, honest empty state).
  7. **revoke-confirm** (inline confirm on a list row before destructive action).
  8. **revoked** (honest post-revoke row state: this invite no longer works).
- **Out of scope (states NOT designed):** permanent-code rotation (deferred follow-up — display only, no rotate button); offline state (modal is online-only, not part of the outbox wedge); RBAC/role UI; kick/ban.

## 4. DESIGN-SYSTEM.md references (REQUIRED)

- **Colors:** `--surface-950` (#0a0a0b, read-only link field fill / deepest), `--surface-900` (#121214, modal body), `--surface-800` (#1c1c1f, header strip / list-row hover), `--surface-700` (#27272a, toast fill / secondary button fill / hairline hover), `--accent-emerald` (#10b981, primary Copy button, success), `--danger` (#ef4444, revoke/destructive control + revoked state), `--border-hairline` (rgba 255,255,255,0.06), `--border-hover` (rgba 255,255,255,0.10).
- **Typography:** Geist sans for all chrome; `text-xl` 20px (dialog title), `text-sm` 14px (body, inputs, list-row labels), `text-xs` 12px (metadata: max-uses / expiry / uses-count on list rows), Geist Mono for the link string + ad-hoc code strings. Weights: 600 semibold (title, primary button), 500 medium (list-row code), 400 body.
- **Spacing / radius:** § 3 base-4 scale — panel padding 16px, section gaps 12–24px, list-row padding 8px×12px, list-row vertical rhythm 8px. § 4 radius — `radius-md` 6px (buttons, inputs, list rows), `radius-lg` 10px (modal).
- **Shadows:** § 5 — `--shadow-pop` (modal, toast), `--glow-focus` (emerald focus-visible ring on every control), `--glow-danger` (danger ring for the revoke-confirm destructive button focus).
- **Clip-path / shape:** none.
- **Icons:** § 7 Phosphor — `ph-link` / `ph-globe` (permanent link), `ph-copy` + `ph-check` (copy → copied morph), `ph-check-circle` (toast), `ph-plus` / `ph-clock-countdown` (generate limited invite secondary), `ph-trash` (revoke control), `ph-warning-circle` (error alert + revoke confirm), `ph-x` (close), `ph-arrow-clockwise` (retry), `ph-prohibit` / `ph-link-break` (revoked row state).
- **Components to reuse** from existing `design/` mockups: Modal/Dialog (header+body+footer, scrim, role=dialog) from `create-server.html` + current `invite-share.html`; Button (primary emerald / secondary surface-700 / destructive danger / ghost); Input (read-only link field, select-all); Toast (role=status, emerald left accent bar); inline danger Alert (role=alert) from `create-server.html` server-error state; skeleton shimmer (`.skel`) for loading.

## 5. Responsive contract per breakpoint

Desktop app only (mobile out of scope). Modal is `max-w-[460px]`, centered. At all desktop widths (1024 / 1280 / 1440+) the modal width is constant; the limited-invites list scrolls internally (max-height with the 6px dark scrollbar) if it exceeds ~4 rows. No layout reflow across breakpoints — the modal is a fixed-width overlay.

## 6. Interaction patterns

- **Default:** permanent link displayed in a read-only Geist-Mono field; primary "Copy link" button. Copy → button morphs to "Copied" (ph-check) for ~2s + emerald Toast (role=status). Field is select-all on click.
- **Secondary action:** a single low-emphasis "Generate a limited invite" button (ghost/secondary), owner/creator-only, that reveals/creates a limited invite (max-uses/expiry). Minimal this wave — may be just the button + a generated row appearing in the list.
- **Revoke:** the limited-invites list shows each active ad-hoc invite (code excerpt, max-uses/uses, expiry). A trash icon-button per row. Click → inline confirm (row expands or swaps to a "Revoke this invite? It will stop working immediately. / Cancel / Revoke" affordance, destructive danger button). Confirm → row transitions to honest "revoked" state (struck/dimmed, ph-prohibit, "Revoked — no longer works") + Toast. Revoke is owner/creator-only.
- **Focus / keyboard:** focus-trap (Tab cycles within modal: close → link field → Copy → secondary → list controls → Done). Esc / scrim-click / close → dismiss + restore focus to trigger. Every control has an emerald focus-visible ring; the destructive Revoke confirm button gets the danger focus ring. Icon-only buttons carry `aria-label`.

## 7. Data shape

- Permanent: `servers.invite_code` (single permanent code per server) → `https://studyhall.app/invite/<permanent-code>`.
- Limited invites: list of `invites` rows — `{ code, max_uses, uses_count, expires_at, created_by, revoked }`. List shows non-revoked active rows; revoke sets `revoked=true`. Display each row's code excerpt + "N/M uses" + expiry relative time.

## 8. Prior art (match visual language)

- `design/invite-share.html` (the existing wave-8 modal — the base being refined; keep its 4 states' visual language).
- `design/create-server.html` (modal header/body/footer pattern, inline danger alert role=alert, focus-ring discipline, disabled/loading button states).
- `design/DESIGN-SYSTEM.md` § 8 primitives (Modal, Button destructive variant, Toast, Empty/Error/Loading states).

## 9. Success criteria

- [ ] The DEFAULT visible state shows the PERMANENT server invite link (labeled as the server's permanent link), NOT a "mint a fresh ad-hoc invite" CTA.
- [ ] "Generate a limited invite" is present as an explicit, lower-emphasis SECONDARY action (owner/creator only).
- [ ] A list of the server's active limited invites is shown (owner/creator), each with a revoke (trash) control.
- [ ] Revoke has a confirm step before the destructive action (no one-click accidental revoke).
- [ ] An honest "revoked" row state exists ("no longer works"), visually distinct via `--danger`, not just removed silently.
- [ ] An empty state for the limited-invites list exists (no ad-hoc invites yet).
- [ ] Copy → Copied morph + emerald Toast retained from wave-8.
- [ ] Every interactive control has a visible emerald focus-visible ring (danger ring on the destructive confirm); icon-only buttons have `aria-label`.
- [ ] All colors/spacing/radii/shadows map to existing DESIGN-SYSTEM.md tokens (no invented values); WCAG AA contrast in dark theme.
- [ ] No RBAC/role UI, no rotate-permanent-code button, no kick/ban.

## 10. Non-goals

- Permanent-code rotation (display only; rotate button deferred to a follow-up wave).
- RBAC / per-role permission UI (wave-10).
- Kick / ban / member management.
- Offline/outbox behavior for this modal.
- A full limited-invite creation form (max-uses/expiry pickers) — secondary action can be minimal this wave.

## 11. Reviewer briefing

Reviewers (D-3 `/plan-design-review` + `/ui-ux-pro-max`): this is a DELTA on an already-approved wave-8 mockup. Judge (1) does the default state clearly present the PERMANENT link as primary, with limited-invite generation demoted; (2) is the revoke flow honest and safe (confirm + distinct revoked state); (3) token discipline — every value maps to DESIGN-SYSTEM.md, no invented hex/spacing; (4) dark-theme WCAG AA contrast, especially danger-on-surface for the revoke control and revoked state; (5) focus/keyboard reachability of the new list controls. Do NOT request RBAC, rotate-code, or a full limited-invite form — those are explicit non-goals.

---

```yaml
mask_mode_signoff: PASS
signoff_note: "All placeholders filled; §4 cites 8 color tokens + typography + spacing + 2 shadow tokens + 11 Phosphor icons + 5 reused components; §8 names 3 prior-art refs; §9 has 10 success checkboxes. Delta brief on existing mockup."
```
