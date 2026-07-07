/**
 * ChannelSidebar — 260px channel list panel.
 *
 * Design system §8 spec (ChannelSidebar item):
 *   #/voice glyph + name, 14px, secondary text → primary on hover/active.
 *   Active = surface-700 fill + emerald text.
 *   Category headers: 11px uppercase muted, collapsible (UI only — state not persisted).
 *   A11y: nav list, active = aria-current.
 *
 * Wired to ServerContext: renders the selected server's categories and channels.
 * States: no-server / loading / loaded / error.
 * Bottom user panel always visible.
 */

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../auth/api';
import { InviteShareModal } from './InviteShareModal';
import { useProfile } from './ProfileContext';
import { ReportInbox } from './ReportInbox';
import { useServers } from './ServerContext';
import { ServerOverviewSettings } from './ServerOverviewSettings';
import { ServerRolesPage } from './ServerRolesPage';
import { UserMenu } from './UserMenu';
import {
  CalendarIcon,
  CaretDownIcon,
  ClipboardTextIcon,
  FlagIcon,
  GearIcon,
  HashIcon,
  MicrophoneIcon,
  ShieldCheckIcon,
  SpeakerHighIcon,
  SpinnerIcon,
  UserAddIcon,
} from './icons';
import { useConnectionState } from './useConnectionState';
import { useMentionBadge } from './useMentionBadge';

/** Derive 2-character initials from a display name or username. */
function getInitials(displayName: string | null, username: string | null): string {
  const name = displayName ?? username ?? '';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    const a = parts[0]?.[0] ?? '';
    const b = parts[1]?.[0] ?? '';
    return (a + b).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || '?';
}

type ChannelItemProps = {
  icon: React.ReactNode;
  name: string;
  active?: boolean;
  /** Unread @mention count — renders an emerald pill badge when > 0. */
  mentionCount?: number;
  onClick?: () => void;
};

function ChannelItem({ icon, name, active = false, mentionCount = 0, onClick }: ChannelItemProps) {
  const hasUnreadMentions = mentionCount > 0 && !active;

  return (
    <button
      type="button"
      aria-current={active ? 'page' : undefined}
      aria-label={
        hasUnreadMentions
          ? `${name} channel, ${mentionCount} unread mention${mentionCount !== 1 ? 's' : ''}`
          : undefined
      }
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded px-2 py-1.5 cursor-pointer select-none transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2"
      style={{
        backgroundColor: active ? '#27272a' : 'transparent',
        color: active
          ? '#10b981'
          : hasUnreadMentions
            ? 'rgba(255,255,255,0.92)'
            : 'rgba(255,255,255,0.60)',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1c1c1f';
          (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.92)';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
          (e.currentTarget as HTMLButtonElement).style.color = hasUnreadMentions
            ? 'rgba(255,255,255,0.92)'
            : 'rgba(255,255,255,0.60)';
        }
      }}
    >
      <span className="shrink-0" style={{ color: active ? '#10b981' : 'rgba(255,255,255,0.40)' }}>
        {icon}
      </span>
      <span
        className="text-[14px] truncate"
        style={{
          fontWeight: active || hasUnreadMentions ? 500 : 400,
        }}
      >
        {name}
      </span>

      {/* Unread mention badge — emerald rounded-full chip, design §3 */}
      {hasUnreadMentions && (
        <span
          className="ml-auto inline-flex items-center justify-center rounded-full text-[11px] font-bold shrink-0"
          style={{
            minWidth: 18,
            height: 18,
            paddingLeft: 4,
            paddingRight: 4,
            backgroundColor: '#10b981',
            color: '#0a0a0b',
            boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.10)',
          }}
          aria-hidden="true"
        >
          {mentionCount > 99 ? '99+' : mentionCount}
        </span>
      )}
    </button>
  );
}

type CategoryProps = {
  name: string;
  children: React.ReactNode;
};

function Category({ name, children }: CategoryProps) {
  return (
    <div>
      <button
        type="button"
        className="flex w-full items-center gap-1 px-1 mb-1 cursor-pointer focus-visible:outline-none group transition-colors duration-150"
        style={{ color: 'rgba(255,255,255,0.40)' }}
        aria-expanded="true"
      >
        <CaretDownIcon size={10} className="group-hover:text-white/60 transition-colors" />
        <span className="text-[11px] font-semibold uppercase tracking-widest group-hover:text-white/60 transition-colors">
          {name}
        </span>
      </button>
      <ul className="space-y-[2px]" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {children}
      </ul>
    </div>
  );
}

