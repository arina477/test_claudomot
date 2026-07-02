# /ui-ux-pro-max — D-3 Independent Review

**Mockup:** `design/staging/screen-share-tile.html`
**Brief:** `process/waves/wave-34/stages/D-1-brief/screen-share-tile-brief.md`
**Reviewer:** ui-ux-pro-max (independent; no awareness of other reviewers)
**Scope:** Screen-share prominent tile — voice-study-room in-room surface (4 states).

---

## 1. Brief §9 checkbox audit

| # | Success criterion | Verdict | Evidence |
|---|---|---|---|
| 1 | Uses only DESIGN-SYSTEM §4 tokens (no invented hex) | **MET (with 2 minor deviations)** | All `study-*`, `accent-emerald`, `accent-amber`, `danger`, `danger-text` values in the tailwind config (lines 30–65) match DESIGN-SYSTEM §1/§5 exactly. Two non-invented but off-token references — see token audit §2. |
| 2 | Renders all §3 states (no-share / sharing-active / loading / own-share) | **MET** | State 1 baseline grid (lines 129–196); State 2 sharing-active (198–290); State 3 loading (292–330); State 4 own-share (332–397). All four present and distinct. |
| 3 | Screen-share tile VISUALLY DOMINANT vs avatar tiles | **MET** | Sharing-active: share region is `flex-1 min-h-0` (line 211) filling the canvas; avatars demoted to a fixed `h-[60px] md:h-[72px]` strip (line 250). Dominance ratio is emphatic. |
| 4 | Avatars demote to a strip/row when share active | **MET** | Horizontal `overflow-x-auto` strip with 40–48px avatars + `+4` overflow badge (lines 250–274). Clear demotion from the 80px grid avatars in State 1. |
| 5 | Clean revert to normal grid on stop (no orphan tile) | **MET (static-inferrable)** | State 1 is a pure avatar grid with no residual share scaffolding; State 4's "Stop Presenting" + toggled control button imply revert path. As a static mockup, revert is structurally consistent — no orphan markup. Runtime revert is a build concern, not gate-blocking here. |
| 6 | Responsive per §5 | **PARTIAL** | Grid uses `grid-cols-2 md:grid-cols-3 xl:grid-cols-4` (line 140) and strip `h-[60px] md:h-[72px]`. Meets the general intent (share priority, avatar collapse). BUT §5 names specific 1440/1280/1024 breakpoints and a "max ~1000px centered" share tile at 1440+; the mockup uses only Tailwind `md`/`xl` and a full-bleed share region with no max-width centering. Acceptable for a component mockup; note the max-width centering is unimplemented. |
| 7 | Real Phosphor icon names (ph-monitor / ph-screencast / ph-x) | **PARTIAL** | All icons used are real Phosphor names (icon audit §3). BUT the brief's named `ph-x` for stop-share is NOT used — the mockup uses `ph-stop` (in-canvas, line 361) and a toggled `ph-screencast` (control cluster, line 389). `ph-monitor` ✓ (line 353), `ph-screencast` ✓. Deviation from named set; both substitutes are valid + arguably clearer. |
| 8 | a11y: labeled region + real button + live-region announce | **MET (with a gap)** | Labeled region: `aria-label="Screen shared by Alice T."` (line 211) ✓. Real button + aria-pressed: share buttons are real `<button aria-pressed="false/true">` (lines 187, 285, 388) ✓. Live region: `aria-live="polite"` announcer present (line 120) ✓; loading region also `aria-live="polite" aria-busy="true"` (line 304) ✓. GAP: the announcer div is empty with only a "maps here via JS in production" comment — the announce content is deferred to build, acceptable at mockup stage but flagged. |

**§9 result: 6 MET, 2 PARTIAL (items 6 responsive-centering, 7 ph-x naming).** No unmet items.

---

## 2. Token audit

Baseline expectation: study-950..500, emerald, amber, danger, danger-text only.

- **Config block (lines 30–65):** clean. Every declared hex matches DESIGN-SYSTEM §1 (surfaces, text-primary/secondary/muted, border-hairline/hover) and §5 (shadow-sm/pop, glow-focus/danger/subtle). `danger.tint rgba(239,68,68,0.10)` is `--danger` @ 10% — the exact tint the design system §1 references for danger-on-tint. Not invented.
- **DEVIATION 1 — `hover:bg-emerald-400` (line 388):** pulls Tailwind's default-palette `emerald-400` (`#34d399`), which is NOT in DESIGN-SYSTEM §1 (the system defines only `--accent-emerald #10b981`). This is an untokened hex leak via Tailwind defaults for the active-share button's hover-lighten. Minor but real — should be a defined lighten of `accent-emerald` or `hover:bg-emerald-500`-equivalent from the study/accent scale.
- **DEVIATION 2 — inline arbitrary emerald glows:** own-share tile uses `shadow-[inset_0_1px_0_rgba(16,185,129,0.1)]` (line 344) and `bg-accent-emerald/5 blur-[120px]` (line 347) instead of the brief §4-named `--glow-subtle` token. Values are emerald-derived (16,185,129 = `#10b981`), so not an invented hue, but they bypass the named token. Cosmetic/consistency note.

**Token verdict:** No invented hues. Two off-token references (one Tailwind-default `emerald-400`, one set of arbitrary emerald glows). Both cosmetic, neither introduces a new brand color. REVISE-level nits, not REJECT-level.

