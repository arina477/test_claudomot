# Wave 85 — P-2 Spec (pointer)
**Source of truth:** task 3ad35a42 description. spec-id wave-85-spec · single-spec (ui) · design_gap_flag false · claimed [3ad35a42].
## ACs (copy)
1. Successful toggle unchanged.
2. Failed toggle restores the CAPTURED prior status (snapshot before flip), NOT the assumed-opposite.
3. Failed toggle surfaces a user-facing message via the existing onAnnounce channel (replacing console-only), naming the failure.
4. Announce exactly once (no double-announce); console.error may remain for debug.
5. No new component — reuse onAnnounce. (Shared visible-toast across all sites = spun-out task 3b878f96, not this wave.)
Single card (AssignmentCard = unique assume-opposite offender). ~40 LOC.
