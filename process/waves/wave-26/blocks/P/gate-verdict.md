# Wave 26 — P-4 Verdict

**Reviewer:** head-product (fresh spawn, agentId head-product-w26-p4)
**Reviewed against:** process/waves/wave-26/blocks/P/review-artifacts.md
**Attempt:** 1  (1 = first gate, 2+ = post-rework)
**Phase:** 1 (head-product)

## Verdict
APPROVED

## Rationale
This wave finishes the highest-visibility, now-verifiable slice of re-homed presence debt — live presence dots on message-row author avatars — by extracting a shared PresenceDot primitive from the member panel's inline hard-coded dot and consuming the existing single presence socket at both sites. Every stage-exit checkbox ticks from a concrete artifact, not inference. Frame is a genuine root-cause (AC2's "shared primitive" was a false premise until the extraction was surfaced — problem-framer caught it, authorId=userId is resolved so degrade is a true edge case) and maps to one active milestone (M5, re-homed M3 debt) with problem-framer + ceo-reviewer + mvp-thinner verdicts reconciled, not overridden. Decomposition is a single seed with the DM/hover extension correctly split to sibling fdb444fc (mvp-thinner THIN), and the under-floor override-ship is a legitimate 5th-consecutive precedent-application, not a fresh ceremony — the wave-24 BOARD explicitly deprecated re-litigating each Nth under-floor M5 slice, and decomposition-expansion is documented-futile while M5's only unbuilt scope is Resend-key-blocked. All five ACs are independently verifiable from outside (live author dots; single PresenceDot + one token, no hard-coded hexes; unknown→no-dot degrade; exactly one presence socket at runtime; member-panel refactor with no regression), and the four non-happy states relevant to this surface (unknown/non-co-member = no dot, offline = muted dot, live online↔offline flip, self-author) are all specified. The plan reuses the locked architecture — the existing getPresenceSocket() singleton + usePresence/getPresenceStatus consumption path — and explicitly rejects the two architecture-violating alternatives (new subscription = violates AC4; inline dot = reintroduces the debt this wave removes). No infra the MVP doesn't need; no gold-plating (hover cards / study-status / animation confirmed OUT). design_gap_flag=false is correct (componentization of an already-rendered dot on an existing surface, design ref present), so the D-block skip and B-0/B-1/B-2 frontend-only skip are justified. On bet alignment: ceo-reviewer's caveat that presence is Discord table-stakes rather than the academic/offline-first wedge is accepted and recorded, with academic study-status tracked as the real future differentiator at the next roadmap-refresh — draining the last workable M5 debt while the reminders headline is credential-blocked is a defensible, non-orphan use of a wave. No auth/session/cookie/rate-limit surface is touched, so the tightened security gate does not apply.

---

# Wave 26 — P-4 Verdict (Phase 2)

**Reviewer:** head-product (fresh spawn, agentId head-product-w26-p4)
**Phase:** 2 (Gemini cross-review CONCERN triage)
**Reviewed against:** process/waves/wave-26/stages/P-4-gemini-review.md + apps/web/src/shell/usePresence.ts + apps/web/src/shell/presenceSocket.ts
**Reviewer pool status:** karen APPROVE, jenny APPROVE (jenny flagged spec-gap G2), Gemini CONCERN (this triage)

## Gemini CONCERN (gist)
Plan applies a member-panel-scale presence lookup component to a potentially unbounded message list; risks a perf bottleneck where one user's status change re-renders every visible message row, degrading responsiveness in large active channels.

## Triage verdict
**NOT-MATERIAL** — the concern is a real B-block implementation consideration, not a spec/plan defect. It requires no P-2/P-3 REWORK. The gate proceeds on karen+jenny APPROVE + Gemini-CONCERN-triaged-NOT-MATERIAL, with two binding B-block carries below.

## Reasoning (from source, not inference)
1. **The store already supports a per-user point read.** `presenceSocket.ts:148` `getPresenceStatus(userId)` is an allocation-free point read (`presenceStore.get(userId) ?? 'offline'`). It is NOT a whole-store copy. The plan consumes presence via this exact accessor — so a `PresenceDot` can derive its own author's status without touching any other author's state.
2. **The coarse-grained fan-out is a known, isolatable React concern — not an architectural one.** `subscribePresence` (presenceSocket.ts:170) notifies every subscriber on any event, and `usePresence` (usePresence.ts:31-38) increments a `tick` on every change. The naive path Gemini describes — calling `usePresence()` at every message row so every row re-renders on any user's flip — is one *possible* implementation, not what the plan mandates. `usePresence.ts:11` explicitly documents the intended pattern ("call once at MemberListPanel level... keeping subscription count at 1"). The mitigation (a `PresenceDot` memoized on its own author's status slice) lives entirely inside the component's render/subscription wiring — a B-block detail, resolvable without any change to AC1/AC4 or the plan approach.
3. **AC4 (single presence store/socket) is exactly the right architecture and is already satisfied** — inventing a per-user selector store to placate this concern would ADD infra the wave doesn't need. The correct answer is React.memo discipline on the status slice, not a store redesign.
4. **Not material NOW.** StudyHall is ~0 prod users / small channels. The member panel ALREADY renders per-member dots from this same store with no known perf issue — the message list is not a categorically different consumer of the store, only a larger one at future scale. Large-channel virtualization + per-row re-render cost is a documented future-scale watch item, not a launch blocker for this slice.

## Classification
- SPEC defect (P-2 REWORK)? **No.**
- PLAN defect (P-3 REWORK)? **No.**
- B-block implementation detail? **Yes** (PresenceDot subscription granularity + memoization on author's status slice).
- T-block perf watch item? **Yes** (T-7 perf-check: large-channel presence re-render cost under virtualization).

## Binding B-block carries (react-specialist)
1. **[CARRY-1 — presence re-render granularity]** Each `PresenceDot` MUST re-render only when ITS author's presence status changes, not on every store event. Implement by having the dot read `getPresenceStatus(authorId)` and memoizing on that author's status slice (e.g. `React.memo` on the resolved status value, or a per-author selector wrapper) — so one presence flip re-renders only that author's dot(s), not every message row. Do NOT introduce a new subscription per row that re-renders the whole list on any change; the single `subscribePresence` fan-out stays, granularity is enforced at the component boundary. AC4 (single store/socket) is preserved. Large-channel/virtualized-list presence perf is a **T-7 perf watch item**, not a B-block blocker.
2. **[CARRY-2 — jenny G2 authorId scope]** Sibling avatar sites (message-list :1236 / :1322) currently key on `authorDisplay`, not `authorId`. B MUST confirm `authorId` is in scope at every author-avatar render site before wiring `getPresenceStatus(authorId)`; if only `authorDisplay` is available, resolving the stable `authorId` is a prerequisite (presence keys on userId, and AC5's authorId=userId resolution depends on it). Flag back to P if authorId is genuinely unavailable at those sites (would reopen the spec).

## Footer
- verdict_complete: true
- phase2_verdict: NOT-MATERIAL
- gate_proceeds: true
- design_gap_flag: false (handoff to B-block)
- rework_attempt_cap_remaining: 2
