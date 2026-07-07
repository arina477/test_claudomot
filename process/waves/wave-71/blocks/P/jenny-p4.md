# P-4 Phase-2 spec-drift check — wave-71 (M14 Block UI-polish, multi-spec)

**Reviewer:** jenny (spec-compliance auditor)
**Scope:** cross-reference wave-71 spec (task `1193aebf` member-row toggle + task `1c633d2f` GET /blocks enrichment) + P-3 plan against the wave-70 Block journey (user-journey-map.md:422-427) + product-decisions.md (M14 bundle 774-781, M11-close launch-gate 16-22).
**Sources read:** spec YAML (both claimed tasks, from `tasks.description`); `process/waves/wave-71/stages/P-3-plan.md`; `user-journey-map.md` § Block (wave-70); `product-decisions.md` (M14 entries + launch-gate carry).

---

## VERDICT: APPROVE

The wave-71 polish is a faithful, additive completion of the wave-70 Block journey. It fixes the two wave-70 V-2 findings (FINDING-1 member-row state, FINDING-2 UUID-not-name) EXACTLY as the journey map recorded them, contradicts NO prior decision, and correctly leaves the launch-gate safety surfaces (user_blocks schema + DM HIDE predicate) untouched. One minor spec-gap noted (item 4) — acceptable, already covered by an edge-case in the spec.

---

## Per-item findings

### 1. GET /blocks enrichment (display name + avatar) — **MATCHES**
Spec-B AC1 enriches GET /blocks with the blocked user's `displayName/username + avatar`, backward-additive (keeps `blocker_id/blocked_id/created_at`, ADDs a `blockedUser` object). This directly closes wave-70 **FINDING-2** and realizes a design intent that was ALREADY canonical, not new:
- Journey map (user-journey-map.md:424) already specified the blocked-users list surface as rows with "**avatar + name** + inline Unblock". The UUID render was a shipped BUG against that design (FINDING-2 LOW: "GET /blocks lacks profile enrichment" — user-journey-map.md:423), not a deliberate minimal contract.
- **No conflicting prior decision.** I searched product-decisions.md for any deliberate minimal-DTO / bare-FK decision on the blocks contract — none exists. The wave-70 M14 bundle entry (product-decisions.md:774-781) fences OUT review-queue/appeals/rate-limits/admin-unlist, but says nothing scoping GET /blocks to bare ids. The bare-id shape was an unintended contract gap (P-3 plan.md:4 and the spec problem-statement both label it "spec-A contract gap"), not a chosen minimalism.
- Server-side JOIN over client-side per-id lookup (P-3 plan.md:4) is the correct realization; no drift.
- **Tag: neither — clean match, closes a recorded finding.**

### 2. Member-row Block↔Unblock toggle + own-row suppression — **MATCHES**
Spec-A AC1/AC2 makes MemberListPanel/MemberItem reflect blocked state (Block for unblocked, Unblock for already-blocked via DELETE /blocks/:userId). This closes wave-70 **FINDING-1 MAJOR** ("member-row still shows Block after blocking" — user-journey-map.md:423) exactly.
- Aligns with the wave-70 block affordance journey (user-journey-map.md:424): a Block/Unblock affordance on the member row. The toggle IS the affordance the journey already named; wave-70 shipped it half-live (POST wired, no isBlocked reflection).
- **spec-D own-row suppression stays intact — verified.** Spec-A AC2 explicitly reads "Own row still suppresses Block (isSelf, wave-70 spec-D — unchanged)"; edge-cases repeat "own row → no Block/Unblock (isSelf, unchanged)." This matches the wave-70 spec-D guard (user-journey-map.md:424 "NOT shown on the viewer's own row"; :427 "member-row own-Report suppression fix, MemberListPanel isSelf guard"). The polish EXTENDS the existing isSelf guard, does not weaken it. **No drift.**
- Reuse of the existing presence/mute live-state pattern (spec-A AC1; P-3 plan.md:6) is consistent with the MemberListPanel live-state idiom already shipped.
- **Tag: neither — clean match, closes a recorded finding, preserves spec-D.**

