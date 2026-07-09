/**
 * Integration test: API security headers + generic throttler 429 — wave-83 B-2
 * (task 875b97f4).
 *
 * Asserts the SHIPPED helmet config (via the real securityHeaders() export) and
 * the GenericThrottlerGuard 429 envelope against a lightweight NestJS bootstrap
 * driven over real HTTP with the built-in fetch. No Postgres required — this
 * exercises only the HTTP middleware/guard layer, so it does NOT use pg-harness.
 * (supertest is avoided: no @types/supertest is installed, so fetch keeps the
 * spec type-clean without adding a dev dependency.)
 *
 * Coverage:
 *   - HSTS present (max-age=15552000; includeSubDomains, no preload),
 *     X-Content-Type-Options nosniff, X-Frame-Options DENY, Referrer-Policy
 *     strict.
 *   - X-Powered-By ABSENT.
 *   - Content-Security-Policy, Cross-Origin-Resource-Policy,
 *     Cross-Origin-Embedder-Policy, Cross-Origin-Opener-Policy, and
 *     Origin-Agent-Cluster ALL ABSENT (the load-bearing fence).
 *   - ThrottlerGuard-triggered 429 body does NOT contain "ThrottlerException"
 *     (generic message), keeps HTTP 429 + Retry-After.
 *   - CORS preflight (OPTIONS from the web origin) still returns
 *     Access-Control-Allow-* and succeeds (helmet did not clobber it).
 */
