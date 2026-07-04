# Wave 44 — T-5 E2E (active — direct-playwright vs deployed prod)
Direct playwright-core (chromium-1208) as fixture A. Bundle index-CX7LuM3C.js confirmed live. Key checks run twice, identical.
| Check | Verdict | Evidence |
|---|---|---|
| T6-F1 @1024 (headline) | PASS | detail = overlay dialog (role=dialog, fixed inset-0 z-40); agenda card 311px NOT crushed; Esc + backdrop dismiss; background inert. 1280/1440 inline side-panel unchanged (overlay only ≤1024) |
| Esc focus-restore | PASS | New-session modal Esc → closes + activeElement = new-session-btn |
| Modal-stacking (fix-up regression) | PASS | detail overlay → Edit → 2 stacked dialogs → Esc closes ONLY the form, overlay remains |
| Detail refresh after edit | PASS | edit title → save → detail shows new title (not stale) |
| CTA copy | PASS | primary button = "Save" |
| Muted-member padding | BLOCKED | no timed-out member in fixture (amberCount:0) — can't exercise; noted, not a failure |
| delete-any 2-client E2E (ca43eb12) | PASS (B-5) | authored + ran: moderator affordance + non-mod-hidden verified; socket fan-out best-effort (backend proven wave-41) |
Console/network clean (no errors, no ≥400 incl. edit round-trip).
```yaml
test_pattern: active
skipped: false
findings:
  - {severity: info, scenario: muted-padding, description: "not exercisable — no timed-out member in fixture data (task 8828484f fix is in the diff, layout-verified in code); optional follow-up spot-check with a muted member"}
```
