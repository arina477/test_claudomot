import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CreateBlockSchema } from '@studyhall/shared';
import type { Block, BlockListResponse } from '@studyhall/shared';
import { AuthGuard } from '../auth/auth.guard';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { BlocksService } from './blocks.service';

// ---------------------------------------------------------------------------
// SessionAugmentedRequest — mirrors moderation.controller.ts + reports.controller.ts exactly.
// callerUserId is ALWAYS derived from req.session.getUserId() (no IDOR).
// ---------------------------------------------------------------------------

interface SessionAugmentedRequest {
  session: {
    getUserId(): string;
  };
}

// ---------------------------------------------------------------------------
// BlocksController — wave-70 M14 user-to-user block feature
//
// Routes:
//   POST   /blocks
//     Body: { blockedUserId: string }
//     blocker from session (no IDOR).
//     Returns 201 + Block DTO.
//
//   DELETE /blocks/:blockedUserId
//     blocker from session. Idempotent: not-blocked → 204 no-op.
//     Returns 204 No Content.
//
//   GET    /blocks
//     Returns the caller's own block list only (no IDOR).
//     Returns 200 + BlockListResponse.
//
// Security:
//   - @UseGuards(AuthGuard) on controller — session required for ALL routes.
//   - blockerUserId from req.session.getUserId() — never from body/params.
//   - blockedUserId from route param (DELETE) or validated body (POST).
//   - Zod body validation mirrors reports.controller.ts pattern.
// ---------------------------------------------------------------------------

@Controller('blocks')
@UseGuards(AuthGuard)
export class BlocksController {
  constructor(private readonly blocksService: BlocksService) {}

  /**
   * POST /blocks
   *
   * Block a user. blocker from session.
   * Body: { blockedUserId: string }
   * Returns: 201 + Block
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createBlock(@Req() req: SessionAugmentedRequest, @Body() body: unknown): Promise<Block> {
    const parsed = CreateBlockSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }

    const blockerUserId = req.session.getUserId();
    return await this.blocksService.createBlock(blockerUserId, parsed.data.blockedUserId);
  }

  /**
   * DELETE /blocks/:blockedUserId
   *
   * Unblock a user. blocker from session. Idempotent (not-blocked → 204 no-op).
   * Returns: 204 No Content
   */
  @Delete(':blockedUserId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeBlock(
    @Param('blockedUserId') blockedUserId: string,
    @Req() req: SessionAugmentedRequest,
  ): Promise<void> {
    const blockerUserId = req.session.getUserId();
    await this.blocksService.removeBlock(blockerUserId, blockedUserId);
  }

  /**
   * GET /blocks
   *
   * List the caller's own blocks. No IDOR: only returns caller's block list.
   * Returns: 200 + BlockListResponse
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async listBlocks(@Req() req: SessionAugmentedRequest): Promise<BlockListResponse> {
    const blockerUserId = req.session.getUserId();
    const blocks = await this.blocksService.listBlocks(blockerUserId);
    return { blocks };
  }
}
