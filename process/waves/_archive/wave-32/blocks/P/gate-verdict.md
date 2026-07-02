# Wave 32 — P-4 Gate Verdict (M6 voice occupancy — who's-in-room indicator)

**Block:** P (Product) · **Stage:** P-4 Gate · **Gate head:** head-product (fresh spawn, Phase 1)
**Task under gate:** 78f51968-2c48-4368-93d4-7d3f02111a7b (single-spec M6 occupancy)
**wave_db_id:** d25f8c47-7cff-430d-bbf2-3fc3bb68b093 (wave_number 32)
**Milestone:** M6 (8702a335) in_progress · Class=product-feature · Tier=T4
**Mode:** automatic

---

## VERDICT: APPROVED

Build-ready. Spec is falsifiable and complete; the security surface is correctly gated; the LiveKit-creds handling (proceed + corrected founder heads-up + N-1 tripwire) is sound and I confirm it rather than escalating. Hand off to the D-block (design_gap_flag=TRUE — the occupancy indicator is new UI on the pre-join surface), then B-block.

---

## Stage-exit checklist (walked against concrete artifacts, no inference)

| Upstream box | Evidence | Result |
|---|---|---|
| P-0 root-cause named, not symptom | P-0-frame L5-6, L14: voice cold-start ("empty room is a cold start; '3 studying' pulls people in") — the load-bearing half of the drop-in loop | TICK |
| P-0 maps to one live bet/milestone by id | M6 (8702a335); occupancy is a named M6 `## Scope` item | TICK |
| P-0 problem falsifiable | AC1-7 observable; pre-join shows count+identities or it does not | TICK |
| P-0 problem-framer + ceo-reviewer present + reconciled | PROCEED (framer) / PROCEED-HOLD-SCOPE (ceo) / OK (mvp-thinner); mediation none-required, all aligned on atomic slice | TICK |
| P-1 one seed + only must-ship siblings | single-spec, atomic (endpoint dead without surface & vice versa — mvp-thinner ruling) | TICK |
| P-1 every AC mvp-critical or split | keep-OUT (rings/speaking/live-push/animations/history) reviewer-excluded; identities kept (drop-in decision needs "Alice, Bob +1") | TICK |
| P-1 no unbuilt cross-bundle dep | reuses shipped wave-31 gate + identity=userId + VoiceModule; no new dep/schema | TICK |
| P-2 ACs enumerated + independently verifiable | 7 ACs, each with an observable pass/fail | TICK |
| P-2 empty/loading/error/offline specified | empty-room→0 (AC4), null-display fallback (AC5), creds-unset→0/503 no-crash (AC7), fetch-error→no-crash (edge-cases) | TICK |
| P-2 non-goals explicit | keep-OUT block in spec prose + edge-case "poll must NOT become a standing websocket" | TICK |
| P-2 auth/session/rate-limit surface flagged for tightened gate | membership-gated who's-in-room endpoint → security-scope gate below + T-8 flagged | TICK |
| P-2 spec embedded as fenced YAML at head of task.description | confirmed via `SELECT description` — YAML block + `---` + prose | TICK |
| P-3 reuses locked architecture | uniform-403 gate FIRST (wave-31 P1 fix), identity=userId map, RoomServiceClient explicit-creds — no parallel path | TICK |
| P-3 no unjustified infra | webhooks/live-push REJECTED (keep-OUT); poll BOUNDED; no Redis/websocket/multi-replica | TICK |
| P-3 each step → bundle task + observable artifact | Action-8 sweep: AC1-5→B-2, AC6→D-block+B-3, AC7→mocks; clean | TICK |
| P-4 every upstream box from artifact | above rows | TICK |
| P-4 reviewer drift resolved/escalated | Phase-2 karen/jenny pool runs next (this is Phase 1); no spec-vs-bet drift found on read | TICK |
| P-4 design_gap_flag handoff correct | design_gap_flag=TRUE → D-block (new UI not in adopted design/voice-study-room.html) | TICK |

---

## Gate-on findings

