# V-1 jenny — Spec-intent verification (wave-32, M6 voice occupancy)

**Verdict: APPROVE**

**Scope:** deployed-behavior ↔ spec-CONTRACT intent (source of truth = `tasks.description` row `78f51968-2c48-4368-93d4-7d3f02111a7b`; convenience pointer `process/waves/wave-32/stages/P-2-spec.md`). Beyond the AC-by-assertion T-block already ran — this is the "does the SHIPPED thing mean what the spec MEANT" pass. Not source-claim truth (karen's lane). Fixed nothing.

**Deployed target:** api `api-production-b93e` + web `web-production-bce1a8`, merge `45b08c3` live. `LIVEKIT_*` UNSET in Railway → populated-occupancy path is credential-gated (503 for authed members) — the spec's documented credential-independent boundary.

**Live probe I ran myself (unauth, no creds needed):**
- `GET /channels/00000000-…-000000000000/voice/participants` (nil UUID, no bearer) → **401** `{"message":"unauthorised"}`
- `GET /channels/not-a-uuid/voice/participants` (non-UUID, no bearer) → **401** (auth guard fires before param parsing — correct order)

I cannot mint a fixture session from this context, so the authed rows are corroborated from T-8's live matrix (`process/waves/wave-32/stages/T-8-security.md`), which probed prod with two real fixtures (A member / B non-member) and tore the fixtures down after.

---

## 1. AC-by-AC semantic match (intent, not just assertion)

| AC | Spec intent | Deployed behavior | Match |
|----|-------------|-------------------|-------|
| **AC1** endpoint + shape | member→200 `{count, participants:[{userId,displayName}]}` | Route `@Get(':channelId/voice/participants')` under `@Controller('channels')` (`voice-participants.controller.ts:23,41`); DTO `{count, participants:[{userId,displayName}]}` (`voice-participants.service.ts:54-62`). 200 path returns this shape. Populated 200 not live (creds gated) — mapping is unit-proven, framed credential-independent. | INTENT MET |
| **AC2** uniform-403 gate | canViewChannelById FIRST → 403 uniform (non-member/missing, no enum leak); type!='voice'→400; unauth→401 | Gate order in service = RBAC first (`:123-126`) → channel load + `type !== 'voice'` → 400 (`:130-138`) → creds guard → 503. T-8 live matrix: unauth 401, non-member 403 **byte-identical** across exists/nil/random UUID (rows 2/2b/2c), member-on-text 400, member-on-voice 503. Enumeration control HOLDS live. | INTENT MET |
| **AC3** RoomServiceClient explicit-creds + identity→display | explicit host/apiKey/secret (gotcha #3, no env fallback); identity==userId→member display | `new RoomServiceClient(livekitUrl, apiKey, apiSecret)` explicit args (`:155`), env read locally not passed as fallback; identity→user batched lookup `WHERE id IN(...)` (`:176-181`), maps `p.identity`→display (`:190-196`). Live path 503s (creds unset) — mapping is unit-tested per T-2, not live. Spec explicitly frames this credential-independent. | INTENT MET (unit-level, per spec framing) |
| **AC4** empty/absent room → `{count:0,[]}` | TwirpError / absent-room handled as zero, NOT error | `isTwirpError` guard (`:73-77`) → catch → `{count:0,[]}` (`:160-168`); also `participantInfos.length===0`→`{count:0,[]}` (`:170-172`). | INTENT MET |
| **AC5** null display_name fallback | `display_name \|\| email-localpart \|\| userId`, never empty; **`\|\|` not `??`** so empty string falls through | `user?.display_name \|\| (user?.email ? email.split('@')[0] : null) \|\| p.identity` (`:192-193`) — uses `\|\|`, empty string falls through to email/userId. Correct per P-4/karen carry. | INTENT MET |
| **AC6** client indicator, bounded poll | pre-join surface; count+identities; BOUNDED poll (~10-15s); stop on unmount/join; NOT websocket | `useVoiceOccupancy` `setInterval` at `POLL_INTERVAL_MS=10_000` (`useVoiceOccupancy.ts:59,134`); cleared on unmount + `enabled=false` (`:96-101,136-141`). Wired with `enabled: status === 'idle'` (`VoiceStudyRoom.tsx:64`) → polls only on pre-join, stops the moment user joins (status leaves 'idle'). Indicator shows count + avatar cluster + names (`VoiceOccupancyIndicator.tsx`). No WebSocket/EventSource/subscribe/`io(` in either file (grep clean). | INTENT MET |
| **AC7** credential-independent build | mock in tests; unset creds → `{count:0,[]}` or 503; NO crash; live-verify deferred | Creds guard → `ServiceUnavailableException('Voice service is not configured')` = **503** (`:143-149`). Live prod member-on-voice = 503 (T-8 row 3), NOT 500. T-5 live: 503 → indicator "Occupancy data currently unavailable" chip, no crash, Join stays reachable. Spec allows "503 OR {count:0,[]}" — 503 chosen, documented, graceful. | INTENT MET |

All 7 ACs match spec INTENT. The 503-for-authed-members is the spec-sanctioned credential-independent outcome (AC7 + edge-cases explicitly list "creds unset → {count:0,[]} or 503; no crash"), so it is **acceptable, not drift** — confirmed the spec framed it credential-independent.

---

## 2. Keep-OUT conformance (mvp-thinner boundary)

Spec forbids: presence rings · speaking/voice-activity indicators · live-push/websocket occupancy · avatar animations · join-from-indicator one-click · occupancy history/analytics.

- **presence rings / speaking indicators:** ABSENT from the shipped pre-join indicator. `VoiceOccupancyIndicator.tsx` renders static initials-avatars + count chip only — no ring, no VU/speaking state. (The emerald presence dot at `VoiceStudyRoom.tsx:655` is the wave-31 **in-room local-participant** dot, a different surface, not the pre-join occupancy indicator — not scope creep.)
- **live-push / websocket:** ABSENT — bounded `setInterval` only; grep for WebSocket/EventSource/subscribe/`io(` returns NONE.
- **avatar animations:** only a CSS hover/focus translate + tooltip reveal (`:295,309-317`) and `animate-pulse` loading skeleton (suppressed under `motion-reduce`). No autonomous/looping avatar animation. Within design-adopted bounds; not the forbidden "avatar animations" (which meant decorative motion on the live cluster). Judgement: conformant.
- **join-from-indicator one-click:** the avatars are NOT clickable-to-join; Join is a separate CTA below the panel (`:202-247`). Conformant.
- **occupancy history/analytics:** none — single live snapshot per poll. Conformant.

No deployed scope creep beyond the spec's keep-OUT.

---

## 3. User-journey continuity (F4 pre-join, prod)

Fail-soft is the wave's load-bearing UX invariant, and it HOLDS live (T-5, screenshot-backed):
- Occupancy poll 503s (creds unset) → `useVoiceOccupancy.catch` → `status:'error'` → indicator degrades to the calm "Occupancy data currently unavailable" chip (`VoiceOccupancyIndicator.tsx:259-275`, `role="status"` not `alert` — does not hijack SR focus).
- **Join voice CTA stays visible + enabled** with occupancy in error (T-5 S3: "visible: true, enabled: true"). Broken telemetry never gates the core action.
- Clicking Join with creds unset → token mint 503 → graceful design Error state ("Couldn't connect… / Try again"), shell intact, no white screen (T-5 S5, `ErrorView` `:312`).
- Back/exit: leaving pre-join unmounts the hook → interval cleared + in-flight aborted (`:136-141`) → no orphan polling. No dead-end, no unhandled error state.

Journey degrades fail-soft exactly as the spec intends.

---

## 4. Spec-gap detection

**F-32-T-8-1 (non-UUID channelId on authed path → 500):** a malformed `channelId` with a valid bearer returns **500** (generic body, no stack/state leak) instead of 400/403 — missing `ParseUUIDPipe`. Already caught at T-8, routed to V-2.

- **Classification: spec-GAP, not spec-DRIFT.** The spec's AC2 enumerates 401/403/400 but is SILENT on malformed-param input validation; the code faithfully implements what the spec wrote (RBAC → type → creds). The 500 is behavior the spec DIDN'T ANTICIPATE, not code diverging from what it said. The spec SHOULD have specified a 400 (ParseUUIDPipe) for malformed route params.
- **Severity: LOW.** Generic message, no leak (T-8 confirmed no stack-trace/internal-state exposure); unauth malformed → 401 (guard first). Non-blocking. Correctly already in the V-2 queue. T-9 note that V-2 should ALSO check the wave-31 `POST /channels/:channelId/voice/token` (identical param pattern, likely same gap) is sound and I endorse it.

This gap does NOT block APPROVE — it is a hardening item on an already-authenticated, non-leaking path, and it is already tracked.

---

## 5. Journey-map fidelity

Regenerated `command-center/artifacts/user-journey-map.md` F4 entry (lines 19, 47, 221-226) matches what shipped:
- Page-10 F4 row now carries "pre-join occupancy indicator (wave-32, LIVE fail-soft)" — matches the wired `VoiceOccupancyIndicator` on the pre-join surface. ✔
- Endpoint documented as `GET /channels/:channelId/voice/participants` (session + membership gated, `{count, participants[]}`) — matches controller. ✔
- The "who's-in-room" item is correctly MOVED out of the F4 keep-OUT/deferred list INTO the live pre-join flow. ✔
- Credential boundary honestly stated (populated state credential-gated, security surface proven live without keys). ✔
- F-32-T-8-1 recorded as a non-blocking V-2 finding. ✔

Map is faithful to the deployed reality. No fidelity drift.

---

## Verdict rationale

**APPROVE.** Deployed behavior matches spec-CONTRACT intent on all 7 ACs. The credential-gated 503 for authed members is the spec-sanctioned credential-independent outcome (AC7 + edge-cases explicitly permit "503 or {count:0,[]}; no crash") — confirmed the spec framed it credential-independent; it degrades fail-soft with Join reachable (T-5 live). Keep-OUT boundary respected in the deployed UI (no rings, no speaking indicators, no websocket, no join-from-avatar, no history). Journey continuity intact, no dead-end. The one spec-gap (non-UUID→500) is a genuine spec omission (LOW, no leak, already in V-2), not code drift, and does not block.

**Findings ledger:**
- `F-32-V1-jenny-1` — non-UUID `channelId` authed → 500 (spec-GAP: spec omitted a 400 for malformed route params; missing `ParseUUIDPipe`). Severity LOW. Non-blocking. Already tracked as F-32-T-8-1 → V-2 (do not double-count; noted here for V-2 triage completeness). Also check wave-31 `POST /channels/:channelId/voice/token`.

No spec-DRIFT found. No fixes applied (V-1 is read-only).

```yaml
reviewer: jenny
stage: V-1
wave: 32
verdict: APPROVE
spec_source: "tasks.description row 78f51968-2c48-4368-93d4-7d3f02111a7b"
acs_intent_matched: [AC1, AC2, AC3, AC4, AC5, AC6, AC7]
keep_out_conformant: true
journey_continuity: fail-soft-holds
journey_map_fidelity: faithful
live_probe_ran: [unauth_nil_401, unauth_nonuuid_401]
authed_matrix_source: T-8-security.md (corroborated, not re-run)
findings:
  - {id: F-32-V1-jenny-1, class: spec-gap, severity: low, description: "non-UUID channelId authed -> 500 (spec omitted 400 for malformed param); missing ParseUUIDPipe", blocking: false, duplicate_of: F-32-T-8-1, route_to: V-2, also_check: "wave-31 POST /channels/:channelId/voice/token"}
drift_found: false
fixes_applied: 0
```
