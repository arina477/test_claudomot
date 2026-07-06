# P-0 — ceo-reviewer verdict (wave-64)

> Strategic-value + ambition lens. Read-only. Parallel sibling to problem-framer (not visible at write time).
> Wave-64 topic: M12 bundle #3 — cache attachment media BYTES (image/file Blobs) offline (Dexie v4 substrate + 2 rendering siblings), bounded size caps.

```yaml
verdict: PROCEED
verdict_source: ceo-reviewer
mode_applied: HOLD-SCOPE
mode_rationale: |
  The proposed scope maps 1:1 to a NAMED clause of the M12 success metric ("previously-loaded
  media") — not more, not less. NOT scope-expansion: the metric already fully specifies media
  as one of four content surfaces; there is no adjacent capability the live bet implies beyond
  the metric that is cheap enough to fold in here (eviction/quota-management would be over-reach,
  see below). NOT selective-expansion: no single cheap-but-disproportionate addition clears the
  bar — the read-through-cache pattern is already proven across bundles #1/#2, and every candidate
  addition (LRU eviction, quota telemetry, prefetch) is heavier, not cheaper. NOT scope-reduction:
  this is NOT a real-bug-that-doesn't-matter — media is a founder-metric clause and a genuine UX
  win (student on bad wifi reopens the assignment PDF/image they were just viewing); the read-only
  bounded-cap framing already trims to the minimum slice that satisfies the clause, so there is
  nothing grandiose to strip.
bet_traced_to: "Academic tools + offline-first win students from Discord (ad1a3685-dbf9-47b0-b244-f2245ce14c0a, status=live)"
milestone_traced_to: "36378340-0ea5-428e-bc94-03750fb103f6 — M12 — Offline-first moat (in_progress, H3, Class=product-feature)"
proposed_scope_change: |
  None. HOLD-SCOPE.
sibling_visible: false
```

## Reasoning (long form)

### 1. Is offline media the RIGHT high-value next slice? — YES.

- **It is a named metric clause, not an inferred one.** M12's success metric literally enumerates
  the four offline content surfaces: "messages … assignments, study-group data, and previously-loaded
  media." Three are handled: messages (M4 wedge), assignments + schedule (bundle #2). Study-group data
  was correctly SKIPPED — FocusRoom is ephemeral socket state with no persisted read surface to cache,
  so there is nothing to serve offline. That leaves exactly two clauses: **media** and
  **conflict-resolution UI**. Media is squarely in-metric; there is zero strategic-drift risk.

- **It advances the falsifiable differentiator.** The live bet frames offline-first as the wedge vs
  Discord/Teams/Slack, all of which are online-only. The falsifier is "students keep preferring Discord
  despite offline capability." Every content surface that survives a dropped connection widens the gap
  that makes the bet testable. Media is a high-salience surface: an image or PDF attachment vanishing
  on bad wifi is exactly the "Discord assumes always-on" failure the bet attacks. Metadata already
  caches, but the bytes live behind expiring presigned URLs — so today a student sees a broken
  attachment offline. Closing that is a real, felt UX win, not a checkbox.

### 2. Is media a lower-ROI clause that should yield to conflict-resolution first? — NO, media first is correct.

- **Media is additive; conflict-resolution is a capstone.** The three shipped bundles + this one are
  the same architectural shape: extend the Dexie schema, add read-through helpers, serve-from-cache
  when offline. Media is the last surface in that family — it completes the "coverage extends from
  messages to the full content surface" half of the metric. Conflict-resolution UI is a different,
  heavier beast (two-place offline edits reconciled on reconnect) and it logically sits ON TOP of a
  complete offline read/write surface. Shipping conflict-resolution before the content surfaces it
  reconciles are all cached would be reconciling an incomplete set. Media-before-conflict-resolution
  is the right dependency order.

- **After this, only conflict-resolution remains** — M12 becomes essentially metric-complete with one
  well-bounded capstone wave. That is a clean, legible finish line for the milestone.

### 3. Is the read-only, bounded-cap scope appropriately sized? — YES, precisely.

- **Not under-delivering:** the bundle ships the full media clause (v4 blob-cache substrate + both
  attachment render surfaces: message + assignment). It does not leave a half-surface.

- **Not over-reaching:** the bounded-cap, read-only framing is exactly the right fence. Media caching
  is genuinely heavier/riskier than text (large blobs, IndexedDB growth, object-URL memory lifecycle).
  The over-ambition trap here would be pulling in an LRU/eviction engine, quota-pressure telemetry, or
  proactive prefetch — a 9/10 build where a 3/10 (cache what was already viewed, cap total size,
  serve-from-object-URL) delivers the entire metric clause. The proposed scope has already avoided that
  trap. Caching only previously-loaded bytes (no speculative prefetch) with a hard size cap is the
  minimum slice that satisfies "previously-loaded media" — correctly sized.

- **One execution risk to hand downstream (not a scope change):** object-URL lifecycle (revoke on
  unmount to avoid a memory leak) and the size-cap eviction policy at the cap boundary are the two
  places this gets non-trivial. These are B-block/T-block concerns, flagged here for P-1/P-2 to carry
  into the spec's edge-cases — not a reason to expand or contract P-0 scope.

### Precedent alignment
The project already shipped the online attachment stack as a 3-task pattern (upload/storage data plane
+ composer send UI + message-row render — product-decisions.md, wave-19 M3 attachments bundle). This
wave is the offline-read complement of that same surface, using the identical read-through-cache shape
proven in M12 bundles #1 and #2. No novel architecture, no new external SDK, no credential ask. This is
a low-blast-radius, high-legibility slice on a well-understood surface.

**Disposition: PROCEED (HOLD-SCOPE). Continue to P-1.**
