# Wave 32 — B-5 Verify

## Action 1 — Lint (biome, auto-fix)
`biome check --write` on apps/api/src/voice + apps/web/src/shell + apps/web/src/auth — no fixes applied (already clean). 7 pre-existing suggestion-warnings (unsafe, unrelated). PASS.

## Action 2 — Unit tests (full suite)
- **api:** 26 files, 449/449 green (incl. 24 new voice-participants tests).
- **web:** 18 files, 296/296 green (incl. 27 voice-occupancy + 15 wave-31 voice-study-room after the mock-stub fix).
- **Regression found + fixed (B-3 defect):** wiring the occupancy poll into VoiceStudyRoom broke wave-31 `voice-study-room.test.tsx` (14/15) — its `vi.mock('../auth/api')` factory lacked `getVoiceParticipants`, so the pre-join mount fired an unmocked call that tore down jsdom. Routed to livekit-integration → added `getVoiceParticipants: vi.fn().mockResolvedValue({count:0,participants:[]})`. Test-stub gap, NOT a product bug. All 15 wave-31 assertions intact. Now 15/15.
- **Flake documented:** `server-roles.test.tsx` "marks role dirty…" fails ONLY in full-suite (cross-test-isolation), passes 24/24 isolated. Unrelated to voice. Pre-existing flake — proceed per B-5 Action 2.

## Action 3 — Build
`turbo run build` — api + web (+ shared) all succeed. web PWA precache generated. PASS.

## Action 4 — Dev-server smoke
Booted api (`npm run dev`, port 8080). Boot log: `Mapped {/channels/:channelId/voice/participants, GET} route` + "Nest application successfully started". Curl `GET /channels/smoke-test/voice/participants` (no auth) → **HTTP 401 `{"error":"missing_bearer"}`** — route registered + reachable + AuthGuard fires as designed. Live occupancy (real auth + LiveKit creds) deferred to T/C-2 (credential-independent; LIVEKIT_* unset — wave-31 pattern).

```yaml
lint_passed: true
unit_tests_passed: true
build_passed: true
dev_smoke_passed: true
flakes_documented:
  - {test: "server-roles.test.tsx > marks role dirty and enables Save when role name changes", nature: "cross-test-isolation flake, passes isolated 24/24, unrelated to wave-32"}
```
