```yaml
verdict: PROCEED
verdict_source: ceo-reviewer
mode_applied: HOLD-SCOPE
mode_rationale: |
  This is a genuine, deterministic UX-correctness bug on a shipped LIVE surface (DM→server
  navigation needs a double-click because dmHomeActive is never cleared) — not a real-but-
  trivial bug to DROP, and not grandiose to REDUCE. It does not warrant SCOPE-EXPANSION:
  it is the residual tail of an M8 whose high-leverage slices (privacy-fence wave-55, scale-cap
  wave-56) already shipped, so there is no live bet justifying dragging a larger nav-state
  refactor into it — the disproportionate value in the roadmap now lives in the M9-Monetization
  decision, which is founder-reserved and out of this wave's authority. It does not warrant
  SELECTIVE-EXPANSION: no single cheap addition among the remaining M8 cosmetics (test debt,
  token polish, throttle) is disproportionate enough to bolt onto a papercut fix, and bundling
  them would inflate a clean one-cause fix into a grab-bag. Scope is exactly right; the bar is
  execution quality on the state-clear fix.
bet_traced_to: "Academic tools + offline-first win students from Discord"
milestone_traced_to: "84e17739-af5e-4396-beb9-b6f3d6836fc4 — M8 — Educator tools & deeper academics"
proposed_scope_change: |
  None. HOLD-SCOPE — minimal targeted fix only: clear dmHomeActive on server/Home selection
  from the DM surface so the first click navigates. Do NOT open a broader nav-state-management
  cleanup; that is not justified by any live bet and would over-scope a papercut. If P-3 finds
  the same stale-active-flag class recurs across other rail affordances, capture those as tracked
  follow-ups rather than expanding this wave.
escalation_reason: |
  None. The genuinely high-value pending item — the M9-Monetization go-decision (freemium tiers,
  next todo milestone) — is already STRONGLY flagged to the founder and is founder-reserved.
  No new P-0 escalation is warranted; this papercut fix is orthogonal to that decision and does
  not need to wait on it. Confirmed: M9 is the correct next strategic horizon and remains the
  disproportionate-value call, unblocked by shipping this M8-tail fix.
sibling_visible: false
```

## Weigh (rationale detail)

1. **Worth a wave vs. other M8 cosmetics?** Yes. Among the remaining M8 tail (test debt,
   token polish, throttle), this is the single genuine UX-*correctness* defect — a deterministic
   double-click required on a high-frequency navigation (DM→server/Home) on an already-LIVE
   surface. Test/token/throttle items are quality-of-implementation debt, not user-visible
   broken behavior. Draining the one honest bug from the tail before pivoting to M9 is the
   right disposition and consistent with the founder's documented "fold follow-ups in, keep
   momentum" stance. This is a `fix-value > fix-cost` item (few LOC, real papercut), not the
   "real bug that doesn't matter" trap.

2. **Ambition level:** minimal targeted state-clear fix — correct for a papercut. A larger
   nav-state-management refactor would be gold-plating with no live-bet backing; explicitly
   NOT recommended. HOLD-SCOPE.

3. **Strategic:** Fine to ship (real bug, traces cleanly to M8 + the live displace-Discord
   bet via shipped-surface polish/retention). The M9-Monetization decision remains the
   genuinely high-value pending item and is already founder-flagged — no new escalation from
   P-0. This wave does not compete with or block that decision.
