/**
 * AssignmentsController unit tests — wave-22 M5 (task 01fcefb8)
 *
 * Covers:
 *   - POST /servers/:serverId/assignments: organizer create → 201
 *   - POST /servers/:serverId/assignments: invalid body → 400
 *   - GET /servers/:serverId/assignments: list → AssignmentListResponse
 *   - GET /assignments/:id: get → Assignment DTO
 *   - PATCH /assignments/:id: update → Assignment DTO
 *   - DELETE /assignments/:id: soft-delete → 204 (void)
 *   - PUT /assignments/:id/status: toggle → Assignment DTO
 *   - PUT /assignments/:id/status: invalid state → 400
 *   - POST /servers/:serverId/assignments/attachments/presign: presign → { uploadUrl, key }
 *   - POST /servers/:serverId/assignments/attachments/presign: missing contentType → 400
 */

import { BadRequestException, ForbiddenException } from '@nestjs/common';
import type {
  Assignment,
  AssignmentListResponse,
  AssignmentPresignResponse,
} from '@studyhall/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AssignmentsController } from './assignments.controller';

// ---------------------------------------------------------------------------
// Minimal request helper
// ---------------------------------------------------------------------------

function makeReq(userId = 'user-organizer') {
  return { session: { getUserId: () => userId } };
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SERVER_ID = 'server-001';
const ASSIGNMENT_ID = 'assign-001';

const mockAssignment: Assignment = {
  id: ASSIGNMENT_ID,
  serverId: SERVER_ID,
  organizerId: 'user-organizer',
  title: 'Test Assignment',
  description: 'Do the thing',
  dueDate: '2026-07-10T12:00:00.000Z',
  attachment: null,
  myStatus: 'todo',
  createdAt: '2026-06-30T10:00:00.000Z',
};

const _mockListResponse: AssignmentListResponse = {
  assignments: [mockAssignment],
};

const mockPresignResponse: AssignmentPresignResponse = {
  uploadUrl: 'https://presigned.example.com/upload',
  key: 'attachments/server-001/uuid.png',
};

// ---------------------------------------------------------------------------
// Controller factory — bypasses NestJS DI
// ---------------------------------------------------------------------------

function makeController() {
  const assignmentsService = {
    createAssignment: vi.fn<() => Promise<Assignment>>().mockResolvedValue(mockAssignment),
    listAssignments: vi.fn<() => Promise<Assignment[]>>().mockResolvedValue([mockAssignment]),
    getAssignment: vi.fn<() => Promise<Assignment>>().mockResolvedValue(mockAssignment),
    updateAssignment: vi.fn<() => Promise<Assignment>>().mockResolvedValue(mockAssignment),
    softDeleteAssignment: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
    toggleStatus: vi
      .fn<() => Promise<Assignment>>()
      .mockResolvedValue({ ...mockAssignment, myStatus: 'done' }),
    presignAttachmentUpload: vi
      .fn<() => Promise<AssignmentPresignResponse>>()
      .mockResolvedValue(mockPresignResponse),
  };
  // biome-ignore lint/suspicious/noExplicitAny: test mock
  const controller = new AssignmentsController(assignmentsService as any);
  return { controller, assignmentsService };
}

// ---------------------------------------------------------------------------
// POST /servers/:serverId/assignments
// ---------------------------------------------------------------------------

describe('AssignmentsController.createAssignment', () => {
  let controller: AssignmentsController;
  let assignmentsService: ReturnType<typeof makeController>['assignmentsService'];

  beforeEach(() => {
    ({ controller, assignmentsService } = makeController());
  });

  it('creates assignment and returns 201 with Assignment DTO', async () => {
    const body = {
      title: 'Test Assignment',
      description: 'Do the thing',
      dueDate: '2026-07-10T12:00:00.000Z',
    };

    const result = await controller.createAssignment(SERVER_ID, makeReq(), body);

    expect(assignmentsService.createAssignment).toHaveBeenCalledWith(
      SERVER_ID,
      'user-organizer',
      expect.objectContaining({ title: 'Test Assignment' }),
    );
    expect(result.id).toBe(ASSIGNMENT_ID);
  });

  it('throws 400 BadRequestException for missing title', async () => {
    const body = { dueDate: '2026-07-10T12:00:00.000Z' }; // missing title

    await expect(controller.createAssignment(SERVER_ID, makeReq(), body)).rejects.toBeInstanceOf(
      BadRequestException,
    );

    expect(assignmentsService.createAssignment).not.toHaveBeenCalled();
  });

  it('throws 400 BadRequestException for missing dueDate', async () => {
    const body = { title: 'Test Assignment' }; // missing dueDate

    await expect(controller.createAssignment(SERVER_ID, makeReq(), body)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});

// ---------------------------------------------------------------------------
// GET /servers/:serverId/assignments
// ---------------------------------------------------------------------------

describe('AssignmentsController.listAssignments', () => {
  let controller: AssignmentsController;
  let assignmentsService: ReturnType<typeof makeController>['assignmentsService'];

  beforeEach(() => {
    ({ controller, assignmentsService } = makeController());
  });

  it('returns AssignmentListResponse with assignments array', async () => {
    const result = await controller.listAssignments(SERVER_ID, makeReq('user-member'));

    expect(assignmentsService.listAssignments).toHaveBeenCalledWith(SERVER_ID, 'user-member');
    expect(result).toEqual({ assignments: [mockAssignment] });
  });

  it('returns 403 when service throws ForbiddenException (non-member)', async () => {
    assignmentsService.listAssignments.mockRejectedValue(new ForbiddenException());

    await expect(
      controller.listAssignments(SERVER_ID, makeReq('non-member')),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

// ---------------------------------------------------------------------------
// GET /assignments/:id
// ---------------------------------------------------------------------------

describe('AssignmentsController.getAssignment', () => {
  let controller: AssignmentsController;
  let assignmentsService: ReturnType<typeof makeController>['assignmentsService'];

  beforeEach(() => {
    ({ controller, assignmentsService } = makeController());
  });

  it('returns Assignment DTO for authenticated member', async () => {
    const result = await controller.getAssignment(ASSIGNMENT_ID, makeReq('user-member'));

    expect(assignmentsService.getAssignment).toHaveBeenCalledWith(ASSIGNMENT_ID, 'user-member');
    expect(result.id).toBe(ASSIGNMENT_ID);
  });
});

// ---------------------------------------------------------------------------
// PATCH /assignments/:id
// ---------------------------------------------------------------------------

describe('AssignmentsController.updateAssignment', () => {
  let controller: AssignmentsController;
  let assignmentsService: ReturnType<typeof makeController>['assignmentsService'];

  beforeEach(() => {
    ({ controller, assignmentsService } = makeController());
  });

  it('updates assignment and returns DTO', async () => {
    const body = { title: 'Updated Title' };
    const result = await controller.updateAssignment(ASSIGNMENT_ID, makeReq(), body);

    expect(assignmentsService.updateAssignment).toHaveBeenCalledWith(
      ASSIGNMENT_ID,
      'user-organizer',
      expect.objectContaining({ title: 'Updated Title' }),
    );
    expect(result.id).toBe(ASSIGNMENT_ID);
  });

  it('throws 400 for invalid update body (bad dueDate format)', async () => {
    const body = { dueDate: 'not-a-date' };

    await expect(
      controller.updateAssignment(ASSIGNMENT_ID, makeReq(), body),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

// ---------------------------------------------------------------------------
// DELETE /assignments/:id
// ---------------------------------------------------------------------------

describe('AssignmentsController.deleteAssignment', () => {
  let controller: AssignmentsController;
  let assignmentsService: ReturnType<typeof makeController>['assignmentsService'];

  beforeEach(() => {
    ({ controller, assignmentsService } = makeController());
  });

  it('calls softDeleteAssignment and returns void (204)', async () => {
    const result = await controller.deleteAssignment(ASSIGNMENT_ID, makeReq());

    expect(assignmentsService.softDeleteAssignment).toHaveBeenCalledWith(
      ASSIGNMENT_ID,
      'user-organizer',
    );
    expect(result).toBeUndefined();
  });

  it('propagates 403 ForbiddenException from service (non-organizer)', async () => {
    assignmentsService.softDeleteAssignment.mockRejectedValue(new ForbiddenException());

    await expect(
      controller.deleteAssignment(ASSIGNMENT_ID, makeReq('non-organizer')),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

// ---------------------------------------------------------------------------
// PUT /assignments/:id/status
// ---------------------------------------------------------------------------

describe('AssignmentsController.toggleStatus', () => {
  let controller: AssignmentsController;
  let assignmentsService: ReturnType<typeof makeController>['assignmentsService'];

  beforeEach(() => {
    ({ controller, assignmentsService } = makeController());
  });

  it('toggles status to done and returns updated DTO', async () => {
    const body = { state: 'done' };
    const result = await controller.toggleStatus(ASSIGNMENT_ID, makeReq('user-member'), body);

    expect(assignmentsService.toggleStatus).toHaveBeenCalledWith(
      ASSIGNMENT_ID,
      'user-member',
      'done',
    );
    expect(result.myStatus).toBe('done');
  });

  it('throws 400 for invalid state value', async () => {
    const body = { state: 'in-progress' }; // not in enum

    await expect(
      controller.toggleStatus(ASSIGNMENT_ID, makeReq('user-member'), body),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(assignmentsService.toggleStatus).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// POST /servers/:serverId/assignments/attachments/presign
// ---------------------------------------------------------------------------

describe('AssignmentsController.presignAttachment', () => {
  let controller: AssignmentsController;
  let assignmentsService: ReturnType<typeof makeController>['assignmentsService'];

  beforeEach(() => {
    ({ controller, assignmentsService } = makeController());
  });

  it('returns presign response for organizer with valid contentType', async () => {
    const body = { contentType: 'image/png' };
    const result = await controller.presignAttachment(SERVER_ID, makeReq(), body);

    expect(assignmentsService.presignAttachmentUpload).toHaveBeenCalledWith(
      SERVER_ID,
      'user-organizer',
      'image/png',
    );
    expect(result.uploadUrl).toBeDefined();
    expect(result.key).toBeDefined();
  });

  it('throws 400 when contentType is missing', async () => {
    const body = {}; // no contentType

    await expect(controller.presignAttachment(SERVER_ID, makeReq(), body)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