---

## 3. Phosphor icon audit

All `<i class="ph ...">` glyphs verified as real Phosphor Icons names:

| Icon | Real? | Location |
|---|---|---|
| `ph-microphone` | ✓ | control clusters, tiles |
| `ph-microphone-slash` | ✓ | muted indicators |
| `ph-video-camera` | ✓ | camera toggle |
| `ph-screencast` | ✓ | share button (default + active) |
| `ph-phone-disconnect` | ✓ | leave button |
| `ph-speaker-high` | ✓ | presenter audio indicator |
| `ph-spinner` | ✓ | loading state |
| `ph-monitor` | ✓ | own-share hero icon |
| `ph-stop` | ✓ | in-canvas stop-presenting |

**Every icon is a real Phosphor name.** The brief-named `ph-x` is absent (substituted by `ph-stop` + toggled `ph-screencast`) — a naming deviation, not a fabricated-icon error.

---

## 4. UX flow

- **share → see → stop:** Coherent. Default share button (`aria-pressed="false"`, `ph-screencast`) → own-share state shows in-canvas "You are sharing your screen" hero + emerald `ph-monitor` badge + control-cluster button flips to emerald fill (`aria-pressed="true"`). Sensible and legible.
- **own-share "you're sharing" + stop:** PRESENT and strong. Explicit headline "You are sharing your screen" (line 356), explanatory copy about audio pickup (line 357), AND two stop affordances — in-canvas "Stop Presenting" button (line 360) + toggled control-cluster button (line 388). Dual-stop is redundant but not harmful; the in-canvas button's `ph-stop → group-hover:text-danger` gives a calm destructive cue.
- **viewing someone else's share:** "Live Share" pill (emerald pulse) + always-visible sharer name tag ("Alice T. / Presenting", lines 227–238) + presenter audio indicator. Satisfies brief §6 "sharer's name label always visible" and the "who is driving" requirement.
- **§10 keep-OUT respected:** ✓ ALL. No annotation/drawing layer; no multi-share grid (exactly one prominent region per state); no quality/resolution selector; no custom window-picker (relies on browser-native per brief §6); no recording controls. Non-goals cleanly respected.

**UX verdict:** flow is sensible, own-share is unambiguous, non-goals honored.

---

## 5. a11y audit

- **Screen-share region labeled:** ✓ `aria-label="Screen shared by Alice T."` (line 211), loading region `aria-label="Loading screen share..."` + `aria-busy="true"` (line 304).
- **Share/stop is a real button with aria-pressed:** ✓ real `<button>` elements, `aria-pressed="false"` default (lines 187, 285), `aria-pressed="true"` active (line 388). Focus-visible emerald rings on interactive controls.
- **Live-region announces start/stop:** PARTIAL — `aria-live="polite"` announcer div exists (line 120) but is empty pending JS; the start/stop announcement text is a build-time TODO. Structurally correct, content deferred.
- **Not color-alone:** ✓ Mostly. Muted state pairs `ph-microphone-slash` icon WITH danger color (not color-alone). Own-share pairs emerald WITH text headline + icon. Sharing pairs emerald pulse WITH "Live Share" text label. Presence/sharing conveyed via text+icon, not hue alone.
- **Reduced motion:** ✓ `prefers-reduced-motion` block (lines 85–92) neutralizes the subtle-pulse + shimmer + spinner. Calm-pulse (3s) already avoids aggressive blinking.

**Concern (minor):** the empty live-region and empty avatar `alt` fallbacks are wired for JS injection but not populated in-mockup — a build handoff note, not a mockup defect.

---

## Concerns cited (summary)

1. **[minor/REVISE] `hover:bg-emerald-400`** (line 388) leaks a Tailwind-default hex outside DESIGN-SYSTEM §1 — replace with a tokened emerald lighten.
2. **[minor/REVISE] `ph-x` not used** for stop-share though brief §4/§9 named it — substituted by `ph-stop` + toggled `ph-screencast`. Both valid; either update the brief or align the icon.
3. **[minor] Arbitrary inline emerald glows** (lines 344, 347) bypass the brief-named `--glow-subtle` token — cosmetic consistency.
4. **[minor] Responsive §5 max-width centering** (share tile "max ~1000px" at 1440+) unimplemented — component uses full-bleed + Tailwind md/xl only.
5. **[build-handoff, non-blocking] Live-region + announce text** deferred to JS (empty in mockup) — must be populated at build for the a11y AC to fully pass.

None of these rise to a functional/brand-integrity failure. The mockup meets the core dominant-tile hierarchy, all 4 states, real-icon, real-button, and non-goal requirements.

---

## VERDICT: **APPROVE**

The mockup satisfies every load-bearing §9 criterion — all four states render, the screen-share tile is emphatically dominant, avatars demote cleanly, own-share is unambiguous with a stop control, all icons are real Phosphor names, the share/stop control is a real `aria-pressed` button, and all §10 non-goals are respected with no invented brand hues. The cited items (Tailwind-default `emerald-400` hover, `ph-x`-vs-`ph-stop` naming, arbitrary emerald glows, unimplemented max-width centering) are minor token/naming nits and build-handoff notes, not gate-blockers. Fold them into the adopt-time cleanup rather than sending back for rework.
