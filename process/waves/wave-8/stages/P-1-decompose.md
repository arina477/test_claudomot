# Wave 8 — P-1 Decompose
- wave_type: multi-spec (4 tasks). design_gap_flag: TRUE-delta (invite-join.html exists → validate/compose; invite-create/share modal reuses primitives).
- Sizing: ~2800 LOC, 4 tightly-coupled tasks (invite-backend → preview+join-API → join-page → create/share-UI). KEEP WHOLE — it's one coherent multi-user-unlock vertical slice; a backend-only half ships nothing a user can do. Both P-0 reviewers concur (not RESCOPE-AUTO-SPLIT). Natural seam (if ever forced): backend [c7443638+77e2041a] vs frontend [72fc08ea+54407e1d] — not needed now.
- Bundle: seed c7443638 (two-tier invite backend, CSPRNG) → 77e2041a (preview[public,minimal] + join[verified-session, atomic max_uses] API) → 72fc08ea (invite-join page) → 54407e1d (invite-create/share UI).
- CARRY TO P-2/T-8 (load-bearing security): (1) CSPRNG unguessable + non-enumerable invite code/token (state min entropy, e.g. ≥128-bit); (2) public preview minimum-summary-only (name + member count, no member list/channels); (3) join requires VERIFIED session; (4) atomic max_uses check-and-increment (no concurrent overshoot). + idempotent re-join (UNIQUE(server_id,user_id)). Owner/member only; NO RBAC/realtime.
- verdict: PROCEED (multi-spec, whole slice, UI delta → D-block).
```yaml
wave_type: multi-spec
design_gap_flag: true
claimed_task_ids: [c7443638-a32f-460c-887f-ecd575f2cede, 77e2041a-198d-48a1-bc95-6900bd03ec44, 72fc08ea-610c-4244-b747-218e3efbc5ae, 54407e1d-1936-458d-b586-0d49d9cf9482]
```
