/**
 * Shared Postgres error-code helpers used by the global exception filter.
 *
 * The Drizzle + node-postgres stack wraps the native PG driver error inside
 * a DrizzleQueryError, so the SQLSTATE `code` field lives at:
 *   err.cause.code         — the common case (DrizzleQueryError wraps PG error)
 *   err.cause.cause.code   — defensive: future driver/ORM extra-wrap layer
 *   err.code               — fallback if a PG error somehow escapes unwrapped
 *
 * This walk mirrors the shipped `isUniqueViolation` helper at
 * apps/api/src/users/users.service.ts:23-38 exactly — same structure, same
 * reasoning, different target code.
 */

// Postgres SQLSTATE: invalid_text_representation — thrown when a non-UUID
// string is supplied as a parameter to a column typed `uuid` (e.g. a raw
// string passed to a parameterised WHERE clause on a uuid PK).
export const PG_INVALID_TEXT_REPRESENTATION = '22P02';

interface DatabaseError {
  code?: string;
  cause?: unknown;
}

/**
 * Walk up to two `.cause` levels to find SQLSTATE 22P02
 * (invalid_text_representation — non-UUID cast failure).
 *
 * Returns true when the error originates from Postgres rejecting a malformed
 * UUID string in a parameterised query, which is the root cause of the
 * malformed-route-param → 500 bug this filter addresses.
 */
export function isInvalidTextRepresentation(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false;
  const e = err as DatabaseError;
  if (e.code === PG_INVALID_TEXT_REPRESENTATION) return true;
  // One level deep (DrizzleQueryError → PG error)
  if (typeof e.cause === 'object' && e.cause !== null) {
    const cause1 = e.cause as DatabaseError;
    if (cause1.code === PG_INVALID_TEXT_REPRESENTATION) return true;
    // Two levels deep
    if (typeof cause1.cause === 'object' && cause1.cause !== null) {
      const cause2 = cause1.cause as DatabaseError;
      if (cause2.code === PG_INVALID_TEXT_REPRESENTATION) return true;
    }
  }
  return false;
}
