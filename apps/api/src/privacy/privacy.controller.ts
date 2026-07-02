import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AccountDataResponse, PrivacySettingsResponse } from '@studyhall/shared';
import { UpdatePrivacySchema } from '@studyhall/shared';
import { SessionNoVerifyGuard } from '../auth/session-no-verify.guard';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { AccountDataService } from './account-data.service';
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
}
