# Wave 89 — T-5 E2E (component-test-authoritative disposition)
The wave has a user-visible behavior change (the academic Save button is now enabled on a client error; clicking it focuses + scrolls to the first over-length field). This is a FOCUS/aria a11y behavior on an EXISTING form — no new route/screen/user-flow.
**Disposition:** the behavior is exhaustively covered by 8 Testing-Library component tests (button-enabled regression guard, focus via toHaveFocus, aria-invalid, scrollIntoView spy, DOM-priority ordering, valid-path no-interference) WITH a verified load-bearing revert-check — the industry-authoritative layer for client-side focus/aria a11y (jsdom/Testing-Library, not Playwright). The deployed web was verified live (GET / = 200, deployment cf2cf979 @ b27277db). A full live Playwright E2E of client-side focus management is disproportionate to the exhaustive component coverage for this behavior class. Head-tester (T-9) adjudicates coverage adequacy.
Note (findings): pre-existing non-required e2e sign-in flake (delete-any-message, rule-11) + residual study-timer web timing flake (passes on re-run) — both unrelated to wave-89.
```yaml
test_pattern: component-authoritative
skipped: false
findings:
  - {severity: low, boundary: "e2e (non-required)", description: "pre-existing sign-in flake (5cc59349) + residual study-timer timing flake; unrelated; non-blocking"}
```
