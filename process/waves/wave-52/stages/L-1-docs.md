# L-1 — Docs (wave-52)

**Wave headline:** Joinable focus rooms (body-doubling) — new study-room module (in-memory rooms + join-presence over a distinct `/study-room` namespace + room-scoped synchronized Pomodoro) + FocusRoomPanel UI. Shipped LIVE via PR #66 (25c0736) + fix PR #67 (725f7b6). All gates APPROVED; T-5 caught + fixed a live-blocking skeleton-stuck bug (missing subscribe handshake). ~5000 LOC.

**Mode:** automatic. STATUS: RUNNING — no measured pause trigger fired. Milestone-delta was a mechanical no-op branch (open_count>0), so no BOARD `L-1-roadmap-delta-wave-52` was convened.

---

## Action 1 — CHANGELOG entry

Appended under **Added** (new user-facing feature), `CHANGELOG.md:83`, one bullet, citing (#66):

> - Study together in focus rooms: create or join a focus room to body-double with others, see who's studying alongside you in a live roster, and share one synchronized room timer that keeps everyone's Work and Break in step. (#66)

Terse house style, declarative present-tense, user-facing language — matches the #63 shared-timer / #64 custom-durations sibling bullets. Well under the 5-bullet cap (single bullet). New feature from spec contract → **Added** (not Changed/Fixed/Security). No Security entry: the study-room module is a new surface with preventive in-wave guards (ephemeral in-memory, presence separation, room-timer in-memory CAS verified at B-6 + V-1) — preventive-in-wave, not a shipped-vuln patch. The T-5 skeleton-stuck bug was caught + fixed pre-ship in the same wave (never reached users), so it is NOT a Fixed entry.

## Action 2 — Milestone delta

Milestone touched: **M8 (`84e17739-af5e-4396-beb9-b6f3d6836fc4` — "M8 — Educator tools & deeper academics")**, resolved via `tasks.milestone_id` on the 3 claimed tasks.

L-2 already done-marked the 3 wave-52 tasks (seed d123d9e0 + siblings aad849ac, ef84b378). M8 child-task counts:

| | done | open (todo/in_progress/blocked) | total |
|---|---|---|---|
| BEFORE (at L-1 read) | 30 | 11 | 41 |
| AFTER (3 tasks → done) | 33 | 8 | 41 |

`open_count = 8 > 0` → **M8 stays `in_progress`.** Mechanical no-op branch — no `milestones` UPDATE, no `product-decisions.md` append. No ambiguity → no BOARD under automatic mode.

`open_count = 8 ≥ 3` (brain fallback threshold) → **NOT a backlog-stockout flag** for N-1.

Remaining 8 open M8 tasks (all seedable, `wave_id` NULL):
- `344eabde` — DM privacy: who_can_dm='server-members' positive-control integration
- `5bcbd27f` — DM off-token surface substitutions (server rail / picker modal / disabled)
- `874bd233` — DM: reconcile /dm/candidates throttle + message-poll 429 backoff
- `a1dda389` — Harden delete-any-message E2E: deterministic 2-client fan-out
- `c5051444` — DM: add LIMIT/pagination to getDmCandidates for large-server scale
- `f8eb49c1` — Unit-test buildTypingLabel transition table
- `fb1c367a` — **study-room + app-wide: non-UUID serverId leaks raw DB error via gateway** (this wave's F-1 Low finding → follow-up task)
- `ff09c4c9` — DM->server return: ServerRail selectServer/Home should exit dmHomeActive (wave-51 F-1 follow-up)

### Strategic flag for N-1 (milestone-disposition consideration)

**The study-group HEADLINE is now fully shipped.** M8's study-group tool arc is LIVE end-to-end: shared study timer (wave-49) + custom Pomodoro durations (wave-50) + **joinable focus rooms (wave-52, this wave)**. Teacher-side tools + DMs are done. The 8 remaining M8 tasks are exclusively **DM-polish stragglers + 2 F-1 security/error-hygiene follow-ups + 2 test-hardening/unit stragglers** — no net-new headline feature scope remains.

This does NOT meet the `open_count=0` bar for me to transition M8 (I do not transition it). But it is a genuine strategic moment worth N-1's milestone-disposition judgment: M8's *substantive* scope may be shipped even though 8 polish/hardening rows remain open. N-1 should decide whether those 8 stragglers warrant keeping M8 active vs. re-scoping them / re-homing them, and whether the next headline should advance to a later milestone (M9–M13 todo queue exists). Recorded here per L-1 Action 2 for N-1 pickup — I do NOT transition M8.

## Action 3 — README touchups

**SKIPPED.** No user-facing env var, install step, CLI command, or breaking change. The study-room module is an internal new `/study-room` Socket.IO namespace + in-memory room store + FocusRoomPanel — none are README surfaces (README covers install / quick-start / env / commands only). Matches wave-49/50/51 README-skip disposition for the study-timer substrate.

## Action 4 — Commit

`docs: L-1 wave-52 closeout (changelog)` — CHANGELOG.md single-bullet Added entry. Pushed to main.

---

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md:83 (Added, #66)"
  - "milestones row NOT updated: 84e17739 stays in_progress (open_count=8>0 — mechanical no-op)"
  - "tasks done-marked at L-2: d123d9e0, aad849ac, ef84b378 (all verified status=done)"
changelog_entry_added: true
roadmap_milestones_progressed:
  - {milestone: "M8 (84e17739)", before: "done=30/open=11 in_progress", after: "done=33/open=8 in_progress"}
roadmap_skip_reason: ""
roadmap_milestone_disposition_flag: >
  M8 study-group HEADLINE fully shipped (timer + durations + focus room LIVE; teacher-side + DMs done).
  8 open tasks are DM-polish + 2 F-1 follow-ups + 2 test-hardening stragglers — no net-new headline scope.
  Not open_count=0 so NOT transitioned here; flagged for N-1 milestone-disposition judgment.
backlog_stockout_flag: false   # open_count=8 >= 3 threshold
readme_sections_touched: []
note: "README skipped (no env/install/CLI/breaking change — internal /study-room namespace + FocusRoomPanel). Security section skipped (preventive-in-wave guards, not a shipped-vuln patch; T-5 bug caught pre-ship)."
```
