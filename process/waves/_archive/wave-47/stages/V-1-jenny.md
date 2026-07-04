# V-1 jenny — wave-47 semantic conformance (deployed behavior vs spec-contract intent)

**Reviewer:** jenny (independent; did NOT see Karen's output)
**Deployed web:** https://web-production-bce1a8.up.railway.app · **api:** https://api-production-b93e.up.railway.app
**Fixtures:** User A `studyhall-e2e-fixture@example.com` (userId `21984eb2-8029-4c1b-9e73-bc586a0be4d2`) · User B `studyhall-e2e-fixture-b` (userId `da74148e-132e-4faf-a526-a34c28e7481b`), co-members on server ad62cd12.
**Spec source of truth:** `tasks.description` of 10967558 + 379978a4 (DB row); convenience copy `process/waves/wave-47/stages/P-2-spec.md`.
**Method:** real click-through via Playwright MCP (browser left open, no browser_close) + network capture + deployed-bundle string check + backend source read.

---

## HEADLINE — DMs startable via UI: **CONFIRMED**

The exact wave-46 F-A dead-end is CURED. Full click-path proven live as User A:

1. Rail → **Direct Messages** (`button[aria-label="Direct Messages"]`) → DmHome renders (`data-testid="dm-home"`).
2. **Start Direct Message** (`data-testid="start-dm-button"`) → picker opens (`data-testid="start-dm-picker"`).
3. Picker **LISTS real co-member B** — `studyhall-e2e-fixture-b` (`data-testid="dm-picker-member-da74148e-...b"`). NOT zero candidates.
   - Populated by **GET /dm/candidates → 200** (network req #24). NO `GET /servers/:id/members` call fired.
   - Evidence screenshot: `apps/web/wave47-picker-lists-candidate-B.png`.
4. Select B → confirm **"Open DM"** (`dm-picker-confirm`) → picker closes, existing thread opens (find-or-create; single conv row `dm-conv-row-5f62052f-...`, no duplicate).
5. Composer send ("V-1 jenny F7 check 1783176000 optimistic author") → **POST /dm/conversations/5f62052f.../messages → 200** (single POST, req #27).
6. Sender's OWN message renders author **`studyhallfixturea`** (own displayName), **NOT "Unknown user"**. "Unknown user" appears NOWHERE in the DM view. Evidence: `apps/web/wave47-F7-own-message-shows-displayname.png`. Persisted server-side once, `authorId=21984eb2...` (A's true users.id).

---

## VERDICT: APPROVE

Every acceptance criterion of both claimed tasks is satisfied by deployed behavior. No spec drift, no spec gap, no journey dead-end. Findings below are all PASS; two are informational notes (no action required).

---

## Findings (each cites spec section + deployed evidence)

### F1 — HEADLINE: DM startable end-to-end via UI — PASS (Critical / cures wave-46 F-A CRITICAL)
Spec: task 10967558 AC "the DM feature is now STARTABLE end-to-end through the UI (resolves wave-46 F-A CRITICAL)".
Deployed: full click-path above completed. Picker lists a real candidate, thread opens, message sends + persists. GET /dm/candidates returned `[{"userId":"da74148e-...","displayName":"studyhall-e2e-fixture-b","avatarUrl":null}]`.

### F2 — Candidate SOURCE = server co-members (scope fence) — PASS
Spec: task 10967558 AC3 + SCOPE FENCE ("candidate SOURCE is GET /dm/candidates — NOT /servers/:id/members"; "server co-members ONLY — NO global directory, NO server-side typeahead/search endpoint").
Deployed: picker fired only `GET /dm/candidates` (no `/servers/:id/members`). Backend `dm.service.ts:677-721` computes DISTINCT co-members of caller's servers (`inArray(server_id, callerServerIds)`), no directory. Controller `dm.controller.ts:166-172` takes session-auth only, **no query/search param** — no server-side typeahead. Scope fence intact.

### F3 — Self-exclusion — PASS
Spec: task 10967558 edge-case "caller excluded from own candidate list" + task 379978a4 AC "self correctly excluded (matching id-spaces)".
Deployed: live `GET /dm/candidates` for A returned ONLY B; A (`21984eb2...`) absent. Picker UI shows only `studyhall-e2e-fixture-b`; no `studyhallfixturea` row. Backend `ne(alias.user_id, callerId)` (`dm.service.ts:705`). Client self-id = `profile?.userId` true opaque id (`DmHome.tsx:30`), same id-space as candidates.

### F4 — wave-46 F7 "Unknown user" cured (optimistic author) — PASS (id-space fix, task 379978a4)
Spec: task 379978a4 AC "sender's OWN optimistic DM message renders sender's display name, NOT 'Unknown user'".
Deployed: freshly sent message rendered author `studyhallfixturea`; "Unknown user" absent from entire DM view. `DmHome.tsx:30` sources `currentUserId = profile?.userId` (true users.id, NOT `profile?.username`). Candidate/participant/author ids all share the opaque `users.id` space (verified: candidate testid embeds `da74148e-...`; persisted authorId `21984eb2...`).

### F5 — who_can_dm filter (nobody excluded; everyone + server-members pass) — PASS
Spec: task 10967558 AC "who_can_dm='nobody' EXCLUDED; 'everyone' AND 'server-members' both PASS".
Deployed backend: `ne(users.who_can_dm, 'nobody')` in candidate query (`dm.service.ts:706`); create-time enforcement retained (`enforceWhoCanDm`, `dm.service.ts:129-189`, rejects 'nobody' 403). B (who_can_dm default) correctly present. (No 'nobody'-configured fixture available to click live; backend filter verified in source + is the same predicate exercised by the returned list.)

### F6 — Empty state copy (calm, not the old dead-end) — PASS
Spec: task 10967558 AC "calm 'No one to message yet — join a study server with others' (NOT the broken 'Join a server to find people' dead-end)".
Deployed bundle `index-BdScRcT1.js`: contains "No one to message yet — join a study server with others" (true-empty branch, `StartDmPicker.tsx:299`); does NOT contain old "Join a server to find people". Loading state ("Loading…", `dm-picker` spinner) present. (True-empty account not reachable — A has a co-member — so verified via deployed-bundle string + render path per instruction.)

### F7 — Client-side name filter + "No people match" — PASS
Spec: task 10967558 AC "client-side name filtering retained" + "No people match" empty-filter state.
Deployed: typed "fixture-b" → B stays; typed "zzzznomatch" → `No people match "zzzznomatch"`. Client-only filter (`StartDmPicker.tsx:117-119`), no network call on keystroke.

### F8 — Find-or-create (re-pick existing 1:1 opens existing thread, no duplicate) — PASS
Spec: task 10967558 AC "re-picking an existing 1:1 opens the existing thread".
Deployed: picking B (who already had conv `5f62052f...`) opened that same conv; conversation list still showed ONE row; confirm button read "Open DM" (not "Create Group"). Message POSTed to existing conv id; no new conversation created.

### F9 — Journey continuity (no dead-end / broken back / unhandled error) — PASS
Spec: semantic ALSO-VERIFY #6.
Deployed: picker Cancel closes cleanly → returns to DmHome, no error/dead-end. Picker reopens repeatably. 0 console errors across the flow (1 benign warning only). Sent message persisted (GET messages → 200, 28 msgs, exactly 1 copy of the new message).

---

## Spec drift vs spec gap
None. No divergence found — all deployed behavior matches spec-contract intent. Nothing to classify as code-wrong (drift) or spec-didn't-anticipate (gap).

## Informational notes (no action)
- N1: `/dm/candidates` returns a **bare array** (not a `{items:[]}` envelope). Spec explicitly permits this ("DmCandidateListResponse (or bare array)"). PASS.
- N2: displayName falls back to `email.split('@')[0]` when `users.display_name` is null (`dm.service.ts:715`). Cosmetic-safe; B has a real display_name so live output is clean. Within spec (DmCandidate.displayName is a string). No action.

## Evidence artifacts
- `apps/web/wave47-picker-lists-candidate-B.png` — picker listing co-member B.
- `apps/web/wave47-F7-own-message-shows-displayname.png` — own sent message shows `studyhallfixturea`, not "Unknown user".
- Network: GET /dm/candidates #24 (200); POST /dm/conversations/5f62052f.../messages #27 (200); no /servers/:id/members call.
- Deployed bundle `index-BdScRcT1.js`: new empty-state present, old dead-end absent.
