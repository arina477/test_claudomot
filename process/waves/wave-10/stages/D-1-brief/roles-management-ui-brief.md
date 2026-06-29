# Design Brief — Roles management UI (server settings)

**Wave:** 10
**Parent stage invoking:** P-2 Spec (task 0b9bcf35) — RBAC role-management UI delta
**Blocking current wave:** yes (B-3 frontend depends on it)
**Mode:** automatic (inherited from `process/session/.autonomous-session`)

## 1. What we need

A spec-compliant **"Roles" tab** inside server settings where a permitted user (owner/manager) manages the server's roles: list/create/rename/delete roles, toggle a role's FIXED permission flags, set per-channel visibility per role, and assign a member's single role — with the owner shown as a superuser and last-owner protection surfaced. **It replaces the existing, spec-violating Roles tab in `design/server-settings.html`** (see § audit note below).

> **D-1 AUDIT NOTE (load-bearing).** `design/server-settings.html` already ships a Roles tab, but it implements a **permission × channel MATRIX** (rows "View & Read", "Send Messages & Speak", "Manage Messages" across channel columns) — a custom-permission surface the spec explicitly forbids. The spec mandates a **SMALL FIXED set of 4 boolean flags** (`manage_server`, `manage_roles`, `manage_channels`, `manage_members`) and "NO custom-permission-builder". The architecture was deliberately thinned at v6b away from exactly this matrix. The existing tab is therefore stale and fails the audit. This brief drives a corrected replacement.

## 2. Where it lives

- **Route / file path:** canonical mockup `design/server-settings.html` (Roles tab composed into the existing settings shell). Implemented by B-3 as the Roles tab of server settings.
- **Navigation entry:** Server settings left nav → "Roles" tab (the nav item already exists in the shell). Reachable only by users with `manage_roles` and/or `manage_members` (owner always).

## 3. Audience + state

- **Who sees it:** owner (superuser — always full control) · server managers holding `manage_roles` / `manage_members`. Members WITHOUT those flags do not see the tab/controls (server enforces regardless).
- **States to design:** **loading** (skeleton) · **loaded** (roles + selected-role editor populated) · **empty** (server has only the default Member role — no custom roles yet) · **saving** (in-flight on a change) · **error** (load failed / save rejected, incl. last-owner-protection 409) · **Toast** on successful change.

## 4. DESIGN-SYSTEM.md references (REQUIRED)

- **Colors:** `--surface-950` (app frame), `--surface-900` (sidebars/panels), `--surface-800` (canvas/cards), `--surface-700` (borders/hover fills), `--border-hairline`, `--accent-emerald` (`--primary`/`--success` — active role, primary buttons, ON toggles), `--accent-amber` (`--warning` — owner/superuser indicator + last-owner safeguard banner), `--danger` (delete role, error, save-rejected). Text: `--text-primary`, `--text-secondary`, `--text-muted`. (§1)
- **Typography:** Geist. `text-xl` server/page title, `text-lg`/`text-sm` section + control labels, `text-sm` (14px) body/inputs (min body size), `text-xs` (12px) metadata, `text-[11px]` uppercase category headers. Weights 400/500/600. (§2)
- **Spacing / radius:** 4px base scale `4/8/12/16/24/32`; panel padding 16px, section gaps 24px, sidebar item padding 8px×12px. `--radius-md` (6px) buttons/inputs/role items, `--radius-lg` (8–10px) cards/panels/modals, `--radius-full` toggle tracks/pills/presence dots. (§3, §4)
- **Shadows:** `--shadow-sm` (cards/footer), `--shadow-pop` (modals/popovers/toast), `--glow-focus` (emerald focus ring — every interactive control), `--glow-danger` (danger ring on rejected save). (§5)
- **Icons (Phosphor, 16–20px, stroke `--text-secondary`, filled for active):** `ph-shield-check` (Roles nav/active), `ph-plus` (add role), `ph-pencil-simple` (rename), `ph-trash` (delete), `ph-crown`/`ph-lock-key` (owner superuser indicator), `ph-warning`/`ph-warning-circle` (last-owner safeguard, errors), `ph-hash`/`ph-speaker-high`/`ph-clipboard-text` (channel-type glyphs in visibility list), `ph-eye`/`ph-eye-slash` (per-channel visible/hidden), `ph-magnifying-glass` (member search), `ph-check`/`ph-circle-notch` (saved/saving), `ph-caret-down` (role-assignment select). (§7)
- **Components to reuse:** **Toggle/switch** (emerald, the `.matrix-toggle` pattern already in server-settings.html — reuse for permission flags + channel visibility), **Button** (primary emerald / secondary surface-700 / ghost / destructive danger), **Input** (surface-950 fill, emerald focus), **Select** (role-assignment per member), **Card / Panel** (`panel-refraction` pattern from server-settings.html), **Modal/Dialog** (create-role + delete-confirm — reuse `create-server.html` modal pattern), **Toast** (`role="status"`/`role="alert"`), **Badge/Pill** (role tag + owner indicator), **Avatar** (member rows), **Empty/Loading/Error states** (skeleton rows, danger error block). The settings shell (left nav + header + scroll container + skeleton loader) from `design/server-settings.html` is reused wholesale.

## 5. Responsive contract

Desktop app (per DESIGN-SYSTEM §9). 
- **1280+ (default):** settings shell left nav + main; Roles tab = role-list rail (left) + role editor (right, fixed flags + per-channel visibility) + member-assignment section below.
- **1024 (min):** role-list rail narrows; editor stacks visibility list under the flags; member-assignment table scrolls horizontally.
- **<1024 (narrow window):** role list collapses above the editor (single column); settings left nav remains. Touch targets ≥44px.

