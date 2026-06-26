# Slack

**First seen:** 2026-06-26 (v2 onboarding scan)
**Tier:** 2 — Secondary / informative
**Evidence quality:** DIRECT_OBSERVATION (WebFetch slack.com pricing/education/compliance) + MARKET_RESEARCH. No live screenshots.

**URL:** https://slack.com
**Category overlap:** High structurally (channel-based messaging, marketed to higher ed), but workplace-first; students use it less for informal study than Discord.
**Business model:** Per-seat SaaS (Salesforce-owned). Free = lead-gen funnel; Pro $7.25/user/mo, Business+ $15, Enterprise custom. **85% education discount** on Pro/Business+ for accredited institutions (~$1.09/user/mo Pro).

## Key UX patterns
1. **Workspace → channels** (siloed; no federated server graph). Free-tier cross-workspace = 1:1 DM only. [DIRECT_OBSERVATION]
2. **Huddles**: free tier strictly 1:1, 30-min cap; paid up to 50 (25 video). Audio-first, video opt-in. [MARKET_RESEARCH]
3. **No native academic tooling** — "Slack for Higher Education" tells educators to build workflows manually via Workflow Builder + calendar/LMS integrations. [DIRECT_OBSERVATION]
4. **No true offline mode** — degraded search/channel/file access on poor connections. [MARKET_RESEARCH]
5. **No FERPA certification** — burden shifts to institution; under-13 consent on the school. [DIRECT_OBSERVATION]

## Pricing
Free: 90-day history, 10 apps, 1:1 huddles (30-min), 1:1 external only. Pro $7.25 (unlimited history/apps, 50-person huddles). Business+ $15. Education discount 85% off (application required).

## Strengths
2,500+ app integrations; Workflow Builder low-code automation; strong brand/institutional adoption; Slackbot + AI summaries; robust admin/retention controls.

## Weaknesses / where StudyHall wins
- Zero native academic tooling; **90-day free history cap is disqualifying for multi-semester continuity**.
- Huddles paywalled at 1:1 free — the core study-session use case is gated.
- No offline-first; FERPA burden on institution; workspace model doesn't scale socially (no cross-workspace social graph/discovery); corporate UX, no customizable student profile identity.

## Voice/video
Proprietary WebRTC Huddles. Free 1:1/30-min; paid ≤50 (≤25 video, 2 screen shares). No native recording/captions without third-party.

## Evidence sources
- https://slack.com/pricing ; https://slack.com/help/articles/206646877 ; https://slack.com/resources/using-slack/your-guide-to-slack-for-higher-education ; https://slack.com/trust/compliance/ferpa-compliance

## Tier rationale
**Tier 2.** Targets higher ed with a real discount program and a channel model that mirrors ours — informative for positioning/pricing/education-discount strategy — but workplace-first and not the primary student study battleground (that's Discord).
