# D-3 Design Review — server-channel-view.html (wave-19 attachment surfaces)
Reviewer: ui-designer (Reviewer A)
Date: 2026-06-30
Scope: Two additive attachment surfaces on the canonical server-channel-view:
  (1) Composer attachment — paperclip button + staged-preview strip
  (2) Message-row attachment render — inline image preview / file chip / lightbox / 0-N / tombstone-safe

---

## Pre-review: Structural integrity check

Confirmed 9 `<article>` rows present:
1. Mia Wong — mention pill + FILE attachment + reactions + thread affordance (row 1)
2. David C. — self-mention pill + IMAGE attachment + thread affordance (row 2)
3. Elias — standard message with "(edited)" tag (row 3)
4. Elias — inline editing state (row 4)
5. Elias — delete confirmation state (row 5)
6. Tombstone — "This message was deleted" (row 6)
7. David C. — react menu open (row 7)
8. Elias — pending/sending state (row 8)
9. Elias — failed-to-send state (row 9)

All 9 articles confirmed. Member-list panel (Pane 5) confirmed. Thread panel (wave-18, Pane 3.5/4) confirmed including thread composer. Main composer confirmed. Attachment surfaces are strictly ADDITIVE: no pre-existing structure altered.

---

## Contrast calculation reference (WCAG 2.1 AA, 4.5:1 text / 3:1 non-text)

