# Wave 40 — T-5 E2E — SKIP
No user-visible FLOW change (the 500→4xx is malformed/edge-input API robustness, not a user-facing flow — a NUL-byte userId is not a normal user action). Happy-path avatar UI reachability was E2E-verified in wave-39. The behavior change is verified live at C-2 smoke (%00→400, non-UUID→404) + T-8.
