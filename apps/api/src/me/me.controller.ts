import { Controller, Get, NotFoundException, Req, UseGuards } from '@nestjs/common';
import type { MeResponse } from '@studyhall/shared';
import { EmailVerificationClaim } from 'supertokens-node/recipe/emailverification';
import { SessionNoVerifyGuard } from '../auth/session-no-verify.guard';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { UsersService } from '../users/users.service';
// MeModule is part of the auth surface. Importing EmailVerificationClaim here is a
// documented boundary decision: it is the only supertokens-node import outside
// AuthModule proper, and is isolated to the auth-adjacent MeController.
// SessionNoVerifyGuard is used here (not AuthGuard) so that authenticated-but-unverified
// users can reach /me and see emailVerified: false — enabling the frontend to direct them
// to the email-verification prompt rather than receiving a 403.

// Minimal interface for the ST-augmented request — avoids @types/express dependency.
// verifySession() attaches `session` to the Express request object at runtime.
interface SessionAugmentedRequest {
  session: {
    getUserId(): string;
    getClaimValue(claim: typeof EmailVerificationClaim): Promise<boolean | undefined>;
  };
}

@Controller('me')
export class MeController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(SessionNoVerifyGuard)
  async getMe(@Req() req: SessionAugmentedRequest): Promise<MeResponse> {
    const { session } = req;

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    const userId = session.getUserId();
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // EmailVerificationClaim extends BooleanClaim (PrimitiveClaim<boolean>).
    // getClaimValue returns boolean | undefined — true when email is verified.
    const claimValue = await session.getClaimValue(EmailVerificationClaim);
    const emailVerified = claimValue ?? false;

    return {
      userId,
      email: user.email,
      emailVerified,
    };
  }
}
