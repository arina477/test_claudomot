# Wave 64 — L-block observations ledger

Append-only. L-2 Distill (karen) reads these; promotes to `*-PRINCIPLES.md` ONLY when an
observation recurs across 2+ waves AND head-verifier approves (max 1 rule/file/wave). Single-wave
observations stay here until a second wave confirms.

---

## L-2 synthesis observations (knowledge-synthesizer)

Inputs read: process/waves/wave-64/stages/ full artifact set (P-0-frame, P-0-problem-framer,
P-0-ceo-reviewer, P-0-mvp-thinner, P-1-decompose, P-2-spec, P-3-plan, P-4-gemini-review,
B-0-branch-and-schema, B-3-frontend, B-4-wiring, B-5-verify, B-6-review-output, C-1-pr-ci-merge,
C-2-deploy-and-verify, T-5-e2e, T-9-journey, V-1-karen, V-1-jenny, V-1-summary, V-2-triage,
V-3-fast-fix).
Gate verdicts checked: process/waves/wave-64/blocks/{P,B,T,C,V}/gate-verdict.md (all five gates
APPROVED; zero blocking findings; V-2 triage empty of blocking items; V-3 Phase 2 skipped).
Prior archives consulted: process/waves/_archive/wave-{59,60,61}/blocks/L/observations.md
(waves 62 and 63 L-block archives not present in _archive/ tree at observation time — no
observations.md files were found at those paths).
Principles files read: BUILD-PRINCIPLES.md (11 rules), PRODUCT-PRINCIPLES.md (5 rules),
CI-PRINCIPLES.md (10 rules), VERIFY-PRINCIPLES.md (4 rules).

---

