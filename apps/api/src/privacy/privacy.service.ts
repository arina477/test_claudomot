import { Injectable, Logger, Optional } from '@nestjs/common';
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
import { PresenceGateway } from '../presence/presence.gateway';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { AppendPrivacyEventService } from './append-privacy-event.service';

@Injectable()
export class PrivacyService {
  private readonly logger = new Logger(PrivacyService.name);

  constructor(
    private readonly appendPrivacyEvent: AppendPrivacyEventService,
    // PresenceGateway drives the PROACTIVE toggle-time presence emit (wave-80):
    // when show_presence flips for a currently-online user, co-members are updated
    // WITHOUT a reconnect. Optional so unit/integration harnesses that don't wire
    // the Socket.IO gateway (e.g. the pg-only CI harness) can still construct the
    // service; the passive emit-path gates cover honor on next connect/disconnect.
    @Optional() private readonly presenceGateway?: PresenceGateway,
  ) {}
  async getPrivacy(userId: string): Promise<PrivacySettingsResponse> {
    const rows = await db
      .select({
        profile_visibility: users.profile_visibility,
        who_can_dm: users.who_can_dm,
        show_presence: users.show_presence,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const user = rows[0];

    // columns are NOT NULL default 'everyone'/true — absent row is a data
    // anomaly, not an expected branch; fall back defensively rather than throwing.
    if (!user) {
      return { profileVisibility: 'everyone', whoCanDm: 'everyone', showPresence: true };
    }

    return {
      profileVisibility: user.profile_visibility as ProfileVisibility,
      whoCanDm: user.who_can_dm as WhoCanDm,
      showPresence: user.show_presence,
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

    // ── PARTIAL update (wave-80 B-6 F1) ──────────────────────────────────────
    // UpdatePrivacySchema is now partial: a client sends ONLY the field it is
    // changing. We MUST update only the columns present in the payload and leave
    // any unspecified column untouched — otherwise a stale full-replace body (or
    // a partial one) would clobber a field a concurrent tab just set. Build the
    // SET object from present keys only; `updated_at` always bumps.
    const setValues: Partial<{
      profile_visibility: (typeof dto)['profileVisibility'];
      who_can_dm: (typeof dto)['whoCanDm'];
      show_presence: boolean;
    }> & { updated_at: Date } = { updated_at: new Date() };

    if (dto.profileVisibility !== undefined) setValues.profile_visibility = dto.profileVisibility;
    if (dto.whoCanDm !== undefined) setValues.who_can_dm = dto.whoCanDm;
    if (dto.showPresence !== undefined) setValues.show_presence = dto.showPresence;

    await db.update(users).set(setValues).where(eq(users.id, userId));

    const after = await this.getPrivacy(userId);

    // Track show_presence change independently — it drives BOTH the audit gate
    // and the proactive presence emit below. Under partial updates (F1) the emit
    // must ALSO require show_presence to have been in the payload: a
    // profileVisibility-only PUT must never trigger a presence re-broadcast even
    // if the before/after read races a concurrent presence write.
    const showPresenceChanged = before.showPresence !== after.showPresence;
    const showPresenceInPayload = dto.showPresence !== undefined;

    // ── Privacy audit hook (best-effort, AFTER update commits) ───────────────
    // Context carries ONLY non-PII visibility/whoCanDm/showPresence values (no
    // email, display_name, or any PII — PII discipline per karen+jenny P-4).
    // Failure MUST NOT fail the updatePrivacy response.
    // Gate: only append when the settings actually changed. A re-save of
    // identical values must NOT write a no-op event into the append-only ledger.
    const settingsChanged =
      before.profileVisibility !== after.profileVisibility ||
      before.whoCanDm !== after.whoCanDm ||
      showPresenceChanged;

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
            showPresenceFrom: before.showPresence,
            showPresenceTo: after.showPresence,
          },
        });
      } catch (err) {
        this.logger.warn(
          `appendPrivacyEvent failed for privacy_settings_changed (actor=${userId}) — update is committed; audit log failure is non-fatal.`,
          err instanceof Error ? err.stack : String(err),
        );
      }
    }

    // ── PROACTIVE toggle-time presence emit (wave-80 — the real AC-2 mechanism) ─
    // Passive emit-path gating alone does NOT update a co-member mid-session (the
    // user already broadcast online before toggling; presence emits only on
    // connect/disconnect). So when show_presence flips for a currently-online
    // user, proactively drive the co-member view:
    //   on → hidden  → presence:offline for the user
    //   hidden → on  → presence:online for the user
    // The gateway no-ops when the user is not currently connected. Best-effort:
    // a failure here must NOT fail the updatePrivacy response.
    if (showPresenceInPayload && showPresenceChanged && this.presenceGateway) {
      try {
        await this.presenceGateway.onShowPresenceChanged(userId, after.showPresence);
      } catch (err) {
        this.logger.warn(
          `onShowPresenceChanged failed (actor=${userId}) — privacy update is committed; presence re-broadcast failure is non-fatal.`,
          err instanceof Error ? err.stack : String(err),
        );
      }
    }

    return after;
  }
}
