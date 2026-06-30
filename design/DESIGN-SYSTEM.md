# Design System — StudyHall

Canonical design tokens + primitives. All `design/*.html` mockups and all frontend code consume from this file. Visual reference: **`design/direction.html`** (the approved v7 direction, server-channel-view). Aesthetic: calm · focused · friendly · credible · low-noise — academic, quieter than Discord. **Dark mode only** for MVP (explicit brief constraint).

Referenced from: `claudomat-brain/blocks/design/stages/D-3-review-and-adopt.md` (canonicalization target), `design/brief-template.md`, `design/review-gate.md`.

---

## 1. Color palette

### Primitive — surfaces (near-black layered zinc)
| Token | Hex | Use |
|-------|-----|-----|
| `--surface-950` | `#0a0a0b` | Deepest background (app frame) |
| `--surface-900` | `#121214` | Sidebars (server rail, channel sidebar, member list) |
| `--surface-800` | `#1c1c1f` | Main canvas (message view) |
| `--surface-700` | `#27272a` | Borders, hover fills |
| `--surface-600` | `#3f3f46` | Stronger borders, scrollbar thumb |
| `--surface-500` | `#52525b` | Scrollbar hover, disabled fills |
| `--border-hairline` | `rgba(255,255,255,0.06)` | Default hairline border |
| `--border-hover` | `rgba(255,255,255,0.10)` | Hover/elevated border |

### Primitive — text
| Token | Value | Use |
|-------|-------|-----|
| `--text-primary` | `rgba(255,255,255,0.92)` | Headings, message body |
| `--text-secondary` | `rgba(255,255,255,0.60)` | Metadata, channel names, timestamps |
| `--text-muted` | `rgba(255,255,255,0.40)` | Placeholders, disabled |

### Accent + semantic
| Token | Hex | Meaning |
|-------|-----|---------|
| `--accent-emerald` | `#10b981` | **Primary accent** — academic/focus; active channel, primary buttons, online presence, success |
| `--accent-amber` | `#f59e0b` | **Secondary accent** — assignments / due-soon, reconnecting state, warnings |
| `--danger` | `#ef4444` | Destructive (ban, delete), error, offline state — **fill/border use only** |
| `--danger-text` | `#f87171` | On-dark-tint danger text (`--danger-on-tint`). Use when danger text sits on a danger/10 tint — `#ef4444` computes 3.93:1 there (WCAG AA FAIL); `#f87171` computes 6.30:1 (PASS). Overdue chip, error text on tinted backgrounds. |
| `--info` | `#10b981` | (reuse emerald — keep palette tight) |

### Semantic mappings
- `--primary` → `--accent-emerald`
- `--success` → `--accent-emerald`
- `--warning` / `--due-soon` / `--connection-reconnecting` → `--accent-amber`
- `--destructive` / `--error` / `--connection-offline` → `--danger`
- `--connection-online` → `--accent-emerald`
- `--presence-online` → `--accent-emerald` · `--presence-voice` → `--accent-emerald` (ring) · `--presence-idle` → `--accent-amber` · `--presence-offline` → `--surface-500`

Keep the palette restrained: one base hue (zinc), one academic accent (emerald), one alert accent (amber), one danger (red). No gaming-neon.

## 2. Typography
- **Family:** `Geist`, system-ui fallback (`-apple-system, "Segoe UI", sans-serif`). Crisp, Linear-like.
- **Mono** (code in messages): `Geist Mono`, `ui-monospace, monospace`.
- **Scale** (Tailwind-aligned): `text-xs` 12px (timestamps, metadata, channel labels) · `text-sm` 14px (message body, inputs — min body size) · `text-base` 16px · `text-lg` 18px (section titles) · `text-xl` 20px (server/page titles) · `text-2xl` 24px (landing/empty-state headlines).
- **Weights:** 400 body · 500 medium (names, channel active) · 600 semibold (headings, buttons).
- **Line-height:** 1.5 body, 1.25 headings. Letter-spacing slightly tight on headings (`-0.01em`).

## 3. Spacing scale
Base unit **4px**. Scale: `0 / 1(4) / 2(8) / 3(12) / 4(16) / 6(24) / 8(32) / 12(48)`. Message-row vertical rhythm 8px; sidebar item padding 8px×12px; panel padding 16px; section gaps 24px.

## 4. Shape / radius
| Token | Value | Use |
|-------|-------|-----|
| `--radius-sm` | 2px | Inline tags, code chips |
| `--radius-md` | 6px | Buttons, inputs, message hover, channel items |
| `--radius-lg` | 8–10px | Cards, modals, panels, assignment cards |
| `--radius-xl` | 12px | Large feature cards (landing) |
| `--radius-full` | 9999px | Avatars, server-rail icons (squircle→circle on active), pills, presence dots |

