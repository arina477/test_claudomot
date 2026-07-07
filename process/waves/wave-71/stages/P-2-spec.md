# P-2 — Spec (wave-71) [POINTER]
Spec contract IS tasks row `1193aebf` description (YAML head + prose). wave_type: multi-spec (2 blocks). design_gap_flag: false.
claimed_task_ids: [1193aebf (member-row toggle — PRIMARY), 1c633d2f (GET /blocks enrichment)]
## AC copy
- Spec B (1c633d2f): GET /blocks returns the blocked user's display fields (displayName/username + avatar), listBlocks JOINs the existing member-display source; backward-additive DTO (blockedUser object); no-IDOR unchanged; fallbacks (no displayName→username, no avatar→initials).
- Spec A (1193aebf): member-row Block affordance reflects state (Block↔Unblock, isBlocked from a blocked-id Set built from the SAME GET /blocks fetch — one fetch; reuse the presence/mute live-state pattern); live flip on block/unblock; own-row still suppressed (isSelf); BlockedUsersPanel renders the enriched name+avatar.
Key: ONE GET /blocks fetch drives both the list names AND the member-row Set. REUSE the wave-70 block api client + the member-display JOIN shape. No schema/DM-HIDE change.
