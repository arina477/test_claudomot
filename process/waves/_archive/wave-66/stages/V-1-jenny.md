# V-1 jenny — wave-66 spec-compliance & drift review

**Verdict: APPROVE**

Task: 6018bdee-1b99-47b2-8235-b3786c29c2d5 (single-spec, `design_gap_flag=false`)
Wave: split the channel-sidebar `detailStatus==='error'` copy by connection state — wave-65 G2 follow-up.
Deployed: commit `d094f9c`, web `SUCCESS` + 200; served bundle `index-CHxdidDO.js`.
Method: static verification of source + test + deployed bundle + cross-reference against product-decisions + journey map. Live Playwright confirm DECLINED (proportionate — a deterministic copy branch already unit-covered at all three connection states; see Live-confirm note below).

## AC-by-AC verification

| AC | Requirement | Evidence | Result |
|----|-------------|----------|--------|
| **1 OFFLINE-NEUTRAL** | offline/reconnecting + detail-error → neutral offline copy, NOT "Couldn't load channels." | `apps/web/src/shell/ChannelSidebar.tsx:341-343` — `connectionState === 'offline' || connectionState === 'reconnecting'` renders "This server isn't available offline yet — reconnect to load its channels." (verbatim spec suggestion). `connectionState` is a live value from `useConnectionState()` (`ChannelSidebar.tsx:33,179`), not hardcoded. | PASS |
| **2 ONLINE-ERROR PRESERVED** | online + detail-error → existing "Couldn't load channels." retained (no false comfort) | `ChannelSidebar.tsx:343` — else-branch keeps "Couldn't load channels." Test `shell-components.test.tsx:317-321` asserts online→error copy present AND neutral copy absent. | PASS |
| **3 PRESENTATION-ONLY** | no state-machine / fetch / cache / API / schema change; reuse `useConnectionState`/`ConnectionStateIndicator`; no new offline component | Commit `d094f9c` code diff touches exactly 2 files: `ChannelSidebar.tsx` (7 lines, the copy branch) + `shell-components.test.tsx` (33 lines). No `.ts` service, no `messages`/`db`/`cache` file, no migration, no API route. `connectionState` derived via the shipped `useConnectionState` (which types off `ConnectionStateIndicator`'s `ConnectionState`). No new component. | PASS |
| **4 TEST UPDATED** | existing `/couldn't load channels/i` assertion split to assert BOTH branches | `shell-components.test.tsx:303-322` — three deterministic cases: offline (`306-307`), reconnecting (`311-314`), online-error-preserved (`318-321`), each `getByText` positive + `queryByText…not` negative. Ran locally: **18/18 pass**. | PASS |

Edge cases from spec all honored: `reconnecting` folds into the offline-neutral branch (`ChannelSidebar.tsx:341`); cached-detail-present branch (`detailStatus==='loaded'`, line 349) is untouched; genuine online failure keeps error copy.

## Deployed-behavior confirmation (truthfulness of the green)
- Live bundle `index-CHxdidDO.js` contains BOTH strings: `grep -c "available offline yet"` = 1 and `grep -c "Couldn't load channels"` = 1. The branch is genuinely shipped, not merely merged — source ↔ deployed match confirmed.
- Deployed commit `d094f9c` diff carries the exact 3-way branch (`+ connectionState === 'offline' || connectionState === 'reconnecting' ? … : "Couldn't load channels."`).

## Drift vs gap analysis (the four judgment calls)

1. **Connection-gated copy + ConnectionStateIndicator reuse vs the established offline-signal approach — MATCH, no drift.** The wave-21 offline-signal decision (product-decisions L273-284) established `useConnectionState` (socket-lifecycle + `navigator.onLine`, SOURCE-PRIORITY: offline > reconnecting > online) as THE canonical live connection signal plumbed into the shell, and the wave-21 floor-exemption precedent (L281-284) blessed "make shipped offline infra function at runtime" waves. This wave consumes that exact hook read-only (`useConnectionState.ts` unchanged) to gate copy. It reuses the shipped signal verbatim — the textbook application of the established approach, zero reinvention. Consistent with the M4→M12 read-cache lineage (L272-289, offline reads gated on the same connection-state signal across DMs/assignments/schedule/media/server-tree).

2. **Preserving online-error copy vs the don't-mislead principle (AC2) — MATCH.** Showing neutral "not synced yet, reconnect" copy during a genuine online 5xx would be false comfort — telling a user to reconnect when they ARE connected and the server actually failed. The implementation gates the reassuring copy strictly on `offline || reconnecting` and retains the honest failure copy when `online`. This is the same honesty discipline the project has enforced elsewhere (e.g. wave-62 T-5 used non-cached "Failed to load" as a deliberate falsification contrast). The copy tells the truth in both states. No drift.

3. **New journey surface / contradicted flow — NONE.** This is a copy change on the existing `detailStatus==='error'` empty-state of the already-inventoried channel-sidebar surface (journey map L115: "no-server prompt / loading / error states all present"). No new route, screen, endpoint, or component; URL/flow unchanged. The journey-map entry needs only a T-9 annotation (the error state now branches by connection state), not a new surface row. No flow contradicted.

4. **P-0 M12-disposition strategic flag consistency — CONSISTENT.** The wave-66 P-1 floor-override entry (product-decisions, wave-66 section) carries the ceo-reviewer strategic flag: this is "M12's LAST cleanly-buildable increment; after it ships, M12 hits seed scarcity → a Tier-3 milestone-disposition decision is due (Option A declare moat shipped / Option B build a real offline-EDIT surface first), route to founder when scarcity fires — NOT a blocker for this wave." This is consistent with the established M12 discipline: `open_count=0` never auto-closes a large milestone (L-1 deltas waves 62/63), milestone-disposition + horizon-jump promotion is founder-reserved (wave-59 HOLD ruling L665-669, wave-37/44/46 precedent chain), and the surviving M12 clauses (conflict-resolution UI + deferred assignment-media 10e7543f) are correctly named as scope-fenced/blocked. Surfacing the scarcity decision as a *future* founder route rather than acting on it this wave is exactly the founder-reserved pattern. The floor-override-by-precedent (no fresh BOARD, wave-24 "do-not-re-litigate-Nth" ruling) also matches the wave-65/53/21 lineage. No inconsistency with prior decisions.

## Live-confirm note
DECLINED the optional Playwright prod probe. Rationale (proportionate): the change is a pure copy branch with zero data/logic path, the connection-state discriminator is deterministically unit-covered at all three states (offline/reconnecting/online), the served bundle was byte-confirmed to contain both strings, and `useConnectionState` itself is already live-proven across waves 21/62/63/64/65. A browser probe would add no signal a unit test + bundle grep don't already provide for a copy swap. No material drift found → APPROVE per the review contract.

## Findings summary
- **Blocking:** none.
- **Drift:** none. All four judgment calls resolve to MATCH/CONSISTENT.
- **Gaps:** none — all 4 ACs fully implemented, tested, and live-deployed.
- **Non-blocking carry (informational, already recorded — not a wave-66 defect):** M12 seed-scarcity Tier-3 milestone-disposition is due at wave-66 N-1 or later, per the ceo-reviewer P-0 flag; route to founder (founder-reserved). Noted here only so V-2/N-1 do not lose the thread.

**Verdict: APPROVE.**
