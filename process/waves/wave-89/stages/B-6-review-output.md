# Wave 89 — B-6 /review output (Phase 2)
Scope: ProfilePage.tsx (+ test). Small frontend a11y diff; head-builder did a deep review incl. the reachability adjudication (2 attempts).
## Critical pass
- **No SQL / shell / LLM-trust / injection** surfaces (frontend a11y change; no raw HTML, no dangerouslySetInnerHTML, no eval).
- **Double-submit guard:** the Save button stays `disabled={academicSaving}` — still disabled DURING a save, so enabling it on client-error does NOT introduce a double-submit; the valid-path click still fires patchProfile once (head-builder verified patchProfile NOT called on the error path).
- **Conditional side effect:** the scroll+focus fires only inside the `academicInvalid` guard (error path); the valid path is unchanged. aria-invalid bound to per-field over-length state (correct).
- **Enum/value completeness:** the priority-ordered academicInvalid derivation covers all 5 client-validated fields (DRY with academicClientError — cannot diverge).
## Verdict: PASS — no critical/high. (One pre-existing study-timer web flake noted, passes on re-run, unrelated.)
