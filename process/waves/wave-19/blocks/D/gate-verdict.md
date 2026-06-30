# Wave 19 — D-3 Verdict

**Reviewer:** head-designer (fresh spawn, Phase 2 gate)
**Reviewed against:** process/waves/wave-19/stages/D-3-review-and-adopt/{reconciliation.md, server-channel-view-plan-design-review.md, server-channel-view-ui-ux-pro-max.md} + design/staging/server-channel-view.html (read directly) + both D-1 briefs + design/DESIGN-SYSTEM.md
**Attempt:** 1  (first gate; Phase 1 dual-review already ran 2 iterations: REVISE/APPROVE → refine → APPROVE/APPROVE)

## Verdict
APPROVED

## Rationale

Both D-1 design gaps clear the bar. I read the staging HTML directly rather than gating on reviewer summaries, and the two attachment surfaces satisfy their briefs' user jobs:

- **Composer attachment** (composer-attachment-brief §1, §9): the paperclip sits in the composer action row (line 551) as a sibling control to send (line 561) — it reads as a composer action, not a send. The staged-preview strip (line 487) renders above the textarea and is unambiguously pre-send; image-thumb, file-chip, **uploading** (line 518, emerald progress bar + spinner), and **error** (line 530, `role="alert"`, danger border, "Too large (max 10MB)" in red-400) tiles are all live, each removable with a focus-visible remove control. The strip wraps and scrolls (`flex-wrap max-h-[160px] overflow-y-auto`), never hiding the input. All §9 success criteria met.

- **Message-row attachment render** (message-row-attachment-brief §1, §9): the image preview is **correctly constrained** (`max-h-[320px] w-auto max-w-full object-cover`, line 283) — it does not blow out the row — with an `ph-arrows-out` full-size cue and a `role="dialog" aria-modal` lightbox (line 746). The file chip carries glyph + filename + human size (line 225). 0-N renders via `flex-wrap`; the **tombstone row (line 378) carries no attachment block** — tombstone-safe and brief-compliant; and the **broken-image fallback chip** (line 293, `ph-image-broken`) is present as a live demo. All §9 success criteria met.

**Token discipline holds.** The Tailwind config aliases only the exact DESIGN-SYSTEM surface hexes (`study-*`) and the three semantic accents (`emerald/amber/danger`). Every new attachment surface consumes `--surface-700/800/600`, `--text-secondary` (zinc-400), `--text-primary` (zinc-100/200), `--accent-emerald`, and `--danger` per the briefs' §4. No invented hex appears anywhere. Phosphor usage is internally consistent: `ph-paperclip / ph-x / ph-file-pdf / ph-arrows-out / ph-download-simple / ph-image-broken / ph-spinner-gap / ph-warning-circle` — all regular line weight, no off-set glyphs.

**Dark-theme contrast clears WCAG AA.** All attachment text/icon pairings compute ≥4.5:1 text / ≥3:1 non-text (zinc-400 on study-700 ≈ 5.8:1, zinc-200 on study-800 ≈ 13–17:1, red-400 error ≈ 5.4–8.4:1, emerald on study-700 ≈ 5.9:1). The Phase-1 refine also corrected three **pre-existing** zinc-500 text failures (Coursework header line 149, Members/Online/Offline headings lines 676/679/705, composer hint line 568) by bumping to zinc-400 — verified in source. Residual `text-zinc-500` instances are decorative glyphs / carets / typing dots / `·` separators qualifying for the 3:1 non-text allowance.

**Focus and keyboard states are designed, not browser-default.** Every interactive attachment element carries `focus-visible:ring-2 focus-visible:ring-emerald-400/70` (matching `--glow-focus`). The lightbox is a labelled modal dialog with an Esc-disclosing close button and an explicit B-block contract annotation for focus-trap / Esc / backdrop-click / focus-restore.

**Structural integrity confirmed.** 9 `<article>` rows, member-list panel, thread panel + thread composer, and the main composer are all intact; the attachment surfaces are strictly additive. No AI-slop hierarchy, no pseudo-variant, no token fragmentation, no contrast failure, no missing focus state. The Phase-1 matrix routed correctly (A REVISE + B APPROVE → aggregate A → one refine → A APPROVE + B APPROVE → this gate); the single refine fixed genuine rule-1 contrast and brief-completeness gaps, exactly the bar D-2→D-3 iteration exists to enforce. I concur with adoption.

## DESIGN-SYSTEM.md token blessing
None. No new token is introduced. The lightbox close button uses the existing `shadow-pop` utility; the full-size image uses an inline `shadow-[0_8px_40px_rgba(0,0,0,0.5)]` (same `--shadow-pop` family, larger blur for the elevated overlay) and `bg-black/90` for the scrim (Tailwind built-in, not a palette fork). **Do NOT add any token in Action 8.** Canonicalize the file as-is.

## L-2 observations (flag, do NOT promote here)

1. **Recurring zinc-500-on-dark text contrast pattern.** This wave's Phase-1 review found and fixed *three more* pre-existing zinc-500 text sites that failed 4.5:1 on dark surfaces (3.52–4.09:1) — a pattern that has now recurred across multiple waves on the same canonical canvas. Candidate for L-2: a DESIGN-PRINCIPLES check that muted section-heading / metadata text on `study-800/900/950` defaults to zinc-400 (not zinc-500) and is contrast-calculated at authoring time, so it stops being caught reactively at D-3. Flagged for the L-2 observation pipeline; not promoting from the gate.

2. **Static-staging demo-state convention.** All attachment composite states (uploading, error, lightbox, broken-image fallback) are rendered permanently visible in staging to make them reviewable — correct for a state-demonstration mockup; B-block gates their visibility behind interaction. Worth an L-2 note that "render every in-scope state live in staging (no commented-out states)" is the standard a D-3 review can actually assess against — the iter-1 REVISE was driven precisely by states being commented out.

## B-block adoption carries (implementation-level — outside design staging scope)

These are the JS/wiring items the static mockup correctly defers to B-block. They are NOT design defects; carry them into the Build block spec:

1. **Hidden file input binding** — add `<input type="file" class="sr-only" accept="image/*,...">`; bind the paperclip (line 551) `click` → `input.click()`; on `change`, render staged tiles.
2. **Upload progress wiring** — drive the `w-[60%]` emerald progress bar (line 526) from real presign/upload progress; transition tile uploading → staged → cleared on send.
3. **Lightbox interaction** — focus-trap on open, Esc-to-close, click-backdrop-to-close, restore focus to the originating image button on close (per the line-745 annotation + WAI-ARIA dialog pattern). Pass the originating image's alt text through to the dialog `aria-label` (currently generic "Image View").
4. **Broken-image swap** — `img onerror` → swap the constrained preview for the file-chip fallback (the line-293 chip is the target render).
5. **aria-live on staged strip** — add `aria-live="polite"` + `aria-label="Attached files"` to the strip container (line 487) so dynamic tile add/remove is announced.
6. **Chip / retry aria-labels** — the message-row file chip (line 225) currently reuses `aria-label="View full size image"`; set it to a download-intent label (e.g. `Download hw1_guidelines.pdf`). Add `aria-label="Retry sending message"` to the failed-send retry button (line 433).

Client-side validation contract to preserve: ≤10MB + content-type guard → over-limit/disallowed file renders the error tile (not staged for send), per composer-attachment-brief §6.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
