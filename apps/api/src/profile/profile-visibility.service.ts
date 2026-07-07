import { Injectable } from '@nestjs/common';
import type { PublicProfile } from '@studyhall/shared';
import { PROFILE_VISIBILITY } from '@studyhall/shared';
import { and, eq, sql } from 'drizzle-orm';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { BlocksService } from '../blocks/blocks.service';
import { db } from '../db/index';
import { server_members, users } from '../db/schema/index';

// ---------------------------------------------------------------------------
// ProfileVisibilityService — wave-77 M13 leg-2 (task bf0ad2a8)
//
// PRIVACY-CRITICAL. Decides whether a viewer may see a target's public profile
// across servers. A leak here exposes user data to a stranger, so the resolver
// is FAIL-CLOSED: the ONLY path that returns a visible profile is one that has
// affirmatively cleared every gate. Any ambiguity → HIDDEN.
//
// Decision order (each earlier gate short-circuits to HIDDEN before the branch):
//   1. Target missing            → HIDDEN (nothing to show).
//   2. Target soft-deleted       → HIDDEN (deleted_at set).
//   3. Block either direction    → HIDDEN (bidirectional, mirrors DM seams).
//   4. viewer === target         → VISIBLE (own profile always, after 1-3).
//   5. Branch on profile_visibility (imported PROFILE_VISIBILITY const):
//        'everyone'        → VISIBLE (any authed viewer).
//        'server-members'  → VISIBLE iff viewer+target share ≥1 server
//                            (shared-server EXISTS — MIRRORS dm.service.ts:171-193;
//                             deliberately NOT servers.listServerMembers, which
//                             assumes ambient caller-membership this open endpoint
//                             lacks and would leak to a stranger).
//        'nobody'          → HIDDEN.
//   6. Anything else (unknown / unrecognized / missing value) → HIDDEN.
//
// The self-check (step 4) runs AFTER soft-delete and block checks intentionally:
// a viewer viewing themselves still cannot resurrect a soft-deleted account view,
// and self-block is impossible (blocks.service forbids it) so ordering is safe.
// ---------------------------------------------------------------------------

export type VisibilityDecision = { visible: true; profile: PublicProfile } | { visible: false };

@Injectable()
export class ProfileVisibilityService {
  constructor(private readonly blocksService: BlocksService) {}

  /**
   * Resolve whether `viewerUserId` may view `targetUserId`'s public profile.
   *
   * Returns a discriminated union: { visible: true, profile } or { visible: false }.
   * The caller (controller) maps { visible: false } to a hidden/404 shape and NEVER
   * returns the target's email (PublicProfile has no email field by construction).
   */
  async resolve(viewerUserId: string, targetUserId: string): Promise<VisibilityDecision> {
    // 1. Load the target row (visibility + soft-delete + the public-safe fields).
    //    A single SELECT so we have everything to build PublicProfile if visible.
    const [target] = await db
      .select({
        id: users.id,
        username: users.username,
        display_name: users.display_name,
        avatar_url: users.avatar_url,
        accent_color: users.accent_color,
        pronouns: users.pronouns,
        bio: users.bio,
        institution: users.institution,
        program: users.program,
        academic_role: users.academic_role,
        academic_year: users.academic_year,
        profile_visibility: users.profile_visibility,
        deleted_at: users.deleted_at,
      })
      .from(users)
      .where(eq(users.id, targetUserId))
      .limit(1);

    // Target missing → HIDDEN (fail-closed; nothing to disclose).
    if (!target) {
      return { visible: false };
    }

    // 2. Soft-deleted → HIDDEN (even for self — a deleted account is not viewable).
    if (target.deleted_at !== null) {
      return { visible: false };
    }

    // 3. Block either direction → HIDDEN. Bidirectional, mirrors DM seams.
    if (await this.blocksService.isBlockedBetween(viewerUserId, targetUserId)) {
      return { visible: false };
    }

    // 4. Own profile → VISIBLE (after soft-delete + block gates above).
    if (viewerUserId === targetUserId) {
      return { visible: true, profile: this.toPublicProfile(target) };
    }

    // 5. Branch on the target's visibility setting.
    const visibility = target.profile_visibility;

    if (visibility === PROFILE_VISIBILITY[0]) {
      // 'everyone' → VISIBLE to any authed viewer.
      return { visible: true, profile: this.toPublicProfile(target) };
    }

    if (visibility === PROFILE_VISIBILITY[1]) {
      // 'server-members' → VISIBLE iff viewer + target share ≥1 server.
      const shared = await this.sharesServer(viewerUserId, targetUserId);
      return shared ? { visible: true, profile: this.toPublicProfile(target) } : { visible: false };
    }

    // 'nobody' (PROFILE_VISIBILITY[2]) AND every unknown/missing value → HIDDEN.
    // Explicit fail-closed default: we never fall through to visible.
    return { visible: false };
  }

  /**
   * True iff `viewerUserId` and `targetUserId` are co-members of ≥1 server.
   *
   * MIRRORS dm.service.ts:171-193: single-round-trip EXISTS via a self-referential
   * subquery on server_members. Does NOT copy servers.listServerMembers (which
   * gates on ambient caller-membership and would over-disclose here). No ambient
   * membership assumption — both user ids come from explicit args.
   */
  private async sharesServer(viewerUserId: string, targetUserId: string): Promise<boolean> {
    const shared = await db
      .select({ server_id: server_members.server_id })
      .from(server_members)
      .where(
        and(
          eq(server_members.user_id, viewerUserId),
          sql`${server_members.server_id} IN (
            SELECT server_id FROM server_members WHERE user_id = ${targetUserId}
          )`,
        ),
      )
      .limit(1);

    return shared.length > 0;
  }

  /**
   * Project a users row to PublicProfile (the shared cross-server-safe allowlist).
   * NEVER includes email — PublicProfileSchema has no email field, and this mapper
   * only reads the allowlisted columns selected in resolve().
   */
  private toPublicProfile(row: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
    accent_color: string | null;
    pronouns: string | null;
    bio: string | null;
    institution: string | null;
    program: string | null;
    academic_role: string | null;
    academic_year: string | null;
  }): PublicProfile {
    return {
      userId: row.id,
      username: row.username ?? null,
      displayName: row.display_name ?? null,
      avatarUrl: row.avatar_url ?? null,
      accentColor: row.accent_color ?? null,
      pronouns: row.pronouns ?? null,
      bio: row.bio ?? null,
      institution: row.institution ?? null,
      program: row.program ?? null,
      academicRole: (row.academic_role as PublicProfile['academicRole']) ?? null,
      academicYear: row.academic_year ?? null,
    };
  }
}
