import { z } from 'zod';

/**
 * isUuid — returns true when value is a syntactically valid UUID (any version).
 *
 * Backed by Zod's uuid validator (same convention as packages/shared/src/rbac.ts
 * and presence.ts). Small, pure, no side effects.
 *
 * Reused by study-room gateway parse-layer guard (wave-53) and the deferred
 * app-wide malformed-uuid sweep (task c52a7a52).
 */
export function isUuid(value: string): boolean {
  return z.string().uuid().safeParse(value).success;
}
