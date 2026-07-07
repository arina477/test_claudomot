import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { CreateReport, Report, ResolveReportAction } from '@studyhall/shared';
import { ReportStatus } from '@studyhall/shared';
import { and, eq } from 'drizzle-orm';
import { db } from '../db/index';
import { channels, messages, reports, server_members, servers } from '../db/schema/index';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { MessagesService } from '../messaging/messages.service';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { ModerationService } from '../rbac/moderation.service';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { RbacService } from '../rbac/rbac.service';

// ---------------------------------------------------------------------------
// ReportsService — wave-69 M14 moderation reports (spec A + spec B)
//
// Spec A — report submission:
//   createReport(callerUserId, dto)
//     Validates the target entity EXISTS before persisting.
//     Resolves + persists target_server_id server-side (never from request).
//     reporter_id = callerUserId from session (no IDOR).
//
// Spec B — owner/moderator action loop:
//   getServerReports(callerUserId, serverId, status?)
//     Gated on can(moderate_members). Returns open/resolved/dismissed reports
//     for the server, using the (target_server_id,status) composite index.
//
//   resolveReport(callerUserId, serverId, reportId, action)
//     Cross-server tamper guard: report.target_server_id MUST equal serverId.
//     Gated on can(moderate_members).
//     'timeout'        → routes through ModerationService.setMemberTimeout
//                        (rank guard applies, NOT re-implemented here).
//     'delete_message' → resolves channel_id from the messages row, then routes
//                        through MessagesService.deleteMessage (delete rank guard
//                        applies, NOT re-implemented here).
//     'dismiss'        → no side effect; status → 'dismissed'.
//     Already-resolved/dismissed: 409 ConflictException (documented + idempotent
//     callers should check before acting).
//
// Security invariants:
//   - callerUserId ALWAYS from req.session.getUserId() — never from body/params.
//   - target_server_id resolved server-side for every target_type.
//   - can(moderate_members) checked BEFORE any mutation.
//   - Cross-server tamper guard prevents mod of server X acting on server Y reports.
//   - Rank-guard for timeout/delete_message provided by route-through to existing
//     ModerationService / MessagesService — no duplication.
//
// Deferred (not in scope): pagination, filtering beyond status, appeals,
// analytics, per-reporter rate-limiting.
// ---------------------------------------------------------------------------

/** Default timeout applied when resolving a report with action='timeout'. 1440 minutes = 24 hours.
 * Matches the "Timeout 24h" label shown to moderators in the ReportInbox UI. */
const DEFAULT_TIMEOUT_MINUTES = 1440;

// ---------------------------------------------------------------------------
// rowToDto — convert a Drizzle reports row to the shared Report DTO shape.
//
// Timestamps arrive as Date objects from Drizzle; the shared ReportSchema
// (and every other DTO) uses ISO-8601 strings. Convert here, consistently.
// ---------------------------------------------------------------------------

function rowToDto(row: typeof reports.$inferSelect): Report {
  return {
    id: row.id,
    reporter_id: row.reporter_id,
    target_type: row.target_type as Report['target_type'],
    target_server_id: row.target_server_id,
    target_user_id: row.target_user_id ?? null,
    target_message_id: row.target_message_id ?? null,
    reason: row.reason,
    status: row.status as Report['status'],
    created_at: row.created_at.toISOString(),
    resolved_at: row.resolved_at ? row.resolved_at.toISOString() : null,
    resolved_by: row.resolved_by ?? null,
  };
}

@Injectable()
export class ReportsService {
  constructor(
    private readonly rbacService: RbacService,
    private readonly moderationService: ModerationService,
    private readonly messagesService: MessagesService,
  ) {}

  // -------------------------------------------------------------------------
  // createReport — POST /reports
  //
  // 1. Validate the target entity EXISTS (400/404 on failure).
  // 2. Resolve target_server_id server-side for ALL target types.
  // 3. INSERT report row (reporter_id = callerUserId, status = 'open').
  // 4. Return the created Report DTO.
  // -------------------------------------------------------------------------

