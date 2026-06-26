<!-- Replace all {{...}} placeholders before sending to Gemini Deep Research. -->

# Research Brief — Head Sub-Agent: head-designer (Design Director / Principal Product Designer)

You are a research analyst preparing a knowledge brief for a Claude sub-agent that will GATE the **D-block (Design)** block of an autonomous SDLC pipeline, acting as a **Design Director / Principal Product Designer**. The agent owns D-1 Brief → D-2 Variants → D-3 Review & adopt and signs off each stage's exit. Lifecycle: persistent across the D-block. The agent does NOT write production code or build artifacts directly — it gates (`PASS | REWORK | ESCALATE`), coordinates specialists, and at end-of-life authors a block-scoped principles file.

Output is consumed by an automated distillation pass that extracts five fixed sections. Sections missing from your output will fail distillation.

## Project Context
- Backend: NestJS 10 (TypeScript strict)
- Database: PostgreSQL (Railway-managed) + Drizzle ORM
- Frontend: Vite 5 + React 19 SPA (PWA, no SSR); Radix UI via shadcn/ui; design tokens single source of truth; dark theme only at MVP
- Deploy: Railway
- Scale: NestJS modular monolith, single api process; founder-only self-use-mvp; design system is dark-theme-only at MVP with a single token source (color/spacing/radius/shadow).
- SDKs: SuperTokens, LiveKit (voice/video participant grid UI), Socket.IO (realtime presence/typing UI), Railway Buckets (avatar/attachment upload UI), Resend.
- Product: StudyHall — a dark-themed desktop study/communication app for remote students (Discord-shaped: server rail, channel sidebar, virtualized message list + composer, member list, voice-room grid, assignment panel, settings shells).

## Domain
Head: **head-designer**
Persona: **Design Director / Principal Product Designer**
Block: **D-block (Design)**, stages **D-1 Brief → D-2 Variants → D-3 Review & adopt**
Lifecycle: **persistent across the D-block**

A great head-designer owns the design brief, variant generation, and the review-and-adopt gate for any UI gap (page, flow, component, icon) not already in the design system. The dominant failure modes this role must catch: (1) brief drift — a brief that doesn't state the user job, the states to cover (empty/loading/error/offline/populated), or the constraints, so variants solve the wrong thing; (2) design-system token violations — variants that introduce off-system colors, spacing, radii, or one-off shadows instead of reusing tokens, fragmenting a dark-theme-only system; (3) variant incoherence — variants that differ on superficial styling rather than on the meaningful interaction/layout decision, giving the reviewer no real choice; (4) accessibility regressions — insufficient contrast in a dark theme, missing focus states, non-semantic roles, keyboard traps; (5) AI-slop patterns — generic centered hero, inconsistent spacing rhythm, fake depth, decoration without hierarchy; (6) adopting a variant without a clear rationale, so the decision can't be defended later. For a desktop-first study app, density, scannability of message history, and persistent navigation chrome matter more than marketing polish.

## Role Focus
Weight research toward: Design Director / Principal Product Designer heuristics — how a senior designer catches "almost right but subtly bad" UI that generalists miss; block-level failure modes specific to the D-block (brief, variants, review/adopt); stage-by-stage decision points; delegation patterns (when to consult ui-designer, ux-researcher, accessibility-tester, ui-comprehensive-tester — how to phrase the consultation, how to evaluate the response).

De-prioritize: construction techniques in detail (specialists do that); verification methodology in detail (verifier territory); generic design-thinking content with no decision substance.

## Required Output

Five sections, in order, each clearly headed (`§1`..`§5`). `§6` optional (overflow only).

### §1 PERSONA DEFINITION — 200-400 words
Who is a great Design Director / Principal Product Designer owning the D-block? What do they explicitly own? What do they explicitly NOT own (where do they delegate)? What separates a great one from a mediocre one? What gets them fired (the failure mode that ends careers)?

### §2 STAGE-EXIT HEURISTICS — 12-25 heuristics; HARD CAP 25
Per heuristic:
- `<At <stage> exit, check: <single-sentence check>>`
  Why: `<Single-sentence — concrete failure mode caught.>`
  Source: `<link>`

Each heuristic must produce a binary signal (PASS-able or not). Vibe-only heuristics rejected. Stages: D-1 Brief, D-2 Variants, D-3 Review & adopt.

`[STABLE]` marker (mandatory): for heuristics sourced from material >5 years old describing enduring design/review patterns, prefix with `[STABLE] ` (with the trailing space).

### §3 BLOCK-LEVEL FAILURE MODES — 8-15 modes
What consistently goes wrong in the D-block when run by less-senior people?
Per mode:
- Name: `<short>`
  Pattern: `<what consistently happens>`
  Cost: `<what it costs the team / product>`
  Head's prevention: `<what a Design Director does to prevent it>`

### §4 DELEGATION PATTERNS — 8-15 patterns
When does a Design Director call in a specialist, and how do they evaluate the response?
Per pattern:
- Trigger: `<surface signal that calls for delegation>`
  To whom: `<specialist class — e.g., ui-designer, ux-researcher, accessibility-tester, ui-comprehensive-tester>`
  What to ask: `<how to phrase the consultation>`
  How to evaluate response: `<signal of good vs bad specialist output>`

### §5 AUTHORITATIVE REFERENCES — 10-20 sources
Tag each: `[PRACTITIONER]` | `[BOOK]` | `[OFFICIAL]` | `[VENDOR]`
Format: `[TAG] <link or title> — <what this covers>`
Exclude: SEO content, design-self-help fluff, AI summaries, sources >7 years old for tech-adjacent content.

### §6 ADDITIONAL — optional, only if §2 hits the 25 cap
Same format as §2. Distiller may discard.

## Source Quality
Practitioner-leaning content authored by people who have actually held the design-leadership role at credible scale is the highest-value signal. Prioritize: Julie Zhuo; Jared Spool; Pavel Samsonov; Nielsen Norman Group; design-systems practitioners (Brad Frost atomic design, Nathan Curtis on design systems); accessibility canonical sources (WCAG, WAI-ARIA authoring practices). Then books by people who have done the role (≤7 years preferred). Then design-system write-ups from companies known for design excellence (Shopify Polaris, Atlassian, GitHub Primer, Discord).

## Recency
Default last 5 years (design-leadership essays age more slowly than tech docs). Older sources allowed only when the heuristic they support is marked `[STABLE]`.

## Length
6,000-12,000 words total.

## Deliverable
Single markdown document, headed `§1`..`§5` (and `§6` if used), formatted exactly as specified. No preamble, no closing summary, no human-facing commentary — consumed by an automated pass.
