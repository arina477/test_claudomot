# Wave 15 — L-2 Distill Observations

Synthesized from wave-15 artifacts (M3 @mentions: autocomplete + pills + unread badge; LIVE, PR#27
merge fd86540; main @ c3b46f0).
Prior archives consulted: process/waves/_archive/wave-{10,11,12,13,14}/blocks/L/observations.md.
Principles files read: BUILD-PRINCIPLES (3 rules), VERIFY-PRINCIPLES (1 rule), CI-PRINCIPLES (2 rules),
DESIGN-PRINCIPLES (1 rule), T-2.md (0 rules), T-4.md (0 rules), T-5.md (0 rules), T-8.md (1 rule),
PRODUCT-PRINCIPLES (0 rules).

---

```yaml
observations:

  - id: obs-1
    summary: >
      The unread-mention badge (H-1) was architecturally dead: the badge store increment path
      was unreachable because the Socket.IO client joined only the active channel room, and
      the badge logic explicitly skipped the active channel. Unit tests passed because they
      tested the badge store in isolation without the real socket room topology. Only the
      B-6 structural review (reading the room model) caught the dead path. The fix
      required a per-user room on connect (gateway B-2 change) and a dedicated mention event
      (client B-3 change). This is the second confirmed instance of the pattern: a realtime
      fan-out feature whose unit tests pass because they mock or isolate the composed
      routing layer, hiding a broken topology that only topology-aware review or two-client
      wire testing catches. Wave-14 obs-1 recorded the first instance: the typing fan-out
      gateway test mocked PresenceService.getTypers and asserted only that typing:active
      fired, never asserting what a recipient's payload contained; the production broadcast
      composed a single actor-excluded list and sent it room-wide, so every recipient got
      typers:[]. Both instances share the same class: isolated unit tests make the
      component correct in isolation while the composed routing is broken for every
      real client. The two-wave recurrence condition is met; wave-14 obs-1 was held
      explicitly pending a second confirming wave.
    source:
      - process/waves/wave-15/stages/B-6-review-output.md H-1 section
        # "The only message:new events the client receives are for the active channel —
        #  the exact channel the badge logic ignores."
      - process/waves/wave-15/blocks/T/findings-aggregate.md T-8-OBS
        # "two-client mention realtime ALIVE (H-1 fix proven)"
      - process/waves/_archive/wave-14/blocks/L/observations.md obs-1
        # "A mocked service makes isolation correct while the broadcast composition is wrong
        #  for every recipient." — HELD pending second confirming wave.
    severity: strong
    candidate_principles_file: command-center/principles/test-layer-principles/T-2.md
    recurrence: >
      CONFIRMED RECURRENCE: wave-14 obs-1 (typing fan-out: mock bypassed composition;
      unit passed, two-client caught it) + wave-15 H-1 (unread-mention badge: unit tests
      passed on isolated store; structurally dead socket topology, caught at B-6 structural
      review). Both are realtime/socket features where unit isolation made the component
      correct in isolation while the real routing was broken. Two waves. Recurrence condition
      met. T-2.md has 0 rules; cap is clear (first rule this wave).
    near_dup_check: >
      T-2.md Rules: empty (0 rules). T-8.md rule 1 addresses the live prod authz probe
      (per-session verified fixture), not the unit-isolation composition false-green.
      BUILD-PRINCIPLES rule 1 addresses boot-artifact correctness. No near-dup found.
    promotion_gates:
      generalizable: true
        # Applies to any realtime feature (socket.io, SSE, pub/sub) where the routing
        # layer (room join, topic subscribe, fan-out target) is mocked or bypassed in
        # unit tests; the isolation makes the component correct in isolation while the
        # real topology is broken.
      falsifiable: true
        # Checkable at T-2: for every test of a component whose output depends on a
        # socket room or fan-out routing layer, does at least one test use the real
        # routing component (not a mock) and assert what a distinct non-sender recipient
        # receives?
      cited: true
        # B-6-review-output.md H-1 (dead increment path), T/findings-aggregate.md T-8-OBS
        # (two-client proof), wave-14 obs-1 (same class, held for recurrence).
    candidate_rule_shape: >
      1. For any realtime fan-out test, assert what a recipient receives using the real
         routing layer; mocking it makes isolation correct while the composed path is broken.
         Why: A mocked room or topic join makes the component correct in isolation but
         hides a topology bug.
      Rule line = 113 chars (within 120); why line = 69 chars (within 100). No forbidden tokens.

  - id: obs-2
    summary: >
      The autocomplete (B-3) inserted a displayName-derived handle while the server-side
      resolver (B-2) matched against users.username. Had B-4 integration not caught this,
      every autocomplete-selected mention would have silently resolved to no mention rows:
      the autocomplete would insert @Alice Smith (slugified) and the resolver would match
      lower(users.username) against tokens, finding nothing. Karen verified at V-1 that the
      fix closed the chain end-to-end: autocomplete inserts member.username (the canonical
      handle), the resolver matches lower(users.username)=ANY(tokens), and both sides
      case-fold. The class is: two layers built independently agree on a field name but
      emit / match different values for that field; the mismatch is invisible until the
      round-trip is tested. This is the first occurrence of this specific class (cross-layer
      identifier key-value drift caught at B-4 integration). No prior wave observation
      matches this mechanism exactly (wave-12 obs-2 was a type/value import mismatch at
      the bundler boundary; wave-13 obs-1 was a select-without-gate on a soft-delete
      flag; neither is the same as a producer-to-consumer identifier format mismatch).
    source:
      - process/waves/wave-15/stages/B-4-wiring.md drift_defects field
        # "RESOLVED: B-2/B-3 username drift — autocomplete inserted displayName-derived
        #  handle vs resolver matching users.username."
      - process/waves/wave-15/stages/V-1-karen.md Claim 6 section
        # "Chain closure confirmed: picker inserts @<member.username> -> server parser
        #  captures slug -> resolver lower(users.username)=ANY(tokens)."
      - process/waves/wave-15/stages/V-1-jenny.md Spec 2, LOAD-BEARING section
        # "Insert value === resolver key. The token the autocomplete produces is exactly
        #  what the data-plane resolver resolves. Chain is sound."
    severity: warning
    candidate_principles_file: command-center/principles/BUILD-PRINCIPLES.md
    recurrence: >
      First occurrence of this specific class (two independently built layers agree on
      field name but emit/match different values; caught at B-4 integration). HOLD:
      single-wave occurrence. Promote to BUILD-PRINCIPLES if a second wave has a
      cross-layer identifier or key format mismatch where the producer emits X and
      the consumer matches Y on the same nominal field.
    near_dup_check: >
      BUILD-PRINCIPLES rules 1-3: rule 1 (boot-artifact), rule 2 (push-after-stage),
      rule 3 (backfill/create parity). None addresses cross-layer field-value drift
      between a producer and consumer. No near-dup found.
    promotion_gates:
      generalizable: true
        # Applies to any feature with a pick-then-submit or autocomplete-then-resolve
        # chain where two independently built components must agree on the exact key
        # value used for matching; applies across stacks.
      falsifiable: true
        # Checkable at B-4: for any autocomplete/picker that inserts a token matched
        # server-side, does a round-trip integration test confirm the inserted value
        # === the resolver's match key?
      cited: true
        # B-4-wiring.md drift_defects, V-1-karen Claim 6, V-1-jenny Spec 2.
    candidate_rule_shape: >
      4. When a client picker inserts a token that a server resolver matches, verify the
         round-trip at B-4; the inserted value must equal the resolver key exactly.
         Why: Two layers built independently can agree on a field name but emit different
         values.
      Rule line = 111 chars (within 120); why line = 64 chars (within 100). No forbidden tokens.

  - id: obs-3
    summary: >
      The real-Postgres per-test-rollback integration tier for message_mentions has been
      absent for two consecutive waves (task 02fa8011 carried from wave-14 without execution).
      T4-F1 in this wave's findings-aggregate explicitly notes it is a 2-wave running gap.
      V-3 gate-verdict states: "If it recurs a 3rd wave unaddressed, it should escalate to
      a blocking scheduling decision." The gap means no test exercises UNIQUE / ON DELETE
      cascade / index order-by against a real Postgres instance for the message_mentions
      table; the live two-client T-8 probe and C-2 prod-DB verification are load-bearing
      substitutes, but neither is a per-test-rollback integration spec. The observation
      is first surfaced here as an L-2 record (wave-14 observations.md carried no T-4 obs;
      the gap was task-only). The T-4.md rules file has 0 rules; the cap is clear.
    source:
      - process/waves/wave-15/blocks/T/findings-aggregate.md T4-F1 row
        # "No real-Postgres per-test-rollback integration test for message_mentions
        #  (persist/resolve/edit-diff/my-mentions). 2 waves running on the
        #  messaging-integration gap."
      - process/waves/wave-15/blocks/V/gate-verdict.md triage re-classification audit
        # "Disposition is acceptable and explicitly NOT a silent carry: mapped to existing
        #  task 02fa8011 with a bumped 2-wave-recurrence note... If it recurs a 3rd wave
        #  unaddressed, it should escalate to a blocking scheduling decision."
    severity: warning
    candidate_principles_file: command-center/principles/test-layer-principles/T-4.md
    recurrence: >
      Task 02fa8011 carried through wave-14 and wave-15 without execution (2 waves).
      This is the first L-2 observation capturing it; it was a task carry only in
      wave-14. Per V-3 explicit disposition, a 3rd-wave recurrence must trigger a
      blocking scheduling decision (not another task carry). HOLD this wave; if
      02fa8011 remains unexecuted in wave-16 T-4, escalate and promote the T-4 rule.
      T-4.md Rules: empty (0 rules). Cap clear.
    near_dup_check: >
      T-4.md Rules: empty. No near-dup possible.
    promotion_gates:
      generalizable: true
        # Applies to any association table (junction, mention, reaction, etc.) whose
        # UNIQUE constraint, cascade, and index-served ORDER BY are only verified
        # by mocked-unit + live boot-probe and never by a real-Postgres rollback spec.
      falsifiable: true
        # Checkable at T-4: does a real-Postgres integration spec exist for the
        # association table, running per-test rollback, exercising the UNIQUE,
        # ON DELETE cascade, and order-by index?
      cited: true
        # findings-aggregate T4-F1, V-3 gate-verdict triage section.
    candidate_rule_shape: >
      1. Write a real-Postgres per-test-rollback integration spec for every new
         association table; a mocked unit tier cannot catch constraint or cascade defects.
         Why: UNIQUE violations, FK cascades, and index-served ORDER BY only fire
         against a real schema.
      Rule line = 117 chars (within 120); why line = 68 chars (within 100). No forbidden tokens.

  - id: obs-4
    summary: >
      T3-F1: Five new shared Zod schemas (MentionRef, MessageResponse.mentions[],
      MyMentionsResponse, MentionEvent, ServerMember.username) shipped with no dedicated
      parse-valid / parse-invalid contract test. Wave-14 added presence contract tests
      (schema-presence assertions); wave-15 omitted the equivalent for mention schemas.
      The gap is low-risk because the schemas are consumed type-only and never
      runtime-parsed outside the consumer, but the cross-wave pattern is: each wave adds
      shared schemas and the contract-test discipline only partially follows. First
      occurrence of the explicit L-2 observation; wave-14's T-3 finding was not surfaced
      at L-2. Single-wave occurrence of this specific framing.
    source:
      - process/waves/wave-15/blocks/T/findings-aggregate.md T3-F1 row
        # "None of the 5 new/extended shared schemas has a dedicated parse-valid/parse-invalid
        #  contract test. Wave-14 added presence contract tests; wave-15 omitted the mention
        #  equivalent."
    severity: informational
    candidate_principles_file: none
    recurrence: >
      First L-2 observation. No prior wave L-2 file records a T-3 schema-contract-test
      gap. Single-wave occurrence. Hold; promote if a second wave ships new shared schemas
      without parse-valid/parse-invalid contract tests.
    near_dup_check: >
      No existing T-3.md principles file found. No near-dup possible.

  - id: obs-5
    summary: >
      T1-F1: biome.json added a11y.useSemanticElements:off globally to work around the
      WAI-ARIA combobox-with-listbox pattern in MentionAutocomplete, where two inline
      biome-ignore comments were already sufficient. Turning the rule off project-wide
      silences future genuine semantic-element violations. The correct fix is a targeted
      inline suppression at the two combobox sites, not a global flag. Caught at T-1.
      The lint config scope is already fully contained; this observation is informational
      only and does not recur in any prior wave archive.
    source:
      - process/waves/wave-15/blocks/T/findings-aggregate.md T1-F1 row
        # "biome.json:23 added a11y.useSemanticElements: off globally. Justified for the
        #  combobox but turns off project-wide; revert global-off, keep inline ignores."
    severity: informational
    candidate_principles_file: none
    recurrence: >
      First occurrence. Single-wave lint-config scope creep; no prior wave archive
      records this class. Informational note only.
```

