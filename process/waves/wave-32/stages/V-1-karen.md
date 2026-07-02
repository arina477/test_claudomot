# V-1 Karen — Reality verification (wave-32, M6 voice occupancy — who's-in-room)

**Stage:** V-1 Review · **Reviewer:** karen · **Scope:** load-bearing claims true in DEPLOYED PROD state
**Merge commit:** `45b08c3237dfdddc11b665cf060b85782232d4a9` (`45b08c3`, HEAD on main)
**Prod api:** `https://api-production-b93e.up.railway.app` · **Prod web:** `https://web-production-bce1a8.up.railway.app`
**Not in scope:** spec conformance (jenny). No fixes attempted.

---

## VERDICT: APPROVE

Every load-bearing claim holds in the deployed state. No contradicted claims. Zero findings.

---

## Claim → evidence ledger

### 1. File existence on merge tree — TRUE
`git cat-file -e 45b08c3:<path>` succeeded for all six:
- `apps/api/src/voice/voice-participants.service.ts` — EXISTS (200 lines added)
- `apps/api/src/voice/voice-participants.controller.ts` — EXISTS (50 lines added)
- `apps/api/src/voice/voice.module.ts` — EXISTS (modified, +9/-… )
- `apps/web/src/shell/useVoiceOccupancy.ts` — EXISTS (145 lines added)
- `apps/web/src/shell/VoiceOccupancyIndicator.tsx` — EXISTS (415 lines added)
- `apps/web/src/auth/api.ts` — EXISTS (17 lines added, getVoiceParticipants)

### 2. Export / registration — TRUE
- `VoiceParticipantsService.listParticipants` exported: service `voice-participants.service.ts:80` `export class VoiceParticipantsService`, method `listParticipants` at `:121`.
- Controller registered: `voice.module.ts` `controllers: [VoiceTokenController, VoiceParticipantsController]` + `providers: [..., VoiceParticipantsService]`.
- Route present: `voice-participants.controller.ts:23` `@Controller('channels')`, `:41` `@Get(':channelId/voice/participants')`, `:42` `@UseGuards(AuthGuard)` → `GET /channels/:channelId/voice/participants`.
- `api.getVoiceParticipants` exported (`api.ts:472`) AND USED (not dead): `useVoiceOccupancy.ts:30` imports `{ api }`, `:115` calls `.getVoiceParticipants(channelId, controller.signal)`. Consumed downstream by `VoiceStudyRoom.tsx:64` `useVoiceOccupancy(channelId, { enabled: status === 'idle' })`.

### 3. Route registration LIVE (load-bearing "deploy serves the claimed route") — TRUE
Live curl against prod api, no auth:
- `GET /channels/smoke/voice/participants` → **HTTP 401** `{"message":"unauthorised"}`
- `GET /channels/00000000-0000-0000-0000-000000000000/voice/participants` → **HTTP 401**
- **Control:** `GET /channels/smoke/voice/nonexistent-xyz` → **HTTP 404**
The 401 (route registered, guard rejecting) vs 404 (control, unknown route) delta proves the new route is genuinely mounted on the deployed revision — not a false-green old-revision serve. `/health` → 200 `{"status":"ok","service":"studyhall-api","version":"0.0.1"}`.

### 4. Deploy hash match — TRUE (not fabricated)
Live `railway deployment list --service api --json` returns the exact values C-2 claimed:
- deployment id `750f1b10-ab1a-49fe-890c-4c87f7d44506`, status **SUCCESS**, createdAt `2026-07-01T23:29:06Z`
- imageDigest `sha256:ed9471c5ff9704ef720326fccecc2f479b9837a0353c92618fb030dbc2ed4a9d` — matches C-2's `sha256:ed9471c5…ed4a9d`
- `meta.cliCaller: claude_code`, `reason: deploy` — consistent with CLI-push mechanism
`railway status`: api ● Online, web ● Online, both Postgres DBs Online. C-2 evidence is real and corroborates the live route-flip in claim 3.

### 5. Env var claim (NO new env vars; LIVEKIT_* unset → 503 graceful-degrade) — TRUE
- Live `railway variables --service api --json | grep LIVEKIT` → **no LIVEKIT keys** (confirms B-0/C-2 "LIVEKIT key count 0").
- Graceful-degrade is real 503, not 500: `voice-participants.service.ts:147-149` `if (!apiKey || !apiSecret || !livekitUrl) throw new ServiceUnavailableException('Voice service is not configured')` (503). The creds guard is **Step 3**, sequenced AFTER Step 1-2 (membership/RBAC gate — controller runs `AuthGuard`, service calls `canViewChannelById` before the creds check per spec `:117-119`). So an authed member hitting a voice channel with creds unset receives **503**, not 500 (no unhandled throw, no RoomServiceClient constructed). Could not exercise the authed path live (no member session), but the code path is unambiguous and the 503 is an explicit typed Nest exception.

### 6. Schema claim (schema-skip, no migration) — TRUE
- `git show --stat 45b08c3` shows NO `migration` / `.sql` / `drizzle` files. Merge touches only voice source + specs + wave process docs.
- `B-0-branch-and-schema.md:13-14` `schema_skipped: true`, `migrations: []`; `:7` "inline {count,participants} DTO, no new table/column".
- Endpoint uses no new table: service returns an in-memory `{ count, participants }` DTO (`voice-participants.service.ts:54-65`); user lookup reuses existing users table (batch lookup, no schema change).

### 7. Antipattern catalog — CLEAN
- **Fake tests:** grep for `expect(true).toBe(true)`, `expect(1).toBe(1)`, `.skip(`, `xit(`, `xdescribe(` across all three new spec files → none. Sampled real assertions: `service.spec.ts:176-223` — `expect(result.count).toBe(2)`, `toContainEqual({userId,displayName})`, `rejects.toThrow(ForbiddenException)`, `rejects.toThrow(BadRequestException)`, `mockListParticipants).not.toHaveBeenCalled()`, `canViewChannelById).toHaveBeenCalledWith(...)`. Genuine behavioral assertions incl. RBAC-order and voice-channel-type guards.
- **Test counts:** service spec 18 `it/test` + controller spec 6 = 24 backend tests (matches "24 new unit tests" claim). Web `voice-occupancy.test.tsx` 27 `it/test` (matches "27 tests" claim).
- **Deferred-but-undocumented:** none. The LiveKit-creds deferral IS documented — `C-2 note` (503-until-creds by design, live occupancy deferred to T-block/when founder supplies keys), `B-0:5` (creds still unset → credential-independent build), `B-4:11`. Consistent across deliverables.

### 8. B-4 de-dup claim — TRUE
- Claimed dead `getVoiceParticipants` reconciled: hook now delegates, not inline fetch. Verified `useVoiceOccupancy.ts:30` `import { api } from '../auth/api'`, `:115` `.getVoiceParticipants(channelId, controller.signal)`. No `fetch(` call and no local BASE const in the hook. `api.ts:472` method threads `signal?: AbortSignal` through the shared `request<>` helper. Matches B-4 defect-reconcile narrative (`B-4-wiring.md:13-15`).

---

## Summary

- Static: 6/6 files present, all exports/registrations wired, no migration, tests real (24 backend + 27 web).
- Live prod: route serves 401 (registered) vs 404 control; deploy id + image digest match C-2 exactly; LIVEKIT_* confirmed absent → 503-by-design graceful-degrade is a real typed 503 sequenced after the membership gate.
- No fabricated evidence, no decorative coverage, no undocumented deferrals.

**APPROVE.**
