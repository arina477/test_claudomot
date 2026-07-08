# Wave 80 — P-3 Plan

## Approach section

### Architecture deltas
- **Changed — user privacy model:** add `show_presence boolean NOT NULL DEFAULT true` to users; a WRITE field on UpdatePrivacySchema + a READ field on PrivacySettingsResponseSchema. **Alt:** a separate presence_prefs table — REJECTED (one boolean belongs on the shipped privacy model alongside profile_visibility/who_can_dm; no lifecycle of its own). DEFAULT true = no backfill (existing users stay visible — no behavior change on migrate).
- **Changed — presence broadcast honor (the load-bearing delta):** the presence emit paths (presence.gateway / presence.service online/offline/last-seen fan-out to co-member rooms) gate on the subject user's `show_presence` — a false user is EXCLUDED from the broadcast to co-members. **Alt:** filter at the client — REJECTED (leaks presence over the wire; the gate must be server-side). This is a server-side visibility gate, the one behavior-bearing change. Own-visibility only: a hidden user still RECEIVES others' presence.
- **Changed — privacy.service:** persist show_presence + append a privacy-audit event (AppendPrivacyEventService) on change, consistent with profile_visibility/who_can_dm.
- **Changed — SettingsPrivacyPage:** add a REAL working "Show my presence / last-seen" toggle (reuse the existing privacy-toggle pattern; NOT the disabled-Beta affordance used for who_can_dm — presence is a live feature so this toggle works).

### Data model
- **Migration:** ALTER users ADD show_presence boolean NOT NULL DEFAULT true. No backfill, no index change. postgres-pro authors at B-0.

### API contracts (concrete)
- **PUT /profile/privacy** (existing M10 privacy-update, modified) — accepts showPresence: boolean; 200 | 400 (non-boolean) | 401.
- **GET privacy** (existing) — returns showPresence.
- Presence WS emit paths: no contract change to clients (they simply stop receiving a hidden user's presence); server-side gate only.

### New deps
- **None.**

## Plan section
### File-level steps by B-stage
**B-0 Branch & schema** — branch `wave-80-presence-toggle`; migration users.show_presence + Drizzle model. | **postgres-pro** | first.
**B-1 Contracts** — `packages/shared/src/privacy.ts`: UpdatePrivacySchema + PrivacySettingsResponseSchema +showPresence boolean; index.ts ESM re-export. | **typescript-pro** | after B-0.
**B-2 Backend** — | **backend-developer** | after B-1:
- privacy.service (modify) — persist show_presence + AppendPrivacyEventService audit event on change.
- presence.gateway / presence.service (modify) — **gate emit paths on show_presence (exclude false users from co-member broadcast)** — the load-bearing honor point.
- specs: privacy round-trip + audit event; **presence honor integration proof (a show_presence=false user is NOT in the co-member broadcast; true user IS)** — the load-bearing test (a real-connection / two-subject assertion, not single-client).
**B-3 Frontend** — | **react-specialist** | after B-1:
- SettingsPrivacyPage (modify) — real working presence toggle (reuse existing privacy-toggle pattern; NOT disabled-Beta); api client.
- tests: toggle persists + round-trips; toggle reflects server state.
**B-4 Wiring / B-5 Verify / B-6 Review** — standard. **T-block:** T-5 two-client presence-hidden e2e (the honor point).

### Specialist routing (validated against AGENTS.md)
postgres-pro · typescript-pro · backend-developer · react-specialist. All present. No D-block (design_gap false).

### Parallelization map
- Serial: B-0 → B-1. After B-1: B-2 (backend honor + audit) ∥ B-3 (settings toggle, web-only). No file overlap.

### Self-consistency sweep
1. Every P-2 AC → step: column+field (B-0/B-1); persist+audit (B-2 privacy.service); **honor point (B-2 presence.gateway)**; toggle (B-3); two-client honor proof (B-2 integration + T-5). sendReadReceipts NOT shipped (descoped). ✓
2. Every step has a specialist. ✓ 3. No file in two batches. ✓ 4. design_gap false referenced. ✓ 5. Deltas + alternatives (separate-table rejected; client-filter rejected). ✓ 6. Contracts concrete. ✓ 7. No new deps. ✓ 8. No new SDK. ✓

**Binding refinements carried:** showPresence-only (no sendReadReceipts, anti-theater); server-side presence honor gate (not client filter); DEFAULT true no backfill; two-client honor test (single-client = coverage theater); privacy-audit event; own-visibility-only semantics.

## P-4 Phase-2 binding corrections (fold into B — override conflicting wording above)
- **B-2 (LOAD-BEARING):** the toggle path proactively emits presence:offline (on→hidden) / presence:online (hidden→on) to co-member rooms — a privacy→presence cross-module emit — so a mid-session toggle updates peers WITHOUT a reconnect (the real AC-2 mechanism; passive gating alone fails the two-client test). Wire the presence gateway/emitter into the privacy update path (or a subscribed event).
- **B-2 snapshot honor:** the snapshot-on-join path (presence.gateway ~:163) needs co-members' BATCH show_presence (subject-set = co-members), not just the connecting user's flag.
- **B-2 disconnect gate:** cache show_presence on socket.data at connect (mirror displayName/serverIds) — no disconnect-time query.
- **Copy:** binary online/offline only (no last-seen timestamp exists) — presence/online-status toggle, not "last-seen".
- **T-9:** add the toggle to journey-map page-16. **product-decisions:** note presence-hidden governs online broadcast only, not study-timer/focus-room activity rosters.
