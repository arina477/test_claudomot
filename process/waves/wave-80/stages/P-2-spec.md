# Wave 80 — P-2 Spec (pointer)

**Source of truth:** task 3038a4bc `tasks.description` (YAML head + `---` + prose). single-spec.
- **claimed_task_ids:** [3038a4bc] · design_gap_flag: false

## AC digest
- Working "show my presence/last-seen" toggle on SettingsPrivacyPage (REAL, not disabled-Beta — presence is live); persists + round-trips.
- show_presence=false → presence service does NOT broadcast the user's online/offline to co-members (TWO-CLIENT proof: A off → B no longer sees A online).
- show_presence=true default → no regression; hidden user still sees others' presence (own-visibility only); toggle writes a privacy-audit event.
- sendReadReceipts NOT shipped (deferred to 12f6135e; no-op toggle forbidden per whoCanDm-Beta precedent).
- Contract: privacy.ts +showPresence boolean; users.show_presence boolean NOT NULL DEFAULT true (migration, no backfill); presence.gateway honor.

## LOAD-BEARING: two-client honor test; audit event; showPresence-only.
