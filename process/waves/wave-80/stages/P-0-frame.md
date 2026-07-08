# Wave 80 — P-0 Frame

## Discover section
- **wave_db_id:** f535d74a-28dc-4513-b1d2-e9bc731dcc72 (wave_number 80; milestone_id backfilled → M13 b7400254)
- **Prior-work citation:** M13 leg-1/2/3a shipped (educator console, portable identity, E2E encryption). Reuses the shipped privacy.service (profileVisibility + whoCanDm + AppendPrivacyEventService audit), the presence service (presence.gateway online/offline broadcast), SettingsPrivacyPage.
- **Roadmap milestone:** M13 in_progress — leg-3b (last authored leg; after this → founder-disposition point). ## Class product-feature.
- **Spec-contract short-circuit:** no-prior-spec (decomposer prose).
- **Product-decision resolutions:** SCOPE-HOLE resolved by reframe (below). Logged to product-decisions 2026-07-08.

## Reframe section
- **Original framing:** single task 3038a4bc — read-receipt + presence privacy toggles (sendReadReceipts + showPresence booleans + columns + honor emit paths + 2 toggles on SettingsPrivacyPage).
- **Scope-hole (verified against code by all 3 reviewers):** StudyHall has **NO message read-receipt feature** — schema `read_at` is on notifications (tray read/unread), NOT a sender-visible message "seen-by". `sendReadReceipts` gates a nonexistent feature. `showPresence` gates the EXISTING presence service (presence.gateway online/offline broadcast, currently ungated at the user level).
- **problem-framer: REFRAME → (a) descope** — option (b) no-op toggle = security theater (hard flag; a control that lies about privacy is worse than absent); option (c) build-read-receipts = unratified multi-task expansion. One honest toggle beats a two-toggle wave where one lies. PRODUCT rules 1+2 fire on the false-present premise.
- **ceo-reviewer: SELECTIVE-EXPANSION (net descope)** — DECISIVE: StudyHall's OWN convention already answers it — whoCanDm ships DISABLED as a "Beta Feature" affordance (pointerEvents:none) because its enforcement surface isn't built. No-op toggle is off the table by PRECEDENT. showPresence = honest parity win reusing shipped substrate; closes the last M13 leg → disposition point. Read-receipts (c) too ambitious for a settings leg (standalone subsystem, Discord-parity not the wedge, no demand evidence) → defer.
- **mvp-thinner: THIN** — split sendReadReceipts (+ read-receipt feature) out; ship showPresence. showPresence-alone is a complete honest AC (NOT OVER-CUT — stands as a wave). SettingsPrivacyPage's own binding comment: a control gating a nonexistent surface "must not look like a working toggle."
- **Mediation:** unanimous descope. No conflict.
- **Disposition:** **REFRAMED (descope)** — this wave ships **showPresence only**.
- **Applied:** task 3038a4bc retitled "Add a presence (last-seen) privacy toggle to settings" (claimed task narrows to presence-only); deferred read-receipts subsystem + toggle → new M13 seedable sibling **12f6135e** (wave_id NULL). Decision logged.
- **Final framing:** ship one honest privacy control — a presence/last-seen toggle that excludes the user from the presence broadcast when off.

### Binding refinements carried to P-1/P-2 (LOAD-BEARING)
1. Scope = `showPresence` ONLY. Do NOT ship sendReadReceipts (not even a stored no-op — anti-theater; matches the whoCanDm-Beta precedent).
2. One column `show_presence boolean NOT NULL DEFAULT true` on users; one field in UpdatePrivacySchema + PrivacySettingsResponseSchema.
3. **Mandatory honor point (the whole wave):** presence emit paths (presence.gateway ~163/174/221) exclude `show_presence=false` users — proven with a **two-client** acceptance test (single-client = coverage theater; T-5/T-4).
4. Toggle change writes a privacy-audit event (AppendPrivacyEventService), consistent with the existing pattern.
5. P-1 floor: showPresence-only is ~300-500 LOC → likely below the single-spec >1,500 floor → RESCOPE-AUTO-MERGE / rule-5 waiver (mvp-thinner returned THIN with no further valid split — the remaining slice is an honest minimum; do NOT re-admit the dishonest toggle to pad LOC).
6. N-1: after this ships, M13 reaches a founder-disposition point — surface to founder/BOARD, do not auto-close.

**claimed_task_ids:** [3038a4bc-8eeb-49aa-ab3c-096e1ff5b8e1]
