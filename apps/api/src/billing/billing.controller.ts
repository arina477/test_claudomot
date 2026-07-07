import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { ServerPlan } from '@studyhall/shared';
import { TierChangeRequestSchema } from '@studyhall/shared';
import { and, eq } from 'drizzle-orm';
import { AuthGuard } from '../auth/auth.guard';
import { db } from '../db/index';
import { server_members, servers } from '../db/schema/index';
import { BILLING_PROVIDER, type BillingProvider } from './billing-provider.interface';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { EntitlementsService } from './entitlements.service';

// Minimal interface for the ST-augmented request — mirrors ServersController.
interface SessionAugmentedRequest {
  session: {
    getUserId(): string;
  };
}

// ---------------------------------------------------------------------------
// BillingController — wave-75 M9 mock freemium upgrade path.
//
// Three endpoints, ALL behind AuthGuard (verification-REQUIRED — never
// SessionNoVerifyGuard; this is a payments surface):
//
//   POST /servers/:serverId/billing/tier
//     Owner-only. Changes the server's subscription tier via the injected
//     BILLING_PROVIDER. Owner-check happens BEFORE any write (no-IDOR):
//       404 if server not found → 403 if caller not owner → then mutate.
//     Same-tier change is a 200 idempotent no-op (provider upsert rewrites to
//     the same tier). Returns 200 ServerPlan.
//
//   GET /servers/:serverId/billing/plan
//     Owner OR member may read. 404 for unknown server, 403 for a caller who
//     is neither owner nor member. Returns 200 ServerPlan.
// ---------------------------------------------------------------------------

@Controller('servers/:serverId/billing')
export class BillingController {
  constructor(
    @Inject(BILLING_PROVIDER) private readonly billingProvider: BillingProvider,
    private readonly entitlementsService: EntitlementsService,
  ) {}

  @Post('tier')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async changeTier(
    @Req() req: SessionAugmentedRequest,
    @Param('serverId') serverId: string,
    @Body() body: unknown,
  ): Promise<ServerPlan> {
    // Validate the body FIRST — 400 on an invalid / unknown target tier.
    const parsed = TierChangeRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }

    const userId = req.session.getUserId();

    // OWNER-CHECK BEFORE ANY WRITE (mirror ServersService.updateServer ordering):
    //   1. 404 if the server does not exist.
    //   2. 403 if the caller is not the owner.
    // Only then do we invoke the provider (which performs the write).
    const [server] = await db.select().from(servers).where(eq(servers.id, serverId)).limit(1);
    if (!server) {
      throw new NotFoundException('Server not found');
    }
    if (server.owner_id !== userId) {
      throw new ForbiddenException('Not authorized to change this server plan');
    }

    const result = await this.billingProvider.startTierChange(
      serverId,
      parsed.data.targetTier,
      userId,
    );

    return {
      serverId,
      tier: result.tier,
      entitlements: result.entitlements,
    };
  }

  @Get('plan')
  @UseGuards(AuthGuard)
  async getPlan(
    @Req() req: SessionAugmentedRequest,
    @Param('serverId') serverId: string,
  ): Promise<ServerPlan> {
    const userId = req.session.getUserId();

    // 404 if the server does not exist.
    const [server] = await db.select().from(servers).where(eq(servers.id, serverId)).limit(1);
    if (!server) {
      throw new NotFoundException('Server not found');
    }

    // Owner OR member may read the plan. Owner always qualifies; otherwise the
    // caller must have a server_members row.
    if (server.owner_id !== userId) {
      const [member] = await db
        .select({ id: server_members.id })
        .from(server_members)
        .where(and(eq(server_members.server_id, serverId), eq(server_members.user_id, userId)))
        .limit(1);
      if (!member) {
        throw new ForbiddenException('Not a member of this server');
      }
    }

    const { tier, entitlements } = await this.entitlementsService.resolveForServer(serverId);

    return { serverId, tier, entitlements };
  }
}
