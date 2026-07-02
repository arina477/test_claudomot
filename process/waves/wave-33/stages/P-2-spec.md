# Wave 33 — P-2 Spec (pointer)
**Source of truth:** YAML head + prose in `tasks.description` for row **a2dd9f3d-1b93-4dfc-a6a8-5afded4a3354**. Convenience copy.
- **wave_type:** single-spec · **claimed_task_ids:** [a2dd9f3d] · **design_gap_flag:** FALSE (D-block skips → B)

## ACs (copy)
1. Authed request + malformed (non-UUID) UUID route param → 400 (not 500), before any DB access.
2. GET /channels/:channelId/voice/participants + non-UUID channelId → 400 (F-32-T-8-1 instance).
3. POST /channels/:channelId/voice/token + non-UUID channelId → 400 (wave-31 twin).
4. ≥1 NON-voice route (e.g. /channels/:id/messages or /servers/:id/*) + malformed id → 400 (proves root-cause convention, not a 2-route patch).
5. 400 body = clean generic Bad-Request envelope; no stack/DB-error/state leak.
6. Valid-UUID requests UNCHANGED (200/401/403/400-non-voice/503/404 all preserved). No regression.
7. Auth boundary unchanged: unauth + malformed → 401 (guard first).

## Scope / mechanism
Bounded root-cause: ONE global mechanism (P-3 picks: invalid-uuid-cast [22P02/QueryFailedError] → 400 filter, VS global/param ValidationPipe). Fixes all ~30 UUID params across 7 controllers at once; 500→400 only, no other behavior change. keep-OUT: no 30-param manual sweep, no broad error-normalization, no fuzz battery.

## Security → T-8 re-probe (malformed-input + voice authz matrix). Credential-independent.
## N-block: park-or-key MANDATORY (no cred-independent M6 work left after this).
→ P-3 Plan.
