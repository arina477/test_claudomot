/**
 * mention-slug-parity — contract test (wave-25 B-5 fix)
 *
 * Asserts that the web-local mirror of extractMentionSlug/MENTION_TOKEN_SLUG_SRC
 * in mentionSlug.ts is byte-for-byte identical to the canonical implementation
 * in @studyhall/shared (packages/shared/src/mentions.ts).
 *
 * WHY this test exists
 * --------------------
 * @studyhall/shared is CJS-only (dist/index.js = CommonJS; no ESM build).
 * The vite/rollup production build cannot resolve runtime value exports from it
 * (cjs-module-lexer cannot detect the function through Object.defineProperty
 * re-export getters). Vitest handles CJS cleanly — so this test can import
 * BOTH the shared original AND the web mirror and assert parity.
 *
 * The web app therefore keeps a physical mirror in mentionSlug.ts and imports
 * from there at runtime. This test is the single source of truth that prevents
 * the two implementations from drifting apart. Any future change to the shared
 * grammar that is not reflected in the web mirror will make this test RED.
 */

import {
  extractMentionSlug as sharedExtract,
  MENTION_TOKEN_SLUG_SRC as sharedSlugSrc,
} from '@studyhall/shared';
import { describe, expect, it } from 'vitest';
import {
  extractMentionSlug as localExtract,
  MENTION_TOKEN_SLUG_SRC as localSlugSrc,
} from './mentionSlug';

// ---------------------------------------------------------------------------
// Parity table — inputs shared between both implementations
// ---------------------------------------------------------------------------

const TABLE: Array<[input: string, expected: string | null]> = [
  // Standard username tokens
  ['@bob', 'bob'],
  ['@alice', 'alice'],
  // Hyphen IS in slug class
  ['@carol-X', 'carol-X'],
  // Underscore IS in slug class
  ['@a_b-c', 'a_b-c'],
  // Trailing punctuation NOT in slug class → stripped
  ['@bob.dev', 'bob'],
  ['@alice!', 'alice'],
  // Empty / degenerate inputs → null
  ['@', null],
  ['@.', null],
  ['', null],
  // Without leading sigil (@ optional per spec)
  ['bob', 'bob'],
  ['bob.dev', 'bob'],
  // CLASS-BOUNDARY PROBE: dot (.) sits just outside [a-zA-Z0-9_-].
  // Expected extraction stops at the dot → 'pre'.
  // If MENTION_TOKEN_SLUG_SRC were changed to include '.' (e.g. 'a-zA-Z0-9_-.'),
  // extractMentionSlug would return 'pre.fix' instead, making this row RED and
  // exposing the SRC drift even when the SRC strings still agree letter-for-letter
  // but the char class boundary has widened.  Ensures the regex is genuinely
  // wired to SRC, not hardcoded independently of it.
  ['@pre.fix', 'pre'],
];

// ---------------------------------------------------------------------------
// Slug-source string parity
// ---------------------------------------------------------------------------

describe('MENTION_TOKEN_SLUG_SRC — web mirror === shared', () => {
  it('local MENTION_TOKEN_SLUG_SRC is identical to the shared constant', () => {
    expect(localSlugSrc).toBe(sharedSlugSrc);
  });
});

// ---------------------------------------------------------------------------
// extractMentionSlug behavioral parity
// ---------------------------------------------------------------------------

describe('extractMentionSlug — web mirror output === shared output (all inputs)', () => {
  for (const [input, expected] of TABLE) {
    it(`input ${JSON.stringify(input)} → ${JSON.stringify(expected)}`, () => {
      const sharedResult = sharedExtract(input);
      const localResult = localExtract(input);

      // Both must match the expected canonical output
      expect(sharedResult).toBe(expected);
      expect(localResult).toBe(expected);

      // And the two must agree with each other
      expect(localResult).toBe(sharedResult);
    });
  }
});
