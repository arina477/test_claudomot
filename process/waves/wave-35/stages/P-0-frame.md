# Wave 35 — P-0 Frame

**Wave topic:** M7 privacy controls — settings-privacy bundle (seed 56a50862 + siblings a4169fac data-view/download, d40ece71 Sentry, 13b7ebfd privacy/terms stubs).
**Milestone:** M7 (6e2f68d8) in_progress · Class=product-polish · Tier=T4 · last H1 · MVP-completing.
**wave_db_id:** 329758b1-e748-489f-be5d-40c5d8b97c45 · **Mode:** automatic.

## Reframe spawns (mandatory)
- **problem-framer** → `stages/P-0-problem-framer.md` — verdict **ESCALATE**. Symptom-vs-cause: the seed correctly demands server-side enforcement, but who-can-DM gates a **non-existent target** — StudyHall has no DM feature (messaging is channel-only; Direct messages = feature #21, H2-deferred). Spec contradiction (antipattern #10) between M7's success metric and the roadmap. profile-visibility, data-download, Sentry, stubs all PROCEED. (mvp-thinner NOT spawned — Class=product-polish, not product-feature.)
- **ceo-reviewer** → `stages/P-0-ceo-review.md` — verdict **PROCEED (HOLD-SCOPE)**. Privacy is the named Discord-displacer wedge; right MVP-completing move. No Tier-3 founder asks. Build note: Sentry `beforeSend` PII scrub mandatory.

## Escalation resolution — BOARD (automatic mode, scope conflict → 4+/7)
Convened `descope-who-can-dm-w35` (7 seats: strategist, industry-expert, realist, user-advocate, risk-officer, counter-thinker, founder-proxy). **Result: Path A adopted, 6/7 APPROVE** (counter-thinker REJECT, favoring clean-drop A′ — its guardrail folded in). No hard-stop vetoes. Full record: `escalations/board-descope-who-can-dm-w35.md`.

## P-0 outcome — **PROCEED under amended scope (Path A)**
- **profile-visibility** — enforced now, server-side gate on member-roster (`GET /servers/:id/members`) + profile-read (`GET /profile`).
- **who-can-DM** — persisted preference server-side, fixed enum `everyone`/`server-members`/`nobody` locked to the future DM guard's contract; **NO active-looking toggle** (binding AC: no control that appears active but enforces nothing); enforcement filed as AC on feature #21.
- **M7 success metric AMENDED** in the milestones row to match the roadmap. Seed 56a50862 description rewritten to Path A. feature-list.md #21 carries the who-can-DM enforcement AC. Recorded in product-decisions.md (founder-visible) + board-digest 2026-07-02.
- Siblings a4169fac (data view/download), d40ece71 (Sentry — with PII scrub), 13b7ebfd (privacy/terms stubs + empty/error/loading) proceed as framed.

## Discovery (Actions 1–4)
- **Prior work:** wave-31 uniform-403 voice RBAC gate is the enforcement pattern to mirror for profile-visibility. No prior settings-privacy spec (prose seed) → no-prior-spec short-circuit → full P-1..P-3.
- **Roadmap:** M7 active + in_progress (single invariant holds); waves.milestone_id backfilled at P-0 Action 2.
- **Product-decision signals:** privacy enforcement + Sentry vendor + data-download all cleared as safe defaults / resolved at BOARD; no open Tier-3 founder poll.
- **Security scope:** wave touches user-scoped data-read authz (profile-visibility enforcement) + data-export → T-8 security stage engaged; P-4 security-scope tightened gate applies.

## Next
→ P-1 Decompose (4-task bundle; likely design_gap_flag=true — settings-privacy + privacy/terms pages).
