# D-3 Plan-Design Review (re-review after refine) — Voice Occupancy Indicator

**Reviewer lens:** `/plan-design-review` (designer's eye, independent single-reviewer, per-dimension 0–10)
**Artifact:** `design/staging/voice-occupancy-indicator.html` (Iteration 2 — re-review after refine)
**Brief:** `process/waves/wave-32/stages/D-1-brief/voice-occupancy-indicator-brief.md`
**Design system:** `design/DESIGN-SYSTEM.md`
**Prior art:** `design/voice-study-room.html` (count chip :278-281, avatar tile :289-296, empty state :368-384)
**Reviewer awareness:** independent, no knowledge of any other reviewer.

---

## Per-dimension scores

### 1. Visual hierarchy (count / identities → Join CTA) — **9 / 10**
Each of the four panels reads cleanly: channel name (`text-lg` medium, `ph-speaker-high`) → hairline `border-t` divider → occupancy body → full-width emerald Join CTA anchored at the panel foot via `flex flex-col justify-between` + `mb-auto`. The CTA is the terminal, highest-contrast element in every state, so the eye lands on the action last — correct for a "glance then decide" surface (brief §1, §6). In populated, the avatar cluster (left) leads and the count chip (right, `ml-auto`, muted `text-xs`) reinforces rather than competes — the identities carry the pull, the number confirms it. Section-header presence dots (emerald ping / hollow ring / danger) telegraph state before the panel body is even parsed.

*What would make it a 10:* the count chip's *meaning* ("studying now") lives only in the sr-only readout and the narrow-viewport text fallback — on desktop the sighted user sees a bare digit. A small "studying now" cue beside the desktop chip would put the number's meaning into the sighted hierarchy. Minor.

### 2. Spacing rhythm (DESIGN-SYSTEM §3) — **8 / 10**
Panel padding `p-5 md:p-6` (20/24px), header stack `mb-6` (24px), occupancy row `gap-4` (16px), section grid `gap-8 xl:gap-12` — all on/near the 4px base. Crucially the loading skeleton mirrors the populated row geometry (34px tiles, overlap, chip-sized placeholder), so the load→populate transition is rhythm-stable.

*What would make it a 10:* two arbitrary off-scale values remain — avatar overlap `-space-x-[10px]` (line 230; on-grid would be `-space-x-2`=8px per brief §4's "avatar-cluster gap 8px", or `-space-x-3`=12px) and button `py-[9px]` (lines 189/280/356; `py-2`=8px / `py-2.5`=10px is on-grid). Snap both to the scale. Repeated 4× for the button.

### 3. Brand coherence (calm academic, emerald restraint, count-chip continuity :278-281) — **10 / 10**
Emerald appears only on the Join CTA fill, the populated status dot/ping, and focus/selection rings — fully within §1 ("one academic accent," no gaming-neon). Zinc surface ladder, Geist type, Phosphor weights all on-system (§1/§2/§7). The count chip (lines 272-275) is a **byte-identical** copy of the prior-art in-room chip (`voice-study-room.html:278-281`): same `ml-auto flex items-center gap-1.5 px-2 py-1 rounded bg-study-900 border border-border-hairline text-xs font-medium text-text-secondary` + `ph-users` (aria-hidden) + `<span aria-hidden>` count — radius, size, weight, padding, fill all match. Brief §8/§9 continuity requirement fully met. Empty state reuses the prior-art voice verbatim: "No one else here yet — the door's open." (line 315 vs :383). No invented hex, clean bounded extension.

### 4. Edge-case handling (four states + "+N" overflow + fail-soft) — **9 / 10**
All four brief §3 states render and each is sensible:
- **Loading** (line 172): `animate-pulse` skeleton on avatar/text/chip placeholders + `aria-busy="true"` — DESIGN-SYSTEM §8 "skeleton, never spinners."
- **Populated** (line 223): 4 avatars + `+4` overflow pill for a count of 8 (consistent), bounded cluster — brief §9 "bounded + '+N', no unbounded list." The `+N` pill is a distinct surface-900 pill, not a clipped avatar.
- **Empty** (line 307): centered `ph-door-open` in a 42px frame + "Room is empty" + "the door's open" + de-emphasized `study-700` "Be the First to Join" — brief §3 "calm invitation, not alarming."
- **Error** (line 347): muted `ph-warning-circle` + "Occupancy data currently unavailable" + fully-enabled emerald "Join Room Anyway" — genuinely fail-soft, never blocks Join (brief §3/§9 checkbox 8).

*What would make it a 10:* the loading skeleton renders 3 avatar placeholders while populated shows 4 — a small potential layout nudge on load→populate. Reserving the populated footprint (or a shared max-shown constant) in the skeleton would make the transition jump-free. Minor, B-block note. Also: only the fixed-4 cluster is demonstrated; the graduated brief §5 caps (~6/~5/~4) are an acceptable single-tier simplification for a static mockup.

### 5. Accessibility (role=status/aria-live, avatar aria-label, names+count in text; error icon aria-hidden & OUT of a11y tree) — **10 / 10**
Meets every rubric requirement:
- `role="status"` + `aria-live="polite"` on all four occupancy regions (lines 172/223/307/347); loading adds `aria-busy="true"`.
- Names + count are **in text, not color-alone**: the populated SR readout is a single contiguous `sr-only` span — "8 participants studying now: Sarah Chen, Julian Davis, Mateo Ruiz, Omar F., and 4 others." (line 224) — with the entire visual cluster `aria-hidden="true"` (line 227), so SRs hear names once, no duplication. This satisfies "names retained in text" at the a11y layer at every viewport.
- Avatar `aria-label` / `alt` = display name on every participant: `alt="Sarah Chen"` (line 234), `role="img" aria-label="Julian Davis"` on the initials fallback (line 240), `aria-label="and 4 others"` on the `+N` pill (line 260).
- **The error warning icon is `aria-hidden="true"` and OUT of the accessibility tree** (line 350, `ph-warning-circle`, `aria-hidden="true"`) — the exact rubric requirement is satisfied; the icon is decorative and the message text carries the meaning. (The iteration-1 malformed-markup defect on this icon is resolved — the attribute is now a real, cleanly-separated `aria-hidden`.)
- Keyboard parity present: avatar wrappers have `focus-visible:ring-2 focus-visible:ring-accent-emerald` and tooltips reveal on `:focus-within` (line 109), not hover-only. `prefers-reduced-motion` disables pulse/ping (lines 122-124).

### 6. Responsive (below-1024 count-only, names retained in text) — **10 / 10**
The brief §5 / DESIGN-SYSTEM §9 contract is implemented correctly. The avatar cluster is `hidden lg:flex` (line 230), so below 1024 it collapses and a `lg:hidden` text fallback "8 studying now" (line 269) takes over; the count chip persists at every width (never gated behind `lg:`). Names are retained in text via the always-present `sr-only` readout (line 224) irrespective of viewport — so the rubric's "names retained in text" holds even in the degraded narrow layout. The loading state mirrors the same collapse with a `lg:hidden` bar skeleton (line 181), keeping the degrade consistent across states.

---

## Enumerated concerns (each cited)

1. **C-1 [Spacing — LOW] off-scale arbitrary values** — `-space-x-[10px]` (line 230) and `py-[9px]` (lines 189/280/356) sit off the 4px base. Cited against **DESIGN-SYSTEM §3** and **brief §4** ("avatar-cluster gap 8px"). Snap to `-space-x-2`/`-space-x-3` and `py-2`/`py-2.5`. Cosmetic; `py-[9px]` repeats 4×. *Non-blocking, B-block polish.*
2. **C-2 [Hierarchy — LOW] count meaning absent from sighted desktop read** — the desktop chip shows a bare `8`; "studying now" lives only in the sr-only span and the narrow fallback. Cited against **brief §11** (count-vs-identities hierarchy). A small desktop "studying now" cue would close it. *Non-blocking.*
3. **C-3 [Edge-case — NOTE] loading skeleton (3 avatars) ≠ populated shown (4)** — risks a minor layout nudge on first paint. Cited against **brief §3** (loading→populated). Reserve the populated footprint / share a max-shown constant. *Non-blocking, B-block note.*
4. **C-4 [Primitive reuse — NOTE] composed, not declared** — the empty-state icon frame, `+N` pill, and error sub-panel are hand-built rather than declared instances of the §8 Avatar / Badge / Empty-state primitives. Cited against **brief §4 / §8**. Visually correct; a mapping comment would de-risk canonicalization. *Non-blocking.*
5. **C-5 [Token audit — PASS]** — no invented hex or new tokens: all colors map to DESIGN-SYSTEM §1 (`study-*`, `accent-emerald`, `danger`, `text-*`, `border-*`); radii/shadows on-system; Phosphor `ph-users` / `ph-door-open` / `ph-warning-circle` / `ph-speaker-high` all real. **Brief §9 checkboxes 1 & 9 satisfied.**

---

## Verdict

**APPROVE**

---

*Rationale:* This iteration clears every rubric requirement. The count chip is byte-identical to the prior-art in-room chip (§3 continuity, brief §8/§9), all four states render distinctly with a bounded `+4` overflow and a genuinely fail-soft error (§4), the accessibility contract is fully met — `role="status"`/`aria-live` regions, a single contiguous `sr-only` name+count readout with the visual layer `aria-hidden`, avatar `aria-label`s, and the error warning icon correctly `aria-hidden` and out of the a11y tree (§5) — and the below-1024 degrade collapses to count-only while retaining names in text (§6). The iteration-1 blockers (chip continuity; unreachable names; malformed error-icon markup) are all resolved. Remaining concerns (C-1 off-scale utilities, C-2 desktop count-meaning cue, C-3 skeleton-count parity, C-4 primitive-instance comments) are low-severity polish — targeted class/markup edits appropriate for the B-block, none gating adoption.
