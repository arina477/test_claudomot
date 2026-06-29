/**
 * ServerContext — shares the server list and the selected server ID
 * across ServerRail, ChannelSidebar, and CreateServerModal.
 *
 * Data-fetching strategy: plain fetch hooks (matching the profile/auth pattern —
 * no external library; useEffect + useState with credentials:include via api.ts).
 *
 * After createServer succeeds the new server is appended optimistically then a
 * background re-fetch reconciles against the real list.
 */

import type { ServerResponse, ServerSummary } from '@studyhall/shared';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { api } from '../auth/api';

export type ServersStatus = 'idle' | 'loading' | 'loaded' | 'error';

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
      })
      .catch(() => {
        if (!mounted.current) return;
        setStatus('error');
      });
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

  const selectServer = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const appendServer = useCallback((s: ServerResponse) => {
    const summary: ServerSummary = { id: s.id, name: s.name, ownerId: s.ownerId };
    setServers((prev) => [...prev, summary]);
    setSelectedId(s.id);
    // Reconcile with server truth in the background
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
      }}
    >
      {children}
    </ServerContext.Provider>
  );
}
