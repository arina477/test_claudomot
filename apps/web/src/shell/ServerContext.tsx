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
        // Auto-select a server if the invite-join flow stored one
        const pendingId = sessionStorage.getItem('sh:select-server');
        if (pendingId) {
          sessionStorage.removeItem('sh:select-server');
          if (list.some((s) => s.id === pendingId)) {
            setSelectedId(pendingId);
          }
        }
      })
      .catch(() => {
        if (!mounted.current) return;
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
    setDetailStatus('loading');
    api
      .getServerDetail(selectedId)
      .then((detail) => {
        if (!mounted.current) return;
        setSelectedDetail(detail);
        setDetailStatus('loaded');
      })
      .catch(() => {
        if (!mounted.current) return;
        setDetailStatus('error');
      });
  }, [selectedId]);

  const selectServer = useCallback((id: string) => {
    setSelectedId(id);
    // Reset channel selection when switching servers
    setSelectedChannelId(null);
    setSelectedChannelName(null);
  }, []);

  const selectChannel = useCallback((channelId: string, channelName: string) => {
    setSelectedChannelId(channelId);
    setSelectedChannelName(channelName);
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
      }}
    >
      {children}
    </ServerContext.Provider>
  );
}
