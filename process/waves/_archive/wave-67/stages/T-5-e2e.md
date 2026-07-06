# Wave 67 — T-5 E2E (live)

**Layer:** T-5 e2e — Pattern B (active, live prod probe)
**Target:** `/discover` browse page + `GET /servers/discover` + `POST /servers/:id/join-public`
**Env:** web `https://web-production-bce1a8.up.railway.app`, api `https://api-production-b93e.up.railway.app`
**Auth:** authenticated session already present as fixture A — `GET /me` = `{userId:21984eb2-8029-4c1b-9e73-bc586a0be4d2, email:studyhall-e2e-fixture@example.com, emailVerified:true}`, username `studyhallfixturea`. No re-login needed (valid cookie session).
**Tooling:** Playwright MCP (playwright-2). NOTE: recurring chrome-absent (67881a58) manifested as a stale SingletonLock (dead PID 686080 from a prior 13:04 session) on the shared MCP profile — cleared the stale lock file only (NOT a live browser; rule-5 compliant), MCP then worked. No browser_close issued.

## Probes + results

### 1. Rail Discover entry → /discover renders with rail present (B-6 regression check)
- Navigated to `/discover` as fixture A → route rendered (no redirect to /login, no crash).
- ServerRail present: `nav[aria-label="Server rail"]`, 570 rail elements (fixture A's many servers) — rail coexists with the discover main canvas.
- Discover rail entry present: element with `aria-label="Discover Public Servers"`. B-6 rail-entry regression INTACT.
- Page chrome: `h1 = "Discover Communities"`, search box `input[aria-label="Search servers"]` placeholder "Search by topic, course, or server name...". 0 console errors.

### 2. Honest cold-start empty-state (prod directory empty — no publish path yet)
- `serverCardCount: 0`, empty-state heading **"No public communities yet"** VISIBLE, `errorStateVisible: null`.
- This is the honest cold-start state (design `#emptyColdStart`), NOT an error state. Confirms the empty-directory reality (deferred publish-to-directory write path, M11 bundle 2bd37c4c).

### 3. Search box + chrome render
- Search input present with role/label (`aria-label="Search servers"`) — NOT a test-id (a11y-as-query-contract satisfied). Placeholder + sticky glass header render.

### 4. End-to-end browse+join (OPTIONAL — EXECUTED)
Published a purpose-built fixture server to make browse+join genuine (not a self-echo). Via prod Postgres PUBLIC proxy (`yamanote.proxy.rlwy.net:40008`, from `APP_DB`):
- Created server `523b0485-d5fd-42d3-9b4d-aaf3ebc64cde` "T5 Discover Fixture", owner = fixture B, `is_public=true`, topic "Computer Science", description set, default "Member" role + B membership. **Fixture A NOT a member** (`a_member=f`) — a real join target.
- Reloaded `/discover` → card rendered LIVE: name "T5 Discover Fixture", topic chip "Computer Science", description, Join button `aria-label="Join T5 Discover Fixture"`. `GET /servers/discover` returned EXACTLY this one public server (566 servers exist; only the 1 public one surfaced → is_public filter PROVEN).
- Baseline: rail 570 elements, `GET /servers` shows A NOT in the fixture (`aMemberBefore:false`).
- Clicked the real Join button → after ~2.5s: **A IS now a member** (`aMemberAfter:true`, `GET /servers` returns the fixture server), card button flipped to joined state **"Open"** (`aria-label="Open T5 Discover Fixture"`). Join write path executed end-to-end.
- Teardown: removed the fixture server + its rows; prod directory restored to honest empty-state (`GET /servers/discover` = `{"servers":[]}`, 0 public servers). No test pollution left.

## Findings (→ V-2)
- **F67-T5-1 (SIGNIFICANT, non-blocking): discover `memberCount` always 0.** The discover API returned `memberCount: 0` for the fixture server both when it had 1 member (B, with a role) and 2 members (B+A). DB `SELECT count(*) FROM server_members` returned the correct 1 then 2. The card renders "0 members". Feature is fully functional (browse+join works) but the displayed social-proof metric is always understated/wrong. Root-cause is server-side (aggregation in the discover query — likely a JOIN/GROUP-BY or count-column mis-wire; NOT a role-null artifact since it read 0 even for a properly-roled sole member). Route to V-2.
- **F67-T5-2 (LOW/MEDIUM, non-blocking): join-public assigns NULL role.** After A joined via `POST /servers/:id/join-public`, the created `server_members` row had `role_id = NULL` (contrast: the owner B has a proper default-role id). A role-less member may behave unexpectedly in downstream RBAC checks (permission lookups keyed on role_id). Route to V-2 to confirm intended behavior (does the app treat null-role members as base/no-perm, and is that the join-public design?).

## Verdict
T-5 PASS (live). Page + honest empty-state + rail + Discover entry + search all verified live; browse+join proven END-TO-END with a genuine non-member join target (A added to a server it was not in, UI reflected join). Two non-blocking findings → V-2.

```yaml
stage: T-5
layer: e2e
pattern: active-live
verdict: PASS
rail_present: true
discover_entry_present: true
empty_state_honest: true
browse_join_e2e: proven
is_public_filter_proven: true
findings:
  - {id: F67-T5-1, severity: significant, desc: "discover memberCount always 0 (server-side aggregation)"}
  - {id: F67-T5-2, severity: low-medium, desc: "join-public creates member row with NULL role_id"}
head_signoff: APPROVED
```
