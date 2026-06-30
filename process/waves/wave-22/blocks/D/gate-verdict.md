# D-3 Review & Adopt — Gate Verdict (wave-22, M5 assignments UI)

**Stage:** D-3 (PARTIAL — D-1 brief + D-2 variants SKIP; design already adopted)
**Canonical design:** `design/assignments-panel.html` (build-readiness review + B-4 primitive extraction)
**Gating head:** head-designer
**Verdict source:** accessibility-tester (fresh spawn, contrast by calculation) + head-designer build-readiness review

---

## VERDICT: APPROVED — build-ready for B-block

Two real dark-theme contrast gaps were found IN the canonical design and **remediated in `design/assignments-panel.html` before this verdict** (D-3 contract: fix the canonical token first, never pass the gap to B-4). With those fixes the adopted design is build-ready and the assignment-card primitive is cleanly extractable. No fresh design required.

**Remediation applied to the canonical file (this stage):**
1. `--text-muted` raised `rgba(255,255,255,0.40)` → `rgba(255,255,255,0.55)` — 0.40 computed **4.17:1** (FAIL) over both surface-800 and surface-900; 0.55 computes ~6.1–6.4:1 (PASS). This is exactly DESIGN-PRINCIPLES rule 1 (alpha-muted text on near-black computing < AA).
2. Added `--danger-text: #f87171` for overdue-chip TEXT on dark tint — base `--danger #ef4444` computed **3.93:1** (FAIL) over its own 10% tint; `#f87171` computes **6.30:1** (PASS). `--danger` retained for fill/border/left-edge bar. Overdue chip span switched to `text-[var(--danger-text)]`.

---

## Build-readiness checklist

| # | Check | Result |
|---|-------|--------|
| 1 | assignment-card primitive present + extractable (title, due chip, overdue chip, attachment, per-member toggle) | PASS — all pieces render as reusable units across 4 card variants |
| 2 | Chip logic legible + states distinct + thresholds inferable | PASS — amber due-soon vs red overdue visually distinct; left-edge accent bar reinforces; tokens `--accent-amber` / `--danger` |
| 3 | Organizer create/edit FORM build-ready | PARTIAL — see GAP-FORM below (modal is read/detail only; create form is a non-blocking B-4 build item, design intent is unambiguous) |
| 4 | States: empty / per-member toggle / due-sorted list | PARTIAL — toggle + done-state + sorted list present; explicit "No assignments yet" empty state NOT rendered (see GAP-EMPTY, non-blocking) |
| 5 | DESIGN-PRINCIPLES rule 1 contrast (muted/chip ≥4.5:1 by calculation) | PASS after remediation (was 2 FAILs) |
| 6 | Token discipline (no invented hex, Phosphor consistent, no neon) | PASS with note — see TOKEN-NOTE |
| 7 | Responsive (panel adapts ≤1024) | PASS — `lg:` breakpoint collapses channel sidebar; cards reflow `flex-col md:flex-row` |

**Verdict basis:** the two contrast FAILs were the only blocking design gaps; both fixed in canonical source. GAP-FORM and GAP-EMPTY are *build tasks with unambiguous design intent already present in the system*, not design gaps — they do not require a new D-block and are folded into the B-4 contract below.

---

## Contrast audit (post-remediation, by calculation)

| Element | fg (composited) | bg | ratio | AA | result |
|---------|-----------------|-----|-------|----|--------|
| text-secondary / surface-800 (card desc, labels) | #a4a4a5 | #1c1c1f | 7.13:1 | 4.5 | PASS |
| text-muted 0.55 / surface-800 (metadata) | ~#999 | #1c1c1f | ~6.1:1 | 4.5 | PASS (was 4.17 FAIL) |
| text-muted 0.55 / surface-900 (sidebar headers) | ~#999 | #121214 | ~6.4:1 | 4.5 | PASS (was 4.17 FAIL) |
| accent-amber / amber-10 tint (DUE-SOON chip) | #f59e0b | #321d1d | 7.75:1 | 4.5 | PASS |
| danger-text #f87171 / danger-10 tint (OVERDUE chip) | #f87171 | #312223 | 6.30:1 | 4.5 | PASS (was 3.93 FAIL on #ef4444) |
| accent-emerald / emerald-10 (links, Completed) | #10b981 | #1b2c29 | 6.92:1 | 4.5 | PASS |
| text-secondary / surface-900 (channel names) | #a4a4a5 | #121214 | 7.51:1 | 4.5 | PASS |

