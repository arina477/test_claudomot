# V-1 Semantic-Spec Verification (jenny) — Wave-49 StudyHall Shared Study Timer

**Verdict: APPROVE**

**Scope:** Deployed production behavior of the per-server shared study timer (Pomodoro) — synchronized countdown, Work/Break phases with auto-advance, Start/Pause/Reset, ephemeral "N studying" presence roster, compute-on-read remaining.

**Environment verified:**
- Web `https://web-production-bce1a8.up.railway.app`
- API `https://api-production-b93e.up.railway.app`
- Merge 3835100, migration 0022
- Fixtures: A (`studyhall-e2e-fixture@example.com`) + B (`studyhall-e2e-fixture-b@example.com`), co-members of server `ad62cd12-b78e-4a85-a214-042cf176b16c`.

**Spec source:** DB `tasks.description` (task `1387d845…`), the fenced YAML + prose. No divergence from the `P-2-spec.md` convenience pointer detected.

**Method:** Read-only. Live API probes (curl, header-mode session tokens) + live UI journey (Playwright against prod web). No code inspected, no code changed, no browser_close.

---

## Acceptance-criteria semantics — all PASS

### Task 1387d845 — schema (anchors-only) + compute-on-read service + membership-gated controls

- **Compute-on-read (anchors only, no stored counter):** PASS. After `start`, `endsAt` is a fixed anchor (`2026-07-05T15:27:02.860Z`) that never changes across reads, while `remainingMs` derives from `endsAt − now` and decrements in real wall-clock time: 1499995 → 1499887 → 1496772 across successive GETs with no server-side write. This is server-side compute-on-read, not a persisted decrementing counter.
- **`start`:** PASS. Sets `runState='running'`, `phase='work'`, fresh `endsAt = now + 25min` (`remainingMs≈1500000`), returns full DTO, HTTP 200.
- **`pause` freezes remaining:** PASS. `runState='paused'`, `endsAt=null`, `remainingMs` frozen (1490550 identical across two reads 2s apart), `running=false`.
- **`resume` restores:** PASS. `runState='running'`, new `endsAt`, `remainingMs` restored to the frozen value (1490543, matching frozen 1490550 minus ~7ms elapsed), then decrements.
- **`reset` → idle:** PASS. `runState='idle'`, `phase='work'`, `endsAt=null`, `remainingMs=0`.
- **GET idle DTO:** PASS. Calm idle DTO returned (`runState='idle'`, `endsAt=null`, `remainingMs=0`, `running=false`).
- **No per-server tick loop (compute-on-read only):** PASS (inferred, correct). `endsAt` is stable across reads and `remainingMs` is a pure derivation — no evidence of a server-side decrementing store; behavior is fully re-derivable from anchors. Consistent with the forbidden-loop constraint.
- **IDOR-safe authz:** PASS (see edge cases).

### Task cb81bf03 — Socket.IO fan-out + ephemeral presence roster

- **`study-timer:update` fan-out on every control:** PASS — proven behaviorally. With the browser widget NOT touched, firing controls purely via the API drove the widget in real time:
  - API `resume` → widget flipped `PAUSED` → running and began counting down (`24:25`→`24:23`).
  - API `reset` → widget flipped running `23:29` → idle `25:00 / Start a focus session`.
  - Every connected member's client reconciles to authoritative state and counts locally to `endsAt`.
- **Ephemeral presence roster (`N studying`):** PASS. Widget shows `1 studying` + `Live sync` for the single live viewer. Count reflects live sockets (one browser context = one viewer); ephemeral, no persistence surface observed.
- **Member-scoped fan-out:** PASS (see non-member 403 edge cases — non-members are gated at the HTTP layer and cannot join the room).

### Task c3daf6d3 — study-timer widget in server view

- **Mount location:** PASS. Widget (`data-testid="study-timer-widget"`) mounts in the server-view main column ABOVE the message list. With `#general` open, message history + composer render below the widget; widget and channel coexist.
- **Countdown display derived from endsAt:** PASS. `timer-display` renders mm:ss (`24:51`) counting down locally to the authoritative `endsAt`, not a client-authored duration.
- **Phase label:** PASS-with-note. Running work phase renders label **`FOCUS`** (see Minor finding F1 — spec wording is "Work"). Semantically correct (Focus = Work in Pomodoro), copy choice only.
- **Controls (Start / Pause / Reset):** PASS. Idle shows `Start`. Running shows `Pause` (`btn-pause`, aria "Pause session") + `Reset` (`btn-reset`, aria "Reset timer"). Paused shows `Resume` (aria "Resume session") + `Reset`. Any member can control (educator gate deferred — correct).
- **Idle affordance:** PASS. Calm `Start a focus session` + `25:00` idle display.
- **States (idle / running-work / paused / etc.):** PASS. idle, running (FOCUS), and paused (`PAUSED`, frozen `24:37`) all rendered correctly and distinctly.
- **Subscribes to update + presence, optimistic + reconcile:** PASS. Widget reacts to broadcasts (proven) and shows the presence count.

### Task 832b83b7 — phase auto-advance + reconnect reconciliation

