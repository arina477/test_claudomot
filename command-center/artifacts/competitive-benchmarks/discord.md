# Discord

**First seen:** 2026-06-26 (v2 onboarding scan)
**Tier:** 1 — Primary benchmark (match-or-beat)
**Evidence quality:** DIRECT_OBSERVATION (WebFetch of official blog/safety/policy pages) + HELP_ARTICLE + MARKET_RESEARCH. No live screenshots — installed `competitive-analyst` card lacks Playwright.

**URL:** https://discord.com
**Category overlap with us:** High — same server/channel/community paradigm students already use for "study servers"; persistent voice channels and dark-themed desktop client closely parallel StudyHall's intended experience.
**Business model:** Freemium (Nitro Basic $2.99/mo, Nitro $9.99/mo) + per-server Boosts ($4.99) + opt-in advertising via Quests. ~$725M ARR end-2024 (~54% Nitro, ~46% ads/other). Pre-IPO trajectory. [MARKET_RESEARCH]

## Key UX patterns
1. **Always-on persistent voice channels** — drop in/out without scheduling ("study room door left open"). Video caps at 25/channel free. [HELP_ARTICLE]
2. **Server → category → channel** with role-based permissions (up to 500 channels, 50 categories/server). Course segmentation is a community workaround via third-party bots (Carl-bot, MEE6). [HELP_ARTICLE]
3. **Four dark themes** (Ash/Dark/Onyx + density modes) in the 2024 desktop redesign — closest existing analogue to StudyHall's dark-first positioning. [DIRECT_OBSERVATION]
4. **All academic tooling is third-party-bot-dependent** (TStudy, DAS, etc.). Only native academic-adjacent feature is Jamspace Whiteboard in voice channels. No native assignments, scheduling, or grades. [DIRECT_OBSERVATION]
5. **Sep-2025 advertising policy**: acquires third-party demographic/behavioral data to personalize Quests; UK age verification under Online Safety Act. [DIRECT_OBSERVATION]

## Pricing
Free tier genuinely usable for study servers (no member caps, no history limits, no meeting time caps): 8–10MB upload, 720p screen share, 25-person video, 100 servers. Nitro Basic $2.99 (50MB), Nitro $9.99 (500MB, 4K stream, 2 boosts). Boost $4.99.

## Strengths
- De facto standard for student-run study communities; massive network effect.
- Persistent low-latency voice (Opus + AI noise cancellation) that holds up at low bandwidth (architected for gaming).
- Highly customizable server/role architecture; polished dark desktop client; bot extensibility; generous free tier.

## Weaknesses / where StudyHall wins
- **Zero native academic tooling** — assignments/due-dates/scheduling/grades all require fragile third-party bots with no data portability.
- **No offline capability at all** — requires constant connection; no message queue/cache/offline compose. Patchy internet = broken, not degraded.
- **Privacy liability** — not FERPA-designated, collects behavioral data for ads, prior breach, expanded third-party data acquisition (2025). Schools can't formally sanction it for academic records.
- Gaming/entertainment brand identity clashes with serious academic positioning; weak under-13 consent enforcement (COPPA burden on schools).

## Voice/video
Persistent voice rooms (up to 99 voice-only; 25 cameras free). Stage channels (boosted) up to 50 viewers. Screen share 720p free / 1080p60 boosted. No recording/transcription/captions/breakout on free.

## Evidence sources
- https://discord.com/blog/best-discord-apps-for-students-studying-socializing
- https://discord.com/safety/important-policy-updates
- https://support.discord.com/hc/en-us/community/posts/360049803692 (offline-mode request thread — feature does not exist)
- https://pumble.com/blog/microsoft-teams-vs-discord/ ; https://www.businessofapps.com/data/discord-statistics/

## Tier rationale
**Tier 1.** The platform students use as a StudyHall substitute right now; sets the UX benchmark (server/channel, persistent voice, dark theme, community discovery) StudyHall must match or surpass, and its academic/privacy/offline gaps are exactly StudyHall's attack surface.
