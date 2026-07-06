/**
 * ServerContext — shares the server list, selected server ID, and selected
 * server detail (categories + channels) across ServerRail, ChannelSidebar,
 * and CreateServerModal.
 *
 * Data-fetching strategy: plain fetch hooks (matching the profile/auth pattern —
 * no external library; useEffect + useState with credentials:include via api.ts).
 *
 * After createServer succeeds the new server is appended optimistically then a
 * background re-fetch reconciles against the real list. Selecting a server
 * triggers a GET /servers/:id for the detail automatically.
 */

import type { ServerDetail, ServerResponse, ServerSummary } from '@studyhall/shared';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { api } from '../auth/api';
import {
  getCachedServerDetail,
  getCachedServers,
  putCachedServerDetail,
  putCachedServers,
} from '../features/sync/cache';
import { db } from '../features/sync/db';

export type ServersStatus = 'idle' | 'loading' | 'loaded' | 'error';
export type DetailStatus = 'idle' | 'loading' | 'loaded' | 'error';

export type ServerContextValue = {
  servers: ServerSummary[];
  status: ServersStatus;
  selectedId: string | null;
  selectServer: (id: string) => void;
  /** Append a freshly created server and select it immediately. */
  appendServer: (s: ServerResponse) => void;
  /** Re-fetch the server list from the API. */
  refetch: () => void;
  /** Whether the create-server modal is open. */
  createModalOpen: boolean;
  openCreateModal: () => void;
  closeCreateModal: () => void;
  /** Detail for the currently selected server (categories + channels). */
  selectedDetail: ServerDetail | null;
  detailStatus: DetailStatus;
  /** Currently active channel id (selected in the sidebar). */
  selectedChannelId: string | null;
  /** Name of the currently active channel. */
  selectedChannelName: string | null;
  selectChannel: (channelId: string, channelName: string) => void;
  /** Whether the assignments panel is the active main-column view. */
  assignmentsOpen: boolean;
  openAssignments: () => void;
  closeAssignments: () => void;
  /** Whether the class schedule panel is the active main-column view (wave-43). */
  scheduleOpen: boolean;
  openSchedule: () => void;
  closeSchedule: () => void;
};

export const ServerContext = createContext<ServerContextValue>({
  servers: [],
  status: 'idle',
  selectedId: null,
  selectServer: () => {},
  appendServer: () => {},
  refetch: () => {},
  createModalOpen: false,
  openCreateModal: () => {},
  closeCreateModal: () => {},
  selectedDetail: null,
  detailStatus: 'idle',
  selectedChannelId: null,
  selectedChannelName: null,
  selectChannel: () => {},
  assignmentsOpen: false,
  openAssignments: () => {},
  closeAssignments: () => {},
  scheduleOpen: false,
  openSchedule: () => {},
  closeSchedule: () => {},
});

export function useServers(): ServerContextValue {
  return useContext(ServerContext);
}

type Props = { children: React.ReactNode };

