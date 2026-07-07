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

    return toProfileResponse(userId, user);
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

    return toProfileResponse(userId, updated);
  }
}

/**
 * Map a users row to the self ProfileResponse DTO.
 *
 * wave-77 M13 leg-2 (task 10068f9e): now includes the academic-identity fields
 * (pronouns/bio/institution/program/academicRole/academicYear). academic_role is
 * a plain text column narrowed to AcademicRole | null at the DTO boundary — the
 * only writer is PATCH /profile validated by UpdateProfileSchema (z.enum), so any
 * stored value is a legal AcademicRole. This is the SELF endpoint (own row); it
 * carries no email and does not gate on profile_visibility.
 */
function toProfileResponse(
  userId: string,
  user: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
    accent_color: string | null;
    pronouns: string | null;
    bio: string | null;
    institution: string | null;
    program: string | null;
    academic_role: string | null;
    academic_year: string | null;
  },
): ProfileResponse {
  return {
    userId,
    displayName: user.display_name ?? null,
    username: user.username ?? null,
    avatarUrl: user.avatar_url ?? null,
    accentColor: user.accent_color ?? null,
    pronouns: user.pronouns ?? null,
    bio: user.bio ?? null,
    institution: user.institution ?? null,
    program: user.program ?? null,
    academicRole: (user.academic_role as ProfileResponse['academicRole']) ?? null,
    academicYear: user.academic_year ?? null,
  };
}
