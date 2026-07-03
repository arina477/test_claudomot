```yaml
verdict: SELECTIVE-EXPANSION
verdict_source: ceo-reviewer
mode_applied: SELECTIVE-EXPANSION
mode_rationale: |
  Not SCOPE-EXPANSION: the milestone (M7 launch-polish) is correctly sized and the
  founder just directed this exact wave (Path A) — no case for a wider milestone.
  Not HOLD-SCOPE: there is one cheap-but-disproportionate addition the base scope omits.
  Not SCOPE-REDUCTION/DROP: wiring + verifying avatar upload against the real bucket is
  genuinely worth doing — it closes the last self-service profile capability and unblocks
  MVP launch-readiness, tracing cleanly to the live bet's privacy/identity surface.
  SELECTIVE-EXPANSION fits because the same Tigris S3 credentials + the same object-storage
  code path (already-built, currently graceful-503) power BOTH avatar upload AND message
  attachments (task 20db0c16, wave-19, status=done). Wiring creds for one lights up both;
  the single highest-leverage addition is to verify attachments end-to-end in this wave too.
bet_traced_to: "Academic tools + offline-first win students from Discord" (only live bet)
milestone_traced_to: 6e2f68d8-dd04-44c5-b2e1-b9c6f28e9007 — M7 Privacy controls, notifications & launch polish (in_progress)
proposed_scope_change: |
  ADD exactly one item: end-to-end verification of MESSAGE ATTACHMENT upload/download
  against the real Tigris bucket, in this same wave, alongside the avatar verification.

  Why cheap: the attachment data plane (20db0c16) is already built, merged, and deployed
  behind the identical S3-compatible graceful-503-when-storage-unset pattern as avatars.
  The four creds this wave wires (AWS_ACCESS_KEY_ID/SECRET/AWS_ENDPOINT_URL/
  STORAGE_BUCKET_NAME on the api service) are shared — setting them for avatars ALSO
  activates attachments. No new code, no new creds, no new SDK. The only delta is a
  second end-to-end verification pass (upload a file in a channel → S3 PUT → render/
  download two-client) plus confirming the attachment path's server-side ≤10MB cap is
  enforced the same way the avatar 2MB cap is being hardened here.

  Why disproportionate: attachments is a shipped M3 success-metric feature that is
  silently dead in production today (storage was never wired). Launching the MVP
  "deploy-verified end-to-end for one class cohort" (M7 success metric) with a
  known-dead core messaging feature is a launch-readiness gap. Verifying it now — at
  ~one extra test pass — avoids shipping a launch where students can set an avatar but
  cannot share a file, and avoids a near-certain immediate follow-up wave.

  BOUNDING (do not over-expand): this is verification + cap-confirmation of an
  already-built path only. Do NOT add new attachment features, thumbnailing,
  virus-scanning, CDN, or lifecycle policies — those stay deferred. If B-block finds the
  attachment path needs non-trivial rework to go live (not just cred-wiring + verify),
  downgrade to PROCEED on avatars alone and re-file attachments as its own tracked task
  rather than bloating this launch-polish wave.
drop_rationale: |
  (n/a)
escalation_reason: |
  (n/a)
sibling_visible: false
```
