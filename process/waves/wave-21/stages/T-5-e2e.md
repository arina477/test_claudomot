# T-5 — E2E (wave-21)
**Pattern B — disposition recorded; live offline E2E DEFERRED (non-blocking).** CI `e2e` job conclusion=success on merge SHA 106e70e = the E2E layer is covered in CI. The intended live offline round-trip (disconnect -> see dot flip to reconnecting/offline -> compose offline -> reconnect -> all-missed-messages recovered) was attempted via the Playwright MCP and BLOCKED: chrome-channel absent (`/opt/google/chrome/chrome` not found; recurring KI since wave-14 — the MCP is hardwired to the `chrome` distribution; bundled chromium in the ms-playwright cache is not used by this MCP). Per the [STABLE] T-9 rule and prior-wave precedent, this does NOT block: the no-data-loss + honest-signal invariants are proven DETERMINISTICALLY via fake-indexeddb (T-4) + the connection-state disagreement table (T-2); only the live-prod browser OBSERVATION is deferred. web root live-probed HTTP 200. No browser_close issued (rule 5 / [STABLE] T-9 — would kill the shared MCP).

```yaml
test_pattern: active
skipped: false
live_e2e_disposition: deferred-non-blocking
evidence:
  - "CI e2e job conclusion=success on 106e70e (layer covered)"
  - "Playwright MCP navigate -> chrome distribution not found at /opt/google/chrome/chrome (recurring KI)"
  - "web root https://web-production-bce1a8.up.railway.app/ HTTP 200 (live)"
  - "invariants proven deterministically via fake-indexeddb (T-4) + disagreement table (T-2)"
findings:
  - {severity: MEDIUM, journey: F5, description: "KI-playwright: live-browser offline round-trip not runnable via MCP (chrome-channel absent). Worked around via CI e2e + fake-indexeddb. -> V-2/infra backlog"}
head_signoff: {verdict: APPROVED, stage: T-5, failed_checks: [], rationale: "E2E layer covered by green CI e2e job; live offline round-trip deferred on the recurring chrome-channel infra gap (non-blocking — invariants proven deterministically elsewhere). No browser_close. Disposition recorded.", next_action: PROCEED}
```
