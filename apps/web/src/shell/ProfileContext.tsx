/**
 * ProfileContext — shares the user's profile (avatarUrl, accentColor,
 * displayName, username) across AppHome, AppShell, and ChannelSidebar.
 *
 * AppHome fetches GET /profile once on mount and provides the result here.
 * ProfilePage calls refresh() after any successful save so the shell stays
 * in sync without a full page reload.
 */

import type { ProfileResponse } from '@studyhall/shared';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../auth/api';

export type ProfileContextValue = {
  profile: ProfileResponse | null;
  /** Call after any profile mutation to re-fetch from the server. */
  refresh: () => void;
};

export const ProfileContext = createContext<ProfileContextValue>({
  profile: null,
  refresh: () => {},
});

export function useProfile(): ProfileContextValue {
  return useContext(ProfileContext);
}

type Props = { children: React.ReactNode };

export function ProfileProvider({ children }: Props) {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);

  const fetch_ = useCallback(() => {
    api
      .getProfile()
      .then(setProfile)
      .catch(() => null);
  }, []);

  useEffect(() => {
    fetch_();
  }, [fetch_]);

  return (
    <ProfileContext.Provider value={{ profile, refresh: fetch_ }}>
      {children}
    </ProfileContext.Provider>
  );
}
