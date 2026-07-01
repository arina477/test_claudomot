verdict: PROCEED
verdict_source: ceo-reviewer
mode_applied: HOLD-SCOPE
mode_rationale: |
  The seed is a genuine, correctly-scoped pre-launch security gap (irrevocable permanent
  invite link if leaked), flagged two waves ago (wave-9 P-4) with an explicit "before first
  real external users / any pre-launch link distribution" trigger. It is neither timid nor
  grandiose: one owner-gated rotate endpoint reusing the already-built locked-CSPRNG +
  23505-retry pattern is exactly the right slice — no expansion adds disproportionate value
  (SCOPE-EXPANSION / SELECTIVE-EXPANSION rejected), and there is nothing to trim without
  reopening the leaked-link hole (SCOPE-REDUCTION / DROP rejected). The bar here is execution
  quality, not scope calibration — HOLD-SCOPE.
bet_traced_to: "Academic tools + offline-first win students from Discord (status='live')"
milestone_traced_to: "a5232e16-62d5-4a7b-8fdb-3f7ceda9d09d — M5 (Academic tooling: assignments)"
proposed_scope_change: |
  None. Scope is held exactly as seeded: POST /servers/:id/invite-code/rotate, owner-gated
  via AuthGuard, regenerate CSPRNG code, invalidate old link, reuse the locked CSPRNG +
  23505-retry pattern. No sibling additions, no trims.
strategic_reasoning: |
  ── Is it worth doing, and correctly prioritized? YES ──
  This is a real security hole with a launch-gating trigger that is now LIVE: the studio is
  discussing pre-launch link distribution (the park-or-key fork explicitly contemplates
  "first real external users"). The permanent servers.invite_code became the DEFAULT shared
  link at wave-9 8b, but revoke only covers ad-hoc invites — so a leaked permanent link is
  currently irrevocable. This is the classic "real bug that DOES matter" case, not the
  "real bug that doesn't matter" trap I exist to catch. Crucially, it is milestone-agnostic
  protection: whichever way the founder resolves the fork (build M5 reminders, or pivot to
  M6/M7/M12), ANY of those milestones ships to real users through the same invite/join door.
  Closing the leaked-link hole de-risks the launch of every candidate milestone. That is what
  makes it the correct thing to build RIGHT NOW even with the fork pending — it is on the
  critical path of all branches, so building it wastes no effort regardless of the founder's
  answer.

  ── Ambition calibration: RIGHT-SIZED ──
  A 9/10 version (full invite-lifecycle management: multiple named invites, per-invite
  expiry/max-uses, audit log, rotation history) would be gold-plating for a self-use-mvp with
  zero prod servers and no real users yet. The 3/10 seed — one owner-gated rotate that
  invalidates the old code — fully closes the flagged hole. Shipping the 9/10 here is the
  "polished version of something nobody needs yet" failure mode; the seed is correctly the
  minimum that closes the gap. No cheap-but-disproportionate addition clears the
  SELECTIVE-EXPANSION bar (the obvious candidate — a member-facing "this link no longer works"
  affordance — is already precedent from wave-9 863c10ef and belongs to P-3 spec detail, not a
  strategic scope expansion).

  ── The pivot question: should THIS wave route to M6/M7/M12 instead? NO ──
  The park-or-key fork is founder-pending and I must not re-open it. But the fork does NOT make
  this wave the wrong work. Three reasons: (1) invite rotation is NOT M5-reminder work blocked
  on the Resend key — it is founder-credential-free, buildable end-to-end today, so it is not
  "spending a wave on the sidelines" the way another reminders-adjacent slice would be;
  (2) it is launch-gating for ANY milestone, so it advances the fork's readiness regardless of
  outcome rather than betting on one branch; (3) pre-empting the founder by unilaterally pivoting
  M5 → M6/M7/M12 THIS wave would prejudge a decision that is explicitly the founder's and already
  sits with them — that is founder-proxy/founder territory, not mine to force via a RECONSIDER.
  A RECONSIDER-to-pivot would also be strategically wrong: it front-runs the founder's park-or-key
  choice with a lower-authority scope call.

  ── The 7th-wave meta-issue (noted, NOT duplicated) ──
  I acknowledge this is the 7th consecutive wave (22→28) of sub-headline M5-debt slices while
  the bet-load-bearing feature (due-date reminders) sits blocked on one founder-clearable key.
  That recurrence is a legitimate strategic concern — but it is ALREADY sharpened into the
  wave-27 park-or-key fork and sitting in the 2026-07-01 founder digest, unanswered. Raising a
  fresh escalation here would duplicate a live founder ask (forbidden). My verdict does not
  depend on the fork resolving: this specific wave is the rare M5-debt slice that is genuinely
  launch-critical and milestone-independent, so it is defensible on its own merits even as the
  bigger "stop draining debt, get the key or pivot" question stays open with the founder.
  Recommendation to head-product (advisory, not a scope change): if the founder has still not
  answered by this wave's close (N-1), this is a strong candidate wave to attach a
  non-blocking nudge on the pending digest — but that is an N-block delivery decision, not a
  P-0 scope change.
sibling_visible: false
