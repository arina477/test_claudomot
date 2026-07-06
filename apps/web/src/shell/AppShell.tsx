/**
 * AppShell — 4-column dark layout.
 *
 * Column order: ServerRail (72px) | ChannelSidebar (260px) | MainColumn (flex-1) | MemberListPanel (240px).
 *
 * Responsive behaviour (design system §9, breakpoints 1024/1280/1440):
 *   >1024px  — all four columns visible, full layout.
 *   ≤1024px  — MemberListPanel hidden (right-sidebar), ServerRail persists,
 *              ChannelSidebar collapses to an overlay drawer.
 *   ≤768px   — ChannelSidebar also collapses to overlay drawer.
 *
 * Mounts CreateServerModal when createModalOpen is true (driven by ServerContext).
 * Forwards a ref to the "Add a server" button so focus is restored on modal close.
 *
 * NOTE: ServerProvider must be an ancestor. AppHome provides it.
 */

import { useRef, useState } from 'react';
import { ChannelSidebar } from './ChannelSidebar';
import type { ConnectionState } from './ConnectionStateIndicator';
import { CreateServerModal } from './CreateServerModal';
import { DmHome } from './DmHome';
import { MainColumn } from './MainColumn';
import { MemberListPanel } from './MemberListPanel';
import { useServers } from './ServerContext';
import { ServerRail } from './ServerRail';
import { XIcon } from './icons';

type Props = {
  /** Prop-driven connection state for the indicator (not wired to real socket this wave). */
  connectionState?: ConnectionState;
};

export function AppShell({ connectionState = 'online' }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  /** When true, the DM home surface is shown instead of the channel view. */
  const [dmHomeActive, setDmHomeActive] = useState(false);
  const { createModalOpen, closeCreateModal, appendServer, selectedId } = useServers();
  const addServerBtnRef = useRef<HTMLButtonElement>(null);

  function toggleSidebar() {
    setSidebarOpen((prev) => !prev);
  }

  function closeSidebar() {
    setSidebarOpen(false);
  }

  return (
    <div className="flex h-full w-full overflow-hidden" style={{ backgroundColor: '#0a0a0b' }}>
      {/* ── Pane 1: Server Rail (always visible) ── */}
      <ServerRail
        addServerBtnRef={addServerBtnRef}
        dmActive={dmHomeActive}
        onDmHome={() => {
          setDmHomeActive((v) => !v);
          setSidebarOpen(false);
        }}
        onExitDmHome={() => setDmHomeActive(false)}
      />

      {/* ── Pane 2: Channel Sidebar ── */}
      {/*
       * Desktop (lg+): inline flex — always visible.
       * Mobile (<lg):  absolute overlay, shown/hidden via sidebarOpen state.
       * The sidebar is always in the DOM so assistive technology can reach it.
       * Hidden entirely in DM home view — DMs have no server channel list.
       */}
      {!dmHomeActive && (
        <div
          aria-hidden={undefined /* the aside inside carries aria labels */}
          className="hidden lg:flex"
        >
          <ChannelSidebar />
        </div>
      )}

      {/* Mobile overlay backdrop */}
      {sidebarOpen && !dmHomeActive && (
        <button
          type="button"
          aria-label="Close channel sidebar"
          data-testid="mobile-sidebar-backdrop"
          className="fixed inset-0 z-40 lg:hidden cursor-default"
          style={{ backgroundColor: 'rgba(0,0,0,0.50)' }}
          onClick={closeSidebar}
        />
      )}

      {/* Mobile overlay drawer */}
      {!dmHomeActive && (
        <div
          className="fixed top-0 bottom-0 z-50 flex transition-transform duration-300 ease-in-out lg:hidden"
          style={{
            left: 72 /* start at ServerRail width */,
            transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          }}
          aria-label="Channel sidebar drawer"
        >
          <ChannelSidebar />
          {/* Close button overlaid on drawer edge */}
          <button
            type="button"
            aria-label="Close channel sidebar"
            className="absolute right-[-40px] top-3 flex h-9 w-9 items-center justify-center rounded-full shadow-pop focus-visible:outline-none focus-visible:ring-2"
            style={{
              backgroundColor: '#27272a',
              color: 'rgba(255,255,255,0.60)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
            onClick={closeSidebar}
          >
            <XIcon size={16} />
          </button>
        </div>
      )}

      {/* ── Pane 3: Main Column OR DM Home (flex-1, always visible) ── */}
      {dmHomeActive ? (
        <DmHome />
      ) : (
        <MainColumn connectionState={connectionState} onToggleSidebar={toggleSidebar} />
      )}

      {/* ── Pane 4: Member List Panel (hidden ≤1024px per design §9, hidden in DM view) ── */}
      {/*
       * The right sidebar is absent from layout below 1024px.
       * We hide it with CSS rather than unmounting so the socket subscription
       * stays active when the user resizes their viewport.
       * Hidden entirely in DM home view — DMs have no server member list panel.
       */}
      {!dmHomeActive && (
        <div className="hidden lg:flex" style={{ flexShrink: 0 }}>
          <MemberListPanel serverId={selectedId} />
        </div>
      )}

      {/* ── Create Server Modal ── */}
      {createModalOpen && (
        <CreateServerModal
          onSuccess={(server) => {
            appendServer(server);
            closeCreateModal();
          }}
          onClose={closeCreateModal}
          triggerRef={addServerBtnRef}
        />
      )}
    </div>
  );
}
