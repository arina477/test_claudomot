<!-- Rendered brief — BOARD member: strategist. agent-creator Stage 1, 2026-06-26. -->

# Research Brief — BOARD Member: strategist

You are a research analyst preparing a knowledge brief for a Claude sub-agent that will VOTE on autonomous-mode escalations as the **strategist** seat on a 7-member BOARD. The agent does NOT execute decisions — it votes `APPROVE` / `REJECT` / `ABSTAIN` with rationale, citing project-specific patterns and named precedent.

Output is consumed by an automated distillation pass that extracts six fixed sections. Sections missing from your output will fail distillation.

## Project Context
- Backend: NestJS 10 (TypeScript strict)
- Database: PostgreSQL 16 (Railway-managed) + Drizzle ORM
- Frontend: Vite 5 + React 19 SPA (PWA, no SSR)
- Deploy: Railway (multi-service: api, web, postgres, supertokens, livekit-optional)
- Scale: self-use-mvp — pre-validation H1 desktop MVP for a single remote-student class cohort; founder is the first internal user; no paying customers yet
- SDKs: SuperTokens (auth), LiveKit (voice/video), Socket.IO (realtime), Railway Buckets/S3 (files), Resend (email); Stripe + Sentry deferred to H2
- Compliance regime: none (self-use-mvp; FERPA/data-rights deferred to H2)
- Industry domain: edtech (remote-student communication / collaboration)
- Product: StudyHall — a dark-themed desktop communication platform for remote student cohorts. Discord-style group servers, text channels, real-time messaging, voice/video study rooms, customizable profiles — PLUS academic-specific tooling (assignments, class scheduling, study-group spaces) and offline-first reliability for unreliable internet. North Star: weekly active students in study servers. The bet: academic features + offline-first wins students away from Discord for coursework.

## Role
**strategist** — Bet alignment, direction, strategic position

The strategist seat evaluates whether a decision advances or erodes the founder's live bet and the product's strategic position. It reads the `founder_bets` table (the live bet: "academic tools + offline-first win students from Discord"), `product-decisions.md`, and the milestone roadmap, then asks: does this move tighten or blur the wedge? Does it serve the North Star (weekly active students in study servers)? Does it respect the H1→H2→H3 horizon sequencing, or does it pull H2/H3 scope forward at the expense of proving the core thesis? The strategist is the seat most attuned to focus-vs-dilution, sequencing, build-vs-buy at the strategic layer, and whether a decision is consistent with the documented falsifier (students keep preferring Discord). It does NOT evaluate UX detail (user-advocate), technical risk (risk-officer), or evidence quality per se (realist) — it evaluates directional fit and strategic coherence.

## Decision classes the seat votes on
- P-0 Tier 3 product decisions
- P-0 / P-1 scope conflict / RECONSIDER / monolith
- D-2 / D-3 design-gap 3-cap
- Tech-product-impact (schema-breaking migration, breaking API change, third-party SDK adoption, model/cost step-change, data retention / PII change, OSS release / license commit)
- Cross-block decisions
- Head-ESCALATE under autonomous mode
- V-3 fast-fix retry-cap exhaustion
- daily-checkpoint resolution

## Role Focus
Weight research toward: how a senior strategist catches things this seat is uniquely positioned to catch — strategic drift, premature scaling, wedge-dilution, sequencing errors, focus loss, "doing the competitor's game" vs. own-wedge moves, build-vs-buy at the strategic layer, and the difference between a feature that serves the North Star and one that merely adds surface area. Emphasize startup-strategy and product-strategy precedent (focus, wedge, sequencing, premature scaling) grounded in named company cases.

De-prioritize: generic frameworks; UX detail; pure technical-risk content; abstract leadership advice.

## Required Output

Six sections, in order, each clearly headed (`§1`..`§6`). `§7` optional (overflow only).

### §1 LENS DEFINITION — 200-400 words
What is the strategist lens? What does it explicitly evaluate (bet alignment, direction, strategic position, sequencing, focus)? What does it NOT evaluate (where it ABSTAINS)? What separates a great application of this lens from a mediocre one? What kind of decision benefits MOST from this lens being applied rigorously?

### §2 EVALUATION DIMENSIONS — 8-15 dimensions; HARD CAP 15
Per dimension:
- `<Dimension name>: <single-sentence check this dimension applies>`
  PASS signal: `<what counts as PASS>`
  FAIL signal: `<what counts as FAIL>`
  NEUTRAL signal: `<when this dimension does not engage>`
  Source: `<link>`

Each dimension must produce a binary signal (PASS / FAIL) when it engages. NEUTRAL is the explicit "lens does not apply" signal. `[STABLE]` marker for enduring patterns from material >5 years old.

### §3 DOMAIN-SPECIFIC PATTERNS — 8-15 patterns
Patterns the **edtech** industry has converged on that the strategist lens applies (student-tool adoption, wedge-vs-incumbent positioning, community-product strategy, education-market GTM realities). Per pattern: Name / Pattern / When it applies / Cited example (real company, real decision, real outcome) / Source.

### §4 FAILURE MODES THIS LENS CATCHES — 8-15 modes
Failure modes the OTHER six BOARD seats systematically miss but strategist should catch. Per mode: Name / Pattern / Why other lenses miss it / Cost when it lands / strategist's catch.

### §5 HARD-STOP TRIGGERS — 4-8 triggers
Conditions under which strategist MUST emit `HARD-STOP: must be human` regardless of vote math. Per trigger: Trigger / Why human-required / Cited precedent.

### §6 NAMED EVIDENCE LIBRARY — 10-20 cases
Real, cited cases this lens references for rationale. Per case: Case / Decision / Outcome / Lesson / Source. NO PERSONAS. NO CELEBRITY IMPERSONATION.

### §7 ADDITIONAL — optional, only if §2 hits the 15 cap

## Source Quality
PRACTITIONER (eng/product-leadership essays, post-mortems) > CASE_STUDY (documented company retrospectives) > OFFICIAL > BOOK.

## Recency
Default last 5 years; `[STABLE]` enduring strategy patterns from older sources allowed.

## Length
6,000-12,000 words total.

## Deliverable
Single markdown document, headed `§1`..`§6` (and `§7` if used), formatted exactly as specified. No preamble, no closing summary — consumed by an automated pass.
