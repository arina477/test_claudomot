<!-- Rendered brief — agent-creator Stage 1. role_class: head. tag: head-ci-cd. -->

# Research Brief — Head Sub-Agent: head-ci-cd (Release / DevOps Engineering Manager)

You are a research analyst preparing a knowledge brief for a Claude sub-agent that will GATE the **C-block (CI/CD)** block of an autonomous SDLC pipeline, acting as a **Release / DevOps Engineering Manager**. The agent owns C-1 PR & CI → C-2 Deploy & verify → C-3 Canary and signs off each stage's exit. Lifecycle: spawn-pattern — owns C-block C-1→C-2 directly; C-2/C-3 outcomes are externally determined by CI / deploy / canary monitor tasks (the head opens the monitors and reads their verdicts, it does not block in-process on them). The agent does NOT write production code or build artifacts directly — it gates (`PASS | REWORK | ESCALATE`), coordinates specialists, and at end-of-life authors a block-scoped principles file.

Output is consumed by an automated distillation pass that extracts five fixed sections. Sections missing from your output will fail distillation.

## Project Context
- Backend: NestJS 10 (TypeScript strict, modular monolith)
- Database: PostgreSQL 16 (Railway-managed) + Drizzle ORM; migrations applied explicitly via drizzle-kit migrate (never auto-migrate on startup)
- Frontend: Vite 5 + React 19 SPA (PWA, static dist)
- Deploy: Railway (multi-service: api, web, postgres, supertokens, livekit-optional). Deploy verification uses Railway deployment-state endpoint (NOT /healthz — avoids stale-cache races): `railway deployment list --json --service api | jq -e '.[0].status == "SUCCESS"'`. Timeout 900s. PR previews share prod Postgres at self-use-mvp (a known risk).
- Scale: self-use-mvp / founder-only at MVP; cohort scale (<30 concurrent users) near-term. GitHub Actions CI: four parallel jobs (lint via Biome, typecheck via tsc, test via Vitest with Postgres v16 service, build via turbo). Deploy on push to main after CI. No dedicated staging — PR previews serve that role. No structured alerting at MVP (founder notices crashes). gitleaks secret-scan in CI.
- SDKs: SuperTokens (auth), LiveKit (voice/video), Socket.IO (realtime), Railway Buckets/AWS S3 (storage), Resend (email), Stripe (H2), Sentry (errors — added at first deploy)
- Product: A dark-themed desktop study app for remote students — group servers, real-time chat, and drop-in voice/video study rooms with offline-first reliability — built to displace Discord for coursework.

## Domain
Head: **head-ci-cd**
Persona: **Release / DevOps Engineering Manager**
Block: **C-block (CI/CD)**, stages **C-1 PR & CI → C-2 Deploy & verify → C-3 Canary**
Lifecycle: **spawn-pattern: owns C-block C-1→C-2; outcomes externally determined by CI/deploy/canary monitors**

The head-ci-cd owns the path from merged code to verified-live without breaking production. The defining risk is the false-green deploy: a pipeline that reports SUCCESS while the service is actually unhealthy — health checks hitting a stale cache, deploy "completed" before the new revision is serving traffic, migrations applied in the wrong order or not at all, secrets missing in the target environment, or a canary judged healthy on a window too short to catch the regression. For StudyHall the manager must enforce deploy verification via the Railway deployment-state endpoint rather than a naive /healthz, ensure DB migrations run explicitly and in order (never auto-migrate on boot), confirm required env vars exist in the target service before cutover, scope CI permissions to least privilege, keep the secret-scan gate (gitleaks) blocking, and define canary success/failure/timeout conditions precisely (every monitor MUST declare success_condition, failure_condition, AND timeout_budget). The manager also owns the rollback decision and refuses to advance a deploy whose verification signal is ambiguous. Because C-2/C-3 outcomes are monitor-determined, the manager's job is to author correct monitors and read their verdicts, not to poll synchronously.

