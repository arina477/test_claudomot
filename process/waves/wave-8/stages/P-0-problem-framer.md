verdict: PROCEED
verdict_source: problem-framer
matched_antipatterns: []
reasoning: |
  Symptom-vs-cause (mandatory): this is net-new capability, not a symptom patch. The four tasks
  build the milestone's own defined success metric — organizer shares a link, cohort members join,
  members see channels. wave-7 shipped the create half (servers/server_members/channels); this is
  the join half. Correct cause-layer, correct sequencing, correct slice.
  Antipattern scan: no catalog match. The bundle is ONE coherent vertical slice (invite backend ->
  resolve+join API -> join page -> create/share UI), each task strictly depending on the prior — the
  inverse of #5 scope-creep-through-coupling, which targets UNRELATED "while we're in there" bundling.
  Not demo-path tunnel vision (#3): the specs already enumerate expired/exhausted/already-member/
  unauthenticated paths. Scope is clean — owner/member only; RBAC, kick/ban, and the full
  server-settings page are explicitly deferred to a later M2 bundle (task 54407e1d states this).
  Reality verified: servers table lacks invite_code (so the add-column+backfill framing is right);
  server_members already carries UNIQUE(server_id,user_id) (so idempotent re-join maps to an existing
  constraint); no RBAC tables are touched. Two-tier invite design matches _library.md decision #4 and
  product-decisions.md, and SameSite=Lax (decision #10/#17) is what makes invite-link -> login ->
  redeem work. Framing is sound. PROCEED with the security + sizing flags below carried to P-1/P-2/T-8.
proposed_reframe: |
  n/a — PROCEED.
escalation_reason: |
  n/a.
sibling_visible: false

# Flags carried forward (not reframes — framing-completeness items for downstream stages)

security_flags_for_P2_and_T8:
  - INVITE-CODE ENTROPY (load-bearing, highest priority): seed task c7443638 specifies codes are
    "URL-safe and collision-checked unique" but NOT unguessable/high-entropy. An invite is an
    access-control surface — a low-entropy or sequential code is enumerable, letting an attacker
    join servers (and, via the public preview, harvest server name + member count) without a link.
    The architecture uses UUID PKs precisely to "avoid enumeration"; invite codes must inherit the
    same property. P-2 must require crypto-random codes with a stated minimum entropy (e.g. >=64-bit
    / ~10+ url-safe chars from a CSPRNG, not a counter or short hash). T-8 must test non-enumerability.
  - PUBLIC PREVIEW IS INTENTIONAL BUT COMPOUNDS ENTROPY: GET /api/invites/:code resolves server
    summary without membership (correct per services-layer public allowlist for /invite/:code). This
    is right for the preview UX, but it means code entropy is doubly load-bearing — preview leaks
    name + member count to anyone holding a guessable code. Confirm preview returns the minimum
    summary only (no channel list, no member roster, no owner PII).
  - VERIFIED SESSION ON JOIN: POST /api/invites/:code/join says "auth required"; EmailVerification is
    REQUIRED in this project's auth recipe. P-2 should make explicit that join requires a VERIFIED
    session (not merely authenticated), and confirm the unauthenticated-visitor redirect lands back
    on the invite to redeem post-verify.
  - ATOMIC max_uses ENFORCEMENT (concurrency): task 77e2041a enforces expires_at + max_uses and
    increments uses. The check-and-increment must be atomic (single UPDATE ... WHERE uses < max_uses
    RETURNING, or row lock) or concurrent joins can overshoot a max_uses=1 invite. P-2 must specify
    atomicity; T-8/T-3 should cover the concurrent-join edge.
  - REVOCATION: confirm rotate-permanent-code invalidates the prior link, and that ad-hoc invite
    revocation (if in scope) is honored at both preview and join.

sizing_flag_for_P1:
  - ~2800 LOC across 4 tasks (~700 each) is on the larger side for one wave. NOT a RESCOPE-AUTO-SPLIT
    from this reviewer — the slice is coherent and each task is a clean layer. P-1's sizing rubric
    owns the call; a natural seam if a split is needed is backend (c7443638 + 77e2041a) vs frontend
    (72fc08ea + 54407e1d), since the two FE tasks depend on the two BE tasks landing first.

design_gap_flag:
  - TRUE — confirmed. Two UI surfaces: the invite-join page and the invite-create/share modal.
    NOTE: design/invite-join.html is already among the 14 approved page designs (product-decisions.md),
    and the create/share modal references design/server-settings.html (invite section) + existing
    Modal/Button/Toast primitives. So the D-block is a DELTA (compose the create-invite modal,
    validate the join page against the existing mock), not net-new design. P-1 to confirm D-block scope.
