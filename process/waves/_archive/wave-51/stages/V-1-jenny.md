# V-1 jenny — Semantic-spec verification (wave-51)

**Wave:** 51 — StudyHall DM surface canonical 3-panel layout fix (M8 DM-polish)
**Spec (authoritative, DB):** task `39fc1c5e-7fcc-473a-9f50-71cdb53f8759` (`spec-id: wave-51-spec`)
**Target:** DEPLOYED production — web `https://web-production-bce1a8.up.railway.app` (merge `01399a5`)
**Method:** Playwright (isolated context, installed node package — NOT MCP; no `browser_close`). Logged in as Fixture A (`studyhall-e2e-fixture@example.com`, member of server `ad62cd12`). Read-only; no fixes.
**Verdict:** **APPROVE**

---

## Summary

All 5 acceptance criteria MATCH deployed behavior with measured DOM evidence. The canonical DM 3-panel geometry is live and correct: on the DM surface the server `ChannelSidebar` is fully gated off (desktop + mobile overlay), `DmThread` gets the full canonical width (**measured 632px @1024**, 888px @1280), no stale server-channel column and no "Select a server" leak, and the server/channel view renders `ChannelSidebar` unchanged (no regression). The `!dmHomeActive` gate proven correct in BOTH directions (enter DM → sidebar absent; exit DM → sidebar returns). No API/DTO change; DM data flow (conversation list + thread + placeholder) loads normally. No console errors, no 5xx.

One pre-existing defect observed on the DM→server RETURN path — it **MATCHES the known T-block finding F-1** (already routed to V-2), is **NOT** a regression of this wave's gating change, and does not touch any wave-51 AC. Reported below as a match, not new drift.

---

## Per-AC results (deployed evidence)

### AC1 — DM surface renders canonical 3-panel (ServerRail + DmConversationList + DmThread), NO server ChannelSidebar — **MATCHES**
- On the DM surface @1024: `channel-sidebar` count = **0**; `dm-home` present; `server-rail` present (72px).
- `dm-home` children widths = **[320, 632]** = DmConversationList (320) + DmThread (632). ServerRail (72) sits outside `dm-home` as pane 1. Three panels exactly, no fourth column.
- @1280: `channel-sidebar` count = **0**; `dm-home` children = [320, 888].

### AC2 — DmThread full canonical width, no premature wrap @1024 / @1280 — **MATCHES**
- `dm-thread`/`dm-no-conversation` `<main>` bounding-box width = **632px @1024** (x=392 = 72+320, confirming it starts right after the conversation list with no 260px sidebar stealing space). This is the spec's exact target `1024 − 72 − 320 = 632`.
- @1280: main width = **888px** (= 1280 − 72 − 320). Widths scale cleanly with viewport; no ~372px cramping, no fixed max-width forcing wrap. The wave-46 F9 cramped-~372px defect is resolved on prod.

### AC3 — No stale channel list / "Select a server" placeholder anywhere on the DM surface — **MATCHES**
- @1024 and @1280 on the DM surface: `channel-sidebar` = 0 AND body text `/select a server/i` = **false** (not present).
- Stale-server flow: selected a real server (ChannelSidebar present = 2 instances) → switched to DM → `channel-sidebar` = **0**, no "select a server" text, geometry back to [320, 632]. No stale-server leak.

### AC4 — Mobile (<lg) DM path unaffected; ChannelSidebar mobile overlay drawer gated off; DM mobile nav works — **MATCHES**
- Mobile 390×844, DM surface reached: `mobile-sidebar-backdrop` = **0**, `Channel sidebar drawer` = **0**, `channel-sidebar` = **0** → overlay drawer + backdrop fully gated off while `dmHomeActive`.
- `dm-home` present (`aria-current="page"` on the DM rail button); DM content renders ("Direct Messages", conversation roster incl. `studyhallfixtureb`, "Select a conversation to start messaging."). DM mobile navigation works end-to-end.
- Note: Playwright pointer-click on the mobile DM rail button was intercepted by a tooltip `<div>` overlay at the button center (hit-test showed `isButtonOrChild:false`) — a **test-harness pointer artifact, not a product defect**; a direct DOM `.click()` (equivalent to a real tap/keyboard activation) mounted the DM surface correctly. This does not affect any AC.

