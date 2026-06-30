# T-5 E2E — wave-18 M3 Thread Replies — Tester Report

**Date:** 2026-06-30
**Layer:** T-5 E2E (active-execution, live prod)
**Target:** https://web-production-bce1a8.up.railway.app (web), https://api-production-b93e.up.railway.app (api)
**Tool:** Playwright MCP (intended)
**Outcome:** **BLOCKED — environment/infra fault. Zero scenarios executed. No PASS issued.**

---

## Verdict summary

| Scenario | Result | Evidence |
|---|---|---|
| 1 — single-client authed thread flow | **BLOCKED** | Browser never launched |
| 2 — two-client realtime fan-out (load-bearing) | **BLOCKED** | Browser never launched |
| `thread:reply:deleted` decrement | **BLOCKED** | Browser never launched |

No false PASS. The two-client realtime fan-out (the highest-priority, wave-14-typing-broken-class check) was **not verified** and remains a **known gap**.

---

## Root cause (infra, not feature)

Every Playwright MCP instance fails identically at browser launch, before any navigation:

```
Error: async initializeServer: Chromium distribution 'chrome' is not found
at /opt/google/chrome/chrome
Run "npx playwright install chrome"
```

The MCP servers are launched with the `chrome` channel (`--channel=chrome`), which resolves the
Google Chrome **stable** binary at the fixed path `/opt/google/chrome/chrome`. That path does not
exist in this environment.

Confirmed reproducible across `playwright-1`, `playwright-2`, and `playwright-10` — same error on
the very first `browser_navigate`. This is a shared-config fault, not a per-instance flake.

### What IS available (and why it doesn't help)
- A working bundled Chromium exists: `~/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome`
  — verified runnable: `Google Chrome for Testing 149.0.7827.55`, `--dump-dom about:blank` exits 0
  (only benign dbus warnings). So the host CAN run a browser.
- The MCP is **not** configured to use that bundled Chromium — it is hardwired to the `chrome`
  channel. I do not control the MCP server launch flags from inside this agent (external harness
  config), so I cannot point it at the bundled binary.

### Remediation attempts (all blocked by lack of root)
1. `npx playwright install chrome` → `playwright: not found` (no local install).
2. `npm install playwright` in /tmp, then `npx playwright install chrome` →
   `Switching to root user to install dependencies... su: Authentication failure / Failed to install chrome`.
   Chrome stable requires root to install OS deps.
3. Symlink/place bundled Chromium at `/opt/google/chrome/chrome` →
   `mkdir /opt/google: Permission denied` (no write to `/opt`, no root).

No model-side workaround exists. The fix is host-side: either install the `chrome` channel as root,
OR reconfigure the Playwright MCP to use the bundled Chromium (`channel: chromium` / `executablePath`
to `~/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome`) instead of `--channel=chrome`.

---

## Preconditions confirmed BEFORE the block (read, not assumed)

These were verified from the gitignored registry `command-center/testing/test-accounts.md` so the
re-run has a clean head start:

- Fixture A: `studyhall-e2e-fixture@example.com` / username `studyhallfixturea` — email-verified,
  owns "Fixture Proof Server" `ad62cd12-b78e-4a85-a214-042cf176b16c`.
- Fixture B: `studyhall-e2e-fixture-b@example.com` / username `studyhallfixtureb` — email-verified.
- **Co-membership confirmed in registry:** B joined proof server `ad62cd12` via invite at wave-14 T-8;
  `GET /servers/ad62cd12/members` count = 2 (both A + B). This means Scenario 2's co-member
  precondition is satisfiable — the two-client check is genuinely runnable once the browser launches.
  It is NOT blocked on a missing co-membership; it is blocked solely on the browser-launch infra fault.

---

## Evidence requirements status

- Per-scenario PASS/FAIL/FLAKE/BLOCKED: all **BLOCKED** (above).
- Network-panel frame evidence (`thread:reply:created` / `thread:reply:deleted`): **none captured** —
  browser never launched.
- Console errors: **none captured** — no page loaded.
- Screenshots in `process/waves/wave-18/stages/T-5-thread/`: dir created, **empty** — nothing to capture.

---

## Disposition for the gate (head-tester / T-block)

This is a T-5 infra-readiness block, NOT a feature defect and NOT a test pass. The thread-reply feature
was never exercised against prod. Route as: **fix the Playwright MCP browser config (host-side), then
re-run T-5 unchanged.** The two-client fan-out remains the load-bearing unverified assertion.
