# Design Brief — composer attachment (picker + staged preview)

## 1. What we need
On the message composer: an attach button (paperclip) that opens a file/image picker, and a staged-attachment preview strip above the input showing each selected file (image thumbnail / file chip) with a remove control + upload progress, before send.

## 2. Where it lives
design/server-channel-view.html — the COMPOSER (the recessed input at the foot of the message canvas). Additive: an attach affordance in the composer's action row + a staged-preview strip that appears above the textarea when files are selected.

## 3. States
- **idle** (no attachment, composer unchanged), **staged** (1-N preview tiles above input: image thumb or file chip + filename + size + remove ✕), **uploading** (per-tile progress bar/spinner), **error** (oversized/disallowed → inline red message on the tile + remove), **sending** (tiles dim).

## 4. DESIGN-SYSTEM.md references (≥6)
- `--surface-700`/`--surface-600` — staged tile background + hover.
- `--radius-md` — tile + thumbnail corners; `--radius-full` — remove ✕ button.
- `--text-secondary` (≥4.5:1) — filename + size metadata; `--text-primary` — none needed.
- `--accent-emerald` — upload-progress + the attach button hover/focus; `--danger` — oversized/error tile.
- Phosphor `ph-paperclip` (attach) + `ph-x` (remove) + a file-type glyph (`ph-file` / `ph-file-pdf`) consistent with the icon set.
- `--glow-focus` — emerald focus-visible on the attach button + remove.

## 5. Responsive
- Staged strip wraps tiles; ≤1024 tiles shrink; never pushes the input off-screen (strip scrolls if many).

## 6. Interaction
- Attach button (paperclip) in the composer action row → opens native picker (accept=images+allowed files). Selected files → staged tiles. Each tile: thumbnail (images) or icon+name+size (files), a remove ✕, and a progress indicator while uploading. Client-side ≤10MB + content-type guard → an over-limit/disallowed file shows an inline error tile (not staged for send). Send uploads then clears the strip.

## 7. Data shape
Client-staged File objects → presign/confirm → validated descriptors; no server data pre-send.

## 8. Prior art (match)
- MessageComposer recessed input + emerald-focus language (match).
- The thread-panel composer (wave-18) — same composer family.
- Reaction/mention affordance buttons — the attach button is a sibling action-row control.

## 9. Success criteria (≥5)
- [ ] Paperclip attach button in the composer action row; emerald focus-visible.
- [ ] Staged strip above input: image thumbnail / file chip + filename + size + remove ✕.
- [ ] Upload-progress state (emerald) + error state (danger, oversized/disallowed) per tile.
- [ ] Metadata text ≥4.5:1 (rule 1, calc); tokens only (no invented hex).
- [ ] Responsive (tiles wrap/shrink ≤1024; strip never hides the input).
- [ ] Phosphor paperclip/x/file glyphs consistent.

## 10. Non-goals
Drag-drop upload zone; multi-file grid galleries; paste-to-upload; image cropping/editing; reordering tiles.

## 11. Reviewer briefing
Verify the attach button reads as a composer action (not a send), the staged strip is clearly pre-send + removable, upload/error states legible, metadata ≥4.5:1, composer language matches the existing recessed-input family.

mask_mode_signoff: PASS
