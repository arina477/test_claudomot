# Wave 77 — V-1 Independent reviews (summary)

Karen + jenny spawned in parallel, no shared context. Both APPROVE. Wave-77 (M13 leg-2 portable academic identity, LIVE 633f362e) verified on both axes: source-claim truth (Karen) + spec-semantic conformance (jenny).

## Karen (source-claim) — APPROVE
6/6 claim groups verified, 0 REJECT, 0 antipatterns.
- Files: all 9 claimed exist on merge tree 633f362e.
- Exports: ProfileVisibilityService (resolve/sharesServer/toPublicProfile), PublicProfileSchema+PublicProfile+ACADEMIC_ROLES, GraduationCapIcon/UserIcon — present.
- Routes: GET/PATCH /profile + GET /profile/:userId registered+guarded; unauth /profile/:uuid→401 (missing route→404 control proves 401 genuine).
- Migration: **directly re-verified via psql** against yamanote.proxy.rlwy.net:40008 — all 6 academic cols present nullable (did not just trust C-2).
- Deploy hash: Railway api+web both SUCCESS at exactly 633f362e.
- Antipatterns: none — resolver genuinely branches on PROFILE_VISIBILITY with fail-closed HIDDEN default; integration spec runs 13 REAL assertions vs live pg (incl. garbage-value fail-closed + email-absence).

## jenny (spec-semantic) — APPROVE
3 findings, all LOW/INFO, 0 DRIFT / 3 GAP, 0 blocking (all already documented at T-9).
- Self API round-trips all 6 fields; 409-username-collision preserved; SessionNoVerifyGuard.
- Bounds enforced server-side (pronouns≤40/bio≤500/inst·prog≤120/year≤40/role enum); exact-max passes; PublicProfile never contains email.
- Crown-jewel privacy proven LIVE: everyone→visible, nobody→404, server-members co-member→visible, self→visible, block bidirectional both directions (restore on unblock), uniform-404 byte-identical across nobody/nonexistent/malformed/blocked. Stranger-not-shared + soft-deleted + fail-closed-unknown backed by real-pg 13-case matrix on the actual resolver (correct server_members EXISTS idiom, not listServerMembers shortcut).
- Editor persists across reload; MemberProfileCard renders academicRole plain-text (no verification badge), no email, graceful hidden state, Esc dismiss+focus-restore.
- Prod left clean (fixtures restored to 'everyone', blocks removed, fields cleared).

## Findings → V-2
- F-J1 (LOW): academicRole can't be cleared to NULL once set; editor empty `<select>` is a dead affordance (server 400 on empty). [same as T-8 LOW]
- F-J2 (LOW): card shows identical copy for genuinely-hidden vs transient network error (accurate+non-leaking for hidden case; carried from B-3). [same as T-8 LOW / V-block carried escalation]
- F-J3 (INFO, positive): malformed non-UUID :userId→uniform 404 (stronger anti-oracle; avoids non-UUID→500 class).

```yaml
karen_verdict: APPROVE
karen_findings_count: 0
karen_false_positives_documented: 0
jenny_verdict: APPROVE
jenny_findings_count: 3
spec_drift_count: 0
spec_gap_count: 3
jenny_false_positives_documented: 0
findings:
  - {id: F-J1, sev: low, kind: spec-gap, desc: "academicRole not NULL-clearable once set; editor empty select is dead affordance (400 on empty)"}
  - {id: F-J2, sev: low, kind: ux, desc: "member card same copy for hidden vs transient network error (non-leaking; carried from B-3)"}
  - {id: F-J3, sev: info, kind: positive, desc: "malformed non-UUID :userId → uniform 404 (anti-oracle strength)"}
```
