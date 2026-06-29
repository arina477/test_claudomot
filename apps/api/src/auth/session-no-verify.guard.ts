import { Injectable } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { verifySession } from 'supertokens-node/recipe/session/framework/express';

// Session guard that skips the EmailVerification claim validator.
// Used ONLY on routes that must remain reachable for authenticated-but-unverified
// users (/me, /profile). The shared AuthGuard (full global claims including
// EmailVerification REQUIRED) remains the default for all other routes.
// EmailVerification.init({ mode: 'REQUIRED' }) is unchanged — fail-closed globally.
@Injectable()
export class SessionNoVerifyGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = context.switchToHttp();
    const res = ctx.getResponse<{ headersSent: boolean; status: (code: number) => unknown }>();
    const req = ctx.getRequest<object>();

    let err: unknown;
    // overrideGlobalClaimValidators: () => [] strips the EmailVerification claim
    // validator added by EmailVerification.init({ mode: 'REQUIRED' }) for this
    // request only. Session validity (access token) is still fully verified.
    await verifySession({ overrideGlobalClaimValidators: () => [] })(
      req as unknown as Parameters<ReturnType<typeof verifySession>>[0],
      res as unknown as Parameters<ReturnType<typeof verifySession>>[1],
      (result: unknown) => {
        err = result;
      },
    );

    if (res.headersSent) {
      return false;
    }

    if (err) {
      throw err as Error;
    }

    return true;
  }
}
