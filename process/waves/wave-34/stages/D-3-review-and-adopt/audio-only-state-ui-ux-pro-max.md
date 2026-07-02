# /ui-ux-pro-max — D-3 Gate Rubric: Audio-only-state banner + restore control

**Wave:** 34 · **Mockup:** `design/staging/audio-only-state.html` · **Brief:** `process/waves/wave-34/stages/D-1-brief/audio-only-state-brief.md`
**Reviewer:** ui-ux-pro-max (independent) · **Scope:** requirement + UX + token + icon + a11y audit on ONE mockup.

---

## 1. Brief §9 checkbox audit (8 criteria)

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| 1 | Uses only DESIGN-SYSTEM §4 tokens (amber degraded, emerald restore/recovered; no invented hex) | **MET** | Tailwind config maps `accent.emerald=#10b981`, `accent.amber=#f59e0b`, surfaces `#0a0a0b→#52525b`, text/border rgba tokens — all identical to DESIGN-SYSTEM §1. Amber used ONLY on the auto/bandwidth-degraded state (border, icon chip, dot); emerald ONLY on restore CTA + the restoring state. No off-palette hex. See token audit §2. |
| 2 | Renders all §3 states (normal-hidden, auto, manual, restoring) | **MET (with note)** | Auto (L140–249), Manual (L251–302), Restoring (L304–345), plus a responsive-proof block (L347–387). **normal-hidden** is not rendered as a visible tile — correct by definition (hidden = no banner), and the header meta text names it. Acceptable: a hidden state has no pixels to show; the staging doc implicitly covers it. |
| 3 | Message is CALM + explains WHY (protecting the call), not alarming | **MET** | Auto sub-text: "Video paused locally to protect call quality" — explains cause, no red, no "Error/Warning" language. Amber (secondary accent, not danger) carries the degrade. Manual: "You manually paused your video stream." Restoring: "Re-establishing camera connection." All calm, matches prior-art "the door's open" register. |
| 4 | Restore-video affordance always present + reachable | **MET** | Real `<button>` in every interactive state: Auto "Restore video" (L213), Manual "Turn on video" (L292), Restoring shows a disabled in-flight button (L335, correct — action is inflight, not removed), mobile "Restore" (L379). Always in the DOM, never behind a menu. |
| 5 | Audio-still-on communicated (mic icon) — reassures member they can still talk | **MET** | "Mic active" pill with `ph-fill ph-microphone` on ≥sm (L195–197, L277–279); on mobile it degrades to a standalone mic icon button with `aria-label="Microphone active"` (L208, L376). Invariant (§7 "audio stays active throughout") is visibly held in auto + manual. **Minor gap:** the Restoring state (L318–341) drops the mic indicator entirely — during restore the member can still talk, but the reassurance disappears. Non-blocking (transient state), flagged as concern C1. |
| 6 | Responsive per §5 (degrades to icon+text pill) | **MET** | Text swaps: "Restore video"→"Restore", "Turn on video"→"Video", full sub-text→"Saving bandwidth"/"Video paused" via `sm:` breakpoints. Mic pill→icon-only on mobile. Dedicated <375px proof block confirms no overflow (`min-w-0` + `truncate` + `flex-shrink-0` on actions). Layout collapse contract honored. |
| 7 | Real Phosphor icon names | **MET** | See icon audit §3 — all names resolve to real Phosphor glyphs. |
| 8 | a11y: role=status aria-live=polite; real restore button; state in text+icon not color-alone | **MET** | Every banner carries `role="status" aria-live="polite"` (L180, L266, L319, L364). Restore is a real `<button>` with `focus:ring-2 focus:ring-accent-emerald/40`. State is conveyed by icon + text label ("Audio-only", "Restoring video...") not color alone. See a11y §5. |

**§9 result: 8/8 MET.** One minor non-blocking concern (C1: mic reassurance absent in restoring state).

---

## 2. Token audit

**Clean — no invented hex.** Every color in the Tailwind config traces to DESIGN-SYSTEM.md:
- Surfaces `#0a0a0b / #121214 / #1c1c1f / #27272a / #3f3f46 / #52525b` = §1 `--surface-950…500` exactly.
- `accent.amber #f59e0b` = §1 `--accent-amber`; comment L41 correctly cites "§1 + §4." Semantic use = `--warning`/`--connection-reconnecting` per §1 mapping — this is the intended reuse of the ConnectionStateIndicator amber the brief §4 asked for. Correct.
- `accent.emerald #10b981` = §1 `--accent-emerald` = `--success`/restore/recovered. Correct semantic.
- text/border rgba, `shadow-sm`/`shadow-pop`, `glow-focus` all match §5. Radii (`rounded-lg` banner, `rounded-full` dots/mic chip, `rounded-md` buttons) match §4.
- `danger` tokens are declared in config but **never used** in markup (correct — degrade is amber, not danger; §1 forbids danger for non-error).

**Flags:** none. Expected-clean confirmed.

---

## 3. Phosphor icon audit

All icon classes resolve to real Phosphor Icons Web names:

