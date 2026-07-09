```yaml
verdict: SCOPE-REDUCTION
verdict_source: ceo-reviewer
mode_applied: SCOPE-REDUCTION
mode_rationale: |
  The seed's ambitious-looking fork (A: switch to cross-site httpOnly cookies) is the
  3/10-that-looks-like-9/10. Cookie mode on web≠api different Railway origins forces
  SameSite=None cross-SITE cookies, which Safari ITP already blocks and Chrome's
  third-party-cookie deprecation is killing — i.e. option A trades a MEDIUM XSS-readable-token
  surface for an auth-RELIABILITY regression that can silently break login for a real slice
  of users. SuperTokens itself RECOMMENDS header mode precisely for the different-domain
  frontend/backend topology StudyHall runs. The correct 9/10 move is the disciplined one:
  KEEP the architecturally-correct header transport, formally DECIDE + DOCUMENT it as an
  accepted cross-origin posture, and (cheap, high-leverage) tighten the compensating XSS
  controls that actually reduce the readable-token blast radius (CSP, short access-token TTL,
  refresh rotation). That is SCOPE-REDUCTION, not the other three modes: this is not an
  expansion candidate (no bet pulls toward a bigger auth build), not HOLD-SCOPE (the seed as
  literally worded implies "switch the transport" is the default deliverable, and that framing
  must be actively trimmed), and not DROP (the surface is real and the decision is worth making
  and recording — just not by changing the transport).
bet_traced_to: "Academic tools + offline-first win students from Discord"
milestone_traced_to: "unassigned — roadmap terminal (all 14 milestones done); founder standing bug-fix phase, seed milestone_id IS NULL"
proposed_scope_change: |
  Reframe the deliverable from "switch the session-token transport (A vs B)" to
  "DECIDE + DOCUMENT the transport posture + add cheap compensating XSS controls":

  1. KEEP header token-transfer mode (do NOT set tokenTransferMethod:'cookie'). It is the
     SuperTokens-recommended transport for different-domain web/api and avoids introducing a
     cross-site-cookie login-reliability regression (Safari ITP / Chrome 3p-cookie deprecation)
     that would be strictly worse than the MEDIUM gap it closes — especially on a self-use-MVP
     with zero real users to protect today.
  2. Record the decision in command-center/product/product-decisions.md as a deliberate,
     accepted cross-origin architectural choice, with the compensating-controls rationale, so
     this item stops resurfacing at every security wave (it has now been carried since wave-72).
  3. Cheap compensating hardening the wave SHOULD carry (the real value here, and adjacent to
     wave-83's header hardening): confirm/enforce a strict CSP that blocks script-injection,
     a short access-token TTL, and refresh-token rotation — the controls that shrink the
     XSS-readable-token blast radius WITHOUT touching auth reliability. (Exact control set +
     whether the cookie-mode switch should ever be reconsidered pre-launch = P-1/P-2 to size;
     the transport-DECISION itself is a Tier-3 security-posture call — see escalation note.)

  Net: same security outcome the founder actually cares about (reduced XSS token-exfil risk),
  shipped without a login-reliability regression, at a coherent bug-fix-phase size.
escalation_reason: |
  SECONDARY FLAG (not my primary disposition, but load-bearing for Action 6 merge + P-4):
  the transport-posture DECISION is a genuine Tier-3 call under automatic mode — it couples
  security posture, a potential login-reliability regression, and an architectural transport
  choice. A wrong call in EITHER direction is consequential: switch, and you can break login
  for real users on Safari/post-3p-cookie; do nothing and don't document, and you leave a
  MEDIUM XSS surface un-owned. My strategic read is that KEEP-header + document + compensating
  controls is the correct engineering-default answer and should be BUILDABLE without a founder
  ask — but the "keep vs switch transport" security-posture decision itself should route to the
  BOARD (seat mix: risk-officer on the auth-reliability + vendor-topology risk, industry-expert
  on how SuperTokens/the industry solves different-domain SPA auth, user-advocate on the
  Safari/broken-login harm, realist on "MEDIUM surface, zero real users, no exploit evidence")
  rather than be silently auto-built by the orchestrator, per rule-9 automatic-mode Tier-3
  routing. Recommended BOARD framing: ratify SCOPE-REDUCTION (keep header, decide+document,
  add compensating controls) vs. the option-A switch. This is NOT a founder-split/hard-stop
  escalation — it stays inside the BOARD's authority under automatic mode.
sibling_visible: false
```

---

## ceo-reviewer narrative (audit)

**Worth doing / right altitude.** Yes, addressing a MEDIUM XSS-readable-token surface is legitimate in a hardening/bug-fix phase, and my wave-83 P-0 self was right to sequence this next. But the ambition question has a trap: the seed presents option A (switch to cross-site httpOnly cookies) as the "do the real fix" move. It is not the 9/10. On StudyHall's topology — `web` and `api` are different Railway origins — cookie mode requires `SameSite=None` cross-SITE cookies, which Safari ITP already blocks and Chrome's third-party-cookie deprecation is removing. Option A therefore risks a concrete **auth-reliability regression (broken login for a real slice of users)** to close a MEDIUM security gap on a product with **zero real users today**. That is a strictly bad trade: it manufactures a P1-class reliability failure to shave a MEDIUM security finding. SuperTokens explicitly recommends header mode for exactly this different-domain frontend/backend shape — the seed says so itself.

**The 9/10 vs the 3/10-that-looks-like-9/10.** The 9/10 is the disciplined move: keep the architecturally-correct header transport, formally decide-and-document it as an accepted cross-origin posture (so it stops resurfacing every security wave — it's been carried since wave-72), and spend the wave's real leverage on the **cheap compensating XSS controls** that actually shrink the readable-token blast radius (strict CSP, short access-token TTL, refresh rotation) without touching auth reliability. This is adjacent to wave-83's header hardening and fits the bug-fix-phase size. The 3/10-that-looks-like-9/10 is "we switched the transport" — impressive-sounding, reliability-regressing, and against the SDK's own guidance.

**Tier-3 / BOARD.** The keep-vs-switch transport decision is a real Tier-3 (security posture + login-reliability regression + architectural transport). Under automatic mode it should be ratified by the BOARD, not silently auto-built. My disposition (SCOPE-REDUCTION: keep header + document + compensating controls) is the recommended answer to put to that BOARD.

**Defer/reframe.** Yes — reframe the deliverable from "switch the transport" to "decide + document the transport posture + add cheap compensating XSS controls." Do not defer the item; the surface is real and the decision is worth recording. Just don't buy a login-reliability regression to close it.
