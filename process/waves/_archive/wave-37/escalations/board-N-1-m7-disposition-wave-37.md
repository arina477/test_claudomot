# BOARD — N-1-m7-disposition-wave-37

**Mode:** automatic
**Convened by:** orchestrator (N-1 trigger phase), wave-37 N-block
**Decision class:** milestone-disposition on the LAST H1 / MVP-completing milestone (M7) — Tier-3 strategic (6+/7 strict bar applies)
**Date:** 2026-07-02

## Question

M7 (6e2f68d8) "Privacy controls, notifications & launch polish" — the last H1 / MVP-completing milestone — has open_count=2, done_count=10, seed_candidates=0. Both open rows are `status='blocked'` credential-blocked founder-ops (a1299e88 Resend domain; 84e09891 Railway bucket creds). Buildable MVP scope is SHIPPED (privacy controls wave-35 enforced; in-app notifications wave-37 LIVE; deploy/canary satisfied). ZERO unblocked buildable tasks under M7. Brain cannot self-generate account-issued creds (rule 6).

Options:
- **(A)** Close M7 as buildable-complete + surface the founder-credential fork (pause for founder direction OR promote next).
- **(B)** Promote M8 (H2) + continue building post-MVP autonomously — horizon-jump past the MVP line.
- **(C)** Hold M7 in_progress + pause for founder — buildable MVP done; next move (creds vs H2-pivot) is a founder decision.

## Votes (7/7)

| Seat | Vote | Hard-stop | Note |
|---|---|---|---|
| strategist | APPROVE A | flagged: B must NOT proceed autonomously (horizon re-sequence past MVP line, no precedent) | present founder BOTH cred asks AND the H1→H2 pivot as an explicit fork |
| industry-expert | APPROVE A | none | build-ahead-of-validation anti-pattern; headline the launch-gate in plain language |
| realist | APPROVE A | none | B rests on unverified demand at 0 users; launching the MVP is the cheapest test of the thesis |
| user-advocate | APPROVE A | none | student MVP loop already whole; the 2 cred asks are cheap unlocks (avatar has default-initials fallback; email-invite is H2) — frame as "make invites/reminders/avatars better," not "launch-blockers" |
| risk-officer | APPROVE A — **HOLD in_progress variant** | none (HOLD carries no irreversible action) | `blocked` is non-terminal (SCHEMA L70) → hard-close violates roadmap-lifecycle Invariant #3 + forces data-loss cancel of founder-wanted rows. HOLD preserves handoff state (rows queryable by milestone_id=M7 AND status='blocked'). **Flips to REJECT if "close" = a `status='done'` flip while blocked rows persist.** |
| counter-thinker | APPROVE A | none | steel-manned B hardest; B fails reference-class (M5/M6 forks both surfaced + founder-chosen) + reversibility (M8 promote = irreversible horizon-jump). Dissent: surface the fork, but do NOT reflexively freeze the loop IF genuine unblocked buildable work exists. |
| founder-proxy | APPROVE A (confidence high) | none | twice-confirmed precedent — M5 Resend (wave-29) + M6 LiveKit (wave-33/34) forks BOTH surfaced as explicit A/B; founder chose provide-and-finish both times. Nothing pre-authorizes auto-crossing H1→H2. |

## Consolidated decision

**APPROVE Option A — 7/7 (passes 4+/7 default AND 6+/7 Tier-3 strict).** Two binding refinements from dissents:

1. **HOLD M7 `in_progress` (risk-officer, binding).** Do NOT flip M7 to `done`. The 2 open rows are `status='blocked'` = non-terminal; a `done` transition would violate roadmap-lifecycle Invariant #3 and force cancelling founder-wanted credential-ops (data-loss / one-way door). Holding `in_progress` preserves both rows in `tasks`, queryable for full handoff-state recovery. → A-shaped disposition, C-safe on the transition.

2. **Measured-pause discipline (counter-thinker, binding).** The pause is legitimate ONLY because no buildable next wave exists under the active milestone without founder input: seed_candidates=0 under M7; promoting/decomposing M8 IS Option B (rejected 7/7 — founder-gated); draining the 12-deep unassigned M-agnostic debt queue under a blocked-headline milestone is the M5-era "debt-drain-while-blocked" failure the log condemns and does not advance the disposition. This is queue-exhausted-under-active-milestone + a founder-reserved decision — NOT an anticipatory "MVP is a natural break" pause. N-3 writes `.loop-paused.yaml` (→ trigger f) with `pause_evidence` citing the file marker.

**Rejected: Option B** (promote M8 / auto-jump H1→H2) — strategist flagged it as must-not-proceed-autonomously; founder-proxy + counter-thinker + realist + industry-expert all confirm no precedent pre-authorizes crossing the MVP line unattended.

## Founder fork to surface (plain-language, rule 16)

Headline: **the buildable MVP is complete and one step from launch-ready.** Two launch-ops need the founder's own credentials to finish:
- Verify a Resend email domain → invites + due-date reminders reach students reliably.
- Add Railway storage credentials → avatar upload works (today it falls back to default initials).

The decision: (1) provide the credentials so we finish + launch the MVP for a real class cohort, OR (2) direct the loop to move ahead to post-MVP educator tools (H2) instead. This mirrors the M5 (Resend) and M6 (LiveKit) forks the founder resolved by providing credentials both times.

**decided by:** BOARD (automatic), unanimous 7/7 APPROVE A. head-next gate: pending N-1/N-2/N-3 sign-off.
