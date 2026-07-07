# Wave 70 — P-block Gate Verdict (P-4 Phase-1)

**Gate:** P-4 (Product block exit)
**Wave:** 70 — M14 user-to-user Block feature (+ folded member-row report-leak fix)
**Gater:** head-product (fresh spawn, independent verdict)
**Verdict source:** this file
**Live bet tied to:** "Academic tools + offline-first win students from Discord" — Block is M14's safety / network-effect leg gating the founder-reserved public-directory launch (a directory you cannot publicly launch without user-to-user block).

---

## VERDICT: APPROVED

Independent render. Every upstream stage-exit checkbox ticks from a concrete artifact (not inference). No orphan, no bloat, no vague/untestable AC, no reuse-mandate violation, no unneeded infra. design_gap_flag handoff (D-block before B-3) correctly set. The auth/session surface (session-gated block endpoints + DM HIDE safety predicate) is routed to the tightened T-8 security gate, and its security ACs are provable there.

---

## Stage-by-stage checklist walk

### P-0 Frame — PASS
- [x] Concrete user job + root cause, not symptom. Problem = "M14's public-launch gate has one substantive unshipped leg: user-to-user Block (cross-server DM/content hiding)." The thin member-row seed was a 1-AC below-floor fragment; Block is the actual unshipped mvp-critical item. Cause, not demo-path artifact.
- [x] Maps to exactly one live bet. Displace-Discord academic/offline wedge; Block = safety/network-effect leg of the public directory. Cited.
- [x] [STABLE] Falsifiable. Observable solved-signal: blocked user cannot open/continue a DM (403), excluded from getDmCandidates, existing convo + content hidden bidirectionally.
- [x] problem-framer + ceo-reviewer verdicts present and reconciled (not overridden). ceo-reviewer SCOPE-EXPANSION + mvp-thinner OVER-CUT both converge on Block; problem-framer PROCEED with an explicit merge-up note. Convergent — no silent override.
- Gold-plating guard: out-of-scope (triage/appeals/auto-detection/rate-limits/platform-admin unlist) explicitly fenced; public-launch GO stays founder-reserved. Holds to the wedge.

### P-1 Decompose — PASS
- [x] One seed + only the siblings that must ship together. Block backend+HIDE (seed) + shared contracts + Block UI + member-row fix. Contracts/backend/UI are the minimal set for the mvp-critical "block hides content" claim; member-row fix folded as cheap trailing polish (reuses the same MemberListPanel prop-threading).
- [x] Every AC mvp-critical or split. No non-critical AC bundled; out-of-scope items split out to later M14 bundles.
- [x] No task depends on an unbuilt task outside the bundle. schema→contracts→backend→UI all in-bundle; wave-69 report substrate already LIVE.
- [x] RESCOPE-AUTO-MERGE correct: ~20-LOC sub-floor seed → ~2,500-3,000 net LOC clears the multi-spec >2,500 floor (floor_merge_attempt=1). Rubric max thresholds — none trip.
- [x] design_gap_flag=true correct. Block affordance + blocked-users settings list have no mockup in design/; member-row fix reuses MemberListPanel (no new surface); backend+contracts non-UI.

### P-2 Spec — PASS
- [x] ACs enumerated + each independently verifiable. Confirmed against the authoritative DB spec (tasks row bc5986a9 description, fenced YAML head).
- [x] Empty/loading/error states specified for the user-facing surface (Spec C: loading skeleton / list / empty "You haven't blocked anyone"; double-click single-submit; unblock-failure row-stays; unauth/own-row hidden). Offline/degradation: client degrades gracefully where server hides content, does not error on now-hidden convo.
- [x] Non-goals named explicitly (triage/appeals/auto-detection/rate-limits/platform-admin unlist).
- [x] Auth/user-session surface flagged for the tightened security gate (block endpoints session-gated; DM HIDE is a safety surface → T-8).
- [x] Full spec contract embedded as fenced YAML at head of primary task's DB description (verified via psql), not only the convenience copy.
- **Security ACs held to high bar (provable at T-8):**
  - No-IDOR: blocker_id ALWAYS from `req.session.getUserId()` on POST/DELETE; GET filtered `WHERE blocker_id = session`. Provable by forged-body / other-user-list attempt returning caller's own scope only.
  - DM HIDE predicate at all 5 DmService seams — createConversation (gate/reject), sendMessage (reject), getDmCandidates (exclude), listConversations (hide), listMessages (hide) — bidirectional. Each seam individually assertable against a live DB.
  - Cross-server enforced structurally (no server_id column) — a block set in server X hides DMs everywhere.
  - Edge cases observable: self-block→400, non-existent→404, double-block idempotent single-row→200, unblock-not-blocked→204 no-op.
  - None vague; each carries a concrete status code / observable state.

