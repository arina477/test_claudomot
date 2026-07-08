# D-3 Adopt — e2e-indicator

## Canonicalization
- `git mv design/staging/e2e-indicator.html design/e2e-indicator.html` (Action 6).
- Canonical path: `design/e2e-indicator.html` (31,494 bytes).

## Reviewer verdicts (final)
- **Reviewer A** (`ui-designer`, sub for `/plan-design-review`): attempt 3 → REVISE, but all six change requests independently verified STALE (already fixed in iteration 2) or B-3-handoff — a reviewer false-negative, caught by the Phase-2 head-designer gate.
- **Reviewer B** (`ui-ux-tester`, sub for `/ui-ux-pro-max`): attempt 3 → APPROVE (all 10 brief §9 success criteria PASS; fail-closed PASS).
- **Accessibility** (`accessibility-tester`): PASS (its one 32px touch-target finding was against a stale file; current file is 44px throughout).
- **Phase-2 gate** (`head-designer`, fresh spawn): **APPROVED** attempt 1 — independently grep-verified fail-closed + A's stale CRs + token discipline. Verdict at `../../blocks/D/gate-verdict.md`.

## Fail-closed states rendered (the ship-blocker)
1. Encrypted — emerald `ph-fill ph-shield-check` (the ONLY lock/shield; grep-verified 5 occurrences, all encrypted-only, incl. the `simulateKeygen` setTimeout resolve branch).
2. Not-encrypted (plaintext fallback) — grey `ph-lock-open`, `--text-secondary`, "Not encrypted". No lock, no red.
3. Not-encrypted (group DM) — grey `ph-shield-slash`, honest not-encrypted.
4. Cannot-decrypt-on-this-device — `ph-key`, `--text-secondary` label + de-emphasized undecryptable-payload shell. Calm.
5. Loading / establishing — `ph-circle-notch`, NEVER a lock; resolves to encrypted only on proof.
6. Hover/focus tooltip — plain-language copy per state.
Plus: key-fetch-error alias row (fails closed → renders as Not encrypted). Two placements: per-conversation header badge + per-message micro-affordance.

## Action 7 — user-journey-map (SKIPPED)
The E2E indicator is a new UI element inside the EXISTING direct-message route (page-9, `direct-messages`), not a new route / screen / endpoint. Per D-3 Action 7's conditional (no new routes/screens → skip + record), no journey-map entry added.

## Action 8 — DESIGN-SYSTEM.md token additions (NONE)
Design consumes only existing tokens; `#34d399` (emerald-400) was NOT adopted (token-safe path taken — encrypted label uses `--text-primary`, status labels use `--text-secondary`). Head-designer verdict explicitly blessed NO addition. `design_system_tokens_added: []`.

## B-3 implementation handoff notes (carried from reconciliation + reviewers — NOT mockup defects)
- Encrypted badge must render on a `--surface-900` context (emerald icon on emerald/10 tint ≈ 4.55:1 PASS there); if forced onto `--surface-800`, bump tint to 15%.
- Cannot-decrypt + loading STATUS LABELS use `--text-secondary` (brief §4 corrected S2); `--text-muted` only on the undecryptable-payload mono shell.
- Tooltip body 12px per DESIGN-SYSTEM §8 (brief §4 corrected S1).
- Per-message affordance icons: raise `text-[14px]` → `text-base` (16px, DS §7 floor) in the component.
- `shadow-pop` Tailwind class → `box-shadow: var(--shadow-pop)` in the component stylesheet (mockup is CDN-Tailwind, no config).
- Resolve the payload-shell `text-sm text-[11px]` double-size to a single size.
- Component MUST default to loading/indeterminate on mount, never encrypted (fail-closed default).

```yaml
adoption_complete: true
canonical_path: design/e2e-indicator.html
design_system_tokens_added: []
journey_map_updated: false
```
