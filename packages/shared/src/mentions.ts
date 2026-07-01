// ---------------------------------------------------------------------------
// mentions.ts — shared mention-token slug grammar
// wave-25 task (mention-parity)
//
// Single source of truth for the mention TOKEN slug character class.
// Both the API (mentions.ts parseMentions) and the web client
// (MessageList.tsx renderBodyWithMentions) import from here so the
// tokenization boundary is identical on both sides.
//
// Slug grammar: [a-zA-Z0-9_-]+
//   - Intentionally BROADER than the username validation grammar
//     ([a-z0-9_]{3,20} at profile.ts:14, which forbids hyphens + uppercase).
//   - A token that matches this grammar but is not a real username resolves
//     to nothing (plain text) — the server's mention resolver handles that.
// ---------------------------------------------------------------------------

/**
 * Raw character class source for the mention token slug.
 *
 * mention TOKEN slug — intentionally broader than the username validation
 * grammar; a token that isn't a real username resolves to nothing (plain text).
 *
 * Use this to build the server-side full matcher:
 *   new RegExp(`(?:^|\\s)@([${MENTION_TOKEN_SLUG_SRC}]+)`, 'g')
 *
 * Or use `MENTION_TOKEN_SLUG_RE` for an anchored slug-only test / capture.
 */
export const MENTION_TOKEN_SLUG_SRC = 'a-zA-Z0-9_-' as const;

/**
 * Anchored regex that matches an entire mention token slug.
 *
 * Pattern: /^[a-zA-Z0-9_-]+$/  (derived from MENTION_TOKEN_SLUG_SRC)
 *
 * mention TOKEN slug — intentionally broader than the username validation
 * grammar; a token that isn't a real username resolves to nothing (plain text).
 */
export const MENTION_TOKEN_SLUG_RE: RegExp = new RegExp(`^[${MENTION_TOKEN_SLUG_SRC}]+$`);

/**
 * Extract the mention slug from a raw `@`-prefixed token string.
 *
 * Accepts the raw token with or without the leading `@`. Returns the longest
 * leading run of `[a-zA-Z0-9_-]` characters, or `null` when none is found
 * (e.g. the token is empty or starts with a non-slug character).
 *
 * This covers the client's current trailing-punctuation-strip logic:
 *   "@bob.dev"  → "bob"   (dot is not in the slug class)
 *   "@alice!"   → "alice" (exclamation stripped)
 *   "@carol-X"  → "carol-X" (hyphen IS in slug class)
 *   "@"         → null
 *
 * mention TOKEN slug — intentionally broader than the username validation
 * grammar; a token that isn't a real username resolves to nothing (plain text).
 *
 * @param rawToken - The raw token, e.g. "@bob.dev" or "bob.dev" (@ optional).
 * @returns The slug string, or null if no slug can be extracted.
 */
export function extractMentionSlug(rawToken: string): string | null {
  // Drop a leading '@' if present.
  const withoutSigil = rawToken.startsWith('@') ? rawToken.slice(1) : rawToken;

  // Match the longest leading run of slug characters (derived from MENTION_TOKEN_SLUG_SRC).
  const match = withoutSigil.match(new RegExp(`^[${MENTION_TOKEN_SLUG_SRC}]+`));
  return match?.[0] ?? null;
}
