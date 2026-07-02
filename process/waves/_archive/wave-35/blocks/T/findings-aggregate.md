# Wave 35 — T-block findings aggregate

- **[T-2/T-3/T-4 · MEDIUM · coverage-gap]** No dedicated automated tests added for the new privacy surface (privacy.service/account-data.service/privacy.controller, roster visibility filter in servers.service, Sentry beforeSend). CI's 326 passing tests are pre-existing + shared-package. The authz boundary (profile-visibility nobody-hiding) + data-export self-scoping are verified by code-read (B-6) + live reproduction (T-8), but have no regression test. V-2 to triage (likely bug-test / accepted-debt given live verification; candidate for a follow-up test task).

## Active-execution testing (T-5 E2E, T-6 Layout, T-8 Security) — LIVE deploy `0c71585`

Tooling note: all Playwright MCP instances fail init (`channel: chrome` configured, Chrome not installed at `/opt/google/chrome/chrome`). Fell back to bundled chromium-1228 per T-5 rule 1 (same render + network path); never called browser_close. This is an **environment/tooling** issue, not a product defect — noted for infra follow-up (either install Chrome or reconfigure MCP to bundled chromium), LOW.

- **[T-5 · PASS · 6/6 flows]** settings-privacy renders all 4 required elements; honest Visible/Hidden control persists across reload (PUT+GET /profile/privacy 200); who-can-DM is a disabled affordance (aria-disabled=true, opacity 0.55, 0 enabled inputs), not a toggle; Download my data → `studyhall-account-data.json` (30,945 B valid JSON, A's own data only, no B email); /privacy + /terms public stubs HTTP 200 + footer links reach them; skeleton (not spinner) on shell load. No functional defects.
- **[T-6 · PASS · no regressions]** dark theme intact (`rgb(10,10,11)`); zero horizontal overflow at 1280 and 390; disabled who-can-DM visually distinct (dimmed opacity 0.55, pointer-events:none); green accent token on selected radio; stubs dark-theme intact. No layout regressions.
- **[T-8 · PASS · 0 CRITICAL]** LIVE negative-path reproduction, two verified fixtures A+B, co-members of server ad62cd12:
  - **CRITICAL #1 roster hiding — PASS:** A=`nobody` → ABSENT from B's roster (count 1) while A still sees self (count 2); A=`server-members` → visible to co-member B; A=`everyone` restored → reappears. Server-side enforced on `GET /servers/:id/members`.
  - **CRITICAL #2 data-export self-scoping (IDOR) — PASS:** `/profile/data` and `/profile/data/export` ignore `?userId=<B>`, always return A's own data. Structurally session-scoped.
  - auth boundary — PASS (401 unauth + malformed bearer; control 404). PUT invalid enum — PASS (400 zod error, no bad write, stored value unchanged). Email PII absent from roster — PASS (rows expose only avatarUrl/displayName/userId/username).
  - No prod data left mutated (A restored to `everyone`; bad-enum PUT rejected). This wave's core promise — ENFORCED privacy — is proven live.

- **[stubs · LOW · cosmetic, pre-existing]** /privacy + /terms show "Last updated: 2024" (same pre-existing © 2024 string flagged non-blocking at B-6; not wave-35-introduced). No fix required this wave.