Server-rail icons: `rounded-lg` default → `rounded-md`/active-pill on selection (Discord-familiar morph), with an emerald active indicator bar on the rail's left edge.

## 5. Elevation / shadow
Dark UI leans on borders + subtle glows, not heavy drop-shadows.
- `--shadow-sm`: `0 1px 2px rgba(0,0,0,0.4)` — cards, composer.
- `--shadow-pop`: `0 8px 24px rgba(0,0,0,0.5)` — modals, popovers, tooltips.
- `--glow-focus`: `0 0 0 2px rgba(16,185,129,0.4)` — emerald focus ring.
- `--glow-danger`: `0 0 0 2px rgba(239,68,68,0.4)` — danger ring for error/invalid form controls (danger analogue of `--glow-focus`). (wave-7)
- `--glow-subtle`: `0 0 15px rgba(255,255,255,0.05)` — gentle highlight on elevated/active.
Elevation order: canvas < sidebar < card/composer < popover < modal < toast.

## 6. Motion / transitions
- Default: `transition-colors 150ms ease` (hover/focus on items, channels, buttons).
- Elevated/active morphs: `transition-all 300ms ease`.
- Presence/connection-state changes: 200ms color fade (never abrupt).
- Respect `prefers-reduced-motion` — disable non-essential transitions.
- No bouncy/playful easing — keep it calm and quick.

## 7. Iconography
- **Phosphor Icons** (line weight regular), 16–20px, stroke matches `--text-secondary`. Consistent, friendly-but-restrained. Filled variants only for active/selected states. Channel-type glyphs: `#` text, speaker for voice, clipboard for assignments.

---

## 8. Component primitives

Each primitive lists tokens consumed, states, a11y, and usage. Every MVP module (`command-center/dev/module-list.md`) has a primitive here.

### Standard primitives

**Button** — variants: `primary` (emerald fill, white text), `secondary` (surface-700 fill, hairline border), `ghost` (transparent → surface-700 hover), `destructive` (danger fill). Sizes: sm(28px)/md(34px)/lg(40px). Tokens: accent-emerald, surface-700, radius-md, glow-focus. States: default / hover (lighten 8%) / active (darken) / focus (glow-focus ring) / disabled (40% opacity, no pointer) / loading (spinner, label hidden, aria-busy). A11y: real `<button>`, focus-visible ring, ≥4.5:1 text contrast, 44px hit target on touch. Use for actions; never for navigation (use links).

**Input / Textarea / Select** — surface-900 fill, hairline border → emerald border + glow on focus. 14px text, 8px×12px padding, radius-md. States: default / focus / filled / error (danger border + helper text + aria-invalid) / disabled. A11y: `<label>` always (visible or aria-label), error text via `aria-describedby`. Textarea: auto-grow composer variant. Select: native or accessible listbox.

**Card** — surface-800/900 fill, hairline border, radius-lg, shadow-sm. Variants: base / interactive (hover border-hover + glow-subtle, cursor-pointer) / with-media. States: default / hover / focus-within. Usage: assignment cards, landing feature cards, modal bodies.

**Modal / Dialog** — centered, surface-900, radius-lg, shadow-pop, scrim `rgba(0,0,0,0.6)`. Header (title + close) / body / footer (actions, primary right). States: open (fade+scale 300ms) / closing. A11y: focus-trap, `role="dialog"` + `aria-modal`, Esc closes, restore focus on close, labelled by title. Use for create-server, confirmations (ban/delete), settings sub-flows.

**Toast / Snackbar** — bottom or top-right, surface-700, radius-md, shadow-pop, 4–6s auto-dismiss; left accent bar by type (emerald success / amber warning / danger error). A11y: `role="status"` (polite) or `role="alert"` (errors). Use for "message failed — will retry", "invite copied", reminders.

**Tooltip / Popover** — surface-700, radius-md, shadow-pop, 12px text. Tooltip on hover/focus delay 400ms; popover on click (menus, emoji picker, member card). A11y: `aria-describedby` (tooltip), focus management + Esc (popover).

**Badge / Pill / Tag** — radius-full, 11–12px, surface-700 default; semantic fills (emerald online, amber due-soon, danger). Use for role tags, unread counts, presence labels, due-date chips.

