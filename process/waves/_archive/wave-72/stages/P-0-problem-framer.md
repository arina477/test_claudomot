verdict: PROCEED
verdict_source: problem-framer
matched_antipatterns: []
sibling_visible: false

symptom_vs_cause_check: |
  MANDATORY CHECK — result: PASS (no symptom/cause inversion).
  The seed does not describe a surface symptom with a symptom-layer fix. It names a
  genuine capability GAP: right-to-erasure (account self-delete) is entirely absent
  (verified — zero delete-account/erasure code across apps/api; the privacy module
  ships only GET /profile/privacy, PUT /profile/privacy, GET /profile/data,
  GET /profile/data/export — the ACCESS half). The cause and the fix are at the same
  layer: add the erasure endpoint + service + DTO + Settings UI. Framing is
  cause-level, not symptom-level.

reasoning: |
  The soft-delete + PII-scrub + session-revoke DEFAULT is a defensible frame for
  "right to erasure," NOT a shortcut, for three verified reasons:

  (1) Data-model reality forces it. users.id is referenced by ~20+ FKs across the
      schema (messages.author_id, servers.owner_id, server_members.user_id,
      assignments, reports, dm_*, user_blocks, attachments, notifications, scheduling)
      and NEARLY ALL are default NO ACTION — only notifications and role/channel
      children cascade. A naive HARD `DELETE FROM users` would raise FK violations or
      demand a full destructive cascade through the entire product. Soft-delete +
      scrub is the layer that matches the schema; hard-delete is a much larger,
      riskier design that would need a deliberate purge/anonymize plan per referencing
      table. This is the OPPOSITE of premature — it is the minimum coherent slice.

  (2) It matches the SHIPPED tombstone convention. messages.service.ts already
      implements exactly this pattern (is_deleted=true, deleted_at=now, content=''
      cleared — lines 877/973), returning content:null in the DTO. Reusing it avoids
      inventing a second deletion semantic (no premature-abstraction, no wrong-layer).

  (3) It satisfies the user's practical erasure right IF the full frame is honored:
      account inaccessible + PII scrubbed + sessions revoked + no longer appears in
      any roster/list. "Erasure" does NOT semantically require row-level hard-delete
      when PII is irreversibly scrubbed and the identity can no longer authenticate —
      this is a standard, regime-dependent interpretation, which is precisely why the
      regime pick is a founder call (below), not a framing defect.

  No antipattern in the catalog matches. This is not #4 premature abstraction
  (concrete single feature), not #6 config drift (no speculative knob — the
  hard/soft choice is a real compliance fork, not a "make it configurable" knob),
  not #7 validation theater, not #8 backwards-compat shim. Two real gaps exist but
  both are speccable at P-2/P-3 or escalable — they do not invalidate the frame,
  so the correct verdict is PROCEED with the notes below, not REFRAME.