### P-3 Plan — PASS
- [x] Reuses established architecture. DM HIDE via a shared `isBlockedBetween(a,b)` helper applied INLINE at the 5 seams — reuses the DM-visibility idiom, explicitly NOT a second permission system (honors M14 mandate). Trade-offs reasoned: NEW user_blocks table vs reuse (no user-to-user block primitive exists; wave-41 ModerationService is server-scoped timeout, semantically distinct) → NEW wins; inline-per-seam vs global interceptor (interceptor can't see per-query counterpart id) → inline wins; shared BlockButton vs inline → shared wins.
- [x] No infra the MVP scale doesn't need. No Redis / multi-replica / billing; no new deps; no SDK.
- [x] Each plan step maps to a bundle task + produces an observable artifact. Self-consistency sweep: spec-A→B-0+B-2, spec-B→B-1, spec-C→B-3, spec-D→B-3; every AC → ≥1 file step; every step → a specialist in AGENTS.md.
- [x] MemberListPanel serial-conflict correctly flagged. spec-C block affordance + spec-D member-row fix both thread profile.userId/isSelf into MemberListPanel → SERIAL under one react-specialist (no parallel conflict).
- Specialists: postgres-pro / typescript-pro / backend-developer / react-specialist — all in AGENTS.md, validated wave-69.

---

## Anti-pattern scan (all clear)
- Symptom framing — NO (root-cause Block, converged reviewers).
- Orphan wave — NO (cited live bet + M14 milestone).
- Decomposition bloat — NO (out-of-scope fenced; floor cleared, not padded).
- Happy-path-only spec — NO (empty/loading/error/degradation specified).
- Vague ACs — NO (each carries observable status/state; security ACs provable at T-8).
- Spec-vs-bet drift — NO (spec = M14 Scope leg 3 / Success-metric leg 3; public-launch GO reserved).
- Architecture-blind plan — NO (reuses DM-visibility idiom; no second permission system).
- Gold-plating at self-use-mvp — NO (no triage/appeals/rate-limits/admin-role; no scale infra).

## Escalations
None. No unevaluable checkbox.

## Design gap handoff
design_gap_flag=true → D-block fires (Block affordance + blocked-users settings list) BEFORE B-3 frontend. Backend (B-0→B-2) may overlap D-block. Correctly set.

---

```yaml
head_signoff:
  verdict: APPROVED
  stage: P-4
  reviewers: {}   # Phase-1 gate render; karen/jenny Phase-2 pool per stage matrix
  failed_checks: []
  rationale: >
    Block is the correct M14 leg — the mvp-critical unshipped launch-gate item, converged on by all
    three P-0 reframe reviewers, tied to the displace-Discord bet's public-directory safety leg. The
    multi-spec 4-task bundle is floor-clearing (~2,500-3,000 LOC > 2,500) without bloat, out-of-scope
    correctly fenced, design_gap_flag=true correct. Every AC is falsifiable and observable; the
    security-critical ones (no-IDOR via session blocker_id, DM HIDE at all 5 DmService seams,
    bidirectional + cross-server, self-block/exists/idempotent edges) are provable at T-8. The plan
    reuses the DM-visibility idiom via isBlockedBetween — no second permission system, no unneeded
    infra — flags the MemberListPanel serial conflict, and maps every AC to a file step with a
    catalogued specialist. Nothing vague, orphaned, or gold-plated.
  next_action: PROCEED_TO_D_BLOCK   # design_gap_flag=true; B-block backend may overlap
  verdict_complete: true
  rework_attempt_cap_remaining: 2   # attempt 1 of 2 consumed → 2 remaining
```

---
## Phase 2 — Karen + jenny + Gemini (merged)
- **karen: APPROVE** — all 7 load-bearing claims VERIFIED (DM HIDE seams at exact lines dm.service.ts createConversation:201/listConversations:382/sendMessage:494/listMessages:576/getDmCandidates:685; reports.ts schema-mirror; user_blocks genuinely net-new; MemberListPanel spec-D defect real [Report button :516-534 unconditional, no self prop]; shared Zod refs reports.ts+privacy.ts; specialists all in AGENTS.md; DM-visibility reuse grounded in isParticipant:120 / enforceWhoCanDm:135-176 — not hand-waving).
- **jenny: APPROVE** — no spec-drift. Block is ORTHOGONAL to who_can_dm (verified who_can_dm is server-enforced at dm.service.ts:144/240; only the settings toggle is disabled BETA) — a separate user_blocks table is correct, not overloading the policy enum. Member-row fix (spec-D) consistent with the wave-69 message own-content-leak fix (b1ff064). Cross-server + bidirectional matches the wave-47 serverId-less DM model.
- **Gemini: UNAVAILABLE** (HTTP 429) — degradable, does NOT block; gate proceeds on Karen + jenny per P-4 Action 3.

## Phase 2 verdict: PASS → exit P-block

### Non-blocking spec-gaps + notes (jenny; carried to B-block, inside the M14 fence — do NOT block the gate):
- **5a Group-DM block semantics** — group DMs exist (LIVE, ≤10 cap). The spec's HIDE predicate is written 1:1-pairwise; group-DM block behavior is unspecified. B-2 backend-developer: decide sensible group-DM behavior (at minimum a block must not crash a shared group DM; ideally the blocker no longer sees the blocked user's messages in the group). Note in B-2.
- **5b Pending-outbox drain race** — the offline outbox draining a queued DM to a now-blocked user at block time. Read-side hide is specified; the outbound-drain race is very low severity. B-2 note.
- **Settings-host pin** — the "Blocked users" list should live in the USER settings home (/settings/privacy — user-level), NOT the server Overview dialog (server-scoped) the spec named as an example. Pin at B-3/D-1.

**Handoff:** design_gap_flag=true → next block is **D** (Block UI mockups). Backend B-0→B-2 may overlap D-block.
