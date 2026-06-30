# D-3 Adopted — wave-19 (M3 attachments UI)
- **Adopted:** design/staging/server-channel-view.html → design/server-channel-view.html (canonical) — composer attachment (paperclip + staged strip + uploading/error states) + message-row attachment render (constrained image preview + click-to-full lightbox + file chip + broken-image fallback). All 9 message rows + member-list + thread panel + composer preserved.
- **Verdicts:** ui-designer APPROVE (iter2, after C-1..C-5 fix), accessibility-tester APPROVE (contrast 7.8-17.9:1), head-designer APPROVED (token discipline clean, no new token, structural integrity intact).
- **Refine cycles:** 1 (C-1 zinc-500→zinc-400 rule-1 ×3 pre-existing; C-2 states live; C-3 broken-image chip; C-4 focus-visible; C-5 lightbox annotation).
## B-block adoption carries (JS — staging is the visual contract; verify at ui-comprehensive-tester):
1. Hidden file-input binding (picker).
2. Upload progress wiring (emerald progress bar reflects real upload %).
3. Lightbox: focus-trap on open + Esc-close + click-backdrop + focus-restore to originating image button; pass the image alt to the dialog aria-label.
4. img onerror → swap to the fallback file-chip.
5. aria-live on the staged-preview strip (announce add/remove).
6. file-chip download-intent aria-label + retry-button aria-label.
7. Preserve ≤10MB + content-type validation contract (client mirror of server).
## L-2 candidate (flag, not promoted): zinc-500-on-dark muted text recurring rule-1 failure (3 more fixed this wave) → DESIGN-PRINCIPLES authoring-time default (zinc-400 for muted text on dark).
