/**
 * NotificationsPanel — notification center popover/bottom-sheet (wave-37 M7).
 *
 * Layout:
 *   Desktop ≥1024px: fixed popover anchored top-right below the header.
 *   Mobile  <1024px: fixed bottom-sheet (80dvh, rounded-top-xl, slide-up).
 *
 * Accessibility:
 *   role="dialog" aria-modal="true" aria-label="Notifications"
 *   Focus trap: Tab/Shift+Tab cycle within the panel.
 *   Escape: closes panel and returns focus to the bell button.
 *   Mark-all-read: aria-busy while pending.
 *   Scrim (mobile): aria-hidden; click closes the panel.
 *
 * States: loading (skeleton ×3), error (icon+message+retry), empty (icon+CTA),
 *         loaded (notification list + optional load-more).
 *
 * Rows:
 *   type=mention            → ph-at icon; clicks navigate to channel.
 *   type=assignment_reminder → calendar-check icon; clicks open assignments.
 *   Unread: emerald dot + brighter background.
 *   Read:   transparent dot + default background + reduced opacity.
 *   Each row is a real <button> (NOT div+tabindex).
 *
 * Design contract: design/notifications-center.html (D-3 adopted).
 */

import type { Notification } from '@studyhall/shared';
import { useEffect, useRef } from 'react';
import { AtIcon, BellZIcon, CalendarCheckIcon, ClockIcon, WarningCircleIcon } from './icons';
import type { UseNotificationsResult } from './useNotifications';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NotificationsPanelProps = Pick<
  UseNotificationsResult,
  | 'items'
  | 'unreadCount'
  | 'nextCursor'
  | 'loadStatus'
  | 'markAllStatus'
  | 'markRead'
  | 'markAllRead'
  | 'loadMore'
  | 'reload'
