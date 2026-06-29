import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { ServerDetail, ServerResponse, ServerSummary } from '@studyhall/shared';
import { CreateServerSchema } from '@studyhall/shared';
import { AuthGuard } from '../auth/auth.guard';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { ServersService } from './servers.service';

// Minimal interface for the ST-augmented request — mirrors the pattern in other controllers.
interface SessionAugmentedRequest {
  session: {
    getUserId(): string;
  };
}

@Controller('servers')
export class ServersController {
  constructor(private readonly serversService: ServersService) {}

  @Post()
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createServer(
    @Req() req: SessionAugmentedRequest,
    @Body() body: unknown,
  ): Promise<ServerResponse> {
    const parsed = CreateServerSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }

    const userId = req.session.getUserId();
    return await this.serversService.createServer(userId, parsed.data.name);
  }

  @Get()
  @UseGuards(AuthGuard)
  async listServers(@Req() req: SessionAugmentedRequest): Promise<ServerSummary[]> {
    const userId = req.session.getUserId();
    return await this.serversService.findMyServers(userId);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  async getServerDetail(
    @Req() req: SessionAugmentedRequest,
    @Param('id') id: string,
  ): Promise<ServerDetail> {
    const userId = req.session.getUserId();
    return await this.serversService.findServerDetail(userId, id);
  }
}
