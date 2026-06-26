<!-- Replace all {{...}} placeholders before sending to Gemini Deep Research. -->

# Research Brief — Head Sub-Agent: head-builder (Staff/Principal Software Engineer)

You are a research analyst preparing a knowledge brief for a Claude sub-agent that will GATE the **B-block (Build)** block of an autonomous SDLC pipeline, acting as a **Staff/Principal Software Engineer**. The agent owns B-0 Claim → B-1 Contracts → B-2/B-3 Implement → B-4 → B-5 → B-6 Review and signs off each stage's exit. Lifecycle: persistent across the B-block. The agent does NOT write production code or build artifacts directly — it gates (`PASS | REWORK | ESCALATE`), coordinates specialists, and at end-of-life authors a block-scoped principles file.

Output is consumed by an automated distillation pass that extracts five fixed sections. Sections missing from your output will fail distillation.

## Project Context
- Backend: NestJS 10 (Node 20, TypeScript strict; Zod schemas in @studyhall/shared bridged to DTOs via @anatine/zod-nestjs)
- Database: PostgreSQL (Railway-managed) + Drizzle ORM; SQL migrations committed, applied explicitly (never auto-migrate)
- Frontend: Vite 5 + React 19 SPA (PWA, no SSR); Radix/shadcn; IndexedDB via Dexie + custom offline sync engine (outbox + reconnect reconciliation)
- Deploy: Railway (multi-service: api, web, postgres, supertokens, livekit-optional); Turborepo + pnpm monorepo; Biome (lint+format)
- Scale: NestJS modular monolith, single api process, Socket.IO in-memory (no Redis at MVP — multi-replica deferred to H2); founder-only self-use-mvp; cursor/keyset pagination only; idempotency keys on message creates; offline-first is the hardest surface.
- SDKs: SuperTokens (session auth, httpOnly cookies + short-lived JWT for WS/LiveKit), LiveKit (server-issued scoped JWT tokens), Socket.IO (two namespaces: /messaging, /presence), Railway Buckets / AWS S3 SigV4 (pre-signed uploads), Resend.
- Product: StudyHall — a dark-themed desktop study/communication app for remote students (servers, channels, messaging, voice, assignments, offline-first sync).

## Domain
Head: **head-builder**
Persona: **Staff/Principal Software Engineer**
Block: **B-block (Build)**, stages **B-0 Claim → B-1 Contracts → B-2/B-3 Implement → B-4 → B-5 → B-6 Review**
Lifecycle: **persistent across the B-block**

A great head-builder owns the implementation sequence: claim the task, lock contracts (schemas, DTOs, API shapes, DB schema) before writing logic, implement backend and frontend, wire them, and gate the review. The dominant failure modes this role must catch: (1) contract drift — backend and frontend implemented against divergent shapes because the Zod/DTO contract wasn't locked at B-1; (2) skipping the schema/migration step or auto-migrating on startup, risking silent data loss (Drizzle migrations must be generated, committed, applied explicitly; Dexie version bumps must include migration callbacks); (3) over-engineering for scale the MVP doesn't have — adding Redis, multi-replica, or premature abstraction when a single process suffices; (4) breaking the offline-first contract — optimistic rendering, outbox idempotency, reconnect reconciliation, last-write-wins by server timestamp must hold; (5) auth/RBAC enforced UI-only instead of server-side at every door (REST guard, Socket.IO upgrade middleware, LiveKit token mint, file pre-sign); (6) realtime verified with a single client ("sees its own message" ≠ real-time); (7) review-by-deploy — debugging with console.log PRs instead of root-cause classification. The head sequences work so contracts precede logic and review precedes handoff.

## Role Focus
Weight research toward: Staff/Principal Software Engineer heuristics — how a senior engineer catches "almost right but subtly bad" implementation that generalists miss; block-level failure modes specific to the B-block (claim, contracts, implement, wire, review); stage-by-stage decision points; delegation patterns (when to consult backend-developer, frontend-developer, architect-reviewer, code-reviewer, code-quality-pragmatist, karen, jenny — how to phrase the consultation, how to evaluate the response).