function ChannelIcon({ type }: { type: string }) {
  if (type === 'voice') return <SpeakerHighIcon size={16} />;
  return <HashIcon size={16} />;
}

export function ChannelSidebar() {
  const { profile } = useProfile();
  const {
    selectedId,
    selectedDetail,
    detailStatus,
    servers,
    selectedChannelId,
    selectChannel,
    assignmentsOpen,
    openAssignments,
    scheduleOpen,
    openSchedule,
    refetchDetail,
  } = useServers();
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [rolesPageOpen, setRolesPageOpen] = useState(false);
  const [overviewPageOpen, setOverviewPageOpen] = useState(false);
  const [reportInboxOpen, setReportInboxOpen] = useState(false);
  const [canModerateMembers, setCanModerateMembers] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const inviteBtnRef = useRef<HTMLButtonElement>(null);
  const settingsBtnRef = useRef<HTMLButtonElement>(null);

  // Fetch permissions when server changes — gate the report inbox button
  useEffect(() => {
    setCanModerateMembers(false);
    if (!selectedId) return;
    api
      .getMyPermissions(selectedId)
      .then((perms) => setCanModerateMembers(perms.owner || perms.moderate_members))
      .catch(() => {});
  }, [selectedId]);

  const connectionState = useConnectionState();

  // Unread mention badge counts — driven by realtime socket + bootstrap fetch
  const { getCount, markChannelRead } = useMentionBadge(
    profile?.username ?? null,
    selectedChannelId,
  );

  const accentColor = profile?.accentColor ?? '#10b981';
  const avatarUrl = profile?.avatarUrl ?? null;
  const initials = getInitials(profile?.displayName ?? null, profile?.username ?? null);
  const displayLabel = profile?.displayName ?? profile?.username ?? 'You';

  const selectedServer = servers.find((s) => s.id === selectedId);
  const serverName = selectedDetail?.server.name ?? selectedServer?.name ?? null;

  return (
    <aside
      aria-label="Channel sidebar"
      data-testid="channel-sidebar"
      className="flex w-[260px] shrink-0 flex-col"
      style={{
        backgroundColor: '#121214',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Server header */}
      <header
        className="flex h-14 shrink-0 items-center justify-between px-4 cursor-pointer select-none transition-colors duration-150"
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.03)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
        }}
      >
        <h1
          className="truncate pr-2 text-[15px] font-semibold tracking-tight"
          style={{ color: 'rgba(255,255,255,0.92)' }}
        >
          {serverName ?? 'StudyHall'}
        </h1>
        <div className="flex shrink-0 items-center gap-1">
          {/* Invite people button — only shown when a server is selected */}
          {selectedId && (
            <button
              ref={inviteBtnRef}
              type="button"
              aria-label="Invite people"
              data-testid="invite-people-btn"
              onClick={(e) => {
                e.stopPropagation();
                setInviteModalOpen(true);
              }}
              className="flex h-7 w-7 items-center justify-center rounded transition-colors duration-150 focus-visible:outline-none"
              style={{ color: 'rgba(255,255,255,0.40)', backgroundColor: 'transparent' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#27272a';
                (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.92)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.40)';
              }}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(16,185,129,0.4)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <UserAddIcon size={15} />
            </button>
          )}
          {/* Server overview settings button */}
          {selectedId && (
            <button
              type="button"
              aria-label="Server settings — Overview"
              data-testid="server-settings-btn"
              onClick={(e) => {
                e.stopPropagation();
                setOverviewPageOpen(true);
              }}
              className="flex h-7 w-7 items-center justify-center rounded transition-colors duration-150 focus-visible:outline-none"
              style={{ color: 'rgba(255,255,255,0.40)', backgroundColor: 'transparent' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#27272a';
                (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.92)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.40)';
              }}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(16,185,129,0.4)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <GearIcon size={15} />
            </button>
          )}
          {/* Server roles button */}
          {selectedId && (
            <button
              type="button"
              aria-label="Server settings — Roles"
              data-testid="server-roles-btn"
              onClick={(e) => {
                e.stopPropagation();
                setRolesPageOpen(true);
              }}
              className="flex h-7 w-7 items-center justify-center rounded transition-colors duration-150 focus-visible:outline-none"
              style={{ color: 'rgba(255,255,255,0.40)', backgroundColor: 'transparent' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#27272a';
                (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.92)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.40)';
              }}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(16,185,129,0.4)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <ShieldCheckIcon size={15} />
            </button>
          )}
          {/* Reports inbox button — only for moderators/owners */}
          {selectedId && canModerateMembers && (
            <button
              type="button"
              aria-label="Reports inbox"
              data-testid="report-inbox-btn"
              onClick={(e) => {
                e.stopPropagation();
                setReportInboxOpen(true);
              }}
              className="flex h-7 w-7 items-center justify-center rounded transition-colors duration-150 focus-visible:outline-none"
              style={{ color: 'rgba(255,255,255,0.40)', backgroundColor: 'transparent' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#27272a';
                (e.currentTarget as HTMLButtonElement).style.color = '#f87171';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.40)';
              }}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(16,185,129,0.4)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <FlagIcon size={15} />
            </button>
          )}
          {serverName && (
            <span style={{ color: 'rgba(255,255,255,0.40)' }}>
              <CaretDownIcon size={14} />
            </span>
          )}
        </div>
      </header>

      {/* Invite share modal */}
      {inviteModalOpen && selectedId && (
        <InviteShareModal
          serverId={selectedId}
          inviteCode={selectedDetail?.server.inviteCode ?? null}
          onClose={() => setInviteModalOpen(false)}
          triggerRef={inviteBtnRef}
        />
      )}

      {/* Server Overview settings page — full-screen overlay */}
      {overviewPageOpen && selectedId && selectedDetail && (
        <ServerOverviewSettings
          serverId={selectedId}
          serverName={selectedDetail.server.name}
          ownerId={selectedDetail.server.ownerId}
          initialIsPublic={selectedDetail.server.is_public}
          initialDescription={selectedDetail.server.description}
          initialTopic={selectedDetail.server.topic}
          onClose={() => setOverviewPageOpen(false)}
          onGoToRoles={() => {
            setOverviewPageOpen(false);
            setRolesPageOpen(true);
          }}
          onSaveSuccess={refetchDetail}
        />
      )}

      {/* Server Roles page — full-screen overlay */}
      {rolesPageOpen && selectedId && selectedDetail && (
        <ServerRolesPage
          serverId={selectedId}
          serverName={selectedDetail.server.name}
          ownerId={selectedDetail.server.ownerId}
          channels={selectedDetail.categories.flatMap((cat) => cat.channels)}
          onClose={() => setRolesPageOpen(false)}
        />
      )}

      {/* Reports inbox — full-screen overlay; moderator/owner gated.
          Rendered via createPortal so the fixed overlay escapes the sidebar's
          transform:translateX(-260px) containing block on mobile. */}
      {reportInboxOpen &&
        selectedId &&
        canModerateMembers &&
        createPortal(
          <div
            data-testid="report-inbox-overlay"
            className="fixed inset-0 z-40 flex flex-col"
            style={{ backgroundColor: '#1c1c1f' }}
          >
            {/* Close bar */}
            <div
              className="h-14 shrink-0 flex items-center justify-between px-6"
              style={{
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                backgroundColor: '#121214',
              }}
            >
              <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.92)' }}>
                {selectedDetail?.server.name ?? 'Server'} — Reports
              </span>
              <button
                type="button"
                aria-label="Close reports inbox"
                onClick={() => setReportInboxOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-md transition-colors focus-visible:outline-none"
                style={{ color: 'rgba(255,255,255,0.40)', backgroundColor: 'transparent' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#27272a';
                  (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.92)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                  (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.40)';
                }}
              >
                {/* X icon inline */}
                <svg
                  width={16}
                  height={16}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <ReportInbox serverId={selectedId} canModerateMembers={canModerateMembers} />
          </div>,
          document.body,
        )}

      {/* Scrollable channel list */}
      <div className="flex-1 overflow-y-auto px-2 py-4">
        {/* No server selected */}
        {!selectedId && (
          <div className="flex flex-col items-center justify-center h-full px-4 text-center py-8">
            <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.40)' }}>
              Select a server from the rail to view its channels.
            </p>
          </div>
        )}

        {/* Loading detail */}
        {selectedId && detailStatus === 'loading' && (
          <div
            className="flex items-center justify-center py-8"
            style={{ color: 'rgba(255,255,255,0.30)' }}
          >
            <SpinnerIcon size={20} className="animate-spin" />
          </div>
        )}

        {/* Error fetching detail */}
        {selectedId && detailStatus === 'error' && (
          <div className="px-2 py-6 text-center">
            <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.40)' }}>
              {connectionState === 'offline' || connectionState === 'reconnecting'
                ? "This server isn't available offline yet — reconnect to load its channels."
                : "Couldn't load channels."}
            </p>
          </div>
        )}

        {/* Loaded — workspace + categories + channels */}
        {selectedId && detailStatus === 'loaded' && selectedDetail && (
          <div className="space-y-5">
            {/* Workspace section — Assignments entry */}
            <div>
              <button
                type="button"
                className="flex w-full items-center gap-1 px-1 mb-1 cursor-pointer focus-visible:outline-none group transition-colors duration-150"
                style={{ color: 'rgba(255,255,255,0.40)' }}
                aria-expanded="true"
              >
                <CaretDownIcon size={10} className="group-hover:text-white/60 transition-colors" />
                <span className="text-[11px] font-semibold uppercase tracking-widest group-hover:text-white/60 transition-colors">
                  Workspace
                </span>
              </button>
              <ul className="space-y-[2px]" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li>
                  <ChannelItem
                    icon={<ClipboardTextIcon size={16} />}
                    name="Assignments"
                    active={assignmentsOpen}
                    onClick={openAssignments}
                  />
                </li>
                <li>
                  <ChannelItem
                    icon={<CalendarIcon size={16} />}
                    name="Schedule"
                    active={scheduleOpen}
                    onClick={openSchedule}
                  />
                </li>
              </ul>
            </div>

            {selectedDetail.categories.length === 0 && (
              <p
                className="text-center text-[13px] py-4"
                style={{ color: 'rgba(255,255,255,0.40)' }}
              >
                No channels yet.
              </p>
            )}
            {selectedDetail.categories.map((cat) => (
              <Category key={cat.id} name={cat.name}>
                {cat.channels.map((ch) => (
                  <li key={ch.id}>
                    <ChannelItem
                      icon={<ChannelIcon type={ch.type} />}
                      name={ch.name}
                      active={ch.id === selectedChannelId}
                      mentionCount={getCount(ch.id)}
                      onClick={() => {
                        selectChannel(ch.id, ch.name);
                        markChannelRead(ch.id);
                      }}
                    />
                  </li>
                ))}
              </Category>
            ))}
          </div>
        )}
      </div>

      {/* Current user panel (bottom) */}
      <div
        className="relative flex h-[60px] shrink-0 items-center px-2"
        style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          backgroundColor: 'rgba(10,10,11,0.80)',
        }}
      >
        {/* User menu popover — renders above the footer when open */}
        {menuOpen && <UserMenu anchorRef={settingsBtnRef} onClose={() => setMenuOpen(false)} />}

        <button
          ref={settingsBtnRef}
          type="button"
          aria-label="Your profile and settings"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className="flex w-full items-center gap-2 rounded-md p-1.5 cursor-pointer transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 group"
          onClick={() => setMenuOpen((prev) => !prev)}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1c1c1f';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
          }}
        >
          {/* Avatar with presence dot */}
          <div className="relative shrink-0" aria-hidden="true">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-semibold overflow-hidden"
              style={{ backgroundColor: '#27272a', color: accentColor }}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <span
              aria-hidden="true"
              className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
              style={{
                backgroundColor: accentColor,
                border: '2px solid #0a0a0b',
              }}
            />
          </div>

          {/* Name */}
          <div className="flex min-w-0 flex-col">
            <span
              className="truncate text-[13px] font-medium"
              style={{ color: 'rgba(255,255,255,0.92)' }}
            >
              {displayLabel}
            </span>
            {profile?.username && (
              <span className="truncate text-[11px]" style={{ color: 'rgba(255,255,255,0.40)' }}>
                @{profile.username}
              </span>
            )}
          </div>

          {/* Action icons (appear on hover) */}
          <div className="ml-auto flex shrink-0 gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            <span
              aria-hidden="true"
              className="flex h-7 w-7 items-center justify-center rounded transition-colors duration-150"
              style={{ color: 'rgba(255,255,255,0.40)' }}
            >
              <MicrophoneIcon size={14} />
            </span>
            <span
              aria-hidden="true"
              className="flex h-7 w-7 items-center justify-center rounded transition-colors duration-150"
              style={{ color: 'rgba(255,255,255,0.40)' }}
            >
              <GearIcon size={14} />
            </span>
          </div>
        </button>
      </div>
    </aside>
  );
}