  async createReport(callerUserId: string, dto: CreateReport): Promise<Report> {
    let resolvedServerId: string;

    if (dto.target_type === 'server') {
      // target_server_id is required by the schema superRefine for type='server'.
      if (!dto.target_server_id) {
        throw new BadRequestException('target_server_id is required for target_type="server"');
      }
      const [server] = await db
        .select({ id: servers.id })
        .from(servers)
        .where(eq(servers.id, dto.target_server_id))
        .limit(1);
      if (!server) {
        throw new NotFoundException(`Server ${dto.target_server_id} not found`);
      }
      resolvedServerId = dto.target_server_id;
    } else if (dto.target_type === 'member') {
      // Require target_user_id (enforced by Zod) + a server context.
      // The reporter supplies target_server_id to give us the membership context.
      if (!dto.target_server_id) {
        throw new BadRequestException(
          'target_server_id is required for target_type="member" to locate the server context',
        );
      }
      const [member] = await db
        .select({ user_id: server_members.user_id })
        .from(server_members)
        .where(
          and(
            eq(server_members.server_id, dto.target_server_id),
            // biome-ignore lint/style/noNonNullAssertion: Zod superRefine guarantees presence
            eq(server_members.user_id, dto.target_user_id!),
          ),
        )
        .limit(1);
      if (!member) {
        throw new NotFoundException('Target user is not a member of the specified server');
      }
      resolvedServerId = dto.target_server_id;
    } else {
      // target_type === 'message'
      // target_message_id required by Zod superRefine.
      // biome-ignore lint/style/noNonNullAssertion: Zod superRefine guarantees presence
      const msgId = dto.target_message_id!;
      const [msg] = await db
        .select({ id: messages.id, channel_id: messages.channel_id })
        .from(messages)
        .where(eq(messages.id, msgId))
        .limit(1);
      if (!msg) {
        throw new NotFoundException(`Message ${msgId} not found`);
      }
      // Resolve server_id from the channel row.
      const [channel] = await db
        .select({ server_id: channels.server_id })
        .from(channels)
        .where(eq(channels.id, msg.channel_id))
        .limit(1);
      if (!channel) {
        // Channel row missing — data inconsistency; surface as 404.
        throw new NotFoundException('Channel for the reported message not found');
      }
      resolvedServerId = channel.server_id;
    }

    const [inserted] = await db
      .insert(reports)
      .values({
        reporter_id: callerUserId,
        target_type: dto.target_type,
        target_server_id: resolvedServerId,
        target_user_id: dto.target_user_id ?? null,
        target_message_id: dto.target_message_id ?? null,
        reason: dto.reason,
        status: 'open',
      })
      .returning();

    if (!inserted) {
      // Should never happen — INSERT RETURNING always returns the new row.
      throw new Error('Report insert failed');
    }

    return rowToDto(inserted);
  }

  // -------------------------------------------------------------------------
  // getServerReports — GET /servers/:serverId/reports?status=
  //
  // Gate: can(callerUserId, serverId, 'moderate_members') (mirrors setMemberTimeout).
  // Uses (target_server_id, status) composite index.
  // status filter is optional — omit to return all statuses.
  // -------------------------------------------------------------------------

  async getServerReports(
    callerUserId: string,
    serverId: string,
    status?: string,
  ): Promise<Report[]> {
    const canModerate = await this.rbacService.can(callerUserId, serverId, 'moderate_members');
    if (!canModerate) {
      throw new ForbiddenException('Insufficient permissions: moderate_members required');
    }

    // Validate status against the known enum before querying — an unrecognised
    // value would silently return [] because the DB has no matching rows.
    if (status !== undefined) {
      const parsed = ReportStatus.safeParse(status);
      if (!parsed.success) {
        throw new BadRequestException(
          `Invalid status "${status}" — must be one of: ${ReportStatus.options.join(', ')}`,
        );
      }
    }

    const rows = status
      ? await db
          .select()
          .from(reports)
          .where(and(eq(reports.target_server_id, serverId), eq(reports.status, status)))
      : await db.select().from(reports).where(eq(reports.target_server_id, serverId));

    return rows.map(rowToDto);
  }

  // -------------------------------------------------------------------------
  // resolveReport — POST /servers/:serverId/reports/:reportId/resolve
  //
  // Security chain (in order):
  //   1. Load report — 404 if not found.
  //   2. Cross-server tamper guard: report.target_server_id must equal serverId.
  //   3. Moderate_members gate (mirrors setMemberTimeout authz).
  //   4. Already-resolved/dismissed: 409 ConflictException.
  //   5. Dispatch action:
  //      'timeout'        → ModerationService.setMemberTimeout (rank guard inside).
  //      'delete_message' → resolve channel_id from messages row, then
  //                         MessagesService.deleteMessage (rank guard inside).
  //      'dismiss'        → no side effect.
  //   6. Flip status → 'resolved' | 'dismissed', set resolved_at + resolved_by.
  //   7. Return updated Report DTO.
  //
  // Already-resolved policy: 409 ConflictException — callers should check
  // status before resolving. This prevents accidental double-actions (e.g.
  // applying a second timeout on an already-resolved-via-dismiss report).
  // -------------------------------------------------------------------------

