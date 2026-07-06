# P-2 — Spec (wave-57) — POINTER
SoT: tasks.description of ff09c4c9. single-spec [ff09c4c9]; design_gap_flag false.
Scope: ServerRail selectServer + Home must clear dmHomeActive on first click (AppShell passes an onExitDmHome callback; reset must not depend on selectedId changing so re-selecting the current server also exits). + component test (single-click DM→server + DM→Home exit). No schema/backend/design surface.
