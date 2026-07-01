# Wave 32 — B-4 Wiring

## Typecheck (Action 1)
Repo-wide `turbo run typecheck` (@studyhall/api + @studyhall/web + @studyhall/shared) — 0 errors. PASS.

## Route registration (Action 2)
- **Backend:** VoiceParticipantsController registered in voice.module.ts (controllers[]) + VoiceParticipantsService (providers[]); VoiceModule imported in app.module.ts:45. Route: `@Controller('channels')` + `@Get(':channelId/voice/participants')` + `@UseGuards(AuthGuard)` → `GET /channels/:channelId/voice/participants`. ✓
- **Client:** hook consumes via `api.getVoiceParticipants(channelId, signal)` (auth/api.ts:472), reachable from VoiceStudyRoom pre-join. ✓ (No new frontend route — component on existing voice surface.)

## Env wiring (Action 3)
LIVEKIT_API_KEY/SECRET/URL consumed in voice-participants.service.ts (creds-unset → 503, explicit fallback). Same vars as wave-31; already in .env.example. No new env var. VITE_API_ORIGIN consumed via api.ts BASE. ✓

## Drift defect found + reconciled (B-3 re-entry)
- **Defect:** `getVoiceParticipants` added to api.ts but hook fetched inline (dead method + URL/header duplication).
- **Reconciled:** re-entered B-3 (livekit-integration) — threaded `signal?: AbortSignal` through `api.getVoiceParticipants`; hook now delegates to it (removed inline fetch + BASE const). Coalescing/mount-guard/fail-soft/AbortError-swallow all preserved. tsc clean, 27/27 tests green, biome clean. No behavior change.

## Import sanity (Action 4)
Repo typecheck (strict, exactOptionalPropertyTypes) covers orphan/dead imports — clean.

```yaml
typecheck_passed: true
routes_registered: ["GET /channels/:channelId/voice/participants"]
env_vars_wired: [LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL]
drift_defects:
  - {boundary: "client api method vs inline fetch", side: B-3, resolution: "hook delegates to api.getVoiceParticipants(signal); dead method removed"}
```