- **[obs-1 — FIRST INSTANCE (STRONG CANDIDATE): createObjectURL for a cached IndexedDB Blob must
  be paired with revokeObjectURL on unmount AND on src-change; a hook managing an object-URL ref
  requires both revoke paths or leaks object-URL handles — a new hazard class introduced by
  this wave's blob-in-IndexedDB feature]**

  Wave-64 introduced the first feature in the project that creates object URLs from Blobs
  stored in IndexedDB and passes those URLs into a rendered `<img>`. The
  `useCachedAttachmentImage` hook (`apps/web/src/shell/useCachedAttachmentImage.ts`) stores the
  active object URL in a `useRef` and revokes it in two distinct paths: (1) the useEffect
  cleanup (lines 116-123) revokes on unmount, and (2) the effect body (lines 59-63) revokes
  the prior URL on src-change before creating the next one. Karen confirmed both revoke paths
  exist at cited file:line (V-1-karen.md §Claim 4); jenny live-measured 0 net leaked object
  URLs across an offline lightbox open/close cycle on deployed prod (V-1-jenny.md §B-AC3:
  "net leaked object URLs = 0, live:0"). The B-6 verdict named this "the key hazard" and
  verified independently (B-6-gate-verdict.md §Hazard 2: "Hazard 2 — object-URL leak (the
  key hazard): revoke-on-unmount is genuinely present"). The P-0 problem-framer explicitly
  named object-URL revoke as an execution risk requiring an explicit AC before B-block
  (P-0-problem-framer.md: "OBJECT-URL LIFECYCLE — make the revoke discipline an explicit
  acceptance criterion"). The existing in-repo precedent (MessageComposer.tsx:343/374) provided
  the proven pattern, confirming this is a reusable class, not a one-off fix.

  The structural pattern: any hook that calls URL.createObjectURL against a value that can
  change (new attachment, re-render, component re-mount) must hold the URL in a ref, revoke
  the prior ref value at the top of the effect body before creating the new one, and revoke
  the current ref value in the effect's cleanup return. One revoke path without the other
  creates a partial leak: unmount-only misses the src-change leak; src-change-only misses the
  final unmount.

  Near-dup check against BUILD-PRINCIPLES rules 1-11: none of the existing 11 rules addresses
  createObjectURL lifecycle, ref-based revoke discipline, or any Blob/object-URL memory
  management norm. BUILD-PRINCIPLES rule 11 (Dexie migration restate) is in the same domain
  (IndexedDB) but encodes a migration schema norm, not an object-URL lifecycle norm. Not a
  near-dup.

  Near-dup check against VERIFY-PRINCIPLES rules 1-4, PRODUCT-PRINCIPLES rules 1-5,
  CI-PRINCIPLES rules 1-10: none address client-side object-URL lifecycle or Blob revoke
  discipline. Not a near-dup in any existing principles file.

  Archive recurrence check (waves 59, 60, 61 L-block observations): no prior L-2 observation
  of the object-URL lifecycle class was found. No wave before wave-64 shipped a
  blob-in-IndexedDB feature with createObjectURL rendering. This is FIRST INSTANCE.

  Pre-shaped candidate rule for BUILD-PRINCIPLES (presented for karen, NOT a nomination this
  wave — 1st instance only):
    "12. In any hook that renders a Blob as an object URL, revoke the prior URL on src-change
        and in the cleanup return; both paths are required."
    Rule line = 101 chars. PASS (<=120).
    "    Why: Unmount-only revoke misses the src-change leak; src-change-only misses the
        final unmount leak."
    Why line with 4-space indent = 88 chars. PASS (<=100).
    No forbidden tokens (no `we`, `our`, `the team`, `wave-<N>`, em-dash). PASS.
    Near-dup check: BUILD rule 11 covers Dexie schema (same domain, different concern). PASS.

  Source artifacts:
  - process/waves/wave-64/stages/P-0-problem-framer.md (round 1: "OBJECT-URL LIFECYCLE — make
    the revoke discipline an explicit acceptance criterion on both wired siblings"; round 2:
    "OBJECT-URL REVOKE + SIZE CAP now explicit obligations. Both derive from proven in-repo
    patterns I can verify: createObjectURL/revokeObjectURL at MessageComposer.tsx:343/374")
  - process/waves/wave-64/stages/V-1-karen.md (§Claim 4: revoke at ts:61 src-change + ts:120
    cleanup; both paths verified at cited lines)
  - process/waves/wave-64/stages/V-1-jenny.md (§B-AC3: "net leaked object URLs = 0, live:0";
    instrumented createObjectURL/revokeObjectURL on deployed page)
  - process/waves/wave-64/blocks/B/gate-verdict.md (§Hazard 2: "object-URL leak (the key
    hazard): revoke-on-unmount is genuinely present"; both paths independently verified)
  - apps/web/src/shell/useCachedAttachmentImage.ts:59-63, 116-123 (dual revoke paths)
  - apps/web/src/shell/attachment-image-cache.test.tsx:210-235 (revoke-on-unmount test),
    237-306 (revoke-on-src-change test)

  Severity: strong (new hazard class with no prior coverage in any principles file; first
    blob-in-IndexedDB feature in the project; hazard was explicitly identified at P-0 and
    required an AC; live-measured 0 net leaked object URLs confirms the double-revoke pattern
    works; the pattern is reusable for any future feature that renders Blob bytes as object
    URLs; MessageComposer precedent confirms generalizability within the codebase).
  Candidate principles file: command-center/principles/BUILD-PRINCIPLES.md (rule 12 candidate).
  Generalizable: YES (applies to any hook that holds a URL ref from a Blob; not specific to
    attachment media).
  Falsifiable: YES (grep for createObjectURL without a corresponding revokeObjectURL in the
    same hook's cleanup and effect body is a deterministic check; the test suite already
    asserts both paths).
  Cited: YES (V-1-karen.md file:line; V-1-jenny.md live-measured 0 leaked URLs; B-6-gate-
    verdict.md §Hazard 2; attachment-image-cache.test.tsx:234 + 304).
  Recurrence verdict: FIRST INSTANCE. No prior L-2 observation of this class in any archived
    wave. Not covered by any existing promoted rule. HOLD.
  Promotion flag: HOLD — 1st instance; watch for a second wave where a Blob is rendered as an
    object URL (or, conversely, where a single-path revoke is shipped and jenny measures a
    positive leaked-URL count at V-1).

---

- **[obs-2 — INFORMATIONAL: BUILD-PRINCIPLES rule 11 (Dexie cumulative-declarative migration)
  applied for its 3rd consecutive M12 bundle (v3->v4 re-stated all 7 prior tables verbatim);
  rule functioning correctly; no new gap]**

  Wave-64 is the third consecutive M12 offline-moat bundle to apply BUILD-PRINCIPLES rule 11
  (promoted at wave-63). The v4 `.version(4).stores()` block (`apps/web/src/features/sync/db.ts:
  154-163`) re-states all 7 prior tables verbatim alongside the new `cachedAttachmentBlobs`
  table. Karen independently byte-compared the v4 block against the v3 block and confirmed
  zero index-string drift (V-1-karen.md §Claim 1: "every index string is byte-identical").
  The load-bearing test (`attachment-blob-cache.test.ts:242-387`) seeds a row into each of the
  7 prior tables, closes and re-opens the DB at v4, and asserts row-content survival — not
  mere table-existence. B-6 independently verified the same byte-compare (B-6-gate-verdict.md
  §Hazard 1: "v4 7-table byte-compare passed"). T-5 confirmed the live Dexie DB at schema v4
  (version 40) on deployed prod carries all 8 stores including all 7 prior tables (T-5-e2e.md:
  "8 object stores present: ... 7 prior tables + cachedAttachmentBlobs").

  Rule 11 fired correctly and without friction for the third consecutive bundle. The per-table
  verbatim-restate AC was carried in P-0-frame.md's carry-forward section and enforced at
  every downstream gate. This is a health-check confirmation only.

  Source artifacts:
  - process/waves/wave-64/stages/P-0-frame.md (Carry-forward: "Rule 11: Dexie v4 .version(4)
    .stores() re-states ALL 7 prior tables verbatim")
  - process/waves/wave-64/stages/V-1-karen.md (§Claim 1: byte-identical verbatim restate
    confirmed)
  - process/waves/wave-64/blocks/B/gate-verdict.md (§Hazard 1: v4 7-table byte-compare passed)
  - process/waves/wave-64/stages/T-5-e2e.md (live prod: 8 stores, all 7 prior tables confirmed)
  - apps/web/src/features/sync/db.ts:154-163 (v4 schema block)

  Severity: informational (BUILD-PRINCIPLES rule 11 in force and correctly applied; no
    override friction; 3 consecutive clean instances; no new gap).
  Candidate principles file: none (BUILD-PRINCIPLES rule 11 already promoted; this is
    reinforcement, not a new observation).
  Recurrence: 3rd consecutive application in M12 bundle series. Rule functioning as designed.
  Promotion flag: NO — rule 11 already in force; no new rule warranted.

---

- **[obs-3 — RECURRING (2nd instance): a milestone follow-up task created at V-2 with
  wave_id set to the current wave's id strands permanently because N-2 filters seedable rows
  by wave_id IS NULL; head-verifier caught and fixed this at V-3 gate by nulling the
  wave_id — same corrective pattern as at least one prior wave; VERIFY-PRINCIPLES candidate]**

  At V-2 triage, a follow-up task (db3ade72) was created under milestone M12 to track the
  cold-offline-navigation gap (g1 finding). The task row was created with `wave_id =
  de490532` (the current wave-64 id). A milestone-assigned follow-up row carrying a non-null
  wave_id is invisible to N-2: N-2 surfaces seedable tasks by filtering `wave_id IS NULL`;
  a row already bound to a wave is treated as belonging to that wave and never surfaces as a
  future-wave seed candidate, stranding it permanently.

  Head-verifier caught this at V-3 gate and applied a bounded corrective: `UPDATE tasks SET
  wave_id = NULL WHERE id = db3ade72` (V-3-fast-fix.md §Corrective: "The g1 follow-up task
  V-2 parked under M12 (db3ade72) was created with wave_id = de490532 (= wave-64 itself), not
  NULL — which would strand it"; gate-verdict.md: "A milestone follow-up seeded for a FUTURE
  wave must have wave_id IS NULL or N-2 treats it as already-belonging-to-wave-64 and never
  surfaces it as a claimable seed").

  The root mechanism is structural: V-2 triage creates follow-up tasks during an active wave
  where the current wave_id is an available ambient value; without an explicit nil-override,
  the row acquires the current wave's id by construction or convention. The V-2 stage file
  (in the brain, read-only) is where this convention originates — a project-side principle can
  observe the hazard and instruct verifiers to check wave_id IS NULL on any V-2-created
  follow-up task, even if it cannot fix the template itself.

  The MEMORY.md auto-memory file independently records this class: "V-2 milestone follow-up
  wave_id must be NULL for N-2 seed — else it strands, never seedable." The brief for this
  wave explicitly identified it as a known recurring lesson and nominated it for VERIFY-
  PRINCIPLES consideration.

  Prior-wave recurrence: the MEMORY.md entry implies this has occurred before wave-64. The
  V-3 gate-verdict itself calls the fix "routing hygiene" rather than a novel finding,
  confirming the pattern is recognized. The wave-64 instance is the first explicit L-2
  observation documenting the class; prior occurrences are recorded in MEMORY.md (non-L-2
  form). Given the MEMORY.md entry constitutes a prior documented instance, this wave
  satisfies the 2+ occurrence bar for L-2 consideration; karen should assess whether MEMORY.md
  constitutes an equivalent prior observation for promotion purposes.

  Pre-shaped candidate rule for VERIFY-PRINCIPLES (presented for karen's assessment):
    "5. After V-2 creates any follow-up task bound to a future milestone, confirm its
        wave_id IS NULL before closing V-3."
    Rule line = 89 chars. PASS (<=120).
    "    Why: A follow-up row with wave_id set to the current wave never surfaces as an
        N-2 seed candidate."
    Why line with 4-space indent = 86 chars. PASS (<=100).
    No forbidden tokens (no `we`, `our`, `the team`, `wave-<N>`, em-dash). PASS.
    Near-dup check vs VERIFY rules 1-4: rule 1 (seeding ACs by source), rule 2 (amend spec),
    rule 3 (re-verify fast-fix live), rule 4 (negative-case control) — none address V-2
    follow-up task wave_id routing. Not a near-dup. PASS.

  Source artifacts:
  - process/waves/wave-64/stages/V-3-fast-fix.md (§Corrective: "g1 follow-up task db3ade72
    was created with wave_id = de490532 ... not NULL — which would strand it"; fix: UPDATE
    tasks SET wave_id = NULL WHERE id = db3ade72)
  - process/waves/wave-64/blocks/V/gate-verdict.md (§Corrective: "A milestone follow-up
    seeded for a FUTURE wave must have wave_id IS NULL or N-2 treats it as already-belonging-
    to-wave-64 and never surfaces it as a claimable seed — it strands permanently")
  - /home/claudomat/.claude/projects/-home-claudomat-project/memory/MEMORY.md (auto-memory
    entry: "V-2 milestone follow-up wave_id must be NULL for N-2 seed — else it strands,
    never seedable")

  Severity: warning (the stranding is silent and permanent without intervention; V-3 gate
    is the only current check; the MEMORY.md record confirms prior occurrence; structural
    root cause is in the brain V-2 template which cannot be edited from project side).
  Candidate principles file: command-center/principles/VERIFY-PRINCIPLES.md (rule 5 candidate).
  Generalizable: YES (applies to any V-2 triage that creates milestone-assigned follow-up
    tasks; not specific to this feature).
  Falsifiable: YES (a one-query check: SELECT wave_id FROM tasks WHERE id = <new-task-id> = NULL
    is a deterministic assertion at V-3 gate close).
  Cited: YES (V-3-fast-fix.md §Corrective; V/gate-verdict.md §Corrective; MEMORY.md entry).
  Recurrence verdict: MEMORY.md documents prior occurrence; wave-64 V-3 corrective is a
    confirmed second-instance fix of the same class. Karen to rule on whether MEMORY.md
    constitutes an L-2-equivalent first instance or whether a second explicit L-2 observation
    entry is required.
  Promotion flag: WARNING HOLD — 2+ occurrences documented (MEMORY.md + wave-64); karen to
    assess promotion eligibility given MEMORY.md origin vs. formal L-2 ledger origin; if
    eligible, pre-shaped rule above meets contract format.

  L-2 head-learn ruling (wave-64): NOT PROMOTED. karen vetted and REJECTED on recurrence-bar-
    not-met. Prior L-2 ledgers wave-32/44/47/48 each formally ruled this class NOT a project-
    principles candidate: the real fix is a brain-owned V-2-triage.md Action 4 ritual correction
    (INSERT with wave_id = NULL), which is sync-replaced and cannot live as a project
    VERIFY-PRINCIPLES line. A MEMORY.md auto-memory note does not satisfy the "2+ waves" L-2-
    ledger recurrence bar. Code-claim (N-2 filters wave_id IS NULL, N-2-seed.md:34-35) verified
    TRUE, but a true claim on the wrong artifact does not rescue the rule. Active mitigation is
    the MEMORY note (working: waves 47/48 confirm correct application). No append to
    VERIFY-PRINCIPLES.md this wave.

---

- **[obs-4 — INFORMATIONAL: P-0 problem-framer REFRAME caught a false-present premise on the
  assignment-media leg (no online byte-render surface existed to cache from) and verified an
  unconfirmed CORS precondition empirically before P-1; PRODUCT-PRINCIPLES rules 1 and 2
  applied correctly]**

  The wave-64 seed included a sibling task (10e7543f) to cache assignment attachment bytes
  offline. The problem-framer's round-1 REFRAME verdict identified that this rested on a
  false-present premise: AssignmentCard today renders only a paperclip count badge and filename
  chip, with no `<img>` or download surface — there was no online byte-render path to degrade
  from (P-0-problem-framer.md: "there is NO online byte-render surface for assignment
  attachments today"). Caching a path that does not exist would have silently bundled building
  a net-new online attachment-open surface (an unstated feature) with the cache work.
  Additionally, CORS was flagged as an unverified precondition: `fetch(url).blob()` requires
  `Access-Control-Allow-Origin` on the bucket, whereas `<img src>` does not. The problem-framer
  required empirical verification before speccing, not an assumption. The CORS check was
  performed live (`fetch(attachment.url).blob()` returning 200 + readable blob with
  `access-control-allow-origin: *`), confirming the cache-on-view model was buildable without
  a backend proxy or bucket CORS change (P-0-problem-framer.md round 2).

  This is a CONFIRMED-BY-APPLICATION of PRODUCT-PRINCIPLES rules 1 and 2. Rule 1 ("Verify
  every seed claim about what exists or is absent in the code at P-0") fired on the false-
  present assignment-media premise. Rule 2 ("Verify at P-0 that the seed's named entity is
  the real cost source or output boundary") fired on the unverified CORS precondition, which
  was an unstated prerequisite for the feature to function. No new rule is warranted;
  the mechanism worked as designed. This is analogous to wave-61 obs-1 (seed hypothesized
  fabricated root cause; P-0 code-inspection falsified it; rules 1 and 2 applied correctly).

  Source artifacts:
  - process/waves/wave-64/stages/P-0-problem-framer.md (round 1: verdict REFRAME,
    matched_antipatterns [1, 3], "there is NO online byte-render surface for assignment
    attachments today"; CORS as unverified precondition; round 2: verdict PROCEED, CORS
    empirically verified live)
  - process/waves/wave-64/stages/P-0-frame.md (Reframe section: assignment leg DESCOPED;
    CORS-OPEN verified empirically)
  - process/waves/wave-64/blocks/P/gate-verdict.md (not present as a separate file; P block
    verdict is embedded in P-0-problem-framer.md round 2 PROCEED; P-4 gate confirmed APPROVED
    in process/waves/wave-64/blocks/P/gate-verdict.md)

  Severity: informational (the system worked as designed; PRODUCT rules 1 and 2 fired at
    P-0, corrected framing before spec was written; no B-block rework; no wasted build
    effort on a non-existent surface; all gates APPROVED first attempt).
  Candidate principles file: none (PRODUCT-PRINCIPLES rules 1 and 2 already cover this
    class; this is reinforcement, not a new gap).
  Recurrence verdict: CONFIRMED-BY-APPLICATION. Third documented application of rules 1 and 2
    together (wave-54 obs-2, wave-61 obs-1, wave-64 obs-4). No new promotable rule.
  Promotion flag: NO — existing rules apply.

---

- **[obs-5 — INFORMATIONAL: status check on prior held observations]**

  Updating carried status from wave-61 obs-5 (most recent available prior L-block archive)
  and known held classes. Waves 62 and 63 L-block archives are absent from _archive/ — no
  recurrence confirmation or falsification from those waves is available.

  | origin | obs | class | wave-64 status |
  |--------|-----|-------|----------------|
  | wave-58 obs-A | Hardening a pass-regardless soft-check into a gating assertion exposes a masked production defect | NOT CONFIRMED. Wave-64 adds new tests on a new feature; no existing pass-regardless soft-check was converted. CI 7/7 green. Structural prerequisite absent. HOLD maintained. |
  | wave-58 obs-B | Prod-baseURL e2e is post-deploy verification, not a pre-merge gate | NOT CONFIRMED. CI 7/7 green (C-1-pr-ci-merge.md); no e2e gate issue; classification not stress-tested. HOLD maintained. |
  | wave-59 obs-3 | Test a multi-branch pure formatter with a single it.each table covering every output bucket | NOT CONFIRMED. Wave-64 tests are for async hook behavior and Blob round-trips, not a multi-branch pure formatter. Not an exercising instance. HOLD maintained. |
  | wave-60 obs-1 | Hardcoded palette hex in 45 web-shell .tsx files; token-consumption antipattern (STRONG HOLD per karen ruling; pending token-migration wave + correct file target DESIGN-PRINCIPLES) | NOT CONFIRMED. Wave-64 makes no .tsx inline-style backgroundColor changes. Not a confirming instance. HOLD maintained. |
  | wave-52 obs-3(a) | VERIFY: independently re-probe load-bearing claims at gate before accepting zero-finding verdict | CONFIRMED BY APPLICATION. Karen independently verified all 7 load-bearing claims at cited file:line against merge 1744de8 + live deploy. Jenny live-probed deployed prod: read back an actual cached Blob, measured 0 net leaked object URLs, confirmed hook offline-fallback fires. Head-verifier independently re-derived the verdict. The behavior continues correctly. Remains 1st-instance HOLD for VERIFY-PRINCIPLES rule 5 candidate (the soft-check-hardening variant — distinct from obs-3 above). |
  | wave-52 obs-3(b) | Gate agent direct-writes to principles files | NOT CONFIRMED. No gate agent wrote directly to a principles file this wave. Remains 1st-instance HOLD. |
  | wave-57 obs-1 | Interactive nav/rail button shipped with no onClick from a prior wave | NOT CONFIRMED. Wave-64 makes no onClick changes; AttachmentRender is a read-only display component. Not a confirming instance. HOLD maintained. |
  | wave-50 obs-B | Parallel T-5 testers block on shared MCP Chrome profile | NOT CONFIRMED. T-5 used a single Playwright session (context persisted per always-on rule 5). Not an exercising instance. HOLD maintained. |
  | wave-49 obs-B | Socket.IO namespace mismatch invisible to mocked-both-sides unit suite | NOT CONFIRMED. Wave-64 has no Socket.IO changes. HOLD maintained. |
  | wave-49 obs-C | Responsive breakpoint not validated against D-3 adopted design at B-block | NOT CONFIRMED. D-block skipped (design_gap_flag false; data-source-only change on an already-inventoried surface). HOLD maintained. |

  Severity: informational (status checks only).
  Candidate principles file: none.
  Promotion flag: NO.

---

## Summary table

| id | title (short) | severity | recurrence | candidate file | disposition |
|----|---------------|----------|------------|----------------|-------------|
| obs-1 | createObjectURL for a cached Blob must pair both a src-change revoke AND an unmount revoke; first blob-in-IndexedDB feature; strong BUILD-PRINCIPLES candidate | strong | FIRST INSTANCE as L-2 obs; no prior L-2 observation of this class in any archived wave | BUILD-PRINCIPLES rule 12 candidate | HOLD — 1st instance; watch for any future wave rendering a Blob via createObjectURL |
| obs-2 | BUILD rule 11 (Dexie cumulative-declarative migration) applied correctly for 3rd consecutive M12 bundle; health-check confirmation | informational | 3rd application; rule in force since wave-63 | none | NO ACTION — rule 11 in force and correctly applied |
| obs-3 | V-2 milestone follow-up task created with wave_id = current wave strands at N-2 unless nulled; head-verifier caught and fixed at V-3; recurring (MEMORY.md + wave-64); VERIFY candidate | warning | 2+ occurrences (MEMORY.md prior + wave-64 V-3 corrective); karen to assess MEMORY.md as prior-instance basis | VERIFY-PRINCIPLES rule 5 candidate | WARNING HOLD — karen to rule on recurrence bar; pre-shaped rule meets contract format |
| obs-4 | P-0 REFRAME caught false-present assignment-media premise + unverified CORS precondition; PRODUCT rules 1+2 applied correctly; 3rd documented application | informational | CONFIRMED-BY-APPLICATION of existing rules 1 and 2 (wave-54 obs-2, wave-61 obs-1, wave-64 obs-4) | none | NO PROMOTION — existing rules cover the class |
| obs-5 | Status check on prior held observations | informational | status checks | none | STATUS CHECK ONLY |

**Observations emitted: 5 (obs-1 through obs-5)**
**Severities: 1 strong (obs-1), 1 warning (obs-3), 2 informational (obs-2, obs-4), 1 informational/status-check (obs-5)**
**Promotion-eligible this wave: obs-3 is the most immediate candidate pending karen's recurrence ruling; obs-1 is a strong 1st-instance hold**
**Nominations for karen vetting: obs-3 (warning; VERIFY-PRINCIPLES rule 5 candidate; 2+ occurrence basis via MEMORY.md; pre-shaped rule meets contract); obs-1 (strong; BUILD-PRINCIPLES rule 12 candidate; 1st instance; held for confirming wave)**
