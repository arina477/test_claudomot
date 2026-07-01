# Wave 26 — P-4 jenny (Phase 2: spec+plan ↔ prior-decision / journey DRIFT audit)

**Scope of this pass:** NOT implementation-vs-spec (no code shipped yet at P-4). This is a DRIFT audit: does the wave-26 planned behavior CONFLICT with a settled `product-decisions.md` entry or the documented `user-journey-map.md` presence behavior? Distinguishing **spec-drift** (plan contradicts a prior decision / journey) from **spec-gap** (spec failed to anticipate a case).

**Sources cross-referenced:** P-0-frame / P-1-decompose / P-2-spec (pointer) / P-3-plan; spec source of truth = `tasks.description` of 10b9d18e (5 ACs copied into P-2). Cross-refs: `user-journey-map.md` v0.18 (wave-14 presence entry lines 159-171; wave-15 pills lines 173-185; wave-25 tokenizer lines 13) + `product-decisions.md` (wave-14 decomposition line 197; floor-precedent chain lines 216/264/300-324; ceo future-differentiator note lines 321-322).

**Codebase premise-verification (load-bearing for AC2/AC4/AC5):**
- `apps/web/src/shell/PresenceDot.tsx` — **absent** (confirms AC2 "shared component" is a NET-NEW extraction, not a pre-existing unit). ✓ matches P-0.
- `MemberListPanel.tsx:91-101` — inline dot, hard-coded hexes `#121214` / online `#10b981` / offline `#52525b`; NOT the `--color-accent-emerald` token. ✓ matches P-0 "false-premise AC2" finding.
- `globals.css:18` — `--color-accent-emerald: #10b981` exists (the shared token AC2 binds to). ✓
- `presenceSocket.ts:84` `let _socket = null` + `:94` `getPresenceSocket()` `if (!_socket)` guard = module-level singleton; `usePresence.ts` / `getPresenceStatus` are pure consumers. ✓ AC4 "no second socket" is architecturally real.
- `MessageList.tsx` author-avatar sites: main row `msg.authorId` (:958 `initials`, :1026 render), `isOwn = authorId === currentUserId` (:959, confirms authorId=userId identity), sibling variants `authorDisplay` (:1236/:1322). ✓ AC1 attach sites real.

---

## Per-AC MATCHES / DRIFTS

