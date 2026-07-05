# D-3 Design Review — Focus Room Panel (Iteration 1 Re-Review)
**Reviewer role:** ui-designer / plan-design-review  
**Artifact:** `design/staging/focus-room-panel.html` (a11y-refined iteration 1)  
**Brief:** `process/waves/wave-52/stages/D-1-brief/focus-room-panel-brief.md`  
**Reference surface:** `design/study-timer.html` + `design/DESIGN-SYSTEM.md`  
**Prior verdict:** APPROVE (iteration 0)  
**Scope of this re-review:** Confirm 3 a11y-only fixes landed without visual/token regression. Re-score all dimensions.

---

## VERDICT: APPROVE

All three a11y fixes are confirmed present. No regression against iteration 0 design. No new visual or token issue introduced. All six brief §9 success criteria continue to pass.

---

## A11y fix verification (the three mandated changes)

### Fix 1 — Roster `aria-live` + `aria-label`
**Status: CONFIRMED**

The roster container (line 329) now carries `role="list" aria-live="polite" aria-label="Active roster"`. This is additive: it supplements the pre-existing `aria-live="polite"` on the "N focusing now" span (line 314), which was already present in iteration 0. The two live regions are non-competing — the span announces count changes as a short string; the list container announces structural membership changes. No visual change; no token deviation.

### Fix 2 — `.room-card:focus-visible` ring via `--glow-focus`
**Status: CONFIRMED**

Lines 186-189 in the `<style>` block:
```css
.room-card:focus-visible {
  outline: none;
  box-shadow: var(--glow-focus);
}
```
`--glow-focus` is `0 0 0 2px rgba(16,185,129,0.4)` — an exact token match per DESIGN-SYSTEM §5. The pattern is identical to `.btn:focus-visible` (lines 102-104) and `.input-base:focus` (line 159). No invented value. The visual appearance of keyboard-focused room cards is now consistent with all other interactive surfaces in the panel and with the study-timer widget's own button focus treatment.

### Fix 3 — Roster `role=list/listitem` + `aria-current` for current user
**Status: CONFIRMED**

The roster wrapper at line 329 carries `role="list"`. All six child items (lines 332, 340, 348, 356, 364, 372) carry `role="listitem"`. The current user's item (line 332) additionally carries `aria-current="true"` and `aria-label="Sarah (You)"` — this is the correct pattern: `aria-current` signals the user's own entry; the label makes the "(You)" designation screen-reader-legible rather than only visual (the name "Sarah" plus visual emerald border). Peer items carry no `aria-current`, which is correct. The overflow "+3" item (line 372) carries `role="listitem"` without a name label — acceptable for a count affordance with no interactive function; it is `cursor-default` and not keyboard-focusable.

No visual change resulted from any of these three attribute additions.

---

## Dimension re-scores

### 1. Visual hierarchy — 9/10
Unchanged from iteration 0. The three a11y changes are attribute-only; no layout, sizing, or color change. The section-01 contextual integration frame continues to demonstrate clean panel/timer co-existence at `--surface-800` on `--surface-950`. Room name weight hierarchy (`font-semibold text-base` heading, `text-xs` count) is intact.

The iteration-0 annotation stands: the `animate-presence-ring` on the joined-state header icon is slightly more active than the study-timer's static emerald avatar borders. Not a blocking concern; noted for implementer awareness.

### 2. Spacing rhythm — 8/10
Unchanged from iteration 0. The a11y additions carry no layout effect. Panel padding (`p-4` to `p-6`), card gaps (`gap-3`), and roster grid gaps (`gap-4`) remain consistent with study-timer.html and DESIGN-SYSTEM §3.

The iteration-0 note stands: the `mt-8` staging-document divider above the "Open Focus Rooms" heading is a staging-layout artefact, not a component spacing choice — implementer should use the server-view shell gap token for the panel-to-panel interval.

