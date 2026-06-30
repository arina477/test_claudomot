# D-3 Phase 1 Reconciliation — wave-15 (mention surfaces)
- Reviewer A (ui-designer, /plan-design-review sub): **REVISE** — P1 autocomplete empty-state commented out (render it); P1 autocomplete loading state absent (add shimmer/spinner row); P2 unread badge clears-on-view not demonstrated (add 2nd channel row w/o badge = post-view); P3 msg-row class missing on row 2 (self-mention) → row-actions unreachable. ALL contrast PASSES (no rule-1 fail); 9 articles preserved.
- Reviewer B (accessibility-tester, /ui-ux-pro-max sub): **APPROVE** — all contrast calc ≥4.5:1 (self-pill 13.44:1, other 44.55:1, badge 119:1, autocomplete 44.55:1); WCAG AA compliant; 1 minor non-blocking (aria-activedescendant on listbox → B-block).
- **Matrix: REVISE + APPROVE → aggregate A's concerns → D-2 refine (iteration 1).**
- iter1 review: A APPROVE + B REVISE (NEW: iter1 demo states introduced muted-text-below-AA — empty-state zinc-600/500 2.8/1.9:1, skeleton study-700/80 1.4:1; rule-1 catch). → D-2 refine iter2.
- iter2: empty-state icon/text → zinc-400 (5.2:1); skeleton bars → study-600/70. Applied directly (deterministic reviewer-specified). → re-review.
