# P-4 Gate Verdict — wave-71 (M14 Block UI-polish, completion wave)

**Gate:** P-4 (Product block exit) — Phase-1 head-product independent verdict
**Head:** head-product (fresh spawn)
**Wave:** 71 (db_id e58bc705-a0fc-4667-a2ed-c6685b8b533c; waves.milestone_id = M14 6a9424fe)
**Wave type:** multi-spec (2 tasks) — below-floor override-ship-by-rule
**Mode during P-block:** automatic

---

## Verdict: APPROVED

The framing, decomposition, spec, and plan are sound. The below-floor override is a
justified legitimately-small high-value completion wave finishing an already-decomposed
milestone's residual polish — not floor-dodging.

---

## Stage-by-stage gate walk (every box ticked from a concrete artifact)

### P-0 Frame — PASS
- **Root cause, not symptom.** Both tasks trace to wave-70 V-2 findings with exact code
  references (FINDING-1 MemberListPanel:546-566 lone-hardcoded Block affordance; FINDING-2
  blocks.service.ts flat SELECT → raw UUIDs at BlockedUsersPanel:265). FINDING-2 is a
  contract-seam fix (bare FK ids in the DTO); FINDING-1 is a missing state-slice on an
  otherwise-live pattern. Neither is a demo-path artifact.
- **One live milestone, cited.** Maps to M14 (6a9424fe, in_progress, product-feature).
  All 4 mvp-critical scope legs shipped in wave-69/70; residual = these 2 UI-polish follow-ons.
- **Falsifiable signal.** Observable: GET /blocks returns display fields (no raw UUID on the
  privacy surface); member row flips Block↔Unblock live. Both checkable at T/V.
- **Reviewers present + reconciled.** problem-framer PROCEED, ceo-reviewer PROCEED(HOLD-SCOPE),
  mvp-thinner OVER-CUT — all three converge on the exact 2-task bundle; no silent override.
  Not gold-plating: no new scope; out-of-scope M14 items (appeals/triage/rate-limits/
  auto-detection/platform-admin) explicitly fenced in the spec.

### P-1 Decompose — PASS (key judgment: override JUSTIFIED)
- **One seed + only the must-ship sibling.** Seed 1193aebf (member-row toggle) + sibling
  1c633d2f (GET /blocks enrichment). The toggle's isBlocked Set derives from the enrichment's
  GET /blocks fetch — they are one coherent slice that must ship together; the toggle cannot
  render correct state without the sibling's DTO. Correct bundling.
- **Below-floor override is legitimate, not dodging.** PRODUCT-PRINCIPLES rule 5 applies
  verbatim: mvp-thinner returned OVER-CUT (zero valid split candidates — M14 mvp-critical is
  100% shipped and these 2 are the ENTIRE residual Block-UI surface). Rule 5: "When mvp-thinner
  returns floor_constraint_active with zero split candidates, waive the floor; no BOARD is
  required." Precondition holds → NO-BOARD override is correct, not a discipline gap. This is a
  shrink-not-grow completion wave (the opposite of the wasteful greenfield micro-wave the floor
  targets); the wave-50 completion-wave precedent lineage reinforces. Adding scope here would be
  drift before the founder-reserved launch GO.
- **No external dependency.** Both tasks self-contained; sibling already existed as a seed
  candidate (wave_id NULL), re-parented — no new decomposition, no unbuilt out-of-bundle dep.

### P-2 Spec — PASS
- **ACs enumerated + independently verifiable.** spec B: DTO carries display fields / JOINs
  the member-display source / no-IDOR unchanged. spec A: affordance reflects state /
  live flip / BlockedUsersPanel renders enriched name+avatar. Each is testable in isolation.
- **Non-happy states specified for every surface.** Loading (in-flight → fail-safe Block, no
  flicker-driven wrong action), empty blocklist ({blocks: []}), no-displayName → username
  (never raw UUID), no-avatar → initials placeholder, unblock-failure → row stays + non-
  destructive error, own-row → isSelf suppression. Empty/loading/error all present.
- **Non-goals named.** M14-fenced: appeals, triage UI, rate-limits, auto-detection,
  platform-admin unlist. No schema/DM-HIDE-predicate change.
- **One-fetch correctly specced.** The problem-framer note is honored in the AC text: ONE
  GET /blocks call feeds BOTH the list names AND the member-row blocked-id Set (not two).
- **Security surface:** no NEW auth/session/cookie/rate-limit surface — reuses wave-70
  AuthGuard + existing scoping (WHERE blocker_id=session). No P-4 security-gate tightening
  triggered; no-IDOR invariant preserved and re-asserted as an AC.
- **Contract embedded in the DB row** (tasks.1193aebf description, fenced YAML head + `---` +
  prose). Pointer file is a pointer only. Rule 7 satisfied.

### P-3 Plan — PASS
- **Reuses locked architecture.** Server-side JOIN over client N+1 (correct); reuses the
  member-display projection, the existing MemberListPanel presence/mute live-state pattern, and
  the wave-70 block api client (blockUser/unblockUser/getBlocks). No parallel mechanism invented.
- **No unneeded infrastructure.** No DB change, no Redis/replica/billing, no new deps/SDK. Purely
  additive DTO + one shared web fetch. Scale-appropriate for the wedge.
