/**
 * MemberListPanel — right sidebar showing server members grouped by presence.
 *
 * Design: design/server-channel-view.html (D-3 ADOPTED) § PANE 4: RIGHT SIDEBAR.
 *
 * Layout: 240px fixed, bg-study-900, hidden ≤1024px (design §9 responsive).
 *   - "MEMBERS" header (11px, uppercase, bold, text-zinc-500).
 *   - "Online — N" group header (id="online-group"), followed by <ul> of online members.
 *   - "Offline — N" group header (id="offline-group"), followed by <ul> of offline members.
 *   - Each <li>: avatar (32px) + presence dot (emerald online / surface-500 offline)
 *     + name (14px, text-zinc-200 online / text-white/50 offline).
 *   - Offline avatars are opacity-70 at rest, opacity-100 on hover.
 *   - focus-visible rings (emerald-400/70) on each list item.
 *   - Loading skeleton: animate-pulse placeholder rows (design § Member List: Loading).
 *   - Empty state: icon + "No one else here yet" (design § Member List: Empty).
 *
 * Data sources:
 *   - Member roster: GET /servers/:id/members (api.getServerMembers) fetched on
 *     selected-server change. This is the canonical server-members data source.
 *   - Presence status: usePresence() hook (presenceSocket.ts store).
 *
 * Live-move: presence updates from the socket re-sort members between Online /
 * Offline groups on every presence change (tick dependency triggers re-render).
 *
 * Responsive: hidden at ≤1024px via the parent layout; this component does not
 * manage its own visibility — the caller wraps it in a responsive container.
 */

import type { ServerMember } from '@studyhall/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../auth/api';
import { usePresence } from './usePresence';
import { UsersIcon } from './icons';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Derive up to 2-character uppercase initials from a display name. */
function getInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/);
  if (parts.length >= 2) {
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
  }
  return displayName.slice(0, 2).toUpperCase() || '?';
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

type MemberItemProps = {
  member: ServerMember;
  online: boolean;
};

function MemberItem({ member, online }: MemberItemProps) {
  const initials = getInitials(member.displayName);

  return (
    <li
      className="group flex items-center gap-3 p-1.5 rounded-md transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
      tabIndex={0}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLLIElement).style.backgroundColor = '#27272a';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLLIElement).style.backgroundColor = 'transparent';
      }}
    >
      {/* Avatar + presence dot */}
      <div className="relative shrink-0">
        {member.avatarUrl ? (
          <img
            src={member.avatarUrl}
            alt={member.displayName}
            className="w-8 h-8 rounded-full object-cover"
            style={{ opacity: online ? 1 : 0.7 }}
          />
        ) : (
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0"
            style={{
              backgroundColor: online ? '#27272a' : 'rgba(39,39,42,0.6)',
              color: online ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.40)',
            }}
            aria-label={member.displayName}
          >
            {initials}
          </div>
        )}
        {/* Presence dot */}
        <div
          className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full flex items-center justify-center pointer-events-none"
          style={{ backgroundColor: '#121214' }}
        >
          <span className="sr-only">{online ? 'Online' : 'Offline'}</span>
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: online ? '#10b981' : '#52525b' }}
          />
        </div>
      </div>

      {/* Name */}
      <span
        className="text-[14px] font-medium truncate transition-colors"
        style={{ color: online ? 'rgba(212,212,216,0.92)' : 'rgba(255,255,255,0.50)' }}
      >
        {member.displayName}
      </span>
    </li>
  );
}

