// ---------------------------------------------------------------------------
// mentions.ts — @mention parsing utility
// wave-15 task 3d238446
// wave-25 mention-parity: TOKEN_RE rebuilt from shared MENTION_TOKEN_SLUG_SRC
//
// parseMentions(body) extracts @username tokens that are WORD-BOUNDARIED:
//   - Only triggered after start-of-string or a whitespace character.
//   - NOT triggered mid-word (e.g. email local-parts like a@b are ignored).
//   - Captures sequences [a-zA-Z0-9_-]+ following the @ sigil.
//   - Returns deduplicated lowercase tokens; order matches first appearance.
//
// @everyone / @here / @role are out-of-scope this wave (spec §SECURITY).
// ---------------------------------------------------------------------------

import { MENTION_TOKEN_SLUG_SRC } from '@studyhall/shared';

/**
 * Parse @username tokens from message body text.
 *
 * Token grammar: (^|\s)@([a-zA-Z0-9_-]+)
 *   - Capture group 1: the @token trigger — start-of-string or whitespace.
 *   - Capture group 2: the username slug (alphanumeric + _ + -).
 *
 * TOKEN_RE is derived from the shared MENTION_TOKEN_SLUG_SRC constant so the
 * server and client share a single source of truth for the slug character class.
 * The resulting pattern is identical to the former inline literal — behavior
 * is fully preserved.
 *
 * Returns an array of unique lowercase usernames in order of first appearance.
 * An empty array is returned when the body contains no valid mention tokens.
 *
 * Examples:
 *   parseMentions("hello @alice!")          → ["alice"]
 *   parseMentions("@bob and @carol")        → ["bob", "carol"]
 *   parseMentions("email a@b.com is fine")  → []           // mid-word — excluded
 *   parseMentions("@alice @alice again")    → ["alice"]    // deduplicated
 *   parseMentions("plain text")             → []
 */
export function parseMentions(body: string): string[] {
  // (?:^|\s) — non-capturing: start-of-string OR any whitespace
  // @         — literal sigil
  // ([MENTION_TOKEN_SLUG_SRC]+) — username slug, rebuilt from shared constant
  // Equivalent to the former inline: /(?:^|\s)@([a-zA-Z0-9_-]+)/g
  const TOKEN_RE = new RegExp(`(?:^|\\s)@([${MENTION_TOKEN_SLUG_SRC}]+)`, 'g');

  const seen = new Set<string>();
  const result: string[] = [];

  for (const match of body.matchAll(TOKEN_RE)) {
    const username = match[1]?.toLowerCase();
    if (username !== undefined && !seen.has(username)) {
      seen.add(username);
      result.push(username);
    }
  }

  return result;
}
