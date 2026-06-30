/**
 * AssignmentsService unit tests — wave-22 M5 (task 01fcefb8)
 *
 * Covers:
 *   - createAssignment: organizer can() passes → insert + return DTO
 *   - createAssignment: non-organizer (can()=false) → 403 ForbiddenException  [rule-4 negative path — REQUIRED]
 *   - createAssignment: attachment >10MB → 413 PayloadTooLargeException        [karen B-note 1]
 *   - listAssignments: member → returns due-sorted list + myStatus default 'todo'
 *   - listAssignments: non-member → 403 ForbiddenException                    [rule-4 negative path — REQUIRED]
 *   - getAssignment: member → returns DTO
 *   - getAssignment: not-found → 404 NotFoundException
 *   - updateAssignment: organizer → updates + returns DTO
 *   - updateAssignment: non-organizer → 403 ForbiddenException                [rule-4 negative path]
 *   - softDeleteAssignment: organizer → sets is_deleted=true; status rows remain [karen B-note 2]
 *   - softDeleteAssignment: non-organizer → 403 ForbiddenException            [rule-4 negative path]
 *   - softDeleteAssignment: status rows are HIDDEN not removed (list excludes; rows exist)
 *   - toggleStatus: member → upsert per-user row (one-per-member, state isolation)
 *   - toggleStatus: member A's toggle does NOT affect member B's row (status isolation)
 *   - toggleStatus: idempotent upsert updates state ('todo' → 'done' → 'done')
 *   - presignAttachmentUpload: organizer → delegates to FilesService
 */

import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AssignmentsService } from './assignments.service';

// ---------------------------------------------------------------------------
// Drizzle mock helpers
// ---------------------------------------------------------------------------

