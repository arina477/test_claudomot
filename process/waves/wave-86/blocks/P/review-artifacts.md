# Wave 86 — P-block review artifacts
**Block:** P (Product) · **Wave topic:** SuperTokens anti-CSRF posture explicit + regression test · **Block exit gate:** P-4 · **Status:** in-progress
## Stage deliverables
| Stage | Deliverable file | Status | Notes |
|---|---|---|---|
| P-0 | stages/P-0-frame.md | done | REFRAME (VIA_TOKEN wrong post-header-transport); explicit-value + regression-lock + document |
| P-1 | stages/P-1-decompose.md | done | single-spec PROCEED (floor waived); design_gap_flag false; security-scope |
| P-2 | stages/P-2-spec.md | pending | |
| P-3 | stages/P-3-plan.md | pending | |
| P-4 | stages/P-4-gate.md | pending | |
## Block-specific context
- **Wave topic:** make SuperTokens anti-CSRF posture EXPLICIT (seed asks antiCsrf:VIA_TOKEN) + a regression test asserting a cookie-only forged state-changing POST is rejected. NO live vuln today (verified wave-49 pen-test); a hardening/legibility item.
- **wave_db_id:** e3988df2-8b1b-4565-9efa-cbe483805959 (wave_number 86)
- **Spec-contract short-circuit:** no-prior-spec → full P-1..P-3
- **Roadmap milestone:** unassigned (roadmap complete)
- **claimed_task_ids:** [f8fb8023-544a-431f-a359-7392e9c75f5b] (confirm P-2)
- **CRITICAL PREMISE-SHIFT for reviewers:** seed is from wave-49 (cookie-oriented: "cookieSameSite=none without antiCsrf"). But WAVE-84 (last wave) pinned tokenTransferMethod:'header'. In header/bearer transport, CSRF is largely moot (token not auto-attached cross-site) + SuperTokens antiCsrf is COOKIE-oriented. So: (a) the cookieSameSite=none framing may be dead config now; (b) antiCsrf:VIA_TOKEN (cookie-mode value) may be the WRONG setting vs VIA_CUSTOM_HEADER or moot-by-construction. Reviewers MUST reconcile the header-transport interaction — this could be a simple reframe to the correct value, a doc-the-posture outcome, or (like wave-84) a BOARD-worthy security decision.
- **Autonomous mode:** automatic
## Gate verdict log
<P-4>
