# BOARD digest — 2026-07-08

## Clean decisions (1) — 5+/7 or cleaner
| decision-slug | outcome | wave |
|---|---|---|
| N-1-milestone-disposition-wave-80 | **7/7 APPROVE B** — close M13 at its shipped boundary; park read-receipts to backlog | 80 |

## Close splits (0) — 4+/7 with dissent
| decision-slug | outcome | dissent note | wave |
|---|---|---|---|
| — | — | — | — |

## Vetoes & escalations routed back to founder (1)
| decision-slug | reason | where paused |
|---|---|---|
| N-1-roadmap-planning-wave-80 | 4/7 PAUSE-FOR-FOUNDER **+ realist HARD-STOP:must-be-human veto** (circuit breaker) | Loop paused at wave-80 N-3; `process/session/.loop-paused.yaml` (stockout-pending-founder). STATUS=BLOCKED. |

## Summary
- Total decisions: 2 | Clean: 1 | Close: 0 | Escalated (paused to founder): 1
- Waves completed: 1 (wave-80 — M13 leg-3b presence toggle shipped LIVE, V-APPROVED, L-closed)
- Approvals pending founder review: the next strategic direction (see below)

---

## What needs you (plain-language)

**StudyHall has finished everything on its planned roadmap.** All 14 milestones are shipped — from the app foundation and offline-first reliability through messaging, voice rooms, academic tooling, monetization, compliance, growth/discovery, trust & safety, and this last stretch of institution/portable-identity + private encrypted DMs. There's no next milestone queued, so the engine has paused and is asking you to set the direction.

**Two decisions are waiting on you, and they go together:**
1. **What's next for StudyHall?** Now that the built roadmap is complete, what's the next big theme and the goal it's measured against (the North-Star metric)? The engine held here rather than guessing because choosing strategic direction has always been your call, and there's no usage data yet to ground a direction on its own.
2. **The two items M13 handed back:** the institution-partnerships go-to-market (a sales/partnership motion, not something the engine builds) and M13's success metric (still undefined).

**What got decided autonomously today (for your awareness, no action needed):**
- **M13 closed at its shipped boundary (BOARD 7/7).** Its whole buildable core is live. The one leftover — message read-receipts (a "seen" marker) plus a privacy toggle — was moved to the backlog rather than built next: all three reviewers had flagged it as a copy-Discord feature with no demand behind it, and it pulls against StudyHall's academic + offline-first wedge. It's parked, not deleted — it comes back the moment there's real demand.

**What happens when you answer:** the engine resumes and opens the next wave against your chosen direction. 33 smaller backlog items (a couple of engineering-hardening fixes, a few user-facing polish items, the parked read-receipts) stay ready to pull in alongside it.

Full BOARD votes:
- `process/waves/_archive/wave-80/escalations/board-N-1-milestone-disposition-wave-80.md`
- `process/waves/_archive/wave-80/escalations/board-N-1-roadmap-planning-wave-80.md`