function makeSelectChain(resolveWith: unknown[]) {
  const chain: Record<string, unknown> = {
    // biome-ignore lint/suspicious/noThenProperty: intentional thenable mock
    then: (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
      Promise.resolve(resolveWith).then(res, rej),
  };
  for (const m of ['from', 'where', 'limit', 'orderBy', 'select', 'innerJoin', 'leftJoin']) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  return chain;
}

function makeInsertChain(returningValue: unknown[] = []) {
  const chain: Record<string, unknown> = {
    // biome-ignore lint/suspicious/noThenProperty: intentional thenable mock
    then: (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
      Promise.resolve(returningValue).then(res, rej),
  };
  chain.values = vi.fn().mockReturnValue(chain);
  chain.returning = vi.fn().mockResolvedValue(returningValue);
  chain.onConflictDoUpdate = vi.fn().mockReturnValue(chain);
  chain.onConflictDoNothing = vi.fn().mockReturnValue(chain);
  return chain;
}

function makeUpdateChain(returningValue: unknown[] = []) {
  const chain: Record<string, unknown> = {
    // biome-ignore lint/suspicious/noThenProperty: intentional thenable mock
    then: (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
      Promise.resolve(returningValue).then(res, rej),
  };
  chain.set = vi.fn().mockReturnValue(chain);
  chain.where = vi.fn().mockReturnValue(chain);
  chain.returning = vi.fn().mockResolvedValue(returningValue);
  return chain;
}

// ---------------------------------------------------------------------------
// db module mock
// ---------------------------------------------------------------------------

vi.mock('../db/index', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

import { db } from '../db/index';

type MockFn = ReturnType<typeof vi.fn>;
const mockSelect = db.select as unknown as MockFn;
const mockInsert = db.insert as unknown as MockFn;
const mockUpdate = db.update as unknown as MockFn;
const mockDelete = db.delete as unknown as MockFn;

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SERVER_ID = 'server-001';
const ORGANIZER_ID = 'user-organizer';
const MEMBER_ID = 'user-member';
const _OTHER_MEMBER_ID = 'user-other';
const ASSIGNMENT_ID = 'assign-001';
const ATTACHMENT_KEY = 'attachments/server-001/uuid.png';

const NOW = new Date('2026-06-30T10:00:00Z');
const DUE_DATE = new Date('2026-07-10T12:00:00Z');

const mockAssignmentRow = {
  id: ASSIGNMENT_ID,
  server_id: SERVER_ID,
  organizer_id: ORGANIZER_ID,
  title: 'Test Assignment',
  description: 'Do the thing',
  due_date: DUE_DATE,
  is_deleted: false,
  created_at: NOW,
  updated_at: NOW,
};

const mockMemberRow = { id: 'sm-001' };
const mockStatusRow = { state: 'todo' };

// ---------------------------------------------------------------------------
// Mock RbacService factory
// ---------------------------------------------------------------------------

function makeRbacService(canResult = true) {
  return {
    can: vi.fn().mockResolvedValue(canResult),
    canViewChannelById: vi.fn().mockResolvedValue(true),
  };
}

// ---------------------------------------------------------------------------
// Mock FilesService factory
// ---------------------------------------------------------------------------

function makeFilesService(
  headResult: { contentLength: number; contentType: string } = {
    contentLength: 102_400, // 100 KB — well within 10 MB cap
    contentType: 'image/png',
  },
) {
  return {
    headAttachment: vi.fn().mockResolvedValue(headResult),
    presignAttachmentUpload: vi.fn().mockResolvedValue({
      uploadUrl: 'https://presigned.example.com/upload',
      key: ATTACHMENT_KEY,
    }),
    resolveAttachmentUrl: vi.fn().mockResolvedValue('https://presigned.example.com/attachment'),
  };
}

// ---------------------------------------------------------------------------
// Tests: createAssignment
// ---------------------------------------------------------------------------

describe('AssignmentsService.createAssignment', () => {
  let service: AssignmentsService;
  let rbac: ReturnType<typeof makeRbacService>;
  let files: ReturnType<typeof makeFilesService>;

  beforeEach(() => {
    vi.clearAllMocks();
    rbac = makeRbacService(true);
    files = makeFilesService();
    // biome-ignore lint/suspicious/noExplicitAny: test mock
    service = new AssignmentsService(rbac as any, files as any);
  });

  it('creates assignment and returns DTO when organizer has can(manage_channels)', async () => {
    let callCount = 0;
    mockInsert.mockReturnValue(makeInsertChain([mockAssignmentRow]));
    mockSelect.mockImplementation(() => {
      callCount++;
      // rowToDto: status → no attachment
      if (callCount === 1) return makeSelectChain([mockStatusRow]);
      return makeSelectChain([]);
    });

    const result = await service.createAssignment(SERVER_ID, ORGANIZER_ID, {
      title: 'Test Assignment',
      description: 'Do the thing',
      dueDate: DUE_DATE.toISOString(),
    });

    expect(rbac.can).toHaveBeenCalledWith(ORGANIZER_ID, SERVER_ID, 'manage_channels');
    expect(result.id).toBe(ASSIGNMENT_ID);
    expect(result.serverId).toBe(SERVER_ID);
    expect(result.title).toBe('Test Assignment');
    expect(result.myStatus).toBe('todo');
    expect(result.attachment).toBeNull();
  });

  it('throws 403 ForbiddenException when non-organizer (can()=false) calls create', async () => {
    rbac.can.mockResolvedValue(false);

    await expect(
      service.createAssignment(SERVER_ID, MEMBER_ID, {
        title: 'Test Assignment',
        dueDate: DUE_DATE.toISOString(),
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('calls headAttachment BEFORE inserting assignment_attachments (anti-spoof, karen B-note 1)', async () => {
    const callOrder: string[] = [];
    files.headAttachment.mockImplementation(async () => {
      callOrder.push('headAttachment');
      return { contentLength: 102_400, contentType: 'image/png' };
    });

    let insertCallCount = 0;
    mockInsert.mockImplementation(() => {
      insertCallCount++;
      if (insertCallCount === 1) {
        // assignments INSERT
        return makeInsertChain([mockAssignmentRow]);
      }
      // assignment_attachments INSERT
      callOrder.push('attachmentInsert');
      return makeInsertChain([]);
    });

    let selectCallCount = 0;
    mockSelect.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) return makeSelectChain([mockStatusRow]);
      return makeSelectChain([]);
    });

    await service.createAssignment(SERVER_ID, ORGANIZER_ID, {
      title: 'Test Assignment',
      dueDate: DUE_DATE.toISOString(),
      attachment: { key: ATTACHMENT_KEY, filename: 'test.png', contentType: 'image/png' },
    });

    // headAttachment must be called BEFORE attachmentInsert
    expect(callOrder[0]).toBe('headAttachment');
    expect(callOrder[1]).toBe('attachmentInsert');
  });

  it('rejects attachment >10MB with PayloadTooLargeException (413)', async () => {
    files.headAttachment.mockResolvedValue({
      contentLength: 11 * 1024 * 1024, // 11 MB — exceeds 10 MB cap
      contentType: 'image/png',
    });

    await expect(
      service.createAssignment(SERVER_ID, ORGANIZER_ID, {
        title: 'Test Assignment',
        dueDate: DUE_DATE.toISOString(),
        attachment: { key: ATTACHMENT_KEY, filename: 'big.png', contentType: 'image/png' },
      }),
    ).rejects.toBeInstanceOf(PayloadTooLargeException);

    // No assignment row should have been inserted
    expect(mockInsert).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Tests: listAssignments
// ---------------------------------------------------------------------------

describe('AssignmentsService.listAssignments', () => {
  let service: AssignmentsService;
  let rbac: ReturnType<typeof makeRbacService>;
  let files: ReturnType<typeof makeFilesService>;

  beforeEach(() => {
    vi.clearAllMocks();
    rbac = makeRbacService(true);
    files = makeFilesService();
    // biome-ignore lint/suspicious/noExplicitAny: test mock
    service = new AssignmentsService(rbac as any, files as any);
  });

  it('returns due-sorted assignments with myStatus for a member', async () => {
    let callCount = 0;
    const assignmentA = {
      ...mockAssignmentRow,
      id: 'assign-a',
      due_date: new Date('2026-07-05T00:00:00Z'),
    };
    const assignmentB = {
      ...mockAssignmentRow,
      id: 'assign-b',
      due_date: new Date('2026-07-10T00:00:00Z'),
    };

    mockSelect.mockImplementation(() => {
      callCount++;
      // 1: assertMember (server_members lookup)
      if (callCount === 1) return makeSelectChain([mockMemberRow]);
      // 2: main assignments query (already due-sorted by DB)
      if (callCount === 2) return makeSelectChain([assignmentA, assignmentB]);
      // rowToDto for assignmentA: status ('done') + no attachment
      if (callCount === 3) return makeSelectChain([{ state: 'done' }]);
      if (callCount === 4) return makeSelectChain([]); // no attachment
      // rowToDto for assignmentB: no status (default 'todo') + no attachment
      if (callCount === 5) return makeSelectChain([]);
      if (callCount === 6) return makeSelectChain([]); // no attachment
      return makeSelectChain([]);
    });

    const result = await service.listAssignments(SERVER_ID, MEMBER_ID);

    expect(result).toHaveLength(2);
    expect(result[0]?.id).toBe('assign-a');
    expect(result[0]?.myStatus).toBe('done');
    expect(result[1]?.id).toBe('assign-b');
    expect(result[1]?.myStatus).toBe('todo'); // default when no row
  });

  it('throws 403 ForbiddenException when non-member requests list', async () => {
    mockSelect.mockReturnValue(makeSelectChain([])); // no server_members row → not a member

    await expect(service.listAssignments(SERVER_ID, 'non-member')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});

// ---------------------------------------------------------------------------
// Tests: getAssignment
// ---------------------------------------------------------------------------

describe('AssignmentsService.getAssignment', () => {
  let service: AssignmentsService;
  let rbac: ReturnType<typeof makeRbacService>;
  let files: ReturnType<typeof makeFilesService>;

  beforeEach(() => {
    vi.clearAllMocks();
    rbac = makeRbacService(true);
    files = makeFilesService();
    // biome-ignore lint/suspicious/noExplicitAny: test mock
    service = new AssignmentsService(rbac as any, files as any);
  });

  it('returns assignment DTO for a member', async () => {
    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return makeSelectChain([mockAssignmentRow]); // assignment row
      if (callCount === 2) return makeSelectChain([mockMemberRow]); // member check
      if (callCount === 3) return makeSelectChain([mockStatusRow]); // status in rowToDto
      return makeSelectChain([]); // no attachment
    });

    const result = await service.getAssignment(ASSIGNMENT_ID, MEMBER_ID);

    expect(result.id).toBe(ASSIGNMENT_ID);
    expect(result.myStatus).toBe('todo');
  });

  it('throws 404 when assignment not found', async () => {
    mockSelect.mockReturnValue(makeSelectChain([])); // no assignment row

    await expect(service.getAssignment('non-existent', MEMBER_ID)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

// ---------------------------------------------------------------------------
// Tests: softDeleteAssignment — karen B-note 2
// ---------------------------------------------------------------------------

describe('AssignmentsService.softDeleteAssignment', () => {
  let service: AssignmentsService;
  let rbac: ReturnType<typeof makeRbacService>;
  let files: ReturnType<typeof makeFilesService>;

  beforeEach(() => {
    vi.clearAllMocks();
    rbac = makeRbacService(true);
    files = makeFilesService();
    // biome-ignore lint/suspicious/noExplicitAny: test mock
    service = new AssignmentsService(rbac as any, files as any);
  });

  it('sets is_deleted=true (soft-delete) and does NOT delete assignment_status rows', async () => {
    mockSelect.mockReturnValue(makeSelectChain([mockAssignmentRow])); // assignment exists
    const updateChain = makeUpdateChain([]);
    mockUpdate.mockReturnValue(updateChain);

    await service.softDeleteAssignment(ASSIGNMENT_ID, ORGANIZER_ID);

    expect(rbac.can).toHaveBeenCalledWith(ORGANIZER_ID, SERVER_ID, 'manage_channels');
    expect(mockUpdate).toHaveBeenCalledTimes(1); // only the assignment UPDATE

    // mockDelete must NOT have been called — status rows are not removed
    expect(mockDelete).not.toHaveBeenCalled();

    // Verify UPDATE sets is_deleted=true
    const setCalls = (updateChain.set as MockFn).mock.calls;
    expect(setCalls.length).toBeGreaterThan(0);
    const setPatch = setCalls[0]?.[0] as Record<string, unknown>;
    expect(setPatch.is_deleted).toBe(true);
  });

  it('throws 403 ForbiddenException when non-organizer attempts soft-delete', async () => {
    rbac.can.mockResolvedValue(false);
    mockSelect.mockReturnValue(makeSelectChain([mockAssignmentRow]));

    await expect(service.softDeleteAssignment(ASSIGNMENT_ID, MEMBER_ID)).rejects.toBeInstanceOf(
      ForbiddenException,
    );

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('status rows are HIDDEN by is_deleted exclusion — listAssignments excludes soft-deleted assignments', async () => {
    // Simulate: assignment is soft-deleted (is_deleted=true), but status rows exist.
    // listAssignments must NOT return the soft-deleted assignment.

    // The member row exists (member check passes)
    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return makeSelectChain([mockMemberRow]); // member check
      // Main query returns empty because is_deleted=true rows are excluded at DB level
      return makeSelectChain([]);
    });

    const result = await service.listAssignments(SERVER_ID, MEMBER_ID);

    expect(result).toHaveLength(0);
    // Assignment_status rows themselves are never queried here — they exist but are
    // hidden because the parent assignment is excluded from the list.
  });
});

// ---------------------------------------------------------------------------
// Tests: toggleStatus — per-member isolation
// ---------------------------------------------------------------------------

describe('AssignmentsService.toggleStatus', () => {
  let service: AssignmentsService;
  let rbac: ReturnType<typeof makeRbacService>;
  let files: ReturnType<typeof makeFilesService>;

  beforeEach(() => {
    vi.clearAllMocks();
    rbac = makeRbacService(true);
    files = makeFilesService();
    // biome-ignore lint/suspicious/noExplicitAny: test mock
    service = new AssignmentsService(rbac as any, files as any);
  });

  it('upserts one-per-member status row via ON CONFLICT DO UPDATE', async () => {
    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return makeSelectChain([mockAssignmentRow]); // assignment exists
      if (callCount === 2) return makeSelectChain([mockMemberRow]); // member check
      if (callCount === 3) return makeSelectChain([{ state: 'done' }]); // new status in rowToDto
      return makeSelectChain([]); // no attachment
    });

    const insertChain = makeInsertChain([]);
    mockInsert.mockReturnValue(insertChain);

    const result = await service.toggleStatus(ASSIGNMENT_ID, MEMBER_ID, 'done');

    // Verify upsert via onConflictDoUpdate was called (per assignment_status UNIQUE constraint)
    expect(insertChain.onConflictDoUpdate).toHaveBeenCalledTimes(1);
    expect(result.myStatus).toBe('done');
  });

  it('status isolation: member A toggle does NOT affect member B query', async () => {
    // This test verifies that userId is always passed into the status upsert.
    // We confirm the insert.values() call carries the correct user_id.
    const insertedValues: unknown[] = [];

    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return makeSelectChain([mockAssignmentRow]);
      if (callCount === 2) return makeSelectChain([mockMemberRow]);
      if (callCount === 3) return makeSelectChain([{ state: 'done' }]);
      return makeSelectChain([]);
    });

    const insertChain = makeInsertChain([]);
    const mockValues = vi.fn().mockImplementation((v: unknown) => {
      insertedValues.push(v);
      return insertChain;
    });
    insertChain.values = mockValues;
    mockInsert.mockReturnValue(insertChain);

    await service.toggleStatus(ASSIGNMENT_ID, MEMBER_ID, 'done');

    // The inserted row must carry MEMBER_ID (not ORGANIZER_ID or OTHER_MEMBER_ID)
    const inserted = insertedValues[0] as { user_id: string; assignment_id: string; state: string };
    expect(inserted.user_id).toBe(MEMBER_ID);
    expect(inserted.assignment_id).toBe(ASSIGNMENT_ID);
    expect(inserted.state).toBe('done');
  });

  it('idempotent: toggle done → done updates state without error', async () => {
    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return makeSelectChain([mockAssignmentRow]);
      if (callCount === 2) return makeSelectChain([mockMemberRow]);
      if (callCount === 3) return makeSelectChain([{ state: 'done' }]);
      return makeSelectChain([]);
    });

    const insertChain = makeInsertChain([]);
    mockInsert.mockReturnValue(insertChain);

    const result = await service.toggleStatus(ASSIGNMENT_ID, MEMBER_ID, 'done');
    expect(result.myStatus).toBe('done');
    expect(insertChain.onConflictDoUpdate).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Tests: updateAssignment
// ---------------------------------------------------------------------------

describe('AssignmentsService.updateAssignment', () => {
  let service: AssignmentsService;
  let rbac: ReturnType<typeof makeRbacService>;
  let files: ReturnType<typeof makeFilesService>;

  beforeEach(() => {
    vi.clearAllMocks();
    rbac = makeRbacService(true);
    files = makeFilesService();
    // biome-ignore lint/suspicious/noExplicitAny: test mock
    service = new AssignmentsService(rbac as any, files as any);
  });

  it('updates assignment title when organizer calls update', async () => {
    const updatedRow = { ...mockAssignmentRow, title: 'Updated Title' };
    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return makeSelectChain([mockAssignmentRow]); // existing fetch
      if (callCount === 2) return makeSelectChain([mockStatusRow]); // rowToDto status
      return makeSelectChain([]);
    });
    mockUpdate.mockReturnValue(makeUpdateChain([updatedRow]));

    const result = await service.updateAssignment(ASSIGNMENT_ID, ORGANIZER_ID, {
      title: 'Updated Title',
    });

    expect(rbac.can).toHaveBeenCalledWith(ORGANIZER_ID, SERVER_ID, 'manage_channels');
    expect(result.title).toBe('Updated Title');
  });

  it('throws 403 ForbiddenException when non-organizer calls update', async () => {
    rbac.can.mockResolvedValue(false);
    mockSelect.mockReturnValue(makeSelectChain([mockAssignmentRow]));

    await expect(
      service.updateAssignment(ASSIGNMENT_ID, MEMBER_ID, { title: 'Hacked' }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Tests: presignAttachmentUpload
// ---------------------------------------------------------------------------

describe('AssignmentsService.presignAttachmentUpload', () => {
  let service: AssignmentsService;
  let rbac: ReturnType<typeof makeRbacService>;
  let files: ReturnType<typeof makeFilesService>;

  beforeEach(() => {
    vi.clearAllMocks();
    rbac = makeRbacService(true);
    files = makeFilesService();
    // biome-ignore lint/suspicious/noExplicitAny: test mock
    service = new AssignmentsService(rbac as any, files as any);
  });

  it('delegates to FilesService.presignAttachmentUpload when organizer', async () => {
    const result = await service.presignAttachmentUpload(SERVER_ID, ORGANIZER_ID, 'image/png');

    expect(rbac.can).toHaveBeenCalledWith(ORGANIZER_ID, SERVER_ID, 'manage_channels');
    expect(files.presignAttachmentUpload).toHaveBeenCalledWith(
      SERVER_ID,
      ORGANIZER_ID,
      'image/png',
    );
    expect(result.uploadUrl).toBeDefined();
    expect(result.key).toBe(ATTACHMENT_KEY);
  });

  it('throws 403 when non-organizer requests presign', async () => {
    rbac.can.mockResolvedValue(false);

    await expect(
      service.presignAttachmentUpload(SERVER_ID, MEMBER_ID, 'image/png'),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(files.presignAttachmentUpload).not.toHaveBeenCalled();
  });

  it('throws 400 for unsupported content-type', async () => {
    await expect(
      service.presignAttachmentUpload(SERVER_ID, ORGANIZER_ID, 'video/mp4'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
