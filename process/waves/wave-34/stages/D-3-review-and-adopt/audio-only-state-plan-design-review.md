# D-3 Plan-Design Review — Audio-only-state banner + restore control

**Wave:** 34 · **Stage:** D-3 review-and-adopt · **Mockup:** `design/staging/audio-only-state.html`
**Brief:** `process/waves/wave-34/stages/D-1-brief/audio-only-state-brief.md`
**Design system:** `design/DESIGN-SYSTEM.md` · **Prior-art:** `design/voice-study-room.html` + DESIGN-SYSTEM §8 ConnectionStateIndicator
**Reviewer posture:** independent, single-mockup, per-dimension 0–10.

---

## Per-dimension scores

### 1. Visual hierarchy (unobtrusive but clear) — 8/10
The banner is a slim inline status strip pinned to the top of the tile area, not a full-bleed alarm. It reads second (after the room header's "Poor connection" chip) and never dominates the room — the video tiles keep their weight below it. Left cluster (icon + "Audio-only" + why-text) vs right cluster (mic-active + restore CTA) is a clean two-pole read. Amber is confined to a 32px tinted status disc, not a bar of color, so it signals without shouting.

**What makes it a 10:** the auto banner uses `shadow-pop` (`0 8px 24px` — DESIGN-SYSTEM §5 reserves this for modals/popovers/tooltips; brief §4 specifies `--shadow-sm`). The heaviest elevation token on a status strip fights "unobtrusive." The manual and restoring banners correctly use `shadow-sm` — the auto state is the outlier. Drop the auto banner to `shadow-sm` for a true 10. (Concern cited to DESIGN-SYSTEM §5 + brief §4.)

### 2. Spacing rhythm — 9/10
Padding sits on the 4px base scale (DESIGN-SYSTEM §3): `p-2.5`/`p-3` banner padding, `gap-3.5` icon→text, `gap-2` action cluster, `sm:pl-4` (16px panel padding). 8px inter-element rhythm holds. Icon discs are a consistent 32px (`w-8 h-8`) across all three states; mobile drops to 28px (`w-7 h-7`) proportionally. Section stack uses `gap-12 lg:gap-16` — matches the 24px+ section-gap intent.

**What makes it a 10:** near-perfect. The only nit is the restoring banner's ad-hoc `mt-[1px]` / `mt-0.5` micro-nudges on the text block instead of a single baseline-aligned flex rule — off-scale by a hair. A 10 keeps every offset on the token scale.

### 3. Brand coherence (calm academic; amber-reuse for degraded, emerald for restore) — 10/10
Textbook reuse of the ConnectionStateIndicator semantic (DESIGN-SYSTEM §8 + §1 mapping `--connection-reconnecting → --accent-amber`). Auto/degraded = amber (`#f59e0b`) tint + border + `ph-wifi-low`; restore CTA = emerald (`#10b981`) per `--success`; manual (user-intent, non-degraded) correctly drops to neutral surface-700 with no alert color at all — a sharp distinction that shows the semantic was understood, not copied. No neon, no `--danger` red misused for a non-error state, no invented hex. Copy is calm and explains *why* ("Video paused locally to protect call quality"), matching brief §9's calm-not-alarming bar and the "No one else here" prior-art tone.

### 4. Edge-cases (auto vs manual vs restoring; audio-still-on) — 8/10
All three live states are distinctly rendered with different icon/color/copy: auto (amber + `ph-wifi-low` + "saving bandwidth"), manual (neutral + `ph-video-slash` + "you manually paused"), restoring (emerald + spinner + disabled CTA with `aria-disabled`). Normal-hidden is correctly treated as absent (no banner), which is the right call. Restore→restoring inflight is modeled (button disabled, spinner, "Re-establishing camera connection").

**What makes it a 10:** the restoring state drops the "Mic active" reassurance chip that auto and manual both carry. Audio is the invariant throughout (brief §7) and brief §9 requires audio-still-on be communicated — the restoring moment is exactly when a member is most likely to fear the connection is dropping, so that's the worst state to omit the mic reassurance. Add the mic-active chip to restoring for a 10. (Concern cited to brief §7 + §9.)

### 5. Accessibility (role=status, aria-live=polite, real button, text+icon not color-alone) — 10/10
Every banner carries `role="status" aria-live="polite"` (DESIGN-SYSTEM §8 a11y contract met). Restore is a real `<button>` with `focus:ring-2 focus:ring-accent-emerald/40` (matches `--glow-focus`); the restoring CTA is `disabled` + `aria-disabled="true"`. State never rides on color alone — "Audio-only", "Poor connection", "Restoring video…", "Mic active" all carry the meaning in text, backed by distinct icons. Mic-active mobile fallback has `aria-label="Microphone active"`. Emerald text on emerald/10 tint and amber on amber/10 clear AA per the §1 contrast notes.

### 6. Responsive (degrades to icon+text pill) — 9/10
Dedicated `<640px` proof block collapses cleanly: why-text swaps to terse "Saving bandwidth", the desktop "Mic active" chip becomes a standalone mic icon (`sm:hidden`), and the restore button drops to a short "Restore" label. Restore stays reachable at every width (brief §5 met). Touch-target sizing holds (buttons ≥ the 44px intent on the tap surface).

**What makes it a 10:** at the very narrowest the CTA becomes label-only "Restore" text while the mic collapses to icon-only — the restore affordance loses its `ph-video-camera` glyph exactly when scan-speed matters most. Keep icon+text on the restore pill down to the floor (it fits) for a 10.

---

## Concerns summary
1. **[minor] Auto banner uses `shadow-pop`** — DESIGN-SYSTEM §5 reserves it for modals/popovers; brief §4 specifies `--shadow-sm`. Slightly over-elevated for an "unobtrusive" status strip. Manual/restoring already correct.
2. **[minor] Restoring state omits the "Mic active" reassurance** — brief §7 (audio is the invariant) + §9 (communicate audio-still-on). Highest-anxiety state, worst place to drop it.
3. **[trivial] Off-scale micro-margins** (`mt-[1px]`) on the restoring text block — brief §4 spacing tokens.

None are blocking. All three are token/parity fixes inside the existing structure, not redesigns. Success-criteria checklist (brief §9): 8/8 met (tokens-only, all states, calm+why, restore always reachable, audio-still-on present in auto/manual, responsive pill, real Phosphor names, full a11y) — with the restoring mic-chip parity being the one soft edge on the audio-still-on item.

---

## VERDICT: APPROVE

Adopt `design/staging/audio-only-state.html` as the canonical audio-only-state design. The three concerns are minor parity/token fixes to fold into implementation, not rework — none gate adoption.

**3-line summary:**
Faithful, disciplined reuse of the amber ConnectionStateIndicator semantic for degraded and emerald for restore, with all three live states distinctly and calmly rendered and a full a11y contract (role=status / aria-live / real button / text+icon). Scores: hierarchy 8, spacing 9, brand 10, edge-cases 8, a11y 10, responsive 9. Two minor fixes to apply in build — auto banner should use `--shadow-sm` not `shadow-pop`, and the restoring state should carry the same "Mic active" reassurance as auto/manual.
