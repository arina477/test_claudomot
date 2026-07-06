verdict: OK
verdict_source: mvp-thinner
milestone_id: 36378340-0ea5-428e-bc94-03750fb103f6
milestone_title: M12 — Offline-first moat
milestone_class: product-feature
milestone_success_metric: |
  A student working fully offline can access ALL their StudyHall content — not just recent
  channel messages (the shipped M4 wedge) but assignments, study-group data, and
  previously-loaded media — and when the same item is edited from two places while offline,
  a clear conflict-resolution UI reconciles on reconnect with zero data loss. Deepens the
  offline wedge into a moat: coverage extends from messages to the full content surface.
mvp_critical_status: |
  This is moat bundle #3 (media clause). The metric enumerates four content surfaces —
  messages (SHIPPED: M4 wedge + bundle #1 DMs), assignments + schedule (SHIPPED: bundle #2),
  study-group data, previously-loaded media — plus a conflict-resolution UI clause. Of the two
  remaining content surfaces, "study-group data" has NO persisted read surface in StudyHall
  today (only ephemeral FocusRoom Socket.IO state — not a read-cache fit; correctly documented
  in the seed's Why prose), so "previously-loaded media" is the correct next slice. This
  3-task bundle covers exactly that one named clause across its two rendering surfaces
  (message attachments + assignment attachments). Conflict-resolution UI remains the sole
  deferred clause after this bundle.

ok_rationale: |
  Every AC in this 3-task bundle traces cleanly to the "previously-loaded media" clause of
  M12's success metric — no nice-to-have padding, no gold-plating, no over-scoped substrate.

  Trace test per task:
  - Seed a1b9b06b (v4 substrate: cachedAttachmentBlobs blob table + CachedAttachmentBlob type
    + getCachedAttachmentBlob/putCachedAttachmentBlob helpers + v3→v4 verbatim-restate
    migration + preservation test): BOTH siblings import its blob table + helpers — if absent,
    neither media wire-in is possible. mvp-critical. NOT over-scoped: exactly ONE blob table,
    consumed by each sibling; zero unused surface. Verified v3 is the live version (db.ts
    .version(3)) and both DTO surfaces carry AttachmentRef (packages/shared assignments.ts +
    messaging.ts), so the substrate is genuinely shared, not speculative. The verbatim-restate
    migration + data-loss-guard test is the load-bearing correctness guard for a schema bump
    that mutates a LIVE user DB holding 7 prior tables (messages/channels/outbox/
    dmConversations/dmMessages/cachedAssignments/cachedScheduledSessions) — not polish.
  - Message-attachment sibling 83aa28e4: the metric names "previously-loaded media"; message
    attachments are the highest-volume media surface (channel message view). Remove it → the
    dominant media surface is uncached → the clause is materially unsatisfied. mvp-critical.
    Keep.
  - Assignment-attachment sibling 10e7543f: assignment attachments (spec sheets, PDFs,
    reference images) are academic media riding the assignment surface already made offline in
    bundle #2. Remove it → media coverage stops at the messaging surface, leaving the academic
    surface (the moat's actual metric-center) with cached list/detail but broken attachments.
    Keep. (See splittability analysis below — this is the load-bearing judgment for this wave.)

  Splittability of the assignment-media wire-in (the explicit P-0 question — could message
  media ship first, deferring assignment media, since the two are two INDEPENDENT rendering
  surfaces like bundle #2's assignments+schedule?):

  The two surfaces ARE structurally independent — distinct components (channel message view vs
  AssignmentsPanel/detail), distinct DTO fields (message AttachmentRef[] vs assignment
  attachment: AttachmentRef | null), no data dependency between them. So on independence
  alone, a split is mechanically possible. BUT independence is NOT the thinness criterion —
  the trace test is, and the shared-substrate risk math is. Three reasons the split is
  refused:

  (1) Trace ambiguity resolves toward KEEP. "Previously-loaded media" admits two readings:
  (a) satisfied once ANY previously-loaded media renders offline (message media alone) → then
  assignment media is nice-to-have; (b) the media that rides the surfaces already made offline
  (messages AND assignments) → then both are required. Under my hard rule ("unclear → mvp-
  critical by default; do not second-guess the founder's metric"), reading (b) governs. The
  metric's own framing — "ALL their StudyHall content ... the full content surface" — favors
  (b): media coverage that stops at messaging while the academic surface's attachments stay
  broken is not "the full content surface."

  (2) Even under the thinner reading (a), splitting is WASTEFUL, not thinner — identical to
  the bundle #2 finding. Both wire-ins consume the SAME v4 cachedAttachmentBlobs table riding
  the SAME verbatim-restate migration (the single highest-risk element of the seed: omitting
  any of the 7 prior tables silently drops it → user data loss). After THIS bundle the blob
  table already exists; deferring assignment-media to a later bundle buys NO schema saving —
  it just re-opens a rendering surface against a table that's already shipped. There is no
  migration to peel, so the "avoid a wasteful second v5 bump" argument from bundle #2 doesn't
  even need to fire; the split saves nothing and delays a metric-named surface.

  (3) The two siblings are DELIBERATELY co-designed to share ONE policy. Sibling 10e7543f's
  AC explicitly mandates "reuse the exact bounded-cache + object-URL-revocation policy
  established by the message-attachment sibling — do not fork a second policy." Splitting them
  across bundles forces the assignment wire-in to either re-derive the policy (divergence risk
  — the exact anti-pattern its AC forbids) or take a cross-bundle dependency on unshipped
  work. Building them together is the correctness-preserving shape.

  On over-scope of the size-cap / eviction machinery (P-0 question 3): correctly thin. The
  seed only CONSIDERS a bounded size policy and explicitly pushes the exact caps down to the
  siblings ("the sibling wiring tasks carry the exact caps"). The siblings implement a simple
  WRITE cap (skip blobs above a sensible size; oversized → graceful unavailable-offline
  affordance) + object-URL revocation on unmount — NOT a quota manager, LRU eviction engine,
  or background reaper. That is the appropriately thin "don't grow IndexedDB unboundedly"
  guard, not a full quota/eviction system. No gold-plating to peel.

  This is a tight, coherent "offline previously-loaded media" slice mirroring the proven
  bundle #1/#2 substrate + two-read-wire-ins structure, scoped to precisely the one remaining
  metric-named content clause reachable today (media) across its two rendering surfaces, and
  nothing beyond. Conflict-resolution UI and study-group data are correctly out of scope
  (former is the metric's separate write-reconciliation clause = a later bundle; latter has no
  persisted read surface to cache). No AC re-classification warranted.

floor_constraint_active: false
floor_constraint_detail: |
  N/A — verdict is OK on merits (tight coherent slice), not floor-blocked. No THIN split was
  proposed, so no residual-LOC floor pre-check was triggered.

sibling_visible: false
