# D-1 Brief — Assignment submission lifecycle UI

## §1 What we need
The UI for the **collect/return** loop on an assignment: (a) a **student submit control** to submit work (a text note and/or a single optional file attachment) against an assignment and see their own submission + its returned-state; (b) an **educator submissions roster** (visible only to a holder of `manage_assignments`) listing who submitted, when, their text + attachment, and returned-vs-not; (c) an **educator return control** to mark a submission returned with an optional free-text comment. **NO grading** — no score/grade field anywhere (an acknowledgement comment only).

## §2 Where it lives
- **Assignment detail** within the existing Assignments panel (`design/assignments-panel.html`, route `/servers/:id/assignments`, page-14). Each assignment expands/opens to a detail with:
  - **Student view:** a submit affordance (text area + optional attachment picker) + the student's own submission state (submitted-at, attachment chip, and a returned badge + educator comment once returned).
  - **Educator view (manage_assignments only):** a **Submissions** section — a roster of submission rows (submitter avatar+name, submitted-at, text preview, attachment chip, returned/not badge) each with a **Return** action opening a small comment popover.
- No new route — an in-panel detail/section extension of the shipped assignments panel.

## §3 Audience + states
Audience: students (P3 members) submit; educators/facilitators (P3, `manage_assignments`) collect + return. Desktop-first. States to render:
- **Student — not submitted** (submit form: text area + "Attach file" + Submit button).
- **Student — submitting** (button spinner / disabled).
- **Student — submitted, not returned** (own submission card: text, attachment chip, "Submitted 2h ago"; editable → resubmit).
- **Student — returned** (a calm returned badge + the educator's comment shown; resubmit still possible, which clears the returned state).
- **Educator — roster loaded** (list of submission rows).
- **Educator — roster empty** ("No submissions yet" empty state).
- **Educator — return popover open** (optional comment textarea + Return button).
- **Loading** (roster skeleton / spinner).
- **Error** (submit/return failed, or over-permission 403 → calm inline message; no raw failure).
- **Empty/N-A:** a member without `manage_assignments` never sees the Submissions roster or Return controls (only their own submission).

## §4 DESIGN-SYSTEM.md references (≥6 primitives)
1. **`--accent-emerald` / `--success`** — the "returned" acknowledgement badge (a positive, calm completion tone; consistent with done-state greens), NOT a grade.
2. **`--accent-amber`** — a "not yet returned / awaiting review" subtle indicator on educator roster rows (warning-tone, matches due-soon amber).
3. **Button** primitive — `primary` for Submit / Return confirm (sizes sm 28px / md), `ghost` for "Attach file" + the roster Return trigger; focus-visible ring, 44px touch target.
4. **Select / menu + the shipped `role="menu"` popover pattern** (MessageList AddReactionPopover / member-moderation) — the Return-comment popover reuses this popover system (Esc close+refocus, outside-click, keyboard).
5. **Iconography — Phosphor Icons** (16–20px, stroke `--text-secondary`): `paperclip` (attachment), `check-circle` (returned), `clock` (submitted-at / awaiting), `arrow-u-turn-left` or `paper-plane-tilt` (return/submit), `file` (attachment chip).
6. **Surfaces + radius:** `--surface-800`/`--surface-900` fills for the submission cards + roster rows (match the shipped assignment row + popover `#27272a`); **radius-md** on cards/popover; **`--glow-focus`** focus ring.
7. **Typography:** `--text-primary` (name/text), `--text-secondary` (metadata), `--text-muted` (empty state); **Motion** — popover + submit-state transitions matching existing menus/cards.

## §5 Responsive contract
- Desktop (≥1024): assignments panel visible; assignment detail shows submit + (for educators) the roster inline; return popover anchored to the row, in-viewport (flip up near bottom).
- <1024: the assignments panel collapses per the shipped panel responsive behaviour; submission UI is desktop-first this slice (matches shipped panel). No separate mobile design.

## §6 Interaction patterns
- **Submit:** student types text and/or clicks "Attach file" (single file) → Submit → own submission card renders; resubmit edits in place (the same control repopulated). Over-size/wrong-type attachment → inline error, no layout break.
- **Roster (educator):** the assignment detail shows a "Submissions (N)" section; rows list submitters; empty → calm empty state.
- **Return:** educator clicks Return on a row → a small `role=menu`/popover with an optional comment textarea + Return button → on confirm the row flips to a returned badge; Esc/outside-click closes, focus returns to trigger (reuse shipped popover a11y).
- **Returned visibility:** the submitting student sees the returned badge + comment on their own submission card.
- A non-educator sees only their own submission (never the roster or Return controls).

## §7 Data shape
- Submission (per student, on the Assignment DTO as `mySubmission`): `{ userId, assignmentId, text: string|null, attachment: {url, filename, contentType}|null, submittedAt, returnedAt: string|null, organizerComment: string|null }`.
- Roster row (educator): submission + `submitter { displayName, username, avatarUrl }` + resolved attachment URL.
- Submit action: `POST /assignments/:id/submit { text, attachment? }`; presign via member-gated `POST /servers/:serverId/assignments/submissions/presign`. Return: `POST /assignments/:id/submissions/:submissionId/return { comment? }`. Viewer's `manage_assignments` gates the roster + Return controls.

## §8 Prior art (2–3 mockups to match)
- **`design/assignments-panel.html`** — the assignments panel (assignment rows: title, due, done-toggle). The submit control + roster + return extend THIS panel; match its row layout, spacing, due/status treatment.
- **`design/notifications-center.html`** / the shipped `MessageList` reaction popover — the `role="menu"` popover pattern (surface `#27272a`, radius, shadow) the Return-comment popover reuses.
- **`design/member-moderation.html`** (wave-41) — the calm, academic moderation affordance + amber/emerald state-badge treatment to echo for returned/awaiting states.

## §9 Success criteria (≥5 checkboxes)
- [ ] Student submit control (text + single optional attachment) renders on the assignment detail; own submission card shows submitted-at + attachment chip + (when returned) an emerald returned badge + the educator comment.
- [ ] Educator Submissions roster renders ONLY for a viewer with `manage_assignments`; absent for other members; empty state is calm ("No submissions yet").
- [ ] The Return control opens a `role=menu` popover with an optional comment textarea, reuses the shipped popover a11y (Enter/Space open, Esc close+refocus, outside-click), and flips the row to a returned badge on confirm.
- [ ] Returned = a calm emerald acknowledgement badge (NOT a grade); awaiting-review = subtle amber; no numeric score/grade field appears anywhere.
- [ ] Attachment uses a Phosphor `paperclip`/`file` chip; over-size/wrong-type + 403 over-permission errors surface calmly inline (no raw failure, no layout break); dark-only, WCAG-AA contrast.
- [ ] Fully in-viewport at 1024/1280/1440; the assignments-panel <1024 collapse behaviour is unchanged.

## §10 Non-goals
- NO grading / score / rubric / gradebook / LMS sync (milestone scope — collect/return only).
- NO multi-file submissions (single optional attachment this slice), NO free-text return-notification push (deferred to a later M8 notifications slice).
- NO mobile-specific design (desktop-first; panel collapses <1024 per shipped behaviour).
- NO changes to the private todo/done self-toggle (`assignment_status`) — orthogonal.

## §11 Reviewer briefing
Judge against: (a) does the submission lifecycle read as calm/academic (not a loud LMS gradebook)? (b) does it faithfully reuse the shipped assignment-panel row + `role=menu` popover + DESIGN-SYSTEM tokens (no token fragmentation, no new popover system)? (c) is the returned/awaiting state clear + accessible (emerald/amber, glyph + label, AA contrast) and unmistakably NOT a grade? (d) is the educator-only gating visually obvious (non-educators never see roster/return)? (e) desktop-first, in-viewport, dark-only.

```yaml
mask_mode_signoff: PASS
signoff_note: "One coherent gap (assignment submission lifecycle UI: submit + roster + return). Prior art assignments-panel.html has assignment rows but no submission-lifecycle affordances. Submit control + returned-state display + educator roster/return all briefed together as one surface."
```
