/**
 * AppHome — the authenticated app shell at /app.
 *
 * Fetches GET /me to check emailVerified; shows the VerifyEmailBanner
 * when emailVerified is false (backend claim is relaxed so unverified users
 * can reach this view — the banner is informational).
 *
 * Wraps AppShell with ProfileProvider so the shell columns (ChannelSidebar)
 * can read the user's avatarUrl, accentColor, and displayName.
 */

import type { MeResponse } from '@studyhall/shared';
import { useEffect, useState } from 'react';
import { api } from '../auth/api';
import { VerifyEmailBanner } from '../components/VerifyEmailBanner';
import { AppShell } from '../shell/AppShell';
import { ProfileProvider } from '../shell/ProfileContext';

export function AppHome() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    api
      .getMe()
      .then(setMe)
      .catch(() => null);
  }, []);

  const showBanner = !bannerDismissed && me !== null && !me.emailVerified;

  return (
    <ProfileProvider>
      <div className="flex h-full flex-col overflow-hidden">
        {showBanner && <VerifyEmailBanner onDismiss={() => setBannerDismissed(true)} />}
        <div className="flex-1 overflow-hidden">
          <AppShell connectionState="online" />
        </div>
      </div>
    </ProfileProvider>
  );
}
