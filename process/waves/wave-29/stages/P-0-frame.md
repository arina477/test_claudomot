# Wave 29 — P-0 Frame

## Discover section
- **wave_db_id:** 92df2295-9dd4-49df-8d6c-c98d51809ac4 (wave_number 29, running).
- **Prior-work citation:** wave-14 V-2 (M-3/M-4, KI-2/KI-3) filed this presence/members code-debt. M5 assignments spine already shipped LIVE (01fcefb8 CRUD, 916ecff7 panel, a5f25f9b tests, 8aa67564 permission, edbdea8f CTA).
- **Roadmap milestone:** M5 (a5232e16) in_progress (active since wave-22). Class=product-feature, Tier=T3. Re-homed presence/members debt under M5. wave row milestone backfilled = M5.
- **Spec-contract short-circuit:** no-prior-spec (prose-only) → full P-1..P-3.
- **Product-decision:** none Tier-3 (code-quality/correctness cleanup).

## Reframe section
**Original framing:** d23a0740 — (1) guard `email.split('@')[0]` displayName empty-fallback; (2) align `ServerMembersResponseSchema` wrapper to the bare-array wire shape.

**problem-framer:** REFRAME (matched_antipatterns: [#8 dead-code churn]). Both claims code-verified:
- **Part 1 (KEEP):** `??` only catches null/undefined, not `''`; `email.split('@')[0]` yields `''` when email starts with `@` or is malformed → empty displayName instead of falling through to userId. Two sites: `presence.gateway.ts:125` (`userRow?.display_name ?? userRow?.email?.split('@')[0] ?? userId`) + `servers.service.ts:249` (`r.displayName ?? r.email.split('@')[0] ?? r.userId`). Fix: replace the MIDDLE `??` with `||` at both sites (empty falls through; also guards a stored-empty display_name).
- **Part 2 (REFRAME align→DELETE):** `ServerMembersResponseSchema` (`packages/shared/src/servers.ts:66-68`, barrel-exported) is a `{ members: [...] }` wrapper; the wire is a BARE ARRAY both ends (`servers.controller.ts:81` → `Promise<ServerMember[]>`; `apps/web/src/auth/api.ts:132` → `request<ServerMember[]>`). Grep confirms ZERO consumers → inert, latent. Aligning leaves a redundant unused alias; **DELETE removes the latent trap at lower cost** (reconstruct inline if ever needed).

**ceo-reviewer:** RECONSIDER (SCOPE-REDUCTION). This is genuine wave-14 debt but the "real bug that doesn't matter" — low-value on every dimension (an empty-displayName edge-guard + a dead-schema delete) at a 0-user pre-launch product. Picking it makes wave-29 the **8TH consecutive under-floor M5-debt wave** (w16/23/24/25/26/27/28) — unambiguously the failure-mode the wave-27 park-or-key escalation named ("draining verifiable debt while the real milestone is blocked"). **Recommends pivoting to M6 voice/video groundwork** (LiveKit Cloud already decided; server-side token-mint needs NO founder credential; clears the >1500-LOC feature floor, ending the 8-wave floor-merge streak; squarely on the displace-Discord bet; is one of the founder's offered park-targets). Explicitly did NOT re-open the park fork (founder-pending); only re-orders which credential-free work runs.

**mvp-thinner:** OK. Both sub-fixes fail the M5-mvp-critical trace test (assignments spine is done+LIVE; this is re-homed debt) → no keep-set to peel from, no precedence-tie. Two fixes are separable but ~10-30 LOC each, same subsystem/source → bundling is a coherent micro-wave (splitting the latent fix 2 adds a lifecycle round-trip without de-risking). Floor-exempt (tech-debt, wave-16 precedent). Keep-OUT: (a) DELETE the dead wrapper, don't align it (agrees with problem-framer); (b) scope-freeze to exactly these two fixes — no opportunistic adjacent refactors.

**Mediation outcome (head-product arbitration of ceo-reviewer RECONSIDER vs problem-framer/mvp-thinner PROCEED):**
The ceo-reviewer's RECONSIDER-to-M6 is strategically correct in the abstract but **NON-EXECUTABLE this wave**: promoting M6 (todo) to in_progress requires the active M5 slot to be empty (N-3 Action 8 promotes next-todo ONLY when active closed), i.e. M5 must be **parked or closed** — which is precisely the founder's **pending** park-or-key decision (the ceo's own verdict concedes "under park → M6 is the new active path"). The orchestrator MUST NOT front-run a founder-reserved milestone-disposition. There is therefore no BOARD-resolvable question here (the pivot is founder-reserved, already pending), so no BOARD convened.
**ACCEPT: PROCEED with d23a0740** (the only buildable-now, founder-credential-free, non-front-running option) with problem-framer's REFRAME (part 1 `||` guard × 2 sites; part 2 DELETE dead schema) + mvp-thinner's scope-freeze. The ceo-reviewer's concrete M6 recommendation is folded into the SHARPENED founder escalation below — the debt slice is the symptom; the founder's park decision is the real fix.

**Disposition:** PROCEED (reframed) — part 1 guard + part 2 delete-dead-schema; ceo RECONSIDER acknowledged + sharpened to the founder (not executable this wave without the pending park decision).

**Final framing for P-block (single-spec, claimed_task_ids = [d23a0740]):**
- **Part 1:** replace the middle `??` with `||` at `presence.gateway.ts:125` + `servers.service.ts:249` so an empty `email.split('@')[0]` falls through to userId (guard empty display_name too).
- **Part 2:** DELETE the unused `ServerMembersResponseSchema` wrapper (`packages/shared/src/servers.ts:66-68`) + its barrel re-exports — verify zero consumers at B (grep) before deleting; align-only if a live consumer is found (none expected). This is a CONTRACT-surface touch (shared package) → B-1 Contracts likely fires.
- Keep OUT: any opportunistic presence/members refactor. design_gap_flag expected FALSE (backend correctness + shared-schema delete; no UI).

## Open escalation carried into gate — SHARPENED (ceo-reviewer, 8th recurrence)
**M5 park-or-key fork (founder decision, 8th-wave recurrence).** Founder-pending since digest 2026-07-01. The ceo-reviewer sharpened it with a CONCRETE credential-free alternative: **M6 voice/video groundwork** (LiveKit Cloud decided; server-side token-mint needs no founder credential; clears the feature floor; on the displace-Discord bet; is a founder-offered park-target). The studio is now demonstrably inside the failure-mode (8 consecutive under-floor debt waves while reminders stay Resend-blocked). head-product carries this to P-4; the founder digest is updated with the M6-concrete option so the founder's park-or-key decision is sharper on return. NOT re-raised as a new ask (already pending); enriched only.

## Exit
Discovery + reframe complete. Scope = single-spec presence/members code-debt cleanup [d23a0740: part 1 displayName `||` guard × 2 sites; part 2 DELETE dead ServerMembersResponseSchema]. ceo RECONSIDER-to-M6 non-executable this wave (founder-reserved park pending) → sharpened to founder digest. → P-1 Decompose.
