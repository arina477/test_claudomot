# Research Brief — Executor Sub-Agent for LiveKit WebRTC voice/video integration

You are a research analyst preparing a knowledge brief for a Claude sub-agent that will EXECUTE LiveKit WebRTC voice/video work (build artifacts: code, queries, configs) in an autonomous SDLC pipeline. Output is consumed by an automated distillation pass that extracts five fixed sections. Sections missing from your output will fail distillation.

## Project Context
- Backend: NestJS
- Database: Postgres 16
- Frontend: Vite + React
- Deploy: railway
- Scale: self-use-mvp — single Railway modular-monolith NestJS service; LiveKit either self-hosted on Railway OR LiveKit Cloud free tier (100 participant-minutes/month); single study cohort under ~30-50 concurrent users; the NestJS server is never in the media path.
- SDKs: `livekit-server-sdk` (backend room + token), `@livekit/components-react` + `livekit-client` (frontend); alongside SuperTokens, Socket.IO, Railway Buckets / AWS S3, Resend.
- Product: A dark-themed desktop study app for remote students — group servers, real-time chat, and drop-in voice/video study rooms with offline-first reliability — built to displace Discord for coursework.

## Domain
LiveKit WebRTC SFU for drop-in voice/video study rooms: a server-side room + access-token service in NestJS `VoiceModule` that mints short-lived (≈4h) JWT access tokens AFTER a SuperTokens session check + RBAC check, with grants (room name = StudyHall channel, identity = userId, canPublish/canSubscribe). Decision surface: self-host on Railway (TURN/STUN, port exposure, fixed cost) vs LiveKit Cloud (account-issued key/secret, per-minute cost, zero ops) — the SDK call is identical, only `LIVEKIT_URL` changes. Frontend: drop-in room join, mic/cam toggle, screen-share, participant grid via `@livekit/components-react`, audio-only fallback when no camera. Media plane (ICE/DTLS/tracks/SFU routing) is explicitly NOT E2E-testable in headless Playwright — token issuance, room names, and control rendering are the testable surface.

## Role Focus
Weight research toward: concrete patterns the agent will write — `AccessToken` construction with `livekit-server-sdk`, `VideoGrant`/`RoomServiceClient`, token TTL + refresh before expiry, room naming + identity conventions, the `LiveKitRoom`/`useRoomContext`/`useTracks` hooks from `@livekit/components-react`, `Room.connect()`, track publication, `setMicrophoneEnabled`/`setCameraEnabled`/`setScreenShareEnabled`, device-permission + audio-only fallback handling, reconnection, and the self-host vs Cloud `LIVEKIT_URL`/TURN-STUN config differences. Cover version-specific gotchas across `livekit-server-sdk` (current major) and `livekit-client` / `@livekit/components-react` (current major) on Vite/React 19.

De-prioritize: architecture/strategy guidance; verification techniques; marketing or use-case overviews.

## Required Output

Five sections, in order, each clearly headed (`§1`..`§5`). `§6` optional (overflow only).

### §1 KNOWLEDGE BASELINE — 200-400 words
What an expert must know to integrate LiveKit server-token issuance + React client into this NestJS + Vite/React stack well. No history, no marketing, no filler.

### §2 ALWAYS-DO RULES — 12-25 rules; HARD CAP 25
Per rule:
- `<Single-sentence rule.>`
  Why: `<Single-sentence reason — concrete failure mode prevented.>`
  Source: `<link>`

Each rule must be enforceable by an automated agent reviewing code. Soft / aspirational rules rejected.

`[STABLE]` marker (mandatory): for rules sourced from material >5 years old describing WebRTC fundamentals that have not changed (e.g., SFU vs mesh trade-offs, TURN necessity behind symmetric NAT, JWT signing secrecy), prefix the rule with `[STABLE] ` (with the trailing space).

### §3 NEVER-DO RULES — 12-25 rules; HARD CAP 25
Same format as §2 (including `[STABLE]`). Failure modes production WebRTC apps actually hit (API secret leaked to client, token without TTL, missing TURN on self-host, no audio-only fallback, browser_close killing the connection, unbounded token grants), not theoretical risks. Each rule must answer: "what bug or outage does this prevent?"

### §4 ANTI-PATTERNS TO FLAG — 8-15 patterns
Per pattern:
- Name: `<short>`
  Description: `<1 line>`
  Example: `<code snippet OR concrete scenario>`
  Detection signal: `<how the agent recognizes it in code/config>`

### §5 AUTHORITATIVE REFERENCES — 10-20 sources
Tag each: `[PRACTITIONER]` | `[BOOK]` | `[OFFICIAL]` | `[VENDOR]`
Format: `[TAG] <link or title> — <what this covers>`
Exclude: SEO content, content farms, AI summaries, sources >5 years old for fast-moving tech.

### §6 ADDITIONAL — optional, only if §2 or §3 hit the 25 cap

## Source Quality
Practitioner content that captures HOW WEBRTC BREAKS in production is the highest-value signal. Prioritize: LiveKit official docs + GitHub (`livekit-server-sdk-js`, `client-sdk-js`, `components-js`), LiveKit Cloud docs, LiveKit Slack/blog, WebRTC fundamentals (webrtcforthecurious.com), MDN WebRTC, and production write-ups on token issuance + TURN/STUN on PaaS hosts.

## Recency
Default last 3 years. Older sources allowed only when the rule they support is marked `[STABLE]`.

## Length
6,000-12,000 words total.

## Deliverable
Single markdown document, headed `§1`..`§5` (and `§6` if used), formatted exactly as specified. No preamble, no closing summary, no human-facing commentary — consumed by an automated pass.
