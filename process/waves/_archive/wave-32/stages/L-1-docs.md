# L-1 — Docs (wave-32)

> **Wave:** 32 — M6 pre-join voice occupancy indicator.
> **Shipped LIVE to prod:** `GET /channels/:channelId/voice/participants` (membership-gated occupancy read) + pre-join occupancy indicator (count + member identities, bounded poll, fail-soft) on the voice study-room entry surface. PR #45, merge `45b08c3`, both services live on Railway.
> **Claimed task:** 78f51968 (marked `done` at L-2, single-task bundle, 0 siblings).

## Action 1 — CHANGELOG entry

Appended to `CHANGELOG.md` under `[Unreleased] → Added`, keep-a-changelog format. This is a user-facing feature slice → **Added**. Placed immediately after the wave-31 voice-foundation lines (#44) to keep the voice feature grouped.

**Lines 43–44** (2 bullets; headline + fail-soft/creds-gated detail):

```
- Pre-join "who's studying" indicator on the voice study-room entry surface: before you join, see how many people are already in the room and who they are, so you know whether to drop in. (#45)
- The count and member identities are readable only by fellow channel members, refresh on a light poll, and fail quietly to an empty state if the read hiccups — so the entry surface never breaks. Live occupancy fills in once voice-service credentials are configured. (#45)
```

Covers: the pre-join occupancy indicator, the membership-gated participants endpoint (framed as "readable only by fellow channel members"), the bounded poll + fail-soft behavior, and the creds-gated live-occupancy note. Terse, declarative present-tense, product language. Under the ≤5-bullet cap.

## Action 2 — Milestone delta (M6, id 8702a335)

No milestone transition. **M6 remains `in_progress`.** Mechanical, no BOARD/ceo-agent judgment required.

- M6 child tasks: 3 `done`, 1 open (`a2dd9f3d` — harden voice param validation, `todo`; the V-block non-blocking finding).
- `open_count = 1 > 0` → milestone does NOT transition per Action 2 step 2.
- Additionally, M6 scope (voice: talk + screen-share + audio-fallback + occupancy) is not fully shipped — **screen-share** and **audio-fallback** remain undecomposed. M6 metric ("drop in + talk + screen-share + degrade to audio-only gracefully") still not met.
- Below the brain-fallback backlog threshold (< 3 open) but milestone is NOT stockout-closeable: undecomposed scope remains, so N-1 will decompose the next M6 bundle rather than treat this as `backlog-stockout` closure.

No `milestones` row UPDATE issued. No `product-decisions.md` append (append only on transition; none occurred).

## Action 3 — README touchups

**SKIP.** Nothing user-facing at the README level changed:
- No new env var — `LIVEKIT_*` already referenced from wave-31; no new keys introduced.
- No new CLI command / flag.
- No new install / quick-start step.
- Occupancy is in-app UI, detailed in CHANGELOG. README feature summary (line 3) already covers "drop-in voice/video study rooms" — no edit warranted.

## Action 4 — Commit

FS-side doc touchup committed and pushed to `main`:

```
docs: L-1 wave-32 closeout (changelog)
```

Author: `Claudomat Worker arina-89ejyn <devmoment@gmail.com>`; `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`. Milestone progression required no DB write (no transition), so no split commit.

---

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md:43-44"
  - "milestones row UPDATE: none (M6 open_count=1 > 0 + undecomposed scope; no transition)"
  - "README.md: skipped (no user-facing README-level change)"
changelog_entry_added: true
changelog_line_range: "43-44"
roadmap_milestones_progressed:
  - {milestone: "M6 (8702a335)", before: in_progress, after: in_progress}
roadmap_skip_reason: "M6 not progressed — 1 open child task (a2dd9f3d) + undecomposed scope (screen-share, audio-fallback); mechanical no-transition"
readme_sections_touched: []
readme_skip_reason: "No new env var (LIVEKIT_* already present), no new CLI command, occupancy is in-app UI documented in CHANGELOG"
note: "LiveKit creds still unset → populated occupancy live-verify deferred (endpoint 503-graceful for members); security gate fully proven live. Non-blocking V-finding tasked as a2dd9f3d (voice param validation hardening)."
```
