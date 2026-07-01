# Wave 26 — P-0 Frame

## Discover section
- **wave_db_id:** 14908bd1-92fc-411c-aa13-6b4b2ea6d2ca (wave_number 26, running).
- **Prior-work citation:** presence infra shipped wave-14 (/presence namespace, typing, member-list, presence dots in the MEMBER PANEL). This task extends the SAME presence store to message-row author avatars. Re-homed M3 presence debt.
- **Roadmap milestone:** M5 (a5232e16) in_progress. Class=product-feature, Tier=T3. Task is re-homed M3 debt riding under active M5 (M5's own ## Scope is assignments — not this task; same rehome pattern as wave-25). wave row milestone backfilled = M5.
- **Spec-contract short-circuit:** no-prior-spec (## What/## Why/## Acceptance prose, no fenced YAML head) → full P-1..P-3.
- **Product-decision:** none Tier-3 (UI presence surface; no money/security/major-UX tradeoff).

## Reframe section
**Original framing:** presence dot on message-row author avatars in server-channel-view, driven by the existing single /presence store; shared presence-dot primitive/token; degrade on unknown; no second socket.

**problem-framer:** REFRAME (matched antipattern #1 symptom-vs-cause at AC2). Verified in code:
- AC3 "no second socket" TRUE — presence socket is a module-level singleton (presenceSocket.ts:84/95, `getPresenceSocket()` guarded); `usePresence` is a pure consumer. No store-unification refactor hidden.
- AC1 attach site real — message-row author avatar at MessageList.tsx:1013-1020 (+ 1226, 1316).
- **AC2 FALSE PREMISE** — there is NO `PresenceDot` component anywhere; the member-panel dot is inline JSX with hard-coded hexes (MemberListPanel.tsx:91-101: `#10b981`/`#52525b`/`#121214`), NOT using the existing `--color-accent-emerald` token (globals.css:18). So AC2 "shared primitive, no second styling source" requires FIRST extracting a shared `PresenceDot` component + token binding out of the member panel, THEN consuming at both sites. The seed hides this extraction as a pre-existing dependency.
- Flag: confirm msg.authorId is a userId (member panel keys on member.userId); if authorId were a display handle, "unknown→no dot" becomes the common case.

**ceo-reviewer:** PROCEED (HOLD-SCOPE). Right thing (only user-visible + now-verifiable of the 4 workable M5 debt candidates; T-5 bundled-chromium rule unblocked its UI verification). Correctly sized — no expansion, no cut. Presence = Discord-parity **table-stakes, NOT the differentiating wedge** (bet pillars are academic tooling + offline-first). Declined the DM/hover expansion (gold-plating at ~0 users). The genuinely differentiating play — **academic study-status** ("in a study room"/"focusing"/course tags, which Discord lacks) — is real but premature (needs own design brief + status data model + real users) → **track as a future academic-presence roadmap-refresh item**, NOT this wave. Resend-key M5 headline blocker stays LOUD (sole M5-close blocker; this wave doesn't touch it).

**mvp-thinner:** THIN. Split the "DM/member-mention/hover affordance" extension (title + ## What parenthetical only, ZERO backing AC) to a sibling; KEEP AC1-3 (message-row author dots) as the coherent shippable slice. AC2 degrade + AC3 single-socket both ESSENTIAL (not splittable). Not M5-mvp-critical (re-homed debt) → no precedence-tie with M5 scope.

**Mediation outcome:** No ceo-reviewer↔mvp-thinner tie (ceo proposed no expansion). The problem-framer REFRAME is a NARROW AC-level clarification (surface the PresenceDot-extraction step that AC2 already implicitly required), NOT a fundamental problem-reframe — the task remains "presence dots on author avatars." ceo-reviewer's strategic verdict (right thing / right size / table-stakes) and mvp-thinner's split BOTH survive the clarification unchanged (a full re-spawn would re-derive identical verdicts), so per head-product mediation the reframe is ACCEPTED-and-folded rather than triggering a full reviewer re-spawn. **authorId flag RESOLVED:** msg.authorId IS a userId (`msg.authorId === currentUserId` MessageList.tsx:959; server `authorId = req.session.getUserId()` messages.controller.ts:84/311) — same identity space as presence → "unknown→no dot" is the genuine EDGE case (non-co-member author), not the common case. De-risks AC2's degrade path.

**Sibling created:** fdb444fc-370d-475e-82f5-2513bed650e7 ("Extend presence dots to DM/member-mention/hover affordances", parent_task_id=10b9d18e, milestone M5, wave_id NULL).

**Disposition:** PROCEED (with accepted REFRAME + accepted THIN split).

**Final framing for P-block:** Extract a shared **`PresenceDot`** component from the member-panel inline dot (bind it to the existing `--color-accent-emerald` / presence token set, replacing the hard-coded hexes), and apply it to message-row author avatars in server-channel-view — consuming the EXISTING single presence store/socket (presenceSocket singleton + usePresence), so both the member panel AND author avatars render from ONE presence source with ONE styling source. AC1 (live dot on author avatars), AC2 (shared PresenceDot primitive + graceful degrade on unknown presence — edge case, authorId=userId confirmed), AC3 (no second socket). P-2 confirms the identity mapping + the degrade rendering. Keep OUT: DM/member-mention/hover affordances (→ sibling fdb444fc), hover cards, study-status beyond binary online/offline, dot animation/pulse (gold-plating). **Future roadmap note (ceo-reviewer):** academic study-status presence ("in a study room"/course tags) = the real differentiating presence play — surface at the next roadmap-refresh, not this wave. design_gap_flag expected FALSE (existing avatar surface + design ref; the PresenceDot extraction is a componentization of an existing rendered dot, not a new design) — confirm at P-1.

## Exit
Discovery + reframe complete. Scope = [10b9d18e: extract shared PresenceDot primitive + apply to message-row author avatars, AC1-3; DM/hover deferred to sibling fdb444fc]. → P-1 Decompose.
