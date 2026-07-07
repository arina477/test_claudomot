import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import type {
  AccountDataResponse,
  DeleteAccountBlockedResponse,
  DeleteAccountResponse,
  PrivacyEventListResponse,
  PrivacySettingsResponse,
} from '@studyhall/shared';
import { DeleteAccountRequestSchema, UpdatePrivacySchema } from '@studyhall/shared';
import { SessionNoVerifyGuard } from '../auth/session-no-verify.guard';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { AccountDataService } from './account-data.service';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { AccountDeletionService } from './account-deletion.service';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { AppendPrivacyEventService } from './append-privacy-event.service';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { PrivacyService } from './privacy.service';

// Minimal interface for the ST-augmented request — mirrors the pattern in ProfileController.
interface SessionAugmentedRequest {
  session: {
    getUserId(): string;
  };
}

@Controller('profile')
export class PrivacyController {
  constructor(
    private readonly privacyService: PrivacyService,
    private readonly accountDataService: AccountDataService,
    private readonly accountDeletionService: AccountDeletionService,
    private readonly appendPrivacyEventService: AppendPrivacyEventService,
  ) {}

  // GET /profile/privacy → 200 PrivacySettingsResponse
  @Get('privacy')
  @UseGuards(SessionNoVerifyGuard)
  async getPrivacy(@Req() req: SessionAugmentedRequest): Promise<PrivacySettingsResponse> {
    const userId = req.session.getUserId();
    return this.privacyService.getPrivacy(userId);
  }

  // PUT /profile/privacy → validate body, 400 on schema failure, 200 PrivacySettingsResponse
  @Put('privacy')
  @UseGuards(SessionNoVerifyGuard)
  async updatePrivacy(
    @Req() req: SessionAugmentedRequest,
    @Body() body: unknown,
  ): Promise<PrivacySettingsResponse> {
    const parsed = UpdatePrivacySchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }

    const userId = req.session.getUserId();
    return this.privacyService.updatePrivacy(userId, parsed.data);
  }

  // GET /profile/data → 200 AccountDataResponse
  @Get('data')
  @UseGuards(SessionNoVerifyGuard)
  async getAccountData(@Req() req: SessionAugmentedRequest): Promise<AccountDataResponse> {
    const userId = req.session.getUserId();
    return this.accountDataService.getAccountData(userId);
  }

  // POST /profile/delete → 200 DeleteAccountResponse | 409 DeleteAccountBlockedResponse
  //
  // Security invariants:
  //   - callerId is ALWAYS taken from req.session.getUserId() — no userId param
  //     in path or body. A user can only delete their own account (no IDOR).
  //   - confirm: true in the body is a required confirmation gate. Absent or
  //     false body → 400 before any deletion logic runs.
  //   - On owner-block the service throws ConflictException(409) whose body is
  //     the DeleteAccountBlockedResponse shape; NestJS serialises it as-is.
  @Post('delete')
  @HttpCode(200)
  @UseGuards(SessionNoVerifyGuard)
  async deleteAccount(
    @Req() req: SessionAugmentedRequest,
    @Body() body: unknown,
  ): Promise<DeleteAccountResponse | DeleteAccountBlockedResponse> {
    const parsed = DeleteAccountRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }

    const callerId = req.session.getUserId();
    return this.accountDeletionService.deleteAccount(callerId);
  }

  // GET /profile/data/export → 200, Content-Disposition attachment, JSON body
  @Get('data/export')
  @UseGuards(SessionNoVerifyGuard)
  @HttpCode(200)
  @Header('Content-Disposition', 'attachment; filename="studyhall-account-data.json"')
  @Header('Content-Type', 'application/json')
  async exportAccountData(@Req() req: SessionAugmentedRequest): Promise<AccountDataResponse> {
    const userId = req.session.getUserId();
    return this.accountDataService.exportAccountData(userId);
  }

  // GET /profile/privacy-events → 200 PrivacyEventListResponse
  //
  // Security invariants:
  //   - callerId is ALWAYS taken from req.session.getUserId() — no userId param
  //     in path or query. Returns ONLY the caller's own events (no IDOR).
  //   - Returns at most 100 events, newest first.
  @Get('privacy-events')
  @UseGuards(SessionNoVerifyGuard)
  async listPrivacyEvents(@Req() req: SessionAugmentedRequest): Promise<PrivacyEventListResponse> {
    const callerId = req.session.getUserId();
    return this.appendPrivacyEventService.listForActor(callerId);
  }
}
