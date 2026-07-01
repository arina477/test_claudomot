# L-1 Docs — wave-31 (M6 voice first slice)

**Wave:** 31 — M6 Voice/video study rooms, first slice (LiveKit token service + audio-first join surface)
**Status:** shipped LIVE — PR #44 merged (ca3d277), api+web deployed. Live voice audio gated on LIVEKIT_* credentials (endpoint 503-until-provided; founder flagged).

## What L-1 captured

1. **CHANGELOG.md** — keep-a-changelog `[Unreleased] › Added`, 2 bullets, cite (#44). Honest framing: foundation (join surface + server-side token service); live audio needs voice-service credentials (in progress); screen-share + occupancy are future M6 waves. Did NOT overstate as full voice/video.

2. **Milestone delta (prose record only — task done-marking is L-2's concern):**
   - M6 (8702a335): 2 of 3 bundle tasks done (d8a85de0 token-mint service, 1dd1f2ca client join surface). 1 open: 78f51968 (who's-in-room occupancy), split to a future M6 wave.
   - M6 stays **in_progress** — NOT transitioned. M6 ## Success metric NOT met (requires live voice + screen-share + audio-fallback + occupancy, all future M6 waves).

3. **Doc reconciliations (V/T carries — LOW, Iron-Law-safe: shipped behavior is already the correct 403; removed stale doc/dead-branch only, no logic change):**
   - **404→403** — the missing-channel voice-token response returns 403 (uniform default-deny), verified at `apps/api/src/voice/voice-token.service.ts:97-100`. Cleaned the now-stale 404 references:
     - `apps/api/src/voice/voice-token.controller.ts` JSDoc — removed the `404 — channelId does not exist` line; folded missing-channel into the 403 default-deny line.
     - `apps/web/src/shell/useVoiceToken.ts:126` — annotated the 404-handling branch as unreachable (server emits 403, not 404 for missing channel); kept as labelled defensive fallthrough, no behavior change.
     - `apps/api/src/voice/voice-token.controller.spec.ts` — reframed the "404 missing channel" test to a generic exception-propagation test using `BadRequestException` (400 non-voice), an exception the service actually emits. Suite green (4/4).
   - **product-decisions.md:387** — appended a correction: the "env vars already provisioned" claim was inaccurate; LIVEKIT_* verified NOT set in Railway; wave-31 built credential-independent + endpoint 503-until-provided; founder to provide. Noted no VITE_LIVEKIT_URL needed client-side (url arrives in the token response).

4. **README** — judged SKIP for a feature-list edit: README has no feature list (dev/repo README; the one-line tagline already names "drop-in voice/video study rooms"). No user-facing feature-list surface to update.

5. **.env.example** — no edit needed: root `.env.example:30-32` already documents LIVEKIT_URL / LIVEKIT_API_KEY / LIVEKIT_API_SECRET (server-side, no values committed). Web `.env.example` correctly omits VITE_LIVEKIT_URL — the client is credential-independent (receives the room url in the token response), so no placeholder was added (adding an unused var would be false doc).

## Pre-commit verification (code cleanups touched apps/)

- `pnpm --filter @studyhall/api typecheck` → exit 0
- `pnpm --filter @studyhall/web typecheck` → exit 0
- `biome check` on the 3 edited code files → clean, no fixes applied
- `vitest run voice-token.controller.spec.ts` → 4/4 pass

## No task deferred

All three 3a cleanups were trivial dead-doc / dead-branch reconciliations well within the "trivial" bar — none exceeded it, so nothing was deferred to a task.

---

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md: [Unreleased]/Added — 2 voice bullets added, cite (#44)"
  - "apps/api/src/voice/voice-token.controller.ts JSDoc — 404 line removed, folded into 403 default-deny"
  - "apps/web/src/shell/useVoiceToken.ts:126 — 404 branch annotated unreachable (server returns 403)"
  - "apps/api/src/voice/voice-token.controller.spec.ts — 404 test reframed to BadRequestException propagation; vitest 4/4 green"
  - "command-center/product/product-decisions.md:387 — correction appended (LIVEKIT_* not set in Railway)"
  - "typecheck api=0 web=0; biome clean; voice controller spec 4/4"
  - "commit SHA: df9f1ae (pushed to main, 1b3b7b3..df9f1ae)"
changelog_entry_added: true
roadmap_milestones_progressed:
  - milestone: M6 (8702a335)
    before: 0done
    after: 2done
    state_before: in_progress
    state_after: in_progress
    metric_met: false
    open_remaining: [78f51968]   # who's-in-room occupancy — split to future M6 wave
doc_reconciliations:
  - id: 404-403
    surface: voice-token missing-channel response
    files:
      - apps/api/src/voice/voice-token.controller.ts
      - apps/web/src/shell/useVoiceToken.ts
      - apps/api/src/voice/voice-token.controller.spec.ts
    iron_law_safe: true          # shipped behavior already 403; removed stale doc/dead-branch only
  - id: product-decisions-387
    surface: "LiveKit env-vars provisioned" claim
    files:
      - command-center/product/product-decisions.md
    correction: "LIVEKIT_* NOT set in Railway; credential-independent build; 503-until-provided"
readme:
  decision: SKIP
  reason: "no feature list in README; tagline already names voice/video study rooms"
env_example:
  decision: NO_CHANGE
  reason: "root .env.example already documents LIVEKIT_* (no values); client needs no VITE_LIVEKIT_URL (url in token response)"
tasks_deferred: []
note: "M6 stays in_progress; metric not met. Task done-marking is L-2's concern (L-1 ∥ L-2)."
```
