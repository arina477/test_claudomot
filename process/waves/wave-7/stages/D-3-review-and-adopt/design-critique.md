# Design Critique — Reviewer B
**Wave 7 · D-3 Review and Adopt**
Files reviewed:
- `design/staging/create-server.html`
- `design/staging/server-rail-sidebar.html`

References consulted: `design/DESIGN-SYSTEM.md`, `D-1-brief/create-server-brief.md`, `D-1-brief/server-rail-sidebar-brief.md`, `design/direction.html`, `design/app-home.html`.

---

## FILE 1 — create-server.html

### Scored Dimensions

#### Visual Hierarchy — 9/10
The header / body / footer modal structure is executed cleanly. Title at `text-xl font-semibold tracking-tight` is correctly weighted (DESIGN-SYSTEM §2). Body copy sits at `text-sm t-secondary`, label at `text-sm font-medium t-primary`, helper/counter at `text-xs`. The progression from heading to control to helper reads naturally in all six states. The disabled Create button in the default and error states is visually recessive (surface-700 fill, t-muted text) while the enabled emerald button is correctly assertive. The success state diverges from the modal card template to show the post-close result (mini rail + sidebar), which is communicatively clear in a staging context but differs structurally from the other five cards — low enough risk not to drop below 9, but note for implementation.

#### Spacing Rhythm — 8/10
The 4px base unit is respected throughout. Modal header/footer use `px-5 py-4` (20px / 16px). Modal body uses `px-5 py-5` (20px / 20px). The brief §4 quotes panel padding as 16px (DESIGN-SYSTEM §3), making the horizontal padding 4px over spec. Internal form stacking — label `mb-2`, helper `mt-2` — correctly implements the "label + control + helper/error, 8px stack" from DESIGN-SYSTEM §8. Character counter is right-aligned inside the input at `pr-14`, which comfortably clears the counter text.

**To reach 10:** Reduce modal `px-5` (20px) to `px-4` (16px) throughout all modal cards to meet the 16px panel padding in brief §4 / DESIGN-SYSTEM §3.

#### Brand Coherence — 9/10
Geist is loaded and wired as the body font. Emerald is used as the only interactive accent (primary button, focus ring, success channel active). The palette is restrained: no gaming neon, no decorative gradients, no motion beyond the minimal spin animation. The dimmed-shell backdrop reinforces the modal-overlay context effectively. The Create button in the valid state (`bg-accent-emerald text-surface-950`) matches the app-home.html:406–411 emerald-on-dark primary button pattern exactly. The calm/academic tone is consistent across all states.

One minor note: the success state shows a raw emerald active indicator bar and emerald channel text simultaneously — both are correct tokens but the visual density is slightly higher than the rest of the file.

#### Edge-case / State Handling — 8/10
All six required states from brief §3 are present: default, valid-input, validation-error, loading, server-error, success.

Issues:
1. State 3 (validation-error): The error input applies `border-color:#ef4444` via inline style but does not apply `box-shadow: 0 0 0 2px rgba(239,68,68,0.4)` (`shadow-glow-danger`, defined in the Tailwind config on line 37 but never consumed). DESIGN-SYSTEM §5 defines this shadow as the error ring treatment. The visual difference between a focused-valid input (emerald border + glow) and an error input (red border, no glow) is inconsistent — both states should produce a matching ring.
2. The brief §9 calls out "1–100 char validation with visible empty + too-long error states." State 3 demonstrates the empty error (0/100). A too-long variant (counter at e.g. 105/100 in danger color, Create disabled) is not shown. Reviewers and implementors cannot verify that the counter overflow treatment is designed.

**To reach 10:** (a) Add `box-shadow: 0 0 0 2px rgba(239,68,68,0.4)` to the state 3 error input. (b) Add a seventh card (or an inline annotation) showing the counter at an over-100 value with the counter text in `text-danger` and Create disabled.

#### Responsive Sensibility — 8/10
The staging grid (`grid-cols-1 md:grid-cols-2 xl:grid-cols-3`) is appropriate for a multi-state showcase. The modal cards fill the grid cells rather than being constrained to `max-w-[480px]` as specified in brief §5. This is an acceptable trade-off for a static multi-state mockup but means no direct visual proof of the centered-over-dimmed-shell layout that production requires. The scrim (`rgba(0,0,0,0.6)`) is implied by the dimmed shell behind but is not an explicit overlay, which deviates from DESIGN-SYSTEM §8 Modal/Dialog ("scrim rgba(0,0,0,0.6)").

**To reach 10:** Add a seventh single-state panel (or annotation) showing the modal at max-w-[480px] centered over a full-viewport scrim, matching brief §5 and DESIGN-SYSTEM §8.

