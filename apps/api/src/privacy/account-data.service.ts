import { Injectable } from '@nestjs/common';
import type { AccountDataResponse } from '@studyhall/shared';
import { eq } from 'drizzle-orm';
import { db } from '../db/index';
import { server_members, servers, users } from '../db/schema/index';

@Injectable()
export class AccountDataService {
  async getAccountData(userId: string): Promise<AccountDataResponse> {
    const userRows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const user = userRows[0];

    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    // Memberships: server_members joined to servers for name + joinedAt
    const membershipRows = await db
      .select({
        serverId: servers.id,
        serverName: servers.name,
        joinedAt: server_members.joined_at,
      })
      .from(server_members)
      .innerJoin(servers, eq(servers.id, server_members.server_id))
      .where(eq(server_members.user_id, userId));

    const memberships = membershipRows.map((row) => ({
      serverId: row.serverId,
      serverName: row.serverName,
      joinedAt: row.joinedAt.toISOString(),
    }));

    return {
      profile: {
        userId: user.id,
        displayName: user.display_name ?? null,
        username: user.username ?? null,
        avatarUrl: user.avatar_url ?? null,
        accentColor: user.accent_color ?? null,
        email: user.email,
      },
      memberships,
      activitySummary: {
        serversJoined: memberships.length,
        accountCreatedAt: user.created_at.toISOString(),
      },
    };
  }

  // exportAccountData reuses the same aggregate — the controller sets download headers.
  async exportAccountData(userId: string): Promise<AccountDataResponse> {
    return this.getAccountData(userId);
  }
}
