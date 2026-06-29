# Wave 10 — P-1 Decompose
- wave_type: multi-spec (4 tasks). design_gap_flag: TRUE (role-mgmt UI in server-settings; server-settings.html exists → roles-tab delta).
- Sizing: ~3000-3800 LOC, the BIGGEST M2 wave (upper edge of one wave). Decision: KEEP WHOLE. It's a required dependency chain (RbacModule+can() → channel-overrides+guard → owner-lockout → UI); splitting ships a half-RBAC (foundation without channel-gating = the success metric "channels per role" UNMET; UI without its API = unreachable). Both P-0 reviewers concur (NOT RESCOPE-AUTO-SPLIT; required chain). Prior M2 waves shipped ~2800 LOC fine; ~3800 is larger but coherent + access-control-integrated (the guard/can()/UI are interdependent — integrate, don't fragment). If B proves too big, the ONLY defensible seam (problem-framer): A=foundation[35f191f4]+owner-lockout[7a10f13d], B=channel-overrides[2c927c44]+UI[0b9bcf35] — not needed now.
- Bundle: seed 35f191f4 (RbacModule: roles+can()+CRUD+assignment) → 2c927c44 (channel-perm-overrides+ChannelPermissionGuard) + 7a10f13d (owner-lockout) → 0b9bcf35 (role-mgmt UI).
- CARRY TO P-2/T-8 (RBAC = access control, highest-stakes): server-side can() everywhere (IDOR); guard route-params-only (body-spoof); explicit DEFAULT-DENY; TRANSACTIONAL owner-lockout (concurrent-demote race); role-assignment authz (no self-promote); server-side channel-LIST filtering (no enumeration). single-role-per-member (#6). table name channel_permission_overrides. Verified-prod-fixture 4a2ad286 critical for B live-verify.
- verdict: PROCEED (multi-spec, whole, UI → D-block).
```yaml
wave_type: multi-spec
design_gap_flag: true
claimed_task_ids: [35f191f4-2b63-4c8b-bf7e-a5c074310ec6, 2c927c44-0b29-485d-9640-33401624b973, 7a10f13d-413f-46a2-a006-f60c0ab529f2, 0b9bcf35-a6f1-40df-9da3-e9135307b900]
