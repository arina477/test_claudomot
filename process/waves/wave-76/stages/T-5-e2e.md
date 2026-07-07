# Wave 76 — T-5 E2E

**Pattern:** B (Active — live Playwright against prod web-production-bce1a8). Fires: user-visible.

## Setup
Logged in as Fixture A (owner, studyhallfixturea, userId 21984eb2). Upgraded "Fixture Proof Server" ad62cd12 to school tier via the live wave-75 mock checkout (POST /billing/tier {targetTier:school}, test mode). NEVER browser_close (rule 5) — context preserved throughout.

## Results — 3 states verified live

### LOADED (rich school-tier server)
On a fresh page load, opening Server Settings → Overview surfaces the **Educator Admin Console** (`data-testid=educator-admin-console` + `educator-console-dashboard`). All 4 groups render with live data matching the API:
- Total Members: 4 (Educators 1 / Students 3) — reflects test-state members
- Messages: 482
- Assignments Total: 2 (Graded scope 2, Submissions 2)
- Recent Activity: message sent 482, assignment submitted 2, session scheduled 24 ("508 recent events recorded")

### EMPTY (fresh school-tier server 7a2f57c5)
Console renders with "School Plan" header and all-zero aggregates: Total Members 1 (owner; Educators 0, Students 1), Messages 0, Assignments 0, Submissions 0, Recent Activity all 0. Zero-state, not error. ✓

### HIDDEN (free-tier server V1-verify-probe)
Console is ABSENT from DOM (`consolePresent:false`, no "Educator Console" text). Client gate `gated = educatorToolsEnabled && canAccess` returns null on free tier. ✓

## FINDING — mid-session tier change requires page reload to reveal console
When the tier was upgraded free→school within the same SPA session (no reload), the console stayed hidden (`gated` false) because the parent `ServerOverviewSettings` `educatorToolsEnabled` effect (getServerPlan) had already resolved to the pre-upgrade value and did not re-run on the external tier change. A full page reload rendered the console correctly. Real-user impact: an owner who upgrades to School in one browser tab must refresh before the console appears in an already-open settings surface. Non-blocking (fresh loads always correct), but a UX gap worth a follow-up (re-fetch plan on tier-change / on settings-open).

```yaml
test_pattern: active
evidence:
  - "LOADED: educator-admin-console + dashboard render with 4 groups, data matches live API (members 4, messages 482, assignments 2, sessions 24)"
  - "EMPTY: zero-valued dashboard on fresh school server (200, not error)"
  - "HIDDEN: console absent on free-tier server (client gate null)"
findings:
  - {severity: low, location: "apps/web/src/shell/ServerOverviewSettings.tsx (educatorToolsEnabled effect)", description: "Mid-session tier upgrade (free→school) does not re-reveal the console until a page reload; the getServerPlan effect does not re-run on external tier change. Fresh loads are always correct. UX follow-up, non-blocking."}
