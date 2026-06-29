import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { HealthResponse } from '@studyhall/shared';
import { API_VERSION } from '../version';

// Health check must not be throttled — uptime monitors poll this endpoint.
@SkipThrottle()
@Controller()
export class HealthController {
  @Get('health')
  health(): HealthResponse {
    return {
      status: 'ok',
      service: 'studyhall-api',
      // API_VERSION reads the real package.json version at runtime,
      // regardless of whether npm_package_version is set by the process launcher.
      version: API_VERSION,
    };
  }
}