proceed_notes:
  note_1_compliance_regime_choice:
    disposition: SURFACE-TO-FOUNDER (Tier-3) — already flagged; carry into gate.
    detail: |
      The HARD-delete (GDPR/CCPA strict irreversible purge) vs
      SOFT-delete+PII-scrub+session-revoke (FERPA-audit-retainable, reversible)
      fork is a genuine compliance-regime product decision, NOT an engineering
      default. Corroborating evidence: project.yaml compliance_regime: "none",
      industry_domain: "edtech"; M10 ## Success metric still "_TBD by founder";
      product-decisions.md line 800 already records this as a P-0-must-surface
      Tier-3 founder-facing choice. Under the active mode this routes per P-0
      Action 4 (founder / BOARD / ceo-agent). The seed's soft-delete DEFAULT is a
      sound provisional frame to proceed on IF unresolved, but the wave must NOT
      silently harden "soft-delete" into shipped semantics without the founder
      confirming the regime — soft-delete that is trivially REVERSIBLE by an admin
      could under-satisfy a strict GDPR/CCPA erasure request. Recommend P-0 Action 4
      surfaces it now; if unresolved at gate, ship the reversible soft-delete default
      and record the deferral. This is a note, not an ESCALATE, because a defensible
      default exists and work is verifiable without the founder answer.

  note_2_owned_server_orphan_handling:
    disposition: SPEC-GAP — must be resolved at P-2 (acceptance criteria + edge cases).
    detail: |
      This is the real completeness risk (adjacent to antipattern #3 demy-path
      tunnel-vision) and the seed does NOT resolve it. servers.owner_id → users.id
      is NO ACTION (no cascade). When a user who OWNS one or more servers self-deletes,
      the current schema leaves the server pointing at a scrubbed/soft-deleted owner.
      P-2 MUST enumerate the disposition explicitly. Candidate frames (P-2/P-3 to choose):
        (a) BLOCK self-delete while the user owns a server; require ownership transfer
            or server deletion first (simplest, honest, defensible for a self-use MVP);
        (b) TRANSFER ownership to another privileged member / cascade-delete owned
            servers (larger scope — likely defer);
        (c) ORPHAN with a scrubbed tombstone owner (risks a public directory listing
            an un-actionable "deleted user" server — interacts with M11 discovery).
      Related sub-gaps P-2 must also name (each has a shipped precedent to reuse or an
      explicit defer):
        - authored messages: keep the message tombstone/soft-delete pattern? (scrub
          author display, retain content? or tombstone?) — messages.author_id NO ACTION.
        - server_members rows, user_blocks (blocker/blocked), dm_participants,
          reports (reporter/target/resolver), assignments, attachments, scheduling —
          each references users.id NO ACTION; the scrub/retain/remove policy per table
          must be spec'd or explicitly fenced out to a later M10 bundle.
        - SuperTokens side: identity is SPLIT — auth user lives in SuperTokens
          (signUp override mirrors result.user.id into the local users row). True
          erasure MUST revoke all sessions AND delete/disable the SuperTokens auth
          user, else the account can re-authenticate. The seed names "session-revoke"
          but P-2 must confirm the auth-user deletion/disable step, not only session
          revocation, or re-login defeats the erasure.
      None of these block PROCEED — they are speccable edge cases. But P-2 that ships
      only the happy path (scrub the users row, revoke sessions) WITHOUT a named
      owned-server disposition would be an incomplete erasure and should be caught at
      the P-4 gate. Flag carried forward.

  note_3_security_scope:
    disposition: INFORMATIONAL — triggers the P-4 security-scope tightened gate + T-8.
    detail: |
      Wave touches account deletion, session revocation, and auth-user lifecycle —
      per CLAUDE.md this is auth/session/user-creation scope. T-8 Security stage and
      the P-4 security-scope tightened gate apply. Notably: re-auth/confirmation before
      irreversible action, CSRF on the DELETE, and idempotency of the delete call are
      security-relevant ACs P-2 should include. Not a framing defect; noted so the
      gate scope is not a surprise.

disposition: PROCEED
final_framing: |
  Build the genuinely-absent right-to-ERASURE half of user data-rights self-service:
  a self-service account-deletion endpoint + service + shared DTO + Settings › Privacy
  UI, defaulting to the SHIPPED soft-delete + PII-scrub + session-revoke tombstone
  convention (reversible, FERPA-audit-friendly), reusing the privacy module DI +
  SessionNoVerifyGuard + messages.service tombstone pattern. TWO items travel with the
  frame into P-1/P-2/P-3 and the P-4 gate: (1) the HARD-vs-SOFT compliance-regime pick
  is a Tier-3 founder-facing decision to surface at P-0 Action 4 — proceed on the
  soft-delete default if unresolved and record the deferral; (2) P-2 MUST spec the
  owned-server / authored-content / cross-table user-reference disposition AND the
  SuperTokens auth-user deletion (not only session revocation) — a happy-path erasure
  that scrubs only the users row is incomplete and must be caught at gate.
