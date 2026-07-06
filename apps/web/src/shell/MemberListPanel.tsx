/**
 * MemberListPanel — right sidebar showing server members grouped by presence.
 *
 * Design: design/server-channel-view.html (D-3 ADOPTED) § PANE 4: RIGHT SIDEBAR.
 *         design/member-moderation.html (D-3 ADOPTED wave-41) — moderation controls.
 *
 * Layout: 240px fixed, bg-study-900, hidden ≤1024px (design §9 responsive).
 *   - "MEMBERS" header (11px, uppercase, bold, text-zinc-500).
 *   - "Online — N" group header, followed by <ul> of online members.
 *   - "Offline — N" group header, followed by <ul> of offline members.
 *   - Each <li>: avatar (32px) + presence dot + name (14px).
 *   - Amber muted indicator (ph-fill ph-speaker-x + sr-only "Timed out") visible
 *     to ALL viewers when mutedUntil is in the future.
 *   - Moderation kebab (ph-dots-three) on hover — visible ONLY to viewers with
 *     moderate_members — triggers a role=menu popover.
 *   - Popover: "Time out member" → duration sub-menu (5m / 1h / 1day) or
 *     "Remove timeout" (when already muted). Rank-guard 403 shows inline error.
 *   - prefers-reduced-motion guard on popover animations.
 *   - Keyboard nav: ArrowUp/Down/Home/End within menu, Esc close+refocus.
 *   - Outside-click close.
 *
 * Data sources:
 *   - Member roster: GET /servers/:id/members (api.getServerMembers).
 *     Now includes mutedUntil: string|null (wave-41 M8 plumbing).
 *   - Presence status: usePresence() hook (presenceSocket.ts store).
 *   - Permissions: canModerateMembers prop from caller (derived from
 *     api.getMyPermissions → effective_permissions.moderate_members).
 *
 * A11y (D-3 4 must-fix, wave-41):
 *   (1) aria-label="Member moderation" on role=menu.
 *   (2) ArrowUp/Down/Home/End keyboard nav + Esc close+refocus + outside-click close.
 *   (3) prefers-reduced-motion guard on popover animations.
 *   (4) Unique keys for injected elements.
 */

import type { ServerMember } from '@studyhall/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../auth/api';
import { PresenceDot } from './PresenceDot';
import { ReportDialog } from './ReportDialog';
import {
  ArrowLeftIcon,
  DotsThreeIcon,
  FlagIcon,
  SpeakerHighIcon2,
  SpeakerXFillIcon,
  SpinnerIcon,
  UsersIcon,
  WarningCircleIcon,
} from './icons';
import { usePresence } from './usePresence';

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

/** True if mutedUntil is a future ISO timestamp. */
function isMuted(mutedUntil: string | null): boolean {
  if (!mutedUntil) return false;
  return new Date(mutedUntil) > new Date();
}

const DURATION_OPTIONS: { label: string; minutes: number }[] = [
  { label: '5 minutes', minutes: 5 },
  { label: '1 hour', minutes: 60 },
  { label: '1 day', minutes: 1440 },
];

// ---------------------------------------------------------------------------
// MutedIndicator — amber speaker-x, visible to ALL viewers
// ---------------------------------------------------------------------------

function MutedIndicator() {
  return (
    <span
      className="flex items-center justify-center"
      style={{ color: '#f59e0b' }}
      title="Timed out"
    >
      <span className="sr-only">Timed out</span>
      <SpeakerXFillIcon size={14} />
    </span>
  );
}

// ---------------------------------------------------------------------------
// ModerationPopover — role=menu, three views: main / duration / error
// ---------------------------------------------------------------------------

type PopoverView = 'main' | 'duration' | 'error';

type ModerationPopoverProps = {
  memberId: string;
  /** True when the member is currently timed out (future mutedUntil). */
  isMuted: boolean;
  serverId: string;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  anchorRect: DOMRect | null;
  onClose: () => void;
  onMutedChange: (userId: string, mutedUntil: string | null) => void;
};

