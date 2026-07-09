import { randomBytes } from 'node:crypto';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  DiscoverServer,
  DiscoverServersQuery,
  DiscoverServersResponse,
  InvitePreview,
  InviteResponse,
  JoinResult,
  ServerDetail,
  ServerMember,
  ServerResponse,
  ServerSummary,
  UpdateServer,
} from '@studyhall/shared';
import { and, asc, desc, eq, ilike, or, sql } from 'drizzle-orm';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { EntitlementsService } from '../billing/entitlements.service';
import { db } from '../db/index';
import {
  categories,
  channels,
  invites,
  roles,
  server_members,
  servers,
  users,
} from '../db/schema/index';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { RbacService } from '../rbac/rbac.service';

// ---------------------------------------------------------------------------
// CSPRNG code generator — ~128-bit entropy, URL-safe base64url (no +/=)
// ---------------------------------------------------------------------------

export function generateCode(): string {
  return randomBytes(16).toString('base64url');
}

// ---------------------------------------------------------------------------
// Invite validation errors — unified shape for preview + join
// ---------------------------------------------------------------------------

function validateInviteActive(invite: {
  revoked: boolean;
  expires_at: Date | null;
  max_uses: number | null;
  uses: number;
}): void {
  if (invite.revoked) {
    throw new NotFoundException('Invite not found or invalid');
  }
  if (invite.expires_at !== null && invite.expires_at < new Date()) {
    throw new NotFoundException('Invite not found or invalid');
  }
  if (invite.max_uses !== null && invite.uses >= invite.max_uses) {
    throw new NotFoundException('Invite not found or invalid');
  }
}

@Injectable()
export class ServersService {
  constructor(
    private readonly rbacService: RbacService,
    private readonly entitlementsService: EntitlementsService,
  ) {}
  /**
   * Create a server in a single atomic transaction:
   * server (with CSPRNG invite_code) → owner server_member → 'General' category → #general channel.
   */
  async createServer(ownerId: string, name: string): Promise<ServerResponse> {
    // ── Entitlement gate (read-only, pre-insert) ────────────────────────────
    // Resolve the owner's create-gate caps and count their existing servers.
    // Under the free-tier placeholder (maxServersPerOwner=100_000, defined in
    // EntitlementsService.CAPS.free) this check is non-restrictive: no existing
    // owner is blocked (NON-REGRESSIVE guarantee).
    // Once paid owner tiers and lower caps ship, the same code path enforces them.
    const { caps, currentServerCount } =
      await this.entitlementsService.resolveCreateGateForOwner(ownerId);
    if (currentServerCount >= caps.maxServersPerOwner) {
      throw new ForbiddenException(
        `Server limit reached for your plan (${caps.maxServersPerOwner} servers max). Upgrade to create more servers.`,
      );
    }
    // ── end entitlement gate ────────────────────────────────────────────────

    return await db.transaction(async (tx) => {
      const inviteCode = generateCode();

      const serverRows = await tx
        .insert(servers)
        .values({ name, owner_id: ownerId, invite_code: inviteCode })
        .returning();
      const server = serverRows[0];
      if (!server) throw new Error('Server insert failed unexpectedly');

      await tx.insert(roles).values({
        server_id: server.id,
        name: 'Member',
        position: 0,
        manage_server: false,
        manage_roles: false,
        manage_channels: false,
        manage_members: false,
        is_default: true,
      });

      await tx.insert(server_members).values({
        server_id: server.id,
        user_id: ownerId,
      });

      const categoryRows = await tx
        .insert(categories)
        .values({ server_id: server.id, name: 'General', position: 0 })
        .returning();
      const category = categoryRows[0];
      if (!category) throw new Error('Category insert failed unexpectedly');

      await tx.insert(channels).values({
        server_id: server.id,
        category_id: category.id,
        name: 'general',
        type: 'text',
        is_private: false,
        position: 0,
      });

      return {
        id: server.id,
        name: server.name,
        ownerId: server.owner_id,
        createdAt: server.created_at.toISOString(),
      };
    });
  }

