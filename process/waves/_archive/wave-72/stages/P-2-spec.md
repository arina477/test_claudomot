# P-2 — Spec (wave-72) [POINTER]
Spec contract IS tasks row `9658fb0b` description (YAML head + prose). wave_type: multi-spec (3 blocks). design_gap_flag: false.
claimed_task_ids: [9658fb0b (erasure API+service — PRIMARY), e11f8746 (shared DTO), 898490b1 (Danger-Zone UI)]
## AC copy
- Spec B (e11f8746): shared DeleteAccountRequest (confirmation) + DeleteAccountResponse.
- Spec A (9658fb0b): B-0 schema users.deleted_at (soft-delete marker + migration). POST /profile/delete (AuthGuard, session callerId — no-IDOR own-account-only). OWNED-SERVER GUARD: block-if-owner → 409 + server list. ERASURE: scrub PII (name/username/email/avatar → 'Deleted user'/null), set deleted_at, revokeAllSessionsForUser, leave all servers. RE-AUTH BLOCK (CRITICAL): the signIn/session override rejects deleted_at IS NOT NULL (prevents re-auth WITHOUT hard SuperTokens delete — reversible). Messages keep tombstone convention.
- Spec C (898490b1): Danger-Zone UI per settings-privacy.html Panel 5 — Delete-account → confirm dialog + acknowledgment-checkbox-gated destructive confirm → POST /profile/delete → logout+redirect. Owner-block 409 → surface + list servers. COPY reconcile (mockup's email-verify+30-day-grace not implemented this slice).
KEY: soft-delete regime (reversible); re-auth blocked via deleted_at guard (the split-identity fix); block-if-owner. REUSE account-data.service + supertokens.config signIn override. Founder-facing (non-blocking): regime pick + M10 metric. DEFER: hard-delete/purge, email-verify, 30-day-grace, audit-log.
