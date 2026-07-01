# Wave 32 — T-block findings aggregate

## T-1 (static)
- LOW: voice-participants.service.spec.ts:232 — `as unknown as MockFn` test-mock cast (not prod bypass).

## T-4 (integration)
- INFO: live RoomServiceClient→LiveKit leg not integration-tested (creds unset); deferred. Gate/load/creds legs covered.

## T-5 (e2e, prod)
- PASS: pre-join occupancy indicator renders; endpoint 503 (creds unset) → fail-soft "Occupancy data currently unavailable" chip. Evidence: T-6-layout/screens/voice-study-room-region-1440.png.
- PASS (LOAD-BEARING): Join CTA stays reachable (visible+enabled, "Join voice") with occupancy in error state — broken telemetry does not gate the core action.
- PASS: click Join → LiveKit connect fails (no creds) → graceful degrade to Error state ("Couldn't connect… / Try again"), shell intact, NO white screen / NO crash. Evidence: voice-after-join-degrade-1440.png.
- INFO: browser console shows pre-login 401 (session probe) + by-design 503 "Failed to load resource" lines; these are non-2xx response logs, not app faults. No 500 / no JS exception. No fix needed.

## T-6 (layout, prod)
- PASS: fail-soft Error state matches design/voice-occupancy-indicator.html State 4 at 1440/1280/1024; no layout break/overflow/font drift. Post-Join Error matches voice-study-room State 5.
- PASS: token audit — room bg #1c1c1f (study-800), Join btn #10b981 (accent-emerald) / radius 6px (radius-md). Zero token violations.
- NOTE: Loading state transient; Empty/Populated states need LiveKit creds → visual live-verify deferred (design-canon parity validated at D-3).

## T-8 (security, prod — LIVE authz matrix)
- PASS (row 1): unauthenticated → 401 (nil + real voice channel).
- PASS (row 2, LOAD-BEARING): authed NON-MEMBER on voice channel → 403 uniform; byte-identical body vs nonexistent nil + random UUID → NO enumeration leak (wave-31 P1 fix holds live).
- PASS (row 3): authed MEMBER on voice channel → 503 "Voice service is not configured" (creds unset, clean — NOT 500); proves gate passed + reached creds guard.
- PASS (row 4): authed MEMBER on text channel → 400 "Participants can only be listed for voice channels" (type check, member-reachable).
- PASS: gate order proven (canViewChannelById→403 FIRST; type→400; creds→503). Default-deny confirmed (member on nonexistent valid-UUID → 403, no 404 leak).
- PASS: rate limit active (1x503 then 29x429 on 30 rapid reqs); 429 body = "ThrottlerException: Too Many Requests", no internal-state leak. Matches project global-throttler baseline.
- PASS: secret_grep empty of REAL secrets (2 matches = fake test fixtures 'devkey'/'devsecret…' in .spec.ts). LiveKit secret server-side only; no LIVEKIT_* set in Railway.
- **F-32-T-8-1 (LOW-MEDIUM, input-validation, → V-2):** malformed non-UUID channelId on authed path → 500 (generic message, NO leak) instead of 400/403. Missing ParseUUIDPipe on channelId route param. Repro: GET /channels/not-a-uuid/voice/participants with valid bearer. Unauth malformed → 401 (auth-first, correct). Iron Law — NOT fixed here.

## Boundary (standing, non-blocking for the security gate)
- Populated occupancy (real LiveKit participants) not live-verifiable — LIVEKIT_* unset in Railway. RBAC + type + empty/creds security surface IS fully proven live. N-1 tripwire: 3rd cred-blocked M6 wave → park-or-key fork.

## DB test-fixture hygiene
- T-8/T-5 created voice channel c0000032…0001 (proof server) + non-member server 50000032…0002 + voice channel …0004 in the prod app DB to make the matrix + pre-join provable; ALL torn down after probing. Prod DB restored + verified (proof server back to 1 original text channel).
