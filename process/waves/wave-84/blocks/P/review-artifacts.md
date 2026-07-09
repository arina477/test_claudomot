# Wave 84 — P-block review artifacts

**Block:** P (Product) · **Wave topic:** session-token storage hardening (httpOnly cookie vs header transport) · **Block exit gate:** P-4 · **Status:** in-progress

## Stage deliverables
| Stage | Deliverable file | Status | Notes |
|---|---|---|---|
| P-0 | stages/P-0-frame.md | done | Tier-3 -> BOARD 7/7 Option B (keep header + CSP + short TTL + rotation) |
| P-1 | stages/P-1-decompose.md | done | single-spec PROCEED (floor waived); design_gap_flag false; scope=BOARD Option B |
| P-2 | stages/P-2-spec.md | done | 6 ACs; CSP+short-TTL+header-explicit; spec in task |
| P-3 | stages/P-3-plan.md | done | Session.init header+TTL + web CSP (empirical); B-2/B-3 supertokens-integration |
| P-4 | stages/P-4-gate.md | done | Phase-1 verdict APPROVED (blocks/P/gate-verdict.md); security-scope-tightened → Phase-2 radar |

## Block-specific context
- **Wave topic:** SuperTokens session-token transport — header (JS-readable, XSS surface) → httpOnly cookie, OR document header mode as accepted cross-origin choice
- **wave_db_id:** a0b4723c-0c33-4369-ae1b-917413c790ad (wave_number 84)
- **Spec-contract short-circuit verdict:** no-prior-spec (prose seed → full P-1..P-3)
- **Roadmap milestone:** unassigned (roadmap complete)
- **claimed_task_ids:** [9535895f-1d80-4a59-b93e-dff05ff94c6e] (confirm P-2)
- **Autonomous mode:** automatic
- **KEY TENSION for reviewers:** web≠api are different Railway origins → cookie mode = cross-site SameSite=None cookies (browser third-party-cookie restrictions: Safari ITP, Chrome deprecation). Header mode may be more robust for cross-origin. Genuine "switch to cookie vs keep+document header" fork with security AND reliability consequences.

## Gate verdict log
<P-4>APPROVED (Phase 1) — escalation+BOARD handled correctly (7/7 Option B; web≠api genuinely different SITES under public-suffix up.railway.app, code-corroborated); floor-waive legit (PRODUCT-5); 6 ACs falsifiable, AC5 correctly load-bearing+T-8-testable, all 4 WS namespaces verified in source; plan sound (supertokens-integration; connect-src https+wss pinned; empirical CSP derivation; web-HTML CSP ≠ wave-83 helmet-on-api-JSON — no contradiction); scope = exact BOARD mandate, not gold-plated. security-scope-tightened gate → Phase-2 radar. rework_attempt_cap_remaining: 3.</P-4>
