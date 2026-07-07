verdict: OVER-CUT
verdict_source: mvp-thinner
milestone_id: 6a9424fe-c943-4b26-9110-6915661a6fb9
milestone_title: M14 — Trust & Safety: moderation for public discovery
milestone_class: product-feature
milestone_success_metric: |
  Before the founder-reserved public launch of the server directory: (1) any student
  can report any publicly-listed server, member, or message; (2) a report resolves
  through a working action loop — in-server takedown (remove / timeout / message-delete
  via `moderate_members`) AND directory-level unlist (abusive public server removed from
  `GET /servers/discover`); (3) a user can block another user, hiding the blocked user's
  DMs and content. Measurable gate: 100% of publicly-listed servers are reportable and a
  report → action → resolution path is verified end-to-end. This IS the public-launch gate.
mvp_critical_status: |
  All 4 mvp-critical Scope legs are DONE (7 done child tasks): report substrate +
  directory unlist (9f2bb017), block substrate + block/unblock/list endpoints + DM-hide
  predicate (bc5986a9), shared block Zod contracts (c8c9742a), block UI + settings list
  (6e4d56b2), student report UI + owner inbox (96d5ed58), report-action loop reusing
  ModerationService (d7250881), self-row Report suppression (cc783559). Every success-metric
  clause (1)/(2)/(3) is already satisfiable in the shipped LIVE code. The only two open
  child tasks (1193aebf, 1c633d2f) are both wave-70 V-1 UI-drift follow-ons on the
  already-shipped Block feature — nice-to-have UX polish, not mvp-critical gates.

over_cut_rationale: |
  This 2-task bundle is already the minimum coherent slice — there is nothing thin to peel
  off. Strict trace test on both proposed ACs returns "metric still satisfiable if absent":
  (a) SEED 1193aebf (member-row Block↔Unblock toggle) — the block LANDS, the settings/privacy
  list and server-side truth are correct, and unblock already works via settings; the missing
  toggle is affordance-consistency, not a break of success-metric clause (3). (b) SIBLING
  1c633d2f (enrich GET /blocks with name+avatar) — the blocked-users list renders today
  (UUID fallback) and block/DM-hide works; this is display polish, not a metric gate. By the
  trace test both are nice-to-have. But mvp-thinner NEVER shrinks a wave: peeling either/both
  leaves NO mvp-critical residue in the current wave (M14's mvp-critical set is 100% done),
  so a THIN split is structurally impossible — the residue would be empty, and both tasks are
  already sibling-shaped (wave_id=NULL, parent_task_id=NULL under M14). The correct move is the
  OPPOSITE of thinning: the seed ALONE (~30-50 LOC, one affordance-state fix) is too thin to be
  a coherent standalone wave. Fold the enrichment sibling 1c633d2f IN to form one coherent
  "finish the Block UI polish" slice — exactly the P-1 RESCOPE-AUTO-MERGE the framer flagged.
  No new scope should be invented: these two wave-70 V-1 UI-drift follow-ons ARE the entire
  residual Block-UI polish surface; together they are the coherent minimum-and-maximum slice
  before the founder public-launch GO. Recommendation to head-product: accept the seed+sibling
  merge (P-1 owns the RESCOPE); do NOT add further scope, do NOT split.

ok_rationale: |
  n/a
floor_constraint_active: false
floor_constraint_detail: |
  n/a — no THIN was attempted; the wave has no mvp-critical residue to split against.
  Floor-awareness note for the record: even the merged 2-task bundle (~30-50 LOC seed +
  a small JOIN/DTO enrichment + render) sits well below the multi-spec floor (>2,500 LOC OR
  ≥6 specs). This is the same legitimately-small, high-value, reuse-heavy completion-wave
  pattern the wave-50 P-1 decision flagged as a floor override-ship case; sizing/floor
  disposition is P-1's authority, not mvp-thinner's. mvp-thinner's only structural point is:
  do not peel — merge.

sibling_visible: false
