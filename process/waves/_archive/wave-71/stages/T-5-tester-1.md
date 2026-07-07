# T-5 Live E2E Test — Tester 1 — wave-71 M14 Block UI-polish

**Target:** PRODUCTION — web `https://web-production-bce1a8.up.railway.app` · api `https://api-production-b93e.up.railway.app`
**Deployed on merge:** 670c46e (Block UI polish)
**Date:** 2026-07-07
**Session:** Fixture A `studyhall-e2e-fixture@example.com` (userId `21984eb2-8029-4c1b-9e73-bc586a0be4d2`, username `studyhallfixturea`) — session already active on load.
**Target member:** Fixture B `studyhall-e2e-fixture-b` (userId `da74148e-132e-4faf-a526-a34c28e7481b`, username `studyhallfixtureb`).
**Server under test:** Fixture Proof Server (ad62cd12).
**Console errors across whole session:** 0 (1 unrelated warning only).

## Verdict table

| # | Scenario | Runs | Verdict | Evidence |
|---|----------|------|---------|----------|
| 1 | Member-row Block↔Unblock LIVE toggle (primary P0 fix) | 2× full cycle | **PASS** | Both runs: Block → confirm → row flipped to Unblock live (no reload, URL unchanged); Unblock → row flipped back to Block live. POST /blocks 201 + DELETE /blocks/:id 204 each run. |
| 2 | Enriched blocked-users list — real names not UUIDs | 2× | **PASS** | Settings row shows display name `studyhallfixtureb` + `@studyhallfixtureb` + "ST" avatar initials. NO UUID in visible text. GET /blocks returns `blockedUser{displayName,username,avatarUrl}`. Loading skeleton (`blocked-users-loading`) + empty state both confirmed. |
| 3 | Own-row affordance suppressed (isSelf) | 1× | **PASS** | Self row (`21984eb2`) has NO block/report button; other row (`da74148e`) has block+report+kebab. |
| 4 | Cross-surface consistency (shared store/fetch) | 2× | **PASS** | Block from member row → appears in /settings/privacy list without manual refresh. Unblock from settings → member row flips back to Block. Both directions verified. |

Overall: **4/4 PASS. No FAIL. No FLAKE.** The two behaviors this wave exists to deliver — live member-row flip and enriched (named) blocked list — both work on prod.

## Scenario 1 — Member-row Block↔Unblock LIVE toggle (PRIMARY FIX / spec-A FINDING-1)

The exact P0: previously the row stayed "Block" after blocking; the fix makes it flip to "Unblock" without reload.

- **Baseline:** Fixture B row block button `aria-label="Block studyhall-e2e-fixture-b"`, testid `block-member-btn-da74148e...`. (Note: affordance is hover-revealed via `opacity-0 group-hover:opacity-100`; row lives in the "Offline — 1" section of the member panel.)
- **Confirm dialog:** clicking Block opens in-app dialog "Block studyhall-e2e-fixture-b? They won't be able to DM you and you won't see their content in servers. This action won't notify them." with `block-dialog-cancel` / `block-dialog-confirm`.

**Run 1** (block only, live-flip check):
- Confirm → row testid `block-member-btn-*` REPLACED by `unblock-member-btn-*` (`aria-label="Unblock studyhall-e2e-fixture-b"`), URL still `/app`, no navigation.
- Network: `POST /blocks` → **201**, body `{"blockedUserId":"da74148e-132e-4faf-a526-a34c28e7481b"}`, then `GET /blocks` 200 (store refetch).

**Run 2** (full Block→Unblock→Block cycle):
- Block → confirm → row flipped to Unblock live (`affordance: "Unblock"`, URL unchanged).
- Unblock (no confirm dialog for unblock — immediate) → row flipped back to Block live (`affordance: "Block"`).
- Network: `POST /blocks` 201 → `GET /blocks` 200 → `DELETE /blocks/da74148e...` **204**.

Consistent across both runs — no flake. Live toggle without reload confirmed.