---

### Hard Checks — create-server.html

#### 1. TOKEN AUDIT — PASS
Every color and shadow value used traces to a DESIGN-SYSTEM token:

| Value | Mapped token | Status |
|---|---|---|
| `#0a0a0b` | `--surface-950` | PASS |
| `#121214` | `--surface-900` | PASS |
| `#1c1c1f` | `--surface-800` | PASS |
| `#27272a` | `--surface-700` | PASS |
| `#3f3f46` | `--surface-600` (scrollbar, success icon fill) | PASS |
| `#52525b` | `--surface-500` (scrollbar hover) | PASS |
| `#10b981` | `--accent-emerald` | PASS |
| `#ef4444` | `--danger` | PASS |
| `rgba(255,255,255,0.92)` | `--text-primary` | PASS |
| `rgba(255,255,255,0.60)` | `--text-secondary` | PASS |
| `rgba(255,255,255,0.40)` | `--text-muted` | PASS |
| `rgba(255,255,255,0.06)` | `--border-hairline` | PASS |
| `rgba(255,255,255,0.10)` | `--border-hover` | PASS |
| `0 8px 24px rgba(0,0,0,0.5)` | `--shadow-pop` | PASS |
| `0 0 0 2px rgba(16,185,129,0.4)` | `--glow-focus` | PASS |
| `0 0 0 15px rgba(255,255,255,0.05)` | `--glow-subtle` | PASS |
| `rgba(239,68,68,0.4)` (state 5 alert border) | `--danger` at 40% opacity | PASS (derived) |
| `rgba(239,68,68,0.08)` (state 5 alert bg) | `--danger` at 8% opacity | PASS (derived) |

No invented hex values. The `glow-danger` shadow (`0 0 0 2px rgba(239,68,68,0.4)`) is defined in the Tailwind config but not applied to the state 3 error input — this is a usage gap, not a token invention.

Spacing and radius: all Tailwind utilities used (`rounded-md`→6px, `rounded-lg`→10px, `px-5`→20px, `px-4`→16px, `py-2.5`→10px) map to the 4px base scale and the defined radius tokens.

#### 2. STATE COVERAGE — PASS (with one gap)
- Default: PRESENT ✓
- Valid-input: PRESENT ✓
- Validation-error: PRESENT ✓
- Loading: PRESENT ✓
- Server-error: PRESENT ✓
- Success: PRESENT ✓

Gap: No too-long error variant (> 100 chars). Brief §9 explicitly lists this alongside the empty error. Not blocking, but the implementor has no design signal for the over-length state.

#### 3. SCOPE — PASS
Single-step modal: one name input, one Create button. No icon upload, no template picker, no channel editor. The success card shows the post-close state as a display note, not as additional modal content. Scope is clean.

#### 4. ICONS — PASS
All `ph-*` class names in the file are real Phosphor icons:
- `ph-books` ✓
- `ph-plus` ✓
- `ph-x` ✓
- `ph-warning-circle` ✓
- `ph-spinner-gap` ✓
- `ph-arrow-clockwise` ✓
- `ph-check-circle` ✓
- `ph-hash` ✓
- `ph-caret-down` ✓

#### 5. Geist + Emerald + Prior Art — PASS
Geist loaded and applied as the body font (lines 11, 23, 52). Emerald `#10b981` is the sole interactive accent. Prior art match (app-home.html join form at lines 339–371 for input+inline-error; lines 406–411 for emerald primary button) is accurate.

One minor implementation note: lines 88 and 255 in the file contain a duplicate `border` class (`border b-hairline border`) — a harmless Tailwind redundancy, not a visual defect.

---

**create-server.html overall verdict: APPROVE**
Concerns: missing `glow-danger` ring on state 3 input (DESIGN-SYSTEM §5); no too-long error variant shown (brief §9); modal horizontal padding 20px vs. 16px spec (brief §4 / DESIGN-SYSTEM §3); no explicit scrim demonstration (DESIGN-SYSTEM §8 Modal/Dialog). All are low-severity polish items. The file meets all hard checks and all six required states.

---

## FILE 2 — server-rail-sidebar.html

### Scored Dimensions

#### Visual Hierarchy — 9/10
The primary "Loaded" state reads correctly as a three-pane shell: rail (72px) → sidebar (260px) → content placeholder. Within the rail, the active server is clearly distinguished by the emerald left-edge indicator pill plus the `rounded-md` (active) vs. `rounded-lg` (inactive) morph. Within the sidebar, the category headers (`text-xs font-semibold uppercase tracking-wider t-secondary`) are visually subordinate to the server header (`text-sm font-semibold t-primary`) and properly above the channel items. The active channel (`bg-surface-700 text-accent-emerald`) is immediately identifiable. The state gallery below uses consistent `text-xs font-semibold uppercase tracking-wider t-secondary` section labels.

