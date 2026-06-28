# Wave 1 — P-4 Verdict

**Reviewer:** head-product (fresh spawn, agentId head-product@P-4-wave-1)
**Reviewed against:** process/waves/wave-1/blocks/P/review-artifacts.md
**Attempt:** 1  (1 = first gate, 2+ = post-rework)
**Phase:** 1 (head-product)

## Verdict
APPROVED

## Rationale
This is a clean, correctly-framed foundation wave. The work sits at the cause layer (greenfield monorepo + deployable dark shell + green CI is the unavoidable substrate every later module inherits) and ladders to a single live milestone — M1 Foundation (`platform-foundation`, `in_progress`), with the wave's `milestone_id` set to M1 and the seed task's "## Why" citing the enabling bet. P-0's two reviewers are present and reconciled (problem-framer RESCOPE-AUTO-SPLIT on size, ceo-reviewer PROCEED/HOLD-SCOPE), and P-1 honored the split cleanly: the wave is seed-only (single-spec), the floor is met (~2,300–3,300 net LOC > the 1,500 single-spec floor), and the two auth siblings were re-parented to future seeds with no in-bundle dependency on unbuilt work. The spec's eight acceptance criteria are all observable and falsifiable (install succeeds, `/health` returns 200 with `{"status":"ok"}`, three-column shell renders, lint/typecheck/build exit 0, CI green) rather than vague aspirations; the four non-happy states (clean-machine install, API-unreachable offline render, narrow-window collapse, CI-fails-red) are specified; non-goals are explicit; and the full spec contract is embedded as a fenced YAML head in the primary `tasks.description`. The P-3 plan reuses the locked architecture verbatim (Turborepo+pnpm, NestJS modular-monolith HealthModule, Vite+React 19 SPA, `packages/shared` Zod, Biome) with every AC mapped to a file-level step, valid catalog specialists, and a sound parallelization map. `design_gap_flag=false` is justified — the shell consumes the already-approved design system and mockups (no net-new surface). No gold-plating for the self-use-mvp wedge: no Redis, no multi-replica, no billing, no auth infrastructure; the deferred auth/DB/voice work is correctly pushed to later waves. Two drifts are recorded below as binding/minor findings for Phase 2 + B-0 — neither invalidates the framing, decomposition, or spec, so they do not warrant a REWORK cycle, but the Node-version drift MUST be reconciled before/at B-0 and is handed to Karen for independent verification.

## Findings carried to Phase 2 + B-block (non-blocking to Phase 1 APPROVAL)

### F-1 (BINDING — reconcile at B-0; verify in Phase 2 via Karen)
- **What:** The locked architecture library (`command-center/dev/architecture/_library.md`, §Stack / §Tools / §DevOps) pins **Node v20.15.0** (`.nvmrc` + root `engines` + CI `node-version-file: .nvmrc`). The P-3 plan's B-0 step writes `.nvmrc (node 22)`, and the spec's edge-cases section independently states "Node 22 + pnpm." These are two consistent, deliberate statements of Node 22 — a real conflict with the authoritative doc, which "wins on any conflict."
- **Heuristic fired:** H-P (architecture-blind plan / load-bearing-claim drift) — a foundation wave bakes the Node pin into `.nvmrc`, `engines`, and the CI matrix, so a wrong pin propagates everywhere.
- **Why not REWORK:** mechanically trivial (one version string), isolated to P-3 (cascade terminal), does not affect framing/decomposition/spec quality, and is double-netted by Phase 2 Karen (load-bearing-claim verification).
- **Required resolution at B-0 (binding):** either (a) pin **Node v20.15.0** per the locked architecture across `.nvmrc` + `engines` + CI, OR (b) if Node 22 is a deliberate upgrade, FIRST amend `_library.md` (the doc that wins on conflict) and record the decision in `command-center/product/product-decisions.md`, THEN proceed. Do not let the build silently diverge from the locked doc.

### F-2 (MINOR — manifest hygiene)
- **What:** `process/waves/wave-1/blocks/P/review-artifacts.md` still carries pre-split framing in its header ("Bootstrap the StudyHall foundation (M1) — monorepo + dark app shell + auth + profiles") and lists the security-scope tightened gate as an "Open escalation carried into gate." Post-split, this wave implements **no auth surface** (`/health` is anonymous; auth backend + auth/profile pages are the deferred siblings b9118041 / 9aae8255).
- **Effect:** The security-scope tightened gate (P-4) and T-8 obligations do **not** apply to this wave's scope. The stale header risks a downstream reader re-triggering security scope that no longer exists this wave.
- **Resolution:** update the manifest "Wave topic" + "Open escalations" to reflect the seed-only scope; carry the auth security-scope obligation forward to the wave that actually claims b9118041. No code impact.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3

---

## Phase 2 — Karen + jenny + Gemini (merged, appended by orchestrator)

**Phase:** 2 · **Final attempt:** 3 (after 2 Node-version reworks)

| Reviewer | Verdict | Notes |
|---|---|---|
| **karen** | **APPROVE** (attempt 3) | Initially BLOCK ×2 on a genuine load-bearing Node-version conflict (architecture pinned 20.15.0 vs plan/CI 22). Reconciled to Node 22, `.nvmrc` as single CI source across `_library.md`/`tools.md`/`devops.md`/`ci.yml`. Logged in product-decisions.md. AGENTS.md catalog gap (typescript-pro/devops-engineer) also fixed. |
| **jenny** | **APPROVE** | Zero spec-vs-intent drift; all 17 spec items MATCH; auth deferral is roadmap-consistent. 2 record-only nuances (member-list column out of scope this wave; HealthResponse 'degraded' forward-compat). |
| **Gemini** | **UNAVAILABLE** | Cross-review helper exit=3 ("no text in response"); per gate rules UNAVAILABLE degrades and does NOT block. Gate proceeds on Karen + jenny. |

**Gate result: PASS.** Karen + jenny both APPROVE; Gemini UNAVAILABLE (degradable). design_gap_flag=false → exit P-block to B-0.

### Carry-forward to B-block (load-bearing)
- **`.nvmrc`=22 MUST be created** in the monorepo scaffold (B-0): all 4 CI jobs use `node-version-file: .nvmrc`; absent/drifted file fails CI. task-completion-validator to confirm at B-6.
- member-list column out of this wave's shell (jenny nuance 1).

## Footer
- verdict_complete: true
- phase_2_result: PASS
