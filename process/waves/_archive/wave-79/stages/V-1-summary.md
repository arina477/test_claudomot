# Wave 79 — V-1 Independent reviews (summary)

Karen + jenny parallel, no shared context. Both APPROVE. wave-79 (server-blind E2E DM encryption, LIVE 0fa0f5f) verified on both axes.

## Karen (source-claim) — APPROVE (7/7, 0 REJECT)
Files+migrations on merge tree; **who_can_dm gate confirmed** profile.controller.ts:151-154 (canDm seam, NOT ProfileVisibilityService); server-blind dm.service.ts:649-657 (content null) + XOR reject dm.ts:145-158; extractable=false dm-crypto.ts:84; **B-6 fixes F2/F4/F7 present in squash-merge tree by content**; **migrations reverified on LIVE prod DB** (user_encryption_keys no-private-column; dm_messages content nullable + 4 cols); Railway api+web SUCCESS @ 0fa0f5f. Antipattern clean (loggers ID-only, gateway verbatim, preview placeholder, no notification leak; integration spec real — separate-connection SELECT content-NULL + count-plaintext=0).

## jenny (spec-semantic) — APPROVE (0 DRIFT, 2 GAP, 1 observation)
LIVE-confirmed: server-blind (content null + opaque ciphertext); honest indicator (30 indicators — sole emerald lock in header, 29 plaintext "Not encrypted", 1 undecryptable "cannot decrypt on this device", never false padlock); all 5 P-4 corrections (who_can_dm→200, byte-identical 75-byte uniform-404 matrix, "Encrypted message" preview, algorithm z.enum 400, mutual-exclusivity reject); PublicKeyResponse no email/private (smuggled privateKey stripped). Prod left clean.

## Findings → V-2 (0 blocking)
- F-T5-1 (MED): auth-guard race — DMs bounce to / on transient 401 (jenny corroborated: write routes "try refresh token" on transient-stale token).
- F3/F-T8-2 (LOW): server doesn't validate senderKeyRef vs author's registered key (defense-in-depth; low under server-blind).
- F-J2 (LOW/obs): header emerald "End-to-end encrypted" capability lock shows when both peers have keys even in a plaintext/undecryptable thread — spec-consistent (per-message layer authoritative + correct), possible UX over-read.
- F-J1 (GAP): couldn't toggle who_can_dm=nobody live (Fixture B password absent) — gate proven via integration matrix + Karen; add B creds to fixture sheet.
- F5 (timing oracle): T-8 found NOT present. F8 (rate-limit): T-8 found RESOLVED (ThrottlerGuard active). F-T8-1: group not live-constructible (verified structurally).

```yaml
karen_verdict: APPROVE
karen_findings_count: 0
jenny_verdict: APPROVE
jenny_findings_count: 3
spec_drift_count: 0
spec_gap_count: 2
```
