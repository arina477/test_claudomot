import 'reflect-metadata';
import { type INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { HealthResponseSchema } from '@studyhall/shared';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../app.module';

// Minimal type shim — supertest ships no bundled declarations
type SuperTestResponse = { status: number; body: Record<string, unknown> };
type SuperTestAgent = { get(path: string): Promise<SuperTestResponse> };
type SuperTestFactory = (app: object) => SuperTestAgent;

const request: SuperTestFactory = require('supertest') as SuperTestFactory;

describe('GET /health', () => {
  let app: INestApplication;

  beforeAll(async () => {
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
