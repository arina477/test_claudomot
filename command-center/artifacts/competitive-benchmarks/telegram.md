# Telegram

**First seen:** 2026-06-26 (v2 onboarding scan)
**Tier:** 2 — Secondary / informative
**Evidence quality:** DIRECT_OBSERVATION (WebFetch telegram.org/faq, faq_premium) + MARKET_RESEARCH. Some COULD_NOT_VERIFY (group screen-share). No live screenshots.

**URL:** https://telegram.org
**Category overlap:** Medium — large-group messaging organically adopted by student communities, but flat group/channel model (no server hierarchy) and general-purpose positioning make overlap pattern-level, not positioning-level.
**Business model:** Freemium consumer app. Free, no ads in private/group chats. Telegram Premium (~$4.99/mo) + Sponsored Messages in large public channels (100k+ subs, hidden for Premium). No education tier.

## Key UX patterns
1. **Flat structure** — supergroups (≤200k, with Topics/threads) + broadcast channels (unlimited). No hierarchical server/home. [DIRECT_OBSERVATION]
2. **Encryption misunderstood**: regular + ALL group chats are client-server encrypted (Telegram holds keys); only 1:1 Secret Chats are E2E. Every study group is server-stored. [MARKET_RESEARCH]
3. **Cloud-first, not offline-first** — queues/resyncs on reconnect, WiFi-only media option; no documented offline read for uncached messages. [MARKET_RESEARCH]
4. **Strong free file sharing** — 2GB/file free (4GB Premium), effectively unlimited cloud accumulation. Practical for lecture recordings/PDFs. [DIRECT_OBSERVATION]
5. **No native academic tooling** — emergent only (community groups, notes channels, Bot-API quiz/reminder bots needing third-party hosting). [MARKET_RESEARCH]

## Pricing
Free: groups ≤200k, channels, voice/video calls, 2GB uploads, cloud storage, bots. Premium ~$4.99/mo: 4GB uploads, faster downloads, no sponsored msgs, doubled limits, voice-to-text, translation. No education/volume pricing.

## Strengths
Frictionless onboarding (phone-number identity, link-join); very large groups; generous free file storage; open Bot API ecosystem; strong in low-infrastructure markets (lightweight, graceful reconnection, deferred media); persistent group voice chats (drop-in).

## Weaknesses / where StudyHall wins
- **No E2E for group chats** — fundamental privacy gap for sensitive academic/personal content.
- **No server/community structure** — large communities = many unlinked groups, no unified home/RBAC/directory.
- Phone-number signup is a privacy/access barrier; no native academic tooling; consumer UX (no dark-themed study identity/profiles); closed-source server (no independent audit); reputational uncertainty (Durov 2024).

## Voice/video
1:1 E2E voice/video. Group calls ≤200 (free, persistent/drop-in). Channel live streams unlimited viewers. Group screen-share + recording: COULD_NOT_VERIFY.

## Evidence sources
- https://telegram.org/faq ; https://telegram.org/faq_premium ; https://www.eset.com/blog/en/home-topics/privacy-and-identity-protection/telegram-privacy-explained/

## Tier rationale
**Tier 2.** Not a positioned academic competitor, but its massive organic student adoption, free file sharing, and dominance in low-bandwidth global markets make it the default alternative StudyHall displaces in practice (esp. international segments) — monitor, don't primary-benchmark.
