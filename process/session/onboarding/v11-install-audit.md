# v11 Install Audit — StudyHall

**Audited at:** 2026-06-26T07:50:00Z
**Audited by:** v11 install-audit stage
**Total delta count:** 16 (MVP-blocking) + 2 non-blocking notes

## Per-category delta

### external-tool (Phase 3–5)
- _none_ — `claudomat doctor --strict` returns STRICT OK (all CLIs, AgentMail env vars, gstack skills, gemini-deep-research key, Playwright × 10 present).

### prebuilt-collection (Phase 6a)
- `agent-creator` — MISSING card at `~/.claude/agents/agent-creator.md`. **Non-blocking:** agent-creator is run as a file-based pipeline (`claudomat-brain/setup-tools/agent-creator/agent-creator.md`) by the orchestrator, not spawned as a `subagent_type`. Note only; v12 may copy from VoltAgent if present, else proceed via the runbook.
- (bundled agents problem-framer / ceo-reviewer / ceo-agent / founder-proxy / mvp-thinner / milestone-decomposer + verifiers karen/jenny/code-quality-pragmatist/task-completion-validator/ui-comprehensive-tester/ultrathink-debugger + universals knowledge-synthesizer/backend-developer/frontend-developer — all OK.)

### head (Phase 6c) — ALL 8 MISSING
- `head-product` — agent-creator (head class) — gates P-block at P-4
- `head-designer` — agent-creator (head class) — gates D-block at D-3
- `head-builder` — agent-creator (head class) — gates B-block at B-6
- `head-tester` — agent-creator (head class) — gates T-block at T-9
- `head-verifier` — agent-creator (head class) — gates V-block at V-3
- `head-ci-cd` — agent-creator (head class) — owns C-block
- `head-learn` — agent-creator (head class) — owns L-block
- `head-next` — agent-creator (head class) — owns N-block

### board (Phase 6b) — 6 MISSING (founder-proxy OK)
- `strategist` — agent-creator (board class)
- `industry-expert` — agent-creator (board class); reads `project.yaml: stack.industry_domain = edtech`
- `realist` — agent-creator (board class)
- `user-advocate` — agent-creator (board class)
- `risk-officer` — agent-creator (board class); reads `stack.compliance_regime = none` + `founder-stage = self-use-mvp`
- `counter-thinker` — agent-creator (board class)
- (`founder-proxy` — OK, fixed seed.)

### bespoke-executor (Phase 6d)
- `supertokens-integration` — agent-creator (executor class). Source: stack-decisions.md (SuperTokens self-hosted auth, MVP).
- `livekit-integration` — agent-creator (executor class). Source: stack-decisions.md (LiveKit voice/video, M6/H1).
- `stripe-integration` — **non-blocking / deferred**: Stripe is H2 (M9). Generate when M9 activates, not at onboarding.
- (postgres-pro / react-specialist / typescript-pro / node-specialist / backend-developer / frontend-developer — all OK.)

### capability-sheet (Phase 7-final)
- regenerate via `claudomat capabilities` AFTER v12 installs the agents above (currently OK but pre-dates the heads/board).

### agentmail (Phase 8)
- _none_ — inbox `hungrycamp512@agentmail.to` present; env vars set.

## Verdict
**install-pending** — 16 MVP-blocking deltas (8 heads + 6 board + 2 bespoke integrations). v12 must generate these via the agent-creator pipeline, then regenerate the capability sheet, before v13 hands off. `stripe-integration` + the `agent-creator` card are non-blocking notes.
