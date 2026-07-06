# P-4 Karen — wave-66 (offline empty-state copy polish)

**Phase 2 spec+plan claim verification against real code (repo `/home/claudomat/project`, branch `main`).**
Spec: `tasks` row `6018bdee-1b99-47b2-8235-b3786c29c2d5`. Plan: `process/waves/wave-66/stages/P-3-plan.md`.

Scope note: tiny presentation-only wave. Verified every load-bearing claim independently by reading actual source, not by trusting the plan.

---

## Per-claim verdicts

### Claim 1 — ChannelSidebar has a `detailStatus === 'error'` branch showing "Couldn't load channels." around l.335-341
**VERIFIED.**
`apps/web/src/shell/ChannelSidebar.tsx:335-341` — the branch exists exactly at the cited location:
```
335  {selectedId && detailStatus === 'error' && (
336    <div className="px-2 py-6 text-center">
337      <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.40)' }}>
338        Couldn&apos;t load channels.
339      </p>
340    </div>
341  )}
```
Copy, gate condition (`selectedId && detailStatus === 'error'`), and line range all match the plan (`ChannelSidebar.tsx:335-341`). This is the exact single call site the wave will split. Note the copy is HTML-escaped as `Couldn&apos;t` — the wave must preserve that escaping when editing.

### Claim 2 — `useConnectionState.ts` exists and returns offline/reconnecting/online
**VERIFIED.**
`apps/web/src/shell/useConnectionState.ts:47-100` — hook `useConnectionState(): ConnectionState` exists and returns a `ConnectionState`. The type is defined and exported at `apps/web/src/shell/ConnectionStateIndicator.tsx:14`:
```
export type ConnectionState = 'online' | 'reconnecting' | 'offline';
```
The derivation (`useConnectionState.ts:23-43`) covers all three states with a documented SOURCE-PRIORITY contract; `reconnecting` is a real distinct return value (l.37-39), which the spec's edge-case ("reconnecting → treated as offline-neutral") depends on. The gate the fix needs (offline OR reconnecting vs online) is exactly expressible from this return shape. Pure client hook — no server/network fetch of its own; reads socket lifecycle + `window` network events only.

### Claim 3 — test has `/couldn't load channels/i` assertion around l.290
**VERIFIED.**
`apps/web/src/shell/shell-components.test.tsx:288-291`:
```
288  it('shows an error message when detail fetch fails', () => {
289    renderSidebar({ selectedId: 's1', detailStatus: 'error' });
290    expect(screen.getByText(/couldn't load channels/i)).toBeInTheDocument();
291  });
```
Assertion at l.290 matches the regex exactly. This is the assertion AC4 says will be updated/split. (Secondary reference at l.285 `/couldn't load/i` in the loading test — a negative assertion — also exists; the wave should keep both in view, but the primary target l.290 is confirmed.)

### Claim 4 — presentation-only; plan touches only ChannelSidebar.tsx + shell-components.test.tsx
**VERIFIED.**
Plan (`P-3-plan.md:9-15`) explicitly SKIPs B-0 Schema / B-1 Contracts / B-2 Backend, and the file table lists exactly two paths: `ChannelSidebar.tsx` (modify) and `shell-components.test.tsx` (modify). Spec contracts block confirms `api: ["none — reuses existing GET /servers/:id detail path; no server change"]`, `types: []`, `data: []`, `sdk: []`, and PRESENTATION-ONLY AC ("no change to the detail state machine, data fetching, cache logic, API, or schema"). `useConnectionState` and `ConnectionStateIndicator` are pre-existing shipped code (reused, not created) — confirmed present in-repo, so no new component is implied. No server/API/schema change is implied by any claim.

---

## Reality-check observations (non-blocking, for B-block awareness)
- The test file does **not** currently import or mock `useConnectionState` — so once `ChannelSidebar` calls the hook, the existing error test (l.288-291) will exercise the hook's real derivation (default `online` under jsdom where `navigator.onLine` is typically `true`, socket `offline`). Under jsdom the socket is not connected, so `deriveState()` would actually return `offline`, not `online`. **This means the existing l.290 test would render the NEUTRAL copy, not the error copy, after the change unless the wave mocks `useConnectionState` / socket state per case.** AC4 already calls for splitting into two cases with explicit online vs offline — so the plan covers this, but B-3/B-5 MUST mock connection state deterministically per case or the online-error assertion (AC2) will be untestable and the migrated l.290 test could silently assert the wrong branch. Flagging so it is not discovered late.
- Copy is HTML-entity-escaped (`&apos;`); preserve escaping in the new neutral string too.

## Overall verdict: **APPROVE**

All four load-bearing claims VERIFIED against real code with exact file:line citations. The spec's cited anchors (ChannelSidebar error branch, useConnectionState return shape, the test assertion) all exist as described, and the presentation-only / two-file scope is accurate. The one substantive risk (test must mock connection state per branch) is already inside AC4's intent and is a B-block execution concern, not a false claim — it does not invalidate the plan.
