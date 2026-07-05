# Wave 49 — T-block findings aggregate

Canonical input for V-2 triage. Each T-stage appends its findings with severity + evidence.

| # | Stage | Severity | Location | Description | Evidence |
|---|---|---|---|---|---|
| F-1 | T-5/T-6 | medium (non-blocking) | StudyTimerWidget.tsx:476 + globals.css:310-315 | `<1024px` slim-bar phase indicator never renders — inline `border` shorthand clobbers stylesheet `.timer-phase-work` border-left. Break/amber presumed same. One-line CSS fix. Core timer fully functional. | T-5-tester-2.md / T-6 (computed border-left=1px grey @800px despite phase class) |
| F-2 | T-8 | medium (non-blocking, pre-existing) | supertokens.config.ts:93 | anti-CSRF implicit not explicit (project-wide, NOT wave-introduced). Live behavior still blocks forged cookie-only POSTs (401). Hardening: `antiCsrf: VIA_TOKEN` + regression test. No IDOR/exploit. | T-8-tester-idor.md (forged POST → 401; antiCsrfToken:null) |
