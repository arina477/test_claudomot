# Wave 85 — P-0 Frame

## Discover
- **wave_db_id:** 582fd530-a95e-46f5-9416-2a336664ef9e (wave_number 85)
- **Prior-work:** wave-22 T-block F22-T-4 + Karen (source). Last touched wave-42; no later fix. Premise VERIFIED live (head-next N-2 + both P-0 reviewers): AssignmentCard.tsx:658-660 reverts by `newState==='done'?'todo':'done'` (opposite-of-newState) not a captured snapshot; console-only error.
- **Roadmap milestone:** unassigned (roadmap complete). waves.milestone_id NULL.
- **Spec-contract short-circuit:** no-prior-spec → full P-1..P-3.
- **Product decisions:** none Tier-3 (small frontend correctness/UX fix).

## Reframe
- **problem-framer: PROCEED.** Root fix = capture-and-restore the ACTUAL prior value (`assignment.myStatus` at click time), not flip-opposite — correct-by-construction. Status is provably BINARY (packages/shared/src/assignments.ts:41 z.enum(['todo','done'])) → the assume-opposite bug only diverges under a rapid double-toggle race; "Low" severity honest. **Single-site** — grepped all 9 optimistic sites; AssignmentCard is the UNIQUE offender (others apply-after-success or functional setState/refetch). UX: use BOTH `onAnnounce` (a11y live region, already wired :650) + a visual toast; REUSE the existing Toast pattern at shell/ReportDialog.tsx (role=alert, aria-live=assertive, 3500ms); AVOID double-announcing via both the toast aria-live and onAnnounce.
- **ceo-reviewer: SELECTIVE-EXPANSION.** Keep the assume-opposite fix on the ONE card (fixing "wherever it recurs" would gold-plate 8 non-bugs). ADD the error toast (cheap, on-wedge, offline-first-relevant). SPIN OUT the broader "8 of 9 optimistic sites are silent on failure + no shared toast utility" consistency initiative as a SEPARATE queued backlog task (3b878f96-0fea-48f5-ac1e-7ba639e0072b
INSERT 0 1) — NOT bundled here.
- **mvp-thinner:** n/a (not a product-feature milestone).
- **Merge:** the two AGREE — single-card fix + toast, spin-out the consistency work. Accepted. Spin-out task filed: 3b878f96-0fea-48f5-ac1e-7ba639e0072b
INSERT 0 1.
- **Disposition:** PROCEED (single-spec).
- **Final framing:** Fix AssignmentCard.tsx handleToggle: (1) snapshot the actual prior `assignment.myStatus` BEFORE the optimistic flip; on error, restore that snapshot (not the opposite); (2) surface a user-facing error toast (reuse ReportDialog Toast pattern) + fire onAnnounce for a11y, without double-announcing. Single card. Broader consistency = separate task 3b878f96-0fea-48f5-ac1e-7ba639e0072b
INSERT 0 1.
