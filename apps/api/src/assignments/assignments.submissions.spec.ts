/**
 * AssignmentsService submission method unit tests — wave-44 M8 polish (task 8d971bc2)
 *
 * Covers:
 *   submitAssignment:
 *     - happy path: text-only submission → upsert returns DTO
 *     - happy path: resubmit clears returned_at + organizer_comment (return superseded)
 *     - assignment not found → 404 NotFoundException
 *     - non-member → 403 ForbiddenException
 *     - empty text + no attachment → 400 BadRequestException
 *
 *   listSubmissions:
 *     - organizer → returns roster rows for all submissions
 *     - non-organizer (can()=false) → 403 ForbiddenException
 *     - assignment not found → 404 NotFoundException
 *
 *   returnSubmission:
 *     - organizer returns a submission → sets returned_at + organizer_comment
 *     - assignment not found → 404 NotFoundException
 *     - submission not found → 404 NotFoundException
 *     - cross-assignment guard: submission.assignment_id !== path assignmentId → 400
 *     - non-organizer → 403 ForbiddenException
 *
 * DEFERRED: ATTACHMENT presign integration tests — CI lacks Tigris/S3 creds.
 *   submitAssignment with attachment validated via validateAndHeadAttachment is not
 *   covered here; it requires a real S3/Tigris bucket for the HeadObject call.
 *   When CI is provisioned with Tigris credentials, add these to test:integration layer.
 */

import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AssignmentsService } from './assignments.service';

// ---------------------------------------------------------------------------
// Drizzle mock helpers — matches the pattern in assignments.service.spec.ts
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

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SERVER_ID = 'server-001';
const ORGANIZER_ID = 'user-organizer';
const MEMBER_ID = 'user-member';
const ASSIGNMENT_ID = 'assign-001';
const SUBMISSION_ID = 'sub-001';
const OTHER_ASSIGNMENT_ID = 'assign-other';

const NOW = new Date('2026-06-30T10:00:00Z');
const DUE_DATE = new Date('2026-07-10T12:00:00Z');
const SUBMITTED_AT = new Date('2026-07-01T09:00:00Z');
const RETURNED_AT = new Date('2026-07-02T14:00:00Z');

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

const mockSubmissionRow = {
  id: SUBMISSION_ID,
  user_id: MEMBER_ID,
  assignment_id: ASSIGNMENT_ID,
  text: 'My answer',
  object_key: null,
  filename: null,
  content_type: null,
  size_bytes: null,
  submitted_at: SUBMITTED_AT,
  returned_at: null,
  organizer_comment: null,
};

const mockOrganizerUserRow = {
  id: ORGANIZER_ID,
  display_name: 'Organizer Name',
  username: 'organizeruser',
  avatar_url: null,
};

const mockMemberUserRow = {
  id: MEMBER_ID,
  display_name: 'Member Name',
  username: 'memberuser',
  avatar_url: null,
};

// ---------------------------------------------------------------------------
// Mock service factories — matches assignments.service.spec.ts pattern
// ---------------------------------------------------------------------------

function makeRbacService(canResult = true) {
  return {
    can: vi.fn().mockResolvedValue(canResult),
    canViewChannelById: vi.fn().mockResolvedValue(true),
  };
}

function makeFilesService() {
  return {
    headAttachment: vi.fn().mockResolvedValue({
      contentLength: 102_400,
      contentType: 'image/png',
    }),
    presignAttachmentUpload: vi.fn().mockResolvedValue({
      uploadUrl: 'https://presigned.example.com/upload',
      key: `attachments/${SERVER_ID}/uuid.png`,
    }),
    resolveAttachmentUrl: vi.fn().mockResolvedValue('https://presigned.example.com/attachment'),
  };
}

// ---------------------------------------------------------------------------
// Tests: submitAssignment
// ---------------------------------------------------------------------------

