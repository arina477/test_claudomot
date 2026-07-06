verdict: REFRAME
verdict_source: problem-framer
matched_antipatterns: [1, 3]
reasoning: |
  Symptom-vs-cause + false-present-premise check FAILS on the assignment leg, and two blob-specific
  hazards are under-specced. The media-cache feature is real and high-value (the media clause of the M12
  moat metric), and the MESSAGE leg is soundly framed — but sibling 10e7543f ("wire assignment attachment
  rendering: write-through on online fetch, offline read blob and render") rests on a false-present premise:
  there is NO online byte-render surface for assignment attachments today. AssignmentCard renders a paperclip
  COUNT BADGE ("1 File", AssignmentCard.tsx:807-821) and a filename CHIP for submissions (AssignmentCard.tsx:548-561)
  — no <img>, no <a href download>, no way to open the bytes even while online. So there is nothing to
  "write-through" from and nothing to "render from blob"; the sibling silently bundles building a brand-new
  online attachment-open surface (an unstated feature) with caching it. That is antipattern #1 (symptom vs cause /
  cache-a-path-that-does-not-exist) and violates PRODUCT-PRINCIPLES rule 1 (false-present seed premise). The
  message leg (83aa28e4) is sound: MessageList.tsx:439 renders `<img src={attachment.url}>` (presigned) with a
  lightbox — a real online path to degrade from. Two hazards also need naming before P-1/P-2, else they surface at
  build/verify (antipattern #3, demo-path tunnel vision): (a) CROSS-ORIGIN CORS — attachment.url is a presigned GET
  to a separate-host private bucket (Tigris/R2 via AWS_ENDPOINT_URL, files.service.ts:68-71,89-108); current
  `<img src>` display does NOT need CORS, but `fetch(presignedUrl).blob()` to cache the bytes DOES require the
  bucket to return Access-Control-Allow-Origin. If the bucket has no CORS rule the write-through silently throws and
  the whole cache-on-view model fails — this is a NEW precondition this wave introduces and must be verified, not
  assumed. (b) OBJECT-URL revoke lifecycle — create+revoke discipline already exists as a proven pattern
  (MessageComposer create + revokeObjectURL on send), so it is de-riskable, but the seed/siblings must carry
  createObjectURL-on-render + revokeObjectURL-on-unmount/replace explicitly or it leaks. Size cap (cache images +
  small files under a byte cap) is the right first approach; a write cap alone with no eviction is acceptable for
  bundle #3 IF the cap is per-item AND there is a documented total-store ceiling, but "siblings carry caps" is too
  vague to leave to build. DM attachments are correctly out of scope: DmMessage DTO has no attachments field
  (dm.ts:56-62) and DM composer explicitly ships without attachments — messages + assignments ARE the only
  attachment-bearing surfaces, so surface coverage is complete.
proposed_reframe: |
  Split the assignment leg's hidden prerequisite from the cache work, and name the two hazards as spec obligations.

  1. ASSIGNMENT LEG (10e7543f) — the framing must acknowledge that assignment attachments have NO online
     byte-render surface today (badge/chip only, AssignmentCard.tsx:807-821 + :548-561). Either:
       (a) DESCOPE assignments from this bundle — cache media only where an online render path already exists
           (channel messages). Assignment media caching then becomes its own later bundle that first builds the
           online open surface. This keeps bundle #3 a clean read-through-cache extension (matching the wave-62/63
           pattern) with zero new UI surface; OR
       (b) EXPAND the sibling's scope EXPLICITLY to "add an online assignment-attachment open/preview surface
           (img/lightbox or href-download, mirroring MessageList's AttachmentRender) AND cache its bytes offline"
           — and re-run P-0/P-1 sizing against that larger scope. Do NOT leave it framed as mere "wire rendering,"
           which hides a net-new feature behind a cache verb.
     Recommend (a): it preserves the read-cache shape and defers the new surface to a scoped bundle. head-product
     to choose; ceo-reviewer's strategic read on whether the moat metric needs assignment MEDIA now (vs. message
     media as the proof point) should drive the pick.

  2. CORS PRECONDITION — the spec/plan must include a step that VERIFIES the bucket returns
     Access-Control-Allow-Origin for cross-origin GET (or configures it) BEFORE relying on fetch().blob()
     write-through. This is a credential-independent, verifiable precondition (PRODUCT-PRINCIPLES rule 3): probe /
     configure now, live-verify at T/C. Frame the fetch-then-cache model as "on successful online IMAGE render,
     fetch bytes via CORS-enabled GET, store Blob; on cache miss + offline, no-op to existing broken-image chip."

  3. OBJECT-URL LIFECYCLE — make the revoke discipline an explicit acceptance criterion on both wired siblings:
     createObjectURL when rendering a cached Blob, revokeObjectURL on unmount AND on src replace, reusing the
     MessageComposer create/revoke pattern. This is the #1 blob leak hazard; it must not be left implicit.

  4. SIZE CAP — make the cap concrete in the seed spec, not deferred to "siblings carry caps": cache only
     image + small non-image attachments under a named per-item byte cap, AND state a total-store ceiling with at
     least a documented decision on eviction-vs-write-cap-only (write-cap-only is acceptable for bundle #3 if the
     ceiling is stated and the growth is bounded by the per-item cap; unbounded blob caching is not).

  5. Rule-11 v3->v4 verbatim restate: the seed already flags it (restate all 7 prior tables verbatim +
     non-destructive upgrade + preservation test). Confirmed correct and consistent with the wave-62/63 lesson
     (2nd/3rd instance). Keep it; it is the highest-risk build step. No reframe needed on this point — flagged as
     correctly framed.
