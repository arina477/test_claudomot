# T-5 E2E — Tester A — wave-23 (delegated assignment-organizer authz)

**Target:** LIVE prod — web `https://web-production-bce1a8.up.railway.app`, api `https://api-production-b93e.up.railway.app`
**Fixture:** `studyhall-e2e-fixture@example.com` (SuperTokens `21984eb2-…`, server owner, superuser → effective `manage_assignments`)
**Owned server under test:** `ad62cd12-b78e-4a85-a214-042cf176b16c` ("Fixture Proof Server")
**Date:** 2026-07-01
**Spec:** edbdea8f (Spec 2 — `/me` effective-permissions + CTA gate)

---

## HEADLINE

The **browser-driven UI scenarios (1 & 2) are BLOCKED** by an environment/infra defect: every `@playwright/mcp` instance (playwright-1…10) is pinned to the branded-Chrome channel (`chrome`) which is not installed at `/opt/google/chrome/chrome` and cannot be installed (no root; `/opt/google` not writable). Bundled Playwright chromium IS present but the MCP server exposes no in-session flag to redirect to it. Per T-5 discipline, a broken harness → **BLOCKED, not FAIL**.

**Scenario 3 (the new `/me/permissions` endpoint powering the gate) was fully exercised at the API level against LIVE prod and PASSES** — including the IDOR-safety and non-member/non-owner acceptance edges. The prod web bundle was also confirmed to contain the shipped gate code (`me/permissions` fetch + "New Assignment" CTA + `manage_assignments`), proving B-3 is deployed; what remains unverified is only the client-side *render/visibility*, not the endpoint or the deploy currency.

---

## Verdict table