describe('AssignmentsService.submitAssignment', () => {
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

  it('text-only submission: upserts via onConflictDoUpdate and returns DTO', async () => {
    // Arrange
    let selectCallCount = 0;
    mockSelect.mockImplementation(() => {
      selectCallCount++;
      // 1: assignment row fetch (is_deleted=false filter)
      if (selectCallCount === 1) return makeSelectChain([mockAssignmentRow]);
      // 2: server_members assertMember
      if (selectCallCount === 2) return makeSelectChain([mockMemberRow]);
      return makeSelectChain([]);
    });

    const insertChain = makeInsertChain([mockSubmissionRow]);
    mockInsert.mockReturnValue(insertChain);

    // Act
    const result = await service.submitAssignment(ASSIGNMENT_ID, MEMBER_ID, {
      text: 'My answer',
    });

    // Assert
    expect(insertChain.onConflictDoUpdate).toHaveBeenCalledTimes(1);
    expect(result.id).toBe(SUBMISSION_ID);
    expect(result.userId).toBe(MEMBER_ID);
    expect(result.assignmentId).toBe(ASSIGNMENT_ID);
    expect(result.text).toBe('My answer');
    expect(result.returnedAt).toBeNull();
    expect(result.organizerComment).toBeNull();
    expect(result.attachment).toBeNull();
  });

  it('resubmit clears returned_at and organizer_comment in the upsert set payload', async () => {
    // Arrange — simulate a previously-returned submission being resubmitted
    const resubmittedRow = {
      ...mockSubmissionRow,
      text: 'Updated answer',
      returned_at: null, // cleared by upsert
      organizer_comment: null, // cleared by upsert
    };

    let selectCallCount = 0;
    mockSelect.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) return makeSelectChain([mockAssignmentRow]);
      if (selectCallCount === 2) return makeSelectChain([mockMemberRow]);
      return makeSelectChain([]);
    });

    const insertedValues: unknown[] = [];
    const insertChain = makeInsertChain([resubmittedRow]);
    // Intercept values() to capture the upsert set clause
    const originalOnConflict = insertChain.onConflictDoUpdate as MockFn;
    const capturedSetArgs: unknown[] = [];
    (insertChain.onConflictDoUpdate as unknown as MockFn).mockImplementation((args: unknown) => {
      capturedSetArgs.push(args);
      return insertChain;
    });
    void insertedValues; // suppress unused warning

    mockInsert.mockReturnValue(insertChain);
    void originalOnConflict; // suppress unused

    // Act
    const result = await service.submitAssignment(ASSIGNMENT_ID, MEMBER_ID, {
      text: 'Updated answer',
    });

    // Assert: upsert was called
    expect(insertChain.onConflictDoUpdate).toHaveBeenCalledTimes(1);

    // The set clause in onConflictDoUpdate must null out returned_at and organizer_comment
    const setArg = capturedSetArgs[0] as {
      target: unknown;
      set: Record<string, unknown>;
    };
    expect(setArg.set.returned_at).toBeNull();
    expect(setArg.set.organizer_comment).toBeNull();

    // Result reflects cleared state
    expect(result.returnedAt).toBeNull();
    expect(result.organizerComment).toBeNull();
  });

  it('throws 404 NotFoundException when assignment does not exist', async () => {
    // Arrange
    mockSelect.mockReturnValue(makeSelectChain([])); // no assignment row

    // Act + Assert
    await expect(
      service.submitAssignment('nonexistent', MEMBER_ID, { text: 'answer' }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('throws 403 ForbiddenException when user is not a server member', async () => {
    // Arrange
    let selectCallCount = 0;
    mockSelect.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) return makeSelectChain([mockAssignmentRow]); // assignment exists
      return makeSelectChain([]); // no server_members row → not a member
    });

    // Act + Assert
    await expect(
      service.submitAssignment(ASSIGNMENT_ID, 'non-member-user', { text: 'answer' }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('throws 400 BadRequestException when neither text nor attachment is provided', async () => {
    // Arrange
    let selectCallCount = 0;
    mockSelect.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) return makeSelectChain([mockAssignmentRow]);
      if (selectCallCount === 2) return makeSelectChain([mockMemberRow]);
      return makeSelectChain([]);
    });

    // Act + Assert — empty text with no attachment
    await expect(
      service.submitAssignment(ASSIGNMENT_ID, MEMBER_ID, { text: '' }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(mockInsert).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Tests: listSubmissions
// ---------------------------------------------------------------------------

describe('AssignmentsService.listSubmissions', () => {
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

  it('organizer-gated: returns roster rows with submitter identity', async () => {
    // Arrange
    const joinedRow = {
      submission: mockSubmissionRow,
      user: mockMemberUserRow,
    };

    let selectCallCount = 0;
    mockSelect.mockImplementation(() => {
      selectCallCount++;
      // 1: assignment fetch
      if (selectCallCount === 1) return makeSelectChain([mockAssignmentRow]);
      // 2: JOIN submissions → users (innerJoin chain resolves to joinedRow)
      if (selectCallCount === 2) return makeSelectChain([joinedRow]);
      return makeSelectChain([]);
    });

    // Act
    const result = await service.listSubmissions(ASSIGNMENT_ID, ORGANIZER_ID);

    // Assert
    expect(rbac.can).toHaveBeenCalledWith(ORGANIZER_ID, SERVER_ID, 'manage_assignments');
    expect(result).toHaveLength(1);
    const row = result[0];
    expect(row).toBeDefined();
    if (!row) return;
    expect(row.id).toBe(SUBMISSION_ID);
    expect(row.userId).toBe(MEMBER_ID);
    expect(row.submitter.userId).toBe(MEMBER_ID);
    expect(row.submitter.displayName).toBe('Member Name');
    expect(row.submitter.username).toBe('memberuser');
  });

  it('throws 403 ForbiddenException when non-organizer calls listSubmissions', async () => {
    // Arrange
    rbac.can.mockResolvedValue(false);
    mockSelect.mockReturnValue(makeSelectChain([mockAssignmentRow]));

    // Act + Assert
    await expect(service.listSubmissions(ASSIGNMENT_ID, MEMBER_ID)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('throws 404 NotFoundException when assignment does not exist', async () => {
    // Arrange
    mockSelect.mockReturnValue(makeSelectChain([])); // no assignment row

    // Act + Assert
    await expect(service.listSubmissions('nonexistent', ORGANIZER_ID)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('returns empty array when assignment has no submissions', async () => {
    // Arrange
    let selectCallCount = 0;
    mockSelect.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) return makeSelectChain([mockAssignmentRow]);
      return makeSelectChain([]); // no submissions
    });

    // Act
    const result = await service.listSubmissions(ASSIGNMENT_ID, ORGANIZER_ID);

    // Assert
    expect(result).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Tests: returnSubmission
// ---------------------------------------------------------------------------

describe('AssignmentsService.returnSubmission', () => {
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

  it('organizer returns a submission: sets returned_at + organizer_comment', async () => {
    // Arrange
    const returnedRow = {
      ...mockSubmissionRow,
      returned_at: RETURNED_AT,
      organizer_comment: 'Good work!',
    };

    let selectCallCount = 0;
    mockSelect.mockImplementation(() => {
      selectCallCount++;
      // 1: assignment row fetch
      if (selectCallCount === 1) return makeSelectChain([mockAssignmentRow]);
      // 2: submission row fetch
      if (selectCallCount === 2) return makeSelectChain([mockSubmissionRow]);
      return makeSelectChain([]);
    });

    mockUpdate.mockReturnValue(makeUpdateChain([returnedRow]));

    // Act
    const result = await service.returnSubmission(ASSIGNMENT_ID, SUBMISSION_ID, ORGANIZER_ID, {
      comment: 'Good work!',
    });

    // Assert
    expect(rbac.can).toHaveBeenCalledWith(ORGANIZER_ID, SERVER_ID, 'manage_assignments');
    expect(result.returnedAt).toBe(RETURNED_AT.toISOString());
    expect(result.organizerComment).toBe('Good work!');
    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });

  it('throws 404 NotFoundException when assignment does not exist', async () => {
    // Arrange
    mockSelect.mockReturnValue(makeSelectChain([])); // no assignment row

    // Act + Assert
    await expect(
      service.returnSubmission('nonexistent', SUBMISSION_ID, ORGANIZER_ID, {}),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('throws 404 NotFoundException when submission does not exist', async () => {
    // Arrange
    let selectCallCount = 0;
    mockSelect.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) return makeSelectChain([mockAssignmentRow]);
      return makeSelectChain([]); // no submission row
    });

    // Act + Assert
    await expect(
      service.returnSubmission(ASSIGNMENT_ID, 'nonexistent-sub', ORGANIZER_ID, {}),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('throws 400 BadRequestException when submission belongs to a different assignment', async () => {
    // Arrange — submission.assignment_id !== path assignmentId (cross-assignment guard)
    const crossAssignmentSubmission = {
      ...mockSubmissionRow,
      assignment_id: OTHER_ASSIGNMENT_ID, // belongs to a different assignment
    };

    let selectCallCount = 0;
    mockSelect.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) return makeSelectChain([mockAssignmentRow]);
      // submission row has a different assignment_id
      if (selectCallCount === 2) return makeSelectChain([crossAssignmentSubmission]);
      return makeSelectChain([]);
    });

    // Act + Assert
    await expect(
      service.returnSubmission(ASSIGNMENT_ID, SUBMISSION_ID, ORGANIZER_ID, {}),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('throws 403 ForbiddenException when non-organizer attempts to return a submission', async () => {
    // Arrange
    rbac.can.mockResolvedValue(false);
    mockSelect.mockReturnValue(makeSelectChain([mockAssignmentRow]));

    // Act + Assert
    await expect(
      service.returnSubmission(ASSIGNMENT_ID, SUBMISSION_ID, MEMBER_ID, {}),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('idempotent: repeat return call overwrites prior returned_at with a new timestamp', async () => {
    // Arrange — simulate second return (already returned once; organizer returns again)
    const alreadyReturnedSub = {
      ...mockSubmissionRow,
      returned_at: RETURNED_AT,
      organizer_comment: 'First comment',
    };

    const newReturnedAt = new Date('2026-07-03T10:00:00Z');
    const reReturnedRow = {
      ...mockSubmissionRow,
      returned_at: newReturnedAt,
      organizer_comment: 'Updated feedback',
    };

    let selectCallCount = 0;
    mockSelect.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) return makeSelectChain([mockAssignmentRow]);
      if (selectCallCount === 2) return makeSelectChain([alreadyReturnedSub]);
      return makeSelectChain([]);
    });

    mockUpdate.mockReturnValue(makeUpdateChain([reReturnedRow]));

    // Act
    const result = await service.returnSubmission(ASSIGNMENT_ID, SUBMISSION_ID, ORGANIZER_ID, {
      comment: 'Updated feedback',
    });

    // Assert — update was called (repeat is allowed — idempotent overwrite)
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(result.organizerComment).toBe('Updated feedback');
  });

  it('return without comment sets organizer_comment to null', async () => {
    // Arrange
    const returnedRowNoComment = {
      ...mockSubmissionRow,
      returned_at: RETURNED_AT,
      organizer_comment: null,
    };

    let selectCallCount = 0;
    mockSelect.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) return makeSelectChain([mockAssignmentRow]);
      if (selectCallCount === 2) return makeSelectChain([mockSubmissionRow]);
      return makeSelectChain([]);
    });

    mockUpdate.mockReturnValue(makeUpdateChain([returnedRowNoComment]));

    // Act
    const result = await service.returnSubmission(ASSIGNMENT_ID, SUBMISSION_ID, ORGANIZER_ID, {});

    // Assert
    expect(result.organizerComment).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Note: resolveAttachmentUrl in submissionRowToDto is covered via the
// listSubmissions/returnSubmission rows above (object_key=null path).
// The attachment-present path for submissions requires real S3/Tigris creds
// (validateAndHeadAttachment HeadObject call). Deferred to integration layer
// per task 8d971bc2 scope constraint.
// ---------------------------------------------------------------------------

void mockOrganizerUserRow; // referenced for type completeness; not directly needed in mock chains
