# T-5 Tester A — Avatar Storage Go-Live (Partition A: happy path + crux render + persistence)

**Target:** PRODUCTION — web `https://web-production-bce1a8.up.railway.app`, api `https://api-production-b93e.up.railway.app`
**Fixture:** `studyhall-e2e-fixture@example.com` (email-verified) — login OK, lands on `/app`
**Date:** 2026-07-03
**Runs per scenario:** 2 (flake detection) + 1 dedicated anonymous-GET verification

---

## Verdict table

| AC | Scenario | Verdict | Evidence |
|----|----------|---------|----------|
| AC1 | Presign returns 200 (not 503) | **PASS** | `POST /profile/avatar/presign` → **200** (both runs), returns `{uploadUrl, key}` |
| AC1/AC2 | PUT to storage succeeds | **PASS** | `PUT` to Tigris presigned URL (`t3.storageapi.dev/studyhall-avatars-ngavql0/...`) → **200** (both runs) |
| AC2 | Confirm returns 200 + avatar URL | **PASS** | `POST /profile/avatar/confirm` → **200**, returns `avatarUrl = /users/{userId}/avatar?v=<hash>` (the new redirect endpoint) |
| AC3 | **CRUX — avatar renders (img, naturalWidth>0)** | **PASS** | After reload, profile-panel `<img>` has **naturalWidth=64, naturalHeight=64, complete=true** (exact size of uploaded 64×64 PNG). Visual: pink avatar renders (screenshot 21) |
| AC3 | **CRUX — avatar-GET resolves 200 image bytes via 302** | **PASS** | **Anonymous** (no-cookie) `GET /users/{id}/avatar` → **302** → `t3.storageapi.dev` presigned URL → **200**, `content-type: image/png`, 136 bytes, valid PNG signature (`89504e47…`) |
| — | Persistence across reload / fresh session | **PASS** | Full page reload issues fresh `/me`; sidebar `<img>` re-renders at naturalWidth=64. Run 2 produced a new `?v=` version, confirming stable URL survives new upload |
| — | Avatar on other surfaces (member list) | **NOT TESTED (optional)** | MEMBERS panel empty with no server selected; profile-panel render already proves the crux |
| — | UI upload flow (click profile settings → pick image → upload) | **BLOCKED** | Profile-settings entry point is a dead button — see Finding F1. Backend flow validated through the app's real (SuperTokens-wrapped) fetch stack instead |

**CRUX RESULT: YES — the avatar renders with HTTP 200.** Anonymous `GET /users/:id/avatar` returns 302→200 `image/png`; the `<img>` element paints with `naturalWidth=64`. Presign is **200, not 503**. The wave's storage go-live is functionally confirmed end-to-end in production, twice, with no flakes.

---

## Captured network status codes (both runs identical)

```
POST /profile/avatar/presign      -> 200   { uploadUrl: https://t3.storageapi.dev/studyhall-avatars-ngavql0/avatars/<uid>/<uuid>.png?X-Amz-...  , key: avatars/<uid>/<uuid>.png }
PUT  <presigned Tigris uploadUrl> -> 200   (Content-Type: image/png)
POST /profile/avatar/confirm      -> 200   { avatarUrl: https://api-production-b93e.up.railway.app/users/<uid>/avatar?v=<hash> }
GET  /users/<uid>/avatar (anon)   -> 302   Location: https://t3.storageapi.dev/studyhall-avatars-ngavql0/avatars/<uid>/<uuid>.png?X-Amz-...
GET  <presigned storage URL>      -> 200   Content-Type: image/png, 136 bytes, PNG-signature valid
GET  /me (after reload)           -> 200   avatarUrl present
```

userId under test: `21984eb2-8029-4c1b-9e73-bc586a0be4d2`

Note: the app-side `fetch()` to the avatar URL with `credentials:'include'` throws `TypeError: Failed to fetch` (cross-origin image lacks CORS headers for credentialed fetch) — this is a fetch-API artifact only and does **not** affect `<img>` rendering, which is not CORS-gated and succeeds (naturalWidth=64). The anonymous request-context GET above confirms the real 302→200 chain cleanly.

