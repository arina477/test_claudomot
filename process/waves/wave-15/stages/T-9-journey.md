# T-9 — Journey (wave-15 M3 @mentions) — BLOCK-EXIT GATE

## Phase 1 — head-tester gate verdict

Fresh head-tester (agentId ace214d93f8422e6c) reviewed the full T-block (manifest + findings-aggregate + T-1..T-8 deliverables + spec ACs) independently.

**Verdict: APPROVED** (attempt 1; rework_attempt_cap_remaining: 2). Verdict at `process/waves/wave-15/blocks/T/gate-verdict.md`.

Key independent confirmations:
- T-8 two-client evidence is genuine (separate REST sender A + socket receiver B; B NOT in the channel room; B got the per-user `mention` event + 0 `message:new` leak — H-1 fix alive, not self-echo).
- T-4 missing real-PG integration tier is honest MEDIUM (unit layer correctly mocks; integration tier explicitly recorded absent — NOT mock-the-SUT), substituted by C-2 direct-pg verify + live T-8 probe. **Tightened condition: V-2 MUST issue an explicit disposition on the 2-wave 02fa8011 carry — cannot silently slide to a 3rd wave.**
- T-3 no-dedicated-schema-test is defensible LOW (schemas type-only, never runtime-parsed; contract asserted at consumers).
- T-5 MCP-swarm-blocked worked around acceptably (bundled chromium read real DOM + network).

## Phase 2 — Journey regen

### Action 2 — Skip evaluation: REGEN REQUIRED
- wave_type includes `ui`. ✓
- D-block fired (`design_gap_flag: true`; `design/server-channel-view.html` canonicalized at D-3, journey_map_updated:false folded into T-9). ✓
- B-3 Frontend ran (MentionAutocomplete, useMentionBadge, MessageList pills, MessageComposer, ChannelSidebar badge). ✓
→ Regen REQUIRED.

### Actions 3-4 — Crawl + regen
Crawled deployed prod (bundled-chromium browser pass + REST/socket probes, two verified fixtures A+B). Regenerated `command-center/artifacts/user-journey-map.md` v0.10 → **v0.11**:
- **routes_added:** none (no new page route — @mentions extends existing page-9 + adds the `GET /me/mentions` endpoint, not a screen).
- **surfaces added to the map:** composer @autocomplete, mention pills (self/other), unread-mention badge (channel sidebar), `GET /me/mentions` endpoint, per-user-room `mention` realtime event, `message_mentions` data plane. New wave-15 deployment-status section + F3 flow updated with the @mention sub-flow.
- **routes_removed:** none.
- **coverage_gaps:** message_mentions real-PG integration tier (carry 02fa8011); MCP swarm chrome-channel (T5-F1) — both recorded → V-2.

### Action 5 — Scenario smoke
No `user-scenarios/` directory exists → no scenario files to run. Recorded.

### Action 6 — Cross-wave regression check
Crawl compared against prior (wave-14) journey map. No prior journey regressed:
- F1 signup, F2 invite/join, F3 messaging core + lifecycle, F7/F8 servers/roles/invites — all prior surfaces still present and reachable (the channel view, member list, message list, composer all rendered live during the crawl; `GET /servers/:id/members` 200, `GET /channels/:id/messages` 200, login → app-home → server → channel all worked).
- Wave-14 F-4 typing defect remains carried (unchanged; not a wave-15 regression).
- No accidental breakage. The @mention additions are purely additive to page-9.

### Action 8 — Commit
Journey map committed to main: **bcdfd2b** (`docs(journey): T-9 regen for wave-15`), pushed.

```yaml
phase1_head_tester_verdict: APPROVED
test_pattern: active
skipped: false
journey_regen_skipped: false
journey_regen_skip_reason: ""
crawl_routes_visited: 4    # /login, /app, server-view (in-place), channel-view (in-place); no new route this wave
regen_diff:
  routes_added: []
  routes_removed: []
  coverage_gaps:
    - "message_mentions real-PG integration tier absent (carry 02fa8011, MEDIUM → V-2 explicit disposition required)"
    - "Playwright MCP swarm chrome-channel absent (T5-F1, MEDIUM → reconfigure before next UI wave)"
scenarios_run: 0           # no user-scenarios/ dir
scenarios_failed: 0
regressions_critical: 0
regressions_significant: 0
journey_map_commit: bcdfd2b357c08acee5d8afa9ab6e42be43c1eca0
findings:
  - {severity: info, journey: "F3 messaging @mentions", description: "@mention surfaces added to page-9; all 5 load-bearing T-8 checks PASS live two-client; no prior journey regressed"}
```