| # | Scenario | Verdict | Runs | Evidence |
|---|----------|---------|------|----------|
| 1 | Owner sees "New Assignment" CTA (visual) | **BLOCKED** | 0 (browser won't launch) | bundle contains CTA string (indirect); render unverified |
| 2 | CTA opens create form (visual) | **BLOCKED** | 0 (browser won't launch) | render unverified |
| 3 | `GET /servers/:id/me/permissions` fires, 200, `owner:true`/`manage_assignments:true` | **PASS** | 2× + 4 edge probes, all consistent (no flake) | `evidence-T5-A/s3-*.txt` |

---

## Scenario 3 — endpoint evidence (PASS, no flake)

Auth: real SuperTokens `POST /auth/signin` (`rid: emailpassword`, `st-auth-mode: header`) → `Authorization: Bearer <st-access-token>` — the same flow the E2E auth harness (`apps/web/e2e/auth.setup.ts`) performs. `status: OK`, 1002-char access token.

**Owner (fixture A) on owned server ad62cd12 — run 1 & run 2 identical:**
```
GET /servers/ad62cd12-…/me/permissions   → HTTP 200
{"owner":true,"manage_server":true,"manage_roles":true,"manage_channels":true,"manage_members":true,"manage_assignments":true}
```
→ `owner:true` AND `manage_assignments:true` both present. Gate would show CTA. Ran twice, byte-identical — **no flake**.

**Response shape observed:** flat JSON object, 6 boolean keys: `owner`, `manage_server`, `manage_roles`, `manage_channels`, `manage_members`, `manage_assignments`. (Matches `EffectivePermissions` union 4→5 from Spec 1 — the 5th flag `manage_assignments` is present in the wire payload.)

**Acceptance-criteria edge probes (all against LIVE prod):**

| Probe | Expected (spec) | Observed | File |
|---|---|---|---|
| IDOR: `?userId=<fixture-B>` appended | ignored; session-derived only | 200, returns **owner A's** grants (owner:true) — client userId NOT honored | `s3-idor-probe.txt` |
| Unauthenticated (no token) | reject | 401 `{"message":"unauthorised"}` | `s3-unauth.txt` |
| Non-member (fixture B on a server B isn't in) | 403 | 403 `{"message":"You are not a member of this server","error":"Forbidden","statusCode":403}` | `s3-nonmember-403.txt` |
| Member non-owner (fixture B on ad62cd12, no role grant) | 200, all-false | 200 `{"owner":false,…,"manage_assignments":false}` | `s3-member-b-nonowner.txt` |

The non-owner-member case is the negative half of the gate: B is a genuine member of ad62cd12 but has neither `owner` nor `manage_assignments`, so the CTA would be correctly **hidden** for B. This confirms the gate discriminates (owner→CTA, plain member→no CTA) at the data layer.

**IDOR note (T-8-adjacent, but observed here):** the `?userId=` override is correctly ignored — the endpoint is session-derived and returned the caller's own grants, not the injected user's. No IDOR on this endpoint.

---

## Scenarios 1 & 2 — BLOCKED (browser cannot launch)

**Navigation plan that would have been executed** (documented since it couldn't run):
1. `/login` → fill `#email`/`#password` (fixture creds) → "Sign In" → wait for `nav[aria-label="Server rail"]` + URL `/app` (per `auth.setup.ts`).
2. Server rail → click "Fixture Proof Server" (ad62cd12).
3. ChannelSidebar → Workspace section → "Assignments" nav item (`ChannelSidebar.tsx:357`, `onClick=openAssignments`) → renders `AssignmentsPanel` in MainColumn (`MainColumn.tsx:117`).
4. **S1:** assert "New Assignment" CTA visible in the panel header (owner has `manage_assignments` via superuser → `isOrganizer` true).
5. **S2:** click "New Assignment" → assert `AssignmentForm` modal renders (title/description/due-date) without submitting.
6. Network capture: assert `GET …/me/permissions` fired on panel load, 200 with `owner:true`.

**Why blocked:**
- `mcp__playwright-1__browser_navigate` and `mcp__playwright-2__browser_navigate` both error: `Chromium distribution 'chrome' is not found at /opt/google/chrome/chrome — Run "npx playwright install chrome"`.
- `.mcp.json` starts all playwright servers as `npx -y @playwright/mcp@latest` with **no `--browser chromium`** flag → they default to the branded-Chrome channel.
- `playwright install chrome` fails: `Switching to root user… su: Authentication failure` (no root).
- `/opt/google` is not writable (`mkdir: Permission denied`), so the bundled chromium (`~/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome`, present + executable) cannot be symlinked into the channel path.
- No system chromium/google-chrome on PATH; no snap/flatpak.

This is an **infra/harness** condition, not an application defect → BLOCKED per the "fixture/auth flow broken → BLOCKED" rule (extended to "browser won't launch").

**Partial indirect evidence for S1** (does NOT close the gap): the LIVE prod web bundle `/assets/index-CjCuO_OW.js` contains `me/permissions` (1×), `New Assignment` (3×), and `manage_assignments` (3×) → B-3 gate code IS deployed to prod and the deploy is current. But whether the CTA actually *renders/shows* for the owner is a client runtime assertion that only a browser can make — left unverified.

---

## Console errors

Not captured — browser never launched. No console-error evidence available for this run.

---

## `/me/permissions` response shape (as requested)

```json
{
  "owner": true,
  "manage_server": true,
  "manage_roles": true,
  "manage_channels": true,
  "manage_members": true,
  "manage_assignments": true
}
```
Flat object, all-boolean, 6 keys. `manage_assignments` present (the new 5th flag). Session-scoped; `?userId` ignored (IDOR-safe); non-member → 403; unauth → 401; member-without-grant → all-false 200.

---

## Recommendations (for the T-block gate / infra)

1. **Unblock the browser layer** so S1/S2 can be re-run before this wave's T-block closes. Fix is host-side: either install branded Chrome for the MCP (`npx playwright install chrome` with privileges) OR start the playwright MCP servers with `--browser chromium` (use the already-present bundled chromium-1228). No app change needed.
2. Once a browser is available, re-run S1/S2 twice each per the navigation plan above; the API evidence predicts PASS (owner gets `owner:true`+`manage_assignments:true`), but the render must be visually confirmed.
3. No application fixes indicated by this run — the endpoint, deploy currency, and gate logic are all correct at the layers reachable without a browser.

## Evidence files
- `process/waves/wave-23/stages/evidence-T5-A/s3-me-permissions-run1.txt`
- `process/waves/wave-23/stages/evidence-T5-A/s3-me-permissions-run2.txt`
- `process/waves/wave-23/stages/evidence-T5-A/s3-idor-probe.txt`
- `process/waves/wave-23/stages/evidence-T5-A/s3-unauth.txt`
- `process/waves/wave-23/stages/evidence-T5-A/s3-nonmember-403.txt`
- `process/waves/wave-23/stages/evidence-T5-A/s3-member-b-nonowner.txt`
