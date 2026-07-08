# P-0 MVP-Thinner — wave-80 (M13 leg-3b, task 3038a4bc)

**Reviewer:** mvp-thinner (AC-level thinness lens)
**Scope condition met:** active milestone M13 `## Class` = `product-feature` → this reviewer fires.
**Wave under review:** extend privacy settings with `sendReadReceipts` + `showPresence` boolean toggles + backing columns + honor-in-emit-paths + 2 toggles on SettingsPrivacyPage.

## Verdict: THIN — split `sendReadReceipts` out; ship `showPresence` only.

Not OVER-CUT. `showPresence`-alone gates a live feature, is honest, and stands as a complete AC. Not OK, because the wave as proposed bundles one honest AC with one AC that cannot be honestly built without a whole prerequisite feature. The split is **structural and metric-independent** — it does not rest on M13's founder-reserved (_TBD_) metric.

---

## Structural findings (codebase-confirmed, not asserted)

1. **No message read-receipt feature exists.** Grep across `apps/api/src`, `packages/shared/src`, `apps/web/src` for `read_at | seen_by | readReceipt | read_receipt` (notification hits excluded) returns nothing on messages/DMs. `apps/api/src/db/schema/messages.ts` and `dm.ts` have no read/seen/delivered marker column. `read_at` exists ONLY on `notifications` (notification-read, not message "seen-by"), confirming the prompt's scope-hole. → **`sendReadReceipts` would gate a feature that does not exist.**

2. **Presence is real and live.** `apps/api/src/presence/presence.service.ts` maintains online/offline ref-counting; `presence.gateway.ts` emits `presence:snapshot` (per-co-member `status: online|offline`, gateway line ~160) + `presence:online` / `presence:offline` fan-out to `presence:server:<serverId>` rooms. → **`showPresence` has a concrete, existing emit path to honor.** It is a small honest shippable slice.

3. **The target page already encodes the honest-vs-dishonest precedent.** `apps/web/src/pages/SettingsPrivacyPage.tsx` renders `whoCanDm` as a **disabled "Beta Feature" affordance** (Panel 2, opacity 0.65, `pointerEvents:'none'`), with a BOARD-binding comment: *"NOT an active control … there is no DM enforcement surface today … must not look like a working toggle."* `sendReadReceipts` is the **identical situation** — a preference for a surface that does not yet exist. The established, BOARD-blessed pattern for that situation on this exact page is a disabled affordance, NOT an active toggle.

---

## Option assessment (prompt's a / b / c)

- **(b) ship `sendReadReceipts` as an active no-op toggle → REJECT.** Dishonest privacy-theater: an interactive control that changes nothing. Directly violates the page's own binding constraint (a toggle gating a nonexistent surface must not look interactive). This is the worst option — a privacy control that lies is worse than an absent one.
- **(c) build read-receipts first → REJECT for this wave.** Read-receipts = new message-schema column + write-on-view path + emit path + client rendering + the privacy gate. That is a milestone-scale expansion, not an AC of a privacy-toggle wave. Bundling it here is scope bloat and inverts the dependency (you'd build a whole feature to justify one toggle).
- **(a) descope `sendReadReceipts`, ship `showPresence` only → ADOPT.** Honest, complete, gates a live path.

## Concrete AC-level split proposal

**STAYS in wave-80 (task 3038a4bc, retitle to presence-only):**
- AC: add `show_presence` boolean column (default `true`) on `users` + expose in `PrivacySettingsResponse` / `UpdatePrivacyInput`.
- AC: honor `show_presence=false` in the presence emit paths — when a user opts out, they are reported `offline` (or omitted) in `presence:snapshot` to co-members AND no `presence:online`/`presence:offline` broadcast is fanned out for them. (Exact "appear offline vs. omit" semantics is a P-2 spec detail.)
- AC: one working toggle on SettingsPrivacyPage ("Show when you're online"), auto-save pattern mirroring the existing visibility radio.

**DEFERS to a future M13/backlog sibling (seed below):**
- Read-receipts feature (message seen-by column + write-on-view + emit + client) — the prerequisite.
- `send_read_receipts` privacy toggle — layered on top, only after the feature lands.
- **Interim honesty option (P-2/BOARD call, NOT this reviewer's to force):** if the founder wants the toggle *visible* now for roadmap signaling, render it as a **disabled "Beta Feature" affordance** exactly like the existing `whoCanDm` panel — persisted-but-inert, clearly non-interactive. Do NOT ship it as an active toggle.

**Sibling seed (for P-1 / milestone-decomposer, `parent_task_id` under M13, `wave_id=NULL`, `status=todo`):**
> Read-receipts feature + `send_read_receipts` privacy toggle. Prereq: message "seen-by" marker (schema column + write-on-view path + co-member emit). Then gate emission on `send_read_receipts` and surface an active toggle on SettingsPrivacyPage. Blocked-until: read-receipt feature exists. Do not seed as a no-op toggle.

---

## Flags for P-1 (out of thinness scope, but load-bearing)

- **Floor risk.** `showPresence`-only is likely ~300–500 LOC — below the single-spec floor (>1,500 LOC). This may trip **RESCOPE-AUTO-MERGE** (expand the current M13 bundle with an adjacent sibling to clear the floor) or need a **rule-5 waiver**. P-1 owns that call. **Thinness ≠ floor:** `showPresence` is still the honest mvp-critical slice regardless of LOC; the floor is a separate packaging concern, not a reason to re-admit the dishonest `sendReadReceipts` toggle to pad the wave.
- **Metric abstention noted.** M13 metric is founder-reserved _TBD_, so I cannot rank the two toggles by measured criticality. I do not need to: the split rests on the **structural fact** that read-receipts don't exist, which is metric-independent. On measured mvp-criticality alone I would ABSTAIN to OK; the structural scope-hole is what makes this THIN.