> & {
  /** Called when the panel should close (Escape / click-outside / row navigation). */
  onClose: () => void;
  /** Callback to navigate to a channel (mention rows). */
  onNavigateToChannel: (serverId: string, channelId: string, channelName: string) => void;
  /** Callback to open the assignments panel (reminder rows). */
  onOpenAssignments: () => void;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format an ISO timestamp as a short relative string. */
function formatRelative(isoString: string): string {
  try {
    const now = Date.now();
    const ts = new Date(isoString).getTime();
    const diff = now - ts;
    if (diff < 60_000) return 'Just now';
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
    if (diff < 172_800_000) return 'Yesterday';
    // Older: show abbreviated date
    return new Date(isoString).toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

/** Format a due date as "Due in Xh" / "Due tomorrow" / "Due <date>". */
function formatDue(isoString: string): string {
  try {
    const now = Date.now();
    const ts = new Date(isoString).getTime();
    const diff = ts - now;
    if (diff < 0) return 'Overdue';
    if (diff < 3_600_000) return `Due in ${Math.max(1, Math.ceil(diff / 60_000))}m`;
    if (diff < 86_400_000) return `Due in ${Math.ceil(diff / 3_600_000)}h`;
    if (diff < 172_800_000) return 'Due tomorrow';
    return `Due ${new Date(isoString).toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
  } catch {
    return '';
  }
}

// ---------------------------------------------------------------------------
// Skeleton rows — §113 shimmer loading state
// ---------------------------------------------------------------------------

function SkeletonRow({ opacity = 1 }: { opacity?: number }) {
  return (
    <div className="flex gap-3 p-3" style={{ opacity }} aria-hidden="true">
      {/* Dot placeholder */}
      <div
        className="sh-skeleton mt-1.5 h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: '#3f3f46' }}
      />
      <div className="flex flex-1 flex-col gap-2 pt-0.5">
        <div className="flex items-center justify-between">
          <div className="sh-skeleton h-3 w-40 rounded" style={{ backgroundColor: '#3f3f46' }} />
          <div className="sh-skeleton h-2 w-8 rounded" style={{ backgroundColor: '#3f3f46' }} />
        </div>
        <div className="sh-skeleton h-3 w-5/6 rounded" style={{ backgroundColor: '#3f3f46' }} />
        <div className="sh-skeleton h-3 w-1/2 rounded" style={{ backgroundColor: '#3f3f46' }} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Notification rows
// ---------------------------------------------------------------------------

type RowProps = {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onNavigateToChannel: (serverId: string, channelId: string, channelName: string) => void;
  onOpenAssignments: () => void;
  onClose: () => void;
};

function MentionRow({ notification: n, onMarkRead, onNavigateToChannel, onClose }: RowProps) {
  const isUnread = n.readAt === null;

  function handleClick() {
    onMarkRead(n.id);
    if (n.serverId && n.channelId && n.channelName) {
      onNavigateToChannel(n.serverId, n.channelId, n.channelName);
    }
    onClose();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="group relative flex w-full gap-3 rounded-md p-3 text-left transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
      style={{
        backgroundColor: isUnread ? 'rgba(16,185,129,0.06)' : 'transparent',
        opacity: isUnread ? 1 : 0.7,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#27272a';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor = isUnread
          ? 'rgba(16,185,129,0.06)'
          : 'transparent';
      }}
    >
      {/* Unread indicator dot */}
      <span
        className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: isUnread ? '#10b981' : 'transparent' }}
        aria-hidden="true"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {/* Header row */}
        <div className="flex w-full items-start justify-between gap-2">
          <div className="flex flex-1 flex-wrap items-center gap-1.5 text-sm leading-snug">
            <AtIcon size={14} style={{ color: 'rgba(255,255,255,0.40)', flexShrink: 0 }} />
            {n.actorDisplayName && (
              <span className="font-semibold" style={{ color: 'rgba(255,255,255,0.92)' }}>
                {n.actorDisplayName}
              </span>
            )}
            <span style={{ color: 'rgba(255,255,255,0.60)' }}>mentioned you in</span>
            {n.channelName && (
              <span className="font-medium" style={{ color: '#10b981' }}>
                #{n.channelName}
              </span>
            )}
          </div>
          <span
            className="mt-0.5 shrink-0 whitespace-nowrap text-xs"
            style={{ color: 'rgba(255,255,255,0.40)' }}
          >
            {formatRelative(n.createdAt)}
          </span>
        </div>

        {/* Message excerpt */}
        {n.messageExcerpt && (
          <p
            className="truncate border-l-2 pl-2 text-sm"
            style={{
              borderColor: '#3f3f46',
              color: 'rgba(255,255,255,0.60)',
              marginTop: 2,
            }}
          >
            {n.messageExcerpt}
          </p>
        )}
      </div>
    </button>
  );
}

function ReminderRow({ notification: n, onMarkRead, onOpenAssignments, onClose }: RowProps) {
  const isUnread = n.readAt === null;

  function handleClick() {
    onMarkRead(n.id);
    onOpenAssignments();
    onClose();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="group relative flex w-full gap-3 rounded-md p-3 text-left transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
      style={{
        backgroundColor: isUnread ? 'rgba(16,185,129,0.06)' : 'transparent',
        opacity: isUnread ? 1 : 0.7,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#27272a';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor = isUnread
          ? 'rgba(16,185,129,0.06)'
          : 'transparent';
      }}
    >
      {/* Unread indicator dot */}
      <span
        className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: isUnread ? '#10b981' : 'transparent' }}
        aria-hidden="true"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {/* Header row */}
        <div className="flex w-full items-start justify-between gap-2">
          <div className="flex flex-1 flex-wrap items-center gap-1.5 text-sm leading-snug">
            {/* Calendar icon in amber tint container */}
            <span
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm"
              style={{ backgroundColor: 'rgba(245,158,11,0.10)' }}
              aria-hidden="true"
            >
              <CalendarCheckIcon size={13} style={{ color: '#f59e0b' }} />
            </span>
            <span style={{ color: 'rgba(255,255,255,0.60)' }}>Assignment due soon</span>
          </div>
          <span
            className="mt-0.5 shrink-0 whitespace-nowrap text-xs"
            style={{ color: 'rgba(255,255,255,0.40)' }}
          >
            {formatRelative(n.createdAt)}
          </span>
        </div>

        {/* Assignment title */}
        {n.assignmentTitle && (
          <p className="mt-0.5 text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.92)' }}>
            {n.assignmentTitle}
          </p>
        )}

        {/* Due date */}
        {n.dueDate && (
          <div
            className="mt-0.5 flex items-center gap-1 text-xs font-medium"
            style={{ color: '#f59e0b' }}
          >
            <ClockIcon size={11} />
            {formatDue(n.dueDate)}
          </div>
        )}
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// NotificationsPanel
// ---------------------------------------------------------------------------

export function NotificationsPanel({
  items,
  unreadCount,
  nextCursor,
  loadStatus,
  markAllStatus,
  markRead,
  markAllRead,
  loadMore,
  reload,
  onClose,
  onNavigateToChannel,
  onOpenAssignments,
}: NotificationsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);

  // Detect mobile breakpoint (same pattern as MainColumn)
  const isMobile =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(max-width: 1023px)').matches;

  // ── Escape closes panel ────────────────────────────────────────────────────
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    }
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [onClose]);

  // ── Focus trap ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    // Move focus to the first focusable element on open
    // Small delay so the panel is fully rendered
    const t = setTimeout(() => {
      firstFocusableRef.current?.focus();
    }, 50);

    function getFocusable(): HTMLElement[] {
      if (!panel) return [];
      return Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
    }

    function handleTab(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;
      const focusable = getFocusable();
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }

    document.addEventListener('keydown', handleTab);
    return () => {
      clearTimeout(t);
      document.removeEventListener('keydown', handleTab);
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Panel positioning
  // ---------------------------------------------------------------------------
  const panelStyle: React.CSSProperties = isMobile
    ? {
        // Bottom-sheet
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        height: '80dvh',
        zIndex: 50,
        backgroundColor: '#1c1c1f',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        boxShadow: '0 -8px 24px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }
    : {
        // Desktop popover
        position: 'fixed',
        top: 56, // below h-14 header
        right: 16,
        width: 380,
        maxHeight: 'calc(100dvh - 72px)',
        zIndex: 50,
        backgroundColor: '#1c1c1f',
        borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      };

  const hasUnread = unreadCount > 0;

  return (
    <>
      {/* Mobile scrim — aria-hidden; Escape handler in the dialog covers keyboard close */}
      {isMobile && (
        // biome-ignore lint/a11y/useKeyWithClickEvents: scrim is aria-hidden; keyboard dismiss is handled by the dialog's Escape listener
        <div
          className="fixed inset-0 z-40 bg-black/60"
          aria-hidden="true"
          onClick={onClose}
          style={{ backdropFilter: 'blur(2px)' }}
        />
      )}

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Notifications"
        className={isMobile ? 'sh-animate-slide-up' : 'sh-animate-fade-in'}
        style={panelStyle}
      >
        {/* Mobile drag handle */}
        {isMobile && (
          <div className="flex w-full shrink-0 justify-center py-2" aria-hidden="true">
            <div className="h-1.5 w-12 rounded-full" style={{ backgroundColor: '#3f3f46' }} />
          </div>
        )}

        {/* ── Header ── */}
        <div
          className="flex shrink-0 items-center justify-between px-4 py-3"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <h2 className="text-base font-semibold" style={{ color: 'rgba(255,255,255,0.92)' }}>
            Notifications
          </h2>

          {/* Mark all read — hidden during loading and when no unread items */}
          {loadStatus === 'loaded' && (
            <button
              ref={firstFocusableRef}
              type="button"
              onClick={markAllRead}
              disabled={!hasUnread || markAllStatus === 'pending'}
              aria-busy={markAllStatus === 'pending'}
              className="-mr-1 rounded px-1 text-sm font-medium transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 disabled:cursor-not-allowed"
              style={{
                color:
                  hasUnread && markAllStatus !== 'pending'
                    ? 'rgba(255,255,255,0.60)'
                    : 'rgba(255,255,255,0.25)',
              }}
              onMouseEnter={(e) => {
                if (hasUnread && markAllStatus !== 'pending') {
                  (e.currentTarget as HTMLButtonElement).style.color = '#10b981';
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color =
                  hasUnread && markAllStatus !== 'pending'
                    ? 'rgba(255,255,255,0.60)'
                    : 'rgba(255,255,255,0.25)';
              }}
            >
              {markAllStatus === 'pending' ? 'Marking…' : 'Mark all as read'}
            </button>
          )}

          {/* During loading, show skeleton for the button */}
          {loadStatus === 'loading' && (
            <div
              className="sh-skeleton h-4 w-24 rounded"
              style={{ backgroundColor: '#3f3f46', opacity: 0.5 }}
              aria-hidden="true"
            />
          )}
        </div>

        {/* ── Body ── */}
        <div
          className="flex-1 overflow-y-auto"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#3f3f46 transparent' }}
        >
          {/* Loading — §113 skeleton */}
          {loadStatus === 'loading' && (
            <div
              className="flex flex-col gap-1 p-4"
              aria-busy="true"
              aria-label="Loading notifications"
            >
              <SkeletonRow opacity={1} />
              <SkeletonRow opacity={0.8} />
              <SkeletonRow opacity={0.6} />
            </div>
          )}

          {/* Error — §113 error pattern */}
          {loadStatus === 'error' && (
            <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 text-center">
              <div
                className="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
                style={{
                  backgroundColor: 'rgba(239,68,68,0.10)',
                  border: '1px solid rgba(239,68,68,0.20)',
                }}
                aria-hidden="true"
              >
                <WarningCircleIcon size={28} style={{ color: '#f87171' }} />
              </div>
              <h3
                className="mb-1 text-lg font-semibold"
                style={{ color: 'rgba(255,255,255,0.92)' }}
              >
                Couldn&apos;t load data
              </h3>
              <p className="mb-5 text-sm" style={{ color: 'rgba(255,255,255,0.60)' }}>
                There was a problem syncing. Please try again.
              </p>
              <button
                ref={firstFocusableRef}
                type="button"
                onClick={reload}
                className="h-9 rounded-md border px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
                style={{
                  backgroundColor: '#27272a',
                  borderColor: 'rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.92)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#3f3f46';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#27272a';
                }}
              >
                Retry connection
              </button>
            </div>
          )}

          {/* Empty — §113 empty pattern */}
          {loadStatus === 'loaded' && items.length === 0 && (
            <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
              <div
                className="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
                style={{
                  backgroundColor: '#27272a',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
                aria-hidden="true"
              >
                <BellZIcon size={28} style={{ color: 'rgba(255,255,255,0.40)' }} />
              </div>
              <h3
                className="mb-1 text-2xl font-semibold"
                style={{ color: 'rgba(255,255,255,0.92)' }}
              >
                You&apos;re all caught up
              </h3>
              <p
                className="mb-5 max-w-[200px] text-sm leading-relaxed"
                style={{ color: 'rgba(255,255,255,0.60)' }}
              >
                No new notifications. Go ace your classes.
              </p>
              <button
                ref={firstFocusableRef}
                type="button"
                onClick={onClose}
                className="h-9 rounded-md border px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
                style={{
                  backgroundColor: '#27272a',
                  borderColor: 'rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.92)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#3f3f46';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#27272a';
                }}
              >
                Browse channels
              </button>
            </div>
          )}

          {/* Loaded — notification list */}
          {loadStatus === 'loaded' && items.length > 0 && (
            <div className="flex flex-col gap-1 p-4">
              {items.map((n) => {
                const rowProps: RowProps = {
                  notification: n,
                  onMarkRead: markRead,
                  onNavigateToChannel,
                  onOpenAssignments,
                  onClose,
                };
                return n.type === 'mention' ? (
                  <MentionRow key={n.id} {...rowProps} />
                ) : (
                  <ReminderRow key={n.id} {...rowProps} />
                );
              })}

              {/* Load more */}
              {nextCursor && (
                <button
                  type="button"
                  onClick={loadMore}
                  className="mt-2 w-full rounded-md py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
                  style={{
                    backgroundColor: 'transparent',
                    color: 'rgba(255,255,255,0.40)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#27272a';
                    (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.60)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                    (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.40)';
                  }}
                >
                  Load older notifications
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Capture `markAllRead` snapshot helper — exported for testing
export { formatRelative as _formatRelative };
