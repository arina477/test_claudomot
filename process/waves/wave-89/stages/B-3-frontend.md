# Wave 89 — B-3 Frontend
Specialist: react-specialist. File: `apps/web/src/pages/ProfilePage.tsx` (+74/-8).
- DRY `academicInvalid: {key,message}|null` derivation (priority order pronouns→bio→institution→program→academicYear); `academicClientError` (message) + `academicInvalidFieldKey` (key) both derived from it (cannot diverge).
- `academicFieldRefs` ref map on the 5 fields; `handleAcademicSave` on client error → `scrollIntoView({block:'center'})` + `.focus()` the invalid field's ref, then return; `aria-invalid` bound per field.
- Existing academicClientError role="alert" message intact. Only the academic form touched.
- typecheck + biome clean.

## ⚠️ REACHABILITY FINDING (routed to B-6 head-builder as the central gate question)
The academic Save button is `disabled={academicSaving || !!academicClientError}` (ProfilePage.tsx:1081). So while `academicClientError` is truthy: a user CANNOT click Save (disabled), and Enter-implicit-submission is blocked (a disabled default submit button suppresses HTML implicit submission; bio is a textarea where Enter inserts a newline). The failed-save early-return path that the new scroll+focus defends is therefore reachable in tests via `fireEvent.submit(form)` but NOT via normal user interaction. **The `aria-invalid` additions ARE live** (announced to SR users as fields go over-length, independent of submit), but the core scroll+focus-on-submit deliverable defends a likely-unreachable path. head-builder must adjudicate: accept as defensive-correctness + live-aria-invalid value, or REWORK/reframe (the stated user-facing goal — "pull the off-screen errored field into view" — isn't achieved if the user can't submit).
```yaml
skipped: false
files_implemented: [apps/web/src/pages/ProfilePage.tsx]
reachability_finding: "scroll+focus path gated behind a disabled submit button; live value is the aria-invalid additions; routed to B-6"
deviations: []
```
