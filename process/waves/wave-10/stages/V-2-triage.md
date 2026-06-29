# Wave 10 — V-2 Triage (Karen REJECT → classify; head-verifier adjudicates V-3)
| Finding | Sev (recon) | Bucket | Proposed disposition |
|---|---|---|---|
| createServer no default-role seed | Med-High | FAST-FIX | seed a default 'Member' role in the createServer txn (like wave-7 seeded category/#general) — small; makes roles work on new servers. |
| deleteRole no still-assigned guard | Med | FAST-FIX or re-spec | add a still-assigned block (or formally accept FK set-null demotion) — small. |
| member-list for role-assignment (no GET members) | Med | DEFER→M3 | the assign-role UI needs a member list; M3 (messaging/members) needs GET /servers/:id/members anyway — carry to M3 onboarding (jenny). |
| guard + owner-lockout wired to no live route | Low | DEFER→M3 | spec-anticipated M3 forward primitives (M3 reuses the guard + needs leave/remove routes); record deferred. |
| test-count claim (270 vs ~175/46) | doc | note | accuracy correction only; not code. |
```yaml
findings_blocking: [createServer-no-seed, deleteRole-no-guard]   # head-verifier confirms fast-fix
fast_fix_candidates: [createServer-default-role-seed, deleteRole-assigned-guard]
defer_to_M3: [member-list-endpoint, guard/owner-lockout route-wiring]