import type { AddressInfo } from 'node:net';
import { Controller, Get, type INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { SkipThrottle, Throttle, ThrottlerModule } from '@nestjs/throttler';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { GenericThrottlerGuard } from '../../src/common/generic-throttler.guard';
import { securityHeaders } from '../../src/common/security-headers';

const WEB_ORIGIN = 'https://web-production-bce1a8.up.railway.app';

// Minimal controller to exercise the middleware + guard on real routes.
@Controller()
class PingController {
  // Header/CORS probes hit this route repeatedly — @SkipThrottle keeps them from
  // consuming the rate-limit counter that the dedicated /limited route asserts.
  @SkipThrottle()
  @Get('ping')
  ping(): { ok: true } {
    return { ok: true };
  }

  // Dedicated route with a tiny limit so the 429 test trips deterministically,
  // isolated from the header-probe traffic above.
  @Throttle({ default: { limit: 2, ttl: 60_000 } })
  @Get('limited')
  limited(): { ok: true } {
    return { ok: true };
  }
}

describe('API security headers + generic throttler 429 — wave-83 B-2 (task 875b97f4)', () => {
  let app: INestApplication;
  let baseUrl: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        // Global default is generous; the 429 case uses a per-route @Throttle
        // override (limit:2) on /limited so it trips deterministically without
        // the header-probe traffic interfering.
        ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
      ],
      controllers: [PingController],
      providers: [{ provide: APP_GUARD, useClass: GenericThrottlerGuard }],
    }).compile();

    app = moduleRef.createNestApplication<NestExpressApplication>();

    // Mirror the production bootstrap ordering: helmet FIRST, then CORS.
    app.use(securityHeaders());
    app.enableCors({
      origin: WEB_ORIGIN,
      credentials: true,
      allowedHeaders: ['content-type', 'rid', 'st-auth-mode'],
    });

    await app.listen(0);
    const server = app.getHttpServer();
    const { port } = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterAll(async () => {
    await app.close();
  });

  // -------------------------------------------------------------------------
  // 1. Safe flat headers present
  // -------------------------------------------------------------------------

  it('sets HSTS: max-age=15552000; includeSubDomains (no preload)', async () => {
    const res = await fetch(`${baseUrl}/ping`);
    const hsts = res.headers.get('strict-transport-security');
    expect(hsts).toBeTruthy();
    expect(hsts).toContain('max-age=15552000');
    expect(hsts).toContain('includeSubDomains');
    expect(hsts).not.toContain('preload');
  });

  it('sets X-Content-Type-Options: nosniff', async () => {
    const res = await fetch(`${baseUrl}/ping`);
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
  });

  it('sets X-Frame-Options: DENY', async () => {
    const res = await fetch(`${baseUrl}/ping`);
    expect(res.headers.get('x-frame-options')).toBe('DENY');
  });

  it('sets a strict Referrer-Policy', async () => {
    const res = await fetch(`${baseUrl}/ping`);
    const rp = res.headers.get('referrer-policy');
    // Strict values only — no-referrer OR strict-origin-when-cross-origin.
    expect(['no-referrer', 'strict-origin-when-cross-origin']).toContain(rp);
  });

  // -------------------------------------------------------------------------
  // 2. X-Powered-By removed
  // -------------------------------------------------------------------------

  it('removes X-Powered-By', async () => {
    const res = await fetch(`${baseUrl}/ping`);
    expect(res.headers.get('x-powered-by')).toBeNull();
  });

  // -------------------------------------------------------------------------
  // 3. LOAD-BEARING fence: CSP / CORP / COEP ABSENT
  // -------------------------------------------------------------------------

  it('does NOT set Content-Security-Policy (fenced off — breaks cross-origin)', async () => {
    const res = await fetch(`${baseUrl}/ping`);
    expect(res.headers.get('content-security-policy')).toBeNull();
  });

  it('does NOT set Cross-Origin-Resource-Policy (fenced off)', async () => {
    const res = await fetch(`${baseUrl}/ping`);
    expect(res.headers.get('cross-origin-resource-policy')).toBeNull();
  });

  it('does NOT set Cross-Origin-Embedder-Policy (fenced off)', async () => {
    const res = await fetch(`${baseUrl}/ping`);
    expect(res.headers.get('cross-origin-embedder-policy')).toBeNull();
  });

  it('does NOT set Cross-Origin-Opener-Policy (fenced off — breaks popup/OAuth flow)', async () => {
    const res = await fetch(`${baseUrl}/ping`);
    expect(res.headers.get('cross-origin-opener-policy')).toBeNull();
  });

  it('does NOT set Origin-Agent-Cluster (fenced off for consistency)', async () => {
    const res = await fetch(`${baseUrl}/ping`);
    expect(res.headers.get('origin-agent-cluster')).toBeNull();
  });

  // -------------------------------------------------------------------------
  // 4. Generic throttler 429 — no class name leak, 429 + Retry-After kept
  // -------------------------------------------------------------------------

  it('429 body is generic (no "ThrottlerException"), keeps 429 + Retry-After', async () => {
    // /limited has limit:2 → first two pass, third trips the guard.
    expect((await fetch(`${baseUrl}/limited`)).status).toBe(200);
    expect((await fetch(`${baseUrl}/limited`)).status).toBe(200);
    const res = await fetch(`${baseUrl}/limited`);

    expect(res.status).toBe(429);
    // Retry-After header preserved (base guard sets it before the throw).
    expect(res.headers.get('retry-after')).toBeTruthy();
    const body = (await res.json()) as Record<string, unknown>;
    // Body must not leak the framework class name anywhere.
    expect(JSON.stringify(body)).not.toContain('ThrottlerException');
    expect(body).toMatchObject({ statusCode: 429, message: 'Too Many Requests' });
    // Security headers still present on the 429 (helmet is global).
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('strict-transport-security')).toBeTruthy();
  });

  // -------------------------------------------------------------------------
  // 5. CORS preflight intact — helmet did not clobber Access-Control-Allow-*
  // -------------------------------------------------------------------------

  it('CORS preflight (OPTIONS) still returns Access-Control-Allow-* and succeeds', async () => {
    const res = await fetch(`${baseUrl}/ping`, {
      method: 'OPTIONS',
      headers: {
        Origin: WEB_ORIGIN,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'content-type',
      },
    });

    // Preflight succeeds (204/200) — not blocked by helmet.
    expect([200, 204]).toContain(res.status);
    expect(res.headers.get('access-control-allow-origin')).toBe(WEB_ORIGIN);
    expect(res.headers.get('access-control-allow-credentials')).toBe('true');
  });
});