  /** Return all servers the calling user is a member of. */
  async findMyServers(userId: string): Promise<ServerSummary[]> {
    const rows = await db
      .select({
        id: servers.id,
        name: servers.name,
        owner_id: servers.owner_id,
      })
      .from(servers)
      .innerJoin(server_members, eq(server_members.server_id, servers.id))
      .where(eq(server_members.user_id, userId));

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      ownerId: row.owner_id,
    }));
  }

  /**
   * Return full server detail including categories + channels.
   * Throws 404 if server does not exist.
   * Throws 403 if the calling user is not a member.
   *
   * Security (P-4 carry-forward): channels are filtered server-side by
   * visibility. Channels not visible to the caller's role are ABSENT from
   * the response — they are not included at all, preventing enumeration of
   * private channels (no hidden-channel enumeration via UI suppression alone).
   *
   * Visibility rules (delegated to RbacService.getVisibleChannelIds):
   *   - Owner → all channels
   *   - Public channel → visible unless override.can_view=false
   *   - Private channel → default-deny unless override.can_view=true
   */
  async findServerDetail(userId: string, serverId: string): Promise<ServerDetail> {
    const [server] = await db.select().from(servers).where(eq(servers.id, serverId)).limit(1);

    if (!server) {
      throw new NotFoundException('Server not found');
    }

    const [member] = await db
      .select()
      .from(server_members)
      .where(and(eq(server_members.server_id, serverId), eq(server_members.user_id, userId)))
      .limit(1);

    if (!member) {
      throw new ForbiddenException('Not a member of this server');
    }

    const catRows = await db
      .select()
      .from(categories)
      .where(eq(categories.server_id, serverId))
      .orderBy(categories.position);

    const chanRows = await db
      .select()
      .from(channels)
      .where(eq(channels.server_id, serverId))
      .orderBy(channels.position);

    // Server-side channel visibility filtering — no enumeration leak
    const allChannelIds = chanRows.map((ch) => ch.id);
    const visibleIds = await this.rbacService.getVisibleChannelIds(userId, serverId, allChannelIds);
    // visibleIds === null means owner (all visible); otherwise filter to set
    const visibleChanRows =
      visibleIds === null ? chanRows : chanRows.filter((ch) => visibleIds.has(ch.id));

    return {
      server: {
        id: server.id,
        name: server.name,
        ownerId: server.owner_id,
        inviteCode: server.invite_code ?? null,
        is_public: server.is_public,
        description: server.description,
        topic: server.topic,
      },
      categories: catRows.map((cat) => ({
        id: cat.id,
        name: cat.name,
        position: cat.position,
        channels: visibleChanRows
          .filter((ch) => ch.category_id === cat.id)
          .map((ch) => ({
            id: ch.id,
            name: ch.name,
            type: ch.type,
            isPrivate: ch.is_private,
            position: ch.position,
          })),
      })),
    };
  }

  // -------------------------------------------------------------------------
  // Member list — GET /servers/:id/members (wave-14)
  // -------------------------------------------------------------------------

  /**
   * Return the public member roster for a server.
   * Caller must be a member of the server (403 otherwise).
   * Returns [{userId, displayName, avatarUrl}] for all members.
   * displayName falls back to email prefix if display_name is null.
   */
  async listServerMembers(userId: string, serverId: string): Promise<ServerMember[]> {
    // Member gate: caller must belong to this server
    const [callerMembership] = await db
      .select({ id: server_members.id })
      .from(server_members)
      .where(and(eq(server_members.server_id, serverId), eq(server_members.user_id, userId)))
      .limit(1);

    if (!callerMembership) {
      throw new ForbiddenException('Not a member of this server');
    }

    const rows = await db
      .select({
        userId: users.id,
        displayName: users.display_name,
        email: users.email,
        avatarUrl: users.avatar_url,
        username: users.username,
        profileVisibility: users.profile_visibility,
        // wave-41 M8: public mute state — all viewers see mutedUntil so the
        // amber indicator renders for everyone regardless of permissions.
        mutedUntil: server_members.muted_until,
      })
      .from(server_members)
      .innerJoin(users, eq(users.id, server_members.user_id))
      .where(eq(server_members.server_id, serverId));

    // Enforce profile_visibility: exclude 'nobody' members unless they are the
    // caller (a student always sees themselves in the roster regardless of their
    // own visibility setting). 'everyone' and 'server-members' are both visible
    // here because the viewer is already a verified co-member.
    return rows
      .filter((r) => r.profileVisibility !== 'nobody' || r.userId === userId)
      .map((r) => ({
        userId: r.userId,
        displayName: r.displayName || r.email.split('@')[0] || r.userId,
        avatarUrl: r.avatarUrl ?? null,
        username: r.username ?? null,
        mutedUntil: r.mutedUntil ? r.mutedUntil.toISOString() : null,
      }));
  }

  // -------------------------------------------------------------------------
  // Invite: create ad-hoc invite (task c7443638)
  // -------------------------------------------------------------------------

  /**
   * Create an ad-hoc invite for a server.
   * Caller must be a member of the server (403 otherwise).
   * Retries on CSPRNG code collision (unique constraint violation).
   */
  async createInvite(
    serverId: string,
    userId: string,
    options: { maxUses?: number | null | undefined; expiresAt?: string | null | undefined },
  ): Promise<InviteResponse> {
    // Member gate: caller must be a member of the server
    const [member] = await db
      .select()
      .from(server_members)
      .where(and(eq(server_members.server_id, serverId), eq(server_members.user_id, userId)))
      .limit(1);

    if (!member) {
      throw new ForbiddenException('Not a member of this server');
    }

    // Verify server exists (gives clearer 404 vs silent 403-with-no-server)
    const [server] = await db.select().from(servers).where(eq(servers.id, serverId)).limit(1);
    if (!server) {
      throw new NotFoundException('Server not found');
    }

    // Retry loop for CSPRNG code uniqueness (collision is astronomically rare
    // but we follow the spec requirement to retry on unique constraint violation)
    const MAX_RETRIES = 5;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const code = generateCode();
      const expiresAt = options.expiresAt ? new Date(options.expiresAt) : null;

      try {
        await db.insert(invites).values({
          server_id: serverId,
          code,
          created_by: userId,
          max_uses: options.maxUses ?? null,
          uses: 0,
          expires_at: expiresAt,
          revoked: false,
        });

        return { code };
      } catch (err: unknown) {
        // Postgres unique_violation code = '23505'
        const pgErr = err as { code?: string };
        if (pgErr.code === '23505' && attempt < MAX_RETRIES - 1) {
          continue;
        }
        throw err;
      }
    }

    // Should never reach here — makes TypeScript happy
    throw new ConflictException('Failed to generate unique invite code');
  }

  // -------------------------------------------------------------------------
  // Invite revoke — authenticated + owner/creator-gated (task 863c10ef)
  // -------------------------------------------------------------------------

  /**
   * Revoke an ad-hoc invite by code.
   *
   * Authorization: caller must be the server owner (servers.owner_id) OR the
   * invite creator (invites.created_by).  Anyone else → 403.
   *
   * Permanent codes (servers.invite_code) are not stored in the invites table
   * and therefore return 404 — rotation of the permanent code is deferred.
   *
   * Idempotent: revoking an already-revoked invite returns 200 (no error).
   */
  async revokeInvite(code: string, callerId: string): Promise<void> {
    // Resolve the ad-hoc invite by code
    const [invite] = await db.select().from(invites).where(eq(invites.code, code)).limit(1);

    if (!invite) {
      throw new NotFoundException('Invite not found or invalid');
    }

    // Load the server to determine ownership
    const [server] = await db
      .select()
      .from(servers)
      .where(eq(servers.id, invite.server_id))
      .limit(1);

    if (!server) {
      throw new NotFoundException('Invite not found or invalid');
    }

    // Authorization: caller must be owner OR creator
    if (server.owner_id !== callerId && invite.created_by !== callerId) {
      throw new ForbiddenException('Not authorized to revoke this invite');
    }

    // Idempotent: set revoked=true regardless of current state
    await db.update(invites).set({ revoked: true }).where(eq(invites.id, invite.id));
  }

  // -------------------------------------------------------------------------
  // Invite-code rotate — owner-only (task d058283d)
  // -------------------------------------------------------------------------

  /**
   * Rotate the permanent invite code for a server.
   * Only the server owner may rotate (NOT owner-or-creator — no creator on a
   * permanent code). Regenerates servers.invite_code using CSPRNG; retries up
   * to 5 times on unique-constraint collision (23505); 409 after exhaustion.
   *
   * Known limitations (accepted at current scale):
   *
   * Rotate-vs-join race: the regeneration is a single non-transactional UPDATE.
   * A `joinViaInvite` transaction that snapshotted the OLD `invite_code` before
   * this UPDATE commits may still admit the member for the duration of that
   * in-flight join (READ COMMITTED isolation). Strict invalidation would require
   * a `SELECT ... FOR UPDATE` on the server row inside the join path to serialize
   * against the rotate UPDATE — deferred, out of this wave's scope.
   *
   * Retry scope: the 23505-retry loop guards only `servers.invite_code`
   * self-collisions. It does NOT guard the astronomically improbable (~2^-128)
   * case of a regenerated code colliding with an existing ad-hoc `invites.code`
   * in the separate resolution namespace. Documented as a known non-issue,
   * not guarded.
   */
  async rotateInviteCode(serverId: string, callerId: string): Promise<{ invite_code: string }> {
    const [server] = await db.select().from(servers).where(eq(servers.id, serverId)).limit(1);

    if (!server) {
      throw new NotFoundException('Server not found');
    }

    if (server.owner_id !== callerId) {
      throw new ForbiddenException("Not authorized to rotate this server's invite code");
    }

    const MAX_RETRIES = 5;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const code = generateCode();

      try {
        await db.update(servers).set({ invite_code: code }).where(eq(servers.id, serverId));
        return { invite_code: code };
      } catch (err: unknown) {
        const pgErr = err as { code?: string };
        if (pgErr.code === '23505' && attempt < MAX_RETRIES - 1) {
          continue;
        }
        throw err;
      }
    }

    throw new ConflictException('Failed to generate unique invite code');
  }

  // -------------------------------------------------------------------------
  // Update server — PATCH /servers/:id (wave-68)
  // -------------------------------------------------------------------------

  /**
   * Partially update a server's public-profile fields (is_public, description, topic).
   *
   * OWNER-ONLY: same gate idiom as rotateInviteCode (lines 400-408).
   *   1. Load server row — 404 NotFound if missing.
   *   2. Check owner_id === userId — 403 ForbiddenException if not.
   *   3. UPDATE only the fields that are present in the patch object (partial).
   *      Omitted fields are unchanged; null values clear the column.
   *   4. Re-fetch and return the updated row as ServerSummary shape.
   *
   * Idempotent: patching with the same values produces the same row and same 200.
   */
  async updateServer(
    serverId: string,
    userId: string,
    patch: UpdateServer,
  ): Promise<ServerSummary> {
    const [server] = await db.select().from(servers).where(eq(servers.id, serverId)).limit(1);

    if (!server) {
      throw new NotFoundException('Server not found');
    }

    if (server.owner_id !== userId) {
      throw new ForbiddenException('Not authorized to update this server');
    }

    // Build partial SET — only touch fields the caller explicitly supplied.
    // Using `as Record<string, unknown>` avoids TS narrowing issues with
    // Drizzle's dynamic .set() signature while staying type-safe via the Zod
    // validated `patch` object.
    const setFields: Record<string, unknown> = {};
    if (patch.is_public !== undefined) setFields.is_public = patch.is_public;
    if ('description' in patch) setFields.description = patch.description ?? null;
    if ('topic' in patch) setFields.topic = patch.topic ?? null;

    const [updated] = await db
      .update(servers)
      .set(setFields as Parameters<ReturnType<typeof db.update>['set']>[0])
      .where(eq(servers.id, serverId))
      .returning();

    if (!updated) {
      throw new NotFoundException('Server not found');
    }

    return {
      id: updated.id,
      name: updated.name,
      ownerId: updated.owner_id,
    };
  }

  // -------------------------------------------------------------------------
  // Invite preview — public (task 77e2041a)
  // -------------------------------------------------------------------------

  /**
   * Resolve an invite code (ad-hoc OR permanent servers.invite_code) and return
   * minimal server preview: {server: {id, name, memberCount}}.
   * NO members list, NO channels, NO categories.
   * Returns 404 for invalid / revoked / expired / maxed invites.
   */
  async getInvitePreview(code: string): Promise<InvitePreview> {
    // Try ad-hoc invite first
    const [adHocInvite] = await db.select().from(invites).where(eq(invites.code, code)).limit(1);

    if (adHocInvite) {
      validateInviteActive(adHocInvite);

      const [server] = await db
        .select()
        .from(servers)
        .where(eq(servers.id, adHocInvite.server_id))
        .limit(1);
      if (!server) throw new NotFoundException('Invite not found or invalid');

      const countRows = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(server_members)
        .where(eq(server_members.server_id, server.id));
      const memberCount = countRows[0]?.count ?? 0;

      return {
        server: {
          id: server.id,
          name: server.name,
          memberCount,
        },
      };
    }

    // Try permanent invite (servers.invite_code)
    const [server] = await db.select().from(servers).where(eq(servers.invite_code, code)).limit(1);

    if (!server) {
      throw new NotFoundException('Invite not found or invalid');
    }

    const countRows2 = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(server_members)
      .where(eq(server_members.server_id, server.id));
    const memberCount2 = countRows2[0]?.count ?? 0;

    return {
      server: {
        id: server.id,
        name: server.name,
        memberCount: memberCount2,
      },
    };
  }

  // -------------------------------------------------------------------------
  // Invite join — authenticated + verified (task 77e2041a)
  // -------------------------------------------------------------------------

  /**
   * Join a server via invite code (ad-hoc or permanent).
   *
   * Atomicity contract (carry-forward B):
   *   1. Resolve + validate code inside the transaction.
   *   2. INSERT server_members ON CONFLICT (server_id, user_id) DO NOTHING RETURNING.
   *   3. Increment invite.uses ONLY when a new row was inserted (RETURNING returned a row)
   *      AND the code is an ad-hoc invite.
   *   4. Re-check max_uses inside the txn (prevents TOCTOU between validate + increment).
   *
   * An existing member re-joining returns 200 {serverId} without incrementing uses.
   */
  // -------------------------------------------------------------------------
  // Server discovery — GET /servers/discover (wave-67)
  // -------------------------------------------------------------------------

  /**
   * Return paginated list of public servers (is_public = true).
   *
   * memberCount is derived via a correlated scalar subquery on server_members —
   * no stored counter column.  The expression is bound once and referenced in
   * both the SELECT projection and ORDER BY so the query planner receives
   * identical SQL text in both positions and can CSE it to a single
   * computation per candidate row.
   *
   * Ordering: memberCount DESC, name ASC, id ASC.
   *   - memberCount DESC surfaces the most-active servers first.
   *   - name ASC is the secondary stable tie-break within equal counts.
   *   - id ASC (UUID primary key) is the final deterministic tie-break, making
   *     offset pagination skip/duplicate-free within a single page-load session.
   *   - Known limitation: if a server's memberCount changes between "Load more"
   *     requests (join/leave event), its primary sort key shifts and it may
   *     appear at a different position on the next page.  This cross-page drift
   *     is an accepted minor limitation at the current scale; cursor-keyset
   *     pagination would eliminate it entirely and is deferred.
   *
   * Optional text search (q): case-insensitive ILIKE against name, description,
   * and topic.  Any field match qualifies the row (OR semantics).
   *
   * limit is defensively capped at 50 even if a larger value slips past Zod.
   */
  async discoverServers({
    q,
    limit,
    offset,
  }: DiscoverServersQuery): Promise<DiscoverServersResponse> {
    const safeLimitCap = 50;
    const safeLimit = Math.min(limit, safeLimitCap);

    // memberCount — LEFT JOIN server_members + GROUP BY so that:
    //   - a public server with 0 members returns 0 (LEFT JOIN preserves the row)
    //   - a public server with N members returns N
    // The previous correlated scalar subquery returned 0 at runtime due to
    // Drizzle's query-building evaluation order; the LEFT JOIN approach is
    // evaluated fully by Postgres and is immune to that issue.
    const memberCountExpr = sql<number>`count(${server_members.user_id})::int`;

    // Base WHERE: public only
    const publicFilter = eq(servers.is_public, true);

    // Optional ILIKE filter across name / description / topic
    const searchFilter = q
      ? or(
          ilike(servers.name, `%${q}%`),
          ilike(servers.description, `%${q}%`),
          ilike(servers.topic, `%${q}%`),
        )
      : undefined;

    const whereClause = searchFilter ? and(publicFilter, searchFilter) : publicFilter;

    const rows = await db
      .select({
        id: servers.id,
        name: servers.name,
        description: servers.description,
        topic: servers.topic,
        memberCount: memberCountExpr,
      })
      .from(servers)
      .leftJoin(server_members, eq(server_members.server_id, servers.id))
      .where(whereClause)
      .groupBy(servers.id)
      // ORDER BY: memberCount DESC (relevance), name ASC (secondary tie-break),
      // id ASC (stable UUID tie-break — makes offset pagination deterministic).
      .orderBy(desc(memberCountExpr), asc(servers.name), asc(servers.id))
      .limit(safeLimit)
      .offset(offset);

    const result: DiscoverServer[] = rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description ?? null,
      topic: row.topic ?? null,
      memberCount: row.memberCount,
    }));

    return { servers: result };
  }

  // -------------------------------------------------------------------------
  // Public-server join — POST /servers/:id/join-public (wave-67)
  // -------------------------------------------------------------------------

  /**
   * Resolve the server's default role id for stamping onto a new membership row.
   *
   * Data-hygiene (not security): every server seeds a per-server default role
   * (all permission flags false) at creation time.  New members are stamped with
   * that role at write time so we never insert a NULL role_id that a standing
   * backfill would later have to repair.
   *
   * LIMIT 1 is load-bearing: there is NO unique constraint on (server_id,
   * is_default), so multiple default rows are schema-possible.  The stable
   * ORDER BY (position ASC, id ASC) makes the pick deterministic.  All default
   * roles carry identical all-false flags, so the choice is permission-immaterial.
   *
   * Zero-default fallback: a legacy server with no is_default role yields null;
   * callers proceed with role_id: null (same as before this change).  Never throws.
   */
  private async resolveDefaultRoleId(
    tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
    serverId: string,
  ): Promise<string | null> {
    const [row] = await tx
      .select({ id: roles.id })
      .from(roles)
      .where(and(eq(roles.server_id, serverId), eq(roles.is_default, true)))
      .orderBy(asc(roles.position), asc(roles.id))
      .limit(1);

    return row?.id ?? null;
  }

  /**
   * Join a public server without an invite code.
   *
   * SECURITY (load-bearing): the server row is read inside a transaction and
   * is_public is checked BEFORE the INSERT.  If the server does not exist OR
   * is not public, we reject with 404/403.  Private servers are never joinable
   * via this path — it is not a backdoor into invite-only servers.
   *
   * The INSERT core is identical to joinViaInvite (idempotent
   * onConflictDoNothing); re-joining a public server an existing member already
   * belongs to returns success without duplicating the membership row.
   */
  async joinPublicServer(serverId: string, userId: string): Promise<JoinResult> {
    return await db.transaction(async (tx) => {
      // Load server inside txn — authoritative is_public check
      const [server] = await tx.select().from(servers).where(eq(servers.id, serverId)).limit(1);

      if (!server) {
        throw new NotFoundException('Server not found');
      }

      // SECURITY: private servers are NOT joinable via this path.
      if (!server.is_public) {
        throw new ForbiddenException('Server is not open for public joining');
      }

      // Stamp the server's default role at write time (data-hygiene; null-safe).
      const roleId = await this.resolveDefaultRoleId(tx, serverId);

      // Idempotent INSERT: existing member re-join returns success.
      await tx
        .insert(server_members)
        .values({ server_id: serverId, user_id: userId, role_id: roleId })
        .onConflictDoNothing();

      return { serverId };
    });
  }

  async joinViaInvite(code: string, userId: string): Promise<JoinResult> {
    return await db.transaction(async (tx) => {
      // Resolve code inside transaction — ad-hoc first, then permanent
      const [adHocInvite] = await tx.select().from(invites).where(eq(invites.code, code)).limit(1);

      let serverId: string;
      let isAdHoc: boolean;
      let inviteId: string | undefined;
      let adHocMaxUses: number | null = null;

      if (adHocInvite) {
        // Validate again inside txn (prevents TOCTOU)
        validateInviteActive(adHocInvite);
        serverId = adHocInvite.server_id;
        isAdHoc = true;
        inviteId = adHocInvite.id;
        adHocMaxUses = adHocInvite.max_uses;
      } else {
        // Try permanent invite
        const [server] = await tx
          .select()
          .from(servers)
          .where(eq(servers.invite_code, code))
          .limit(1);

        if (!server) {
          throw new NotFoundException('Invite not found or invalid');
        }
        serverId = server.id;
        isAdHoc = false;
      }

      // Stamp the server's default role at write time (data-hygiene; null-safe).
      const roleId = await this.resolveDefaultRoleId(tx, serverId);

      // INSERT server_members ON CONFLICT DO NOTHING RETURNING
      // If the user is already a member, RETURNING yields an empty array.
      const inserted = await tx
        .insert(server_members)
        .values({ server_id: serverId, user_id: userId, role_id: roleId })
        .onConflictDoNothing()
        .returning();

      const newMemberJoined = inserted.length > 0;

      // Increment uses ONLY for ad-hoc invites AND only when a new row was inserted.
      // Atomic conditional consume (TOCTOU-safe):
      //   - For capped invites (max_uses != null): the WHERE clause includes
      //     `uses < max_uses` so the UPDATE acquires a per-row lock and only
      //     succeeds if a slot is still available.  If two concurrent joiners race
      //     on the last slot, exactly one wins (the other sees 0 rows returned) and
      //     we throw here → the whole transaction (including the INSERT above) rolls back.
      //   - For unlimited invites (max_uses == null): increment unconditionally.
      //   - Re-join (newMemberJoined=false): do NOT increment (carry-forward B).
      if (newMemberJoined && isAdHoc && inviteId) {
        const maxUses = adHocMaxUses;

        if (maxUses !== null) {
          // Atomic conditional: only succeeds if uses < max_uses at UPDATE time.
          const consumed = await tx
            .update(invites)
            .set({ uses: sql`${invites.uses} + 1` })
            .where(
              sql`${invites.id} = ${inviteId}
                  AND NOT ${invites.revoked}
                  AND (${invites.expires_at} IS NULL OR ${invites.expires_at} > now())
                  AND ${invites.uses} < ${maxUses}`,
            )
            .returning();

          if (consumed.length === 0) {
            // A concurrent joiner consumed the last slot between our SELECT and this UPDATE.
            // Throwing here causes the entire transaction (including the INSERT above) to roll back.
            throw new NotFoundException('Invite not found or invalid');
          }
        } else {
          // Unlimited invite — no cap to enforce, increment unconditionally.
          await tx
            .update(invites)
            .set({ uses: sql`${invites.uses} + 1` })
            .where(eq(invites.id, inviteId));
        }
      }

      return { serverId };
    });
  }
}
