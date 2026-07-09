# Wave 89 — T-9 Verdict

**Reviewer:** head-tester (fresh spawn)
**Reviewed against:** process/waves/wave-89/blocks/T/review-artifacts.md + findings-aggregate.md
**Attempt:** 1  (1 = first gate)

## Verdict
APPROVED

## Rationale

The T-5 component-test-authoritative disposition is adequate for this behavior class, and I rule that a live Playwright E2E is genuinely NOT required. The wave's user-visible change is client-side focus management + aria-invalid on an EXISTING form field on a failed academic-profile save — it adds no route, screen, or user-flow, so there is nothing for an E2E to traverse that a component test cannot. The core question I apply at every layer is "what plausible real bug would make this test fail?"; the T-2 evidence answers it with a verified revert-check — deleting the focus code fails exactly the 2 focus tests, and dropping the disabled-logic change fails the `not.toBeDisabled` regression guard. That is a real tripwire, not coverage theater: 8 Testing-Library cases cover focus (`toHaveFocus`), `aria-invalid`, the `scrollIntoView` spy, DOM-priority ordering (first-errored field wins), the valid-path no-interference case, and the button-enabled regression. jsdom/Testing-Library is the industry-authoritative layer for `element.focus()` + `aria-invalid`; those assertions are fully determined at the DOM level. Real-browser divergence from jsdom would be load-bearing only if the behavior were gated on genuine browser rendering (IntersectionObserver visibility, scroll-snap, layout-dependent focus) — none apply here; it is `focus()` + `scrollIntoView()` on a static field, and the deployed web renders (GET / = 200 @ b27277db, deployment cf2cf979), confirming the shipped bundle mounts. A full live E2E of client-side focus is disproportionate. All skips are legitimate and independently confirmed against the B-block scope (B-0 schema skipped, B-2 backend skipped, only B-3 frontend touched): T-3 contract and T-4 integration SKIP because no schema/service/DB/API boundary was touched; T-6 layout SKIP because the change is behavioral (disabled-state + focus/aria), not a restyle or new component; T-7 perf SKIP (a ref map + focus call on the error path is negligible); T-8 security SKIP is sound and non-trivial — the client over-length guard still blocks the invalid PATCH (`patchProfile` not called on the error path, verified) and server Zod remains authoritative, so enabling the button opens no new attack surface. T-1 static is CI-green with 0 type bypasses in the wave diff. The only findings are pre-existing, unrelated e2e sign-in + study-timer flakes, correctly logged as low/non-blocking and not masked by retries. No coverage theater; no mock-the-system-under-test; error path (over-length) is the primary tested path, not an afterthought.

## Escalation
N/A — APPROVED.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 2
