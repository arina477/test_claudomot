import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import type {
  Assignment,
  AssignmentListResponse,
  AssignmentPresignResponse,
  AssignmentSubmission,
  AssignmentSubmissionPresignResponse,
} from '@studyhall/shared';
import {
  AssignmentStatusSchema,
  CreateAssignmentSchema,
  SubmitAssignmentSchema,
  UpdateAssignmentSchema,
} from '@studyhall/shared';
import { AuthGuard } from '../auth/auth.guard';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { AssignmentsService } from './assignments.service';

// ---------------------------------------------------------------------------
// AssignmentsController — wave-22 M5 (task 01fcefb8) + wave-42 (task db8e082a)
//
// Routes:
//   POST   /servers/:serverId/assignments                              — organizer create
//   GET    /servers/:serverId/assignments                              — member list (due ASC + myStatus)
//   POST   /servers/:serverId/assignments/attachments/presign         — organizer attachment presign
//   POST   /servers/:serverId/assignments/submissions/presign         — member submission presign (wave-42)
//   GET    /assignments/:id                                           — member get (serverId derived from row)
//   PATCH  /assignments/:id                                           — organizer update (serverId derived from row)
//   DELETE /assignments/:id                                           — organizer soft-delete (serverId derived from row)
//   PUT    /assignments/:id/status                                    — member toggle state
//   POST   /assignments/:id/submit                                    — member submit (wave-42)
//
// Security:
//   - @UseGuards(AuthGuard) on every route.
//   - Organizer authz: service.assertOrganizer → can(userId, serverId, 'manage_channels')
//     G3 carry: single call site; owner passes via superuser.
//   - Member authz: service.assertMember → server_members check.
//   - For /assignments/:id routes: serverId is derived from the assignment row
//     inside the service (rule-4 IDOR-safe — never from client params).
// ---------------------------------------------------------------------------

interface SessionAugmentedRequest {
  session: {
    getUserId(): string;
  };
}

