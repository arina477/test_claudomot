import { Injectable, Logger } from '@nestjs/common';
import type { AccountDataResponse } from '@studyhall/shared';
import { eq } from 'drizzle-orm';
import { db } from '../db/index';
import { server_members, servers, users } from '../db/schema/index';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { AppendPrivacyEventService } from './append-privacy-event.service';

@Injectable()
export class AccountDataService {
  private readonly logger = new Logger(AccountDataService.name);

  constructor(private readonly appendPrivacyEvent: AppendPrivacyEventService) {}
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
    const result = await this.getAccountData(userId);

    // ── Privacy audit hook (best-effort, AFTER data is gathered) ─────────────
    // Fires after the export data is assembled. Failure MUST NOT fail the export
    // response — mirrors deleteAccount's post-commit best-effort pattern.
    try {
      await this.appendPrivacyEvent.append(userId, 'data_exported', {
        targetType: 'self',
        targetId: userId,
      });
    } catch (err) {
      this.logger.warn(
        `appendPrivacyEvent failed for data_exported (actor=${userId}) — export succeeded; audit log failure is non-fatal.`,
        err instanceof Error ? err.stack : String(err),
      );
    }

    return result;
  }
}
