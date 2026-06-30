import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import type {
  Assignment,
  AssignmentPresignResponse,
  CreateAssignmentInput,
  UpdateAssignmentInput,
} from '@studyhall/shared';
import { and, asc, eq } from 'drizzle-orm';
import { db } from '../db/index';
import {
  assignment_attachments,
  assignment_status,
  assignments,
  server_members,
} from '../db/schema/index';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { ATTACHMENT_ALLOWED_MIME, FilesService } from '../files/files.service';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { RbacService } from '../rbac/rbac.service';

// ---------------------------------------------------------------------------
// AssignmentsService — wave-22 M5 (task 01fcefb8)
//
// Organizer authz: rbac can(userId, serverId, 'manage_channels')
//   - G3 carry: single call site; owner passes via superuser path.
//   - Future swap to 'manage_assignments' is one line + additive roles migration.
//
// Attachment anti-spoof: headAttachment() BEFORE assignment_attachments INSERT.
//   - karen B-note 1: server-derived size+type; rejects >10MB (413).
//
// Soft-delete carry (karen B-note 2): is_deleted=true does NOT remove
//   assignment_status rows. Status rows are HIDDEN via is_deleted-excluding
//   list query. CASCADE FK is for hard DELETE only.
// ---------------------------------------------------------------------------

const ATTACHMENT_MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB — mirrors FilesService constant

@Injectable()
export class AssignmentsService {
  private readonly logger = new Logger(AssignmentsService.name);

  constructor(
    private readonly rbacService: RbacService,
    private readonly filesService: FilesService,
  ) {}

  // -------------------------------------------------------------------------
  // assertOrganizer — gate on can(userId, serverId, 'manage_channels')
  // Single call site per G3 annotation. Throws 403 on failure.
  // -------------------------------------------------------------------------

  private async assertOrganizer(userId: string, serverId: string): Promise<void> {
    const allowed = await this.rbacService.can(userId, serverId, 'manage_channels');
    if (!allowed) {
      throw new ForbiddenException(
        'Insufficient permissions: organizer (manage_channels) required',
      );
    }
  }

  // -------------------------------------------------------------------------
  // assertMember — gate on server_members membership (no role needed)
  // Used by list/get/toggleStatus routes.
  // -------------------------------------------------------------------------

  private async assertMember(userId: string, serverId: string): Promise<void> {
    const [member] = await db
      .select({ id: server_members.id })
      .from(server_members)
      .where(and(eq(server_members.server_id, serverId), eq(server_members.user_id, userId)))
      .limit(1);

    if (!member) {
      throw new ForbiddenException('You are not a member of this server');
    }
  }

  // -------------------------------------------------------------------------
  // validateAndHeadAttachment — server-derive size+type via HeadObject BEFORE
  // inserting assignment_attachments row (karen B-note 1 anti-spoof pattern).
  //
  // Returns { sizeBytes, contentType } on success.
  // Throws 400 for unsupported content-type.
  // Throws 413 for size > 10MB.
  // -------------------------------------------------------------------------

  private async validateAndHeadAttachment(
    key: string,
  ): Promise<{ sizeBytes: number; contentType: string }> {
    const { contentLength, contentType } = await this.filesService.headAttachment(key);

    if (!ATTACHMENT_ALLOWED_MIME[contentType]) {
      throw new BadRequestException(
        `Unsupported attachment content-type: ${contentType}. Allowed: ${Object.keys(ATTACHMENT_ALLOWED_MIME).join(', ')}`,
      );
    }

    if (contentLength > ATTACHMENT_MAX_SIZE_BYTES) {
      this.logger.warn(
        `Assignment attachment rejected — size ${contentLength} bytes exceeds ${ATTACHMENT_MAX_SIZE_BYTES} byte cap (key: ${key})`,
      );
      throw new PayloadTooLargeException({
        code: 'ATTACHMENT_TOO_LARGE',
        message: `Attachment must be ≤ 10 MB. Uploaded file is ${Math.ceil(contentLength / 1024)} KB.`,
      });
    }

    return { sizeBytes: contentLength, contentType };
  }

  // -------------------------------------------------------------------------
  // rowToDto — map DB rows to Assignment DTO
  // -------------------------------------------------------------------------

