verdict: PROCEED
verdict_source: ceo-reviewer
mode_applied: HOLD-SCOPE
mode_rationale: |
  The scope question for wave-9 was already adjudicated by the BOARD at wave-8 close
  (slug N-1-seed-priority-wave-9, 5 APPROVE / 1 ABSTAIN / 1 REJECT) — this is a
  completion-before-expansion bundle, not a fresh framing. Not SCOPE-EXPANSION: the
  one expansion the bet would justify (RBAC, the unmet "see the right channels per
  role" clause) is correctly bound to wave-10 by four BOARD dissents; pulling it
  forward now would bloat a completion wave. Not SCOPE-REDUCTION / DROP: all three
  tasks are real — revoke is a genuine leaked-link control gap (Discord/Slack
  prior-art table-stakes), and 8a/8b are shipped-but-incomplete drift from wave-8,
  not speculative polish. Not SELECTIVE-EXPANSION: no cheap-but-disproportionate
  single addition clears the bar above what's already bundled. Scope is exactly
  right; the bar here is execution rigor on the BOARD's binding conditions.
bet_traced_to: "Academic tools + offline-first win students from Discord"
milestone_traced_to: "41e61975-c92e-49b1-9ae5-45498dd04925 — M2 Servers, channels & membership (in_progress)"
proposed_scope_change: |
  None. Scope held at the 3-task BOARD bundle:
    - seed 863c10ef (invite-revoke endpoint + UI)
    - sibling 08ff762f (8a: backfill servers.invite_code)
    - sibling 5331b7d5 (8b: share modal defaults to permanent code)
drop_rationale: ""
escalation_reason: ""
sibling_visible: false

# Reasoning (concise)

## Strategic value — worth a wave NOW vs jumping to RBAC?
Yes. The live invites/join slice (wave-8) is the customer-facing acquisition surface
for the displace-Discord bet: an organizer shares a link, members join. Shipping it
WITHOUT revoke leaves a real security/management gap (a leaked link cannot be killed)
and WITHOUT 8a backfill leaves every pre-wave-8 server unshareable. These are not
"low-value polish that should yield to RBAC" — they are the difference between a
demo-grade and a production-grade invite lifecycle on a surface that is already LIVE
to users. Finishing a live slice to production grade before opening a new capability
is the correct sequencing, and it matches the founder's documented disposition
(wave-4 ruling: "fold follow-ups in around the core work, keep momentum").

## Ambition / sizing — right-sized?
Right-sized. Three small completion tasks: one new endpoint+UI, two drift fixes.
Not gold-plated (no invite analytics, no per-invite expiry UI, no audit log — none
proposed, correctly). Not too thin: revoke alone is a legitimate wave; the two drift
fixes are the natural companions (same invite subsystem, same files, drained in one
pass). A wave is justified.

## RBAC deferral to wave-10
Correctly deferred and BOARD-bound. M2's success-metric clause "see the right
channels per role" is unmet, so RBAC is the highest-value M2 expansion — but four
BOARD seats (strategist/industry-expert/counter-thinker/realist) bound it to wave-10
as the unconditional next seed. Pulling it into wave-9 would convert a clean
completion wave into a mixed completion+expansion wave with a much larger blast
radius (role model + channel_permission_overrides + owner-lockout safeguard). Hold.

## Execution conditions to carry forward (BOARD dissents — already on checklist, not my authority to alter)
- 08ff762f backfill: idempotent + collision-safe vs UNIQUE(servers.invite_code),
  CSPRNG codes, committed migration (not auto-migrate-on-boot), re-runnable.
- 863c10ef revoke: honest "this link no longer works" + request-re-invite path for a
  member hitting a revoked link; re-derive identity/authorization server-side, never
  from client-supplied invite/server id.
- RBAC is wave-10's seed, unconditionally.
