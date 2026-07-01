# Wave 31 — P-4 Verdict

**Reviewer:** head-product (fresh spawn, P-4 Phase 1)
**Reviewed against:** process/waves/wave-31/blocks/P/review-artifacts.md
**Attempt:** 1  (1 = first gate)
**Phase:** 1 (head-product)

## Verdict
APPROVED

## Rationale
This wave aims squarely at M6's mvp-critical claim ("students drop into a Study Room voice channel and talk"), and the token-mint is the correct load-bearing first slice — it de-risks the hardest infrastructure (a server-side, short-lived, room-scoped credential that keeps the API secret off the media path) before any client polish. Both spec blocks are build-ready: every acceptance criterion is independently verifiable (HTTP status codes and a JWT that a unit test decodes for room/identity/ttl/grants), the security is specified precisely at the right layer, the plan maps every AC to a step with correct specialist routing and a completed SDK pre-build, and the D-block dependency is correctly sequenced (design the voice-room UI before B-3 builds to it). The LiveKit credential gap is handled correctly — the build is credential-independent (placeholder key + unit decode), and the account key/secret is surfaced to the founder as a proactive heads-up for the later live-connect verification rather than escalated now, because nothing in this wave's buildable scope is blocked by its absence. Scope is held to the wedge: occupancy is correctly split out and the keep-OUT list (screen-share, auto-downgrade, presence rings, grid, reconnection) is respected — no gold-plating.

## Gate findings (walked per stage-exit checklist)

