verdict: PROCEED
verdict_source: problem-framer
matched_antipatterns: []
reasoning: |
  Symptom-vs-cause (mandatory): the ROOT problem is that the permanent default
  invite link (servers.invite_code) has no invalidation path once leaked — revoke
  only touches the ad-hoc `invites` table, and the service explicitly documents this
  gap (servers.service.ts:329-330 "rotation of the permanent code is deferred").
  Rotation (regenerate the CSPRNG servers.invite_code, invalidating the old link) is
  the CAUSE-layer fix, not a symptom-patch: it addresses irrevocability directly at
  the layer that owns the code (server-owned column). Alternatives are strictly worse
  for this fix — per-link expiry defeats the "permanent default link" product purpose;
  disabling permanent links removes the shipped wave-8b default-share feature; an
  allowlist is a different (membership-gating) feature, not leak remediation. Rotation
  is at the RIGHT layer: it reuses the exact create-time pattern (generateCode +
  23505-retry) already proven in createServer and createInvite.

  Code-verify (PRODUCT rule 1 + rule 2): every seed claim confirmed against the real
  target, not just existence.
  (a) servers.invite_code exists — apps/api/src/db/schema/servers.ts:20
      (`text('invite_code').unique()`); it IS the permanent shared link, resolved by
      getInvitePreview/joinViaInvite at servers.service.ts:401-402.
  (b) CSPRNG + 23505-retry pattern is REAL and reusable — generateCode() at
      servers.service.ts:35-37 (randomBytes(16).toString('base64url'), ~128-bit);
      the retry loop lives in createInvite (servers.service.ts:286-317) and is
      mirrored in db/backfill-invite-codes.ts:55-82. Reuse is genuine, not duplication.
  (c) An owner-gate pattern EXISTS to reuse — revokeInvite (servers.service.ts:354)
      does an inline `server.owner_id !== callerId` check after loading the server.
      There is NO guard class; ownership is enforced in-service. AuthGuard
      (controller:133 comment) is verify-required only, NOT an ownership check — so
      rotation must add an in-service owner check, it cannot rely on AuthGuard alone.
      Nuance: revokeInvite allows owner OR creator; rotation must be owner-ONLY (the
      permanent code has no per-creator concept — the seed's "owner-gated" is correct).
  (d) No rotate endpoint exists — ServersController ends at createInvite (controller:95-110);
      InvitesController has only preview/join/revoke (controller:126-164). Nothing to rebuild.

  Antipatterns catalog check: no match. Not wrong-layer (server-owned code
  regeneration is the correct layer). Not symptom-patch (fixes irrevocability at the
  cause). Not demo-path tunnel-vision (the non-happy paths — non-owner 403, non-member,
  server-not-found 404, 23505 collision retry, concurrent rotate — are all enumerable
  from the existing revokeInvite/createInvite precedent and should land in the spec's
  edge-cases). Not gold-plating: the seed already scopes tightly to a single endpoint
  reusing existing utils.

  Scope sanity: keep-OUT candidates are correctly out. Rate-limiting, audit-log rows,
  and multi-link management are gold-plating for THIS leak-remediation fix — none is
  security-required to make a leaked permanent link revocable (rotation alone achieves
  that). The ONE genuine security requirement to carry into spec is the owner-ONLY
  gate (in-service, matching revokeInvite's ownership branch, minus the creator path).
proposed_reframe: |
  (n/a — PROCEED)
escalation_reason: |
  (n/a)
sibling_visible: false
