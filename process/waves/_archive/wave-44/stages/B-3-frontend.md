# Wave 44 — B-3 Frontend
react-specialist (commits 77e0b8c, 6be7460, 9069981):
- **8e54799a:** 1024 responsive — useIsNarrow() (matchMedia ≤1024) renders SessionDetail as a scrim overlay (DS §9) at ≤1024 (backdrop dismiss), inline bento at ≥1025 (unchanged). Esc focus-restore — closeForm() rAF-focuses formTriggerRef, set by all 4 triggers (header/empty-state/row-edit/detail-edit) → WCAG 2.4.3. Detail-panel refresh — handleFormSuccess toggles selectedSessionId to force getSession re-fetch. CTA "Save" (both modes) per design.
- **683fec9b:** return-dialog focus-ring rgba(16,185,129,0.4) (spec alpha); ReturnDialog studentUsername prop → displayName||username||'student' (no blank slot); positioning-comment (modal = accepted equivalent).
- **8828484f:** MemberItem right-slot pr-2 (8px DS §3 gutter) for the muted indicator.
- web typecheck + biome clean. No invented hex. Deviations: none.
```yaml
skipped: false
specialists_spawned: [react-specialist]
files_implemented: [apps/web/src/shell/ClassCalendar.tsx, apps/web/src/shell/SessionForm.tsx, apps/web/src/shell/SessionDetail.tsx, apps/web/src/shell/SubmissionsRoster.tsx, apps/web/src/shell/MemberListPanel.tsx]
designs_consumed: [design/class-scheduling.html, design/assignment-submissions.html, design/member-moderation.html]
deviations: []
simplify_applied: true
```