function ModerationPopover({
  memberId,
  isMuted: memberIsMuted,
  serverId,
  triggerRef,
  anchorRect,
  onClose,
  onMutedChange,
}: ModerationPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<PopoverView>('main');
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // a11y (3): prefers-reduced-motion
  const motionOk =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  // Close on outside click or Escape; refocus trigger on close
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
        triggerRef.current?.focus();
      }
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose, triggerRef]);

  // a11y (2): Arrow key nav within menu
  function handleMenuKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
    const items = Array.from(
      popoverRef.current?.querySelectorAll<HTMLElement>(
        '[role="menuitem"]:not([disabled]):not([aria-disabled="true"])',
      ) ?? [],
    ).filter((el) => !el.closest('[aria-hidden="true"]') && el.offsetParent !== null);
    if (items.length === 0) return;
    e.preventDefault();
    const cur = items.indexOf(document.activeElement as HTMLElement);
    let next = cur;
    if (e.key === 'ArrowDown') next = (cur + 1) % items.length;
    else if (e.key === 'ArrowUp') next = cur <= 0 ? items.length - 1 : cur - 1;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = items.length - 1;
    items[next]?.focus();
  }

  // Compute popover position relative to the trigger
  const popStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 100,
    width: 180,
    top: anchorRect ? anchorRect.bottom + 4 : 0,
    left: anchorRect ? anchorRect.right - 180 : 0,
  };

  async function handleTimeout(minutes: number) {
    setBusy(true);
    try {
      const result = await api.timeoutMember(serverId, memberId, minutes);
      onMutedChange(memberId, result.mutedUntil);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed';
      if (msg.includes('403')) {
        setErrorMsg('Role ranks higher than yours.');
        setView('error');
      } else {
        setErrorMsg(msg);
        setView('error');
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleRemoveTimeout() {
    setBusy(true);
    try {
      await api.removeTimeout(serverId, memberId);
      onMutedChange(memberId, null);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed';
      if (msg.includes('403')) {
        setErrorMsg('Role ranks higher than yours.');
        setView('error');
      } else {
        setErrorMsg(msg);
        setView('error');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      ref={popoverRef}
      role="menu"
      aria-label="Member moderation"
      aria-orientation="vertical"
      data-testid={`mod-popover-${memberId}`}
      style={{
        ...popStyle,
        backgroundColor: '#27272a',
        border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: 6,
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        overflow: 'hidden',
        ...(motionOk ? { animation: 'popoverIn 150ms cubic-bezier(0.16,1,0.3,1) forwards' } : {}),
      }}
      onKeyDown={handleMenuKeyDown}
      tabIndex={-1}
    >
      {/* VIEW: Main menu */}
      {view === 'main' && (
        <div className="flex flex-col p-1">
          {!memberIsMuted && (
            <button
              type="button"
              role="menuitem"
              data-testid={`mod-timeout-btn-${memberId}`}
              onClick={() => setView('duration')}
              className="flex w-full items-center justify-between rounded px-2 py-1.5 text-[13px] text-left transition-colors focus:outline-none"
              style={{ color: '#f87171' }}
              onFocus={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  'rgba(239,68,68,0.10)';
              }}
              onBlur={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '';
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  'rgba(239,68,68,0.10)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '';
              }}
            >
              <span className="flex items-center gap-2 font-medium">
                <SpeakerXFillIcon size={14} />
                Time out member
              </span>
              <ArrowLeftIcon size={11} style={{ transform: 'rotate(180deg)', opacity: 0.5 }} />
            </button>
          )}
          {memberIsMuted && (
            <button
              type="button"
              role="menuitem"
              data-testid={`mod-remove-timeout-btn-${memberId}`}
              onClick={handleRemoveTimeout}
              disabled={busy}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-[13px] text-left font-medium transition-colors focus:outline-none disabled:opacity-50"
              style={{ color: 'rgba(255,255,255,0.92)' }}
              onFocus={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#3f3f46';
              }}
              onBlur={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '';
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#3f3f46';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '';
              }}
            >
              {busy ? (
                <SpinnerIcon size={13} className="animate-spin" />
              ) : (
                <SpeakerHighIcon2 size={14} style={{ color: 'rgba(255,255,255,0.60)' }} />
              )}
              {busy ? 'Lifting…' : 'Remove timeout'}
            </button>
          )}
        </div>
      )}

      {/* VIEW: Duration selector */}
      {view === 'duration' && (
        <div className="flex flex-col">
          {/* Header with back button */}
          <div
            className="flex items-center gap-2 px-1 py-1"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <button
              type="button"
              aria-label="Back"
              onClick={() => setView('main')}
              className="flex h-6 w-6 items-center justify-center rounded transition-colors focus:outline-none"
              style={{ color: 'rgba(255,255,255,0.60)' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#3f3f46';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '';
              }}
            >
              <ArrowLeftIcon size={13} />
            </button>
            <span
              className="text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: 'rgba(255,255,255,0.40)' }}
            >
              Duration
            </span>
          </div>
          <div className="flex flex-col p-1">
            {DURATION_OPTIONS.map(({ label, minutes }) => (
              <button
                key={`dur-${minutes}`}
                type="button"
                role="menuitem"
                data-testid={`mod-dur-${minutes}-${memberId}`}
                disabled={busy}
                onClick={() => handleTimeout(minutes)}
                className="flex w-full items-center justify-between rounded px-2 py-1.5 text-[13px] text-left transition-colors focus:outline-none disabled:opacity-50"
                style={{ color: 'rgba(255,255,255,0.92)' }}
                onFocus={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#3f3f46';
                }}
                onBlur={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '';
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#3f3f46';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '';
                }}
              >
                <span>{label}</span>
                {busy && <SpinnerIcon size={12} className="animate-spin" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: Error — rank guard or generic API error */}
      {view === 'error' && (
        <div className="flex flex-col items-center justify-center p-3 text-center">
          <div
            className="mb-2 flex h-8 w-8 items-center justify-center rounded-full"
            style={{ backgroundColor: 'rgba(239,68,68,0.10)' }}
          >
            <WarningCircleIcon size={16} style={{ color: '#ef4444' }} />
          </div>
          <p className="mb-0.5 text-[12px] font-medium" style={{ color: 'rgba(255,255,255,0.92)' }}>
            Cannot modify
          </p>
          <p className="text-[11px]" style={{ color: '#f87171' }}>
            {errorMsg ?? 'Role ranks higher than yours.'}
          </p>
          <button
            type="button"
            role="menuitem"
            onClick={onClose}
            className="mt-3 rounded px-3 py-1 text-[11px] font-semibold transition-colors focus:outline-none"
            style={{ backgroundColor: 'rgba(63,63,70,0.50)', color: 'rgba(255,255,255,0.60)' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#3f3f46';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(63,63,70,0.50)';
            }}
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// MemberItem — one row in the roster
// ---------------------------------------------------------------------------

type MemberItemProps = {
  member: ServerMember;
  online: boolean;
  canModerate: boolean;
  serverId: string;
  onMutedChange: (userId: string, mutedUntil: string | null) => void;
  onReport: (userId: string, displayName: string) => void;
};

function MemberItem({
  member,
  online,
  canModerate,
  serverId,
  onMutedChange,
  onReport,
}: MemberItemProps) {
  const initials = getInitials(member.displayName);
  const memberIsMuted = isMuted(member.mutedUntil);
  const [menuOpen, setMenuOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const kebabRef = useRef<HTMLButtonElement>(null);

  function handleKebabClick() {
    if (menuOpen) {
      setMenuOpen(false);
      return;
    }
    setAnchorRect(kebabRef.current?.getBoundingClientRect() ?? null);
    setMenuOpen(true);
  }

  function handleClose() {
    setMenuOpen(false);
    kebabRef.current?.focus();
  }

  return (
    <li
      className="group flex items-center gap-3 p-1.5 rounded-md transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
      data-testid={`member-row-${member.userId}`}
      data-menu-open={menuOpen ? 'true' : 'false'}
      style={memberIsMuted ? { opacity: 0.85 } : undefined}
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
            style={{
              opacity: online ? (memberIsMuted ? 0.6 : 1) : 0.7,
              filter: memberIsMuted ? 'grayscale(40%)' : undefined,
            }}
          />
        ) : (
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0"
            style={{
              backgroundColor: online ? '#27272a' : 'rgba(39,39,42,0.6)',
              color: online ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.40)',
              opacity: memberIsMuted ? 0.6 : 1,
            }}
            aria-label={member.displayName}
          >
            {initials}
          </div>
        )}
        {/* Presence dot */}
        <PresenceDot online={online} />
      </div>

      {/* Name — muted tint when timed out */}
      <span
        className="text-[14px] font-medium truncate transition-colors flex-1 min-w-0"
        style={{
          color: memberIsMuted
            ? 'rgba(255,255,255,0.40)'
            : online
              ? 'rgba(212,212,216,0.92)'
              : 'rgba(255,255,255,0.50)',
        }}
        data-testid={`member-name-${member.userId}`}
      >
        {member.displayName}
      </span>

      {/* Right slot: muted indicator + report flag + kebab */}
      <div className="flex items-center gap-1 shrink-0 pl-1 pr-2">
        {/* Amber muted indicator — visible to ALL when timed out (wave-41 design) */}
        {memberIsMuted && (
          <span data-testid={`muted-indicator-${member.userId}`}>
            <MutedIndicator />
          </span>
        )}

        {/* Report member flag — visible on row hover/focus to all members */}
        <button
          type="button"
          aria-label={`Report ${member.displayName}`}
          data-testid={`report-member-btn-${member.userId}`}
          onClick={() => onReport(member.userId, member.displayName)}
          className="flex h-6 w-6 items-center justify-center rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
          style={{ color: 'rgba(255,255,255,0.40)' }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(239,68,68,0.10)';
            (e.currentTarget as HTMLButtonElement).style.color = '#f87171';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '';
            (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.40)';
          }}
        >
          <FlagIcon size={12} />
        </button>

        {/* Moderation kebab — only for viewers with moderate_members */}
        {canModerate && (
          <button
            ref={kebabRef}
            type="button"
            aria-label={`Moderate ${member.displayName}`}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            data-testid={`mod-kebab-${member.userId}`}
            onClick={handleKebabClick}
            className="flex h-6 w-6 items-center justify-center rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
            style={{ color: 'rgba(255,255,255,0.40)' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#3f3f46';
              (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.92)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '';
              (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.40)';
            }}
          >
            <DotsThreeIcon size={14} />
          </button>
        )}
      </div>

      {/* Moderation popover — rendered in place (fixed via style) */}
      {menuOpen && canModerate && (
        <ModerationPopover
          memberId={member.userId}
          isMuted={memberIsMuted}
          serverId={serverId}
          triggerRef={kebabRef}
          anchorRect={anchorRect}
          onClose={handleClose}
          onMutedChange={onMutedChange}
        />
      )}
    </li>
  );
}

// Loading skeleton
function MemberListSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading members">
      <div>
        <div className="h-[11px] w-20 rounded-md mb-3" style={{ backgroundColor: '#27272a' }} />
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 p-1.5">
              <div
                className="w-8 h-8 rounded-full shrink-0"
                style={{ backgroundColor: '#27272a' }}
              />
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
    <div
      className="flex flex-col items-center justify-center text-center py-4"
      style={{ opacity: 0.7 }}
    >
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
  /**
   * When provided by a parent that already has the permissions object, the
   * panel skips its own fetch. When absent the panel calls getMyPermissions
   * itself (same pattern as AssignmentsPanel).
   */
  canModerateMembers?: boolean;
};

export function MemberListPanel({ serverId, canModerateMembers: canModerateFromProp }: Props) {
  const [members, setMembers] = useState<ServerMember[]>([]);
  const [loadStatus, setLoadStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const mountedRef = useRef(true);

  // Permission state — fetched per-server when prop not supplied
  const [canModerateLocal, setCanModerateLocal] = useState(false);
  const canModerateMembers =
    canModerateFromProp !== undefined ? canModerateFromProp : canModerateLocal;

  const { getStatus, tick } = usePresence();

  // Report dialog state
  const [reportTarget, setReportTarget] = useState<{ userId: string; displayName: string } | null>(
    null,
  );
  const handleReportMember = useCallback((userId: string, displayName: string) => {
    setReportTarget({ userId, displayName });
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Fetch members when server changes
  const fetchMembers = useCallback((id: string) => {
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
  }, []);

  // Fetch permissions when server changes and prop not provided
  useEffect(() => {
    if (!serverId || canModerateFromProp !== undefined) return;
    setCanModerateLocal(false);
    api
      .getMyPermissions(serverId)
      .then((perms) => {
        if (!mountedRef.current) return;
        setCanModerateLocal(perms.owner || perms.moderate_members);
      })
      .catch(() => {
        // Silently degrade — show no moderation controls rather than error
      });
  }, [serverId, canModerateFromProp]);

  useEffect(() => {
    if (!serverId) {
      setMembers([]);
      setLoadStatus('idle');
      return;
    }
    fetchMembers(serverId);
  }, [serverId, fetchMembers]);

  /**
   * Optimistic mute state update — applied immediately after a successful
   * API call; the next server poll will confirm the real state.
   */
  const handleMutedChange = useCallback((userId: string, mutedUntil: string | null) => {
    setMembers((prev) => prev.map((m) => (m.userId === userId ? { ...m, mutedUntil } : m)));
  }, []);

  // Partition members into online / offline groups.
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
      {/* a11y (3): prefers-reduced-motion keyframes injected inline once */}
      <style>{`
        @keyframes popoverIn {
          from { opacity: 0; transform: scale(0.96) translateY(-4px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes popoverIn { from {} to {} }
        }
      `}</style>

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
        {loadStatus === 'loaded' &&
          (members.length === 0 ? (
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
                      <MemberItem
                        key={m.userId}
                        member={m}
                        online={true}
                        canModerate={canModerateMembers}
                        serverId={serverId ?? ''}
                        onMutedChange={handleMutedChange}
                        onReport={handleReportMember}
                      />
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
                      <MemberItem
                        key={m.userId}
                        member={m}
                        online={false}
                        canModerate={canModerateMembers}
                        serverId={serverId ?? ''}
                        onMutedChange={handleMutedChange}
                        onReport={handleReportMember}
                      />
                    ))}
                  </ul>
                </div>
              )}

              {/* No one online yet — show all in offline group */}
              {onlineMembers.length === 0 && offlineMembers.length === 0 && <MemberListEmpty />}
            </div>
          ))}
      </div>

      {/* Report member dialog */}
      {reportTarget && (
        <ReportDialog
          targetType="member"
          targetId={reportTarget.userId}
          {...(serverId ? { serverId } : {})}
          displayLabel={reportTarget.displayName}
          onClose={() => setReportTarget(null)}
        />
      )}
    </aside>
  );
}
