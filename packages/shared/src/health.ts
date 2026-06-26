import { z } from 'zod';

/**
 * Shape of the /health endpoint response.
 * Consumed by both the NestJS API (response serialisation) and
 * the React web app (health-check polling).
 */
export const HealthResponseSchema = z.object({
  status: z.enum(['ok', 'degraded']),
  service: z.string(),
  version: z.string(),
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;
