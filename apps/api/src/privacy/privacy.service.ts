import { Injectable, Logger } from '@nestjs/common';
import type {
  PrivacySettingsResponse,
  ProfileVisibility,
  UpdatePrivacyInput,
  WhoCanDm,
} from '@studyhall/shared';
import { eq } from 'drizzle-orm';
import { db } from '../db/index';
import { users } from '../db/schema/index';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { AppendPrivacyEventService } from './append-privacy-event.service';

@Injectable()
export class PrivacyService {
  private readonly logger = new Logger(PrivacyService.name);

  constructor(private readonly appendPrivacyEvent: AppendPrivacyEventService) {}
  async getPrivacy(userId: string): Promise<PrivacySettingsResponse> {
    const rows = await db
      .select({
        profile_visibility: users.profile_visibility,
        who_can_dm: users.who_can_dm,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const user = rows[0];

    // columns are NOT NULL default 'everyone' — absent row is a data anomaly,
    // not an expected branch; fall back defensively rather than throwing.
    if (!user) {
      return { profileVisibility: 'everyone', whoCanDm: 'everyone' };
    }

    return {
      profileVisibility: user.profile_visibility as ProfileVisibility,
      whoCanDm: user.who_can_dm as WhoCanDm,
    };
  }

  async updatePrivacy(userId: string, dto: UpdatePrivacyInput): Promise<PrivacySettingsResponse> {
    // ── Pre-read current settings (karen P-4 carry-forward) ──────────────────
    // The original implementation did a BLIND UPDATE without reading old values.
    // We MUST read old values first so the audit hook's context can carry
    // { visibilityFrom, visibilityTo, whoCanDmFrom, whoCanDmTo }.
    // Reuses getPrivacy() which already performs the SELECT with a defensive
    // fallback for missing rows.
    const before = await this.getPrivacy(userId);

    await db
      .update(users)
      .set({
        profile_visibility: dto.profileVisibility,
        who_can_dm: dto.whoCanDm,
        updated_at: new Date(),
      })
      .where(eq(users.id, userId));

    const after = await this.getPrivacy(userId);

    // ── Privacy audit hook (best-effort, AFTER update commits) ───────────────
    // Context carries ONLY non-PII visibility/whoCanDm enum values (no
    // email, display_name, or any PII — PII discipline per karen+jenny P-4).
    // Failure MUST NOT fail the updatePrivacy response.
    // Gate: only append when the settings actually changed. A re-save of
    // identical values must NOT write a no-op event into the append-only ledger.
    const settingsChanged =
      before.profileVisibility !== after.profileVisibility || before.whoCanDm !== after.whoCanDm;

    if (settingsChanged) {
      try {
        await this.appendPrivacyEvent.append(userId, 'privacy_settings_changed', {
          targetType: 'self',
          targetId: userId,
          context: {
            visibilityFrom: before.profileVisibility,
            visibilityTo: after.profileVisibility,
            whoCanDmFrom: before.whoCanDm,
            whoCanDmTo: after.whoCanDm,
          },
        });
      } catch (err) {
        this.logger.warn(
          `appendPrivacyEvent failed for privacy_settings_changed (actor=${userId}) — update is committed; audit log failure is non-fatal.`,
          err instanceof Error ? err.stack : String(err),
        );
      }
    }

    return after;
  }
}
