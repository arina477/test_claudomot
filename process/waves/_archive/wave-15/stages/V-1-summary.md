# Wave 15 — V-1 Summary
- **Karen APPROVE** — 7/7 VERIFIED. Files/routes/migration/deploy all real. The 2 load-bearing checks PASS in code: (a) username-resolution chain CLOSES — autocomplete inserts member.username (MentionAutocomplete:199-203, null filtered), ServerMember.username (servers.ts:62), listServerMembers selects it (servers.service:241), parser lowercases tokens (mentions.ts:41), resolver lower(users.username)=ANY (messages.service:178-183) — both ends lowercase, F-4-class trap AVOIDED. (b) mention realtime genuinely wired: user:<id> room join (gateway:107), mention.created per recipient + self-exclusion (service:335-347), fan to user-room (gateway:240). No gold-plating (@everyone/notif-inbox OUT). No coverage theater.
- **jenny APPROVE** — 3/3 specs MATCH, NO DRIFTS. data plane (word-boundary parse, member-only resolve, message_mentions UNIQUE+cascade+index, edit-diff, per-user-room realtime, /me/mentions session-authz+soft-deleted-excluded+paginated); autocomplete (Enter-selects-not-sends, inserts member.username — B-4 chain closed); pills+unread (self emerald/other muted, badge via mention event, clears-on-view, no self-badge). Stays on mention-primitive #8 (no notif-inbox #14); @everyone/@role OUT; M3 correctly NOT closed. 3 non-blocking GAPS for V-2.
```yaml
karen_verdict: APPROVE
karen_findings_count: 0   # 1 informational (471 count not re-run)
jenny_verdict: APPROVE
jenny_findings_count: 0   # 3 non-blocking gaps (G1/G2/G3) for V-2
spec_drift_count: 0
spec_gap_count: 3
findings: []   # no blocking; carries → V-2
```
