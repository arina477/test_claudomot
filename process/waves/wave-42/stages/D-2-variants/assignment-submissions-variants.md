# D-2 Variants — assignment-submissions

- **Staging file:** design/staging/assignment-submissions.html (aidesigner Recipe 1, single generation, 41KB).
- **Approach:** brief + DESIGN-SYSTEM.md inline → aidesigner generateDesign. Renders student submit control + own submission card (emerald Returned badge + comment), educator Submissions(N) roster with amber Awaiting / emerald Returned per-row badges + ghost Return button → role=menu comment popover, and a "No submissions yet" empty state. Reuses assignments-panel row language + notifications-center popover + member-moderation state badges.
- **aidesigner warnings:** none (HTTP 200).
- **Grading check:** design carries no grade/score/rubric affordance (return = acknowledgement comment only).
