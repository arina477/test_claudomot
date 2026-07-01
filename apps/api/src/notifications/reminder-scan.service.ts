import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { and, eq, gt, lte, sql } from 'drizzle-orm';
import { db } from '../db/index';
import {
  assignment_reminder,
  assignment_status,
  assignments,
  server_members,
  servers,
  users,
} from '../db/schema/index';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { EmailService } from '../email/email.service';

// ---------------------------------------------------------------------------
// ReminderScanService — wave-30 B-2 (task c5c30363, Refs 4a4c2715)
//
// Hourly cron that finds assignments due in the next 24 hours (strictly in the
// future — E2 past-due guard) and sends a one-time email reminder to each
// server member who has NOT marked the assignment 'done'.
//
// Send-once idempotency: INSERT INTO assignment_reminder ON CONFLICT DO NOTHING
// RETURNING id — email sent ONLY when a row is actually inserted.
//
// Resilience: per-assignment and per-member errors are caught, logged, and
// the scan continues (the whole scan is non-throwing).
// ---------------------------------------------------------------------------

@Injectable()
export class ReminderScanService {
  private readonly logger = new Logger(ReminderScanService.name);

  constructor(private readonly emailService: EmailService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async scanAndSendReminders(): Promise<void> {
    this.logger.log('ReminderScanService: starting hourly scan');

    // -----------------------------------------------------------------------
    // Step 1: find assignments due in the next 24 hours (strictly in future,
    //         E1 UTC / DB now(), E2 past-due guard: > now())
    //
    // due_date is included here so processAssignment can pass it straight to
    // sendReminderIfNew, eliminating the N per-member re-query of due_date
    // (N+1 fix) and the soft-delete/edit TOCTOU window between the scan and
    // the inner fetch.
    // -----------------------------------------------------------------------
    let dueAssignments: Array<{
      id: string;
      title: string;
      server_id: string;
      server_name: string;
      due_date: Date;
    }>;

    try {
      dueAssignments = await db
        .select({
          id: assignments.id,
          title: assignments.title,
          server_id: assignments.server_id,
          server_name: servers.name,
          due_date: assignments.due_date,
        })
        .from(assignments)
        .innerJoin(servers, eq(assignments.server_id, servers.id))
        .where(
          and(
            // E2 past-due guard: strictly greater than now()
            gt(assignments.due_date, sql`now()`),
            // 24-hour window upper bound
            lte(assignments.due_date, sql`now() + interval '24 hours'`),
            // exclude soft-deleted assignments
            eq(assignments.is_deleted, false),
          ),
        );
    } catch (err) {
      this.logger.error('ReminderScanService: failed to query due assignments', err);
      return;
    }

    this.logger.log(`ReminderScanService: found ${dueAssignments.length} assignment(s) in window`);

    let remindersSent = 0;
    let sendFailures = 0;

    for (const assignment of dueAssignments) {
      try {
        const counts = await this.processAssignment(assignment);
        remindersSent += counts.sent;
        sendFailures += counts.failures;
      } catch (err) {
        this.logger.error(
          `ReminderScanService: unhandled error processing assignment ${assignment.id}`,
          err,
        );
        // continue to next assignment
      }
    }

    const summary = {
      assignmentsScanned: dueAssignments.length,
      remindersSent,
      sendFailures,
    };

    if (sendFailures > 0) {
      this.logger.warn('ReminderScanService: scan complete (with send failures)', summary);
    } else {
      this.logger.log('ReminderScanService: scan complete', summary);
    }
  }

  // -------------------------------------------------------------------------
  // processAssignment — resolve recipients + send reminders for one assignment.
  //
  // Recipients = server_members of the assignment's server_id,
  //   LEFT JOIN assignment_status WHERE state IS DISTINCT FROM 'done'
  //   (mirrors the ?? 'todo' default: a member with NO status row has an
  //   effective state of 'todo' and MUST be reminded — an INNER JOIN would
  //   wrongly skip them).
  //   Anti-join against assignment_reminder (send-once via INSERT RETURNING).
  // -------------------------------------------------------------------------

  private async processAssignment(assignment: {
    id: string;
    title: string;
    server_id: string;
    server_name: string;
    due_date: Date;
  }): Promise<{ sent: number; failures: number }> {
    // -----------------------------------------------------------------------
    // The scan query — correctness-critical.
    //
    // SELECT sm.user_id, u.email
    // FROM server_members sm
    // JOIN users u ON u.id = sm.user_id
    // LEFT JOIN assignment_status ast
    //   ON ast.assignment_id = <id> AND ast.user_id = sm.user_id
    // WHERE sm.server_id = <server_id>
    //   AND (ast.state IS DISTINCT FROM 'done')
    //
    // IS DISTINCT FROM 'done':
    //   - row exists with state='done' → false (excluded — already done)
    //   - row exists with state='todo' → true  (included — not done)
    //   - no row (NULL)               → true  (included — mirrors ?? 'todo')
    //
    // We then exclude already-reminded members in the INSERT step
    // (ON CONFLICT DO NOTHING) rather than a separate pre-filter JOIN.
    // -----------------------------------------------------------------------
    let recipients: Array<{ user_id: string; email: string }>;

    try {
      recipients = await db
        .select({
          user_id: server_members.user_id,
          email: users.email,
        })
        .from(server_members)
        .innerJoin(users, eq(users.id, server_members.user_id))
        .leftJoin(
          assignment_status,
          and(
            eq(assignment_status.assignment_id, assignment.id),
            eq(assignment_status.user_id, server_members.user_id),
          ),
        )
        .where(
          and(
            eq(server_members.server_id, assignment.server_id),
            // IS DISTINCT FROM 'done': includes NULL (no row) and 'todo' rows
            sql`${assignment_status.state} IS DISTINCT FROM 'done'`,
          ),
        );
    } catch (err) {
      this.logger.error(
        `ReminderScanService: failed to query recipients for assignment ${assignment.id}`,
        err,
      );
      return { sent: 0, failures: 0 };
    }

    let sent = 0;
    let failures = 0;

    for (const recipient of recipients) {
      try {
        const didSend = await this.sendReminderIfNew(assignment, recipient);
        if (didSend) sent++;
      } catch (err) {
        failures++;
        this.logger.error(
          `ReminderScanService: unhandled error sending reminder to user ${recipient.user_id} for assignment ${assignment.id}`,
          err,
        );
        // continue to next recipient
      }
    }

    return { sent, failures };
  }

  // -------------------------------------------------------------------------
  // sendReminderIfNew — TOCTOU-safe send-once.
  //
  // INSERT INTO assignment_reminder ON CONFLICT DO NOTHING RETURNING id.
  // Send email ONLY when the RETURNING clause shows a row was created.
  // This prevents double-sends across concurrent ticks/instances/crashes.
  //
  // due_date is threaded in from the window query (Fix 1: no per-member
  // re-query of the assignment row — eliminates N+1 and the TOCTOU gap
  // between the scan query and the former inner fetch).
  //
  // Returns true when the email was sent (row newly inserted), false when
  // skipped (already sent or no email address). Throws on send failure so
  // the caller can increment its sendFailures counter.
  // -------------------------------------------------------------------------

  private async sendReminderIfNew(
    assignment: {
      id: string;
      title: string;
      server_id: string;
      server_name: string;
      due_date: Date;
    },
    recipient: { user_id: string; email: string },
  ): Promise<boolean> {
    // Skip members with null/empty email (guard: users.email is notNull in schema,
    // but belt-and-suspenders for any edge cases)
    if (!recipient.email) {
      this.logger.warn(
        `ReminderScanService: user ${recipient.user_id} has no email, skipping reminder for assignment ${assignment.id}`,
      );
      return false;
    }

    // TOCTOU-safe send-once: INSERT RETURNING tells us whether this tick "wins"
    const inserted = await db
      .insert(assignment_reminder)
      .values({
        assignment_id: assignment.id,
        user_id: recipient.user_id,
      })
      .onConflictDoNothing()
      .returning({ id: assignment_reminder.id });

    if (inserted.length === 0) {
      // Row already existed — reminder already sent in a previous tick
      this.logger.debug(
        `ReminderScanService: reminder already sent to user ${recipient.user_id} for assignment ${assignment.id}, skipping`,
      );
      return false;
    }

    // Row was just created — this tick owns the send
    await this.emailService.sendAssignmentReminder(recipient.email, {
      assignmentTitle: assignment.title,
      dueDate: assignment.due_date,
      serverName: assignment.server_name,
    });

    this.logger.log(
      `ReminderScanService: sent reminder to ${recipient.email} for assignment ${assignment.id}`,
    );

    return true;
  }
}
