import 'reflect-metadata';
import type { INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { HealthResponseSchema } from '@studyhall/shared';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../app.module';
import { initSuperTokens } from '../auth/supertokens.config';
import { EmailService } from '../email/email.service';
import { UsersService } from '../users/users.service';

// Minimal type shim — supertest ships no bundled declarations
type SuperTestResponse = { status: number; body: Record<string, unknown> };
type SuperTestAgent = { get(path: string): Promise<SuperTestResponse> };
type SuperTestFactory = (app: object) => SuperTestAgent;

const request: SuperTestFactory = require('supertest') as SuperTestFactory;

describe('GET /health', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // Mirror what bootstrap() does before NestFactory.create():
    // SuperTokens must be initialized before the middleware handles any request.
    // In production, bootstrap() runs initSuperTokens() before NestFactory.create().
    // Tests never run bootstrap(), so we call it here instead.
    // UsersService and EmailService have no injected constructor arguments — safe to
    // instantiate directly, identical to what bootstrap() does. The idempotency guard
    // in supertokens.config.ts makes this safe to call even if another test file
    // initializes first.
    initSuperTokens(new UsersService(), new EmailService());

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 200 with a HealthResponse conforming to the shared schema', async () => {
    const res = await request(app.getHttpServer()).get('/health');

    expect(res.status).toBe(200);

    const parsed = HealthResponseSchema.safeParse(res.body);
    expect(parsed.success).toBe(true);

    if (parsed.success) {
      expect(parsed.data.status).toBe('ok');
      expect(parsed.data.service).toBe('studyhall-api');
      expect(typeof parsed.data.version).toBe('string');
      expect(parsed.data.version.length).toBeGreaterThan(0);
    }
  });
});
