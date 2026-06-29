import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { HealthResponse } from '@studyhall/shared';

// Health check must not be throttled — uptime monitors poll this endpoint.
@SkipThrottle()
@Controller()
export class HealthController {
  @Get('health')
  health(): HealthResponse {
    return {
      status: 'ok',
      service: 'studyhall-api',
      version: process.env.npm_package_version ?? '0.1.0',
    };
  }
}
