# BOARD decision — descope-who-can-dm-w35

**Convened:** wave-35 P-0 (automatic mode) · **Threshold:** 4+/7 (standard scope call) · **Escalation source:** problem-framer P-0 ESCALATE (spec contradiction #10) vs ceo-reviewer PROCEED.

## Question
M7's success metric requires students control "profile visibility AND who can DM them," and the seed task requires who-can-DM **enforced**. But StudyHall has **no DM feature** — messaging is channel-only; Direct messages are feature #21, **H2-deferred** (`feature-list.md:43`). who-can-DM gates a non-existent enforcement target. Profile-visibility has a real target (`GET /servers/:id/members`, `GET /profile`).

- **Path A** — descope + forward-persist: enforce profile-visibility now; capture who-can-DM as a persisted, honestly-labeled preference, enforced when DMs ship; amend M7 metric.
- **Path B** — pull DMs (feature #21) into M7: build the DM subsystem now. Milestone expansion, multi-wave, contradicts H2 deferral.

## Votes (7/7)
| Seat | Vote | Note |
|---|---|---|
| strategist | APPROVE A | Holds the privacy wedge; B is a premature H2 horizon-jump. Log the amendment. |
| industry-expert | APPROVE A | Convergent industry sequencing: controls ship *with* the surface they govern. Honest label load-bearing; file who-can-DM AC on feature #21. |
| realist | APPROVE A | Both load-bearing facts verified in code (no DM endpoint; profile-visibility has real targets). B rests on untested "cohort demands DMs." |
| user-advocate | APPROVE A | Conditional: who-can-DM must read unambiguously as not-yet-active, never a live toggle. |
| risk-officer | APPROVE A | Lowest tech-risk. Lock the preference enum (`everyone`/`server-members`/`nobody`) now; B pulls the highest-risk realtime surface into launch-polish. |
| counter-thinker | REJECT (favors A′) | Steel-man: a visible-but-inert toggle on the named privacy wedge = theater. Persist server-side only / drop from shipped UI; @mention control is enforceable today. |
| founder-proxy | APPROVE A | Near-identical founder precedent: wave-22 (`manage_assignments`) + wave-28 (`manage_server`) — ship buildable-now minimal, persist fuller mechanism, record material trigger to flip. |

## Consolidated decision — **Path A adopted (6/7 APPROVE; clean)**, refined by the convergent dissent

The lone REJECT and five of six APPROVE votes agree on the same guardrail, so it is binding on the build:

1. **Profile-visibility: enforced now.** Server-side gate on the member-roster (`GET /servers/:id/members`) + profile-read (`GET /profile`) paths. Full UI + real effect. Negative-path test at B-6 to confirm existing member-list consumers aren't broken (risk-officer).
2. **who-can-DM: persist server-side, do NOT ship an active-looking control.** Create the preference model now with a **fixed enum locked to the future DM guard's contract: `everyone` | `server-members` | `nobody`** (risk-officer; forward-compatible, expand-contract). It is NOT rendered as an interactive toggle that silently no-ops (the privacy-theater failure mode — counter-thinker + user-advocate + industry-expert). If surfaced in UI at all, it is an unambiguous "takes effect when direct messages arrive" disabled affordance; default is to omit the interactive control. P-2 decides exact UI treatment against the binding AC: **no control that appears active but enforces nothing.**
3. **Amend M7's success metric** to match the roadmap (metric referenced a verified-nonexistent feature — this is spec-correction, not bet-retirement). Surface as a founder-visible line in the board digest + product-decisions (counter-thinker: it touches the named privacy wedge).
4. **File who-can-DM enforcement as an explicit acceptance criterion on feature #21** (Direct messages) so the deferred dependency is tracked, not dropped (industry-expert + founder-proxy material-trigger pattern).
5. Carry-forward build note (from ceo-reviewer + problem-framer, not a vote item): Sentry must scrub PII (`beforeSend`, `sendDefaultPii=false`) — a privacy-first product must not exfiltrate student data via error payloads.

**Dissent recorded:** counter-thinker's A′ (clean-drop, no forward-persist) is preserved in the record; the adopted form neutralizes its core objection by making the persisted preference server-side-only + non-theatrical, while keeping risk-officer's forward-compat enum. @mention-based contact control noted as a future enforceable-today option, out of scope for this bundle.