## 6. Interaction patterns

- **Role list:** click selects a role → editor loads that role. Active role = surface-700 fill + emerald left bar. "Add role" opens create-role modal (name input → Create; reuse create-server modal states).
- **Permission flags:** 4 toggle switches (`manage_server`, `manage_roles`, `manage_channels`, `manage_members`) with a one-line description each. Toggling marks the editor dirty → Save/Discard footer.
- **Channel visibility:** per-channel ON/OFF toggle (or eye/eye-slash) listing every channel × the selected role's `can_view`. Private channels visually marked (default-deny). Channel-type glyph per row.
- **Member assignment:** searchable member list; each member has a single-role **select** (one role per member — NOT multi-select). Changing it is gated by `manage_members`.
- **Gating:** controls the caller cannot use are hidden or disabled with a tooltip ("Requires Manage Roles"). The owner role is shown read-only with a superuser indicator (cannot be deleted/demoted; flags shown as implicitly-all).
- **Last-owner protection:** an always-visible amber safeguard note; attempting to remove/demote the last owner shows a danger inline message + Toast ("Can't remove the last owner") and blocks the save (server-enforced; UI mirrors).
- **Keyboard/focus:** real `<button>`/`<input>`/`<select>`; visible emerald `--glow-focus` on every control (never bare browser default); modal focus-trap + Esc; Tab order list→editor→footer→assignment; toggles operable by Space; `aria-current` on active role; toggles labelled (`aria-label`/associated `<label>`); error text via `aria-describedby`/`aria-invalid`; Toast `role="status"`, error Toast `role="alert"`.

## 7. Data shape

- `GET /servers/:id/roles` → `[{id, name, position, permissions:{manage_server,manage_roles,manage_channels,manage_members}, is_owner_role?}]`
- `POST /servers/:id/roles` `{name}` · `PATCH /roles/:id` `{name?, permissions?}` · `DELETE /roles/:id` (blocked if assigned)
- `GET /servers/:id` → channels filtered server-side by caller visibility; `channel_permission_overrides` `[{channel_id, role_id, can_view}]`
- `PATCH /channels/:id/overrides` `{role_id, can_view}` · `PATCH /servers/:id/members/:userId` `{role_id}` (single role)
- Last-owner-removal attempt → `409` → surfaced as danger + Toast.
- Empty payload: only the default Member role + no overrides → empty state.
- Loading: skeleton; Error: danger block + retry.

## 8. Prior art (match this visual language)

- **Settings shell (left nav + header + skeleton loader + scroll container + `panel-refraction` + `.matrix-toggle`)** → `design/server-settings.html:202-303` (reuse the shell; replace the matrix body inside the Roles tab).
- **Modal (create-role, delete-confirm) + all states (default/valid/error/loading/server-error/success)** → `design/create-server.html:105-299`.
- **Member row + role pill + searchable member table** → `design/server-settings.html:502-576` (reuse the quick-assign table pattern, but swap multi-select-checkbox apply for a per-member single-role select).

## 9. Success criteria (APPROVE checklist)

- [ ] Permission flags are EXACTLY the 4 fixed booleans (`manage_server`, `manage_roles`, `manage_channels`, `manage_members`) as toggle switches — **NO permission matrix, NO custom-permission-builder, NO per-channel permission rows**.
- [ ] Per-channel **visibility** per role is a clear, scannable surface (channel × role `can_view`), distinct from the permission flags; private channels marked default-deny.
- [ ] Member→role assignment uses a **single-role select** (one role per member), not multi-assign.
- [ ] Owner is shown as a read-only superuser (crown/lock indicator); last-owner protection is surfaced (amber safeguard + danger-on-attempt).
- [ ] Gated controls: the UI only shows/enables what the caller may do; a note states the server enforces regardless.
- [ ] All five states render: loading / loaded / empty (no custom roles) / saving / error; plus a success Toast.
- [ ] Uses ONLY DESIGN-SYSTEM.md tokens from §4 — no new hex values, no invented tokens.
- [ ] WCAG AA contrast in dark theme on all text + interactive controls; visible emerald focus ring on every control; keyboard-operable; modal focus-trap + Esc.
- [ ] All icon references are real Phosphor component names.
- [ ] Composes consistently into the existing server-settings shell + matches create-server modal language.

## 10. Non-goals

- No kick/ban/moderation UI (later bundle).
- No role hierarchy / role ordering UI beyond a position-ordered list.
- No multi-role-per-member.
- No custom/granular per-action permissions beyond the 4 fixed flags.
- No color-picker requirement (a role color dot is optional decoration, not a flag).
- No mobile layout (desktop app only).

## 11. Reviewer briefing

Reviewers (D-3 `/plan-design-review` + `/ui-ux-pro-max`) must verify against §9, with special scrutiny on: (a) the **fixed-4-flag** rule — REJECT any permission matrix / custom-builder resurfacing; (b) **single-role** member assignment; (c) **channel-visibility surface clarity** distinct from flags; (d) **owner superuser + last-owner protection** surfacing; (e) **token-only** discipline (no invented hex/spacing); (f) **dark-theme AA contrast + focus/keyboard** discipline.

---

```yaml
mask_mode_signoff: PASS
signoff_note: "Single gap (roles-management-ui). All placeholders filled; §4 cites >6 primitives; §8 names 3 prior-art mockups; §9 has 10 checkboxes. Audit finding (existing matrix tab is spec-violating) recorded — drives corrected D-2 variant."
```