**Avatar** — radius-full, sizes 20/24/32/40px, initials fallback on surface-600, optional presence dot (bottom-right ring in surface-900). Voice presence: emerald ring around avatar. A11y: `alt` = display name.

**Empty / Error / Loading states** — Empty: centered icon + headline + one-line + primary CTA (e.g., app-home "Join or create a server"). Error: danger icon + cause + retry. Loading: skeleton rows (message skeletons, channel skeletons) using surface-700 shimmer; never spinners for content lists. Every list/panel defines all three.

**Form field group + validation** — label + control + helper/error, 8px stack. Inline validation on blur; submit-level error summary. Tokens: input tokens + danger.

### StudyHall-specific primitives (from locked module-list)

**ServerRail icon** (server rail) — 44px squircle, radius-lg, surface-900 rail. Active: emerald left-edge indicator bar + radius morph. Hover: rounded-md + tooltip (server name). Unread: white dot; mention: emerald badge. A11y: button + aria-label = server name, arrow-key nav.

**ChannelSidebar item** (channel mgmt) — `#`/voice/clipboard glyph + name, 14px, secondary text → primary on hover/active; active = surface-700 fill + emerald text. Category headers: 11px uppercase muted, collapsible. Unread = brighter text + dot. Voice channel expands to show occupants. A11y: nav list, active = aria-current.

**MessageRow** (messaging) — avatar + name(medium) + timestamp(xs muted) + body(sm). Grouped consecutive messages hide repeated avatar/name. Hover: surface-800 highlight + action bar (react/reply/edit/delete). Sub-elements: ReactionPill (emoji + count, emerald ring if you reacted), ThreadReply indicator, EditedTag, AttachmentTile (image/file, ≤10MB). **Pending state (offline wedge): 60% opacity + amber "clock/Sending…" indicator until ack; failed: danger + "Retry".** A11y: semantic list, each row `role="article"`, keyboard-reachable actions.

**MessageComposer** (messaging) — auto-grow textarea, surface-900, hairline border → emerald focus. Attach button, emoji popover, send (Enter). **Offline: composer stays enabled; sent items enter the outbox with pending state** (never disabled offline — the wedge). Placeholder reflects channel ("Message #general"). A11y: labelled, Shift+Enter newline.

**MemberListItem** (presence) — avatar + presence dot + name; grouped by role then presence (Online / In Voice / Offline-dimmed). In-voice shows emerald ring + mic/speaking indicator. Click → member popover. A11y: list, presence conveyed by text too (not color alone).

**ConnectionStateIndicator** (offline sync engine — **the wedge, made visible**) — slim bar/pill near the channel header. States: **Online** (emerald dot, hidden or subtle) · **Reconnecting** (amber dot + "Reconnecting…" + spinner) · **Offline** (danger/grey dot + "Offline — messages will send when you're back" + outbox count). 200ms color fade between states. A11y: `role="status"` aria-live=polite; state in text, not color alone.

**AssignmentCard** (assignment module — **academic differentiator**) — surface-800 card, radius-lg, hairline border. Title(medium) + due chip (amber if due-soon, danger if overdue) + description + personal status toggle (To-do / Done, emerald check). Sort by due date. Empty state: "No assignments yet." A11y: card heading, toggle is a real checkbox/switch with label.

**ChannelHeader** (channel mgmt) — channel glyph + name + topic; right side: connection indicator, member-list toggle, search, pinned/assignments shortcut. Hairline bottom border.

**VoiceRoomTile / panel** (voice/video) — drop-in study room: participant tiles (avatar or camera), mic/speaking ring (emerald), mute/cam/screen-share/leave controls. Audio-only fallback tile when bandwidth low. Empty: "No one here yet — hop in." A11y: controls are buttons with aria-pressed; live region for join/leave.

**Invite preview card** (invite system) — server icon + name + member count + visible channels + Join CTA. Error variants: expired / invalid / banned / full. A11y: clear heading, single primary action.

**Avatar/profile editor surfaces** (profile) and **privacy toggles** (privacy controls) reuse Avatar + Form-field + Toggle primitives — no bespoke component, but documented as a styling pattern (emerald toggles, framed as student-empowering).

## 9. Responsive
Desktop app (mobile out of scope). Breakpoints: **1024** (min — collapse member list to a toggle; channel sidebar stays), **1280** (default — all 3 panes visible), **1440+** (comfortable — wider message column, max content width ~1100px center). Narrow (<1024 window): channel sidebar and member list become overlay drawers; server rail persists. Touch targets ≥44px where the desktop app runs on a touchscreen. All panes scroll independently with the minimal 6px dark scrollbar.
