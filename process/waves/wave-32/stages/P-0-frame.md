# Wave 32 — P-0 Frame

## Discover section
- **wave_db_id:** d25f8c47-7cff-430d-bbf2-3fc3bb68b093 (wave_number 32, running).
- **Prior-work:** wave-31 shipped M6's first voice slice (token-mint + join surface, LIVE at code level; live audio gated on LIVEKIT creds). This wave = the 3rd/last of that M6 bundle: the who's-in-room occupancy indicator (78f51968).
- **Roadmap milestone:** M6 (8702a335) in_progress, Class=product-feature, Tier=T4. Occupancy is a named M6 `## Scope` item (the "study room door left open" affordance). M6 metric (talk + screen-share + audio-fallback) still not met after this.
- **Spec-contract short-circuit:** no-prior-spec → full P-1..P-3.
- **External SDK:** LiveKit RoomServiceClient (server-side, api-only; SDK docs present).

## Reframe section
**problem-framer:** PROCEED (matched_antipatterns: []). Buildable-now credential-independent. Code-verified: reuse the wave-31 gate (canViewChannelById FIRST → uniform 403, then channel-load + type='voice' → 400; rbac.service.ts:428, voice-token.service.ts:94-111); add the endpoint to VoiceModule. RoomServiceClient takes explicit host/apiKey/secret (SDK gotcha #3, no env fallback); empty/absent room → 0 (TwirpError, gotcha #11). identity=userId (set at mint, voice-token.service.ts:127) → display via usersService.findById (users.service.ts:46) / presence.service userId→displayName pattern. **P-2 AC flag:** `users.display_name` is NULLABLE (users.ts:10) → the identity→display mapping needs a null-display fallback AC (alongside the empty-room AC).
**Forward framing:** `GET /channels/:channelId/voice/participants` (AuthGuard + reuse the wave-31 gate) → RoomServiceClient.listParticipants(channelId) → map identities → userId → member display (null-display fallback) → `{ count, participants: [{userId, displayName}] }`; client occupancy indicator on the voice-study-room pre-join surface, bounded poll-refresh.

**ceo-reviewer:** PROCEED (HOLD-SCOPE). Occupancy is the correct next slice — the pre-join "who's inside" signal directly attacks voice's cold-start (an empty room is a cold start; "3 studying" pulls people in), the load-bearing half of the drop-in loop (wave-31 shipped join; this shows who's inside). Poll correct (coarse "who's roughly inside" satisfies the pre-join signal; live-push is later-milestone precision). **CRITICAL FLAG (carried to P-4 + a founder heads-up):** LiveKit creds STILL absent — this is the 2nd M6 feature whose LIVE value is credential-gated. The M5 park-or-key digest's Option B claimed voice needed "no account or key" — the wave-31 L-1 correction proved that inaccurate for live value (LiveKit Cloud DOES need account keys for the live connection). head-product MUST carry a plain-language founder heads-up into P-4 correcting that + asking for the 3 LiveKit keys. **N-1 escalation tripwire:** if a THIRD consecutive M6 wave would ship live-unverifiable code with keys still absent → convert the heads-up into a sharp park-or-key fork (do NOT repeat the M5/Resend 6-wave cred-blocked drain).

**mvp-thinner:** OK. Atomic (server endpoint + client indicator are one slice — endpoint is dead without the surface + vice versa). Identities mvp-necessary (the drop-in decision needs "Alice, Bob, +1" not a bare count; identity=userId already shipped + display reuses existing data — count-only declined, though available if strictly minimal wanted). Poll thin-correct. Keep-OUT confirmed (presence rings, speaking indicators, live-push, animations, join-from-indicator, occupancy history). B-watch: poll must NOT become a standing websocket subscription.

**Mediation:** none required (PROCEED / PROCEED-HOLD-SCOPE / OK aligned on the atomic occupancy slice).

**Disposition:** PROCEED. Scope = the occupancy indicator (server participants endpoint reusing the wave-31 gate + client count/identities indicator, poll-refresh). Credential-independent build; live-verify deferred (LiveKit creds).

**Final framing for P-block (single-spec, claimed_task_ids = [78f51968]):**
- `GET /channels/:channelId/voice/participants` — AuthGuard + reuse the wave-31 gate (canViewChannelById→403, channel-load, type='voice'→400) → RoomServiceClient.listParticipants(explicit host/key/secret; empty/absent→0) → map identity=userId → member display (NULL-display fallback) → `{ count, participants }`. Build credential-independent (mock RoomServiceClient; unset creds → empty/503). 
- Client occupancy indicator on the voice-study-room pre-join surface (count + identities, bounded poll). Small addition to the adopted design — P-1 judges design_gap (likely small/FALSE — extends the wave-31 surface).
- Keep-OUT: presence rings, speaking indicators, live-push, animations, join-from-indicator, history.

## Open escalation carried into gate — LiveKit creds (SHARPENED per ceo-reviewer)
**M6 live value is gated on the LiveKit credentials (2nd cred-blocked M6 wave).** head-product to carry a plain-language founder heads-up at P-4: the earlier "voice needs no key" was inaccurate; the live voice connection + occupancy need LiveKit Cloud keys (LIVEKIT_API_KEY/SECRET/URL — a free-tier account, like Resend). Building continues credential-independent; but the accumulated voice code (wave-31 + wave-32) can only demonstrate LIVE value once the keys land. **N-1 tripwire:** a 3rd consecutive cred-blocked M6 wave → sharp park-or-key fork. Founder digest to be updated with the corrected LiveKit ask.

## Exit
Discovery + reframe complete. Scope = single-spec M6 occupancy (buildable credential-independent). PROCEED×3. LiveKit-creds heads-up sharpened → P-4 + founder digest correction. → P-1 Decompose.