### AC1 — author-avatar dots reflect live /presence, update no-reload → **MATCH**
Journey (line 197, wave-14 decomposition bundle) EXPLICITLY names this as a planned sibling: *"presence dots on message-row author avatars (shared presence store, presence-dot primitive reuse)"* and *"single presence-dot primitive across member panel + author rows."* Wave-26 is the delayed execution of task 10b9d18e, which WAS that very sibling (line 202 bundle UUID list; re-homed M3→M4→M5 debt per lines 237/276). The plan reads the EXISTING store via `usePresence`/`getPresenceStatus` (plan §Architecture deltas, step #3) — consistent with the wave-14 `/presence` single-subscription model documented at journey lines 165-167. No conflicting decision. **No drift.**

### AC2 — single shared PresenceDot + shared token, both sites, no hard-coded hexes → **MATCH**
No prior decision REJECTED a shared presence-dot component; the OPPOSITE — line 197/198 pre-committed to "single presence-dot primitive" as the reuse-maximizing choice. The extraction was deferred (never built when the member panel shipped wave-14 with inline hexes), and P-0's problem-framer REFRAME correctly surfaced that AC2 requires extracting-then-consuming. That REFRAME is logged as accepted at line 321. The `--color-accent-emerald` token (design-decision lines 58/66, emerald #10b981 primary academic accent) is the canonical online color — binding the dot to it *removes* a drift (the wave-14 inline hex `#10b981` was an un-tokened duplicate of the design-system value). **No drift; the wave actively RESOLVES a latent design-token drift.**

### AC3 — unknown-presence author → NO dot (graceful degrade, no default-online) → **MATCH**
Consistent with the established presence membership-scoping invariant: journey line 166 (wave-14) — presence fan-out is co-member-scoped, "B received only co-member ids, 0 foreign." A non-co-member author legitimately has no store entry → no dot is the correct expression of that scoping at the render layer. Also consistent with the wave-15 mention-pill precedent (journey line 179): *"Non-member/unknown token → plain text, no pill"* — same degrade philosophy (unknown → render nothing, never fabricate). authorId=userId confirmed in-code (:959) and at P-0 mediation (line 23), so degrade is the genuine EDGE case, not the common case. **No drift.**

### AC4 — no additional /presence socket; message-row dots + member panel share ONE client/store → **MATCH**
Directly honors decision line 198: *"all three siblings consume one presence client/store — no duplicate socket connections."* Code-verified: `presenceSocket.ts` singleton guard means any number of `usePresence` consumers share the one socket. Plan §Alternatives (c) explicitly REJECTS "a new presence subscription scoped to visible authors" as an AC4 violation. **No drift.**

### AC5 — member-panel dot refactored onto shared PresenceDot, no regression → **MATCH**
No decision forbids refactoring the member-panel dot. The member-panel presence dot is the documented wave-14 surface (journey line 164: "row = avatar + name + presence dot"). Refactoring it to consume the extracted component (plan step #2, "behavior-preserving") is the mechanical de-duplication AC2 requires and is what line 197 always intended ("single primitive across member panel + author rows"). Plan mandates a member-panel regression test (step #4). **No drift.** (Verify-time note for V-block, not a P-4 drift: the extracted `PresenceDot` must preserve the exact wave-14 visual — the `#121214` ring wrapper + `w-3/w-1.5` sizing at MemberListPanel.tsx:92-101 — or AC5 "no regression" fails. This is an implementation-fidelity concern, not a plan-vs-decision drift.)

---

## Precedent-application consistency (the 5th under-floor override-ship)

**MATCH.** The wave-26 P-1 precedent-application (lines 318-323) is consistent with the standing chain:
- w16 test-infra exemption (line 216) → w21 UX-completion/infra-reuse extension (line 264) → w23 BOARD 6/7 (line 300) → w24 BOARD 6/7 with the **"do NOT re-litigate a Nth per-wave; log a floor-rubric revision instead"** ruling (line 306/309) → w25 precedent-application applying that ruling (line 312-314).
- Wave-26 applies the SAME twice-decided ruling (`floor_merge_attempt: 0`, `board_convened: false`). This is exactly the case the wave-24 BOARD pre-authorized. Convening a 5th BOARD would be the ceremony-without-value the BOARD deprecated. **Honors the gate, does not skip it.**
- The structural escalation (Resend-key = sole M5-close blocker; LOC-floor mismatch) is carried forward unchanged (line 322), matching w24/w25 (lines 309/315). Still founder-pending — correctly NOT re-resolved at P-1.

## Task-history / picking-now consistency

**MATCH.** 10b9d18e's history is coherent and non-contradictory:
- Authored as the wave-14 presence bundle's 4th sibling, DEFERRED (parked, parent d1c4693d) — line 202.
- Re-homed M3→M4 (line 237), then M4→M5 as independent top-level backlog (line 276, "presence-dots 10b9d18e ... parent nulled, now top-level M5 backlog").
- Blocked on UI-verifiability by the recurring Playwright chrome-channel-absent infra gap (task 67881a58; journey lines 12/13 — recurring w16/w22/w23/w25). P-0 states the **T-5 bundled-chromium substitute** (proven working wave-25, journey line 13: "LOAD-BEARING-PROVEN LIVE at T-5 (bundled-chromium)") now unblocks its verification. Picking it now = the ceo-reviewer's "only user-visible + now-verifiable of the 4 workable M5 debt candidates" (P-0 line 19). **Consistent.**

## Scope-drift check (plan vs spec; DM/hover, study-status, animation, hover-cards)

**MATCH — plan stays within spec, no expansion.** The P-2 "Out of scope" (DM/mention/hover → sibling fdb444fc; hover cards; study-status; animation) is honored in the plan — P-3 §Architecture deltas and the file-level steps touch ONLY PresenceDot + MemberListPanel + MessageList author-avatar sites + tests. The DM/hover split to sibling fdb444fc is logged at P-0 (line 25). The ceo-reviewer's **academic study-status** future-differentiator note (P-0 line 19; decision line 321-322: "surface at the next roadmap-refresh, not this wave") is correctly DEFERRED — consistent with the roadmap (study-status is not in M5 ## Scope, which is assignments; it belongs to a future academic-tooling refresh, M8-ish / roadmap-refresh per line 102's H2 "M8 Educator tools & deeper academics"). **No decision says presence must NOT extend to message rows** — the opposite (line 197 planned it). **No decision rejected a shared component** — the opposite (line 198 mandated it). No gold-plating in the plan.

## Spec-GAP scan (cases the spec did NOT anticipate — informational, not blocking)

These are NOT drifts (nothing in the plan contradicts a decision). They are edge cases the spec's "Edge cases" line names but leaves render-behavior slightly under-specified — surfaced for V-block acceptance, not P-4 rework:
- **G1 — tombstoned/deleted-author rows.** Spec edge-case list says "tombstone rows (dot only where an avatar renders)." Consistent with wave-15 pill behavior (journey line 179: "Tombstoned/edited-out message → no pill"). Plan step #3 attaches the dot to the avatar render site, so a tombstone that renders no avatar → no dot follows naturally. Confirm at V: a tombstone that DOES render an avatar shell should still degrade sensibly. **Spec-gap, low, plan-compatible.**
- **G2 — sibling author-avatar variants at MessageList.tsx:1236/:1322 key on `authorDisplay` (a display string), NOT `authorId`.** The main row uses `authorId` (:958/:1026); presence lookup needs the userId. Plan step #3 lists ":1226 + :1316" as attach sites but resolves online state via `getPresenceStatus(msg.authorId)`. If a sibling variant lacks `authorId` in scope, the degrade path (unknown → no dot) fires correctly, but the dot may be silently absent where it should show. **Spec-gap → B-block/react-specialist must confirm `authorId` is in scope at every attach site; not a plan-vs-decision drift.** (P-0 line 23 already resolved authorId=userId identity; this is a scope-availability nuance at the sibling sites.)

Neither G1 nor G2 conflicts with any settled decision — they are spec under-specification to hand to V-block, per the spec-gap (not spec-drift) distinction.

---

## Overall verdict: **APPROVE**

Every one of the 5 ACs MATCHES prior decisions and the documented journey — with AC1/AC2/AC5 being the *delayed execution of an explicitly pre-committed wave-14 plan* (single presence-dot primitive across member panel + author rows, decision lines 197-198), and AC2 additionally *resolving* a latent design-token drift (wave-14's un-tokened `#10b981` inline hex → the canonical `--color-accent-emerald`). No conflicting decision exists: no decision rejected a shared component, none forbade presence on message rows, and study-status/DM/hover deferrals are consistent with the roadmap + ceo-reviewer note. The 5th-precedent floor override-ship is consistent with the standing w24 "do-not-relitigate" ruling. Two spec-GAPS (G1 tombstone render, G2 sibling-site authorId scope) are handed to B/V — neither is a drift.

**Recommendations:**
1. B-block (@react-specialist): confirm `msg.authorId` (userId) is in scope at ALL author-avatar attach sites incl. the `authorDisplay` siblings :1236/:1322 (G2) before wiring the dot; if a site only has `authorDisplay`, either thread `authorId` through or accept documented no-dot degrade there.
2. V-block: acceptance-test AC5 pixel-fidelity (the extracted PresenceDot must preserve wave-14's `#121214` ring + `w-3/w-1.5` geometry) and AC3 degrade (unknown author → truly no dot, never default-online) live under the T-5 bundled-chromium substitute (chrome-absent infra gap 67881a58 persists).
3. Keep the Resend-key / M5-disposition founder escalation LOUD in the wave-26 digest (structural carry, line 322) — this is the 5th debt wave masking a founder-clearable M5 stall.
