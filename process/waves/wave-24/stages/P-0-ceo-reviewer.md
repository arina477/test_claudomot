# P-0 — ceo-reviewer verdict (wave-24)

```yaml
verdict: SELECTIVE-EXPANSION
verdict_source: ceo-reviewer
mode_applied: SELECTIVE-EXPANSION
mode_rationale: |
  Base scope (presence co-member resolution + servers member-gate real-DB specs) is
  sound and worth doing — NOT SCOPE-EXPANSION (no larger milestone is unlocked by
  going wider on test infra) and NOT SCOPE-REDUCTION (the base is already a tight,
  additive extension of the existing wave-17 pg-harness, not a greenfield tier).
  It is SELECTIVE-EXPANSION rather than HOLD-SCOPE because the seed's own stated
  justification (wave-23 finding F23-T-4) points at a surface the seed does not
  actually cover: F23-T-4 flagged the newly-shipped, LIVE `manage_assignments` /
  rbac-assignments authz surface (w23) as having no real-DB integration test, while
  the seed covers the older wave-14-era presence + member-gate surfaces. One cheap,
  disproportionate addition — a real-PG integration spec for the rbac/assignments
  authz door — makes the wave close the gap it cites instead of adjacent old debt.
bet_traced_to: "Academic tools + offline-first win students from Discord"
milestone_traced_to: "a5232e16-62d5-4a7b-8fdb-3f7ceda9d09d — M5 — Academic tooling: assignments"
proposed_scope_change: |
  Keep the base (presence co-member resolution + GET /servers/:id/members member-gate).
  ADD exactly ONE spec target: real-PG integration coverage of the wave-23
  delegated-authz surface (manage_assignments split + the /me effective-permissions
  path), the F23-T-4 gap. Rationale it clears the cheap-but-disproportionate bar:
    - Cheap: the pg-harness.ts already exists; this is one more spec file on an
      existing tier, not a harness change. WIP + reviewability stay intact (three
      additive spec targets on one shared harness — still a single reviewable diff).
    - Disproportionate: authz is the one surface where a silent regression is the
      expensive kind — wrong-member data exposure on a permission boundary. That
      surface shipped LIVE + verified in w23 with ZERO real-DB coverage. Covering it
      is regression insurance on the exact door that matters at launch.
  Discipline note: propose ONLY this one addition. Do NOT pile on further surfaces
  (mention parity, presence dots, etc.) — those are separate debt rows, not this wave.
  head-product mediates this against mvp-thinner (who will argue to keep the wave
  thinner); the ceo lens holds that aligning coverage to the cited justification is
  scope-correction, not scope-bloat.
sibling_visible: false
```

## Why not REJECT (test-infra vs a user-visible debt row)

Honest read: at 0 users, integration coverage moves no product metric, and this
wave traces to the live bet only *indirectly* (regression insurance on the
academic-tooling surfaces, not new wedge capability). That is a real cost.

It still clears the bar as the best AUTONOMOUS wave right now because:
1. The M5 headline (reminders: cron + Resend) is CRED-BLOCKED on the founder's
   Resend key — the highest-value M5 work is physically unavailable this wave.
2. The strongest candidate (with the expansion applied) hardens a **security-adjacent
   authz boundary** that shipped LIVE in w23 with no real-DB coverage. Authz
   regressions are precisely the high-consequence, hard-to-detect class where
   build-quality is defensible even pre-launch.
3. User-visible debt rows (c18b8089 mention parity, 10b9d18e presence dots) are
   real but lower-consequence than an untested permission door; they remain claimable
   next and are not lost by doing this now.

## Standing caveat for head-next / N-block

This is a build-quality wave, not a wedge-advancing one. The moment the Resend
credential arrives, M5 reminders should preempt further test-infra debt — do not let
the integration tier become a comfort sink while the mvp-critical M5 remainder waits.
```