### 1. Spec quality — PASS
- **7 ACs falsifiable.** AC1 (200 `{count, participants}`), AC2 (gate order), AC3 (explicit-creds + identity=userId map), AC4 (empty→0), AC5 (null-display fallback), AC6 (bounded-poll indicator), AC7 (credential-independent). Each has an observable pass/fail.
- **Gate REUSE correct.** AC2 mandates `canViewChannelById` FIRST → uniform 403 for non-member/missing (the wave-31 P1 enumeration-leak fix) BEFORE channel-load/type-check → no cross-server occupancy leak.
- **SDK handling specified.** RoomServiceClient constructed with EXPLICIT host/apiKey/secret (AC3, gotcha #3 — no env fallback); empty/absent room → `{count:0,[]}` via TwirpError (AC4, gotcha #11); null `display_name` → fallback, never empty (AC5).
- **Poll BOUNDED.** AC6 + edge-case: interval ~10-15s while pre-join visible, stop on unmount/join; explicitly NOT a standing websocket subscription.

### 2. SECURITY-SCOPE tightened gate — PASS (→ T-8)
- **Who's-in-room is member-visible data.** A non-member must not learn the occupancy of a room they cannot view. AC2 enforces `canViewChannelById` FIRST → uniform 403 (default-deny, no enumeration signal), identical to the wave-31 token-mint gate. No cross-server leak path in the spec.
- **Secret server-side only.** AC3/contracts: RoomServiceClient lives in apps/api only, never web; B-2 carries an anti-pattern test asserting RoomServiceClient is not importable client-side.
- **Routed to T-8.** Flagged in P-1 (`security_surface`) and spec (`Security (P-4 gate + T-8)`). The B-6 /review must confirm: gate-first ordering, secret server-side, bounded poll. **T-8 must live-assert the uniform-403 (non-member GET /participants → 403, not 404/empty) — this is the load-bearing security AC.**

### 3. Plan soundness — PASS
- Every AC → a B-stage step (Action-8 sweep clean). AC1-5 → B-2 (backend), AC6 → D-block + B-3 (client), AC7 → mocks in both.
- `livekit-integration` routing correct (in AGENTS.md; owns both the server RoomServiceClient read and the client indicator).
- D-block fires BEFORE B-3 (indicator design must be adopted before the client builds to it). Correct sequencing.
- No new dependency (livekit-server-sdk installed wave-31); no schema/migration; inline DTO → B-1 SKIP. All correct.

### 4. Scope — PASS
- **Override-ship under-floor legit.** Atomic occupancy slice (mvp-thinner OK); floor UNMET (~400 LOC vs 1,500) but splitting yields a dead endpoint or a dependent follow-up. Expansion is reviewer-EXCLUDED keep-OUT (presence rings / speaking / live-push / animations / history). `floor_merge_attempt: 0`, no BOARD. Consistent with the standing precedent.
- **design_gap_flag=TRUE correct.** The occupancy indicator (count + member identities/avatars) is a NEW element on the pre-join surface, not in the adopted design/voice-study-room.html (occupancy was split out of wave-31). D-block scoped small — the indicator only, not a re-design.
- **Documentation drift (non-blocking):** review-artifacts.md L23-24 carries stale P-0-era prose ("likely small/FALSE"). The authoritative P-1 verdict + P-2 spec + P-3 plan all say design_gap_flag=TRUE. No action required at this gate; noted so the D-block reads TRUE from P-1, not the stale line.

### 5. LiveKit-creds situation — CONFIRM proceed + corrected heads-up + N-1 tripwire (NOT ESCALATE-now)
**Decision:** the credential handling is sound. I do NOT escalate the LiveKit-key ask as a blocking founder decision this wave. Rationale:
- **The build genuinely does not need the keys.** Credential-independent (mock RoomServiceClient; creds-unset → `{count:0,[]}`/503, no crash — AC7). Blocking gains nothing on this wave and would waste a shippable, unit-verifiable, mvp-critical slice.
- **The founder is not being kept in the dark.** The corrected heads-up is already staged in `founder-digest-2026-07-01.md` (L31-42): it explicitly retracts the earlier "voice needs no account or key" claim (L33), names the 3 keys in plain language (L39: API Key, API Secret, WebSocket URL), gives the concrete step (livekit.io free tier, L38), and states the tripwire in founder-facing terms (L42). This is the required P-4 founder-facing output and it is present and correct.
- **The tripwire is calibrated for the 3rd wave, not the 2nd.** This is the 2nd cred-blocked M6 wave. ESCALATE-now would pull the park-or-key fork forward one wave earlier than the guard was designed for, with zero build benefit. The N-1 tripwire (a 3rd consecutive cred-blocked M6 wave → convert the heads-up into a sharp park-or-key fork) fires at exactly the point the M5/Resend 6-wave drain risk becomes real.

**Verdict output on creds (carried):** proceed with the credential-independent build; the corrected + sharpened founder heads-up ships in the 2026-07-01 digest (verified present); live-occupancy verification deferred to T/C-2 once LIVEKIT_API_KEY / LIVEKIT_API_SECRET / LIVEKIT_URL land.

---

## Carried notes (into D → B → T → N)

- **SECURITY (→ T-8, B-6 /review):** uniform-403 gate FIRST is the load-bearing security AC. T-8 must live-assert non-member `GET /channels/:id/voice/participants` → 403 (not 404/empty — no cross-server occupancy enumeration). RoomServiceClient secret server-side only (anti-pattern test: not importable in web).
- **LiveKit creds (standing):** LIVEKIT_* not in Railway → live occupancy unverifiable this wave. Live-verify deferred to T/C-2. Corrected founder ask shipped in the 2026-07-01 digest (retraction + 3-key ask). Do NOT re-block the build on creds.
- **N-1 TRIPWIRE (must carry to this wave's N-1):** this is the **2nd** consecutive cred-blocked M6 wave (wave-31 token-mint + wave-32 occupancy). If a **3rd** consecutive M6 wave would ship live-unverifiable voice code with LIVEKIT_* still absent → N-1 MUST convert the heads-up into a sharp **park-or-key fork** to the founder (do not repeat the M5/Resend 6-wave cred-blocked drain). The founder digest L42 already commits to this pause in founder-facing terms.
- **D-block:** design_gap_flag=TRUE. Brief the occupancy indicator ONLY (bounded extension of the adopted design/voice-study-room.html pre-join surface, dark-theme tokens, count + identities). Not a re-design. Read TRUE from P-1 (ignore review-artifacts.md L23 stale prose).
- **B-watch:** poll MUST stay bounded (interval, stop on unmount/join) — do NOT let it become a standing websocket subscription (mvp keep-OUT).

---

```yaml
head_signoff:
  verdict: APPROVED
  stage: P-4
  reviewers:
    problem-framer: PROCEED       # P-0
    ceo-reviewer: PROCEED-HOLD-SCOPE  # P-0
    mvp-thinner: OK               # P-0
    karen: pending-phase-2        # P-4 load-bearing-claim pool (Phase 2, not run here)
    jenny: pending-phase-2        # P-4 spec-vs-bet drift pool (Phase 2, not run here)
  failed_checks: []
  design_gap_flag: true
  handoff: D-block (occupancy indicator design) -> B-block
  security_scope_gate: PASS       # uniform-403 reuse + server-side secret; routed to T-8
  livekit_creds_disposition: proceed-credential-independent + corrected-founder-heads-up (digest 2026-07-01, verified) + N-1-tripwire (3rd cred-blocked M6 -> park-or-key fork)
  rationale: >
    Single-spec M6 occupancy is build-ready. Seven ACs are independently falsifiable;
    empty/error/offline (creds-unset) states are specified; non-goals are explicit; the
    spec is embedded in the task description. The membership-gated who's-in-room endpoint
    correctly reuses the wave-31 uniform-403 gate FIRST (no cross-server occupancy leak),
    keeps the LiveKit secret server-side, and is routed to T-8. The plan reuses the locked
    architecture (uniform-403 gate, identity=userId, RoomServiceClient explicit-creds,
    bounded poll) and adds no unjustified infra (live-push/webhooks REJECTED). Override-ship
    under-floor is legit (atomic slice, expansion reviewer-excluded). design_gap_flag=TRUE
    is correct. On the 2nd cred-blocked M6 wave, I confirm proceed + corrected founder
    heads-up (verified staged in the 2026-07-01 digest) + N-1 tripwire rather than ESCALATE:
    the build needs no keys, the founder is being told the truth now, and the park-or-key
    fork is correctly calibrated to fire at the 3rd wave.
  next_action: PROCEED_TO_D-block
  verdict_complete: true
  rework_attempt_cap_remaining: 2
```

---

## P-4 Phase 2 — reviewer pool (appended by orchestrator)

**karen — APPROVE.** All 8 load-bearing claims VERIFIED against code + LiveKit SDK doc:
- wave-31 uniform-403 gate to reuse: voice-token.service.ts:93-121 (canViewChannelById FIRST :97; rbac.service.ts:428); VoiceModule extendable (voice.module.ts:7-12).
- RoomServiceClient.listParticipants: livekit.md:141; explicit-creds gotcha #3 :513; TwirpError gotcha #11 :553.
- identity=userId at mint: voice-token.service.ts:127. users.display_name NULLABLE: users.ts:10.
- usersService.findById: users.service.ts:46; shipped fallback pattern servers.service.ts:249 + presence.gateway.ts:125.
- livekit-server-sdk 2.15.5 in apps/api only (not apps/web); livekit-integration in AGENTS.md:80.
- **2 non-blocking B-2 carries:** (1) gate is INLINE in mintToken → B-2 mirrors it (watch drift); (2) mirror the `||` display-fallback operator (NOT `??` — `??` lets empty-string display_name through, violating the never-empty AC).

**jenny — APPROVE.** All 6 drift checks MATCH: in-scope named M6 occupancy slice (futures parked); reuses wave-31 channel-access model (no weaker/stronger gate); poll-not-push is deliberate (no prior real-time requirement); LiveKit Cloud untouched + credential ask correctly sharpened (digest correction confirmed present L33-42); N-1 tripwire mirrors M5/Resend precedent; design_gap_flag=TRUE correct.
- **T-9 carry:** journey-map F4:223 lists occupancy as KEEP-OUT of the wave-31 slice → T-9 MUST move it into the live F4 flow + add GET /participants endpoint.

**Gemini — DEGRADABLE-PASS (UNAVAILABLE).** 429 RESOURCE_EXHAUSTED (prepayment credits depleted) after backoff retries. Per the P-4 degradable-3rd-opinion rule, passes on UNAVAILABLE (same as an APPROVE for gate purposes).

### Phase 2 disposition: PASS (karen APPROVE + jenny APPROVE + Gemini degradable-pass).

## P-4 FINAL: APPROVED → D-block (design_gap_flag=TRUE)
Carries to downstream: B-2 [gate mirror + `||` fallback] · T-8 [live non-member→403 assert] · T-9 [F4 occupancy move] · D-block [bounded occupancy-indicator brief only] · N-1 [3rd cred-blocked M6 → park-or-key tripwire].