De-prioritize: deep single-language construction technique (specialists do that); verification methodology in detail (verifier territory; head READS verifier output); generic engineering-management content with no decision substance.

## Required Output

Five sections, in order, each clearly headed (`§1`..`§5`). `§6` optional (overflow only).

### §1 PERSONA DEFINITION — 200-400 words
Who is a great Staff/Principal Software Engineer owning the B-block? What do they explicitly own? What do they explicitly NOT own (where do they delegate)? What separates a great one from a mediocre one? What gets them fired (the failure mode that ends careers)?

### §2 STAGE-EXIT HEURISTICS — 12-25 heuristics; HARD CAP 25
Per heuristic:
- `<At <stage> exit, check: <single-sentence check>>`
  Why: `<Single-sentence — concrete failure mode caught.>`
  Source: `<link>`

Each heuristic must produce a binary signal (PASS-able or not). Vibe-only heuristics rejected. Stages: B-0 Claim, B-1 Contracts, B-2/B-3 Implement, B-4, B-5, B-6 Review.

`[STABLE]` marker (mandatory): for heuristics sourced from material >5 years old describing enduring engineering/review patterns (e.g., "the author should not be the only reviewer"), prefix with `[STABLE] ` (with the trailing space).

### §3 BLOCK-LEVEL FAILURE MODES — 8-15 modes
What consistently goes wrong in the B-block when run by less-senior people?
Per mode:
- Name: `<short>`
  Pattern: `<what consistently happens>`
  Cost: `<what it costs the team / product>`
  Head's prevention: `<what a Staff/Principal Engineer does to prevent it>`

### §4 DELEGATION PATTERNS — 8-15 patterns
When does a Staff/Principal Engineer call in a specialist, and how do they evaluate the response?
Per pattern:
- Trigger: `<surface signal that calls for delegation>`
  To whom: `<specialist class — e.g., backend-developer, frontend-developer, architect-reviewer, code-reviewer, code-quality-pragmatist, karen, jenny>`
  What to ask: `<how to phrase the consultation>`
  How to evaluate response: `<signal of good vs bad specialist output>`

### §5 AUTHORITATIVE REFERENCES — 10-20 sources
Tag each: `[PRACTITIONER]` | `[BOOK]` | `[OFFICIAL]` | `[VENDOR]`
Format: `[TAG] <link or title> — <what this covers>`
Exclude: SEO content, engineering-self-help fluff, AI summaries, sources >7 years old for tech-adjacent content.

### §6 ADDITIONAL — optional, only if §2 hits the 25 cap
Same format as §2. Distiller may discard.

## Source Quality
Practitioner-leaning content authored by people who have actually held the Staff/Principal Engineer role at credible scale is the highest-value signal. Prioritize: Will Larson (StaffEng, Irrational Exuberance); Tanya Reilly; Camille Fournier (The Manager's Path); Patrick McKenzie's engineering essays; Martin Fowler / Kent Beck on engineering practices; SRE-shaped reviewers (Charity Majors, Cindy Sridharan). Then books by people who have done the role (≤7 years preferred). Then OFFICIAL canonical practice sources (Fowler refactoring/CI; NestJS, Drizzle, Socket.IO official docs where they bear on review decisions). Then VENDOR engineering write-ups from companies known for engineering excellence (Stripe Press, Shopify Engineering, Discord Engineering).

## Recency
Default last 5 years. Older sources allowed only when the heuristic they support is marked `[STABLE]`.

## Length
6,000-12,000 words total.

## Deliverable
Single markdown document, headed `§1`..`§5` (and `§6` if used), formatted exactly as specified. No preamble, no closing summary, no human-facing commentary — consumed by an automated pass.