// Loading skeleton
function MemberListSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading members">
      <div>
        <div
          className="h-[11px] w-20 rounded-md mb-3"
          style={{ backgroundColor: '#27272a' }}
        />
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 p-1.5">
              <div className="w-8 h-8 rounded-full shrink-0" style={{ backgroundColor: '#27272a' }} />
              <div className="h-4 w-24 rounded-md" style={{ backgroundColor: '#27272a' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Empty state
function MemberListEmpty() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-4" style={{ opacity: 0.7 }}>
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
        style={{ backgroundColor: '#1c1c1f', color: 'rgba(255,255,255,0.30)' }}
      >
        <UsersIcon size={20} />
      </div>
      <p className="text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.40)' }}>
        No one else here yet
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MemberListPanel
// ---------------------------------------------------------------------------

type Props = {
  serverId: string | null;
};

export function MemberListPanel({ serverId }: Props) {
  const [members, setMembers] = useState<ServerMember[]>([]);
  const [loadStatus, setLoadStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const mountedRef = useRef(true);

  const { getStatus, tick } = usePresence();

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Fetch members when server changes
  const fetchMembers = useCallback(
    (id: string) => {
      setLoadStatus('loading');
      api
        .getServerMembers(id)
        .then((list) => {
          if (!mountedRef.current) return;
          setMembers(list);
          setLoadStatus('loaded');
        })
        .catch(() => {
          if (!mountedRef.current) return;
          setLoadStatus('error');
        });
    },
    [],
  );

  useEffect(() => {
    if (!serverId) {
      setMembers([]);
      setLoadStatus('idle');
      return;
    }
    fetchMembers(serverId);
  }, [serverId, fetchMembers]);

  // Partition members into online / offline groups.
  // `tick` from usePresence increments on every presence event, causing React to
  // re-render this component so getStatus() reads fresh values from the store.
  const onlineMembers: ServerMember[] = [];
  const offlineMembers: ServerMember[] = [];
  for (const m of members) {
    if (getStatus(m.userId) === 'online') {
      onlineMembers.push(m);
    } else {
      offlineMembers.push(m);
    }
  }

  return (
    <aside
      aria-label="Members"
      data-testid="member-list-panel"
      data-presence-tick={tick}
      className="flex flex-col overflow-hidden"
      style={{
        width: 240,
        backgroundColor: '#121214',
        borderLeft: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}
    >
      <div className="flex-1 overflow-y-auto px-4 py-5 select-none">
        {/* Panel header */}
        <h2
          className="text-[11px] font-bold uppercase tracking-widest mb-5"
          style={{ color: 'rgba(255,255,255,0.40)' }}
        >
          Members
        </h2>

        {/* Loading skeleton */}
        {loadStatus === 'loading' && <MemberListSkeleton />}

        {/* Error */}
        {loadStatus === 'error' && (
          <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.30)' }}>
            Couldn&apos;t load members.
          </p>
        )}

        {/* Loaded */}
        {loadStatus === 'loaded' && (
          <>
            {members.length === 0 ? (
              <MemberListEmpty />
            ) : (
              <div className="space-y-6">
                {/* Online group */}
                {onlineMembers.length > 0 && (
                  <div>
                    <h3
                      id="member-group-online"
                      className="text-[11px] font-bold uppercase tracking-widest mb-3"
                      style={{ color: 'rgba(255,255,255,0.40)' }}
                    >
                      Online &mdash; {onlineMembers.length}
                    </h3>
                    <ul
                      className="space-y-0.5"
                      aria-labelledby="member-group-online"
                      style={{ listStyle: 'none', padding: 0, margin: 0 }}
                    >
                      {onlineMembers.map((m) => (
                        <MemberItem key={m.userId} member={m} online={true} />
                      ))}
                    </ul>
                  </div>
                )}

                {/* Offline group */}
                {offlineMembers.length > 0 && (
                  <div>
                    <h3
                      id="member-group-offline"
                      className="text-[11px] font-bold uppercase tracking-widest mb-3"
                      style={{ color: 'rgba(255,255,255,0.40)' }}
                    >
                      Offline &mdash; {offlineMembers.length}
                    </h3>
                    <ul
                      className="space-y-0.5"
                      aria-labelledby="member-group-offline"
                      style={{ listStyle: 'none', padding: 0, margin: 0 }}
                    >
                      {offlineMembers.map((m) => (
                        <MemberItem key={m.userId} member={m} online={false} />
                      ))}
                    </ul>
                  </div>
                )}

                {/* No one online yet — show all in offline group */}
                {onlineMembers.length === 0 && offlineMembers.length === 0 && (
                  <MemberListEmpty />
                )}
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
