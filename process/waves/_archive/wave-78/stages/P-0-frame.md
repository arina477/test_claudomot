# Wave 78 — P-0 Frame

## Discover section
- **wave_db_id:** b113bf5e-2b8f-42c2-8803-c25cad452535 (wave_number 78; milestone_id backfilled → M13 b7400254)
- **Prior-work citation:** wave-77 (M13 leg-2) shipped the academic-identity editor (ProfilePage), the MemberProfileCard, and GET /profile/:userId (fail-closed visibility). This wave polishes that exact surface — both tasks were filed at wave-77 V-2 as non-blocking UX follow-ups.
- **Roadmap milestone:** M13 — Institution partnerships & portable identity (in_progress). leg-2 follow-up. ## Class = product-feature.
- **Spec-contract short-circuit verdict:** `no-prior-spec` (seed/sibling descriptions are V-2 prose, no fenced YAML head → full P-1..P-3).
- **Product-decision resolutions:** none. Both tasks are small UX corrections — no money/security/major-UX-tradeoff Tier-3 signal. Fenced items (B2B2C, M13 success metric, identity verification) untouched.

## Reframe section
- **Original framing:** 2-task bundle — (seed 4be3b084) allow clearing academicRole back to unset; (sibling 3b3530d8) distinguish a genuinely-hidden profile from a transient network error on the member card.
- **problem-framer: PROCEED** — both cause-level, correctly-layered, clear the antipattern red-team (verified against code). Seed fix does NOT touch the visibility read path (visibility service gates only on profile_visibility, projects academic_role; DB column already nullable text). Sibling anti-oracle risk is real (current `.catch` collapses 404 + network/5xx into one 'hidden' state) but fixable client-side via HttpError.status — no server oracle needed.
- **ceo-reviewer: PROCEED** — genuine correctness/usability defects on a live surface, not busywork. Seed closes a one-way door on user-controlled identity data; sibling fixes a network-blip-masquerading-as-privacy-state (worse failure). Correct use of an active-milestone wave (work M13's own seed candidates before new bundles / unauthored leg-3). Declined expansion (adjacent polish would be speculative gold-plating); neither task too ambitious; ship both together. No fenced-item expansion.
- **mvp-thinner: OK** — metric-absence (M13 success metric founder-reserved _TBD_) blocks authoritative thinness → abstain to OK. Two tasks are independent but there is nothing to cut (both sub-30-LOC single-concern correctness fixes, no bloat/feature/gold-plating); they are the entire M13 open queue + leg-3 unauthored, so deferring the sibling would strand it. Neither decomposes into separable ACs.
- **Mediation outcome:** no expansion-vs-thin conflict (ceo PROCEED no-expansion, mvp-thinner OK). All PROCEED/OK.
- **Disposition:** **PROCEED** (2 tasks, no change).
- **Final framing (rest of P-block):** ship the two member-profile-card UX polish fixes — (1) make academicRole clearable to unset; (2) distinguish a transient transport failure from a genuinely-hidden profile on the card, adding a retry only for the transport case.

### Binding refinements carried to P-2 (LOAD-BEARING)
1. **Anti-oracle HARD constraint (T-8 re-prove):** the `404 → hidden` card branch stays byte-identical (same copy, layout, NO retry); the new retryable state is reachable ONLY for client-observable transport failures (network/timeout/5xx via HttpError.status); NO new server field may signal error-kind. A hidden profile and a non-existent/blocked one MUST remain byte-identical to the client. Carried by all three reviewers.
2. **Seed service write-path:** `users.service.ts` currently gates on `academicRole !== undefined` and only writes a string — P-2 must require distinguishing `undefined` (leave unchanged) from `null` (write NULL). AC: PATCH `{academicRole: null}` persists and GET round-trips as null. Do NOT over-touch the read path (read schemas already tolerate null).
3. Contract representation (`z.enum(...).nullable()` vs `''→null` preprocess) is an implementation detail for P-3/B, not a framing blocker.

**claimed_task_ids:** [4be3b084-c86f-48f6-b3fc-fe9e95d60556 (seed), 3b3530d8-f452-4e26-b50d-be2d3dabf384 (sibling)]
