# Onboarding Complete — StudyHall

**Completed:** 2026-06-26T08:20:00Z
**Initial commit:** c8be250
**First wave seed:** `cbf25dd5-95ab-4ebf-a7bc-a5e6a3714804` (task "Bootstrap monorepo + dark app shell + CI", under M1 — Foundation, `in_progress`)

## What exists
- Bets → `founder_bets` table in Postgres (1 live bet: academic + offline-first wins students from Discord)
- Roadmap (milestones) → `milestones` table: 13 milestones (7 H1, 4 H2, 2 H3); M1 promoted to `in_progress`
- Tasks → `tasks` table: M1's first bundle (1 seed + 2 siblings) seeded for wave-1; further bundles per-wave from N-1
- Founder stage + product decisions → `command-center/product/founder-stage.md` (self-use-mvp) + `product-decisions.md`
- Competitor research (Tier 1/2/3) → `command-center/artifacts/competitive-benchmarks/` (Discord/Teams Tier 1)
- Architecture (8 domains + library) → `command-center/dev/architecture/` (`_library.md` authoritative; module-list locked)
- Design direction + system + 14 per-page mockups → `design/` (calm dark, emerald accent)
- Agent catalog → 8 Heads + 7 BOARD seats + bespoke executors at `~/.claude/agents/` (skeleton-synthesized; refresh via `claudomat sync`)
- CI pipeline → `.github/workflows/ci.yml`; charter → `command-center/management/ceo-blocklist.md` (Conservative)

## Next — enter the wave loop

Onboarding is done — the wave loop is open. To start the first wave, tell the orchestrator:

> "Start the first wave"

`claudomat-brain/DISPATCHER.md` step 0 then reads `process/session/.last-wave-completed.yaml`, runs its preflight (capability-sheet refresh + `claudomat doctor`), and enters `claudomat-brain/blocks/product/product.md` → **P-0 Frame** against seed task `cbf25dd5` under milestone M1.

**One-time agent load:** The agents and MCP servers installed during onboarding register only when the brain runs on a fresh process. On hosted, the worker recycles the brain once at this onboarding→wave boundary — send "Start the first wave" to begin. If the first wave reports a missing Head agent ("agent not found"), the brain was not recycled: restart or resume the session from Studio, then resend "Start the first wave".

## Modes (post-onboarding)

Type the **mode-file name verbatim** to enter an autonomous mode:

- `default` — skip nice-to-haves; strategic + hard-stops to founder. No `/loop`.
- `automatic` — BOARD (7 seats) resolves ambiguity. Bootstraps `/loop`. Splits + hard-stops to founder. **(currently active)**
- `degenerate` — ceo-agent within `command-center/management/ceo-blocklist.md` charter. Bootstraps `/loop`. Per-decision email.

Type `founder-review` (or delete `process/session/.autonomous-session`) to revert. Full spec: `claudomat-brain/management/mode-switching.md`.

> **Note:** the project is already in `automatic` mode (engaged via sidebar). The first wave will fire on the next tick once the brain is recycled so the newly-installed Head/BOARD agents register.
