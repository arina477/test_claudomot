# Wave 77 — B-3 Frontend
Specialist: react-specialist. Commit 26fc38d (task a98286cb), on the wave branch (no fragmentation).
## Files
- `apps/web/src/shell/MemberProfileCard.tsx` (create) — ported from design/member-profile-card.html; 4 states (loaded/loading skeleton/hidden "Profile Unavailable"/partial). **Portal to document.body + edge-clamp (BUILD-14); Esc = unmount + restore focus to trigger; aria-busy skeleton; presence dot non-color-only + aria-label.** NO verification badge (academicRole plain text); read-only; never renders email; uniform-404/hidden → calm "Profile Unavailable" (not an error).
- `apps/web/src/pages/ProfilePage.tsx` (modify) — academic-identity editor (pronouns/bio/institution/program/academicRole-select-from-ACADEMIC_ROLES/academicYear); client validation mirrors Zod bounds; PATCH /profile; refreshShell on success.
- `apps/web/src/shell/MemberListPanel.tsx` (modify) — member row opens the card (opaque userId).
- `apps/web/src/auth/api.ts` (modify) — getPublicProfile(userId) → GET /profile/:userId (single named PublicProfile import).
- `apps/web/src/shell/icons.tsx` (modify) — added GraduationCapIcon + UserIcon inline-SVG (design glyphs absent, load-bearing).
- tests: member-profile-card.test (6, through MemberListPanel) + profile-academic.test (3, editor round-trip) + member-moderation.test mock extended.
## Verify
- **Full web suite: 49 files, 696 tests green.** Biome clean. Portal/Esc/aria per D-3 port notes; icons.tsx inline-SVG (no CDN); BUILD-12 (through real parent) + BUILD-13 (opaque userId). /simplify: lean (ported design).
```yaml
skipped: false
specialists_spawned: [react-specialist]
files_implemented: [MemberProfileCard.tsx, ProfilePage.tsx, MemberListPanel.tsx, api.ts, icons.tsx, +3 test files]
designs_consumed: [design/member-profile-card.html]
deviations:
  - {change: "presence dot online/offline only (idle path unreachable from panel)", adjudication: "ACCEPTED — no behavioral gap for shipped states"}
  - {change: "2 new icons.tsx exports (GraduationCap/User)", adjudication: "ACCEPTED — within D-3 closest-glyph latitude; design glyphs load-bearing"}
  - {change: "non-404 network errors also render the calm hidden state (no distinct retry)", adjudication: "ACCEPTED for B-3; CARRY to V-2 — a network blip shows same 'Profile Unavailable' as a genuinely-hidden profile; a distinct retry affordance may be wanted (low, UX)"}
simplify_applied: true
