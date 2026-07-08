import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { ProfileResponse, PublicKeyResponse, PublicProfile } from '@studyhall/shared';
import { EncryptionKeySchema, UpdateProfileSchema } from '@studyhall/shared';
import { AuthGuard } from '../auth/auth.guard';
import { SessionNoVerifyGuard } from '../auth/session-no-verify.guard';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { DmService } from '../dm/dm.service';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { UsersService } from '../users/users.service';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { EncryptionKeyService } from './encryption-key.service';
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
    private readonly encryptionKeys: EncryptionKeyService,
    private readonly dmService: DmService,
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
   * PUT /profile/encryption-key — wave-79 E2E DM encryption (task 60bda5be).
   *
   * Self-mutation: stores or ROTATES the caller's PUBLIC key material in
   * user_encryption_keys (one row per user; rotation replaces the row).
   *
   * Guard: AuthGuard (email-verification REQUIRED) — same posture as other
   * self-mutations, stricter than the SessionNoVerifyGuard used on the read
   * self-profile routes. callerId is session-derived, never from body/param.
   *
   * SECURITY: EncryptionKeySchema is the write boundary — an oversized /
   * malformed public key or unsupported algorithm is a 400 here and is never
   * persisted. No private material ever crosses this boundary.
   *
   * 200 stored/rotated | 400 invalid | 401 unauth.
   */
  @Put('encryption-key')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async putEncryptionKey(
    @Req() req: SessionAugmentedRequest,
    @Body() body: unknown,
  ): Promise<{ ok: true }> {
    const parsed = EncryptionKeySchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }

    const userId = req.session.getUserId();
    await this.encryptionKeys.upsertKey(userId, parsed.data);
    return { ok: true };
  }

  /**
   * GET /profile/:userId/encryption-key — wave-79 E2E DM encryption (task 60bda5be).
   *
   * Returns the target user's PUBLIC key so a peer can encrypt a DM envelope
   * only that user can decrypt — but ONLY when the viewer is permitted to DM
   * the target.
   *
   * VISIBILITY GATE (P-4 karen correction 1, LOAD-BEARING): the gate is
   * `who_can_dm` (via DmService.canDm — the shared enforceWhoCanDm seam), NOT
   * profile_visibility. A user can be profile_visibility='everyone' yet
   * who_can_dm='nobody'; the key exists solely to encrypt a DM, so who_can_dm
   * governs. A key-fetch leak would be a who_can_dm-visibility leak.
   *
   * UNIFORM 404 (no oracle): every not-permitted case — who_can_dm blocks the
   * viewer, target does not exist, or the target has registered no key —
   * returns the byte-identical NotFoundException. A probing viewer cannot
   * distinguish "not allowed" from "no key" from "no such user" (mirrors the
   * GET /profile/:userId uniform-404 pattern).
   *
   * Self-fetch: a viewer fetching their OWN key is always permitted (bypasses
   * the who_can_dm gate) so a client can confirm which key the server holds.
   *
   * Guard: SessionNoVerifyGuard — viewer id from session, target from param.
   *
   * 200 PublicKeyResponse | 404 uniform | 401 unauth.
   */
  @Get(':userId/encryption-key')
  @UseGuards(SessionNoVerifyGuard)
  async getEncryptionKey(
    @Req() req: SessionAugmentedRequest,
    @Param('userId') targetUserId: string,
  ): Promise<PublicKeyResponse> {
    const viewerUserId = req.session.getUserId();

    // who_can_dm gate — self always permitted; otherwise the shared seam.
    // FAIL-CLOSED: any not-permitted result funnels to the SAME 404 as no-key.
    const permitted =
      viewerUserId === targetUserId || (await this.dmService.canDm(viewerUserId, targetUserId));
    if (!permitted) {
      throw new NotFoundException('Encryption key not found');
    }

    const key = await this.encryptionKeys.getKeyFor(targetUserId);
    if (!key) {
      // No key registered — uniform 404, byte-identical to the not-permitted
      // case (no "user exists but has no key" oracle).
      throw new NotFoundException('Encryption key not found');
    }

    // PublicKeyResponse carries public material only — no email, no private key.
    return {
      userId: key.userId,
      publicKey: key.publicKey,
      algorithm: key.algorithm as PublicKeyResponse['algorithm'],
      createdAt: key.createdAt.toISOString(),
    };
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
