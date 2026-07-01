/**
 * ProfileContext — shares the user's profile (avatarUrl, accentColor,
 * displayName, username) across AppHome, AppShell, and ChannelSidebar.
 *
 * AppHome fetches GET /profile once on mount and provides the result here.
 * ProfilePage calls refresh() after any successful save so the shell stays
 * in sync without a full page reload.
 */

import type { ProfileResponse } from '@studyhall/shared';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { api } from '../auth/api';
import { seedSelfPresence } from './presenceSocket';
import { resetMentionBadges } from './useMentionBadge';

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
  const prevUsernameRef = useRef<string | null | undefined>(undefined);

  const fetch_ = useCallback(() => {
    api
      .getProfile()
      .then(setProfile)
      .catch(() => null);
  }, []);

  useEffect(() => {
    fetch_();
  }, [fetch_]);

  // H-2 singleton reset: when the profile username changes (including going to
  // null on logout), reset the mention-badge store so a subsequent user in the
  // same tab doesn't inherit the prior user's unread counts.
  useEffect(() => {
    const username = profile?.username ?? null;
    if (prevUsernameRef.current !== undefined && prevUsernameRef.current !== username) {
      resetMentionBadges();
    }
    prevUsernameRef.current = username;
  }, [profile]);

  // Seed the viewer's own presence as 'online' so AuthorPresenceDot correctly
  // shows an online dot on the viewer's own messages. The server snapshot
  // excludes self (getCoMemberUserIds filters self), so without this seed
  // hasPresence(ownUserId) is always false on own-authored rows.
  useEffect(() => {
    if (profile?.userId) {
      seedSelfPresence(profile.userId);
    }
  }, [profile?.userId]);

  return (
    <ProfileContext.Provider value={{ profile, refresh: fetch_ }}>
      {children}
    </ProfileContext.Provider>
  );
}
