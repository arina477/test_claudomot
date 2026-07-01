verdict: OK
verdict_source: mvp-thinner
milestone_id: a5232e16-62d5-4a7b-8fdb-3f7ceda9d09d
milestone_title: M5 — Academic tooling: assignments
milestone_class: product-feature
milestone_success_metric: |
  An organizer posts an assignment with a due date; members see it alongside
  chat, mark it done, and get a reminder before it is due.
mvp_critical_status: |
  All M5 mvp-critical (assignments) scope is DONE. The assignments spine is LIVE:
  implement CRUD + per-member status (01fcefb8, done), assignments-panel + assignment-card
  (916ecff7, done), CRUD/status test coverage (a5f25f9b, done), manage_assignments RBAC
  split (8aa67564 + edbdea8f, done). This wave's seed (c18b8089) is NOT M5 mvp-critical
  scope — it is re-homed M3 messaging-correctness debt, twice-migrated (M3 closure → M4
  → M5, per product-decisions.md lines 237/249/258/276) as top-level backlog
  (parent_task_id NULL, wave_id NULL). It rides under M5 only because M5 is the active
  milestone that N-2 surfaced it into; it does not advance M5's success metric.

ok_rationale: |
  Two things make this OK rather than THIN. (1) Coherence: the seed's two parts ARE one
  coherent "mention correctness" unit despite touching different layers. Both close
  divergences between the client and server treatment of the SAME grammar/data — part 1
  aligns the client MessageList tokenizer to the server parseMentions grammar (render
  parity), part 2 makes the server's editMessage mention-diff atomic (delete-then-insert →
  transaction, so a partial failure can't leave message_mentions inconsistent with what the
  client will re-tokenize). They are the client-render and server-persist halves of "a
  mention resolved once stays consistent everywhere"; splitting them scatters one small
  correctness concern across two waves for no benefit. (2) Both parts trace identically to
  M5's success metric (neither touches assignments), so the trace test cannot rank one
  in-scope and the other out — thinning here would either cut the whole (orthogonal) wave,
  which is P-1/N-2's call not mine, or split a coherent 2-part debt fix in half. Neither is
  a legitimate THIN. Every remaining AC is minimal-coherent.
floor_constraint_active: true
floor_constraint_detail: |
  Independently of the coherence finding, the floor blocks any split. Both parts are tiny:
  part 1 (client tokenizer alignment to an existing server grammar + a handful of parity
  unit tests) ≈ 40-80 LOC; part 2 (wrap an existing delete-then-insert in a transaction +
  one failure-path test) ≈ 10-30 LOC. Current wave LOC estimate ≈ 60-110 total. Splitting
  the smaller half (part 2) into a sibling would leave residual ≈ 40-80 LOC; splitting the
  larger half leaves residual ≈ 10-30 LOC. Either residual is far below the single-spec
  minimum floor (1,500 LOC per P-1-decompose § Minimum size floor). The whole wave is
  already a sub-floor correctness-debt slice; peeling anything off produces two sub-floor
  fragments where one exists now. Floor refuses the split; OK stands.

# Flags for head-product merge (mvp-thinner does not own these lanes):
#
# 1. CEO-REVIEWER EXPANSION LANE (shared-tokenizer extraction) — NOT mine to propose,
#    flagging only. If ceo-reviewer proposes extracting a shared tokenizer to
#    packages/shared (single grammar consumed by both client render + server parse, the
#    durable anti-drift fix in place of hand-syncing the client), my read is that it is
#    gold-plating for THIS wave: it is a 0-user internal-consistency debt fix on a divergence
#    that is already "no false pill, no security issue" (seed's own words). A shared-package
#    extraction pulls in cross-package build/import wiring + migrating the server parser to
#    consume it — durability the current blast radius does not earn. If head-product still
#    wants the durable fix, it is a SEPARATE future slice, not an in-wave expansion of this
#    debt seed. Under the P-0 mediation-precedence rule, mvp-thinner would NOT be conceding
#    a THIN here (I returned OK), so there is no ceo-reviewer-vs-mvp-thinner tie to mediate —
#    this is purely informational.
#
# 2. GOLD-PLATING TO KEEP OUT (if it appears at P-1/P-2 sizing): exhaustive mention-grammar
#    edge cases beyond the named interior-punctuation divergence (@bob.dev); any full
#    mention-grammar rewrite; any redesign of the mention-pill component. The seed names ONE
#    divergence + ONE atomicity gap — scope stays exactly there. These are not ACs the wave
#    proposes today; noted so they are not silently added during spec.
#
# 3. NOT AN mvp-thinner CALL, flagging for head-product: whether M5 should absorb orthogonal
#    messaging debt at all is a roadmap/N-2 question, not an AC-thinness question. I did not
#    propose moving this AC across milestones (forbidden to me). The re-homing precedent is
#    already logged (product-decisions.md 237/249/258/276).

sibling_visible: false