  private async rowToDto(
    row: {
      id: string;
      server_id: string;
      organizer_id: string;
      title: string;
      description: string | null;
      due_date: Date;
      is_deleted: boolean;
      created_at: Date;
      updated_at: Date;
    },
    userId: string,
  ): Promise<Assignment> {
    // Fetch per-user status (LEFT JOIN semantics — default 'todo' if no row)
    const [statusRow] = await db
      .select({ state: assignment_status.state })
      .from(assignment_status)
      .where(
        and(eq(assignment_status.assignment_id, row.id), eq(assignment_status.user_id, userId)),
      )
      .limit(1);

    const myStatus = (statusRow?.state as 'todo' | 'done') ?? 'todo';

    // Fetch attachment (0-1 per assignment)
    const [attachmentRow] = await db
      .select()
      .from(assignment_attachments)
      .where(eq(assignment_attachments.assignment_id, row.id))
      .limit(1);

    let attachment: Assignment['attachment'] = null;
    if (attachmentRow) {
      const url = await this.filesService.resolveAttachmentUrl(attachmentRow.object_key);
      attachment = {
        id: attachmentRow.id,
        filename: attachmentRow.filename,
        contentType: attachmentRow.content_type,
        sizeBytes: attachmentRow.size_bytes,
        url: url ?? '',
      };
    }

    return {
      id: row.id,
      serverId: row.server_id,
      organizerId: row.organizer_id,
      title: row.title,
      description: row.description ?? null,
      dueDate: row.due_date.toISOString(),
      attachment,
      myStatus,
      createdAt: row.created_at.toISOString(),
    };
  }

  // -------------------------------------------------------------------------
  // createAssignment — POST /servers/:serverId/assignments
  //
  // Organizer authz: can(organizerId, serverId, 'manage_channels').
  // Attachment: headAttachment BEFORE assignment_attachments INSERT (anti-spoof).
  // -------------------------------------------------------------------------

  async createAssignment(
    serverId: string,
    organizerId: string,
    dto: CreateAssignmentInput,
  ): Promise<Assignment> {
    // G3: single organizer authz call site
    await this.assertOrganizer(organizerId, serverId);

    // Validate attachment BEFORE inserting assignment row (anti-spoof, karen B-note 1)
    let attachmentMeta: {
      key: string;
      filename: string;
      sizeBytes: number;
      contentType: string;
    } | null = null;
    if (dto.attachment) {
      const { sizeBytes, contentType } = await this.validateAndHeadAttachment(dto.attachment.key);
      attachmentMeta = {
        key: dto.attachment.key,
        filename: dto.attachment.filename,
        sizeBytes,
        contentType,
      };
    }

    const [inserted] = await db
      .insert(assignments)
      .values({
        server_id: serverId,
        organizer_id: organizerId,
        title: dto.title,
        description: dto.description ?? null,
        due_date: new Date(dto.dueDate),
      })
      .returning();

    if (!inserted) throw new Error('Assignment insert failed unexpectedly');

    // Insert attachment row AFTER server-validation (key validated above)
    if (attachmentMeta) {
      await db.insert(assignment_attachments).values({
        assignment_id: inserted.id,
        object_key: attachmentMeta.key,
        filename: attachmentMeta.filename,
        content_type: attachmentMeta.contentType,
        size_bytes: attachmentMeta.sizeBytes,
      });
    }

    return this.rowToDto(inserted, organizerId);
  }

  // -------------------------------------------------------------------------
  // listAssignments — GET /servers/:serverId/assignments
  //
  // Member authz. Excludes is_deleted=true. Ordered by due_date ASC.
  // myStatus per-user via rowToDto LEFT JOIN.
  // -------------------------------------------------------------------------

  async listAssignments(serverId: string, userId: string): Promise<Assignment[]> {
    await this.assertMember(userId, serverId);

    const rows = await db
      .select()
      .from(assignments)
      .where(and(eq(assignments.server_id, serverId), eq(assignments.is_deleted, false)))
      .orderBy(asc(assignments.due_date));

    return Promise.all(rows.map((row) => this.rowToDto(row, userId)));
  }

  // -------------------------------------------------------------------------
  // getAssignment — GET /assignments/:id
  //
  // Derives serverId from the assignment row (rule-4 IDOR-safe).
  // Member authz. Excludes is_deleted.
  // -------------------------------------------------------------------------

  async getAssignment(id: string, userId: string): Promise<Assignment> {
    const [row] = await db
      .select()
      .from(assignments)
      .where(and(eq(assignments.id, id), eq(assignments.is_deleted, false)))
      .limit(1);

    if (!row) throw new NotFoundException('Assignment not found');

    // Derive serverId from row (IDOR-safe — never trust client param)
    await this.assertMember(userId, row.server_id);

    return this.rowToDto(row, userId);
  }

  // -------------------------------------------------------------------------
  // updateAssignment — PATCH /assignments/:id
  //
  // Derives serverId from the assignment row (rule-4 IDOR-safe).
  // Organizer authz.
  // Attachment update: headAttachment BEFORE INSERT/replace.
  // -------------------------------------------------------------------------

