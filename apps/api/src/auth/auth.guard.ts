import { Injectable } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { verifySession } from 'supertokens-node/recipe/session/framework/express';

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = context.switchToHttp();
    const res = ctx.getResponse<{ headersSent: boolean; status: (code: number) => unknown }>();
    const req = ctx.getRequest<object>();

    let err: unknown;
    // verifySession() is typed with express Request/Response but uses @ts-nocheck internally.
    // We pass the NestJS-wrapped objects which are Express-compatible at runtime.
    await verifySession()(
      req as unknown as Parameters<ReturnType<typeof verifySession>>[0],
      res as unknown as Parameters<ReturnType<typeof verifySession>>[1],
      (result: unknown) => {
        err = result;
      },
    );

    // If the response was already sent (e.g. 401 by ST middleware), stop the chain
    if (res.headersSent) {
      return false;
    }

    if (err) {
      throw err as Error;
    }

    return true;
  }
}
