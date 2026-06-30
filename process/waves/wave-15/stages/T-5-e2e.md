# T-5 — E2E (wave-15 M3 @mentions)

**Pattern:** B — Active-execution against deployed prod. **web** https://web-production-bce1a8.up.railway.app · **api** https://api-production-b93e.up.railway.app

## Execution note — MCP infra blocker + workaround (FINDING T5-F1)

The `ui-comprehensive-tester` swarm (3 testers, `mcp__playwright-1/2/3`) ALL returned **BLOCKED**: every Playwright MCP instance is pinned to the Google Chrome `chrome` channel, whose binary is absent at `/opt/google/chrome/chrome` and uninstallable without root. This is the standing "Playwright MCP chrome-channel absent in env" limitation noted in the journey map since wave-1, now confirmed to block the MCP swarm entirely.

**Workaround (per always-on rule 10 — use an available tool before deferring):** the bundled Chromium IS present (`~/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome`) and the `playwright@1.61.1` node module resolves. T-5 was executed by driving that bundled browser directly via a Playwright node script (explicit `executablePath`), plus authenticated REST + socket.io-client wire-level probes (the wave-12/13/14 two-client pattern). All scenarios were exercised against live prod with two distinct verified fixtures. **T5-F1 (MEDIUM, → V-2):** the Playwright MCP instances are misconfigured for this environment — reconfigure to bundled `chromium` channel or install Chrome stable. This is test-harness infra, NOT a product defect; it should be fixed before the next UI wave so the MCP swarm works.

## Fixture prep (test-fixture provisioning, not product change)

Both wave-14 fixtures had `username: NULL` (provisioned for presence, which uses userId/displayName). @mentions resolve on `users.username`, so neither could be mentioned. Set via `PATCH /profile` (200): A → `studyhallfixturea`, B → `studyhallfixtureb`. Both verified to surface in `GET /servers/:id/members`. Proof server `ad62cd12`, #general `93982063-...`.

## Scenario verdicts (1:1 with acceptance criteria)

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| S1 | composer @autocomplete dropdown appears, sourced from server membership | **PASS** | typing `@studyhallfixtureb` → `role="listbox"` ("Matching members") present, 1 option; reuses `GET /servers/:id/members` (200, observed in network) |
| S2 | keyboard nav + Enter selects (not sends) + Escape dismisses + aria-activedescendant | **PASS** | `aria-activedescendant` wired on the textarea (`mention-option-mention-listbox-_r_0_-da74148e...`); Escape → listbox count 0; Enter-select does not send (composer retains text) |
| S3 | mention pills render (not raw text); viewer-targeted pill distinct | **PASS** | `@studyhallfixtureb`/`@studyhallfixturea` render as styled pills in `role="log"`; OTHER pill bg `rgb(39,39,42)` / white-92 text; SELF/VIEWER pill bg `rgba(16,185,129,0.1)` emerald / `rgb(110,231,183)` emerald text — distinct emphasis. Screenshot channel-open-final-1440.png confirms. |
| S4 | non-member / unknown @token stays plain text, no row | **PASS** | `@nonexistentuser999` renders as PLAIN TEXT (no pill); REST send returned `mentions: []` |
| S5 | unread-mention badge accurate + clears on view | **PASS** | #general channel row showed `"general\n4"` (unread count) BEFORE open → `"general"` (cleared) AFTER opening the channel; markChannelRead works |
| S6 | GET /me/mentions bootstrap on mount | **PASS** | `GET /me/mentions` → 200 fires on app mount (observed in network on every load); body `{items, nextCursor?}` |
| S7 | edit-diff add/remove mention round-trips in UI | **PASS** | "mention removed again (edited)" row shows no pill + "(edited)" label after the mention was edited out |

## Network + console evidence

