# P-0 Frame — wave-64 (M12 offline-first moat, bundle #3: media)

## Discover
- wave_db_id: de490532-15a1-447c-8800-65e4c69c6c00 (wave_number 64, running)
- Prior-work: extends M12 bundles #1 (DM cache, Dexie v2) + #2 (academic cache, Dexie v3). Same read-cache pattern, now for BLOBS.
- Roadmap milestone: M12 (36378340, in_progress, product-feature) — offline moat bundle #3 (the "previously-loaded media" metric clause). Study-group data had NO read surface → correctly pivoted to media (decomposer). Wave milestone backfilled.
- Spec short-circuit: seed has an acceptance section, no fenced YAML head → full P-1..P-3.
- **wave_type: multi-spec (2 claimed tasks after REFRAME descope: [a1b9b06b substrate + 83aa28e4 message-attachment]).**

## Reframe — REFRAME(r1) → PROCEED(r2)
- Original framing (3-task bundle): Dexie v4 blob substrate + wire message-attachment + assignment-attachment offline.
- **problem-framer round-1 REFRAME:** (a) the assignment leg (10e7543f) had a FALSE-PRESENT premise — assignment attachments have NO online byte-render surface (AssignmentCard shows only a paperclip count badge + filename chips, no <img>/download); "wire offline rendering" silently bundled BUILDING a net-new online open surface. (b) CORS was an UNVERIFIED precondition — `<img src>` display needs no CORS but `fetch(url).blob()` to cache DOES. (c) object-URL revoke + size cap must be explicit.
- **Applied:** (a) DESCOPED 10e7543f — re-parented to a top-level DEFERRED M12 candidate (prerequisite: build the online assignment-attachment-open surface first). (b) VERIFIED CORS empirically on prod (ultrathink-debugger a4ac4e718db132b3b): `fetch(attachment.url).blob()` SUCCEEDS (200, readable image/png blob, `access-control-allow-origin: *`) → CORS-OPEN → client cache-on-view feasible, NO backend proxy. Caveat: presigned GET has X-Amz-Expires=3600 (1h TTL) → fetch-and-cache AT VIEW TIME while fresh; can't re-fetch expired offline. (c) object-URL revoke (MessageComposer.tsx:343/374 pattern) + size cap (MAX_ATTACHMENT_BYTES=10MiB, MessageComposer:51) now explicit.
- **problem-framer round-2 PROCEED:** all 3 concerns resolved. Non-blocking P-2 note: the message-attachment path has TWO byte-sites — inline thumbnail (MessageList.tsx:439) + full-view lightbox (:467); AttachmentList maps 0-N attachments (:496-504). P-2 MUST cover BOTH sites + apply the per-item cap per-attachment across a multi-attachment message (else lightbox breaks offline while thumbnail works). Non-image FileChip (:478) attachments — seed must state whether the cap covers image-only or also files.
- **ceo-reviewer PROCEED (HOLD-SCOPE):** media is the right slice; media-before-conflict-resolution correct sequencing (after media, only conflict-resolution UI remains of the metric). Object-URL lifecycle + eviction-at-cap = execution risk for P-2. Carried forward.
- **mvp-thinner OK:** (on the original 3-task bundle) tight; the descope to 2 tasks is a reduction it endorses (removes the non-viable leg). Substrate + message-leg is a coherent minimal media slice.
- Mediation: none.
- **Disposition: PROCEED (multi-spec, 2 tasks).** design_gap_flag expected FALSE (reuses existing message-attachment render surfaces; offline serves cached bytes via object-URL, no new UI).

## Carry-forward (to P-2/P-3/B)
- Rule 11: Dexie v4 .version(4).stores() re-states ALL 7 prior tables verbatim (messages/channels/outbox/dmConversations/dmMessages/cachedAssignments/cachedScheduledSessions) + cachedAttachmentBlobs + preservation test.
- Cache-on-view: fetch+store bytes AT VIEW TIME while the presigned URL is fresh (1h TTL); serve cached blob offline via object-URL; can't re-fetch expired.
- Object-URL create + REVOKE on unmount/replace (MessageComposer pattern; explicit AC).
- Size cap: per-item byte cap (10MiB precedent) + skip oversized; P-2 states image-only vs also-file.
- P-2: cover BOTH byte-sites (thumbnail :439 + lightbox :467); per-attachment cap across 0-N attachments per message.
- Descoped 10e7543f (assignment media) = future M12 candidate pending the online-open-surface prerequisite.
