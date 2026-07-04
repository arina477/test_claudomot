# BOARD digest — 2026-07-04

## Clean decisions (2) — 5+/7 or cleaner
| decision-slug | outcome | wave |
|---|---|---|
| N-1-checkpoint-wave-44 | APPROVE 6/7 — wave-45 = tech-debt hygiene wave; re-home biome-lint (`4e994e96`) + Playwright-MCP reconfigure (`67881a58`) into M8 so the loop keeps flowing on metric-independent work while your Educator-tools success-measure decision is pending. | 44 |
| V-3-cap-wave-46 | **7/7, no objections** — Direct messages are LIVE and the engine works end-to-end (send/receive, real-time, offline, privacy controls, security all verified). One gap: the "start a new message" people-picker comes up empty from the messages screen, so a new conversation can't be started there yet. Decision: keep messages live, fix 3 small polish items now (names shown as ID codes; own message briefly doubled; one duplicate when scrolling older messages), and make the "start a new message" fix the very next thing — with your input on **who should be messageable** (everyone / shared class / search). Nothing lost or exposed. Full plain-language note below. | 46 |

## Close splits (0) — 4+/7 with dissent
| decision-slug | outcome | dissent note | wave |
|---|---|---|---|
| — | — | — | — |

## Vetoes & escalations routed back to founder (0)
| decision-slug | reason | where paused |
|---|---|---|
| — | — | — |

## Summary
- Total decisions: 2 | Clean: 2 | Close: 0 | Escalated: 0
- Waves completed: 1 (wave-44 — M8 polish/hardening, LIVE); wave-46 (DMs slice-1) in V-block, advancing to Learn after fast-fixes
- Approvals pending founder review: 0
- **Known-gap flagged for your next prioritization (not a pause):** wave-46 direct messages ship live but the "start a new message" picker isn't wired yet — the next wave will ask you *who should be messageable* before building it.

## wave-46 direct messages — the fuller story (decision-slug `V-3-cap-wave-46`)

We turned on direct messages this session — students can hold private 1:1 and small-group conversations, in real time, and it keeps working offline. We checked the whole feature end to end and the engine behind it is solid: sending, receiving, live updates, offline send, privacy controls (who's allowed to message you), and the security checks all passed.

**The catch and the call:** the "start a new message" people-picker currently comes up empty from the messages screen, so a brand-new conversation can't be started from there yet. Everything else works; this is the front door that isn't wired up. Fixing it properly needs a small product decision from you — **who should show up as people you can message** (everyone at school? only people you share a class/server with? a search box?). Because that's your call, we didn't guess it under time pressure.

**What the board decided (7 of 7, no objections):** keep messages live, fix three smaller polish items right now (names were showing as ID codes; your own message briefly appeared twice; older messages showed one duplicate when scrolling back), and make the "start a new message" fix the very next thing we build — with your input on who's messageable. Nothing was lost or exposed; this is "90% there, finishing the front door next," not a broken feature.

**Nothing needed from you right now** — the loop is continuing. If you'd rather we hold messages back until the start-a-conversation flow is done, just say so and we'll revert.
_Full record: process/waves/wave-46/escalations/board-V-3-cap-wave-46.md_

## Note (already in your inbox, not a new ask)
Your open Educator-tools decision (a success measure for the toolset + which optional feature — study groups / DMs / search — first) is still waiting: `process/session/updates/checkpoint-2026-07-04-m8-discretionary.md`. The loop is NOT paused; wave-45 does safe hygiene on already-shipped code while you decide. One member (ux-researcher) abstained because this hygiene wave ships nothing users see — noting for transparency, not a dissent.