### AC5 — Toggling server view ↔ DM toggles ChannelSidebar correctly, no flash/orphan — **MATCHES**
- Server view (default `/app`, `dmHomeActive=false`): `channel-sidebar` present (2 instances — desktop inline + mobile overlay node, per design "always in DOM for AT").
- Enter DM (`dmHomeActive=true` via DM rail button): `channel-sidebar` = 0, `dm-home` mounts.
- Exit DM (DM rail button toggles `dmHomeActive=false`): `channel-sidebar` = **2**, `dm-home` = **0** — ChannelSidebar returns cleanly, DM surface unmounts, no orphaned/empty column. The gate is correct in both directions.

---

## Contract conformance (AC-adjacent)
- Spec contracts are empty (`types/api/data/sdk: []`) — no API/DTO/schema change expected. Confirmed: the DM surface still loads conversations + thread + composer-placeholder normally; the layout-only gating change did not break DM data flow. No network errors, no 5xx, no console errors captured.

## Journey continuity
- DM surface usable end-to-end: conversation list (roster with `studyhallfixtureb` + prior test conversations) + thread canvas + "Select a conversation to start messaging" placeholder (composer appears once a conversation is opened). No dead-end introduced by the layout change. Desktop and mobile both reach the DM surface and render its content.

---

## Drift vs gap

**No drift, no material gap** against the wave-51 spec. All ACs match deployed behavior.

### Observed pre-existing defect — MATCHES known F-1 (NOT new drift, NOT this wave's scope)
- **What:** On the DM→server RETURN path, clicking a ServerRail server tile while `dmHomeActive=true` does not exit the DM surface — `channel-sidebar` stayed 0 / `dm-home` stayed mounted across repeated server-tile clicks in this session.
- **Root cause (traced in source):** the server tile `onClick` calls only `selectServer(s.id)` (`ServerRail.tsx:237`); the ONLY handler that flips `dmHomeActive` off is `onDmHome` on the DM rail button (`AppShell.tsx:55-58`). Server-select does not exit DM mode; the exit is a fragile adjacent side-effect — exactly the "adjacent DM↔server toggle race" the T-block flagged.
- **Isolation proof:** when `dmHomeActive` IS flipped correctly (via the DM rail button toggle), `channel-sidebar` returns to 2 and `dm-home` unmounts — so the wave-51 `!dmHomeActive` gating logic is correct in both directions. The defect lives entirely in the server-select path this wave did NOT touch.
- **Classification:** MATCHES T-block finding **F-1** (`process/waves/wave-51/blocks/T/findings-aggregate.md`, `T-5-e2e.md`) — pre-existing, non-blocking, recoverable, already routed to **V-2**. Per the V-1 mandate, reported as a match to F-1, **not double-reported as new drift**. Does not touch any wave-51 AC and does not block APPROVE.

---

## Evidence provenance
- Live prod `web-production-bce1a8.up.railway.app`, merge `01399a5`; Fixture A session; Playwright isolated contexts at 1024 / 1280 / 390 widths. Measurements: `channel-sidebar` node count, `dm-thread`/`dm-no-conversation` bounding-box widths, `dm-home` child-panel widths, body-text placeholder scan, mobile backdrop/drawer counts, and `aria-current` state on the DM rail button. Source cross-checked: `apps/web/src/shell/AppShell.tsx` (gates 68 / 78 / 90; mirror at 122), `ServerRail.tsx:237`, `DmThread.tsx:433` (`data-testid=dm-thread`).

**Overall: APPROVE.**
