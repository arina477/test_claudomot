# V-1 jenny — wave-26 semantic-spec verification (deployed behavior vs spec intent)

**Verdict: APPROVE**

**Spec contract:** `tasks.description` of `10b9d18e-5071-41dc-85de-ef257b9dfde0` (5 ACs + edge cases + out-of-scope), copy at `process/waves/wave-26/stages/P-2-spec.md`.
**Deployed target:** web `https://web-production-bce1a8.up.railway.app/` bundle `index-BAcJ6YNx.js` (confirmed live this session — `curl` on `/` returns `index-BAcJ6YNx.js`, matching T-5 re-verification); api `https://api-production-b93e.up.railway.app` (`GET /profile` route live — 401 unauth). Merges 1543a4e (#38) + 12b5ec2 (#39 self-presence fix).
**Method:** semantic-intent verification — cross-read the spec ACs against (a) shipped source of the deployed bundle, (b) T-5 live-prod E2E evidence (2 fix-up runs on `index-BAcJ6YNx.js`), (c) live curl on the deployed web + api, (d) the domain presence enum. Playwright MCP chrome-channel absent (session infra defect per T-5 rule 1); relied on the T-5 live DOM evidence + deployed-source code-read + live route probes rather than re-driving bundled Chromium, since T-5 already captured the exact deployed DOM twice with no flake.

---

## Per-AC verdict

### AC1 — message-row author avatar renders presence dot, updating live — MET
- `AuthorPresenceDot` (`apps/web/src/shell/MessageList.tsx:951-974`) is mounted per message row (`:1068`), keyed by `msg.authorId` (which equals the author's `userId` — confirmed at spec "authorId=userId identity" and MVP note line 321).
- Live update: subscribes to the shared store via `subscribePresence` (`:960`) and re-derives status on every presence event; only calls `setState` when *that* author's value changed (`:963`). No reload required.
- **Deployed behavior (T-5, 2/2 runs on live bundle):** self-authored message-row author avatar renders `presence-dot-inner` with inner bg `rgb(16,185,129)` emerald + `sr-only "Online"`; 23/24 and 24/25 rows dotted. This is the exact element that was ABSENT pre-fix and is now present. Semantic intent satisfied on live prod.

### AC1 self-author edge case ("dot reflects viewer's own presence, online while connected") — MET (faithful, no new gap)
- The spec's self-edge was NOT met by the original impl (server `presence:snapshot` excludes self via `getCoMemberUserIds`, so `hasPresence(ownUserId)` was false → `AuthorPresenceDot` returned null). Fix: `seedSelfPresence(userId)` (`presenceSocket.ts:191-196`) called once from `ProfileContext` (`ProfileContext.tsx:63-67`) when `profile.userId` loads, seeding self → `'online'`. The server-side half is deployed: `GET /profile` returns `userId` (`apps/api/src/profile/profile.controller.ts:38-44`; `ProfileResponseSchema` includes `userId: z.string()` at `packages/shared/src/profile.ts:4`).
- **Spec-gap watch (the assigned concern) — CLEARED.** The worry "self always shows online even if the app thinks they're away" does not apply: `PresenceStatus` is a strict binary enum `z.enum(['online','offline'])` (`packages/shared/src/presence.ts:8`) — there is NO away/idle state anywhere in the domain. The spec itself defines the edge as "online while connected." Since "connected ⟹ online" is the domain's own definition of online, seeding self→online at session load is a **faithful satisfaction** of the edge, not a fabricated default. Server-emitted `presence:offline` for self can still overwrite the seed (`seedSelfPresence` only seeds if absent; the store's offline handler always wins) — offline is a KNOWN state, so a dot still renders. No new gap introduced.

### AC2 — single shared `PresenceDot` at BOTH surfaces, one styling source, no hard-coded hexes for the dot color — MET
- One component `PresenceDot` (`apps/web/src/shell/PresenceDot.tsx`) consumed by both surfaces: member panel (`MemberListPanel.tsx:32,93`) and message rows (`MessageList.tsx:30,973`).
- Dot color derives from tokens, not hexes: `online ? 'var(--color-accent-emerald)' : 'var(--color-surface-500)'` (`PresenceDot.tsx:60`). T-5 live DOM confirms `background-color: var(--color-accent-emerald)` computing to `rgb(16,185,129)` on both surfaces.
- **Minor note (not a rejection):** the outer ring background `#121214` is a hard-coded hex (`PresenceDot.tsx:47`), and member/message row *avatar* backgrounds use hexes (`#27272a` etc.). Spec scopes the "no hard-coded hexes" clause to the **dot color** ("both derive color from the shared presence token") — the emerald/surface tokenization is the load-bearing requirement and it is met. The mask-ring hex is a single value inside the one shared component (still one styling source), so AC2's "exactly one dot-styling source" holds. Flagged as low-severity polish, not spec-drift.

### AC3 — unknown-presence author → NO dot (graceful degrade, no default-online) — MET
- `AuthorPresenceDot` tri-states on `hasPresence(authorId)` (`presenceSocket.ts:158-160`): absent → `status=null` → `return null` (no dot) (`MessageList.tsx:954,971`). No false default-online.
- **Self-fix scoped to self only (the assigned check):** `seedSelfPresence` seeds ONLY `profile.userId` (`ProfileContext.tsx:64`); all other authorIds remain subject to normal snapshot/event resolution (documented `presenceSocket.ts:187-189`). The fix did NOT seed everyone online — AC3 degrade path intact for non-co-member authors.
- T-5 pre-fix cycle demonstrated the degrade branch firing live (unknown self → no dot); post-fix only self flipped to online, others unchanged.

### AC4 — no additional /presence socket; author dots + member panel share ONE store/socket — MET
- Single lazy socket singleton `getPresenceSocket()` (`presenceSocket.ts:84-141`); `_socket` created once, kept for session. `AuthorPresenceDot` reads the SAME store via `subscribePresence`/`getPresenceStatus`/`hasPresence` — no new `io()` call (`MessageList.tsx:48`). Member panel uses the same store via `usePresence` → `subscribePresence` (`usePresence.ts:34`, `MemberListPanel.tsx:34,162`). Exactly one `/presence` socket at runtime.

### AC5 — member-panel dot refactored onto shared component, no behavioral regression — MET
- Member panel renders the shared `<PresenceDot online={online} />` (`MemberListPanel.tsx:93`) — inline dot replaced. Presence resolution unchanged (`usePresence` + `getStatus`, `MemberListPanel.tsx:162,202`).
- **Deployed behavior (T-5, both runs):** 25–26 member-row `presence-dot-inner` dots, all emerald `rgb(16,185,129)`; a11y `sr-only` labels reachable, `suppressed: 0`. No regression from the refactor or from the self-seed fix.

---

## Cross-ref product-decisions (drift check) — NO DRIFT
- `product-decisions.md:319-321`: override-ship of under-floor wave-26 (10b9d18e) via extracted shared `PresenceDot`; problem-framer REFRAME accepted (surface the shared-PresenceDot extraction that AC2 hides — member-panel dot was inline hard-coded hexes). The shipped impl matches this framing exactly: a real component now backs both surfaces.
- ceo-reviewer note (`:321`): "presence = Discord table-stakes not the wedge; **academic study-status is the real future differentiator** → future roadmap-refresh item." The spec's out-of-scope explicitly parks "study-status beyond online/offline," and the shipped enum is binary online/offline only. The wave did NOT drift into study-status — it stayed inside the table-stakes online/offline scope, correctly deferring the differentiator. Consistent, no drift.
- Out-of-scope (DM/mention/hover → sibling fdb444fc; hover cards; study-status; animation): none present in the shipped dot. `MemberItem` hover only recolors the row background (`MemberListPanel.tsx:64-69`) — pre-existing, not a new hover affordance on the dot.

---

## Findings summary

| ID | AC | Type | Severity | Status |
|----|----|------|----------|--------|
| — | AC1 + self-edge | — | — | MET (live, 2/2 T-5 runs) |
| — | AC2 | — | — | MET |
| J1 | AC2 | spec-gap (cosmetic) | Low | outer-ring mask + avatar bgs use hex `#121214`/`#27272a`; spec's no-hex clause scopes to *dot color* (tokenized ✓). Single value inside the one shared component. Polish only — NOT a rejection. |
| — | AC3 | — | — | MET (self-fix scoped to self; degrade intact) |
| — | AC4 | — | — | MET (one socket/store) |
| — | AC5 | — | — | MET (no regression, live) |
| — | self-edge new-gap | — | — | CLEARED (binary enum, no away state → seed-online is faithful, not a fabricated default) |

**No spec-drift. No spec-gap of consequence.** The one low-severity note (J1) is outside the spec's tokenization scope (dot color) and does not fail any AC.

## Verdict: APPROVE
All 5 ACs and the self-author edge case are satisfied by DEPLOYED behavior on `index-BAcJ6YNx.js` (T-5 live evidence, 2/2 runs, no flake) and confirmed by deployed-source read + live route probes. The self-presence-seed fix is a faithful satisfaction of the spec's "online while connected" edge — it introduces no new gap because the presence domain has no away/idle state to misrepresent. AC3 degrade is preserved (fix scoped to self only). No drift against product-decisions.
