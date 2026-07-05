# T-2 — Unit (wave-51)
**Pattern:** A (CI-verified).
- CI `test` job PASS on merge — web suite **422** (16 AppShell tests: 4 gating [ChannelSidebar absent both desktop+mobile on DM / present in server view] + 1 backdrop-strand regression [B-6 High fix] + 11 prior).
- Coverage: the gate + the backdrop fix both have genuine assertions (both DOM nodes; open-drawer→switch-to-DM→backdrop absent). No new flakes.
```yaml
test_pattern: ci-verified
skipped: false
evidence: ["C-1 test job PASS — web 422 (incl. 5 AppShell gating/backdrop tests)"]
modules_audited: [AppShell]
new_flakes: []
findings: []
```
