# L-1 — Docs (wave-64)

> Block L (Learn), stage L-1. Runs concurrent with L-2. head-learn gated.
> Wave-64: M12 (Offline-first moat) bundle #3 — offline caching of message image-attachment bytes.

## Action 1 — CHANGELOG entry

Appended one **Added** bullet under `[Unreleased]` → `### Added`, immediately after the #78 (wave-63) offline-academic-content bullet.

- **File:** `CHANGELOG.md:86`
- **Section:** Added (new user-facing capability — offline image-attachment viewing extending the M12 offline-read wedge to a fourth surface: DMs → academic content → now message media).
- **Content:** "See message image attachments offline: images you've already viewed stay visible when you're offline or on a flaky connection, instead of turning into a broken image, and refresh once you reconnect. (#79)"
- **Style:** matches the terse offline-read house style of #77/#78; declarative present-tense; StudyHall identity; no stage codes / file paths / stack terms; cites PR #79.

## Action 2 — Milestone delta

Touched milestone resolved via `tasks.milestone_id` on the 2 claimed tasks: **M12 — Offline-first moat** (`36378340-0ea5-428e-bc94-03750fb103f6`), status `in_progress`.

Child-task counts after L-2 marked the 2 claimed tasks done:

| metric | value |
|---|---|
| done_count | 8 |
| open_count | 2 |
| total | 10 |

`open_count = 2 > 0` → **milestone does NOT close. No transition. No DB write to the milestone row.**

The 2 remaining open children (both correctly untouched this wave):
- `10e7543f-431f-44ac-8af0-3c0882ca9885` (todo, wave_id NULL) — the deferred assignment-media leg, descoped at P-0 (no online assignment-attachment-open surface exists to cache from; blocked pending that surface).
- `db3ade72-6504-4700-93b1-9d99b4098f38` (todo, wave_id NULL) — this wave's V-2 non-blocking follow-up (message-list offline hydration); head-verifier nulled its wave_id at V-3 so N-2 can seed it.

Plus M12's success-metric conflict-resolution-UI clause remains unshipped. Milestone success metric NOT hand-edited (per brief + roadmap-lifecycle edit permissions).

**Disposition:** mechanical, no ambiguity (milestone's own recorded scope is the authority; open children remain) → no BOARD escalation, no product-decisions append. Bundle #3 media shipped; M12 stays `in_progress`.

## Action 3 — README touchups

**SKIPPED.** Nothing user-facing changed at README level — the change is internal offline behavior (Dexie v4 blob cache + object-URL render path). No new CLI command/flag, no new env var, no new install step, no breaking change. Skip recorded per stage Action 3 condition.

## Action 4 — Commit

FS docs committed as `docs: L-1 wave-64 closeout (changelog)`; pushed to `main` (direct doc commits allowed). SHA recorded in verdict_evidence below.

---

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md:86 (Added bullet, #79)"
  - "milestone M12 (36378340): NO transition — open_count=2>0; no DB write"
  - "README.md: skipped (no user-facing README-level change)"
changelog_entry_added: true
roadmap_milestones_progressed:
  - {milestone: "M12 — Offline-first moat (36378340-0ea5-428e-bc94-03750fb103f6)", before: in_progress, after: in_progress}
roadmap_skip_reason: "M12 not closed: done=8/open=2/total=10; open children 10e7543f (deferred assignment-media leg) + db3ade72 (V-2 message-list-hydration follow-up) remain, plus conflict-resolution-UI clause of success metric unshipped. Mechanical hold, no transition, no DB write."
readme_sections_touched: []
head_signoff:
  verdict: APPROVED
  stage: L-1
  reviewers: {}
  failed_checks: []
  rationale: >
    Every active block's changes are captured. The single shipped user-facing surface (offline
    message image-attachment viewing) is recorded in CHANGELOG under Added, citing #79, in terse
    house style with StudyHall identity and no internal vocabulary. Milestone delta is mechanical
    and correct: M12 stays in_progress (open_count=2), no transition, success metric not hand-edited.
    README skip is justified (internal offline behavior only). No blameful language; observation is
    system-level. All L-1 exit checks tick.
  next_action: PROCEED_TO_L-2
note: "T-9 already regenerated user-journey-map; L-1 did not redo journey work."
```
