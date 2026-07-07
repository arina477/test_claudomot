# B-3 — Frontend (wave-70)
Specialist: react-specialist (owns MemberListPanel exclusively — specs C+D both touch it). Per D-3 design/block-ui.html.
## Files
- CREATE BlockConfirmDialog.tsx (portal, role=dialog, Tab/Shift+Tab focus-trap, Esc, mobile bottom-sheet, danger #b91c1c confirm + ghost cancel, submitting/success/error, toast role=alert/status, focus-visible:ring [D-3 note]).
- CREATE BlockedUsersPanel.tsx (/settings/privacy — USER settings per P-4 note; GET /blocks, skeleton, empty, inline optimistic unblock + error-restore).
- CREATE block-ui.test.tsx (11 RTL, rule-12 through-parent).
- MODIFY api.ts (blockUser/unblockUser/getBlocks), MemberListPanel.tsx (selfUserId prop + isSelf guard suppresses Report AND Block on own row; block affordance; aria-hidden self kebab), AppShell.tsx (profile.userId → selfUserId), SettingsPrivacyPage.tsx (mount BlockedUsersPanel).
## Spec D (member-row fix): isSelf = member.userId === selfUserId (profile.userId from ProfileContext via AppShell). Own row suppresses BOTH Report + Block. Mirrors the wave-69 message-row isOwn gate.
## Verify: apps/web typecheck clean; biome clean (7 files); tests 629/629 (11 new).
## KNOWN GAP (→ B-6/V-2): GET /blocks returns bare Block DTOs (UUIDs only) — BlockedUsersPanel shows blocked_id UUID as name fallback (no display name/avatar). Design §7 wanted avatar+name. Fix: enrich listBlocks (JOIN users/profile) + extend the Block list DTO + render name/avatar. Non-security; core block + HIDE predicate work. Head-builder/V-2 to decide fix-now vs follow-on.
## Deviations: none (design+plan consistent; UUID-fallback is the flagged data gap above).
```yaml
skipped: false
specialists_spawned: [react-specialist]
files_implemented: [BlockConfirmDialog.tsx, BlockedUsersPanel.tsx, block-ui.test.tsx, api.ts, MemberListPanel.tsx, AppShell.tsx, SettingsPrivacyPage.tsx]
designs_consumed: [design/block-ui.html]
deviations: []
known_gaps: ["GET /blocks lacks profile enrichment → blocked-users list shows UUIDs"]
simplify_applied: true
```
