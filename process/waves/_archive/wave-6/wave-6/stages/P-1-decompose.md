# Wave 6 — P-1 Decompose
- wave_type: single-spec (1 task: da242f6b). design_gap_flag: false (CI-config only; no UI, no schema, no API contract).
- Size: small (~1 ci.yml job + maybe a tiny wait-for-health script). BELOW the single-spec LOC floor, BUT RESCOPE-AUTO-MERGE has NO mergeable siblings: the other open M1 items are founder-blocked (84e09891 avatar creds, a1299e88 Resend DNS) — can't bundle founder-action tasks into an engineering build wave. → ship as a focused single-task CI-safety wave (floor-override justified: coherent, high-leverage, no available merge partner; the floor guards against wasteful tiny waves, not against a genuinely-scoped safety net that has no sibling).
- verdict: PROCEED (single-spec, override-tiny-with-reason).