| Icon | Real? | Notes |
|------|-------|-------|
| `ph-wifi-low` | ✅ | Brief §4-named. Auto/degraded indicator. |
| `ph-microphone` (`ph-fill`) | ✅ | Brief §4-named. Audio-still-on. |
| `ph-video-camera` | ✅ | Brief §4 named `ph-video`/`ph-video-camera` — `ph-video-camera` is the correct real Phosphor name (`ph-video` is also valid; the more specific camera glyph is the better fit for "restore video"). |
| `ph-video-slash` | ✅ | Manual neutral indicator. Real glyph. Brief §4 offered `ph-wifi-slash`; `ph-video-slash` is arguably a better semantic for a *manual* video-off (not a bandwidth issue), so this substitution is a sound taste call, not an error. |
| `ph-spinner` (`animate-spin`) | ✅ | Restoring loader. Real glyph. |
| `ph-check-circle`, `ph-magic-wand`, `ph-device-mobile`, `ph-hash`, `ph-users` | ✅ | Staging-chrome/mock-room icons only, not part of the target component. All real. |

**No fabricated icon names.** Brief-named `ph-wifi-slash` is not used, but `ph-wifi-low` (also brief-named) covers the degraded case and `ph-video-slash` covers manual — both real, both semantically defensible. PASS.

---

## 4. UX flow — degrade → understand-why → restore

**Flow is sensible and calm.**
- **Degrade:** auto banner `animate-slide-in` (200ms, matches DESIGN-SYSTEM §6 "connection-state changes: 200ms color fade, never abrupt"). Amber pulse dot + `ph-wifi-low` reads as "connection soft-degraded," not "failure."
- **Understand why:** "Video paused locally to protect call quality" answers the member's implicit question. Mic-active pill pre-empts the "can I still talk?" worry. Strong.
- **Restore:** emerald CTA is the single clear next action; hover/active/focus states present; inflight → disabled "Restoring" prevents double-fire. Clean loop.
- **Auto vs manual distinction:** auto = amber (system-driven, bandwidth); manual = neutral surface (`ph-video-slash`, member-driven). Correct that manual is NOT amber — it isn't a degraded/warning condition, so reusing the alert accent there would misfire. Good judgment.

**§10 keep-OUT respected:**
- No per-track granular controls — ✅ (single restore toggle only).
- No custom bandwidth-heuristic UI — ✅ (just a status banner, no meters/graphs).
- No graduated quality-tier selector — ✅ (binary audio-only ↔ video).
- No persisted cross-session preference UI — ✅ (no settings/remember toggle).

All four non-goals honored. No scope creep.

---

## 5. a11y audit

- `role="status"` + `aria-live="polite"` on all four banner instances — a transition to audio-only is announced without stealing focus (polite, not assertive). Correct for a non-critical status change. ✅
- Restore is a real `<button>` (not a div) with visible focus ring (`focus:ring-2 focus:ring-accent-emerald/40`, ≈ §5 `--glow-focus`). ✅
- Disabled restoring button: `disabled` + `aria-disabled="true"` — correct dual signalling. ✅
- **State not color-alone:** conveyed by icon + text label in every state ("Audio-only", "Restoring video...", "Mic active"). A colorblind/greyscale user still reads the state. ✅
- Mobile mic icon-only affordance has `aria-label="Microphone active"` (L208). ✅ Note: the *sm:hidden* mic in Manual (L287) and the responsive-proof mic (L376) lack an aria-label — icon-only, no accessible name → concern C2 (minor; the primary auto-state instance is labelled).
- **Contrast:** amber `#f59e0b` and emerald text sit on tinted/900 surfaces; both clear AA at ≥14px semibold. text-secondary sub-copy `rgba(255,255,255,0.60)` on surface-900 passes. No danger-on-tint pitfall triggered (danger unused). ✅

**a11y result: strong.** Two minor labelling gaps (C1 restoring-mic reassurance, C2 unlabelled mobile mic icons) — cosmetic/polish, not gate-blocking.

---

## Concerns (cited)

- **C1 (minor):** Restoring state omits the "Mic active" mic indicator present in auto/manual. During restore the audio invariant still holds; showing it would keep the reassurance continuous. Nice-to-have.
- **C2 (minor):** Two icon-only mic affordances (Manual `sm:hidden` L287, responsive-proof L376) lack `aria-label` — the auto-state instance L208 is correctly labelled; propagate that label to the others in build.
- **C3 (cosmetic):** `.tooltip-trigger`/`.tooltip` classes referenced (L195, L208) with no tooltip CSS/behavior defined in the mockup — inert placeholders; wire real tooltips (per §8 Tooltip primitive) at build or drop the classes.

None of C1–C3 blocks adoption; all are build-time polish items.

---

## VERDICT

**APPROVE**

8/8 §9 criteria met, token audit clean (no invented hex; amber-degraded + emerald-restore semantics correct), all Phosphor names real, degrade→understand→restore flow is calm and non-alarming, all four §10 non-goals respected, and a11y (role=status/aria-live=polite, real focusable restore button, text+icon state) is sound. Three minor build-time polish notes (C1–C3), none gate-blocking.
