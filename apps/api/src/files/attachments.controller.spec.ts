/**
 * AttachmentsController unit tests — wave-19 M3 (task 20db0c16)
 *
 * Covers:
 *   - POST /channels/:channelId/attachments/presign
 *     - non-member → 403 (rule-4 negative path — REQUIRED per BUILD-PRINCIPLES)
 *     - disallowed content-type → 400
 *     - missing filename → 400
 *     - member + allowed type → delegates to filesService.presignAttachmentUpload
 *   - POST /channels/:channelId/attachments/confirm
 *     - non-member → 403 (rule-4 negative path — REQUIRED)
 *     - disallowed content-type → 400
 *     - key not scoped to this channel → 400
 *     - empty/missing filename → 400
 *     - member + valid inputs → calls checkAttachmentSize + returns ValidatedAttachment
 *     - file over 10MB → 413 propagated (checkAttachmentSize throws)
 *
 * Pattern: direct instantiation (no NestJS Test.createTestingModule)
 * following the established controller spec pattern in this project.
 */

import {
  BadRequestException,
  ForbiddenException,
  PayloadTooLargeException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { AttachmentsController } from './attachments.controller';

// ---------------------------------------------------------------------------
// Mock factory helpers
// ---------------------------------------------------------------------------

function makeFilesService() {
  return {
    presignAttachmentUpload: vi.fn().mockResolvedValue({
      uploadUrl: 'https://signed.example.com/put-url',
      key: 'attachments/ch-test/uuid-123.pdf',
    }),
    checkAttachmentSize: vi.fn().mockResolvedValue(512000), // 500 KB — within 10MB
  };
}

function makeRbacService(isMember = true) {
  return {
    canViewChannelById: vi.fn().mockResolvedValue(isMember),
  };
}

// Typed request helper — the controller reads only session.getUserId().
// biome-ignore lint/suspicious/noExplicitAny: minimal request stub for controller tests
function makeReq(userId = 'user-member'): any {
  return { session: { getUserId: () => userId } };
}

function makeController(isMember = true) {
  const filesService = makeFilesService();
  const rbacService = makeRbacService(isMember);
  // biome-ignore lint/suspicious/noExplicitAny: test mock — direct DI without NestJS module
  const controller = new AttachmentsController(filesService as any, rbacService as any);
  return { controller, filesService, rbacService };
}

// ---------------------------------------------------------------------------
// Tests: POST /channels/:channelId/attachments/presign
// ---------------------------------------------------------------------------

describe('AttachmentsController.presign', () => {
  const CHANNEL_ID = 'ch-test-123';

  describe('rule-4 authz — non-member 403 (REQUIRED negative path test)', () => {
    it('non-member caller → 403 ForbiddenException (canViewChannelById returns false)', async () => {
      const { controller, rbacService } = makeController(false); // non-member

      await expect(
        controller.presign(CHANNEL_ID, makeReq(), {
          contentType: 'image/png',
          filename: 'photo.png',
        }),
      ).rejects.toThrow(ForbiddenException);

      // canViewChannelById must have been called with the channel from the route param
      expect(rbacService.canViewChannelById).toHaveBeenCalledWith('user-member', CHANNEL_ID);
    });
  });

  describe('content-type allowlist', () => {
    it('disallowed content-type → 400 BadRequestException', async () => {
      const { controller } = makeController();

      await expect(
        controller.presign(CHANNEL_ID, makeReq(), {
          contentType: 'video/mp4', // NOT in allowlist
          filename: 'video.mp4',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('missing contentType → 400', async () => {
      const { controller } = makeController();

      await expect(
        controller.presign(CHANNEL_ID, makeReq(), { filename: 'file.pdf' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('allowed content-types pass validation (image/png, image/jpeg, image/webp, image/gif, application/pdf, text/plain)', async () => {
      const allowedTypes = [
        ['image/png', 'photo.png'],
        ['image/jpeg', 'photo.jpg'],
        ['image/webp', 'photo.webp'],
        ['image/gif', 'anim.gif'],
        ['application/pdf', 'doc.pdf'],
        ['text/plain', 'note.txt'],
      ] as [string, string][];

      for (const [contentType, filename] of allowedTypes) {
        const { controller } = makeController();
        const result = await controller.presign(CHANNEL_ID, makeReq(), { contentType, filename });
        expect(result).toMatchObject({ uploadUrl: expect.any(String), key: expect.any(String) });
      }
    });
  });

  describe('filename validation', () => {
    it('missing filename → 400', async () => {
      const { controller } = makeController();

      await expect(
        controller.presign(CHANNEL_ID, makeReq(), { contentType: 'image/png' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('empty string filename → 400', async () => {
      const { controller } = makeController();

      await expect(
        controller.presign(CHANNEL_ID, makeReq(), { contentType: 'image/png', filename: '   ' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('happy path', () => {
    it('member + allowed type → returns { uploadUrl, key } from filesService', async () => {
      const { controller, filesService } = makeController();

      const result = await controller.presign(CHANNEL_ID, makeReq(), {
        contentType: 'application/pdf',
        filename: 'report.pdf',
      });

      expect(result).toEqual({
        uploadUrl: 'https://signed.example.com/put-url',
        key: 'attachments/ch-test/uuid-123.pdf',
      });
      expect(filesService.presignAttachmentUpload).toHaveBeenCalledWith(
        CHANNEL_ID,
        'user-member',
        'application/pdf',
      );
    });

    it('503 from filesService propagates (storage not configured)', async () => {
      const { controller, filesService } = makeController();
      filesService.presignAttachmentUpload.mockRejectedValue(
        new ServiceUnavailableException({ code: 'STORAGE_NOT_CONFIGURED' }),
      );

      await expect(
        controller.presign(CHANNEL_ID, makeReq(), {
          contentType: 'image/png',
          filename: 'photo.png',
        }),
      ).rejects.toThrow(ServiceUnavailableException);
    });
  });
});

// ---------------------------------------------------------------------------
// Tests: POST /channels/:channelId/attachments/confirm
// ---------------------------------------------------------------------------

describe('AttachmentsController.confirm', () => {
  const CHANNEL_ID = 'ch-test-456';
  const VALID_KEY = `attachments/${CHANNEL_ID}/uuid-456.pdf`;

  describe('rule-4 authz — non-member 403 (REQUIRED negative path test)', () => {
    it('non-member caller → 403 ForbiddenException', async () => {
      const { controller, rbacService } = makeController(false); // non-member

      await expect(
        controller.confirm(CHANNEL_ID, makeReq(), {
          key: VALID_KEY,
          filename: 'doc.pdf',
          contentType: 'application/pdf',
        }),
      ).rejects.toThrow(ForbiddenException);

      expect(rbacService.canViewChannelById).toHaveBeenCalledWith('user-member', CHANNEL_ID);
    });
  });

  describe('key scoping guard', () => {
    it('key not scoped to this channel → 400 (cross-channel key swap IDOR prevention)', async () => {
      const { controller } = makeController();

      await expect(
        controller.confirm(CHANNEL_ID, makeReq(), {
          key: 'attachments/OTHER-CHANNEL/uuid-789.pdf', // wrong channel
          filename: 'doc.pdf',
          contentType: 'application/pdf',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('key missing attachments/ prefix → 400', async () => {
      const { controller } = makeController();

      await expect(
        controller.confirm(CHANNEL_ID, makeReq(), {
          key: 'avatars/user-abc/something.png', // wrong prefix
          filename: 'file.png',
          contentType: 'image/png',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('content-type allowlist at confirm', () => {
    it('disallowed content-type at confirm → 400', async () => {
      const { controller } = makeController();

      await expect(
        controller.confirm(CHANNEL_ID, makeReq(), {
          key: VALID_KEY,
          filename: 'video.mp4',
          contentType: 'video/mp4', // NOT in allowlist
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('filename validation at confirm', () => {
    it('empty filename → 400', async () => {
      const { controller } = makeController();

      await expect(
        controller.confirm(CHANNEL_ID, makeReq(), {
          key: VALID_KEY,
          filename: '',
          contentType: 'application/pdf',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('10MB size enforcement at confirm', () => {
    it('413 propagated when checkAttachmentSize throws PayloadTooLargeException', async () => {
      const { controller, filesService } = makeController();
      filesService.checkAttachmentSize.mockRejectedValue(
        new PayloadTooLargeException({ code: 'ATTACHMENT_TOO_LARGE' }),
      );

      await expect(
        controller.confirm(CHANNEL_ID, makeReq(), {
          key: VALID_KEY,
          filename: 'big-file.pdf',
          contentType: 'application/pdf',
        }),
      ).rejects.toThrow(PayloadTooLargeException);
    });
  });

  describe('happy path — NO DB row created (validation-only per row-at-send P-4)', () => {
    it('returns ValidatedAttachment { key, filename, contentType, sizeBytes } with NO INSERT', async () => {
      const { controller, filesService } = makeController();
      filesService.checkAttachmentSize.mockResolvedValue(102400); // 100 KB

      const result = await controller.confirm(CHANNEL_ID, makeReq(), {
        key: VALID_KEY,
        filename: 'report.pdf',
        contentType: 'application/pdf',
      });

      // Returns the validated descriptor — NOT a persisted row
      expect(result).toEqual({
        key: VALID_KEY,
        filename: 'report.pdf',
        contentType: 'application/pdf',
        sizeBytes: 102400,
      });

      // checkAttachmentSize called with the key
      expect(filesService.checkAttachmentSize).toHaveBeenCalledWith(VALID_KEY);
    });

    it('filename is trimmed', async () => {
      const { controller, filesService } = makeController();
      filesService.checkAttachmentSize.mockResolvedValue(512);

      const result = await controller.confirm(CHANNEL_ID, makeReq(), {
        key: VALID_KEY,
        filename: '  report.pdf  ', // leading/trailing whitespace
        contentType: 'application/pdf',
      });

      expect(result.filename).toBe('report.pdf');
    });
  });
});