  async updateAssignment(
    id: string,
    organizerId: string,
    dto: UpdateAssignmentInput,
  ): Promise<Assignment> {
    const [existing] = await db
      .select()
      .from(assignments)
      .where(and(eq(assignments.id, id), eq(assignments.is_deleted, false)))
      .limit(1);

    if (!existing) throw new NotFoundException('Assignment not found');

    // Derive serverId from row (IDOR-safe)
    await this.assertOrganizer(organizerId, existing.server_id);

    // Build partial patch
    const patch: {
      title?: string;
      description?: string | null;
      due_date?: Date;
      updated_at: Date;
    } = { updated_at: new Date() };

    if (dto.title !== undefined) patch.title = dto.title;
    if (dto.description !== undefined) patch.description = dto.description ?? null;
    if (dto.dueDate !== undefined) patch.due_date = new Date(dto.dueDate);

    const [updated] = await db
      .update(assignments)
      .set(patch)
      .where(eq(assignments.id, id))
      .returning();

    if (!updated) throw new Error('Assignment update failed unexpectedly');

    // Handle attachment update: replace if provided, remove if null explicitly
    if (dto.attachment !== undefined) {
      // Remove existing attachment rows for this assignment
      await db.delete(assignment_attachments).where(eq(assignment_attachments.assignment_id, id));

      if (dto.attachment !== null) {
        // Server-validate before insert (anti-spoof)
        const { sizeBytes, contentType } = await this.validateAndHeadAttachment(dto.attachment.key);
        await db.insert(assignment_attachments).values({
          assignment_id: id,
          object_key: dto.attachment.key,
          filename: dto.attachment.filename,
          content_type: contentType,
          size_bytes: sizeBytes,
        });
      }
    }

    return this.rowToDto(updated, organizerId);
  }

  // -------------------------------------------------------------------------
  // softDeleteAssignment — DELETE /assignments/:id
  //
  // Derives serverId from the assignment row (rule-4 IDOR-safe).
  // Organizer authz. Sets is_deleted=true.
  //
  // karen B-note 2: does NOT remove assignment_status rows. Those rows remain
  // in the DB; they are hidden because the list query excludes is_deleted=true
  // rows. CASCADE fires only on a hard row DELETE — this is a soft-delete only.
  // -------------------------------------------------------------------------

  async softDeleteAssignment(id: string, organizerId: string): Promise<void> {
    const [existing] = await db
      .select()
      .from(assignments)
      .where(and(eq(assignments.id, id), eq(assignments.is_deleted, false)))
      .limit(1);

    if (!existing) throw new NotFoundException('Assignment not found');

    // Derive serverId from row (IDOR-safe)
    await this.assertOrganizer(organizerId, existing.server_id);

    await db
      .update(assignments)
      .set({ is_deleted: true, updated_at: new Date() })
      .where(eq(assignments.id, id));

    // NOTE: assignment_status rows for this assignment are intentionally NOT
    // deleted here. They remain in the DB and are hidden by the is_deleted
    // exclusion in listAssignments. CASCADE DELETE is for hard deletes only.
  }

  // -------------------------------------------------------------------------
  // toggleStatus — PUT /assignments/:id/status
  //
  // Member authz (server membership, NOT organizer check).
  // Upsert ON CONFLICT(assignment_id, user_id) DO UPDATE state.
  // One row per (assignment, user): A's toggle never affects B's row.
  // -------------------------------------------------------------------------

  async toggleStatus(
    assignmentId: string,
    userId: string,
    state: 'todo' | 'done',
  ): Promise<Assignment> {
    // Fetch assignment (also checks is_deleted=false)
    const [row] = await db
      .select()
      .from(assignments)
      .where(and(eq(assignments.id, assignmentId), eq(assignments.is_deleted, false)))
      .limit(1);

    if (!row) throw new NotFoundException('Assignment not found');

    // Derive serverId from row (IDOR-safe), then check membership
    await this.assertMember(userId, row.server_id);

    // Upsert per-user status row — ON CONFLICT(assignment_id, user_id) DO UPDATE
    // Mirrors the rbac onConflictDoUpdate precedent (~L478 rbac.service.ts)
    await db
      .insert(assignment_status)
      .values({
        assignment_id: assignmentId,
        user_id: userId,
        state,
      })
      .onConflictDoUpdate({
        target: [assignment_status.assignment_id, assignment_status.user_id],
        set: { state, updated_at: new Date() },
      });

    return this.rowToDto(row, userId);
  }

  // -------------------------------------------------------------------------
  // presignAttachmentUpload — POST /servers/:serverId/assignments/attachments/presign
  //
  // Organizer-only. Reuses FilesService.presignAttachmentUpload with serverId
  // as the scope key (mirrors the channel-scoped attachment presign pattern).
  // -------------------------------------------------------------------------

  async presignAttachmentUpload(
    serverId: string,
    organizerId: string,
    contentType: string,
  ): Promise<AssignmentPresignResponse> {
    await this.assertOrganizer(organizerId, serverId);

    if (!ATTACHMENT_ALLOWED_MIME[contentType]) {
      throw new BadRequestException(
        `Unsupported content-type: ${contentType}. Allowed: ${Object.keys(ATTACHMENT_ALLOWED_MIME).join(', ')}`,
      );
    }

    // Reuse FilesService presign — scope key is serverId (assignment-scoped uploads)
    const { uploadUrl, key } = await this.filesService.presignAttachmentUpload(
      serverId,
      organizerId,
      contentType,
    );

    return { uploadUrl, key };
  }
}