### 3. "One GET /blocks fetch feeds both surfaces" — **MATCHES**
Spec-A AC1 mandates ONE GET /blocks call feeding both BlockedUsersPanel and MemberListPanel (blocked-id Set → isBlocked); P-3 plan.md:6 realizes it as a shared `useBlocks` hook / lifted fetch.
- Consistent with the app's established shared-state fetch idiom: the same "derive a client Set/store from one server fetch, feed multiple surfaces" pattern the presence store already uses (wave-15 presence: "member-list panel + author-dot siblings consume the presence state" — product-decisions.md:236; MemberListPanel presence/mute live-state pattern referenced in the spec). No prior decision mandates a different data-fetching pattern; this follows precedent, not against it.
- Avoids the N+1 / double-fetch anti-shape the problem-framer one-fetch note called out. No drift.
- **Tag: neither — consistent with prior data-fetch precedent.**

### 4. Enrichment edge-case for deleted-account / no-profile-row blocked user — **minor spec-gap (acceptable)**
Spec-B edge-cases cover: no displayName → fall back to username (never raw UUID); no avatar → initials/placeholder; empty list → `{blocks: []}`. These handle the *sparse-profile* cases.
- **Gap:** the spec does not explicitly enumerate the case where the blocked user row is JOIN-missing entirely — a blocked user who **deleted their account** (or whose profile/users row is absent), where the JOIN yields NULL for the whole user, not just for displayName/avatar. AC1's "never the raw UUID in the UI" fallback is written against a present-but-sparse row; a fully-absent row could surface `null`/blank.
- **Why acceptable (APPROVE-compatible):** (a) StudyHall is pre-launch, 0 real users, and has **no account-deletion flow shipped** (no GDPR/erasure milestone active — M10 Compliance is H2, `todo`), so a dangling blocked_id FK is not currently reachable; (b) the spirit of AC1's "never the raw UUID" + the initials-placeholder fallback naturally extends to cover it with a defensive `?? username ?? "Unknown user"` + placeholder avatar. Recommend B-2/B-3 harden the JOIN as a LEFT JOIN with a "Unknown/removed user" fallback label so a null row never blanks or leaks a UUID. This is a hardening note, not a blocker.
- **Tag: spec-gap (minor, note-and-proceed).** Flag to head-product to carry into the B-2 backend spec as an implementation note; @backend-developer to implement the null-row fallback.

### 5. user_blocks schema + DM HIDE predicate untouched (launch-gate safety) — **MATCHES (correctly NOT touched)**
This is the critical safety check, and the wave gets it right.
- **user_blocks schema:** Spec-B AC1 "no schema change to user_blocks"; contracts.data "no schema change to user_blocks"; P-3 plan.md:7 "Data model: none (no user_blocks change)"; plan.md:12 "No B-0 schema — no DB change." The enrichment is a read-side JOIN only. **No drift** from the wave-70 substrate (user-journey-map.md:425 user_blocks table; product-decisions.md:778 schema mirrors reports.ts).
- **DM HIDE predicate:** entirely out of scope — neither spec touches DmService. The wave-70 launch-gate leg (bidirectional DM HIDE at all 5 seams, T-8-proven — user-journey-map.md:423,425) is a backend safety invariant the polish never reads or modifies. **No drift.**
- The wave stays inside the "UI polish of an already-LIVE, T-8-proven feature" envelope. The launch-gate safety proof from wave-70 remains valid because nothing under it changes.
- **Tag: neither — correct scope-fence, safety preserved.**

---

## Drift summary
- **spec-drift found:** NONE. No spec item contradicts a prior decision, the wave-70 Block journey, or a founder ruling.
- **spec-gap found:** ONE, minor (item 4 — deleted-account/absent-profile JOIN-null case). Acceptable per the APPROVE bar; carried as a B-2 hardening note.
- **Launch-gate integrity:** intact. user_blocks schema + DM HIDE predicate untouched (item 5). This wave is genuine finish-work on wave-70's two recorded V-2 findings, not scope expansion.

## Alignment with founder-reserved launch gate
Both specs directly serve M14's launch-gate leg 3 completion (product-decisions.md:776) at launch quality, which the wave-70 journey named as the last polish before the founder-reserved public-directory GO. The polish does NOT trigger any launch and does NOT touch the founder-reserved GO decision — correct per the standing launch-gate carry (product-decisions.md:21). The M14-close + public-launch GO remains a genuine founder decision for L-1 (spec problem-statement, ceo-reviewer note).

## Cross-agent notes
- @backend-developer (B-2): implement the LEFT-JOIN null-row fallback for the deleted/absent-profile blocked user (item 4) — never blank, never raw UUID.
- @head-product (P-4 gate): carry item 4 as a spec-hardening note into the B-2 backend spec; no REWORK warranted.
