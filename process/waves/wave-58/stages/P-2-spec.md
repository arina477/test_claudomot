# P-2 — Spec (wave-58) — POINTER
SoT: tasks.description of a1dda389. single-spec [a1dda389]; design_gap_flag false.
Scope: convert the pass-regardless soft-check of cross-client message:deleted fan-out (delete-any-message.spec.ts:146-162) → a deterministic race-free hard assertion: await B's channel-join ack BEFORE A deletes, then hard-expect B's tombstone in a bounded retried window. Test FAILS if B misses the fan-out. RBAC/IDOR steps unchanged. Test-only.
