// ---------------------------------------------------------------------------
// mentions.ts — @mention parsing utility
// wave-15 task 3d238446
//
// parseMentions(body) extracts @username tokens that are WORD-BOUNDARIED:
//   - Only triggered after start-of-string or a whitespace character.
//   - NOT triggered mid-word (e.g. email local-parts like a@b are ignored).
//   - Captures sequences [a-zA-Z0-9_-]+ following the @ sigil.
//   - Returns deduplicated lowercase tokens; order matches first appearance.
//
// @everyone / @here / @role are out-of-scope this wave (spec §SECURITY).
// ---------------------------------------------------------------------------

/**
 * Parse @username tokens from message body text.
 *
 * Token grammar: (^|\s)@([a-zA-Z0-9_-]+)
 *   - Capture group 1: the @token trigger — start-of-string or whitespace.
 *   - Capture group 2: the username slug (alphanumeric + _ + -).
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
  // ([a-zA-Z0-9_-]+) — username slug (captured)
  const TOKEN_RE = /(?:^|\s)@([a-zA-Z0-9_-]+)/g;

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