One minor note: the "Sidebar · loaded (#general)" compact card (state gallery, lines 259–278) uses a non-interactive `<div>` for the category header rather than a `<button>` — unlike the main loaded sidebar which correctly uses a `<button aria-expanded="true">`. This creates an inconsistency between the two "loaded" representations.

#### Spacing Rhythm — 8/10
The rail uses `py-4 gap-3` (16px vertical padding, 12px gaps) — correct per DESIGN-SYSTEM §3. Rail icons are `w-12 h-12` (48px) within a 72px rail — matches the ServerRail icon primitive's 44px squircle spec (the 48px target is consistent with 44px minimum touch target). Category section spacing `space-y-6` (24px) is exactly correct per DESIGN-SYSTEM §3 "section gaps 24px."

Channel item padding uses `px-2 py-1.5` (8px horizontal, 6px vertical). DESIGN-SYSTEM §3 specifies "sidebar item padding 8px×12px." If interpreted as 8px vertical × 12px horizontal, the items are under-padded on both axes; if 8×12 means height-direction × width-direction, the items need `py-2 px-3`. Either reading shows a gap. The items feel slightly compressed in the loaded state.

**To reach 10:** Change channel item padding from `px-2 py-1.5` to `py-2 px-3` (8px × 12px matching DESIGN-SYSTEM §3) throughout all sidebar loaded states.

#### Brand Coherence — 9/10
Geist loaded and applied. Emerald `#10b981` is correctly used for the active server indicator, active channel text, and create button accent. The rail icon morph (rounded-lg default → rounded-md active, via `.rail-icon` / `.rail-icon.active` CSS at lines 66–68) is correct per DESIGN-SYSTEM §4. The skeleton shimmer (`rgba(255,255,255,0.05)` gradient on surface-700 base) is calm and aligned with the design system's stated shimmer approach. No gaming neon. No off-brand decoration.

Minor note: the hover indicator on non-active server icons uses `bg-white/80` (line 104). This is not an explicitly named design system token (unlike `bg-accent-emerald` for the active indicator). It is consistent with prior art (direction.html line 177 uses `bg-white` for the active pill) and follows a reasonable semantic convention, but it is an undocumented derived value rather than a named token.

#### Edge-case / State Handling — 9/10
All required states per brief §3 are present and correctly structured:
- Rail loading ✓ (skeleton icons, aria-busy)
- Rail empty ✓ (home + dashed create CTA + "No servers yet" message)
- Rail loaded ✓ (active server with emerald pill, two inactive servers, create button)
- Sidebar no-server-selected ✓ (ph-hand-pointing + "Pick a server")
- Sidebar loading ✓ (skeleton rows for header + category + channels, aria-busy)
- Sidebar loaded with #general visible ✓ (lines 271–274: #general under "General" category, aria-current="page")
- Sidebar error ✓ (ph-warning-circle, inline message, Retry button)

One issue flagged: in the rail empty state, the create button's left-edge indicator bar has `animate-pulse` applied (line 196). DESIGN-SYSTEM §6 states "No bouncy/playful easing — keep it calm and quick." `animate-pulse` (Tailwind default: 2s ease-in-out infinite opacity pulse) is in tension with this constraint. An empty state calls for an affordance signal, but the pulse is unnecessary if the dashed border already draws the eye.

**To reach 10:** Remove `animate-pulse` from the empty-state rail indicator bar (line 196). The dashed border treatment on the create button is sufficient as a differentiating signal.

#### Responsive Sensibility — 8/10
The primary loaded view uses a fixed `h-[560px]` full-width layout with the three panes visible — appropriate for a desktop-first app. The staging page header correctly scopes this as "App-shell chrome only." The brief §5 specifies "rail 72px + sidebar 260px both visible" at desktop, and the mockup delivers exactly this. The state gallery uses `grid-cols-1 lg:grid-cols-2` which is a reasonable staging layout.

No responsive breakpoint concerns for the production spec (desktop only per DESIGN-SYSTEM §9). The fixed height in staging slightly truncates the state gallery panels (`h-[320px]`) which is fine for display purposes.

---

### Hard Checks — server-rail-sidebar.html

#### 1. TOKEN AUDIT — PASS
Every color and shadow value traces to a DESIGN-SYSTEM token:

| Value | Mapped token | Status |
|---|---|---|
| `#0a0a0b` | `--surface-950` | PASS |
| `#121214` | `--surface-900` | PASS |
| `#1c1c1f` | `--surface-800` | PASS |
| `#27272a` | `--surface-700` (skeleton base, scrollbar) | PASS |
| `#3f3f46` | `--surface-600` (active server icon fill, scrollbar) | PASS |
| `#52525b` | `--surface-500` (scrollbar hover) | PASS |
| `#10b981` | `--accent-emerald` | PASS |
| `#ef4444` | `--danger` (sidebar error icon via `text-danger`) | PASS |
| `rgba(255,255,255,0.92)` | `--text-primary` | PASS |
| `rgba(255,255,255,0.60)` | `--text-secondary` | PASS |
| `rgba(255,255,255,0.40)` | `--text-muted` | PASS |
| `rgba(255,255,255,0.06)` | `--border-hairline` | PASS |
| `rgba(255,255,255,0.10)` | `--border-hover` | PASS |
| `0 1px 2px rgba(0,0,0,0.4)` | `--shadow-sm` | PASS |
| `0 0 0 2px rgba(16,185,129,0.4)` | `--glow-focus` | PASS |
| `0 0 15px rgba(255,255,255,0.05)` | `--glow-subtle` | PASS |
| `rgba(255,255,255,0.05)` (shimmer gradient stop) | `--glow-subtle` alpha component | PASS (derived) |
| `bg-white/80` (hover indicator bar, line 104) | Not a named token; derived from white | FLAG (see below) |

`bg-white/80` is the only value not traceable to a named token. It is semantically defensible (Tailwind idiom for a semi-transparent white indicator) and consistent with direction.html line 177 (`bg-white`). It does not introduce a new hue. Flagged as undocumented, not as invented. Recommend adding `--indicator-hover: rgba(255,255,255,0.80)` to the design system if this pattern is intended to persist.

No invented hex values. Spacing and radius tokens all trace to DESIGN-SYSTEM §3 and §4.

#### 2. STATE COVERAGE — PASS
- Rail loading: PRESENT ✓
- Rail empty: PRESENT ✓
- Rail loaded: PRESENT ✓
- Sidebar no-server-selected: PRESENT ✓
- Sidebar loading: PRESENT ✓
- Sidebar loaded: PRESENT ✓
- `#general` visible under "General" category: PRESENT ✓ (lines 271–274, aria-current="page")
- Sidebar error: PRESENT ✓

All states from brief §3 confirmed present and correctly structured.

#### 3. SCOPE — PASS
No M3 chrome. The staging header explicitly declares: "No message canvas, composer, voice, presence, or member list (M3)." The content placeholder area in the primary view reads "Channel content — out of scope (M3)." Verified: no message composer, no message list, no voice controls, no presence dots, no member list appears anywhere in the file.

#### 4. ICONS — PASS
All `ph-*` class names in the file are real Phosphor icons:
- `ph-books` ✓
- `ph-plus` ✓
- `ph-caret-down` ✓
- `ph-hash` ✓
- `ph-compass` ✓
- `ph-hand-pointing` ✓
- `ph-warning-circle` ✓
- `ph-arrow-clockwise` ✓

#### 5. Geist + Emerald + Prior Art — PASS
Geist loaded and applied as the body font (lines 11, 23, 50). Emerald `#10b981` is the sole interactive accent. Prior art match: rail structure (home, divider, server icons, active pill, + create) matches direction.html:162–203. Channel sidebar (server header + collapsible categories + channel rows + #general) matches direction.html:207–239. Category headers correctly use `t-secondary` (`rgba(255,255,255,0.60)`) as required by brief §9 / brief §8 — this directly fixes the AA contrast issue identified in brief §8 ("BUT category headers must use --text-secondary (0.60), not text-zinc-500 (too faint, AA fail)").

---

**server-rail-sidebar.html overall verdict: APPROVE**
Concerns: `animate-pulse` on empty-state rail indicator bar conflicts with DESIGN-SYSTEM §6 "no bouncy/playful easing" (brief §9 / DESIGN-SYSTEM §6); channel item padding `px-2 py-1.5` undershoots DESIGN-SYSTEM §3 "sidebar item padding 8px×12px" (brief §4 / DESIGN-SYSTEM §3); compact sidebar loaded state uses a `<div>` category header instead of a `<button>` (brief §6 / DESIGN-SYSTEM §8 ChannelSidebar); `bg-white/80` hover indicator bar is undocumented (DESIGN-SYSTEM §1). All are low-severity polish items. The file meets all hard checks, all required states, and carries no scope violations.
