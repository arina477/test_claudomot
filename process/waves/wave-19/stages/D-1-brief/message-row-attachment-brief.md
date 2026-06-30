# Design Brief — message-row attachment render

## 1. What we need
A message that carries attachment(s) renders them in the message row: an inline image preview (constrained, click → full-size) for images, and a file chip (icon + filename + human size, click to open/download) for non-image files. 0-N attachments render below the message body.

## 2. Where it lives
design/server-channel-view.html — the MESSAGE LIST rows (and, identically, thread-panel reply rows). Additive: an attachment block below the message body, above the reaction-pill row.

## 3. States
- **none** (no attachment, row unchanged), **image** (inline thumbnail preview, constrained max dimensions, click → full-size overlay/lightbox), **file** (chip: file glyph + filename + size, click → open url), **multiple** (0-N stack/wrap), **broken-image** (graceful fallback to a file chip if the image fails to load), **tombstone** (deleted message renders NO attachments).

## 4. DESIGN-SYSTEM.md references (≥6)
- `--surface-800`/`--surface-700` — file chip background + image-preview frame; hover `--surface-600`.
- `--radius-md` — image preview + chip corners.
- `--text-primary` — filename; `--text-secondary` (≥4.5:1) — size metadata.
- `--accent-emerald` — chip hover/focus + click affordance; `--glow-focus` focus-visible ring.
- Phosphor `ph-file` / `ph-file-pdf` / `ph-file-text` (file kind) + `ph-arrows-out` (full-size cue on image hover).
- `--shadow-pop` — the full-size image overlay/lightbox elevation.
- Constrained image: max-h (e.g. ~320px) + object-cover within `--radius-md`; preserve aspect.

## 5. Responsive
- Image preview max-width 100% of the row content column; ≤1024 shrinks. Lightbox full-viewport with a close ✕ + Esc. Chips wrap.

## 6. Interaction
- Image: inline constrained preview; hover shows a subtle full-size cue; click → full-size overlay (close ✕ + Esc + click-backdrop). File: chip click → open the url (new tab / download). Keyboard: preview/chip focus-visible + Enter activates.

## 7. Data shape
message.attachments AttachmentRef[] {id, filename, contentType, sizeBytes, url}; image vs file by contentType prefix `image/`.

## 8. Prior art (match)
- MessageList row treatment (avatar/name/body/timestamp/reaction-pills/tombstone) — attachment block sits below body, above reactions.
- The thread-panel reply rows reuse the same row → attachments render there too.
- ConnectionStateIndicator / chip family — the file chip is a sibling chip treatment.

## 9. Success criteria (≥5)
- [ ] Image attachment → inline constrained preview (max-h, aspect-preserved) + click-to-full overlay (✕/Esc/backdrop).
- [ ] File attachment → chip (file glyph + filename + human size) opening the url on click.
- [ ] 0-N render (stack/wrap); none → row unchanged; tombstone → no attachments.
- [ ] Broken-image graceful fallback to a chip.
- [ ] Size metadata ≥4.5:1 (rule 1, calc); tokens only; Phosphor file glyphs consistent.
- [ ] Preview/chip keyboard-operable (focus-visible + Enter); lightbox Esc-closable.

## 10. Non-goals
In-app PDF/doc render; image carousel/gallery; zoom/pan in the lightbox; video player; thumbnails-service/resizing.

## 11. Reviewer briefing
Verify image preview is constrained (doesn't blow out the row) + click-to-full works (overlay + Esc), file chip is distinct + downloadable, 0-N + tombstone-safe, size text ≥4.5:1, reuses the message-row family (also rendering in thread replies).

mask_mode_signoff: PASS
