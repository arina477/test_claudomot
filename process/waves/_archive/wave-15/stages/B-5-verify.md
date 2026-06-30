# Wave 15 — B-5 Verify
```yaml
lint_passed: true
unit_tests_passed: true
build_passed: true
dev_smoke_passed: deferred-to-CI-boot-probe + C-2 live
flakes_documented: []
```
- Lint: 0 errors across all mention surfaces (after fixes). Note: biome.json gained `useSemanticElements: off` (rule false-positives on valid ARIA combobox listbox/option; can't suppress inline in biome 1.9.4) — FLAG B-6.
- Build: all packages SUCCESS. Tests: 37 shared + 280 api + 135 web = 452 pass.
- B-5 fix-forward cycles (routed as B-defects, re-verified):
  1. B-4 username drift (autocomplete handle vs resolver users.username) — threaded username through ServerMember+endpoint+autocomplete; chain closes.
  2. autocomplete combobox ARIA (aria-activedescendant moved to focusable textarea, role=combobox); useCallback dep; format.
  3. mentions.ts assignment-in-while → matchAll; match[1]? guard.
  4. spec dead-scaffold removed.
- Dev-smoke: mentions realtime + my-mentions deferred to CI boot-probe + C-2 live (consistent with realtime waves).
