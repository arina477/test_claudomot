# Wave 25 — P-0 Frame

## Discover section
- **wave_db_id:** b0a1e114-c51b-4410-8a5c-95b36d6a6635 (wave_number 25, running).
- **Prior-work citation:** seed origin wave-15 V-2 (M-2 + M-4, @mentions); re-homed M3 debt (M3→M4→M5). The wave-24 real-PG integration tier (pg-harness.ts) is available for part-2's rollback test.
- **Roadmap milestone:** M5 (a5232e16) in_progress. Class=product-feature, Tier=T3. wave row milestone backfilled = M5.
- **Spec-contract short-circuit:** no-prior-spec (full P-1..P-3).
- **Product-decision:** none Tier-3 (correctness debt).

## Reframe section
**Original framing:** c18b8089 — (1) align the client MessageList tokenizer to the server parseMentions grammar (interior-punctuation handles @bob.dev render as plain text client-side); (2) wrap editMessage's mention-diff (delete-then-insert) in a transaction.

**problem-framer:** PROCEED. Both premises VERIFIED in code:
- Server `parseMentions` (apps/api/src/messaging/mentions.ts:35): `/(?:^|\s)@([a-zA-Z0-9_-]+)/g` — slug EXCLUDES `.`. `@bob.dev` → resolves+persists `bob`.
- Client `renderBodyWithMentions` (apps/web/src/shell/MessageList.tsx:559-565): splits on `/(@\S+)/`, strips only trailing punct, looks up the whole run `bob.dev` in the server's mentions[] map (keyed `bob`) → key miss → renders `@bob.dev` as PLAIN TEXT. Cosmetic, no false pill, no security.
- `editMessage` (messages.service.ts:668-721): UPDATE + DELETE message_mentions + INSERT as 3 UNWRAPPED db calls (no transaction), while createReply (:1031) + reply-delete (:839) in the same file DO wrap — precedent exists.
- Cause-level note: client isn't a re-parser; it trusts the server's mentions[] map + only segments the display string. The real bug is a token-boundary mismatch (the client uses a SUPERSET key). Minimal correct fix = the client extracts the same `[a-zA-Z0-9_-]+` slug. The DEEPER anti-drift fix = export the shared slug regex/constant to packages/shared (NOT a full tokenizer framework — that'd be premature abstraction for 2 consumers). matched_antipatterns: [].

**ceo-reviewer:** SCOPE-EXPANSION — extract the mention grammar (the slug regex) to packages/shared so client + server import ONE source of truth (structurally prevents the re-drift that survived 4 milestones), ~1.2× cost, no new package (packages/shared already houses shared Zod). Behavior-preserving extraction ONLY (mentions.spec.ts stays green as regression guard); hand-sync fallback if the client renderer's grammar entangles + clean extraction balloons past the size class. Keep the Resend-key escalation LOUD into P-4 (still the SOLE M5-close blocker). Correct priority pick (mention-parity is the only candidate with a present-tense user-perceivable symptom; invite-rotation d058283d has 0 blast radius at 0 servers).

**mvp-thinner:** OK (floor_constraint_active — whole wave ~60-110 LOC, way under the single-spec floor; any split leaves residual below floor). Parts 1+2 coherent ("a mention resolved once stays consistent everywhere" — client-render half + server-persist half). Re-homed M3 debt, NOT M5 mvp-critical scope (rides under M5 as active milestone). Flags: a FULL tokenizer framework = gold-plating for 0-user debt (belongs in a future slice) — but since OK not THIN, no mediation tie; informational. Keep OUT: exhaustive grammar edge cases beyond @bob.dev, grammar rewrite, pill redesign.

**Mediation outcome:** ceo-reviewer SCOPE-EXPANSION + mvp-thinner OK (no precedence-tie) + problem-framer PROCEED. All three converge on the MINIMAL form: extract just the shared SLUG REGEX/CONSTANT to packages/shared (problem-framer's "not a framework" + ceo-reviewer's durable one-source-of-truth + NOT mvp-thinner's flagged full-framework gold-plating). Orchestrator ACCEPTS the minimal SCOPE-EXPANSION. Stays within seed c18b8089 scope ("align client to server grammar" — done via a shared constant, not hand-sync). No new sibling; claimed_task_ids = [c18b8089].

**Disposition:** PROCEED (with accepted minimal SCOPE-EXPANSION).

**Final framing for P-block:** (1) Extract the mention SLUG grammar (the `[a-zA-Z0-9_-]+` handle regex/constant) to packages/shared; the server parseMentions AND the client renderBodyWithMentions both import it — behavior-preserving (mentions.spec.ts stays green), so `@bob.dev` tokenizes identically both sides (→ consistent pill/plain-text). Hand-sync fallback if extraction entangles. (2) Wrap editMessage's mention-diff (UPDATE + DELETE + INSERT message_mentions) in db.transaction() (mirror createReply's pattern) so a partial failure can't leave inconsistent message_mentions — add a real-PG rollback integration spec on the wave-24 harness (create-server-rollback pattern; CI-PRINCIPLES rule 5: assert it executed). design_gap_flag expected FALSE/token-level (existing MessageList pill component; tokenizer is logic). Keep OUT: grammar rewrite, exhaustive edge cases, pill redesign. Resend key stays loud (SOLE M5-close blocker).

## Exit
Discovery + reframe complete. Scope = [c18b8089: shared-slug-grammar extraction (client↔server parity) + editMessage txn wrap + real-PG rollback spec]. → P-1 Decompose.
