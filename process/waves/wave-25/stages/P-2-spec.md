# Wave 25 — P-2 Spec (pointer)
**Spec contract in DB:** `tasks.description` of seed `c18b8089` (single-spec YAML head + prose). wave_type=single-spec. claimed_task_ids=[c18b8089]. design_gap_flag=false.

## ACs (6)
1. Extract the mention slug grammar ([a-zA-Z0-9_-]+) to a single exported constant in packages/shared; server parseMentions imports it (behavior-preserving, mentions.spec.ts green).
2. Client renderBodyWithMentions imports the SAME shared grammar → @bob.dev (server-resolved) renders as a PILL (was plain text) — client/server agree on token boundaries.
3. Server-unresolved handle → still plain text (no false pill) — grammar governs tokenization only; pill-vs-plain still driven by the server mentions map.
4. editMessage mention-diff (UPDATE + DELETE + INSERT message_mentions) wrapped in db.transaction() (mirror createReply) — partial failure rolls back, no inconsistent state.
5. Real-PG rollback integration spec on the wave-24 harness asserts editMessage rolls back atomically (0 partial message_mentions); ACTUALLY executes in CI (CI-PRINCIPLES rule 5, no false-green).

## Out of scope
Grammar rewrite / exhaustive edge cases / full tokenizer framework (just the slug constant) / pill redesign / reminders (cred-blocked; M5-disposition decision surfaced to founder).

→ P-3 Plan.
