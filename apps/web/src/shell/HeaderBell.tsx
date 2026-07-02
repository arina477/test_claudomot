/**
 * HeaderBell — notification bell button + panel anchor (wave-37 M7).
 *
 * Responsibilities:
 *   - Owns the useNotifications hook (always mounted → always fetching).
 *   - Renders bell button with emerald badge (9+ cap, aria-hidden).
 *   - aria-label reflects live unread count: "Notifications, N unread".
 *   - aria-expanded tracks panel open state; aria-haspopup="dialog".
 *   - Solid-fill bell icon when unread > 0; outline when 0.
 *   - aria-live="polite" hidden region announces socket-driven count changes.
 *   - Opens/closes NotificationsPanel; restores focus to bell on close.
 *   - Closes panel on click outside (clicks on the bell itself handled by toggle).
 *
 * Navigation callbacks passed down to NotificationsPanel:
 *   - onNavigateToChannel: calls selectServer + selectChannel from ServerContext.
 *   - onOpenAssignments:   calls openAssignments from ServerContext.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { NotificationsPanel } from './NotificationsPanel';
import { useServers } from './ServerContext';
import { BellFillIcon, BellIcon } from './icons';
import { useNotifications } from './useNotifications';

export function HeaderBell() {
  const [panelOpen, setPanelOpen] = useState(false);
  const bellRef = useRef<HTMLButtonElement>(null);
  const panelRootRef = useRef<HTMLDivElement>(null);

  const notifications = useNotifications();
  const { unreadCount } = notifications;

  const { selectServer, selectChannel, openAssignments } = useServers();

  // ---------------------------------------------------------------------------
  // Badge display
  // ---------------------------------------------------------------------------
  const badgeText = unreadCount > 9 ? '9+' : unreadCount > 0 ? String(unreadCount) : null;

  // ---------------------------------------------------------------------------
  // Reload on panel open — reconciles items + count against the server each time
  // the panel transitions from closed to open. Keeps list in sync with live
  // mention events that only incremented unreadCount between opens.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (panelOpen) {
      notifications.reload();
    }
  }, [panelOpen, notifications.reload]);

  // ---------------------------------------------------------------------------
  // Toggle panel
  // ---------------------------------------------------------------------------
  const openPanel = useCallback(() => setPanelOpen(true), []);
  const closePanel = useCallback(() => {
    setPanelOpen(false);
    // Restore focus to bell
    requestAnimationFrame(() => {
      bellRef.current?.focus();
    });
  }, []);

  function handleBellClick() {
    if (panelOpen) {
      closePanel();
    } else {
      openPanel();
    }
  }

  // ---------------------------------------------------------------------------
  // Click-outside-to-close (for desktop popover; mobile uses the scrim)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!panelOpen) return;

    function handlePointerDown(e: PointerEvent) {
      const target = e.target as Node;
      // If the click is on the bell button, the toggle handler takes over
      if (bellRef.current?.contains(target)) return;
      // If outside the panel root wrapper, close
      if (panelRootRef.current && !panelRootRef.current.contains(target)) {
        closePanel();
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [panelOpen, closePanel]);

  // ---------------------------------------------------------------------------
  // Navigation callbacks
  // ---------------------------------------------------------------------------
  const handleNavigateToChannel = useCallback(
    (serverId: string, channelId: string, channelName: string) => {
      selectServer(serverId);
      selectChannel(channelId, channelName);
    },
    [selectServer, selectChannel],
  );

  const handleOpenAssignments = useCallback(() => {
    openAssignments();
  }, [openAssignments]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <>
      {/* Bell button */}
      <button
        ref={bellRef}
        type="button"
        aria-label={`Notifications, ${unreadCount} unread`}
        aria-expanded={panelOpen}
        aria-haspopup="dialog"
        onClick={handleBellClick}
        className="relative flex h-9 w-9 items-center justify-center rounded-md transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
        style={{
          color: panelOpen ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.40)',
          backgroundColor: panelOpen ? '#27272a' : 'transparent',
        }}
        onMouseEnter={(e) => {
          if (!panelOpen) {
            (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.90)';
          }
        }}
        onMouseLeave={(e) => {
          if (!panelOpen) {
            (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.40)';
          }
        }}
      >
        {/* Bell icon — solid-fill when unread, outline when zero */}
        {unreadCount > 0 ? <BellFillIcon size={18} /> : <BellIcon size={18} />}

        {/* Emerald badge — aria-hidden; text capped at 9+ */}
        {badgeText && (
          <span
            aria-hidden="true"
            className="absolute -right-1 -top-1 flex min-w-[16px] items-center justify-center rounded-full border-2 px-1 text-[10px] font-semibold leading-none"
            style={{
              backgroundColor: '#10b981',
              borderColor: '#1c1c1f',
              color: '#0a0a0b',
              height: 16,
              paddingBottom: 1,
            }}
          >
            {badgeText}
          </span>
        )}
      </button>

      {/* Hidden aria-live region — announces socket-driven count changes to screen readers */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {unreadCount > 0
          ? `You have ${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`
          : ''}
      </div>

      {/* Panel — rendered in place; positioned fixed via NotificationsPanel styles */}
      {panelOpen && (
        <div ref={panelRootRef}>
          <NotificationsPanel
            {...notifications}
            onClose={closePanel}
            onNavigateToChannel={handleNavigateToChannel}
            onOpenAssignments={handleOpenAssignments}
          />
        </div>
      )}
    </>
  );
}
