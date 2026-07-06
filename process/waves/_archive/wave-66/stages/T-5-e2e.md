# Wave 66 — T-5 e2e (layout/edge coverage)

**Layer:** T-5 (e2e / edge-of-render for a presentation-only copy change)
**Judge:** head-tester
**Task:** 6018bdee — Offline empty-state copy polish: neutral wording for a never-synced server's channel sidebar
**Change under test:** `ChannelSidebar.tsx` `detailStatus==='error'` branch split by `useConnectionState` (offline/reconnecting → neutral copy; online → existing error copy).

## Disposition: UNIT-COVERED (option b) — live Playwright probe declined as disproportionate

I judge the three deterministic unit cases in `apps/web/src/shell/shell-components.test.tsx` sufficient T-5 coverage for this change, and decline a live prod Playwright confirm.

### Reasoning
- **The behavior is a copy string gated on a single, already-shipped hook** (`useConnectionState`). There is exactly one `detailStatus === 'error'` render branch (grep-confirmed), and no markup/layout delta (same `<div>`/`<p>` structure, only the text expression changed to a ternary). No new component, no new state.
- **The gate is unit-verified at the branch level.** A live probe would exercise the SAME shipped `ChannelSidebar` render through the SAME `useConnectionState` gate the unit tests already drive per-state. Marginal coverage over the unit suite is near-zero.
- **A live probe is high-effort / low-value here:** it requires orchestrating a genuine offline connection state on deployed prod against a server whose detail was NEVER cached — an artificial condition to reach the exact edge, with real risk of flake (connection-state timing, cache-warmth assumptions). Reaching for it would be scope-creep into a flaky live surface for a cosmetic copy change — the wrong proportion.

### Unit coverage judged sufficient (mutation-sane, deterministic, isolated)
Three cases, each mocking `useConnectionState` to the state under test:

| Case | Mock state | Asserts present | Asserts ABSENT (mutual exclusion) |
|---|---|---|---|
| offline | `'offline'` | `/this server isn't available offline yet/i` | `/couldn't load channels/i` |
| reconnecting | `'reconnecting'` | `/this server isn't available offline yet/i` | `/couldn't load channels/i` |
| online | `'online'` | `/couldn't load channels/i` | `/this server isn't available offline yet/i` |

- **Mutation-sanity:** a plausible real bug — dropping the ternary, inverting the condition, or forgetting the `reconnecting` case — makes at least one case fail. Not delete-only-fails.
- **Isolation:** `beforeEach` resets the mock to `'offline'`; each case explicitly `mockReturnValue`s its state. No order dependency, no fixture leak.
- **User-observable:** asserts rendered copy via role/text query, not mock call counts.

### CI evidence
PR #81 — all 7 required checks pass (`test` job green = web 565/565, includes these 3 cases): boot-probe, build, e2e, lint, secret-scan, test, typecheck. Merge d094f9c deployed (web SUCCESS + HTTP 200).

## Verdict
T-5 **PASS** — unit-covered; live probe declined as disproportionate for a presentation-only copy change with no layout delta.

```yaml
t5_disposition: unit-covered
live_probe_run: false
live_probe_declined_reason: "presentation-only copy gated on already-shipped useConnectionState; single error render branch, no layout/markup delta; 3 deterministic unit cases verify the gate per-state with mutual-exclusion; live probe = near-zero marginal coverage, high flake risk"
unit_cases: 3
mutation_sane: true
fixture_isolated: true
ci_green: true   # PR #81, 7/7 required checks, web 565/565
verdict: PASS
```