All in-scope dark-theme text now clears WCAG AA 4.5:1.

---

## B-4 ADOPTION CONTRACT (AssignmentCard primitive)

B-4 implements `AssignmentCard` from the adopted canonical design. Match these exactly.

### Card container
- Element: `<article>`, classes `glass-panel rounded-[var(--radius-lg)] p-5 flex flex-col md:flex-row gap-5 hover-lift`.
- `.glass-panel` = `bg var(--surface-800)` + `1px var(--border-hairline)` + `shadow-sm`. Radius `--radius-lg` (10px).
- Status as left-edge accent bar via `border-l-2`: overdue → `border-l-[var(--danger)]`; due-soon → `border-l-[var(--accent-amber)]`; normal/done → none.
- Done state: add class `card-done` → `bg var(--accent-emerald-dim)` + `border rgba(16,185,129,0.2)`; title gets `line-through` + `text-secondary`.

### Status CHIP (the academic differentiator — drive off due-date vs now)
Three mutually-exclusive states, computed from `dueAt` relative to `now`:
- **OVERDUE** (`dueAt < now`): `bg-[var(--danger)]/10 text-[var(--danger-text)] border border-[var(--danger)]/20`, uppercase 11px bold. Copy: `Overdue: <relative>`. **Use `--danger-text` (#f87171) for the TEXT — NOT `--danger`** (AA).
- **DUE-SOON** (`now <= dueAt < now + 48h`): `bg-[var(--accent-amber)]/10 text-[var(--accent-amber)] border border-[var(--accent-amber)]/20`, leading `ph ph-clock` icon. Copy: `Due <when>`.
- **NORMAL** (`dueAt >= now + 48h`): no chip; render plain `Due: <date>` in `text-muted` with the date span in `text-primary`.

**Chip thresholds (B-4 must encode):**
- `overdue`  := `dueAt < now`
- `dueSoon`  := `now <= dueAt < now + 48h`  (amber window = 48 hours; inferred from "Due Tomorrow, 11:59 PM" amber card vs "Fri, Jun 28" plain card)
- `normal`   := `dueAt >= now + 48h`
- Done overrides chip display (completed cards suppress urgency chip; show muted due line at 70% opacity).

### Per-member to-do/done TOGGLE
- Real `<input type="checkbox" class="status-toggle">` with an associated `<label for=...>` ("Mark as Done" / "Completed"). Keep it a real checkbox (a11y — DESIGN-SYSTEM AssignmentCard: "real checkbox/switch with label").
- Wrapper stops propagation: `onClick` wrapper must `event.stopPropagation()` so toggling does not open the detail modal.
- Checked visual (from `.status-toggle:checked`): emerald fill + emerald border + inset emerald glow + check-pop animation; label flips to emerald `ph-fill ph-check-circle` + "Completed", wrapper border/bg → emerald.
- This is PER-MEMBER (personal state), distinct from the aggregate "8 of 24 people marked this done" shown in the detail modal footer — B-4 keeps these two data sources separate.

### Attachment (optional)
- Inline card badge: `<i class="ph ph-paperclip"></i> N Files`, in `bg-surface-900 px-2 py-1 rounded border border-hairline`. Render only when `attachmentCount > 0`.
- Detail-modal attachment tiles: file-type icon (pdf → `ph-file-pdf` danger-tint, doc → `ph-file-doc` blue-tint) + name + size; name `truncate`, size in `text-muted` (now AA).

### Sorting / section
- List sorted by due date ascending (DESIGN-SYSTEM: "Sort by due date"). Section header "Upcoming & Recent" + "Sorted by Due Date" caption (`text-muted`).

### GAP-FORM — organizer create/edit form (B-4 build item, design intent fixed)
Canonical file ships the DETAIL/view modal, not the create form. B-4 builds the create/edit modal reusing the existing Modal primitive + Form-field primitives (DESIGN-SYSTEM §8). Fields per spec: **title** (input), **description** (textarea/markdown body), **due date** (datetime input), **optional attachment** (file upload). Match modal chrome from the existing `#assignment-modal` (surface-900, `--radius-lg`, header/body/footer, primary action right, Esc-close, focus-trap, `role="dialog"` `aria-modal`). Organizer-only visibility gate. No new design needed — this is the Modal + Input/Textarea/Select + Form-field-group primitives already in the system.

### GAP-EMPTY — empty state (B-4 build item, design intent fixed)
Canonical file shows a "you're all caught up" END marker but NOT the zero-assignments empty state. B-4 builds it from the Empty-state primitive (DESIGN-SYSTEM §8): centered Phosphor clipboard icon + headline **"No assignments yet."** + one-line + (organizer only) primary "New Assignment" CTA. Token-clean, no new design.

### Tokens / classes B-4 MUST match (no invented hex)
`--surface-950/900/800/700/600/500`, `--border-hairline`, `--border-hover`, `--text-primary/secondary/muted` (muted now **0.55**), `--accent-emerald`, `--accent-emerald-dim`, `--accent-amber`, `--danger`, **`--danger-text` (#f87171, NEW — see promotion note)**, `--radius-md/lg/xl`. Icons: Phosphor only. Font: Geist (the `studyhall-geist-fix` block overrides the mock's Satoshi — production uses Geist per DESIGN-SYSTEM §2).

### TOKEN-NOTE — promote `--danger-text` into DESIGN-SYSTEM source
`--danger-text: #f87171` is a genuinely-new semantic token introduced by this remediation (on-dark-tint danger text that clears AA where `--danger #ef4444` fails at 3.93:1). Per D-3 ("any genuinely new token is promoted into the system source first"), **B-block must add `--danger-text #f87171` to `design/DESIGN-SYSTEM.md` §1 (Accent + semantic) with mapping `--danger-on-tint → --danger-text`** before/as it implements the chip. It is not a one-off; the same need exists anywhere danger text sits on a danger tint. The blue file-icon tint (`text-blue-400`) in the detail modal is the only other off-palette color — acceptable as a neutral file-type affordance, but B-4 should prefer a Phosphor file glyph in `text-secondary` if avoiding the blue keeps the palette tighter; non-blocking.

---

```yaml
head_signoff:
  verdict: APPROVED
  stage: D-3
  reviewers:
    accessibility-tester: contrast-by-calculation (7 element/bg pairs); 2 FAIL pre-fix, 0 FAIL post-fix
  failed_checks: []        # 2 contrast failures found and remediated IN canonical source this stage
  remediated_in_canonical:
    - "design/assignments-panel.html: --text-muted 0.40 -> 0.55 (was 4.17:1)"
    - "design/assignments-panel.html: added --danger-text #f87171, overdue chip text uses it (was 3.93:1)"
  promote_to_system:
    - "design/DESIGN-SYSTEM.md: add --danger-text #f87171 (--danger-on-tint) at B-block before chip impl"
  rationale: >
    Design already adopted; D-1/D-2 skipped. Build-readiness review found the assignment-card
    primitive (title/due-chip/overdue-chip/attachment/per-member-toggle) cleanly extractable and the
    create-form + empty-state derivable from existing system primitives with unambiguous intent. The
    only blocking issues were two dark-theme contrast FAILs in the canonical tokens (text-muted 4.17:1,
    overdue-chip danger 3.93:1) — both fixed in the canonical file per the D-3 fix-the-source rule, and
    re-verified ≥4.5:1 by calculation. With those fixes the adopted design is build-ready and B-4 has a
    defensible, token-clean primitive contract (chip thresholds: overdue <now, due-soon <48h).
  next_action: PROCEED_TO_B
```
