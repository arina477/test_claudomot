# T-9 — Journey + Gate — wave-68

**Layer:** T-9 Journey / T-block exit gate · **Head:** head-tester · **Mode:** automatic

## Journey regeneration (REQUIRED — done)
`command-center/artifacts/user-journey-map.md` appended with a wave-68 section:
- **NEW screen:** "Server Settings — Overview" surface (owner-only publish toggle + description/topic edit; gear entry in ChannelSidebar; Roles matrix untouched).
- **NEW route:** `PATCH /servers/:id` (AuthGuard, owner-gated) → updated server.
- **CORRECTED:** `GET /servers/discover` memberCount (was always 0 in wave-67; now the real `server_members` count — no response-shape change).
- **Flow (write-half closed end-to-end):** owner → gear → Overview → toggle publish ON + desc/topic → Save → appears in /discover with correct memberCount + Join → toggle OFF + Save → retracts.
- Per-flow smoke: F1 (settings/profile) + M11 discovery flow both carry ≥1 live T-9 smoke assertion (documented inline). routes_added / screens_added / regressions=none recorded.
- LiveKit media-plane: explicitly N/A this wave (no voice/video surface) — documented boundary, not silently skipped.

Journey commit: `docs(journey): T-9 regen for wave-68` (see gate-verdict for SHA).

## Stage smoke coverage (F1–F9 relevant flows)
- **M11 discovery write-half** (the wave's core): publish→/discover→memberCount-correct→retract — LIVE T-5 PASS.
- **F1 server settings**: Overview surface opens owner-only, pre-populated, saves, reconciles — LIVE T-5 PASS.
- Regression re-confirm: Roles matrix untouched; wave-67 /discover read-half + Join intact.

## Verdict
Gate verdict authored in `process/waves/wave-68/blocks/T/gate-verdict.md` → **APPROVED**.
```yaml
stage: T-9
journey_regenerated: true
journey_commit_msg: "docs(journey): T-9 regen for wave-68"
per_flow_smoke: present   # M11 discovery write-half + F1 settings
livekit_boundary: N/A-documented (no voice/video surface this wave)
gate_verdict: APPROVED
```
