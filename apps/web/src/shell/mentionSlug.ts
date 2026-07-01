// Mirrors packages/shared/src/mentions.ts (extractMentionSlug) — CJS-avoidance
// pattern; parity enforced by mention-slug-parity contract test.
//
// @studyhall/shared is CJS-only (dist/index.js = CommonJS; no ESM build).
// Rollup's cjs-module-lexer cannot detect `extractMentionSlug` through the
// Object.defineProperty re-export getter in dist/index.js, so the web
// production build (vite/rollup) cannot resolve the runtime value import.
//
// The established convention (see messagingSocket.ts:32-40) is: web never
// imports runtime value constants from @studyhall/shared — it mirrors them
// locally and uses `import type` only.  The mention-slug-parity contract test
// enforces that this mirror never drifts from the canonical shared source.

/**
 * Raw character class source for the mention token slug.
 *
 * Mirrors `MENTION_TOKEN_SLUG_SRC` from packages/shared/src/mentions.ts.
 * The contract test asserts strict string equality between this value and the
 * shared one.
 *
 * mention TOKEN slug — intentionally broader than the username validation
 * grammar; a token that isn't a real username resolves to nothing (plain text).
 */
export const MENTION_TOKEN_SLUG_SRC = 'a-zA-Z0-9_-' as const;

/**
 * Extract the mention slug from a raw `@`-prefixed token string.
 *
 * Mirrors `extractMentionSlug` from packages/shared/src/mentions.ts.
 * Behavior is identical to the shared implementation:
 *   "@bob.dev"  → "bob"     (dot is not in the slug class)
 *   "@alice!"   → "alice"   (exclamation stripped)
 *   "@carol-X"  → "carol-X" (hyphen IS in slug class)
 *   "@"         → null
 *   "@."        → null
 *
 * @param rawToken - The raw token, e.g. "@bob.dev" or "bob.dev" (@ optional).
 * @returns The slug string, or null if no slug can be extracted.
 */
export function extractMentionSlug(rawToken: string): string | null {
  // Drop a leading '@' if present.
  const withoutSigil = rawToken.startsWith('@') ? rawToken.slice(1) : rawToken;

  // Match the longest leading run of slug characters (derived from local MENTION_TOKEN_SLUG_SRC).
  const match = withoutSigil.match(new RegExp(`^[${MENTION_TOKEN_SLUG_SRC}]+`));
  return match?.[0] ?? null;
}
