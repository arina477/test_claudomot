import { Injectable } from '@nestjs/common';
import type { ServerAnalytics } from '@studyhall/shared';
import { and, count, eq, isNull } from 'drizzle-orm';
import { db } from '../db/index';
import {
  assignment_submissions,
  assignments,
  channels,
  messages,
  roles,
  scheduled_sessions,
  server_members,
} from '../db/schema/index';

// ---------------------------------------------------------------------------
// EducatorAnalyticsService — wave-76 M13 educator admin console (block 80505bb1).
//
// Read-only, server-scoped aggregate rollups for the educator analytics API.
// Emits COUNTS and ROLLUPS only — no raw message content, no per-user
// identifiers, no PII (privacy invariant carried by ServerAnalyticsSchema).
//
// Empty server → zero-valued aggregates (never an error): count() over an empty
// set is 0, and the group-by / rollup queries yield empty arrays / zeros.
//
// Aggregation surfaces (all over shipped tables):
//   memberCount      — count(server_members) for the server.
//   roleBreakdown    — per-role member counts (roles LEFT JOIN server_members),
//                      plus a synthetic "No role" bucket for members with a NULL
//                      role_id (so the breakdown reconciles to memberCount).
//   messageVolume    — count(messages) across the server's channels, excluding
//                      soft-deleted rows (is_deleted = false).
//   assignmentCount  — count(assignments) for the server (excluding soft-deleted).
//   submissionRollup — { assignmentCount, submissionCount } — assignment count
//                      (mirrors the top-level) + total submissions across them.
//   recentActivity   — activity-type COUNT buckets (messages / submissions /
//                      scheduled sessions). Aggregate counts only — no content.
// ---------------------------------------------------------------------------

@Injectable()
export class EducatorAnalyticsService {
  async getServerAnalytics(serverId: string): Promise<ServerAnalytics> {
    const [
      memberCount,
      roleBreakdown,
      messageVolume,
      assignmentCount,
      submissionCount,
      sessionCount,
    ] = await Promise.all([
      this.countMembers(serverId),
      this.roleBreakdown(serverId),
      this.messageVolume(serverId),
      this.assignmentCount(serverId),
      this.submissionCount(serverId),
      this.sessionCount(serverId),
    ]);

    return {
      memberCount,
      roleBreakdown,
      messageVolume,
      assignmentCount,
      submissionRollup: { assignmentCount, submissionCount },
      recentActivity: [
        { type: 'message_sent', count: messageVolume },
        { type: 'assignment_submitted', count: submissionCount },
        { type: 'session_scheduled', count: sessionCount },
      ],
    };
  }

  private async countMembers(serverId: string): Promise<number> {
    const [row] = await db
      .select({ value: count() })
      .from(server_members)
      .where(eq(server_members.server_id, serverId));
    return row?.value ?? 0;
  }

  private async roleBreakdown(serverId: string): Promise<ServerAnalytics['roleBreakdown']> {
    // Per-role member counts: roles LEFT JOIN server_members on role_id so roles
    // with zero members still surface (count 0). count(server_members.id) counts
    // only matched member rows (0 for an unassigned role — count ignores NULLs).
    const roleRows = await db
      .select({
        roleId: roles.id,
        roleName: roles.name,
        memberCount: count(server_members.id),
      })
      .from(roles)
      .leftJoin(
        server_members,
        and(eq(server_members.role_id, roles.id), eq(server_members.server_id, serverId)),
      )
      .where(eq(roles.server_id, serverId))
      .groupBy(roles.id, roles.name);

    const breakdown: ServerAnalytics['roleBreakdown'] = roleRows.map((r) => ({
      roleId: r.roleId,
      roleName: r.roleName,
      memberCount: r.memberCount,
    }));

    // Synthetic bucket for members with no role assigned (role_id IS NULL) so the
    // breakdown reconciles to memberCount. Only emitted when non-zero.
    const [noRole] = await db
      .select({ value: count() })
      .from(server_members)
      .where(and(eq(server_members.server_id, serverId), isNull(server_members.role_id)));

    if ((noRole?.value ?? 0) > 0) {
      breakdown.push({ roleId: '', roleName: 'No role', memberCount: noRole?.value ?? 0 });
    }

    return breakdown;
  }

  private async messageVolume(serverId: string): Promise<number> {
    // Messages join to the server via channels.server_id. Exclude soft-deleted.
    const [row] = await db
      .select({ value: count() })
      .from(messages)
      .innerJoin(channels, eq(messages.channel_id, channels.id))
      .where(and(eq(channels.server_id, serverId), eq(messages.is_deleted, false)));
    return row?.value ?? 0;
  }

  private async assignmentCount(serverId: string): Promise<number> {
    const [row] = await db
      .select({ value: count() })
      .from(assignments)
      .where(and(eq(assignments.server_id, serverId), eq(assignments.is_deleted, false)));
    return row?.value ?? 0;
  }

  private async submissionCount(serverId: string): Promise<number> {
    // Submissions join to the server via their parent assignment. Exclude
    // submissions on soft-deleted assignments so the rollup matches the count.
    const [row] = await db
      .select({ value: count() })
      .from(assignment_submissions)
      .innerJoin(assignments, eq(assignment_submissions.assignment_id, assignments.id))
      .where(and(eq(assignments.server_id, serverId), eq(assignments.is_deleted, false)));
    return row?.value ?? 0;
  }

  private async sessionCount(serverId: string): Promise<number> {
    const [row] = await db
      .select({ value: count() })
      .from(scheduled_sessions)
      .where(
        and(eq(scheduled_sessions.server_id, serverId), eq(scheduled_sessions.is_deleted, false)),
      );
    return row?.value ?? 0;
  }
}