### 1. Spec quality — PASS
- **Falsifiable ACs (both blocks):** Block-1's seven ACs are all binary — 200 `{token,url}`, JWT room-scoped/identity/ttl~1h/grants (decodable in a unit test), 403 non-member, 404 missing channel, 400 non-voice, 401 unauth, and the anti-pattern import guard. Block-2's five ACs are render/wire/error-state verifiable without a live server. No aspirational language.
- **Security specified correctly:** session gate (AuthGuard) + membership gate on `RbacService.canViewChannelById(userId, channelId)` — the **channel-id-only check, explicitly NOT the 2-param ChannelPermissionGuard** (spec AC #3 calls this out verbatim, matching problem-framer's precision that the 2-param guard reads serverId from req.params.id and would 403 the serverId-less voice-token route). Channel-load-for-404-vs-403 is correctly specified (the spec notes canViewChannelById returns false, not throw, on missing → 404 must be distinguished from 403). Voice-type check → 400. All correct.
- **API secret server-side:** explicit anti-pattern guard AC in BOTH blocks (livekit-server-sdk / AccessToken in apps/api ONLY; a build/lint/test asserts no import under apps/web). Correct — this is the load-bearing security boundary for a browser-shipped bundle.
- **Token properties JWT-verifiable:** room=channelId, identity=userId, ttl~1h, grants roomJoin+canPublish+canSubscribe — all decodable, AC #2 mandates the decode test.
- **Non-happy states:** unset-creds → 503/500 (error, not malformed token); token-fetch/connect failure → clear error state (never blank/crash); ttl expiry → reconnect re-fetch. Empty/loading/error covered for both surfaces.

### 2. SECURITY-SCOPE TIGHTENED GATE — PASS (credential-issuing endpoint; T-8 in-scope)
This endpoint mints a LiveKit access token → the tightened gate applies (wave_touches ∩ credential-issuing surface ≠ ∅).
- **No cross-server voice access:** membership-gated via canViewChannelById — a user only gets a token for a voice channel in a server they belong to. Covered.
- **API secret never reaches the client:** secret stays in the service (never serialized into the 200 body), enforced by the apps/api-only import anti-pattern guard AC. Covered.
- **Short-lived tokens:** ttl~1h AC + the reconnect-re-fetches-fresh-token edge-case. Covered.
- **Runtime creds-unset → 503 (not malformed token):** explicit edge-case AC — a token endpoint must error, not silently no-op (correctly distinguished from EmailService's safe-when-unset posture). Covered.
- **T-8 routing:** P-1 security_surface + the spec header both explicitly route this to the P-4 security gate + T-8. **T-8 Security is confirmed in-scope for the T-block** — carry-forward note below.

### 3. Plan soundness — PASS
- **Every AC → a step:** P-3 Action 8 self-consistency sweep maps block-1 ACs (token, gates 401/403/404/400, JWT claims, secret-server-side, anti-pattern guard) → steps 1-4; block-2 ACs (fetch+connect-on-demand, minimal UI, follows-design, error-state, no-server-sdk-in-web) → step 5 + D-block. Complete.
- **Specialist routing:** livekit-integration owns B-2 (server token-mint) + B-3 (client), validated against AGENTS.md (its card covers both server and client); node-/react-specialist backups noted. Correct.
- **SDK pre-build done:** versions pinned (livekit-server-sdk 2.15.5, @livekit/components-react 2.9.21), method surface confirmed (`new AccessToken(key,secret,{identity,ttl})` / `.addGrant({roomJoin,room,canPublish,canSubscribe})` / `.toJwt()`), apps/api-only import boundary documented, placeholder-build path confirmed. P-3 external-SDK obligation satisfied.
- **D-block dependency correct:** design_gap_flag=TRUE → D-block fires before B-3; B-3 builds to the D-3-adopted design/voice-study-room.html, not improvised. Serial ordering B-0 → B-2 → D-block → B-3 is sound (B-2 ∥ D-block noted as possible; B-3 needs both). Architecture-respecting: reuses AuthGuard/RBAC/channels, no parallel auth path, no schema change.

### 4. LiveKit creds handling — PASS (build-now + proactive heads-up is the right call; do NOT escalate now)
- The token-mint + client are code/unit-verifiable with a placeholder key (problem-framer confirmed: assert decoded JWT claims/grants/expiry, no live connection). The build is **NOT credential-blocked**.
- The strategic decisions are settled (ceo-reviewer confirmed: LiveKit Cloud + the cost decision are Active in product-decisions 2026-Q2, not re-litigated). Only the account-issued key/secret remains — founder-supplied per rule 6, surfaced proactively so the founder can provision in parallel.
- **Verdict on the credential question:** build-with-placeholder + proactive founder heads-up is correct; this is NOT a case for a fresh founder escalation NOW. Nothing in this wave's buildable scope is blocked, so ESCALATE would be wrong (it would stall a wave that has ~1,900 LOC of credential-independent work). The live-connect verification (T-5 e2e + C-2 deploy) is where the creds become load-bearing — carried forward below (mirrors the reminders live-send deferral precedent).

### 5. Scope — PASS
- **Occupancy split (mvp-thinner):** correct — occupancy (78f51968) fails the trace test (metric is "drop in and talk," not "see who's inside first"); re-parented to NULL as a future M6 seed. The bundle is one seed (token-mint foundation) + the one sibling (client join) that must ship together to de-risk end-to-end.
- **Keep-OUT respected:** screen-share, low-bandwidth auto-downgrade, speaking/presence rings, multi-participant grid, reconnection, mic/cam toggle polish, occupancy — all deferred and referenced in the spec + P-0. No re-import.
- **Override-ship residual legitimate:** floor unmet (~1,900 LOC / 2 specs < multi-spec floor), but expansion is reviewer-EXCLUDED — re-bundling occupancy to floor-fill would defeat mvp-thinner's split. Standing override-ship precedent applies (floor_merge_attempt: 0, no fresh BOARD; M6 strategic+cost decision founder-settled; M6 zero done children → mvp-thinner wins). Correct.

## Carry-forward notes for downstream blocks
- **T-8 Security (T-block):** IN-SCOPE and non-optional. This is a credential-issuing endpoint. T-8 must exercise: (a) no cross-server voice access — a non-member of the channel's server is 403; (b) the API secret never appears in the 200 response body nor any web bundle (the anti-pattern import guard must be a live assertion, not a comment); (c) tokens are short-lived (decode exp ~1h); (d) runtime creds-unset returns 503, not a malformed/empty token. Route via the tightened security lane.
- **LiveKit creds for live-connect (T-5 / C-2):** LIVEKIT_API_KEY / LIVEKIT_API_SECRET / LIVEKIT_URL (server) + VITE_LIVEKIT_URL (client) are NOT in Railway (verified at P-0 — 0 LIVEKIT vars, despite product-decisions saying "provisioned"). The build proceeds on a placeholder key. At T-5 (e2e live connection) and C-2 (live deploy) these become load-bearing: verify LIVEKIT_* present in Railway; if absent, code-verify + flag the credential need (like reminders' live-send deferral) rather than asserting a live connection. Founder has been given a proactive heads-up to provision the LiveKit Cloud free-tier key/secret in parallel — not a rule-13 pause.
- **D-block handoff:** design_gap_flag=TRUE → next stop is D-1 Brief for the voice-study-room client join surface (seed d8a85de0 is backend-only, no UI; D-block scopes to sibling 1dd1f2ca's surface only).

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 2

---

# Wave 31 — P-4 Verdict (Phase 2 — Karen + jenny + Gemini merged)
**Phase:** 2

| Reviewer | Verdict | Detail |
|---|---|---|
| **karen** | **APPROVE** | 9/9 load-bearing claims VERIFIED: canViewChannelById:428 (boolean, returns false on missing → 404-load genuinely needed); channels.type:79; LiveKit SDK surface (AccessToken/addGrant/toJwt, apps/api-only boundary) in the doc; AuthGuard:6; greenfield VoiceModule; apps/web livekit baseline clean (0 imports); deps absent (new); livekit-integration AGENTS.md:80; offline JWT mint w/ placeholder confirmed. Security model REAL (session+canViewChannelById → no cross-server voice; secret server-side). Occupancy split honest (78f51968 re-parented NULL, still M6). **Builder notes (non-blocking, carry to B-2/B-0):** toJwt() is ASYNC → await; SDK is ESM-only → NestJS tsconfig module NodeNext or dynamic import (verify B-0/B-4); ttl assert exp-bounded not a specific hour. |
| **jenny** | **APPROVE** | 6/6 drift MATCH: faithful M6 first-slice (token-after-session + voice-join; screen-share/cam-toggle/rings/occupancy correctly deferred); LiveKit Cloud decision (product-decisions:127) matched; security model = the shipped canViewChannelById boundary (no weaker/stronger gate); D-block fires for the not-yet-adopted voice-study-room page; occupancy deferred-not-dropped (DB-confirmed). **Carries:** T-9 update journey F4 (line 221) to the audio-first mic+leave slice + add POST /channels/:channelId/voice/token to the endpoint inventory; L-1 correct the stale product-decisions:387 "creds already provisioned" line (verified NOT in Railway). |
| **Gemini** | **UNAVAILABLE** | exit=3, HTTP 429; degradable — does NOT block. |

## Merged Phase 2 verdict: PASS
head-product APPROVED + karen APPROVE + jenny APPROVE + Gemini UNAVAILABLE → **P-block gate PASSED**.

## Security-scope tightened gate
Credential-issuing endpoint. First Phase 2 pass = APPROVE (no BLOCK with >2 medium+ findings) → forced-second-iteration NOT triggered. **T-8 in-scope** (non-optional): live-assert 403 non-member, secret absent from response + web bundle, exp bounded, 503 on unset creds.

## Carries to downstream
- **B-0/B-2:** toJwt() async (await); ESM-only SDK (NodeNext / dynamic import); canViewChannelById gate; channel-load 404/403; type='voice' 400; secret server-side; assert exp bounded.
- **D-block (NEXT):** design + adopt voice-study-room (audio-first, dark theme) before B-3.
- **T-5/C-2:** LiveKit creds (LIVEKIT_API_KEY/SECRET/URL + VITE_LIVEKIT_URL) NOT in Railway → founder heads-up (proactive); live-connect verification needs them.
- **T-9:** journey F4 update + token endpoint inventory. **L-1:** correct product-decisions:387 stale "provisioned" line.

## Footer
verdict_complete: true · phase2_complete: true · gate: PASSED · design_gap_flag: TRUE → D-block
