# Wave 16 — P-0 Frame

## Discover
- **wave_db_id:** 84fd084f-1ebd-41e2-aa41-36fdeff680bc (wave_number 16)
- **Prior-work:** the create-server flow is M1 (LIVE: modal → server rail → channel sidebar). Verified fixtures now exist (wave-11 + wave-14/15 provisioned studyhallfixturea/b in command-center/testing/test-accounts.md) — the dependency that blocked this E2E (wave-7 V-3 carry) is RESOLVED.
- **Roadmap milestone:** M3 (6198650e) — seed 46f16288 is an M3 top-level tech-debt todo (wave-7 carry). Wave-16 milestone backfilled.
- **Spec-contract short-circuit:** no-prior-spec (prose) → full P-1..P-3.
- **Product decisions:** none Tier-3. Test-infra wave.

## Reframe
- **problem-framer: PROCEED** — real zero-coverage gap on the core authed front-door, fixed at the right layer (true Playwright browser E2E), dependency resolved. No gold-plating (happy-path right-sized; edge cases deferrable). CARRY: anti-flake discipline (explicit waits, deterministic fixture, no retry-masking) → P-2/P-3/T-4 (known server-roles flake precedent).
- **ceo-reviewer: PROCEED / HOLD-SCOPE** — cheap, feature-adjacent (hardens the front-door to all live M3 value); ritual ordering working as designed (decomposer NO-OP'd correctly, N-2 picked oldest); don't preempt with threads/attachments. OBSERVATION (not escalation): if founder later signals M3 closure urgent, cancel/defer the OTHER two parked tech-debt (25523fb0 PG-rollback, d058283d invite-rotation), NOT this E2E (highest-value of the three).
- **mvp-thinner: OK** — single happy-path E2E, indivisible (sign-in/create/assert), nothing to thin; test-infra has no AC-thinness purchase.
- **Disposition: PROCEED.** Single-task tech-debt test wave. Carry anti-flake discipline to spec/plan/T-4. design_gap likely FALSE (tests existing live UI, no new surface).
- **Final framing:** Wave-16 adds a Playwright E2E: sign in as verified fixture → create server → assert server in rail + #general in sidebar. claimed_task_ids = [46f16288].
