# P-2 — Spec (wave-54) — POINTER

**SoT:** spec contract in `tasks.description` of `c52a7a52-c2da-48d7-ac08-a8d849e9f429` (YAML head + prose).

- **wave_type:** single-spec · **claimed_task_ids:** `[c52a7a52]` · **design_gap_flag:** false
- **Scope:** verify-and-harden (NOT a leak fix — class already closed). (A) per-WS-gateway negative regression-lock tests (study-timer, messaging, presence) proving malformed non-UUID id → generic non-leaking + still-denied; (C) one canonical generic error-string constant shared across gateway rejection catches. (B) isUuid defense-in-depth DROPPED at P-0. No shared WS-filter, no REST, no schema.
- **6 ACs:** timer regression / messaging regression / presence regression / explicit leak-token-absence + still-denied assertions / canonical error-string constant / no production regression.
- **Security:** T-8 verifies the class stays closed (the regression tests ARE the T-8 evidence).
