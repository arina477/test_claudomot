# P-0 Frame — wave-66

## Discover
- wave_db_id: 1e46dde9-9aee-4448-b2ff-f1a4bc065d40 (wave_number 66, running; milestone M12 backfilled)
- Prior-work: wave-65 (cold-offline workspace hydration) — THIS is its V-1-jenny G2 follow-up (copy polish on the offline empty-state that wave-65 shipped). Cited.
- Roadmap milestone: M12 Offline-first moat (36378340), in_progress. ## Class: product-feature (→ mvp-thinner spawned).
- Spec-contract short-circuit: no-prior-spec (seed prose).
- Product decisions: none (cosmetic copy). Monetization founder-reserved (untouched).

## Reframe
**Task:** replace the error-worded "Couldn't load channels." offline empty-state (never-synced server opened offline, cold detail-cache miss) with a neutral offline message, gated on connection state. Reuse ConnectionStateIndicator. V-1-jenny wave-65 G2.

**Reviewers (all against the task):**
- problem-framer: **PROCEED**. Verified target = `apps/web/src/shell/ChannelSidebar.tsx:335-341` (the `detailStatus==='error'` branch, which today CONFLATES offline-cold-miss with genuine-online-failure). `apps/web/src/shell/useConnectionState.ts` returns `'online'|'reconnecting'|'offline'` — the gate the fix needs. REFINEMENT (affirmed): the neutral copy MUST be gated on connection state `offline`/`reconnecting`; a genuine `online` + `detailStatus==='error'` must STILL read as an error (else false-comfort during real failures). Test `apps/web/src/shell/shell-components.test.tsx:290` asserts `/couldn't load channels/i` → must be updated (split offline-neutral vs online-error).
- ceo-reviewer: **PROCEED / HOLD-SCOPE** + strategic flag (below). Legitimate finish-work on the just-shipped offline surface; nothing coherent to bundle (adjacent M12 scope blocked/ill-posed).
- mvp-thinner: **OK** (atomic single-purpose; scoped to the one channel-sidebar cold-detail empty-state; no multi-surface sweep to split).

**Disposition: PROCEED** to P-1.

**Final framing for P-block:** Presentation-only. In `ChannelSidebar.tsx`, split the `detailStatus==='error'` render: when `useConnectionState()` is offline/reconnecting (a never-synced server offline), show a NEUTRAL offline empty-state ("This server isn't available offline yet — reconnect to load its channels." or similar); when online (genuine failure), keep the existing error copy. Update the `shell-components.test.tsx:290` test to assert both branches. No logic/schema/API change. design_gap_flag likely false (reuses existing state + copy; P-1 confirms).

## STRATEGIC FLAG (carry to wave-66 N-1 / founder digest — NOT a blocker for this wave)
ceo-reviewer + mvp-thinner + head-next(wave-65) converge: this is essentially M12's LAST cleanly-buildable increment. After it ships, M12's offline READ-path moat is complete but the milestone hits SEED SCARCITY — remaining clauses are the BLOCKED assignment-media leg (10e7543f, needs an online assignment-attachment view first) + the likely-ILL-POSED conflict-resolution UI (offline writes today = append-only message outbox; genuine two-place EDIT conflicts may not arise). A Tier-3 MILESTONE-DISPOSITION decision is needed (NOT auto-decomposition): **Option A** — declare the moat shipped at read-path completeness, reword/close the conflict-resolution clause; **Option B** — invest in a real offline-EDIT surface first (net-new build), then build conflict-resolution. Route to founder/BOARD when M12 seed scarcity fires (wave-66 N-1 or later).

```yaml
short_circuit: no-prior-spec
roadmap_milestone: 36378340-0ea5-428e-bc94-03750fb103f6
disposition: PROCEED
design_gap_flag: unset  # P-1 (likely false)
strategic_flag: M12-disposition-decision-due-after-this-wave (Tier-3; Option A close/reword vs Option B offline-edit-surface)
