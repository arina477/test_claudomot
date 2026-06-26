import { Controller, Get } from '@nestjs/common';
import type { HealthResponse } from '@studyhall/shared';

@Controller()
export class HealthController {
  @Get('health')
  health(): HealthResponse {
    return {
      status: 'ok',
      service: 'studyhall-api',
      version: process.env['npm_package_version'] ?? '0.1.0',
    };
  }
}
