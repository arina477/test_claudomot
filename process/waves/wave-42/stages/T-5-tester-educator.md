# T-5 Live E2E — Educator roster + return UI (wave-42, StudyHall)

**Target:** https://web-production-bce1a8.up.railway.app (deployed prod)
**Tester lane:** EDUCATOR (roster visibility + Return dialog a11y + no-grading + badge states)
**Account:** Fixture A `studyhall-e2e-fixture@example.com`
**Tool:** Playwright MCP
**Date:** 2026-07-04

## Overall verdict: BLOCKED (infra — browser tooling unavailable)

No scenario could be exercised. The Playwright MCP could not launch a browser, so
no navigation, sign-in, or UI assertion was possible against deployed prod. This is
a **tooling/infra blocker on the tester environment**, NOT a product defect and NOT
a verdict on the educator UI itself.

## Root cause

Every Playwright MCP instance (`playwright-1` … `playwright-10`) is launched with
`--channel chrome`, which pins the browser executable to `/opt/google/chrome/chrome`.
`browser_navigate` fails at server init on every instance:

```
Error: async initializeServer: Chromium distribution 'chrome' is not found
at /opt/google/chrome/chrome
Run "npx playwright install chrome"
```

Confirmed via `grep`: the MCP launch args contain `--channel chrome` / `--channel=chrome`.

## Fallback attempted (task said: "fall back to bundled playwright-core chromium if chrome channel absent") — could NOT be applied

The bundled-chromium fallback is not reachable from inside this session:

1. **No per-call channel override** — the `browser_navigate` (and sibling) tool
   schemas expose no channel/executablePath parameter; the channel is fixed at MCP
   launch.
2. **Bundled chromium exists but is not substitutable** — bundled binaries are present
   at `~/.cache/ms-playwright/chromium-1208` / `chromium-1228` (and env vars `CHROME` /
   `CHROMEBIN` point at chromium-1228), but the MCP ignores these because its channel
   is hard-pinned to the `/opt/google/chrome/chrome` distribution path.
3. **Cannot symlink bundled chromium into the chrome path** — `/opt/google/chrome/`
   does not exist and `/opt` is root-owned and not writable (`/opt NOT writable`,
   `/opt/google NOT writable`).
4. **`npx playwright install chrome` fails at the privileged step** — it attempts
   `Switching to root user to install dependencies... Password: su: Authentication
   failure → Failed to install chrome`. Installing the chrome channel needs root to
   write under `/opt` and pull OS deps. Per always-on rule 19, privileged host commands
   are the studio's responsibility, not the founder's, and cannot be self-solved here.
5. **No user-editable MCP config for the numbered instances** — the plugin `.mcp.json`
   (`@playwright/mcp@latest`, no channel) is NOT the source of `playwright-1..10`; those
   are provisioned by the studio harness with `--channel chrome`, external to and not
   writable from this session.

Escape routes 1–5 are exhausted with no non-privileged path remaining.

## Per-scenario status

| # | Scenario | Status | Note |
|---|----------|--------|------|
| 1 | Sign in as A → find server where A holds manage_assignments → open Assignments panel + assignment | BLOCKED | Browser never launched; could not reach the app |
| 2 | Roster visibility (organizer sees Submissions roster / empty state; plain member sees none) | BLOCKED | Not reachable |
| 3 | Return dialog a11y (role=dialog, focus in, Esc closes + restores focus to trigger, optional comment textarea, confirm → emerald "Returned" badge) | BLOCKED | Not reachable |
| 4 | No grading (roster + dialog carry NO grade/score/rubric field) | BLOCKED | Not reachable |
| 5 | Awaiting (amber) vs Returned (emerald) badge states | BLOCKED | Not reachable |

## Evidence

- `browser_navigate` init error (verbatim above) reproduced on `playwright-1` and
  `playwright-2` — identical `/opt/google/chrome/chrome` failure → uniform channel pin.
- No screenshots/console captured: browser context never initialized, so
  `browser_take_screenshot` / `browser_console_messages` were not invocable.
- `browser_close` was never called (per rule 5 / sibling-tester safety) — no MCP
  instance was disturbed.

## Handoff / what T-block owner needs

This T-5 educator lane cannot pass or fail on merits until the Playwright MCP is
provisioned with a launchable browser. Fix path is **upstream / studio-side**, one of:

- Provision the numbered Playwright MCP instances with `--channel chromium` (bundled)
  instead of `--channel chrome`, **or**
- Install the chrome channel host-side under `/opt/google/chrome/` (needs root), **or**
- Expose an `executablePath` pointing at `~/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome`.

Once any of those lands, re-run this educator lane unchanged. No code changes to the
StudyHall app are warranted by this report. Note: per the brief, backend organizer-gating
is already proven at T-4 — this lane is specifically the deployed-UI surface, still unverified.