escalation_reason: |
  (n/a — REFRAME, not ESCALATE. No spec/founder-bet contradiction; the moat metric does name academic media, so
  the feature is bet-aligned. The assignment-leg ambiguity is a framing fix, not an authority question.)
sibling_visible: false

# =============================================================================
# ROUND 2 (post-REFRAME confirmation)
# =============================================================================
round: 2
verdict: PROCEED
verdict_source: problem-framer
matched_antipatterns: []
reasoning: |
  All three round-1 REFRAME concerns are resolved and verified against live code — the corrected
  framing is sound. Confirmations:
  (a) ASSIGNMENT FALSE-PREMISE REMOVED. Task 10e7543f re-parented out of the wave-64 bundle to a
      DEFERRED M12 candidate, with its description recording the real prerequisite (build an online
      assignment-attachment-open surface first — AssignmentCard today has only a paperclip count badge
      + filename chips, no <img>/download to degrade). The wave no longer caches a path that does not
      exist. My round-1 recommendation (a) DESCOPE was taken; bundle #3 is now a clean read-through-cache
      extension matching the wave-62/63 shape, zero net-new UI surface. Resolved.
  (b) CORS RESOLVED — my round-1 bar was "verify, not assume." A live fetch(attachment.url).blob() from
      the deployed page context returned 200 + a readable image/png blob with access-control-allow-origin: *
      on the bucket GET response. That is empirical verification, not assumption — the strongest form of the
      precondition check I demanded. Client-side cache-on-view is buildable with NO backend proxy and NO
      bucket CORS change. Resolved.
  (c) PRESIGNED-URL 1h-TTL CACHE-AT-VIEW-TIME MODEL is sound and correctly load-bearing. Because
      attachment.url is a presigned GET with X-Amz-Expires=3600, bytes MUST be fetched-and-cached at view
      time while the URL is fresh; the cache cannot lazily re-fetch an expired URL offline. This is inherent
      to cache-on-view, is now an explicit spec AC, and matches the CORS-OPEN client-fetch model. Sound.
  (d) OBJECT-URL REVOKE + SIZE CAP now explicit obligations. Both derive from proven in-repo patterns I can
      verify: createObjectURL/revokeObjectURL at MessageComposer.tsx:343 (create) / :374 (revoke on remove),
      and the size cap constant MAX_ATTACHMENT_BYTES = 10*1024*1024 at MessageComposer.tsx:51 with an
      ALLOWED_CONTENT_TYPES set at :58. The sibling AC now carries createObjectURL-on-render +
      revokeObjectURL-on-unmount/replace and a per-item byte cap explicitly. Resolved.
  No antipattern matches remain. Verdict PROCEED, with one spec-precision note for P-2 (below) that does NOT
  change the problem shape and therefore does not warrant REFRAME.
proposed_reframe: |
  (n/a — PROCEED.)
residual_note_for_P2: |
  NON-BLOCKING spec-precision note — carry into P-2, not a framing defect:
  The corrected framing cites MessageList.tsx:439 (the inline <img src={attachment.url}>) as "the" render
  hook, but the message-attachment render path has TWO byte-consuming sites, and messages carry 0-N
  attachments:
    1. inline thumbnail  — <img src={attachment.url}>            at MessageList.tsx:439-440
    2. full-view lightbox — <ImageLightbox src={attachment.url}> at MessageList.tsx:467
    - AttachmentList maps 0-N attachments (MessageList.tsx:496-504), keyed by attachment.id.
  Implication for the spec (already the right hook, just stated narrower than the code):
    - The blob cache must key on attachment.id (the .map() already does), and BOTH the inline <img> and the
      lightbox <img> must resolve through the cached blob when offline. If only the inline thumbnail is wired,
      the lightbox shows a broken image offline while the thumbnail works — a demo-path gap (antipattern #3)
      that would surface at V-1. P-2 must enumerate the lightbox as a covered surface, and the size cap must
      apply per-attachment across a multi-attachment message.
    - Non-image attachments render as FileChip (MessageList.tsx:478-485) with a download url, not an <img>;
      offline byte-serving for those is out of scope for this bundle unless P-2 explicitly adds it. The seed's
      "cache images + small non-image under a per-item cap" framing should state which of the two it covers so
      build does not silently assume both.
  This is a PROCEED note (hook is correct, problem shape unchanged), NOT a REFRAME.
escalation_reason_r2: |
  (n/a — PROCEED, not ESCALATE.)
sibling_visible: false
