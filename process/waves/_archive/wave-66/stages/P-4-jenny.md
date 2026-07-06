# P-4 jenny — wave-66 drift check (spec + plan vs prior decisions + journey map)

**Agent:** jenny (spec-compliance / drift auditor)
**Wave:** 66 — offline empty-state copy polish (neutral wording for a never-synced server's channel sidebar)
**Task:** 6018bdee-1b99-47b2-8235-b3786c29c2d5 (milestone M12 offline-first moat; wave_id NULL at read time — expected pre-claim)
**Inputs read:** task `description` (YAML+prose), P-2-spec.md, P-3-plan.md, P-0-frame.md, product-decisions.md (M12 + wave-21 + wave-65/66 entries), user-journey-map.md (M12 offline read-cache annotations, wave-62/63 pattern).
**Verified against live code:** ChannelSidebar.tsx:335-341, useConnectionState.ts, ConnectionStateIndicator.tsx, shell-components.test.tsx:290.

---

## Verdict: **APPROVE** — no material drift.

The spec and plan are internally consistent, target real code that exists exactly where cited, and align with every prior decision on the offline-signal approach, the "don't mislead during real failure" principle, the journey-surface expectations, and the M12 disposition flag. This is a textbook UX-completion-on-shipped-infra polish in the wave-21/62/63/65 lineage.

---

## Per-item MATCHES / DRIFTS

### Q1 — Gating copy on connection state + reusing ConnectionStateIndicator vs the established offline-signal approach → **MATCH**
- **Evidence — established approach:** product-decisions.md:84 defines `ConnectionStateIndicator` as "the offline-first wedge made visible"; the wave-20/21 M4 work (decisions.md:274, 288) plumbed a live `'online'|'reconnecting'|'offline'` value derived from socket lifecycle + `navigator.onLine`. The M12 read-cache waves (62/63, journey-map lines 19-20) all reuse this same "M4 connection-state signal" to decide cache-vs-live rendering.
- **Evidence — this wave:** spec AC1 + AC3 and plan §Approach gate the render on `useConnectionState()` (offline/reconnecting → neutral; online → error) and explicitly reuse the shipped `useConnectionState`/`ConnectionStateIndicator`, "no new offline UI component." Code confirms `useConnectionState.ts` returns exactly that tri-state enum (`ConnectionState` type re-exported from `ConnectionStateIndicator.tsx:14`) and the source-priority derivation matches what the ACs assume.
- **Ruling:** identical mechanism to the shipped moat. No new signal invented; no second subscription. Full MATCH.

### Q2 — Preserving the online-error copy vs the "don't mislead during real failure" principle → **MATCH**
- **Evidence:** spec AC2 ("ONLINE-ERROR PRESERVED … the change must NOT give false comfort during a real online failure"), P-0-frame reviewer refinement (problem-framer, affirmed: "a genuine `online` + `detailStatus==='error'` must STILL read as an error (else false-comfort during real failures)"), and P-3 self-consistency sweep all encode this. The spec's edge-cases block correctly retains error copy for the genuine-online-failure branch and classifies `reconnecting` as offline-neutral (transitional, user not online).
- **Cross-ref:** this mirrors the wave-37 journey-map precedent of NOT masking a real backend state behind a comforting message (two-read-model coexistence documented as intentional, not hidden). Preserving the error branch is the correct, honesty-preserving split.
- **Ruling:** the split is precisely the anti-false-comfort behavior the principle demands. Full MATCH.

### Q3 — New journey surface / contradicted flow → **MATCH (none introduced)**
- **Evidence:** spec AC3 + design_gap_flag=false + P-0 "no new route/screen." Target is a copy change inside the existing `detailStatus==='error'` branch (ChannelSidebar.tsx:335-341), the same channel-sidebar empty-state that wave-65 shipped (decisions.md:711 — "cold-offline workspace hydration"). This matches the M12 pattern established in journey-map lines 19-20 for waves 62/63: presentation/data-source changes on existing surfaces are annotation-only, zero route/screen delta. No flow is contradicted — the error branch's behavior for genuine online failure is unchanged.
- **Ruling:** no new surface, no contradicted flow; T-9 will be annotation-only consistent with the M12 waves. MATCH.

### Q4 — P-0 strategic M12-disposition flag consistency vs prior decisions → **MATCH**
- **Evidence:** P-0-frame STRATEGIC FLAG (lines 22-23) flags this as "M12's LAST cleanly-buildable increment," names the blocked assignment-media leg (10e7543f) + likely-ill-posed conflict-resolution UI, and proposes a Tier-3 milestone-disposition (Option A close/reword vs Option B offline-edit-surface), routed to founder/BOARD at N-1 — explicitly NOT a blocker for this wave.
- **Consistency:** this is recorded verbatim in decisions.md:717-719 (wave-66 floor-merge + strategic carry) and is the natural continuation of decisions.md:665-668 (wave-59 M12 disposition = founder-reserved, HOLD) and :674-678 (founder directive that promoted M12 with a founder-adjustable working metric). Flagging-not-deciding, and routing the horizon/disposition call to founder, matches the standing wave-59 "M12 promotion/disposition is founder-reserved (rule 17)" precedent. No agent is pre-empting a founder-reserved call.
- **Also consistent:** decisions.md notes wave-65 head-next flagged the same M12-scarcity point; wave-66 P-0 re-surfacing it (not re-deciding it) is correct.
- **Ruling:** flag is consistent with prior decisions; deferral to founder at N-1 is the right lane. MATCH.

---

## Notes (non-blocking, no rework)
- The neutral-copy string in the spec is illustrative ("e.g. \"This server isn't available offline yet — reconnect to load its channels.\""), not fixed. Fine — AC1 pins the *semantics* (neutral, conveys never-synced, NOT error-worded), which is the verifiable contract; exact wording is a B-3 detail. No drift.
- AC4 (test split) correctly targets the live assertion at shell-components.test.tsx:290 (`/couldn't load channels/i`), which exists exactly as cited. Splitting it into offline-neutral + online-error branches is the right coverage for the new conditional.
- Presentation-only scope (AC3) is credible: the `detailStatus` state machine, fetch, cache, API, and schema are all untouched; only the JSX inside one already-rendered branch changes, reading a hook already available in the shell.

**Handoff:** clean APPROVE to head-product for the P-4 gate verdict. No REWORK items. Strategic M12-disposition flag correctly parked for N-1 → founder, not this wave.
