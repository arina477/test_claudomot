/**
 * UpdatePrivacySchema — PARTIAL-update contract (wave-80 B-6 F1).
 *
 * The privacy update is partial: every field is optional so a client can send
 * ONLY the field it is changing. This eliminates the cross-tab full-replace
 * clobber where a stale tab re-sends showPresence:true and silently re-enables
 * presence a first tab just turned off.
 *
 * GET (PrivacySettingsResponseSchema) stays required/unchanged.
 */

import { describe, expect, it } from 'vitest';
import { PrivacySettingsResponseSchema, UpdatePrivacySchema } from './privacy';

describe('UpdatePrivacySchema — partial update contract (F1)', () => {
  it('accepts a body with ONLY showPresence (the changed field)', () => {
    const parsed = UpdatePrivacySchema.safeParse({ showPresence: false });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.showPresence).toBe(false);
      // Untouched fields must be absent (undefined), NOT defaulted — so the
      // service leaves the corresponding DB columns unchanged.
      expect(parsed.data.profileVisibility).toBeUndefined();
      expect(parsed.data.whoCanDm).toBeUndefined();
    }
  });

  it('accepts a body with ONLY profileVisibility', () => {
    const parsed = UpdatePrivacySchema.safeParse({ profileVisibility: 'nobody' });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.profileVisibility).toBe('nobody');
      expect(parsed.data.showPresence).toBeUndefined();
    }
  });

  it('accepts a full three-field body (backwards compatible)', () => {
    const parsed = UpdatePrivacySchema.safeParse({
      profileVisibility: 'server-members',
      whoCanDm: 'nobody',
      showPresence: true,
    });
    expect(parsed.success).toBe(true);
  });

  it('accepts an empty body (no-op partial update)', () => {
    expect(UpdatePrivacySchema.safeParse({}).success).toBe(true);
  });

  it('rejects an invalid enum value even in a partial body', () => {
    expect(UpdatePrivacySchema.safeParse({ profileVisibility: 'bogus' }).success).toBe(false);
  });

  it('rejects a non-boolean showPresence', () => {
    expect(UpdatePrivacySchema.safeParse({ showPresence: 'true' }).success).toBe(false);
  });
});

describe('PrivacySettingsResponseSchema — GET stays required (unchanged)', () => {
  it('requires all three fields', () => {
    expect(PrivacySettingsResponseSchema.safeParse({ profileVisibility: 'everyone' }).success).toBe(
      false,
    );
  });

  it('accepts a complete settings object', () => {
    expect(
      PrivacySettingsResponseSchema.safeParse({
        profileVisibility: 'everyone',
        whoCanDm: 'everyone',
        showPresence: true,
      }).success,
    ).toBe(true);
  });
});
