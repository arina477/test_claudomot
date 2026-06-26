# Competitive Benchmarks Index

Per-competitor evidence files live in this directory as `<kebab-case>.md`. Files persist across conversations so the same question is never re-researched.

Written by:
- v2 (this stage) — initial population of the competitor set
- `competitive-analyst` during P-0 Frame (per-wave deepening)
- `claudomat-brain/ROADMAP/roadmap-refresh-ritual.md` Step 1a (refresh)

Freshness: benchmarks older than 60 days should be re-verified at the next refresh ritual.

**Evidence note (v2):** the installed `competitive-analyst` card carries WebFetch/WebSearch, not Playwright — so Tier 1 evidence is DIRECT_OBSERVATION via fetched official pages (blog/safety/pricing/compliance/limits docs) rather than live screenshots. This is an acceptable onboarding-baseline degradation for products this well-documented; P-0 per-wave deepening or a later refresh can add live captures if a specific surface needs it.

---

## Tier ranking (2026-06-26, v2 onboarding scan)

### Tier 1 — Primary benchmark (match-or-beat)
- `discord.md` — The student-community substitute in active use; sets the UX benchmark (server/channel model, persistent drop-in voice, dark theme, discovery). Its zero academic tooling + no-offline + ad-driven privacy posture are StudyHall's exact attack surface.
- `microsoft-teams.md` — Owns the academic-tooling + FERPA-compliance dimension StudyHall must credibly match for coursework; its enterprise UX, no-community-model, no-offline-first, and IT-provisioning barriers are structural gaps a student-native product can own.

### Tier 2 — Secondary / informative
- `slack.md` — Channel model + explicit higher-ed discount program; informative for positioning/pricing, but workplace-first and not the primary student study battleground.
- `telegram.md` — Massive organic student adoption, free file sharing, low-bandwidth dominance (international segments); the default alternative StudyHall displaces in practice. Privacy gap (no group E2E) is a contrast point.
- `notion.md` — Owns async academic organization students already rely on; the Notion+Discord two-app seam is a positioning wedge. Watch for any move into real-time messaging/presence.

### Tier 3 — Context only
- `gather.md` — Novel spatial presence but priced out of the student market, no academic tooling, no offline, actively pivoting to enterprise. Low/declining threat.

---

## Strategic synthesis

The sharpest positioning is **not** "better than Discord" but **"the single tool that replaces Notion + Discord for students, built for unreliable connectivity."** No competitor covers the full job: Discord has the community/voice model but no academics, no offline, weak privacy; Teams has the academics + compliance but no community model and no offline-first; Notion has async organization but no real-time layer; Telegram/Slack/Gather each miss multiple legs. StudyHall's defensible space = persistent study-server communication + voice/video study rooms + academic tooling (assignments, scheduling) + **offline-first reliability** + **student-side privacy controls**.

---

## Freshness log

| Competitor | Tier | Last scan | Evidence quality |
|---|---|---|---|
| discord | 1 | 2026-06-26 | DIRECT_OBSERVATION (fetched) + HELP_ARTICLE + MARKET_RESEARCH |
| microsoft-teams | 1 | 2026-06-26 | DIRECT_OBSERVATION (fetched) + HELP_ARTICLE |
| slack | 2 | 2026-06-26 | DIRECT_OBSERVATION (fetched) + MARKET_RESEARCH |
| telegram | 2 | 2026-06-26 | DIRECT_OBSERVATION (fetched) + MARKET_RESEARCH |
| notion | 2 | 2026-06-26 | DIRECT_OBSERVATION (fetched) + MARKET_RESEARCH |
| gather | 3 | 2026-06-26 | DIRECT_OBSERVATION (fetched) + HELP_ARTICLE + MARKET_RESEARCH |