## Screenshots
- `/home/claudomat/e2e/shots/20-rendered.png` — full app after upload + reload (avatar visible bottom-left)
- `/home/claudomat/e2e/shots/21-panel-zoom.png` — zoom of profile panel showing rendered pink avatar (uploaded PNG was solid magenta rgb 220,40,120)
- `/home/claudomat/e2e/shots/04-postlogin.png` — post-login `/app`
- `/home/claudomat/e2e/shots/02-login.png` — login form

## Test artifacts (driver scripts + captured data)
- `/home/claudomat/e2e/full2.js` — login → in-page upload flow → render/persistence check
- `/home/claudomat/e2e/verify.js` — anonymous 302→200 avatar-GET verification
- `/home/claudomat/e2e/avatarUrl.txt` — last avatar URL

---

## Findings

### F1 — MAJOR (frontend, pre-existing / out-of-scope for this backend wave): the profile-settings UI entry point is a dead button; the avatar-upload UI is unreachable through the interface
- The bottom-left sidebar control `button[aria-label="Your profile and settings"]` (which shows the ST avatar + username + hover mic/gear icons) has **`onMouseEnter`/`onMouseLeave` but no `onClick`** in the shipped bundle (`assets/index-DCKZ02HB.js`). The mic and gear glyphs are `aria-hidden="true"` decorative `opacity-0 group-hover:opacity-100` spans — not interactive.
- Runtime-confirmed: real mouse down/up, `.click()`, keyboard Enter/Space on the button open **no** settings panel/modal (no `input[type=file]`, no dialog, no route change, no network, no console error).
- Static-confirmed: a full-bundle scan for any settings-open trigger (`openSettings|SettingsOpen|showSettings|settingsOpen|ProfileModal|openProfile|SettingsModal`) returns **zero** matches. The avatar-upload component exists (the "Choose file…" button → `input[type=file][aria-label="Avatar file upload"]` → `presignAvatar`/`confirmAvatar` handlers) but nothing in the client mounts/opens the panel that contains it.
- **Impact:** a real user cannot open profile settings, therefore cannot upload an avatar through the UI. The happy-path *click-through* is blocked.
- **Scope note:** this is a frontend wiring gap in the earlier-wave settings UI, independent of the wave-38 backend storage go-live. This wave's ACs (presign no longer 503, PUT/confirm succeed, avatar renders via the redirect endpoint) are **all validated** by exercising the app's real (SuperTokens-wrapped) fetch pipeline and the real `<img>` render/persistence. Recommend routing F1 to a frontend fix (wire the profile-settings open handler) so the shipped storage capability is actually reachable by users.

### F2 — INFRA (test tooling): all 10 Playwright MCP instances are unusable in this environment
- Every `playwright-*` MCP server (`@playwright/mcp@latest`, no `--browser` arg) fails on first browser action with `Chromium distribution 'chrome' is not found at /opt/google/chrome/chrome`. The current `@playwright/mcp` default resolves the `chrome` channel (system Google Chrome), which is not installed; only bundled chromium exists (`~/.cache/ms-playwright/chromium-1228`). `npx playwright install chrome` requires root (blocked); `/opt` is root-owned (cannot create the path).
- **Workaround used (non-privileged):** drove the E2E directly via `playwright-core` against the bundled chromium binary (`executablePath` → the cache chromium). This provided real browser interaction, network capture, screenshots, and `naturalWidth` assertions — equivalent evidence. **No MCP `browser_close` was ever issued** (the MCP was never successfully initialized), so no shared MCP instance was affected for sibling testers.
- **Recommend:** pin the MCP config to `"args": ["-y","@playwright/mcp@latest","--browser","chromium"]` in `.mcp.json` so the swarm uses the installed bundled chromium instead of the missing chrome channel.
