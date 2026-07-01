import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { ProfileResponse } from '@studyhall/shared';
import { UpdateProfileSchema } from '@studyhall/shared';
import { SessionNoVerifyGuard } from '../auth/session-no-verify.guard';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { UsersService } from '../users/users.service';

// Minimal interface for the ST-augmented request — mirrors the pattern in MeController.
interface SessionAugmentedRequest {
  session: {
    getUserId(): string;
  };
}

@Controller('profile')
export class ProfileController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(SessionNoVerifyGuard)
  async getProfile(@Req() req: SessionAugmentedRequest): Promise<ProfileResponse> {
    const userId = req.session.getUserId();
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      userId,
      displayName: user.display_name ?? null,
      username: user.username ?? null,
      avatarUrl: user.avatar_url ?? null,
      accentColor: user.accent_color ?? null,
    };
  }

  @Patch()
  @UseGuards(SessionNoVerifyGuard)
  async updateProfile(
    @Req() req: SessionAugmentedRequest,
    @Body() body: unknown,
  ): Promise<ProfileResponse> {
    const parsed = UpdateProfileSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }

    const userId = req.session.getUserId();

    // Propagates ConflictException (409) when username is already taken (PG 23505).
    await this.usersService.updateProfile(userId, parsed.data);

    const updated = await this.usersService.findById(userId);

    if (!updated) {
      throw new NotFoundException('User not found after update');
    }

    return {
      userId,
      displayName: updated.display_name ?? null,
      username: updated.username ?? null,
      avatarUrl: updated.avatar_url ?? null,
      accentColor: updated.accent_color ?? null,
    };
  }
}
