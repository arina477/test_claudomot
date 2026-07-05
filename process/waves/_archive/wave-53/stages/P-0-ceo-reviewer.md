# P-0 ceo-reviewer verdict — wave-53 (StudyHall, automatic mode)

```yaml
verdict: SELECTIVE-EXPANSION
verdict_source: ceo-reviewer
mode_applied: SELECTIVE-EXPANSION
mode_rationale: |
  Not HOLD-SCOPE: fixing ONLY the study-room leak ships a 3/10 — the seed itself
  names this as an APP-WIDE error-handling class (same as wave-23's non-UUID
  serverId → 500), so a study-room-only patch leaves the identical bug live on
  every other controller/gateway that casts a client id to a uuid column, and
  guarantees this exact finding recurs at the next T-8. Not SCOPE-REDUCTION/DROP:
  this is a real, penetration-tester-verified privacy leak (query text + table/
  column names + echoed userId), and privacy posture is a NAMED differentiator in
  the live bet ("Discord ... weak privacy posture") — so it is worth doing, not a
  bug-that-doesn't-matter. Not SCOPE-EXPANSION: the milestone is correct as-is and
  needs no wider ambition; the leverage is one cheap addition, not a bigger wave.
  The single cheap-but-disproportionate move: implement the fix as the SHARED
  parse-layer guard (UUID-format validation + generic-error mapping with
  server-side detail logging) applied app-wide, NOT as a study-room-local catch
  rewrite. Same author, same PR, ~same cost; removes the whole bug CLASS instead of
  one instance. That is the definition of SELECTIVE-EXPANSION.
bet_traced_to: "Academic tools + offline-first win students from Discord (ad1a3685) — privacy-posture leg: the bet explicitly contrasts StudyHall against Discord's weak privacy; a raw-DB-error info-disclosure undercuts the privacy-differentiation claim."
milestone_traced_to: "84e17739-af5e-4396-beb9-b6f3d6836fc4 — M8 Educator tools & deeper academics (in_progress; headline shipped, draining hardening stragglers is the state-machine-mandated path to M9)."
proposed_scope_change: |
  Hold the wave to this one seed (do NOT expand to a multi-item hardening bundle),
  but implement the fix at the SHARED / app-wide parse layer rather than as a
  study-room-gateway-local catch. Concretely, prefer:
    (1) a reusable UUID-format guard at the payload/param parse boundary
        (DTO/pipe/decorator level) so malformed ids are rejected with a generic
        client message BEFORE any Drizzle uuid cast, applied across the
        controllers + gateways that share this pattern (the wave-23 class), AND/OR
    (2) a generic unknown-error → safe-client-message mapper that logs full detail
        server-side and never forwards raw Drizzle errors to any client.
  Acceptance should assert the CLASS is closed (a representative non-study-room
  endpoint no longer leaks), not just the study-room instance — otherwise the same
  finding re-lands at the next T-8 and the "app-wide" framing was theater.
  Guardrail against over-build: this is a LOW-severity item — do NOT gold-plate
  into a full input-validation framework, custom error taxonomy, or per-endpoint
  bespoke messages. One shared guard + one generic mapper. If closing the class
  cleanly turns out to require touching many call sites (>1 PR of real work),
  down-scope to (a) the study-room fix now + (b) a follow-up task seeding the
  app-wide sweep — ship the leak-close this wave regardless.
drop_rationale: |
  n/a
escalation_reason: |
  n/a
sibling_visible: false
```

## Reasoning (narrative)

**Is draining a LOW straggler the right use of this wave?** Yes. M8 headline is
shipped and `in_progress`; the milestone state machine will not promote M9
(Monetization) until M8's open tasks drain, and the BOARD has rejected M9-M13
horizon-jumps four times (waves 44/46/48/49) as front-running founder-reserved
calls. So draining IS the forward path — this is not avoidance. Among the 8 open
M8 stragglers, a penetration-tester-verified privacy leak is a defensible FIRST
drain: it is the only item touching the bet's privacy-differentiation leg, and
N-1's security-first ordering is sound.

**Ambition calibration.** The seed as literally scoped (fix the study-room leak)
is a 3/10 — it patches one instance of a bug the seed itself identifies as an
app-wide class (wave-23 lineage). The reusable-guard option named in the seed is
an 8/10 at essentially the same cost: it removes the entire class and stops the
recurring T-8 finding. That is a cheap-but-disproportionate single addition →
SELECTIVE-EXPANSION. The opposite risk (over-building a validation framework for
a LOW item) is explicitly fenced in the guardrail above.

**Strategic risk to the bets.** None. This hardens the substrate the offline-first
/ academic-wedge features already run on and shores up the privacy-posture claim.
It is not a distraction from the wedge — it is a small deposit into it. No
timeline claim made (out of scope).
```