- **Every step → a bundle task + observable artifact.** B-1 contracts (shared schema) → B-2
  backend (listBlocks JOIN + tests) → B-3 web (both surfaces, one shared fetch + tests). spec-B →
  B-1+B-2; spec-A → B-3. Every AC maps to ≥1 step. Serial ordering justified (B-3 renders the DTO
  B-2 enriches).
- **Specialists present in AGENTS.md:** typescript-pro, backend-developer, react-specialist.
- **design_gap_flag=false correct.** block-ui.html (D-3 wave-70) covers both surfaces — the
  enrichment populates the already-designed name/avatar; the toggle reflects both already-designed
  states. No new UI surface → no D-block.
- **No auto-advance into founder-reserved scope.** Plan stops at M14 completion; it does NOT close
  M14 or pull next-milestone (M9/M10/M13) work. The public-launch GO + next-theme pick are
  correctly deferred to the founder at L-1/N-1 (routes to founder even under automatic mode).
  Confirmed: this gate's plan does not encroach on the reserved decision.

---

## Downstream signal (noted, not this gate's concern)
After wave-71 ships + verifies, M14 is a clean CLOSE candidate at L-1. The founder-reserved
public-launch GO + next-milestone theme pick surface to the founder at L-1/N-1 — a genuine
founder decision. Correctly handled: the P-block plan does not auto-advance.

## design_gap_flag handoff
design_gap_flag = false → handoff to **B-block** directly (no D-block).

## Reviewer matrix (Phase-1 head verdict)
- P-0 reframe pool: problem-framer PROCEED / ceo-reviewer PROCEED(HOLD-SCOPE) / mvp-thinner
  OVER-CUT — converged, reconciled.
- Load-bearing-claim / spec-vs-bet drift: no contested claim carried into the gate; the seed's
  code references are concrete and consistent with the wave-70 V-2 findings.

## Failed checks
None.

---

```yaml
head_signoff:
  verdict: APPROVED
  stage: P-4
  reviewers:
    problem_framer: PROCEED
    ceo_reviewer: PROCEED_HOLD_SCOPE
    mvp_thinner: OVER_CUT
  failed_checks: []
  rationale: >
    All four upstream stages tick every exit box from concrete artifacts. Framing is
    root-cause (two wave-70 V-2 contract/state-slice gaps), maps to live milestone M14, and
    is fenced against scope creep. The below-floor override-ship-by-rule is justified under
    PRODUCT-PRINCIPLES rule 5 (mvp-thinner OVER-CUT = zero split candidates, no-BOARD waiver
    correct) plus the completion-wave precedent lineage; it is a shrink-not-grow residual-
    finish wave, the opposite of the micro-wave the floor targets. Spec ACs are falsifiable
    with empty/loading/error/own-row states specified and the one-fetch design correctly
    captured; no-IDOR preserved, non-goals named, contract embedded in the DB row. Plan reuses
    the locked architecture (server JOIN, presence/mute live-state pattern, wave-70 block
    client), adds no infra, and does not auto-advance into the founder-reserved launch GO.
  next_action: PROCEED_TO_B_BLOCK
  design_gap_flag: false
  verdict_complete: true
  rework_attempt_cap_remaining: 2
```

---
## Phase 2 — Karen + jenny + Gemini (merged)
- **karen: APPROVE** — all 8 load-bearing claims VERIFIED: MemberListPanel block affordance hardcoded (:546-566) + presence/mute live-state pattern present (:69/:438/:699/:768); listBlocks flat SELECT no JOIN (:137-141, rowToDto :37-49); BlockSchema bare FK (:24-29); BlockedUsersPanel UUID fallback (:265); THE reuse target = getDmCandidates innerJoin(users) display_name??username??user_id (dm.service.ts:829-851 — already satisfies spec-B fallbacks); getBlocks/unblockUser exist (api.ts:974/982); specialists in AGENTS.md; one-fetch grounded (both surfaces call api.getBlocks). Reminders (non-blocking): B-3 web block-fetch is net-new (reuse the PATTERN not existing code); widen rowToDto; loading fail-safe is a real AC.
- **jenny: APPROVE** — zero spec-drift. Enrichment closes FINDING-2 (list already specced avatar+name in journey :424; no minimal-DTO decision exists); toggle closes FINDING-1 (spec-D own-row suppression stays intact); one-fetch matches the presence-store shared-state idiom (product-decisions:236); user_blocks schema + DM HIDE UNTOUCHED (launch-gate integrity intact). One minor acceptable spec-gap: JOIN-missing user row (deleted account) — unreachable (no deletion flow, M10 H2/todo) → B-2 LEFT-JOIN + "removed user" fallback hardening note.
- **Gemini:** see exit above (429/UNAVAILABLE = degradable, does not block).

## Phase 2 verdict: PASS → exit P-block
Non-blocking carries to B: (B-2) LEFT JOIN + "Unknown/removed user" fallback for a JOIN-missing user row; widen rowToDto not just the query; (B-3) member-row block-fetch is net-new code reusing the presence/mute PATTERN; loading fail-safe (default Block) is a testable AC.
**Handoff:** design_gap_flag=false → next block is **B** (Build) directly.