  async resolveReport(
    callerUserId: string,
    serverId: string,
    reportId: string,
    action: ResolveReportAction,
  ): Promise<Report> {
    // -----------------------------------------------------------------------
    // TOCTOU double-resolve guard — transaction + SELECT FOR UPDATE approach.
    //
    // We open a transaction and SELECT the report row FOR UPDATE so that a
    // second concurrent resolveReport call blocks at the SELECT until the first
    // transaction commits. When the second call finally acquires the lock it
    // re-reads the row and sees status !== 'open', throwing 409.
    //
    // ModerationService.setMemberTimeout and MessagesService.deleteMessage both
    // use the module-level `db` and cannot accept a tx handle, so their writes
    // fall outside this transaction boundary. That is acceptable: both side
    // effects are idempotent (soft-delete is idempotent; re-applying a timeout
    // overwrites with a fresh expiry). The row lock held from the FOR UPDATE
    // SELECT through the status-flip UPDATE ensures only one concurrent caller
    // proceeds past the open-check per report.
    //
    // The final status-flip UPDATE also carries an eq(reports.status, 'open')
    // predicate as a belt-and-suspenders guard: if the row lock path were ever
    // bypassed (e.g. READ COMMITTED isolation + a non-standard driver), an
    // empty .returning() here would still surface a ConflictException.
    // -----------------------------------------------------------------------

    return await db.transaction(async (tx) => {
      // Step 1: load the report — FOR UPDATE acquires a row lock, serialising
      // concurrent resolveReport calls on this report.
      const [report] = await tx
        .select()
        .from(reports)
        .where(eq(reports.id, reportId))
        .for('update')
        .limit(1);

      if (!report) {
        throw new NotFoundException(`Report ${reportId} not found`);
      }

      // Step 2: cross-server tamper guard
      // A moderator of server X MUST NOT action a report belonging to server Y.
      if (report.target_server_id !== serverId) {
        // Return 404 (not 403) to avoid leaking existence of reports in other servers.
        throw new NotFoundException(`Report ${reportId} not found`);
      }

      // Step 3: gate on moderate_members (mirrors setMemberTimeout authz)
      const canModerate = await this.rbacService.can(callerUserId, serverId, 'moderate_members');
      if (!canModerate) {
        throw new ForbiddenException('Insufficient permissions: moderate_members required');
      }

      // Step 4: already-resolved/dismissed → 409
      if (report.status !== 'open') {
        throw new ConflictException(`Report is already ${report.status} — cannot resolve again`);
      }

      // Step 5: dispatch action (runs against module-level db, outside this tx —
      // acceptable; see TOCTOU guard note above).
      if (action === 'timeout') {
        // Route through ModerationService — rank guard is enforced there.
        if (!report.target_user_id) {
          throw new BadRequestException(
            'Cannot apply timeout: report has no target_user_id (wrong target_type?)',
          );
        }
        // setMemberTimeout(serverId, callerUserId, targetUserId, durationMinutes)
        await this.moderationService.setMemberTimeout(
          serverId,
          callerUserId,
          report.target_user_id,
          DEFAULT_TIMEOUT_MINUTES,
        );
      } else if (action === 'delete_message') {
        // Resolve channel_id from the messages row — report does not store it.
        if (!report.target_message_id) {
          throw new BadRequestException(
            'Cannot delete message: report has no target_message_id (wrong target_type?)',
          );
        }
        const [msg] = await db
          .select({ channel_id: messages.channel_id })
          .from(messages)
          .where(eq(messages.id, report.target_message_id))
          .limit(1);
        if (!msg) {
          // Message already deleted (soft-delete, row still exists) is handled by
          // MessagesService.deleteMessage (idempotent). A missing row is unexpected.
          throw new NotFoundException('Message referenced by report not found');
        }
        // Route through MessagesService — delete rank guard enforced there.
        // deleteMessage(channelId, messageId, userId)
        await this.messagesService.deleteMessage(
          msg.channel_id,
          report.target_message_id,
          callerUserId,
        );
      }
      // 'dismiss' → no side effect; proceed to status flip.

      // Step 6: flip status — WHERE predicate includes eq(reports.status, 'open') as
      // a belt-and-suspenders guard. If returning() is empty, another resolve won
      // the race despite the row lock (should not happen under normal Postgres
      // READ COMMITTED + FOR UPDATE, but guarded defensively).
      const newStatus = action === 'dismiss' ? 'dismissed' : 'resolved';
      const now = new Date();

      const [updated] = await tx
        .update(reports)
        .set({
          status: newStatus,
          resolved_at: now,
          resolved_by: callerUserId,
        })
        .where(and(eq(reports.id, reportId), eq(reports.status, 'open')))
        .returning();

      if (!updated) {
        // Conditional flip found no 'open' row — another concurrent resolve won.
        throw new ConflictException('Report was resolved by a concurrent request');
      }

      return rowToDto(updated);
    });
  }
}