export function ServerProvider({ children }: Props) {
  const [servers, setServers] = useState<ServerSummary[]>([]);
  const [status, setStatus] = useState<ServersStatus>('idle');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<ServerDetail | null>(null);
  const [detailStatus, setDetailStatus] = useState<DetailStatus>('idle');
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [selectedChannelName, setSelectedChannelName] = useState<string | null>(null);
  const [assignmentsOpen, setAssignmentsOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  // Prevent state updates after unmount
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const fetchServers = useCallback(() => {
    setStatus('loading');
    api
      .getServers()
      .then((list) => {
        if (!mounted.current) return;
        setServers(list);
        setStatus('loaded');
        // Write-through: persist to offline cache so the rail is available when offline.
        if (db) void putCachedServers(db, list);
        // Auto-select a server if the invite-join flow stored one
        const pendingId = sessionStorage.getItem('sh:select-server');
        if (pendingId) {
          sessionStorage.removeItem('sh:select-server');
          if (list.some((s) => s.id === pendingId)) {
            setSelectedId(pendingId);
          }
        }
      })
      .catch(async () => {
        if (!mounted.current) return;
        // Offline fallback — serve the last-known server list from cache.
        if (db) {
          const cached = await getCachedServers(db).catch(() => []);
          if (!mounted.current) return;
          if (cached.length > 0) {
            setServers(cached);
            setStatus('loaded');
            return;
          }
        }
        setStatus('error');
      });
  }, []);

  // Fetch server list on mount
  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

  // Fetch server detail whenever the selected server changes
  useEffect(() => {
    if (!selectedId) {
      setSelectedDetail(null);
      setDetailStatus('idle');
      return;
    }
    const currentId = selectedId;
    setDetailStatus('loading');
    api
      .getServerDetail(currentId)
      .then((detail) => {
        if (!mounted.current) return;
        setSelectedDetail(detail);
        setDetailStatus('loaded');
        // Write-through: persist to offline cache so the sidebar is available when offline.
        if (db) void putCachedServerDetail(db, currentId, detail);
      })
      .catch(async () => {
        if (!mounted.current) return;
        // Offline fallback — serve the last-known server detail from cache.
        if (db) {
          const cached = await getCachedServerDetail(db, currentId).catch(() => undefined);
          if (!mounted.current) return;
          if (cached) {
            setSelectedDetail(cached.detail);
            setDetailStatus('loaded');
            return;
          }
        }
        setDetailStatus('error');
      });
  }, [selectedId]);

  const selectServer = useCallback((id: string) => {
    setSelectedId(id);
    // Reset channel selection when switching servers
    setSelectedChannelId(null);
    setSelectedChannelName(null);
    setAssignmentsOpen(false);
    setScheduleOpen(false);
  }, []);

  const selectChannel = useCallback((channelId: string, channelName: string) => {
    setSelectedChannelId(channelId);
    setSelectedChannelName(channelName);
    setAssignmentsOpen(false);
    setScheduleOpen(false);
  }, []);

  const openAssignments = useCallback(() => {
    setAssignmentsOpen(true);
    setScheduleOpen(false);
    // Clear channel selection when entering the assignments view
    setSelectedChannelId(null);
    setSelectedChannelName(null);
  }, []);

  const closeAssignments = useCallback(() => {
    setAssignmentsOpen(false);
  }, []);

  const openSchedule = useCallback(() => {
    setScheduleOpen(true);
    setAssignmentsOpen(false);
    // Clear channel selection when entering the schedule view
    setSelectedChannelId(null);
    setSelectedChannelName(null);
  }, []);

  const closeSchedule = useCallback(() => {
    setScheduleOpen(false);
  }, []);

  const appendServer = useCallback((s: ServerResponse) => {
    const summary: ServerSummary = { id: s.id, name: s.name, ownerId: s.ownerId };
    setServers((prev) => [...prev, summary]);
    // Selecting the new server triggers the detail effect automatically
    setSelectedId(s.id);
    // Reconcile list with server truth in the background
    api
      .getServers()
      .then((list) => {
        if (!mounted.current) return;
        setServers(list);
      })
      .catch(() => {
        /* ignore background reconciliation errors */
      });
  }, []);

  const openCreateModal = useCallback(() => setCreateModalOpen(true), []);
  const closeCreateModal = useCallback(() => setCreateModalOpen(false), []);

  return (
    <ServerContext.Provider
      value={{
        servers,
        status,
        selectedId,
        selectServer,
        appendServer,
        refetch: fetchServers,
        createModalOpen,
        openCreateModal,
        closeCreateModal,
        selectedDetail,
        detailStatus,
        selectedChannelId,
        selectedChannelName,
        selectChannel,
        assignmentsOpen,
        openAssignments,
        closeAssignments,
        scheduleOpen,
        openSchedule,
        closeSchedule,
      }}
    >
      {children}
    </ServerContext.Provider>
  );
}
