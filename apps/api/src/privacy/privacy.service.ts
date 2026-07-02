import { Injectable } from '@nestjs/common';
import type {
  PrivacySettingsResponse,
  ProfileVisibility,
  UpdatePrivacyInput,
  WhoCanDm,
} from '@studyhall/shared';
import { eq } from 'drizzle-orm';
import { db } from '../db/index';
import { users } from '../db/schema/index';

@Injectable()
export class PrivacyService {
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
    await db
      .update(users)
      .set({
        profile_visibility: dto.profileVisibility,
        who_can_dm: dto.whoCanDm,
        updated_at: new Date(),
      })
      .where(eq(users.id, userId));

    return this.getPrivacy(userId);
  }
}