---

## Wave-15 L-2 distill disposition

**obs-1 (realtime fan-out unit isolation false-green) — STRONG CANDIDATE for T-2.md.**

Two-wave confirmed: wave-14 obs-1 (typing fan-out mock suppresses broadcast composition
bug; held pending second confirming wave) + wave-15 H-1 (unread-mention badge architecturally
dead socket topology; unit tests passed in isolation; only B-6 structural review caught it).
Both instances: realtime fan-out feature, isolated unit tests pass, real routing broken,
topology-aware check (B-6 structural review or two-client wire test) catches it.

T-2.md Rules: empty (0 rules). No near-dup. Cap clear (first rule this wave for T-2).
Recurrence condition fully met. PROMOTE at karen.

Candidate rule for karen:
```
1. For any realtime fan-out test, assert what a recipient receives using the real
   routing layer; mocking it makes isolation correct while the composed path is broken.
   Why: A mocked room or topic join makes the component correct in isolation but
   hides a topology bug.
```
Rule line = 113 chars (within 120); why line = 69 chars (within 100). No forbidden tokens.

**obs-2 (cross-layer identifier key-value drift, B-4 catch) — HOLD.**

First occurrence of the producer-emits-X / consumer-matches-Y class (autocomplete inserts
displayName-derived token; resolver matches users.username). Caught at B-4 integration.
Wave-12 obs-2 (CJS value import) and wave-13 obs-1 (select-without-gate) are distinct
mechanisms. No near-dup in BUILD-PRINCIPLES. Single-wave occurrence. Hold; promote to
BUILD-PRINCIPLES rule 4 if a second wave has a cross-layer key format mismatch between a
producer and consumer.

