# Wave 28 — P-block review artifacts

**Block:** P (Product)
**Wave topic:** Rotate permanent server invite_code — owner-gated regenerate endpoint (invalidate leaked permanent invite links)
**Block exit gate:** P-4
**Status:** gate-passed

## Stage deliverables
| Stage | Deliverable file | Status | Notes |
|---|---|---|---|
| P-0 | process/waves/wave-28/stages/P-0-frame.md | done | PROCEED×3 (problem-framer/ceo-reviewer/mvp-thinner); owner-ONLY gate + generateCode reuse; single-spec, design_gap expected FALSE |
| P-1 | process/waves/wave-28/stages/P-1-decompose.md | done | single-spec; under-floor override-ship (PRECEDENT-APPLICATION 7th, floor_merge_attempt 0); design_gap_flag=FALSE → skip D |
| P-2 | process/waves/wave-28/stages/P-2-spec.md | done | 7 ACs + contracts + edge-cases written to d058283d.description; single-spec YAML head |
| P-3 | process/waves/wave-28/stages/P-3-plan.md | done | node-specialist; 1 service method + owner-only route + unit + integration proof; no schema/contract/frontend/dep |
| P-4 | process/waves/wave-28/blocks/P/gate-verdict.md | done | head-product APPROVED; karen+jenny APPROVE (jenny drift resolved via decision-log); Gemini UNAVAILABLE-429 (non-block); gate-passed |

## Block-specific context
- **Wave topic:** Add `POST /servers/:id/invite-code/rotate` (owner-gated, AuthGuard) that regenerates the CSPRNG `servers.invite_code`, invalidating the old permanent link. Same locked-CSPRNG + 23505-retry pattern as wave-8/9 invite issuance. Source: wave-9 P-4 Gemini flag + karen/jenny follow-up (the permanent default invite link is currently irrevocable if leaked; revoke only covers ad-hoc invites).
- **Spec-contract short-circuit verdict:** no-prior-spec (prose-only task description; full P-1..P-3).
- **Roadmap milestone:** M5 (a5232e16) in_progress. Class=product-feature, Tier=T3. Seed re-homed under M5 (M5 scope is the assignment module; this is a re-homed server-security debt item). wave row milestone backfilled = M5.
- **wave_db_id:** 02c97a51-5998-427b-aa2d-97d6ca12f885 (wave_number 28).
- **design_gap_flag:** FALSE (backend-only endpoint; client regenerate-link UI is keep-OUT/demand-gated) → skip D, straight to B.
- **claimed_task_ids:** [d058283d] (single-spec; mvp-thinner OK, no split).
- **Tier-3 product decisions resolved this wave:** none (security hardening; no money / major-UX tradeoff — the auth/security surface is handled by T-8 + the P-4 security-scope-tightened gate, not a founder Tier-3 poll).
- **Autonomous mode active during P-block:** automatic.

## Security-surface flag (carry to P-4 + T-8)
This wave touches auth / server-ownership authorization / invite-code (session-adjacent secret) → the **security-scope tightened gate** at P-4 applies, and **T-8 Security** is in-scope. CARRY: owner-only authorization (not just any authenticated member), CSPRNG regeneration (no predictable codes), old-link invalidation proven, rate-limit consideration on the rotate endpoint (abuse / enumeration).

## Open escalations carried into gate
- **M5 park-or-key fork** (founder decision, now 7th-wave recurrence) — founder-pending since digest 2026-07-01 (record-only carry; NOT re-escalated at P-0 — it already sits with the founder). ceo-reviewer may re-note the recurrence; head-product carries the standing escalation forward without duplicating the founder ask.

## Gate verdict log
<appended by fresh head-product spawn at P-4 Action 1>