- Network observed: `GET /me/mentions → 200` (bootstrap), `GET /servers/ad62cd12/members → 200` (autocomplete source), `GET /channels/.../messages → 200`, `POST /channels/.../messages` (sends).
- Console errors: 1 benign `Failed to load resource: 401` on the pre-auth `/me` probe during the login transition (expected — fires before session established); no functional errors post-auth.

## Flake observation

Each UI assertion re-run across multiple script passes; deterministic (badge clear, pill render, listbox appearance all consistent). No flakes observed. No prior-wave flake matches.

## Findings

- **T5-F1 (MEDIUM, → V-2):** Playwright MCP instances (`mcp__playwright-1..10`) misconfigured to `chrome` channel; absent binary blocks the standard tester swarm. Worked around via bundled chromium + node script. Test-harness infra, not product. Recommend reconfiguring to bundled `chromium` before the next UI wave. (Standing env limitation since wave-1; now affects the MCP swarm specifically.)
- **B-6 carry M-2 (interior-dot):** not separately re-probed in the browser this pass; the M-2 client tokenizer divergence (`@user.dev` interior-dot won't render a pill) is an accepted carry; the non-member case (S4) is the closer analog and passed.

```yaml
test_pattern: active
skipped: false
testers_spawned: 3            # ui-comprehensive-tester swarm — ALL returned BLOCKED (MCP chrome-channel absent); T-5 executed via bundled-chromium node script + REST/socket probes instead
scenarios:
  - {id: S1, criterion_ref: "cd585f04-AC1/AC3", verdict: PASS, evidence_path: "screens/autocomplete-final-1440.png"}
  - {id: S2, criterion_ref: "cd585f04-AC2", verdict: PASS, evidence_path: "aria-activedescendant + Escape-dismiss observed"}
  - {id: S3, criterion_ref: "c3f3f62a-AC1", verdict: PASS, evidence_path: "screens/channel-open-final-1440.png"}
  - {id: S4, criterion_ref: "3d238446-AC1 (edge)", verdict: PASS, evidence_path: "@nonexistentuser999 plain text + mentions:[]"}
  - {id: S5, criterion_ref: "c3f3f62a-AC2/AC4", verdict: PASS, evidence_path: "general\\n4 → general on open"}
  - {id: S6, criterion_ref: "3d238446-AC4 (bootstrap)", verdict: PASS, evidence_path: "GET /me/mentions 200 on mount"}
  - {id: S7, criterion_ref: "3d238446-AC5 (edit-diff)", verdict: PASS, evidence_path: "(edited) row, no pill after removal"}
flakes_observed: []
fix_up_cycles: 0
findings:
  - {severity: medium, scenario: "tooling", description: "T5-F1 — Playwright MCP instances pinned to absent chrome channel; standard tester swarm BLOCKED. Worked around via bundled chromium. Reconfigure MCP before next UI wave."}
```

```yaml
head_signoff:
  verdict: APPROVED
  stage: T-5
  reviewers: {ui-comprehensive-tester: "3x BLOCKED — MCP chrome-channel absent"}
  failed_checks: []
  rationale: >
    Every acceptance criterion has a PASS verdict with concrete observed evidence, executed against live
    prod with two distinct verified fixtures. The tester swarm was blocked by a test-harness infra issue
    (all Playwright MCP instances pinned to an absent chrome channel), so rather than declaring the layer
    BLOCKED I used the available bundled-Chromium binary via a Playwright node script plus authenticated
    REST and socket.io wire probes — the same two-client pattern waves 12-14 used. The autocomplete
    listbox appears with aria-activedescendant wired, the viewer-targeted pill is visually distinct
    (emerald) from other-user pills (gray), the non-member token stays plain text, and the unread badge
    on the channel row shows a count that clears on open. I read the actual rendered content and network
    payloads, not layout alone. The one finding (T5-F1) is the MCP misconfiguration — MEDIUM, forwarded
    to V-2, to be fixed before the next UI wave; it did not prevent coverage this wave.
  next_action: PROCEED_TO_T-6
```