**obs-3 (real-PG integration tier absent for message_mentions, 2-wave task carry) — HOLD.**

First L-2 observation for this gap (wave-14 carried it as a task only, not as an obs).
V-3 explicitly set the escalation threshold at wave-16: if 02fa8011 recurs a 3rd wave,
treat as blocking. HOLD this wave. If wave-16 T-4 still shows no real-PG integration spec
for message_mentions, escalate 02fa8011 to seed status AND promote the T-4 candidate rule.

Candidate rule for third-wave qualifying promotion:
```
1. Write a real-Postgres per-test-rollback integration spec for every new association table;
   a mocked unit tier cannot catch constraint or cascade defects.
   Why: UNIQUE violations, FK cascades, and index-served ORDER BY only fire against a real schema.
```
Rule line = 117 chars (within 120); why line = 68 chars (within 100). No forbidden tokens.

**obs-4 (T3-F1: new shared schemas lack parse-valid/parse-invalid tests) — HOLD.**

First L-2 observation. Single-wave occurrence. Hold; promote if a second wave ships new
shared schemas without contract tests.

**obs-5 (T1-F1: global biome lint flag instead of inline suppress) — INFORMATIONAL; NO PROMOTION.**

Single-wave lint-config scope creep. No pattern or principle warranted.

---

## Summary table

| id    | title (short)                                     | severity      | recurrence | disposition                                              |
|-------|---------------------------------------------------|---------------|------------|----------------------------------------------------------|
| obs-1 | Realtime fan-out unit isolation false-green       | strong        | 2 waves    | PROMOTE to T-2.md rule 1 (karen)                         |
| obs-2 | Cross-layer identifier key-value drift (B-4 catch) | warning     | 1 wave     | keep-as-observation; promote if recurs (BUILD-4)         |
| obs-3 | Real-PG integration tier absent (2-wave task carry) | warning    | 2 waves*   | keep-as-observation; escalate + promote if recurs (T-4-1)|
| obs-4 | New shared schemas lack parse contract tests      | informational | 1 wave     | keep-as-observation; promote if recurs                   |
| obs-5 | Global biome lint flag instead of inline suppress | informational | 1 wave     | informational; no promotion                              |

*obs-3 recurrence is task-level (2 waves running); this is its first L-2 observation record.
