# D-2 Variants — E2E DM encryption status indicator

**Gap:** e2e-indicator (single gap; DM key-setup folded at D-1)
**Staging file:** `design/staging/e2e-indicator.html` (23,812 bytes)
**Generator:** `/aidesigner` (aidesigner.ai REST, initial generation / Recipe 1)
**aidesigner usage:** prompt 12,336 tok · completion 8,653 tok · total 20,989 tok · HTTP 200 · no warnings

## Generation approach

One self-contained dark-only HTML variant driven by the full D-1 brief + full DESIGN-SYSTEM.md inline, with a load-bearing generation directive enforcing the fail-closed ship-blocker, brand (no red-lock security-theater), token discipline, and real Phosphor glyphs. Layout: a **left "state legend" column** rendering all six states side-by-side as labelled spec rows (State 1–5 + tooltip), and a **right "spatial context" column** — a live DM thread panel (surface-800 canvas, surface-900 header) showing the two real placements: the header badge (encrypted) and per-message micro-affordances (plaintext-fallback + cannot-decrypt) in situ. A replay button demonstrates the fail-closed loading→encrypted resolution (State 5 → State 1).

## States rendered (all 6 required)

1. **Encrypted** — emerald tint pill (`accent-emerald/10` bg + `/20` border + emerald text) with `ph-fill ph-shield-check`. The ONLY state showing a shield/lock. Header badge + narrow-viewport icon-only fallback.
2. **Not-encrypted (plaintext fallback)** — grey `surface-700` pill, `text-secondary`, `ph-lock-open`, label "Sent as standard message." Per-message affordance in the DM canvas. No lock, no red.
3. **Not-encrypted (group DM)** — grey treatment, `ph-shield-slash`, tooltip "Group conversations are not end-to-end encrypted yet."
4. **Cannot-decrypt-on-this-device** — `text-muted`, `ph-key`, "No key on this device" + an honest undecryptable-payload shell (muted mono "encrypted payload unavailable"). Calm, non-alarming.
5. **Loading / establishing** — `text-muted`, `ph-circle-notch` spin, "Establishing secure connection…". NEVER a lock; resolves to State 1 only on proof (JS `setTimeout` branch).
6. **Hover/focus tooltip** — surface-900 popover, radius-md, shadow-pop, 12px, plain-language copy (exact strings from the brief).

## Token + constraint audit (orchestrator enforcement, pre-D-3)

- **Hex audit:** every literal hex in the file is an approved DESIGN-SYSTEM token (`#0a0a0b`, `#121214`, `#1c1c1f`, `#27272a`, `#3f3f46`, `#52525b`, `#f59e0b`, `#ef4444` — the last two declared as `:root` tokens only). Emerald `#10b981` present via `--rgb-accent-emerald` CSS var. **No invented hex.**
- **Font:** Geist family via system tokens; no off-system fonts.
- **Phosphor glyphs (all real):** `ph-shield-check`, `ph-lock-open`, `ph-shield-slash`, `ph-key`, `ph-circle-notch` + UI glyphs (`ph-magnifying-glass`, `ph-plus-circle`, `ph-smiley`, `ph-sidebar`, `ph-arrows-clockwise`). None invented.
- **FAIL-CLOSED verified:** `ph-fill ph-shield-check` (the only lock/shield affordance) appears ONLY in encrypted-state markup (lines 153, 254, 266) and the JS resolve-to-encrypted branch (line 389, inside the loading→proven-encrypted `setTimeout`). Loading uses `ph-circle-notch`; not-encrypted/group/cannot-decrypt use grey/muted glyphs. No code path renders a lock over a non-encrypted message.
- **No red on not-encrypted/cannot-decrypt:** `--danger`/`#ef4444` appears ONLY as a `:root` token declaration (line 40) — never applied to any not-encrypted, group, loading, or cannot-decrypt element. Calm grey/muted throughout, per brand.
- **Grayscale-safe:** states differ by glyph SHAPE (filled shield vs open lock vs slashed shield vs key vs spinner) + TEXT, not colour alone.
- **A11y:** header/loading badges are `role="status" aria-live="polite"`, keyboard-focusable (`tabindex="0"`), emerald `focus-visible:ring`. Respects `prefers-reduced-motion` (state-fade / spin gated). Responsive label→icon collapse at md breakpoint with tooltip carrying the words.

No genre-convention drift detected (no red alarm lock, no cinematic motion, no cutesy affordance, no false padlock). Advancing to D-3 dual review without a first-pass refine.
