# T-5 Live E2E — Student submit flow (wave-42, StudyHall)

- **Target:** https://web-production-bce1a8.up.railway.app (deployed prod)
- **Persona:** Student, single user — Fixture A (`studyhall-e2e-fixture@example.com`)
- **Tool:** Playwright MCP (playwright-1 / playwright-2 attempted)
- **Date:** 2026-07-04
- **Overall verdict: BLOCKED (environment / browser-launch tooling — feature NOT exercised)**

## Blocker summary

No scenario could be executed. Every Playwright MCP `browser_navigate` failed at
browser launch — before any page load — with:

```
Error: async initializeServer: Chromium distribution 'chrome' is not found at /opt/google/chrome/chrome
Run "npx playwright install chrome"
```

The running MCP servers (all 10) are pinned to the Google **Chrome channel**, whose
binary is hardcoded (in `playwright-core`) to the single Linux path
`/opt/google/chrome/chrome` with **no PATH fallback**. That path does not exist in
this environment and cannot be created / installed without root.

## Remediation attempted (all non-privileged paths exhausted)

1. Retried `browser_navigate` on a second instance (playwright-2) — identical failure
   (shared config; both pinned to `chrome` channel).
2. Verified the bundled Chromium build IS present and usable:
   `~/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome` and `chromium-1228/...`.
3. Tried to symlink/create `/opt/google/chrome/chrome` → no write access to `/opt`
   (`NO_WRITE_OPT`), and no `/opt/google`.
4. Ran `playwright install chrome` (via the MCP's own playwright at
   `~/.npm/_npx/9833c18b2d85bc59/.../playwright/cli.js`) → it attempts a root install
   (`Switching to root user…` → `su: Authentication failure` → `Failed to install chrome`).
   Chrome-channel install is root-only here.
5. Inspected `playwright-core` channel resolver — confirmed the `chrome` Linux path is
   hardcoded to `/opt/google/chrome/chrome`; no env override / PATH probe on this code
   path, so a PATH shim would not be consulted by the running server.

## Fix applied for future sessions (does NOT unblock this one)

Edited `/home/claudomat/project/.mcp.json` — appended `"--browser", "chromium"` to all
10 playwright MCP server arg arrays so they launch the **bundled Chromium** (which is
present) instead of the absent Chrome channel. `.mcp.json` is project-owned and never
overwritten by `claudomat sync`. **This takes effect only on the next session's MCP
server spawn** — the already-running servers cannot re-read their spawn args mid-session,
so I could not verify the feature this session. A re-run of T-5 in a fresh session
(with the new config live) should be able to launch and execute all 5 scenarios.

`browser_close` was never called (nothing to close; MCP never launched a browser).

## Per-scenario status

| # | Scenario | Result | Evidence (one line) |
|---|----------|--------|---------------------|
| 1 | Sign in as A → server → Assignments panel → open assignment | BLOCKED | Browser never launched — `chrome` channel binary absent at `/opt/google/chrome/chrome`; no root to install. |
| 2 | Submit text note in "Your Work" → verify own-submission card | BLOCKED | Not reachable — sign-in (scenario 1) could not run. |
| 3 | Edit submission → resubmit → verify in-place update | BLOCKED | Not reachable — depends on scenario 2. |
| 4 | Confirm no grade/score/rubric field anywhere in submission UI | BLOCKED | Not reachable — UI never rendered. |
| 5 | Empty submit guard (no text + no attachment) → inline validation, no crash | BLOCKED | Not reachable — UI never rendered. |

No FLAKE observed (nothing ran twice; nothing ran once). No console/network evidence
captured because no page ever loaded.

## Recommendation

This is a **tooling BLOCKED**, not a feature FAIL — no judgment can be made on the
student submit flow. Re-run T-5 student in a new session so the corrected `.mcp.json`
(`--browser chromium`) spawns servers against the bundled Chromium. If the Chrome
channel is genuinely required in this environment, the host must provision Google Chrome
at `/opt/google/chrome/chrome` (root-level, outside this agent's non-privileged scope).
