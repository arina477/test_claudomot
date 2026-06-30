# T-8 — Security (wave-15 M3 @mentions) — LOAD-BEARING

**Pattern:** B — Active-execution against deployed prod with TWO DISTINCT authenticated clients. **wave_type includes `auth`** (my-mentions authz + membership-scoped resolution); T-8 fires non-auto-promoted. Applicable probes: auth-smoke (session reuse), authz/IDOR, realtime authz, secret-grep.

**Fixtures (two distinct verified co-members of proof server ad62cd12):**
- A = studyhall-e2e-fixture (uid 21984eb2-...), username `studyhallfixturea`
- B = studyhall-e2e-fixture-b (uid da74148e-...), username `studyhallfixtureb`
Both authenticated via SuperTokens header-mode signin (status OK, /me emailVerified:true). Usernames set via PATCH /profile for resolution (fixture prep, T-5).

---

## (a) LOAD-BEARING — Two-client mention realtime (the B-6 H-1 fix) — **PASS**

The H-1 dead-feature fix (per-user `user:<userId>` room + `mention.created` → `mention` event decoupled from channel rooms) is **ALIVE in prod**, verified with two distinct clients via socket.io-client wire-level probe:

- B connected to `/messaging` and did **NOT** join the channel A posts to (B is NOT viewing that channel).
- A sent a message mentioning B via REST (`POST /channels/93982063.../messages`, 201, `mentions:[{userId:B, username:studyhallfixtureb}]`).
- **B received the `mention` event** on its per-user room:
  `{messageId, channelId:"93982063...", channelName:"general", serverId:"ad62cd12...", mentionedUserId:"da74148e..." (=B)}` — correct channel + correct recipient.
- B received **0** `message:new` events (B is not in the channel room — the mention rides the dedicated per-user room exactly as the H-1 fix intended; NOT a channel-room leak).

This is genuine cross-user delivery to a non-viewing client, not self-echo. The headline "realtime unread badge" feature works as specified. **Browser-side confirmation:** the #general channel row showed unread count "4" that cleared to "general" on open (T-5 S5) — the badge increments from the live mention path + bootstrap and clears on view.

## (b) LOAD-BEARING — my-mentions authz (session-derived, no cross-user read) — **PASS**

- **B GET /me/mentions** → exactly 1 item (the message A sent mentioning B); every returned item contains B's userId in `mentions[]`; 0 items fail the check.
- **A GET /me/mentions** → exactly 1 item (A's self-mention); every item mentions A; 0 fail. Critically, A does **NOT** see the message A *authored* mentioning B — proving the filter is `mentioned_user_id = viewer`, not "messages I sent." No author-leak.
- **IDOR / param-injection:** A calling `GET /me/mentions?userId=<B's uid>` still returns only A's 1 item — the param is ignored; scoping is purely session-derived. **No IDOR; a user cannot read another user's mentions.**
- **401 unauthed:** `GET /me/mentions` with no session → **401** (confirmed at C-2 + re-confirmed live here).

## (c) LOAD-BEARING — membership-scoped resolution (no leak) — **PASS**

- A @mentions a **non-member token** (`@nonexistentuser999`) → message persists with `mentions: []` (stays plain text, no row, no notify). Confirmed both at REST (empty array) and in the rendered UI (plain text, no pill — T-5 S4).
- A @mentions B (a co-member) → resolves to B. Resolution only matches server members with a non-null username.

## (d) unauthed /me/mentions → **401** — PASS (see (b)).

## (e) author NOT self-badged for own @mention — **PASS**

- A connected to `/messaging`; A sent a message mentioning **only itself** (`@studyhallfixturea`) → A received **0** `mention` events (server-side author-exclusion in the per-recipient emit loop). The message still persists A's self-mention row (allowed per spec edge-case), but no realtime self-badge fires.

## Edit-diff authz/correctness (bonus — spec AC5) — PASS

- A edits a plain message to ADD `@studyhallfixtureb` → `mentions:[B]`, `isEdited:true`.
- A edits again to REMOVE the mention → `mentions:[]` (row removed). Edit-diff add/remove round-trips correctly (M-4 non-transactional carry accepted; reconverges).

## Action 5 — Secret / credential leak grep — **CLEAN**

`git diff fd86540^..fd86540` filtered for credentials (excluding session-token vocabulary + test descriptions): **0 matches.** No api-key / secret / password / bearer-literal in the wave diff. (C-1 gitleaks blocking scan also passed.)

## Findings

No Critical, no High. All five load-bearing checks PASS live. Carried debt unchanged (M-1..M-4, L-1..L-6, accepted at B-6). The only T-block infra finding is T5-F1 (MCP misconfig). Note **T8-OBS (info):** the live cross-user authz path is now PROVEN with two distinct verified users this wave (closes the recurring wave-10..13 "403/authz path not live-probed, fixture-gated 4a2ad286" carry FOR THE MENTION SURFACE) — the persistent verified-fixture-pair (A+B) is now established and load-bearing.

```yaml
test_pattern: active
skipped: false
auto_promoted: false
applicable_probes: [auth_smoke, authz_idor, realtime_authz, secret_grep]
auth_smoke: {positive: ["A+B SuperTokens header-mode signin OK; /me emailVerified true"], negative: ["GET /me/mentions unauthed → 401"]}
authz_idor:
  - "B /me/mentions → only B's mentions (1 item, all mention B, 0 leak)"
  - "A /me/mentions → only A's mentions (1 item, all mention A; does NOT include A-authored msg mentioning B)"
  - "A /me/mentions?userId=B → param ignored, still A-scoped (no IDOR)"
  - "membership-scoped resolution: @nonexistentuser999 → mentions:[] (plain text, no row)"
realtime_authz:
  - "TWO-CLIENT: B (not in channel room) receives 'mention' event for correct channel+recipient when A mentions B; 0 message:new leak (H-1 fix ALIVE)"
  - "author self-exclusion: A self-mention → A receives 0 mention events"
session_results: null
rate_limit_results: null
secret_grep_findings: []
fix_up_cycles: 0
findings:
  - {severity: info, category: authz, description: "T8-OBS — cross-user mention authz + two-client realtime PROVEN live with two distinct verified fixtures (A+B). Closes the recurring fixture-gated live-authz carry (4a2ad286) for the mention surface."}
```

```yaml
head_signoff:
  verdict: APPROVED
  stage: T-8
  reviewers: {}
  failed_checks: []
  rationale: >
    Every load-bearing security check passes against live prod with two distinct authenticated clients,
    which is the bar for this auth wave. The B-6 H-1 fix is genuinely alive: a client not viewing the
    target channel still receives the per-user 'mention' event for the correct channel and recipient, and
    receives zero channel-room message:new events — real cross-user delivery, not self-echo. my-mentions
    authz is session-derived and IDOR-closed: each user sees only messages that mention them (not messages
    they authored), and a ?userId= param is ignored. Membership-scoped resolution holds (non-member token
    stays plain text, no row). The author is never self-badged on the realtime path (server-side
    exclusion). Unauthed is 401, edit-diff add/remove round-trips, and the secret-grep is clean (0
    matches, gitleaks also passed at C-1). No Critical, no High. This wave also closes the long-running
    fixture-gated live-authz carry by proving the path with the now-established A+B verified-fixture pair.
  next_action: PROCEED_TO_T-9
```
