# P-4 Phase-2 — jenny spec-vs-roadmap drift check (wave-19, M3 attachments)

**Verdict: APPROVE** — spec is 1:1 with M3 `## Scope` + the M3 success-metric; no drift. This is the FINAL M3 success-metric feature; spec completes the metric.

Spec: task `20db0c16` (+ siblings `7c39c9e3`, `cf1ae370`). Milestone M3 `6198650e`.

## Per-item

| # | Check | Result |
|---|-------|--------|
| 1 | 3-block spec (data plane + composer send + message-row render) MATCHES M3 `## Scope` "file/image attachments (Railway Buckets, ≤10MB)" + metric "...attachments working" | **MATCHES** — three claimed tasks map exactly: `20db0c16` data plane (presign/confirm/associate/fan-out), `7c39c9e3` composer picker+preview+guard, `cf1ae370` row render (image preview / file chip). 1:1, no extra blocks. |
| 2 | FINAL M3 feature → M3 closure-eligible after ship | **MATCHES** — M3 metric = "reactions, threads, and attachments working." Reactions LIVE, threads LIVE (wave-18 closeout, commit 2d9b595), attachments = this wave. P-0 frame line 6 + spec body both assert M3 done-eligible after ship + parked tech-debt disposition. Spec completes the last unmet clause. |
| 3 | Scope creep beyond M3 `## Scope` | **MATCHES (no creep)** — in-scope: ≤10MB, content-type allowlist (image png/jpeg/webp/gif + pdf/text), image-preview, file-chip, 0-N per message. OUT correctly held: video/transcoding, CDN, image-resize/thumbnail-service, virus-scan, drag-drop multi-grids, file-versioning, PDF in-app render — enumerated OUT in both spec body and M3 framing. Nothing exceeds M3. |
| 4 | Storage = Railway Buckets reusing existing FilesService (not a new provider) | **MATCHES** — spec `storage:` head + sibling `sdk:` reuse `apps/api/src/files` FilesService, Railway Buckets, `@aws-sdk/client-s3` + `s3-request-presigner` (already installed ^3.1075.0 per P-0 research outcome lines 22-26). "NO new SDK, NO founder cred-ask." Verbatim match to M3 `## Scope` "Railway Buckets." Consistent — not drift. |
| 5 | 2-namespace lock honored (no new namespace) | **MATCHES** — AC6 + edge: "Attachment metadata rides the EXISTING /messaging channel-room fan-out on the message event (no new namespace)." Consistent with product-decisions v6b resolution #8 (2 namespaces: /messaging, /presence) + #5 (no /sync namespace). No new namespace introduced. |
| 6 | Authz reuse (channel-membership, BUILD-PRINCIPLES rule 4) — no new auth surface | **MATCHES** — AC5 + edge-cases gate presign+confirm+associate on `canViewChannelById` / `ChannelPermissionGuard`, parent/message-channel-derived (NOT client-supplied channel param), non-member 403. Explicitly cites BUILD-PRINCIPLES rule 4. Reuses the established wave-18 thread authz template; no new auth surface. |

## Cross-source consistency notes (corroborating, not drift)
- M3 `## Scope` references "_library.md § Databases (messages/reactions/**attachments**)" — the `attachments` table is a planned M3 data-model element; migration 0009 (additive) fulfills it. Consistent.
- 10MB cap matches product-decisions v6b resolution #9 ("file caps 2 MB avatar / **10 MB attachment**") verbatim. No drift.
- feature-list #9 ("File / image attachments in messages", H1, dep: object storage) — directly satisfied.
- P-0 reviewer trio (problem-framer PROCEED / ceo-reviewer PROCEED-HOLD-SCOPE / mvp-thinner OK, no split) already ratified the slice as indivisible and on-metric; this Phase-2 check confirms the authored spec did not drift from that frame.

## DRIFTS
None.

**Recommendation:** APPROVE for P-4 gate. Spec matches roadmap + the M3 success-metric with zero drift. Storage/authz/namespace reuse are consistent with established patterns (no new provider, no new auth surface, no new namespace). After ship + parked tech-debt disposition, M3 is closure-eligible per N-block.
