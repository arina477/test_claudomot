# P-0 ceo-reviewer — wave-80 (M13 leg-3b: privacy toggles)

**Seat:** ceo-reviewer (strategic-value + ambition lens, BOARD seat)
**Wave:** M13 leg-3b — read-receipt + presence privacy toggles in settings (single task)
**Verdict:** **SELECTIVE-EXPANSION** — descope `sendReadReceipts`; ship `showPresence` only. Do NOT build read-receipts; do NOT ship a no-op toggle.

---

## Verdict

**SELECTIVE-EXPANSION (net = descope to one honest toggle).**

Ship `showPresence` — it gates a real, fully-implemented presence subsystem and is an honest, complete privacy win. **Cut `sendReadReceipts` entirely** — it gates a feature StudyHall does not have. Do NOT build message read-receipts as part of this leg (option c), and do NOT ship the toggle as a live no-op (option b). This is my recommended disposition: **descope**, not expand.

## Reasoning (one paragraph)

The wave's premise is half-broken and the codebase makes the fix obvious. Verified: StudyHall has a mature presence service (`apps/api/src/presence/presence.service.ts` + `presence.gateway.ts`, Socket.IO online/offline broadcast to server rooms), so `showPresence` gates something real and shipping it is an honest parity win worth doing now — privacy toggles are cheap moat/parity table-stakes that reuse the existing `privacy.service.ts` + audit-log + `SettingsPrivacyPage` substrate, and this is the last authored M13 leg so shipping it moves M13 to founder disposition, which is high strategic value for near-zero cost. But `sendReadReceipts` gates a feature that does not exist: `read_at` lives on the notifications table, not messages, and there is no sender-visible "seen" state anywhere (`packages/shared/src/messaging.ts` MessageResponse has no readBy/seenBy). Option (b) — ship it as a no-op preference — is dishonest and, decisively, violates StudyHall's OWN established convention: `who_can_dm` already ships DISABLED with a "Beta Feature" label and `pointerEvents: none` precisely because its enforcement surface doesn't exist yet, so the project has already ruled that unenforced toggles do not ship as live controls. Option (c) — build read-receipts — is a meaningful new subsystem (sender-visible per-message seen state: new columns, emit-path plumbing, realtime fan-out, UI) that is far too ambitious for a settings-toggle leg, is Discord-parity rather than the offline-first/displace-Discord activation wedge, and would balloon a single-task leg into a multi-wave feature build with no evidence it drives the H1 wedge. Right-sized ambition is one honest toggle now, not two toggles where one is fake and not a whole new messaging subsystem grafted onto a settings wave.

## Ambition check

- **Too thin?** No. `showPresence`-only is not thin — it's the correct honest scope. It completes real privacy parity (presence hiding is exactly what Discord/Telegram's "last-seen" toggle does), moves M13 to disposition, and reuses existing substrate. A one-honest-toggle leg that closes the last authored leg of a milestone is a legitimate, valuable wave, not filler.
- **Too ambitious?** Building read-receipts (option c) would be. Sender-visible seen-state is a standalone subsystem, not a settings toggle. It belongs — if ever — in its own future milestone/bundle, justified by the displace-Discord bet with real demand evidence, NOT smuggled into a privacy-settings leg.

## Fence check (founder-reserved M13 scope)

Clean. `showPresence` is a settings/privacy toggle over an existing service — it does not touch B2B2C, the M13 success metric, or identity verification. Descoping read-receipts pulls scope AWAY from any fence, not toward one. No founder-reserved territory is entered.

## Recommended disposition (for P-1/P-2)

1. **Descope `sendReadReceipts`** from this wave. Remove the backing column, the (nonexistent) emit-path honoring, and the toggle.
2. **Ship `showPresence` only** — one boolean on the privacy settings, honored in the presence emit paths (gate `presence:online`/`presence:offline` broadcast and the `presence:snapshot` for users who opt out), one toggle on `SettingsPrivacyPage`.
3. **Record the read-receipts deferral** in product-decisions with the reason: no sender-visible seen-state subsystem exists; a toggle can't gate a nonexistent feature; building it is out-of-scope for a settings leg and Discord-parity rather than wedge. Flag it as a candidate for a future standalone bundle IF the displace-Discord bet surfaces real demand.
4. **M13 disposition:** after `showPresence` ships, this being the last authored M13 leg, M13 reaches its founder-disposition point (B2B2C / success-metric / identity-verification reserved scope remains). Surface that to N-1/founder per the milestone lifecycle — do not auto-close.

## Note for the BOARD / other P-0 reviewers

The `who_can_dm` "Beta Feature" disabled-toggle precedent is load-bearing for this verdict: StudyHall has ALREADY decided, in shipped code, that a persisted-but-unenforced preference does not ship as a live control. Shipping `sendReadReceipts` as a working-looking toggle would directly contradict that precedent and the honesty bar it encodes.
