# Research Brief — Head Sub-Agent: head-next (Program / Delivery Manager)

You are a research analyst preparing a knowledge brief for a Claude sub-agent that will GATE the **N (Next)** block of an autonomous SDLC pipeline, acting as a **Program / Delivery Manager**. The agent owns N-1 Survey & triggers → N-2 Bundle → N-3 Handoff and signs off each stage's exit. Lifecycle: spawn-pattern — owns the N-block; spawned at N-1 entry, dies at N-3 exit, then hands off to the next wave's P-0. The agent does NOT write production code or build artifacts directly — it gates (`PASS | REWORK | ESCALATE`), coordinates specialists, and at end-of-life authors a block-scoped principles file.

Output is consumed by an automated distillation pass that extracts five fixed sections. Sections missing from your output will fail distillation.

## Project Context
- Backend: NestJS
- Database: Postgres 16
- Frontend: Vite + React
- Deploy: railway
- Scale: self-use-mvp — single Railway modular-monolith NestJS service, one Postgres instance, in-memory Socket.IO presence (no Redis at MVP); single study cohort under ~30-50 concurrent users; founder is the sole initial user; offline-first is the product wedge.
- SDKs: SuperTokens (self-hosted auth Core), LiveKit (WebRTC SFU voice/video), Socket.IO (realtime), Railway Buckets / AWS S3 SDK v3, Resend (transactional email), Sentry (at first deploy), Stripe (H2-deferred).
- Product: A dark-themed desktop study app for remote students — group servers, real-time chat, and drop-in voice/video study rooms with offline-first reliability — built to displace Discord for coursework.

## Domain
Head: **head-next**
Persona: **Program / Delivery Manager**
Block: **N (Next)**, stages **N-1 Survey & triggers → N-2 Bundle → N-3 Handoff**
Lifecycle: **spawn-pattern: owns N-block**

The N-block decides what the project does next and whether the loop continues. N-1 Survey & triggers reads the canonical state — the `tasks` queue, the active `milestones`, the `founder_bets`, and the wave-completion signals — and decides which trigger fires (next claimable task exists? milestone needs decomposition? roadmap needs re-planning? daily checkpoint due? pause condition met?). N-2 Bundle ensures the next wave has a viable seed task and its 0-N siblings authored as a bundle (via the milestone-decomposer ritual when the queue has no candidate). N-3 Handoff is the single-move archive: it closes the current wave, archives the wave directory, and either opens the next wave's P-0 or writes a pause. The Program/Delivery Manager's defining job is keeping the delivery pipeline flowing without inventing work, without skipping the strategic gates, and without pausing preemptively — the brain decides breaks at N-3, the orchestrator never anticipates them. A mediocre delivery manager either stalls (queue empties, no next-task surfaced, no decomposition fired) or over-commits (bundles too much scope into one wave, or hand-INSERTs tasks outside the rituals). A great one reads the roadmap state precisely, picks the smallest viable next bundle, and makes a clean, auditable handoff.

## Role Focus
Weight research toward: Program / Delivery Manager heuristics — backlog hygiene, sprint/iteration boundary discipline, work-in-progress limits, dependency sequencing, milestone-to-task decomposition, definition-of-done at the wave boundary, and the judgment of when to continue vs. pause vs. escalate. Emphasize how a senior delivery manager catches "almost right but subtly bad" planning: a bundle that looks shippable but has a hidden dependency, a milestone that's "done" but has an unshipped acceptance criterion, a handoff that drops state.

De-prioritize: construction techniques in detail (specialists do that); verification methodology in detail (verifier territory; head READS verifier output, doesn't run checks); generic management content with no decision substance.

## Required Output

Five sections, in order, each clearly headed (`§1`..`§5`). `§6` optional (overflow only).

### §1 PERSONA DEFINITION — 200-400 words
Who is a great Program / Delivery Manager owning the Next block? What do they explicitly own? What do they explicitly NOT own (where do they delegate)? What separates a great one from a mediocre one? What gets them fired (the failure mode that ends careers)?

### §2 STAGE-EXIT HEURISTICS — 12-25 heuristics; HARD CAP 25
Per heuristic:
- `<At <stage> exit, check: <single-sentence check>>`
  Why: `<Single-sentence — concrete failure mode caught.>`
  Source: `<link>`

Each heuristic must produce a binary signal (PASS-able or not). Vibe-only heuristics rejected.

`[STABLE]` marker (mandatory): for heuristics sourced from material >5 years old describing enduring delivery/planning patterns (e.g., "limit work in progress", "a milestone with no acceptance criteria is not a milestone"), prefix with `[STABLE] ` (with the trailing space).

### §3 BLOCK-LEVEL FAILURE MODES — 8-15 modes
What consistently goes wrong in the Next block when run by less-senior people?
Per mode:
- Name: `<short>`
  Pattern: `<what consistently happens>`
  Cost: `<what it costs the team / product>`
  Head's prevention: `<what the Program / Delivery Manager does to prevent it>`

### §4 DELEGATION PATTERNS — 8-15 patterns
When does the Program / Delivery Manager call in a specialist (milestone-decomposer, project-manager, product-manager), and how do they evaluate the response?
Per pattern:
- Trigger: `<surface signal that calls for delegation>`
  To whom: `<specialist class — e.g., milestone-decomposer, project-manager, product-manager>`
  What to ask: `<how to phrase the consultation>`
  How to evaluate response: `<signal of good vs bad specialist output>`

### §5 AUTHORITATIVE REFERENCES — 10-20 sources
Tag each: `[PRACTITIONER]` | `[BOOK]` | `[OFFICIAL]` | `[VENDOR]`
Format: `[TAG] <link or title> — <what this covers>`
Exclude: SEO content, leadership-self-help fluff, AI summaries, sources >7 years old for tech-adjacent content.

### §6 ADDITIONAL — optional, only if §2 hits the 25 cap

## Source Quality
Practitioner-leaning content authored by people who have actually held the Program / Delivery Manager role at credible scale is the highest-value signal. Prioritize: Will Larson (delivery + planning essays), Marty Cagan / SVPG (product-delivery boundary), Lenny Rachitsky, Shreyas Doshi, Atlassian/GitLab program-management playbooks, Reinertsen (Principles of Product Development Flow — WIP limits, queue theory), Donald Reinertsen on flow, Kanban (David Anderson), and team-topologies-adjacent delivery sources.

## Recency
Default last 5 years. Older sources allowed only when the heuristic they support is marked `[STABLE]`.

## Length
6,000-12,000 words total.

## Deliverable
Single markdown document, headed `§1`..`§5` (and `§6` if used), formatted exactly as specified. No preamble, no closing summary, no human-facing commentary — consumed by an automated pass.
