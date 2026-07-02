/**
 * useNotifications — notification center state hook (wave-37 M7).
 *
 * Bootstrap: GET /me/notifications on first mount (items + server unreadCount).
 * Live:      subscribe onMention to increment unreadCount for new mention events.
 *            Assignment reminders surface on next fetch (NON-GOAL: live-push).
 * Optimistic: markRead + markAllRead update local state immediately; server
 *             unreadCount is the source of truth on API response.
 * Pagination: loadMore() fetches the next cursor page and appends items.
 */

import type { Notification, NotificationListResponse } from '@studyhall/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../auth/api';
import { onMention } from './messagingSocket';

export type NotificationsLoadStatus = 'loading' | 'loaded' | 'error';
export type MarkAllStatus = 'idle' | 'pending';

export type UseNotificationsResult = {
  /** Loaded notification items, newest-first. */
  items: Notification[];
  /** Total unread count (server-derived; socket-incremented for live mentions). */
  unreadCount: number;
  /** Cursor for the next page. Null when on the last page. */
  nextCursor: string | null;
  /** Initial load lifecycle status. */
  loadStatus: NotificationsLoadStatus;
  /** Status of the mark-all-read operation. */
  markAllStatus: MarkAllStatus;
  /** Optimistically marks a single notification read. Server unreadCount corrects optimistic decrement. */
  markRead: (id: string) => void;
  /** Marks all notifications read. Optimistic with error rollback. */
  markAllRead: () => void;
  /** Fetches the next page and appends to items. No-op when nextCursor is null. */
  loadMore: () => void;
  /** Re-fetches from page 1 (used on error retry). */
  reload: () => void;
};

export function useNotifications(): UseNotificationsResult {
  const [items, setItems] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadStatus, setLoadStatus] = useState<NotificationsLoadStatus>('loading');
  const [markAllStatus, setMarkAllStatus] = useState<MarkAllStatus>('idle');

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Core fetch helper
  // ---------------------------------------------------------------------------

  const applyPage = useCallback((res: NotificationListResponse, cursor: string | undefined) => {
    if (!mounted.current) return;
    setItems((prev) => (cursor !== undefined ? [...prev, ...res.items] : res.items));
    setUnreadCount(res.unreadCount);
    setNextCursor(res.nextCursor);
    setLoadStatus('loaded');
  }, []);

  const load = useCallback(
    (cursor?: string) => {
      if (cursor === undefined) setLoadStatus('loading');
      api
        .getNotifications(cursor)
        .then((res) => applyPage(res, cursor))
        .catch(() => {
          if (!mounted.current) return;
          // Only flip to error on initial load; pagination errors are silent
          if (cursor === undefined) setLoadStatus('error');
        });
    },
    [applyPage],
  );

  // Bootstrap on mount
  useEffect(() => {
    load();
  }, [load]);

  // ---------------------------------------------------------------------------
  // Live-increment for new mention events
  // Reminders surface on next fetch (NON-GOAL: live-push per B-3 spec)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const unsub = onMention(() => {
      setUnreadCount((n) => n + 1);
    });
    return unsub;
  }, []);

  // ---------------------------------------------------------------------------
  // markRead — optimistic single-item mark-read
  // ---------------------------------------------------------------------------
  const markRead = useCallback((id: string) => {
    // Optimistic: flip readAt, decrement count
    setItems((prev) =>
      prev.map((n) =>
        n.id === id && n.readAt === null ? { ...n, readAt: new Date().toISOString() } : n,
      ),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    api
      .markNotificationRead(id)
      .then((res) => {
        if (!mounted.current) return;
        // Server is source of truth — correct the optimistic count
        setUnreadCount(res.unreadCount);
      })
      .catch(() => {
        if (!mounted.current) return;
        // Rollback: restore unread dot and count
        setItems((prev) => prev.map((n) => (n.id === id ? { ...n, readAt: null } : n)));
        setUnreadCount((prev) => prev + 1);
      });
  }, []);

  // ---------------------------------------------------------------------------
  // markAllRead — optimistic bulk mark-read
  // ---------------------------------------------------------------------------
  const markAllRead = useCallback(() => {
    if (markAllStatus === 'pending') return;
    setMarkAllStatus('pending');

    // Capture rollback snapshot before optimistic update.
    // Initialized to safe defaults; overwritten synchronously in the setter callbacks.
    let snapshotItems: Notification[] = [];
    let snapshotCount = 0;
    setItems((prev) => {
      snapshotItems = prev;
      return prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() }));
    });
    setUnreadCount((prev) => {
      snapshotCount = prev;
      return 0;
    });

    api
      .markAllNotificationsRead()
      .then((res) => {
        if (!mounted.current) return;
        setUnreadCount(res.unreadCount);
      })
      .catch(() => {
        if (!mounted.current) return;
        // Rollback to pre-optimistic snapshot
        setItems(snapshotItems);
        setUnreadCount(snapshotCount);
      })
      .finally(() => {
        if (mounted.current) setMarkAllStatus('idle');
      });
  }, [markAllStatus]);

  // ---------------------------------------------------------------------------
  // Pagination
  // ---------------------------------------------------------------------------
  const loadMore = useCallback(() => {
    if (nextCursor) load(nextCursor);
  }, [nextCursor, load]);

  const reload = useCallback(() => {
    load();
  }, [load]);

  return {
    items,
    unreadCount,
    nextCursor,
    loadStatus,
    markAllStatus,
    markRead,
    markAllRead,
    loadMore,
    reload,
  };
}