Evidence: `s1-baseline-member-list-block.png`, `s1-run1-confirm-dialog.png`, `s1-run1-flipped-to-unblock.png`.

## Scenario 2 — Enriched blocked-users list (spec-B FINDING-2)

At `/settings/privacy` → "Blocked Users" panel (`blocked-users-panel`):

- **Enriched row (2× confirmed):** `blocked-row-da74148e...` renders visible text `ST` (avatar initials fallback) / `studyhallfixtureb` (display name) / `@studyhallfixtureb` (username) / Unblock. UUID-regex over visible text = **false** — NO raw UUID leaks.
- **GET /blocks response DTO (enrichment working end-to-end):**
  ```json
  {"blocks":[{"id":"f7004bb3-...","blocker_id":"21984eb2-...","blocked_id":"da74148e-...","created_at":"...","blockedUser":{"userId":"da74148e-...","displayName":"studyhallfixtureb","username":"studyhallfixtureb","avatarUrl":null}}]}
  ```
  `avatarUrl:null` → the "ST" initials fallback renders (correct — Fixture B has no uploaded avatar).
- **Loading skeleton:** with GET /blocks delayed 1.2s (route interception), panel rendered `data-testid="blocked-users-loading"` (no rows) before resolving. Confirmed.
- **Empty state:** after unblocking everyone, panel shows "You haven't blocked anyone / When you block a user for your safety, they will appear here." Confirmed.

Evidence: `s2-blocked-list-enriched-name.png`, `s2-blocked-list-loading-skeleton.png`, `s2-blocked-list-empty-state.png`.

## Scenario 3 — Own-row affordance suppressed (spec-D)

Member panel enumerated two rows:
- Self `member-row-21984eb2...` (`studyhall-e2e-fixture` / Fixture A): `hasBlockBtn:false`, `hasReportBtn:false` — no moderation affordance.
- Other `member-row-da74148e...` (Fixture B): block + report + mod-kebab present.

isSelf suppression works; affordance appears only on non-self rows.

## Scenario 4 — Cross-surface consistency (shared store / single fetch)

- **Member row → Settings:** blocking Fixture B from the member row made it appear in `/settings/privacy` blocked list (no manual refresh).
- **Settings → Member row:** unblocking from `/settings/privacy` returned the member row to the "Block" affordance (`affordance:"Block"`).

Both surfaces stay in sync — one shared fetch/store, confirmed both directions.

## Network summary (representative)

| Method | Endpoint | Status | Body / notes |
|--------|----------|--------|--------------|
| POST | /blocks | 201 | `{"blockedUserId":"da74148e-132e-4faf-a526-a34c28e7481b"}` |
| GET  | /blocks | 200 | enriched: `blockedUser{userId,displayName,username,avatarUrl}` |
| DELETE | /blocks/da74148e-132e-4faf-a526-a34c28e7481b | 204 | `:userId` path param |

## CLEANUP (prod-clean) — COMPLETE

Unblocked Fixture B (id `da74148e-132e-4faf-a526-a34c28e7481b`) — the only user blocked during this test. Server-side verified: `GET /blocks => 200 {"blocks":[]}`. Prod is back to no-blocks state.

## Findings

- No FAIL, no FLAKE. Both wave-71 target behaviors (live member-row flip P0 fix; enriched named blocked list) verified live on prod, each ≥2×.
- Minor (cosmetic, not a wave-71 regression): the member-row Block/Report/kebab affordances are hover-only (`opacity-0 group-hover:opacity-100`) and require a wide enough viewport for the member panel to render (panel was off-screen at default width; visible after resize to 1600px). This matches intended hover-reveal UX; noted only for future keyboard/touch-accessibility review, out of scope for this wave.

## Screenshots (all under `/home/claudomat/project/.playwright-mcp/`)

- `s1-baseline-member-list-block.png`
- `s1-run1-confirm-dialog.png`
- `s1-run1-flipped-to-unblock.png`
- `s2-blocked-list-enriched-name.png`
- `s2-blocked-list-loading-skeleton.png`
- `s2-blocked-list-empty-state.png`
