/**
 * Unit tests for toUiVisibility.
 *
 * Proves the honest-selector collapse: the server-side 3-value
 * profileVisibility enum collapses to the 2-option UI value, with
 * `server-members` absorbed into `everyone` (they are behaviourally
 * identical on every current surface).
 */

import { describe, expect, it } from 'vitest';

import { toUiVisibility } from './SettingsPrivacyPage';

describe('toUiVisibility', () => {
  it('maps "everyone" → "everyone"', () => {
    expect(toUiVisibility('everyone')).toBe('everyone');
  });

  it('maps "server-members" → "everyone" (absorbed into Visible, never a distinct live choice)', () => {
    expect(toUiVisibility('server-members')).toBe('everyone');
  });

  it('maps "nobody" → "nobody"', () => {
    expect(toUiVisibility('nobody')).toBe('nobody');
  });
});