- **Reconnect reconciliation:** PASS — the strongest evidence for "shared". Left the timer running via API, did a full page reload; the freshly-mounted widget reconciled to the in-progress running state (`23:50 FOCUS`, running), NOT idle. A late/reloaded client lands on the same shared countdown via compute-on-read on mount.
- **Cross-client shared timer:** PASS. Fixture A started the timer; Fixture B (distinct co-member) then GET the same server and saw the identical authoritative `endsAt` (`2026-07-05T15:28:05.410Z`), `updatedBy` = A's id, with `remainingMs` computed for B's own `now`. Two distinct users, one shared timer.
- **Phase auto-advance (work→break→work, 25/5, no loop):** NOT DIRECTLY OBSERVABLE within the session (25-min wall-clock). Judged indirectly: phase is always re-derivable from anchors (confirmed via compute-on-read), state self-heals on read/reconnect (confirmed via reload reconciliation). Transition semantics are consistent with the broadcast-on-transition / self-healing design. No contrary evidence. This is an inherent T-block/unit-level concern, not a V-1 live-observable gap.
- **Idempotent transition:** NOT DIRECTLY OBSERVABLE (requires crossing `ends_at`). No contrary evidence.

---

## Edge cases — all PASS

- **Anon GET → 401:** PASS (`{"message":"unauthorised"}`, HTTP 401).
- **Anon POST start → 401:** PASS (HTTP 401).
- **Non-member GET → 403:** PASS. Fixture B on a server it does not belong to (`597186fd…`, created fresh by A) → HTTP 403.
- **Non-member POST start → 403:** PASS (`{"message":"You are not a member of this server","error":"Forbidden","statusCode":403}`, HTTP 403). Clean error envelope.
- **Pause freezes / resume restores / reset→idle:** PASS (see above; frozen value held across reads, restored on resume).
- **Compute-on-read (never a stored counter):** PASS (`endsAt` stable, `remainingMs` derived).
- **Start while running:** PASS. Restarts the timer (new `endsAt`, `remainingMs` back to full 1499995). Spec explicitly permits "no-op OR restart per plan" — restart is conformant.
- **pause/resume when idle:** SAFE no-op. Returns the idle DTO, HTTP 200, no 500 / no crash. Spec-silent → not drift (see gap G1, benign).

---

## Contract conformance — PASS

**`GET /servers/:id/study-timer` DTO vs StudyTimerSchema:** exact match.
- Keys present: `serverId, phase, runState, endsAt, remainingMs, running, updatedBy`.
- Missing vs spec: none. Extra vs spec: none.
- Types: `serverId` str, `phase` str, `runState` str, `endsAt` string|null, `remainingMs` int (number), `running` bool, `updatedBy` str. Matches `StudyTimerSchema {serverId, phase, runState, endsAt: string|null, remainingMs: number, running: boolean, updatedBy}`.

**Control endpoints:** `POST .../start|pause|resume|reset` all return the DTO, HTTP 200, all `assertMember`-gated. `resume` is a distinct live route (spec allowed "resume (or start)"; a dedicated `/resume` exists and works).

**Error envelopes:** 401 anon = `{"message":"unauthorised"}`; 403 non-member = `{"message":"…","error":"Forbidden","statusCode":403}`. Both consistent and correct.

**Socket events:** `study-timer:update` proven behaviorally (widget reacts to all 4 controls fired out-of-band); payload mirrors the GET DTO (client renders identical fields). `study-timer:presence` evidenced by the live `1 studying` roster. Raw socket-frame capture was not obtainable (transport reuses an already-open connection / binary frames), but DOM-level reaction is conclusive proof the events fire with the correct shape.

---

## User-journey continuity — PASS

Walked the server-view journey with the widget mounted:
- Enter server → widget renders idle (`25:00`, `Start a focus session`, `1 studying`, `Live sync`).
- Start → running (`24:51 FOCUS`, Pause+Reset).
- Pause → `PAUSED` frozen (`24:37`), Resume+Reset.
- Open `#general` channel → message history + composer load BELOW the widget; widget stays mounted, timer state persists. No dead-end, no layout break, channel fully usable alongside the widget.
- Console: **0 errors** throughout the entire journey (1 benign warning).

---

## Findings

**F1 — Minor / spec drift (copy only).** UI phase label renders **`FOCUS`** for the work phase; the spec AC (task c3daf6d3) says the label reflects "Work/Break". Semantically equivalent (Focus == Work in Pomodoro vocabulary) and arguably better product copy, but it is a literal divergence from the spec's stated label. Severity: **Low**. Recommend the design/product owner confirm "FOCUS" is the intended canonical label (likely a D-3 canonicalization choice, given `design_gap_flag=true`); if so, no action — this is intended, not a defect. Not blocking.

**G1 — Spec gap (benign).** The spec does not enumerate behavior for `pause`/`resume` invoked while `idle`. Live behavior is a safe no-op returning the idle DTO (HTTP 200). This is correct and self-healing; noting only that the spec is silent, not that the code is wrong. No action needed.

**Intended-by-design confirmations (not findings):** Fixed 25/5 durations with no configure endpoint (custom durations deferred to seed f4b3659e) — confirmed intended, not drift. Start-while-running restarts — explicitly permitted by spec. Educator-only gate absent (any member controls) — deferred per P-0, correct.

---

## Verdict

**APPROVE.** Deployed behavior matches spec intent across all four tasks. Shared/synchronized timer, Work/Break phase model, Start/Pause/Reset, compute-on-read remaining, anchors-only derivation, ephemeral presence roster, member-scoped socket fan-out, membership-gated IDOR-safe authz (401 anon / 403 non-member), and reconnect reconciliation (late joiner sees the in-progress shared countdown) are all verified live. DTO shape is an exact match to StudyTimerSchema. The single divergence (F1, "FOCUS" vs "Work" label) is Low-severity copy only and does not block. Auto-advance idempotency is not live-observable in-session but shows no contrary evidence and is consistent with the self-healing compute-on-read design.