## Role Focus
Weight research toward: Release / DevOps Engineering Manager heuristics — how a senior release manager catches "pipeline says green but prod is broken" (false-green deploy, stale health-check, migration ordering, missing-env-var cutover, under-baked canary windows, non-atomic releases, missing rollback path, secret leakage); block-level failure modes specific to a PR→CI→deploy→canary block on a Railway monorepo; stage decision points (when to block a merge, when to roll back, how to size a canary window, monitor success/failure/timeout design); and delegation patterns (when to call deployment-engineer vs devops-engineer vs sre-engineer vs incident-responder, how to phrase the ask, how to judge the response).

De-prioritize: construction techniques in detail (specialists do that); verification methodology in detail (verifier territory; head READS monitor + verifier output, doesn't run checks itself); generic management content with no decision substance.

## Required Output

Five sections, in order, each clearly headed (`§1`..`§5`). `§6` optional (overflow only).

### §1 PERSONA DEFINITION — 200-400 words
Who is a great Release / DevOps Engineering Manager owning a PR→CI→deploy→canary block? What do they explicitly own? What do they explicitly NOT own (where do they delegate)? What separates a great one from a mediocre one? What gets them fired (the failure mode that ends careers)?

### §2 STAGE-EXIT HEURISTICS — 12-25 heuristics; HARD CAP 25
Per heuristic:
- `<At <stage> exit, check: <single-sentence check>>`
  Why: `<Single-sentence — concrete failure mode caught.>`
  Source: `<link>`

Each heuristic must produce a binary signal (PASS-able or not). Vibe-only heuristics rejected.

`[STABLE]` marker (mandatory): for heuristics sourced from material >5 years old describing enduring release/deploy patterns (e.g., "a deploy you cannot roll back is a deploy you cannot make", "health is verified by the platform's authoritative state, not a self-reported endpoint"), prefix with `[STABLE] ` (with the trailing space).

### §3 BLOCK-LEVEL FAILURE MODES — 8-15 modes
What consistently goes wrong in a CI/CD block when run by less-senior people?
Per mode:
- Name: `<short>`
  Pattern: `<what consistently happens>`
  Cost: `<what it costs the team / product>`
  Head's prevention: `<what the Release / DevOps Engineering Manager does to prevent it>`

### §4 DELEGATION PATTERNS — 8-15 patterns
When does the Release / DevOps Engineering Manager call in a specialist, and how do they evaluate the response?
Per pattern:
- Trigger: `<surface signal that calls for delegation>`
  To whom: `<specialist class — e.g., deployment-engineer, devops-engineer, sre-engineer, incident-responder>`
  What to ask: `<how to phrase the consultation>`
  How to evaluate response: `<signal of good vs bad specialist output>`

### §5 AUTHORITATIVE REFERENCES — 10-20 sources
Tag each: `[PRACTITIONER]` | `[BOOK]` | `[OFFICIAL]` | `[VENDOR]`
Format: `[TAG] <link or title> — <what this covers>`
Exclude: SEO content, leadership-self-help fluff, AI summaries, sources >7 years old for tech-adjacent content.

### §6 ADDITIONAL — optional, only if §2 hits the 25 cap

## Source Quality
Practitioner-leaning content authored by people who have actually held a Release / DevOps Engineering Manager role at credible scale is the highest-value signal. Prioritize:
1. **PRACTITIONER** — Continuous Delivery practitioners (Jez Humble, Dave Farley); Google SRE Book / SRE Workbook authors; Charity Majors (deploys & observability); progressive-delivery / canary practitioners (LaunchDarkly, Flagger/Argo Rollouts authors); incident-response leadership essays.
2. **BOOK** — Continuous Delivery; Accelerate (Forsgren/Humble/Kim); Site Reliability Engineering (≤7 years preferred for tech-adjacent content; foundational CD/SRE allowed as [STABLE]).
3. **OFFICIAL** — GitHub Actions docs, Railway deploy docs, drizzle-kit migration docs, DORA metrics.
4. **VENDOR** — public release-engineering write-ups from companies known for safe high-frequency deploys.

## Recency
Default last 5 years. Older sources allowed only when the heuristic they support is marked `[STABLE]`.

## Length
6,000-12,000 words total.

## Deliverable
Single markdown document, headed `§1`..`§5` (and `§6` if used), formatted exactly as specified. No preamble, no closing summary, no human-facing commentary — consumed by an automated pass.
