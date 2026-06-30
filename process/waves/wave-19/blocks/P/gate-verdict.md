# Wave 19 — P-4 Verdict

**Reviewer:** head-product (fresh spawn, P-4 Phase-1 gate)
**Reviewed against:** process/waves/wave-19/blocks/P/review-artifacts.md
**Attempt:** 1  (first gate)
**Phase:** 1 (head-product)

## Verdict
APPROVED

## Rationale
Wave-19 ships file/image attachments — the last unshipped M3 success-metric clause ("reactions, threads, and attachments working"), which makes M3 done-eligible and unblocks the offline-first work. It traces cleanly to a live bet (displace-Discord + academic-tools: slides/PDFs/screenshots are core coursework value), the trio returned PROCEED with no scope split, and mvp-thinner found no defensible THIN split (multi-attach 0-N is non-separable cardinality woven through FK/contract/composer/render). I verified the two load-bearing claims against ground truth and both hold. (1) Storage-reuse is genuinely sound: files.service.ts confirms the exact presign→client-PUT→HeadObject-confirm pattern the plan extends, with @aws-sdk/client-s3 + s3-request-presigner installed at ^3.1075.0, the graceful 503 STORAGE_NOT_CONFIGURED degrade, and the documented "presigned-PUT cannot carry ContentLengthRange → enforce size at confirm via HeadObject" rationale that the 10MB cap reuses verbatim. The NO-founder-cred-ask resolution is correct — Railway Buckets credentials are account-issued by the already-authorized Railway project (not a new external account), so rule-10 research correctly avoided an unnecessary ask. (2) BUILD-PRINCIPLES rule 4 (channel-derived authz, non-member 403) is correctly front-loaded: the spec AC and plan require membership authz on presign/confirm/associate derived from the channel/message row (never a client param), plus a mandated B-6 Phase-2 non-member-403 negative path — the same wave-18-IDOR-class boundary that ground truth confirms is already proven in createReply/listThreadReplies (canViewChannelById against the row's channel_id). ACs are enumerated and independently falsifiable (413 at confirm, 4xx at presign on disallowed type, 0-N rows linked by FK, in-txn association with owner/channel/unassociated guard, /messaging fan-out on the existing event), all four non-happy states are specified (empty/no-attachment unchanged, upload progress/loading, oversized+disallowed+failed-upload errors, storage-unconfigured 503), non-goals are explicit (video transcoding/CDN/resize/thumbnail-service/virus-scan/drag-grids/versioning/PDF-render all OUT — no gold-plating at this self-use scope), and the plan respects the locked architecture (extends FilesService + MessagingModule, additive migration 0009, reuses the existing message event with no new namespace, every AC maps to a named B-stage step, all five specialists validate against AGENTS.md). Two non-blocking build-time notes are carried to the B-block below; neither rises to REWORK because the spec already names the guard semantics and the head-builder owns transaction-shape selection at B-3.

## Build-block carries (advisory — head-builder owns at B-3/B-6; NOT rework)
1. **Association transaction shape.** The spec requires associating 0-N attachments to a message "in one transaction" with an owner/channel/unassociated guard. Ground truth shows `createReply` already uses `db.transaction()`, but `createMessage` currently uses a non-transactional sequential-await path with idempotency ON CONFLICT (messages.service.ts lines 270-329). Extending `createMessage` to associate attachments atomically means the attachment UPDATE (SET message_id WHERE uploader_id=sender AND channel_id=msg.channel AND message_id IS NULL) must be wrapped together with the message insert. The head-builder must decide whether to wrap createMessage in a transaction (preferred, matches createReply) or accept the idempotency-replay interaction; flag the idempotent-replay-with-attachments case explicitly at B-3. This is a known shape decision, not a spec defect.
2. **forcePathStyle bucket-URL-style check.** SDK-doc Gotcha #1/#6 + line 267: the existing FilesService hard-codes `forcePathStyle: true` (correct for the original avatar bucket). If wave-19 provisions a NEW attachments bucket via `railway bucket create`, the URL style must be verified against the Railway Credentials tab before assuming path-style — a mismatch is a silent 404/403. B-5 wiring (confirm storage env) must verify whether attachments reuse the avatar bucket (no change) or a new bucket (re-check the flag). The plan already names "confirm at B-0; reuse the avatar bucket or self-provision"; this carry just makes the URL-style check explicit. Plus: Railway Buckets are private-only (Gotcha #6) — the public-URL render path must use presigned-GET (1h TTL) or a backend proxy, NOT a persisted static public URL; the spec's AttachmentRef.url field must be populated accordingly at confirm/list time.

---

## P-4 Phase-2 Triage — Gemini forward-concern (attachment orphan data)

**Reviewer:** head-product (same gate, Phase-2 external-concern triage)
**Phase 1:** APPROVED (above). **karen + jenny Phase-2:** both APPROVED.
**Concern source:** Gemini — orphaned-data risk from two-phase attachment (confirm creates row → associate later).

### Decision: MATERIAL → small P-3 annotation (design swap, NOT a GC cron, NOT a rework)

### Assessment
1. **Is the orphan concern real?** Yes, structurally. The P-3 plan's `confirmAttachment` INSERTs an attachment row with `message_id NULL`, associated later in the `createMessage` txn. An abandoned upload leaves an orphan DB row + orphan storage object. Real failure shape.
2. **Does it fire now / is a GC cron warranted this wave?** No, and no. Self-use-MVP, founder sole user — orphan rate near-zero. Gemini's suggested fix (GC cron with TTL) is non-trivial infra (scheduled task + its own monitor) for a symptom that does not exist at this scale. That is exactly the gold-plating the seed's OUT-list and always-on rule 13 guard against. The GC cron is correctly REJECTED for this wave.
3. **Is the cheaper design the right annotation?** Yes. Create the attachment ROW at message-send, not at confirm: `confirmAttachment` validates only (HeadObject ≤10MB + content-type) and returns the validated key; the client passes the key(s) to `createMessage`, which INSERTs attachment rows with `message_id` set atomically in the send txn. This **eliminates orphan DB rows by construction** (no `message_id`-NULL row ever exists) and, as a bonus, **resolves karen's C5 (association atomicity)** — the row is born associated inside the createMessage path, removing the NULL-then-UPDATE step entirely. Net reduction in code and risk, not an addition.
4. **Does anything need the two-phase confirm-creates-row design?** Checked the only plausible dependency: the composer preview. It is CLIENT-side (staged file + presign), so it does NOT require a persisted row pre-send. Row-at-send is therefore viable with no UX regression. No other consumer needs a pre-send persisted attachment row.

### Why MATERIAL (not NOT-MATERIAL-log-and-proceed)
The swap is cheaper AND cleaner than the shipped P-3 plan — it deletes a failure class (orphan rows) and a reviewer concern (C5) at the same time, for less code. Declining it would knowingly ship a design with a structural orphan-row defect plus an unresolved atomicity note, justified only by "scale hides it." That is the wrong trade when the simpler design is in hand. Consistent with wave-17/18 precedent (Gemini forward-concern → MATERIAL → small annotation).

### P-3 annotation (hand to head-builder at B-3; updates the P-3 plan, no re-spec of ACs)
- **Attachment row is created at message-send, not at confirm.** `confirmAttachment` is validation-only: HeadObject (≤10MB + allowed content-type) → returns the validated storage key(s). It does NOT INSERT an attachment row.
- **`createMessage` INSERTs the 0-N attachment rows with `message_id` set, atomically in the send transaction** (membership/owner/channel authz on each key, per the Build-block carry #1 transaction shape — this annotation makes the txn wrap mandatory, resolving the carry's open question in favor of wrapping). No `message_id IS NULL` row state exists in the schema lifecycle.
- **This supersedes karen C5 (association atomicity):** there is no NULL-then-UPDATE association step to guard; the row is born associated. Migration 0009 keeps `message_id` NOT NULL on the attachment FK (was nullable in the two-phase plan).
- **Orphan STORAGE objects (uploaded-but-never-sent) remain a minor, logged known-debt.** No GC cron this wave. Optional GC follow-on deferred to its own bet if/when multi-user scale makes storage cost observable. Record as known-debt at L-1.
- **ACs unchanged.** 413-at-confirm, 4xx-at-presign-on-disallowed-type, 0-N rows linked by FK, in-txn association, /messaging fan-out — all hold; only the row-birth location moves from confirm to send.

### Routing
- design_gap_flag: false (backend/contract change only; no new UI surface). Hand-off remains B-block.
- No founder escalation: technical design default within the established architecture (rule 17), strictly inside the locked storage-reuse pattern, no new infra.

## Footer
- verdict_complete: true
- phase2_triage_complete: true
- phase2_decision: MATERIAL
- phase2_annotation_target: P-3 plan (row-at-send; supersedes karen C5)
- gc_cron_this_wave: false (gold-plating at self-use scale)
- rework_attempt_cap_remaining: 3

---
## Phase 2 final (appended by orchestrator)
| Reviewer | Verdict |
|---|---|
| karen | APPROVE — storage-reuse (FilesService presign→HeadObject), @aws-sdk installed, 0009 next, canViewChannelById channel-derived authz, rowToDto sole site all VERIFIED. Carries: C5 association-atomicity (createMessage not txn) + C7 presigned-GET-url (Railway Buckets private, not static resolvePublicUrl). |
| jenny | APPROVE — 1:1 with M3 ## Scope "file/image attachments (Railway Buckets, ≤10MB)" + success-metric; FINAL M3 feature; no creep (video/CDN/transcode/virus-scan/PDF OUT); 2-namespace lock honored; rule-4 authz reuse. |
| Gemini | CONCERN (orphan rows/objects from two-phase) → head-product MATERIAL → row-at-send redesign (confirm validates-only; createMessage INSERTs rows with message_id NOT NULL atomically — kills orphan rows + resolves C5; GC cron rejected as gold-plating). |

## Gate result: PASSED → D-block (design_gap_flag TRUE → composer attachment + message-row attachment)
- B-block carries: (1) row-at-send (confirm validates-only; message_id NOT NULL; createMessage wrapped in db.transaction); (2) AttachmentRef.url = presigned-GET (resolveAttachmentUrl, Railway Buckets private — NOT static resolvePublicUrl); (3) rule-4 channel-derived authz on presign/confirm + B-6 negative-path 403 test; (4) ≤10MB server-enforced at confirm (HeadObject); (5) storage graceful-503 if env absent; (6) abandoned storage objects = logged known-debt (no GC cron).
- Storage: reuse FilesService/Railway Buckets, no new SDK, NO founder cred-ask.
- Next: D-1 Brief (composer file picker/preview + message-row image-preview/file-chip).
