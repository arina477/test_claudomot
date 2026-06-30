# T-6 — Layout (wave-21)
**Static — confirmed.** ConnectionStateIndicator renders the 3 states with text + color (design §8):
- online: sr-only `<output aria-live=polite>Online` (minimal/hidden, DOM presence consistent)
- reconnecting: amber dot (#f59e0b) + SpinnerIcon + "Reconnecting…", 200ms color fade
- offline: danger dot (#ef4444) + "Offline — messages will send when you're back"
role=status / aria-live=polite — **state communicated in TEXT, not color alone** (a11y-as-contract + WCAG). The dot is now **LIVE**: AppHome.tsx:42 replaced the hardcoded `"online"` with the live useConnectionState() value (B-6 confirmed; design_gap was FALSE — the dot's visual was adopted a prior wave, no new design surface). The AppHome wiring tests assert "Reconnecting…" and "Offline — messages will send when you're back" render from the live hook — would FAIL if still hardcoded. No getByTestId (uses getByText/role). No visual baseline diff needed (no new component; reused adopted indicator).

```yaml
test_pattern: active
skipped: false
evidence:
  - "ConnectionStateIndicator.tsx renders 3 states, role=status aria-live, text+color (not color-alone)"
  - "AppHome.tsx:42 live hook (not hardcoded); wiring test asserts live Reconnecting…/Offline text"
findings: []
head_signoff: {verdict: APPROVED, stage: T-6, failed_checks: [], rationale: "Indicator renders all 3 states with text-bearing a11y (role=status, not color-alone), queried by role/text not testId; dot proven LIVE via AppHome wiring test. No new design surface. Acceptable static layout pass.", next_action: PROCEED}
```
