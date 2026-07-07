import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { ProfileResponse, PublicProfile } from '@studyhall/shared';
import { UpdateProfileSchema } from '@studyhall/shared';
import { SessionNoVerifyGuard } from '../auth/session-no-verify.guard';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { UsersService } from '../users/users.service';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { ProfileVisibilityService } from './profile-visibility.service';

// Minimal interface for the ST-augmented request — mirrors the pattern in MeController.
interface SessionAugmentedRequest {
  session: {
    getUserId(): string;
  };
}

@Controller('profile')
export class ProfileController {
  constructor(
    private readonly usersService: UsersService,
    private readonly profileVisibility: ProfileVisibilityService,
  ) {}

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

  /**
   * GET /profile/:userId — PRIVACY-CRITICAL cross-server public profile view.
   *
   * wave-77 M13 leg-2 (task bf0ad2a8). Returns a PublicProfile (NEVER email) when
   * the viewer is permitted to see the target, or a 404 otherwise. The visibility
   * decision is FAIL-CLOSED and delegated entirely to ProfileVisibilityService.
   *
   * SessionNoVerifyGuard: viewer must have a valid session (opaque userId from the
   * session, never from a param/body — no IDOR on the viewer identity). The
   * unverified-email carve-out matches the self /profile routes. The :userId param
   * is the TARGET only; it never becomes the viewer identity.
   *
   * Hidden shape: we respond 404 NotFoundException for every non-visible case
   * (missing / soft-deleted / blocked / nobody / server-members-not-shared /
   * unknown-visibility). Uniform 404 avoids leaking WHY a profile is hidden
   * (existence + which gate) to a probing stranger.
   */
  @Get(':userId')
  @UseGuards(SessionNoVerifyGuard)
  async getPublicProfile(
    @Req() req: SessionAugmentedRequest,
    @Param('userId') targetUserId: string,
  ): Promise<PublicProfile> {
    const viewerUserId = req.session.getUserId();

    const decision = await this.profileVisibility.resolve(viewerUserId, targetUserId);
    if (!decision.visible) {
      throw new NotFoundException('Profile not found');
    }

    return decision.profile;
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
