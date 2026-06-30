# Wave 18 — T-6 Layout
```yaml
test_pattern: active
skipped: false
surfaces_audited: [server-channel-view (thread panel + in-list affordance)]
breakpoints: [1440, 1280, 1024]
token_violations: []
findings:
  - {severity: info, surface: thread-panel, description: "static conformance vs D-3-approved canonical (ace2509): affordance hidden@replyCount===0, ≤1024 role=dialog overlay + focus-trap, zinc-400 ≥4.5:1, emerald affordance. Live pixel diff deferred (chrome-channel)."}
```