### 3. Brand coherence / token fidelity — 10/10
Unchanged from iteration 0. All `:root` hex values match DESIGN-SYSTEM §1 exactly. No new hex values were introduced by the a11y refinement. `.btn`, `.btn-primary`, `.btn-ghost`, `.btn-secondary`, `.btn-sm`, `.btn-md`, `.input-base`, `.glass-panel`, `--glow-focus` are all verbatim copies of study-timer.html primitives. The `--glow-focus` token used in fix 2 was already present in the file; the fix adds a new CSS rule consuming it — no new token invented.

The pre-existing `.btn` transition syntax quirk (`transition: transition-colors 150ms ease`) is still present and remains a carry-forward from the study-timer reference — not an iteration-1 regression, not an invented deviation.

### 4. State completeness — 10/10
Unchanged from iteration 0. All six brief §3 states (empty lobby, open-rooms list, creating inline, joined with roster + leave, loading skeleton, error/room-vanished) are present and visually distinct. The a11y changes touch only the joined-state roster; no other state panel was modified. The error state's `role="alert"` (line 557) was already correct in iteration 0 and remains unchanged.

| State | Section | Verdict |
|---|---|---|
| Empty | 04 / Empty Lobby | Pass |
| Open-rooms list (not joined) | 02 / Open Rooms List | Pass |
| Creating inline | 03 / Creating Inline | Pass |
| Joined (roster + leave) | 01 / Contextual Integration | Pass |
| Loading | 06 / Loading Skeleton | Pass |
| Error / room-vanished | 07 / Error Recovery | Pass |

### 5. Body-doubling clarity — 9/10
Unchanged from iteration 0. The three structural differentiators (48px named-avatar roster vs 32px overlapping timer cluster; "N focusing now" vs "N studying / Live sync"; explicit Leave control) are intact. The `aria-current` addition on the current user's roster item strengthens the "I am present in this room" signal for screen-reader users without changing the visual model for sighted users.

The iteration-0 annotation stands: a brief "Focus Room" secondary label in the joined panel header above the room name would make the panel identity explicit for first-time users. Still not a reject trigger.

### 6. Responsive — 9/10
Unchanged from iteration 0. Section 05 / Compact Active (the `<1024px` collapsed bar) is unmodified. `prefers-reduced-motion` coverage is unchanged and comprehensive: covers `skeleton-layer`, `animate-presence-ring`, all stagger classes, and the global duration override — matching study-timer.html exactly.

---

## Reject/revise trigger check

| Trigger | Status |
|---|---|
| Invented hex outside DESIGN-SYSTEM §1 | Clear — no new hex introduced in iteration 1 |
| Voice/video UI (brief §10) | Clear — no mic, camera, LiveKit, or screen-share controls |
| Persisted-history / scheduling / moderation UI (§10) | Clear — none present |
| Panel crowding study-timer/channel | Clear — section 01 co-existence unchanged |
| New component class beyond room-card | Clear — `.roster-grid` is a layout utility (unchanged from iter 0); no new classes added in iter 1 |
| Missing states or illegible states | Clear — all six states present and distinct |
| A11y regression introduced by the refine | Clear — three fixes are additive attribute changes only; no existing a11y annotation was removed or weakened |

---

## Implementation carry-forward notes (unchanged from iteration 0, still applicable)

1. `.btn` base has `transition: transition-colors 150ms ease` — verbatim study-timer quirk. Carry forward as-is until the design system corrects the reference.
2. `aria-live="polite"` on "N focusing now" span (line 314) must be updated in-place on count change (not re-mounted) so the live region fires correctly. The new `aria-live="polite"` on the roster list container (line 329) similarly requires in-place DOM mutation for membership changes — screen readers will announce additions/removals automatically if the list is mutated rather than replaced.
3. `role="button" tabindex="0"` on room cards requires Enter and Space key handlers. The vanilla JS stub (line 577) demonstrates the pattern; the React implementation must replicate it.
4. External Unsplash image URLs are placeholder-only. Replace with the DESIGN-SYSTEM `Avatar` primitive (initials fallback on `--surface-600`) in production.
5. The `aria-current="true"` on the current user's roster item (line 332) should be computed from the authenticated user's ID match against the roster array — not hardcoded. The design pattern is correct; the implementation must derive it dynamically.
