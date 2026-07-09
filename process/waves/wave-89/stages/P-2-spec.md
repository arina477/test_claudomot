# Wave 89 — P-2 Spec (pointer)
**Source of truth:** tasks row 45f0a88d `.description`. wave_type single-spec · design_gap_flag false · UI wave.
## ACs (copy)
1. Failed academic-save (over-length field) → first invalid field (pronouns→bio→institution→program→academicYear) scrollIntoView + .focus() (was: silent early-return).
2. Focused element = actual first over-length field.
3. Valid submit unaffected.
4. Error message (role=alert) preserved; focused field gets aria-invalid.
5. Scope = academic form only (username already correct; others no blocking client-validation).
## Scope guard
Frontend-only (ProfilePage.tsx). Reuse existing aria-invalid/role=alert. No generalized abstraction, no aria-live summaries, no all-5-forms overhaul (ceo SCOPE-REDUCTION).
