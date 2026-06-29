# Design Brief — create-server (single-step name modal)

**Wave:** 7
**Parent stage invoking:** P-2 / B-block (task d62d6ce3)
**Blocking current wave:** yes
**Mode:** automatic (inherited from `process/session/.autonomous-session`)

> RECOVERY brief — re-scope. The current `design/create-server.html` reverted to a 3-step
> wizard (icon upload → template/blueprint picker → channel editor). That is AHEAD of the M2
> data model and WRONG. This brief re-scopes it to a single-step name modal that matches the
> actual API: `POST /servers { name }`.

## 1. What we need

A single-step modal dialog to create a study server. One server-name text input + a Create
button. The server is created via `POST /servers { name }`; the server side seeds owner
membership + a default "General" category + a `#general` text channel in the same transaction,
so the modal MUST NOT ask about icon, template, or channels.

## 2. Where it lives

- **Route / file path:** overlay modal inside the app shell; design at `design/create-server.html`.
- **Navigation entry:** the **+ create** button at the bottom of the server rail (see
  `server-rail-sidebar.html`) opens this modal. Esc / scrim / Cancel closes it.

## 3. Audience + state

- **Who sees it:** authenticated student (any member). Owner-only create — no invite step.
- **States to design (all in-scope):**
  - **default** — empty input, Create disabled.
  - **valid-input** — 1–100 chars entered, Create enabled, live char counter.
  - **validation-error** — empty-after-touch OR > 100 chars: danger border + helper text + `aria-invalid`, Create disabled.
  - **loading** — submitting: Create shows spinner, label hidden, `aria-busy`, input disabled.
  - **server-error** — POST failed: danger inline message + Retry affordance, input re-enabled.
  - **success** — modal closes, new server becomes selected (shown as a note; the rail design renders the result).

## 4. DESIGN-SYSTEM.md references (REQUIRED)

- **Colors:** `--surface-900` (modal fill), `--surface-950` (scrim base / dimmed shell), `--surface-800` (header band), `--surface-700` (secondary button, hover fills), `--accent-emerald` (primary Create button, focus ring), `--danger` (validation + server error), text `--text-primary` / `--text-secondary` / `--text-muted`, borders `--border-hairline` / `--border-hover`.
- **Typography:** Geist. `text-xl` (modal title), `text-sm` (body, input, helper), `text-xs` (char counter, helper/error). Weights 400/500/600.
- **Spacing / radius:** 4px base; panel padding 16px (§3); `--radius-lg` (modal), `--radius-md` (button, input).
- **Shadows:** `--shadow-pop` (modal), `--glow-focus` (emerald focus ring), scrim `rgba(0,0,0,0.6)`.
- **Icons (Phosphor §7):** `ph-x` (close), `ph-plus`/`ph-hash` (decorative server/channel hint), `ph-spinner`/`ph-spinner-gap` (loading), `ph-warning-circle` (error), `ph-arrow-clockwise` (retry).
- **Components to reuse:** Modal/Dialog primitive (§8), Input + Form-field validation (§8), Button primary/secondary (§8). Join-form input + inline error pattern from `app-home.html:339-371`.

## 5. Responsive contract

- **Desktop full (2xl) / compact (xl):** centered modal, max-width ~480px over dimmed shell.
- **Tablet (lg):** same centered modal.
- **Mobile (degraded):** modal width clamps to viewport with 16px gutter; out of primary scope (desktop app).

## 6. Interaction patterns

- Autofocus the name input on open. Live char counter `n/100`.
- Enter submits when valid; Esc closes; Cancel button closes. Focus-trap inside modal; focus restores to the + rail button on close.
- Create button: disabled until valid; loading spinner + `aria-busy`; server-error path re-enables with Retry.
- Inline validation on input/blur; error wired via `aria-describedby`. `role="dialog"` + `aria-modal="true"` + `aria-labelledby` title.
- Focus-visible emerald ring on every interactive element (no browser default outline left bare).

## 7. Data shape

- `POST /servers { name }` → `201 { id, name, ownerId, createdAt }`. name: 1–100 chars, trimmed non-empty.
- Errors: `400` invalid name → validation-error; `401` → (handled by shell auth guard); network/`5xx` → server-error.
- Success seeds default category + `#general` server-side (modal does not render channels).

## 8. Prior art (match this visual language)

- Modal scrim + dimmed 3-pane shell behind → match dimmed-shell approach in current `create-server.html:199-239` (keep the dimmed shell, drop the wizard).
- Input + inline error + submit-in-field → match `app-home.html:339-371` (join form).
- Emerald primary button + focus treatment → match `app-home.html:406-411`.

## 9. Success criteria (APPROVE checklist)

- [ ] Single step only — one name input + Create. No icon upload, no template picker, no channel editor.
- [ ] Uses only DESIGN-SYSTEM.md tokens from §4 (every hex maps to a token; no invented values).
- [ ] Renders all six states from §3 (visible in the mockup).
- [ ] 1–100 char validation with visible empty + too-long error states.
- [ ] Focus-trap + Esc close + autofocus + focus-visible rings; `role="dialog"` / `aria-modal` / `aria-labelledby` / `aria-invalid` / `aria-busy`.
- [ ] WCAG AA text/control contrast on the dark theme (helper/counter use ≥ `--text-secondary`, not `--text-muted`, for any required-to-read text).
- [ ] All icon references are real Phosphor names.
- [ ] Geist font; emerald accent; calm/academic, low-noise.

## 10. Non-goals

- No server icon / avatar upload (no avatars in M2 data model).
- No template / blueprint selection; no channel creation/editing in the modal.
- No invite step, no role/RBAC, no offline-queue wedge UI (server create is online-only this wave).

## 11. Reviewer briefing (D-3 review & adopt)

`/plan-design-review` — score visual hierarchy, spacing rhythm, brand coherence, edge-case (all 6 states) handling.
`/ui-ux-pro-max` — verify single-step scope match to `POST /servers {name}`, token audit (no invented hex), Phosphor icon validity, dialog a11y minimums.
