# P-1 Decompose — wave-68 (M11 publish-write-half + memberCount fix)

## Maximum rubric (all four)
- Files touched: ~10-14 — api: servers.service (updateServer/publish + memberCount query fix), servers.controller (PATCH /servers/:id), shared (update DTO/Zod), pg-harness live-DB test; web: server-settings surface (publish toggle + description/topic edit), api client, tests. Under 60.
- New primitives: ~4-6 — PATCH endpoint, update-server service method, publish toggle UI + 2 fields, memberCount query rewrite, live-DB test. Under 60.
- Est net LOC: ~700-900 (PATCH endpoint+service+authz ~120 + tests ~150; memberCount LEFT-JOIN fix ~30 + live-DB test ~90; settings toggle+fields UI ~200 + tests ~150). Under 5,000.
- Working set: moderate. Under 350K.
→ Max rubric: no threshold trips.

## Wave type + floor
- claimed_task_ids = [2bd37c4c] → length 1 → **wave_type: single-spec** (coherent bundle, mvp-thinner OK — no sibling peel).
- Single-spec floor: net LOC > 1,500. Est ~800 → BELOW floor → RESCOPE-AUTO-MERGE.

## Floor resolution — OVERRIDE-SHIP BY RULE (precedent-application, no BOARD)
- Override-ship the sub-floor single-task wave. floor_merge_attempt: 0.
- **Why:** coherent minimal "make discovery publishable + correct" bundle (the write-half that lights up wave-67's inert directory + the memberCount fix that pairs with it). mvp-thinner OK (every AC traces M11 metric; publish+unpublish+description/topic+memberCount all mvp-critical, no peel), ceo HOLD-SCOPE (ranking/trending/moderation premature/deferred). Only floor-fill candidates are deliberately-deferred future scope. PRODUCT rule 5 + wave-21/23-27/50/53/65/66/67 lineage; wave-24 do-not-re-litigate → precedent-application, no BOARD.

## design_gap_flag
```yaml
design_gap_flag: false
missing_surfaces: []
```
Reason: reuses the EXISTING server-settings surface (design/server-settings.html Overview shell is valid prior art — problem-framer: reuse Overview, NOT the superseded Roles tab) + standard design-system form primitives (toggle/switch + text inputs per DESIGN-SYSTEM §8). Adding a publish toggle + description/topic fields to an existing settings surface is not a net-new visual surface warranting a D-block. → routes P → B (no D).

```yaml
wave_type: single-spec
verdict: RESCOPE-AUTO-MERGE → override-ship-by-rule (precedent-application)
floor_merge_attempt: 0
claimed_task_ids: [2bd37c4c-eca8-4eda-900b-0276fe46f1b3]
design_gap_flag: false
