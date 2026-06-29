verdict: PROCEED
verdict_source: ceo-reviewer
mode_applied: HOLD-SCOPE
mode_rationale: |
  This wave is the multi-user unlock that makes M2's success metric reachable — a study
  server is worthless single-user, and "organizer invites cohort via link → members join →
  see channels" is exactly what these 4 tasks deliver. The proposed scope is neither timid
  nor grandiose: it ships the whole metric-critical join path (invite backend + join API +
  join page + share UI) and nothing more. Not SCOPE-EXPANSION — the obvious "more" (RBAC,
  kick/ban, server-settings) is a genuinely separate sizable bundle, not a cheap add, and
  pulling it in now would delay the multi-user unlock for marginal metric gain. Not
  SELECTIVE-EXPANSION — no single cheap-but-disproportionate addition clears the bar; the
  next-highest-value thing (role-gated channel visibility) is a real bundle, not a cherry.
  Not SCOPE-REDUCTION — the two-tier invite is a pre-locked architecture primitive (v6b
  cross-domain decision 4) with modest marginal cost over the join+UI work that dominates
  the wave; stripping the ad-hoc table would save little and force a later add-the-table
  migration onto a surface we are already touching.
bet_traced_to: Academic tools + offline-first win students from Discord
milestone_traced_to: 41e61975-c92e-49b1-9ae5-45498dd04925 — M2 — Servers, channels & membership
proposed_scope_change: |
  none — hold scope as proposed.
drop_rationale: |
  n/a
escalation_reason: |
  n/a
sibling_visible: false

# Reasoning (non-schema notes for head-product merge)

## Strategic value — strong yes; correct next slice vs messaging-first
- Bet North Star = "weekly active students in study servers — remote learners gathering to
  collaborate." That requires multiple students in a server. Invites/join is the only path
  to multi-user, so it gates everything downstream.
- Sequencing vs M3 (messaging): messaging is meaningless single-user — you would be chatting
  with yourself. Multi-user MUST precede messaging for messaging to be worth building.
  Invites-first is the correct order; building M3 before M2's join path would ship a polished
  feature nobody could use. Confirmed: this is the highest-value next slice.
- Traces cleanly: wave-7 shipped create-server/channels (the container); this wave makes the
  container multi-user; M3 then makes it conversational. Clean dependency chain to the metric.

## Ambition / sizing — right-sized
- Two-tier invite (permanent servers.invite_code + ad-hoc expiring/limited invites table):
  NOT gold-plating. It is the standard invite primitive (Discord/Slack both do permanent +
  ad-hoc), it was locked at architecture time (v6b decision 4), and the marginal LOC over a
  permanent-only design is small relative to the join API + 2 UI surfaces that dominate the
  ~2800 LOC. Permanent-only would meet the bare metric but loses revocability (leaked-link
  recovery without rotating everyone's link) and would force a follow-up migration to add the
  table during M2-harden or M7 polish — more churn than building it now on a surface already
  open. Keep both.
- Scope discipline is good: RBAC (role-gated channel visibility), kick/ban, and full
  server-settings are explicitly deferred to a later M2 bundle (task 54407e1d states this
  outright; the share UI is "deliberately minimal"). Correct deferral — those are a separate
  coherent bundle, not MVP-blocking for the join unlock.

## One observation for head-product (not a blocker)
- The milestone success metric's "...and see the RIGHT channels PER ROLE" clause is only
  partially closed by this wave: join → membership → channel visibility lands, but role-gated
  visibility (RBAC) is the deferred bundle. The core "members join and see channels" is
  delivered; the "per role" qualifier completes when the RBAC bundle ships. This is correct
  sequencing, not a scope gap — flagging so the metric is not prematurely marked fully closed
  at this wave's L/N.