@Controller()
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  // -------------------------------------------------------------------------
  // POST /servers/:serverId/assignments
  // Organizer-only create. Returns 201 with the created Assignment DTO.
  // -------------------------------------------------------------------------

  @Post('servers/:serverId/assignments')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createAssignment(
    @Param('serverId') serverId: string,
    @Req() req: SessionAugmentedRequest,
    @Body() body: unknown,
  ): Promise<Assignment> {
    const parsed = CreateAssignmentSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }

    const userId = req.session.getUserId();
    return this.assignmentsService.createAssignment(serverId, userId, parsed.data);
  }

  // -------------------------------------------------------------------------
  // GET /servers/:serverId/assignments
  // Member list — due_date ASC + myStatus per-user.
  // -------------------------------------------------------------------------

  @Get('servers/:serverId/assignments')
  @UseGuards(AuthGuard)
  async listAssignments(
    @Param('serverId') serverId: string,
    @Req() req: SessionAugmentedRequest,
  ): Promise<AssignmentListResponse> {
    const userId = req.session.getUserId();
    const items = await this.assignmentsService.listAssignments(serverId, userId);
    return { assignments: items };
  }

  // -------------------------------------------------------------------------
  // POST /servers/:serverId/assignments/attachments/presign
  // Organizer-only presign. Must be declared BEFORE /assignments/:id to avoid
  // NestJS route ambiguity ('attachments' matching ':id').
  // -------------------------------------------------------------------------

  @Post('servers/:serverId/assignments/attachments/presign')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async presignAttachment(
    @Param('serverId') serverId: string,
    @Req() req: SessionAugmentedRequest,
    @Body() body: unknown,
  ): Promise<AssignmentPresignResponse> {
    const parsed = (body as { contentType?: unknown }).contentType;
    if (typeof parsed !== 'string' || !parsed) {
      throw new BadRequestException('contentType (string) is required');
    }

    const userId = req.session.getUserId();
    return this.assignmentsService.presignAttachmentUpload(serverId, userId, parsed);
  }

  // -------------------------------------------------------------------------
  // POST /servers/:serverId/assignments/submissions/presign
  // Member-only submission attachment presign (wave-42 task db8e082a).
  // Declared BEFORE /assignments/:id to prevent 'submissions' shadowing ':id'.
  // -------------------------------------------------------------------------

  @Post('servers/:serverId/assignments/submissions/presign')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async presignSubmissionAttachment(
    @Param('serverId') serverId: string,
    @Req() req: SessionAugmentedRequest,
    @Body() body: unknown,
  ): Promise<AssignmentSubmissionPresignResponse> {
    const contentType = (body as { contentType?: unknown }).contentType;
    if (typeof contentType !== 'string' || !contentType) {
      throw new BadRequestException('contentType (string) is required');
    }

    const userId = req.session.getUserId();
    return this.assignmentsService.presignSubmissionAttachment(serverId, userId, contentType);
  }

  // -------------------------------------------------------------------------
  // GET /assignments/:id
  // Member get. serverId derived from assignment row in service (IDOR-safe).
  // -------------------------------------------------------------------------

  @Get('assignments/:id')
  @UseGuards(AuthGuard)
  async getAssignment(
    @Param('id') id: string,
    @Req() req: SessionAugmentedRequest,
  ): Promise<Assignment> {
    const userId = req.session.getUserId();
    return this.assignmentsService.getAssignment(id, userId);
  }

  // -------------------------------------------------------------------------
  // PATCH /assignments/:id
  // Organizer update. serverId derived from assignment row in service (IDOR-safe).
  // -------------------------------------------------------------------------

  @Patch('assignments/:id')
  @UseGuards(AuthGuard)
  async updateAssignment(
    @Param('id') id: string,
    @Req() req: SessionAugmentedRequest,
    @Body() body: unknown,
  ): Promise<Assignment> {
    const parsed = UpdateAssignmentSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }

    const userId = req.session.getUserId();
    return this.assignmentsService.updateAssignment(id, userId, parsed.data);
  }

  // -------------------------------------------------------------------------
  // DELETE /assignments/:id
  // Organizer soft-delete. Returns 204 No Content.
  // serverId derived from assignment row in service (IDOR-safe).
  // -------------------------------------------------------------------------

  @Delete('assignments/:id')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAssignment(
    @Param('id') id: string,
    @Req() req: SessionAugmentedRequest,
  ): Promise<void> {
    const userId = req.session.getUserId();
    return this.assignmentsService.softDeleteAssignment(id, userId);
  }

  // -------------------------------------------------------------------------
  // PUT /assignments/:id/status
  // Member toggle. serverId derived from assignment row in service (IDOR-safe).
  // Returns updated Assignment DTO with the caller's new myStatus.
  // -------------------------------------------------------------------------

  @Put('assignments/:id/status')
  @UseGuards(AuthGuard)
  async toggleStatus(
    @Param('id') id: string,
    @Req() req: SessionAugmentedRequest,
    @Body() body: unknown,
  ): Promise<Assignment> {
    const parsed = AssignmentStatusSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }

    const userId = req.session.getUserId();
    return this.assignmentsService.toggleStatus(id, userId, parsed.data.state);
  }

  // -------------------------------------------------------------------------
  // POST /assignments/:id/submit
  // Member submit (wave-42 task db8e082a). serverId derived from assignment row.
  // Returns 200 with the submitted AssignmentSubmission DTO.
  // -------------------------------------------------------------------------

  @Post('assignments/:id/submit')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async submitAssignment(
    @Param('id') id: string,
    @Req() req: SessionAugmentedRequest,
    @Body() body: unknown,
  ): Promise<AssignmentSubmission> {
    const parsed = SubmitAssignmentSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }

    const userId = req.session.getUserId();
    return this.assignmentsService.submitAssignment(id, userId, parsed.data);
  }
}
