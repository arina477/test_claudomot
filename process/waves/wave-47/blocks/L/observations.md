# Wave 47 — L-block observations ledger

Append-only. L-2 Distill (karen) reads these; promotes to `*-PRINCIPLES.md` ONLY when an observation recurs across 2+ waves AND head-verifier approves (max 1 rule/file/wave). Single-wave observations stay here until a second wave confirms.

## V-block observations (seeded by head-verifier at V-3 end-of-life)

- **[V-2 triage — candidate for VERIFY-PRINCIPLES if it recurs]** A scope-fenced INFO improvement (e.g. adding a LIMIT to a live, defect-free query) floated as a cheap fast-fix should be DECLINED into a non-blocking task row, not pulled into the V-3 fast-fix loop. Rationale: the fast-fix loop is for BLOCKING findings; adding an unrequested change to a shipped live surface with no defect behind it is unscoped-green-by-addition and erodes the loop bound. Candidate rule shape: "Decline scope-fenced non-defect improvements from the fast-fix loop; route them to non-blocking task rows." — NOT promoting this wave (single occurrence; VERIFY-PRINCIPLES promotion requires 2+ waves per its Contract).

- **[V-2 non-blocking rows — already covered by memory note, not a new rule]** V-2 milestone-scoped follow-ups intended as future N-2 seeds must carry `wave_id = NULL` (provenance in prose), else they strand and can never be picked as a seed. Already captured in project memory (`v2-milestone-followup-wave-id-must-be-null-for-n2-seed`). Applied correctly this wave (all 3 rows `wave_id IS NULL`, DB-verified). No net-new rule.

- **[V-1 reviewer-false-negative probe — reinforces existing discipline, not net-new]** Both Karen + jenny APPROVE on a non-trivial change was probed, not accepted at face value: verdicts were evidence-backed (quoted WHERE clauses + line numbers from Karen; live click-path + network captures + screenshots from jenny), and the fresh head-verifier re-verified independently via `git show` at the merge SHA rather than trusting the summary. No net-new rule; existing VERIFY-PRINCIPLES rule 3 + the always-on probe already cover this.

## Wave-47 net-new principle promotions proposed: 0
All V-block lessons this wave are either single-occurrence (hold for a 2nd wave) or already encoded (memory note / existing rules). Zero-promotion is the expected default.
