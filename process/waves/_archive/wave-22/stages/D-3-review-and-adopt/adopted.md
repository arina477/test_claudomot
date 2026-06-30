# Wave 22 — D-3 (PARTIAL — design pre-adopted) build-readiness
- **design/assignments-panel.html** was already ADOPTED/canonical. D-1 brief + D-2 variants SKIPPED. D-3 = head-designer build-readiness review + B-4 primitive contract.
- **head-designer APPROVED (build-ready)** — fixed 2 RECURRING rule-1 contrast failures IN the canonical design (the fresh a11y audit found them): --text-muted 0.40→0.55 (was 4.17:1 → ~6.1:1; due-date/posted/category metadata), + new --danger-text #f87171 for the overdue-chip text (was --danger 3.93:1 on its tint → 6.30:1; --danger kept for fill/border). Amber due-soon (7.75:1) + emerald (6.92:1) already passed.
## B-4 adoption contract:
- assignment-card: <article>.glass-panel (surface-800, radius-lg, hairline); status = border-l-2 accent; card-done modifier.
- Chip thresholds (B-4 encodes): overdue = dueAt<now (--danger-text, ph-warning), dueSoon = now≤dueAt<now+48h (amber, ph-clock), normal = dueAt≥now+48h (no chip, muted "Due:"). DONE suppresses the urgency chip.
- Per-member toggle: real <input type=checkbox class=status-toggle> + <label>, wrapper stopPropagation (don't open modal), emerald-check on done. PERSONAL state (distinct from the modal's aggregate "N of M done").
- Attachment: inline ph-paperclip "N Files" badge when attachmentCount>0.
- GAP-FORM (non-blocking build): organizer create/edit modal from the existing Modal + Form-field primitives (title/desc/due/optional-attach); no new D-block.
- GAP-EMPTY (non-blocking): "No assignments yet." from the Empty-state primitive.
## B-block REQUIRED: promote --danger-text #f87171 to design/DESIGN-SYSTEM.md §1 (genuinely-new reusable semantic token).
## L-2 candidate (flag): the alpha-muted-text-on-dark rule-1 contrast failure RECURS (waves 18/19/21/22) — the design SOURCE (DESIGN-SYSTEM default muted token / aidesigner output) keeps emitting <4.5:1 muted tokens. DESIGN rule 1 covers "calculate"; consider a default-muted-token-value rule or aidesigner-prompt fix.
