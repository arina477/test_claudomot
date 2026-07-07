# Wave 77 — P-2 Spec (pointer)
**Source of truth:** `tasks.description` of primary task **10a68f9e** (YAML head + `---` + prose). Convenience copy.
- **wave_type:** multi-spec (4 blocks) · **claimed_task_ids:** [10a68f9e (seed), a51e281d, bf0ad2a8, a98286cb] · **design_gap_flag:** true (member profile card → D-block)

## Acceptance criteria (copy for P-3/D/P-4)
### Spec 1 — 10a68f9e academic-identity profile fields + self API
Migration: nullable academic columns on users (pronouns/bio/institution/program/academic_role/academic_year), no backfill. GET/PATCH /profile (SessionNoVerifyGuard — self surface, correct here) return/persist them; 409 username preserved. Self-declared only, no verification. academic_role text z.enum, no pgEnum.
### Spec 2 — a51e281d shared contract
UpdateProfileSchema += optional bounded academic fields (bio max-len; academic_role z.enum(['student','educator','staff']); length-bounded institution/program/year). New PublicProfileSchema (cross-server safe fields, NEVER email; visibility server-enforced not by omission). ESM re-export.
### Spec 3 — bf0ad2a8 cross-server profile-view endpoint (PRIVACY-CRITICAL)
GET /profile/:userId (SessionNoVerifyGuard) → PublicProfile if visible; hidden/404 for nobody / blocked-either-way / soft-deleted. **'server-members' resolves via EXPLICIT viewer↔target shared-server check (mirror dm.service.ts:144-190, NOT listServerMembers shortcut).** 'everyone'→any authed; self→self always. **FAIL-CLOSED: unknown visibility → HIDDEN.** Server-side enforcement. Integration matrix (visibility × block × soft-delete).
### Spec 4 — a98286cb editor + member card
ProfilePage academic-field editor (client validation mirrors Zod; PATCH /profile; ProfileContext refresh). MemberListPanel → member profile card (GET /profile/:userId; "profile hidden" on 404). No verification badge (educator/staff = plain text). Card layout from D-block.

**Carried (LOAD-BEARING):** the block-3 privacy enforcement (explicit shared-server check / literal enum / fail-closed HIDDEN / bidirectional block / deleted_at); no-verification fence; security-scope gate + T-8.
