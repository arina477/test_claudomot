import { Injectable } from '@nestjs/common';
import type { NestMiddleware } from '@nestjs/common';
import { middleware } from 'supertokens-node/framework/express';

type ExpressLikeHandler = (req: object, res: object, next: () => void) => void;

@Injectable()
export class SupertokensMiddleware implements NestMiddleware {
  use(req: object, res: object, next: () => void): void {
    // Mount the SuperTokens express middleware — handles /auth/* SDK routes
    // (session refresh, signIn, signUp, email-verification, etc.)
    // CRITICAL: must run before route handlers (enforced by NestJS module configure order)
    (middleware() as ExpressLikeHandler)(req, res, next);
  }
}
