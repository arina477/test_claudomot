import { Body, Controller, Get, NotFoundException, Patch, Req, UseGuards } from '@nestjs/common';
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

    return { displayName: user.display_name ?? null };
  }

  @Patch()
  @UseGuards(SessionNoVerifyGuard)
  async updateProfile(
    @Req() req: SessionAugmentedRequest,
    @Body() body: unknown,
  ): Promise<ProfileResponse> {
    const parsed = UpdateProfileSchema.safeParse(body);
    if (!parsed.success) {
      // Re-throw as a NestJS-compatible 422 payload; error mapping stays within module boundary.
      const { BadRequestException } = await import('@nestjs/common');
      throw new BadRequestException(parsed.error.flatten());
    }

    const userId = req.session.getUserId();
    await this.usersService.updateDisplayName(userId, parsed.data.displayName);

    return { displayName: parsed.data.displayName };
  }
}