All computed using sRGB linearization. Surface luminances:
- study-950 (#0a0a0b): 0.003058
- study-900 (#121214): 0.006117
- study-800 (#1c1c1f): 0.011763
- study-700 (#27272a): 0.020495
- study-600 (#3f3f46): 0.050540

Text luminances:
- zinc-100 (#f4f4f5): 0.905270
- zinc-200 (#e4e4e7): 0.777503
- zinc-300 (#d4d4d8): 0.660419
- zinc-400 (#a1a1aa): 0.359691
- zinc-500 (#71717a): 0.167261
- emerald (#10b981): 0.363931

### Attachment-surface contrast results

| Pairing | Ratio | Status |
|---------|-------|--------|
| Staged tile filename (zinc-200) on study-700 | 11.74:1 | PASS |
| Staged tile size metadata (zinc-400) on study-700 | 5.81:1 | PASS |
| File chip filename (zinc-200) on study-800 | 13.40:1 | PASS |
| File chip size metadata (zinc-400) on study-800 | 6.63:1 | PASS |
| Emerald text on study-700 (thread/chip labels) | 5.87:1 | PASS |
| Emerald icon (ph-file-pdf) on study-700 icon bg | 5.87:1 | PASS (icon 3:1 min) |
| Error tile text (red-400) on study-700 | 5.38:1 | PASS |
| Upload status (zinc-400) on study-700 | 5.81:1 | PASS |
| Chip hover: emerald-50 on study-600 | 9.91:1 | PASS |
| Amber-500 "Sending..." on study-800 | 7.92:1 | PASS |
| Lightbox close button (zinc-300) on study-800 | 11.50:1 | PASS |

### Pre-existing zinc-500 failures (carry-forward; NOT introduced by attachment surfaces)

| Pairing | Ratio | Status |
|---------|-------|--------|
| zinc-500 on study-900 (sidebar category headers, Members headings) | 3.87:1 | FAIL (text, need 4.5:1) |
| zinc-500 on study-800 (Members "Online/Offline" section heads) | 3.52:1 | FAIL |
| zinc-500 on study-950 (composer footer hint line, line 564) | 4.09:1 | FAIL |

These three failures are NOT new to this wave's attachment surfaces. They exist in the base canvas inherited from prior waves. They are noted here per rule 1 (always calculate for muted text on dark) and must be resolved before the design ships, but they do not originate from the D-1 briefs under review.

---

## Dimension-by-dimension scores

### 1. Visual Hierarchy — 8/10

The attachment strip and the message-row attachment blocks integrate cleanly into the established visual stack. The staged-tile strip sits inside the composer form element (above the textarea) and reads unambiguously as pre-send content rather than received content. The image-preview (row 2, David C.) at max-h-[320px] creates a prominent but bounded focal point within the message row, then steps down to the thread affordance and reactions — the natural reading order holds.

The file chip (row 1, Mia Wong) uses a white-space-consuming min-w-[240px] that produces a substantial chip. This reads well as a downloadable artifact but is slightly heavy for a single-file scenario; when multiple file chips appear in a wrap layout, hierarchy may become ambiguous. This is a minor point within the single-file cases shown.

The hover expand-icon (ph-arrows-out) on the image preview uses a scrim + scale animation to communicate click-affordance without adding static chrome. Effective.

What would make it a 10: remove the hardcoded min-w on the file chip and replace with a flex-based content-minimum so short filenames produce compact chips while long names still get adequate width; add a visible count badge (e.g., "+2 more") when a wrap overflow occurs in the staged strip at narrow viewports.

### 2. Spacing — 8/10

Staged-preview strip uses gap-2 (8px) between tiles, px-3 pt-3 pb-1 for strip padding — this stays within the 4px base grid and separates tiles cleanly from each other and from the textarea below. The attachment block in the message rows uses mt-2.5 (10px) between the message body and the attachment, and the block itself is correctly separated from the reaction pills / thread affordance by mt-2.5 / mt-3. Rhythm is consistent with the DESIGN-SYSTEM §3 message-row vertical rhythm of 8px.

The file chip padding (p-2 pr-3) and icon slot (w-8 h-8) match the composer staged-tile geometry, which creates a pleasing correspondence between "staged" and "sent" states.

Minor concern: the image preview in message row 2 uses the `overflow-hidden rounded-md` on the wrapper `button` with `object-cover` on the `img`. The image tag lacks an explicit `width` attribute, meaning the browser must lay the image out before it can apply the constraint. This is not a spacing error per se, but it can cause a content-layout-shift (CLS) flash. Not a blocking issue for a static mockup, but worth flagging for implementation.

What would make it a 10: add explicit aspect-ratio or a min-height skeleton placeholder on the image preview wrapper to eliminate CLS in the live implementation.

### 3. Brand Coherence (dark/academic/emerald, no neon) — 9/10

Palette discipline is rigorous. Every new surface in the attachment areas uses strictly design-system tokens mapped to study-700/800/900/600, zinc-200/400, emerald, danger/red-400, and amber-500. No invented hex values were found anywhere in the attachment surfaces.

The staged-tile background of bg-study-700 is correct per the brief's `--surface-700` instruction. The file chip background of bg-study-800 (with hover bg-study-600) matches the brief's `--surface-800/hover-600` spec exactly. The image preview wrapper uses bg-study-800 border border-study-700/60 rounded-md — precisely `--radius-md` as specified.

The emerald paperclip button hover and the emerald ph-file-pdf icon maintain the single academic accent without veering into gaming-neon territory. The danger tile border and the error state (border-danger/60, bg-danger/10) use the semantic token correctly and stay understated.

Phosphor icon consistency: ph-paperclip (attach), ph-x (remove), ph-file-pdf (file type), ph-arrows-out (expand), ph-download-simple (chip hover) — all from the Phosphor regular line weight, consistent with DESIGN-SYSTEM §7. The icon choice of ph-download-simple appearing only on chip hover (opacity-0 to opacity-100) is an elegant disclosure.

What would make it a 10: the image-overlay expand cue uses bg-study-800/90 which is on-token. One subtle improvement: the overlay scrim (bg-study-950/40) could use bg-black/50 for a slightly stronger contrast backdrop over bright images without adding a new token — but this is a refinement, not a correction.

### 4. Edge-Cases — 7/10

Covered states:
- Staged image tile (active): PRESENT and correct
- Staged file tile (active): PRESENT and correct
- Staged upload/progress state: PRESENT but commented out (not rendered)
- Staged error tile: PRESENT but commented out (not rendered)
- Message-row image attachment: PRESENT and correct
- Message-row file attachment: PRESENT and correct
- 0-N (multiple wrap): structurally supported by flex-wrap gap-2 in both surfaces
- Tombstone row (row 6): PRESENT — no attachment block is rendered on the tombstone article, which is correct and brief-compliant (tombstone-safe)
- Lightbox: PRESENT but commented out

Two gaps deduct from the score:

Gap A (minor): The upload-progress tile and error tile are commented out (`<!-- Demo Commented ... -->`). The reviewer can read their structure, and it is well-formed, but these states are not rendered in the live preview. The brief (§3) and success criteria (§9 item 3) require these states to be visible. A D-3 review should be able to assess rendered states, not commented code. At minimum the error tile should be uncommented as it tests a key constraint (>10MB rejection uses `text-red-400` at 5.38:1 — passing).

Gap B (minor): The brief (message-row-attachment §3) requires a broken-image fallback state. There is no article row demonstrating a broken `<img>` falling back to a file-chip presentation. The lightbox is also commented out. These are briefs' explicit success criteria items 4 and 1 respectively and are absent from the rendered view.

The tombstone-no-attachment case is correctly handled (row 6 has no attachment block — well done).

What would make it a 10: uncomment and render the upload-progress, error, and lightbox states; add a broken-image fallback demo row showing the chip fallback.

### 5. Accessibility — 7/10

Passes:
- Attach button: `aria-label="Attach file"`, focus-visible:ring-2 focus-visible:ring-emerald-400/70 — correct
- Staged tile remove buttons: `aria-label="Remove attachment"`, focus:ring-2 focus:ring-emerald-400/70 — correct. Note: focus: vs focus-visible: inconsistency (staged tiles use `focus:ring` while the attach button uses `focus-visible:ring`; prefer focus-visible throughout)
- File chip in message row: `focus-visible:ring-2 focus-visible:ring-emerald-400/70` — correct; aria-label="View full size image" on image button — correct
- Image preview button: keyboard-operable as a `<button type="button">` — correct
- Lightbox close (commented out): has `aria-label="Close image"`, `title="Close (Esc)"`, focus ring — correct structure when rendered
- Tombstone: `aria-label="Deleted message"` on the article — correct; no attachment rendered — correct
- Pending row: `aria-busy="true"` on article — correct

Failures and concerns:

F-1 (Contrast — pre-existing, not attachment-introduced): zinc-500 text on study-900 = 3.87:1, on study-800 = 3.52:1, on study-950 = 4.09:1. All fail 4.5:1. Affects: sidebar category headers ("Coursework"), right-sidebar "Members/Online/Offline" headings, composer footer hint line. These are not introduced by the attachment surfaces but are present in the file and must be flagged under rule 1 (DESIGN-PRINCIPLES).

F-2 (Keyboard trap concern): The lightbox is commented out. When uncommented, the `role="dialog" aria-modal="true"` is present. However, the static HTML has no focus-trap script. Implementation must ensure Tab cycles within the lightbox and focus is restored on close. This is a design spec gap: the brief (§6) requires Esc-closable and the lightbox HTML has the close button + aria-label — but there is no `tabindex` or focus-management annotation. This should be annotated or scripted before handoff.

F-3 (focus: vs focus-visible: inconsistency): Staged-tile remove buttons use `focus:ring-2` (always shows ring, even on mouse click) rather than `focus-visible:ring-2`. Attachment button and most other interactive elements use `focus-visible:ring-2` correctly. Align all interactive elements to `focus-visible`.

F-4 (Missing aria-label on lightbox image): The commented-out lightbox has an `alt` attribute on the full-size image — correct. When rendering the lightbox, the dialog itself needs `aria-labelledby` pointing to a title or `aria-label` on the dialog element. The current `aria-label="Image View"` is generic; the implementation should pass through the original image alt text to the dialog aria-label.

What would make it a 10: resolve F-1 by bumping sidebar/hint zinc-500 text to zinc-400 (which computes ≥4.5:1 on all surfaces); standardize focus-visible throughout; annotate the lightbox focus-trap spec.

### 6. Responsive (≤1024 breakpoint) — 8/10

Staged-preview strip: flex-wrap gap-2 with max-h-[160px] overflow-y-auto. At narrow widths the tiles wrap and the strip scrolls. The compositor form itself is in px-5 pb-5 within the main canvas, which shrinks with the minmax(0,1fr) column. At ≤1024 the thread panel becomes a position:fixed overlay (max-w-360px) per the existing layout-grid CSS, and the channel sidebar converts to a drawer — both confirmed intact in the responsive CSS. The composer and attachment strip never lose their horizontal extent because the main canvas column uses minmax(0, 1fr).

The image preview uses max-h-[320px] w-auto max-w-full object-cover. At ≤1024 viewport the message column narrows, and max-w-full means the image will shrink in width accordingly while max-h-[320px] remains. This is correct: the image stays constrained and does not overflow the column.

The lightbox (commented) uses fixed inset-0 with p-4 padding and max-w-full max-h-full on the image — this is correct full-viewport behavior.

Minor issue: the staged strip has a fixed max-h-[160px] scroll container. At ≤768px where the channel sidebar drawer covers 260px, the remaining canvas may be as narrow as 300–350px. With two min-w-[200px] tiles side by side, they'll be forced to stack vertically (since 200+200 > 300), adding scroll height quickly. The max-h-[160px] is adequate for 2 rows (2 × ~60px) but tight for 3+. This is an acceptable design constraint given the brief's "strip scrolls if many" allowance, but implementors should test at 320px canvas width.

What would make it a 10: either reduce the staged tile min-w to ~160px at ≤768px via a responsive class, or document the scroll behavior explicitly in the handoff annotations.

---

## Token discipline audit

| Token instruction (brief / DESIGN-SYSTEM) | Implementation | Verdict |
|-------------------------------------------|---------------|---------|
| Staged tiles: --surface-700 bg | bg-study-700 | PASS |
| File chip: --surface-800 bg / hover-600 | bg-study-800 hover:bg-study-600 | PASS |
| Image preview: --radius-md | rounded-md on wrapper button | PASS |
| Emerald attach/progress | text-emerald-400 hover, emerald-500 progress bar | PASS |
| Danger error tile | border-danger/60, bg-danger/10 | PASS |
| Lightbox: --shadow-pop | shadow-[0_8px_40px_rgba(0,0,0,0.5)] (commented) | PASS (matches --shadow-pop formula) |
| Phosphor: paperclip/x/file/file-pdf/arrows-out | ph-paperclip, ph-x, ph-file-pdf, ph-arrows-out, ph-download-simple | PASS |
| No invented hex | Verified: all colors are Tailwind-aliased study-/zinc-/emerald-/red-/amber- tokens | PASS |

---

## Findings summary

### Confirmed PASS items (attachment surfaces)
- All attachment-surface contrast ratios pass 4.5:1 for text and 3:1 for icons (see table above).
- Staged tile tokens exactly match brief §4 spec.
- File chip tokens exactly match brief §4 spec.
- Phosphor icon set is internally consistent with no invented icons.
- Tombstone row carries no attachment block — correct.
- Image preview is properly constrained: max-h-[320px] + max-w-full + object-cover on a block-level button wrapper with rounded-md. It does NOT blow out the row.
- All focus-visible rings use emerald-400/70 opacity ring or danger/60 for destructive — matching --glow-focus.
- Aria attributes on attach button, remove buttons, image preview button, and lightbox close are correct.
- prefers-reduced-motion is handled globally for all animations (line 61-65).
- The attachment surfaces are fully additive: the existing 9-row message list, thread panel, member list, and composer structure are all intact.

### Concerns requiring action before APPROVE

C-1 (MUST FIX — accessibility, pre-existing): zinc-500 text fails 4.5:1 in three locations:
  - Sidebar category "Coursework" header: zinc-500 on study-900 = 3.87:1 (ref DESIGN-PRINCIPLES rule 1)
  - Right-sidebar "Members", "Online — 2", "Offline — 3" headings: zinc-500 on study-900/800 = 3.87:1 / 3.52:1
  - Composer footer hint text (line 564): zinc-500 on study-950 = 4.09:1
  Fix: bump these three text instances to zinc-400 (computes 6.63–7.72:1 on these backgrounds).

C-2 (SHOULD FIX — completeness): Upload-progress, error, and lightbox states are commented out. Success criteria (composer-attachment brief §9 item 3; message-row-attachment brief §9 items 1 and 4) require these to be visible in the design file. Uncomment and render all three.

C-3 (SHOULD FIX — accessibility): Broken-image fallback chip is not present as a rendered demo row. Message-row-attachment brief §9 item 4 lists it as a success criterion. Add a row demonstrating the `onerror` / failed-load state that degrades to a file chip.

C-4 (MINOR — accessibility consistency): Staged-tile remove buttons use `focus:ring-2` instead of `focus-visible:ring-2`. Align to focus-visible throughout to prevent focus rings appearing on mouse click.

C-5 (MINOR — implementation annotation): Lightbox focus-trap and Esc handling have no script. Annotate in the HTML (comment block) or add a minimal JS stub so the handoff is complete. The close button structure is correct; the trap just needs a specification note.

---

## Verdict

**REVISE**

The attachment surfaces are architecturally sound, token-compliant, and well-structured. The image preview is correctly constrained. All attachment-specific contrast ratios pass. The overall visual quality is strong.

The REVISE verdict is driven by two blocking items: (C-1) three pre-existing zinc-500 contrast failures that this review must surface per DESIGN-PRINCIPLES rule 1 and which must be corrected in this file, and (C-2/C-3) two success-criteria items from the briefs (upload/error/lightbox states visible; broken-image fallback) that are absent from the rendered output. These are mechanical fixes — no design concept changes are required. Once C-1 through C-3 are resolved (plus C-4/C-5 as accompanying cleanup), the file should be ready for APPROVE on the next pass.
