/**
 * useTyping.test.ts — wave-59 B-3 contract test for buildTypingLabel.
 *
 * Locks the 5-branch output contract of buildTypingLabel with a table-driven
 * test covering all buckets: 0, 1, 2, 3, and 4+ typers. The 4+ bucket is
 * covered by both a 4-typer and a 5-typer case to confirm true fallthrough.
 *
 * Task: f8eb49c1
 */

import { describe, expect, it } from 'vitest';
import { buildTypingLabel } from './useTyping';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

type Typer = { userId: string; displayName: string };

function t(displayName: string): Typer {
  return { userId: `uid-${displayName.toLowerCase()}`, displayName };
}

const ALICE = t('Alice');
const BOB = t('Bob');
const CAROL = t('Carol');
const DAVE = t('Dave');
const EVE = t('Eve');

// ---------------------------------------------------------------------------
// Contract table
// ---------------------------------------------------------------------------

const TABLE: Array<{ label: string; typers: Typer[]; expected: string }> = [
  {
    label: '0 typers → empty string',
    typers: [],
    expected: '',
  },
  {
    label: '1 typer → "<name> is typing"',
    typers: [ALICE],
    expected: 'Alice is typing',
  },
  {
    label: '2 typers → "<a> and <b> are typing"',
    typers: [ALICE, BOB],
    expected: 'Alice and Bob are typing',
  },
  {
    label: '3 typers → "<a>, <b> and <c> are typing"',
    typers: [ALICE, BOB, CAROL],
    expected: 'Alice, Bob and Carol are typing',
  },
  {
    label: '4 typers → "Several people are typing"',
    typers: [ALICE, BOB, CAROL, DAVE],
    expected: 'Several people are typing',
  },
  {
    label: '5 typers → "Several people are typing" (confirms 4+ is true fallthrough)',
    typers: [ALICE, BOB, CAROL, DAVE, EVE],
    expected: 'Several people are typing',
  },
];

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('buildTypingLabel — 5-branch output contract', () => {
  it.each(TABLE)('$label', ({ typers, expected }) => {
    expect(buildTypingLabel(typers)).toBe(expected);
  });
});
