/**
 * AppShell — 3-column dark layout.
 *
 * Column order: ServerRail (72px) | ChannelSidebar (260px) | MainColumn (flex-1).
 *
 * Responsive behaviour (design system §9, breakpoints 1024/1280/1440):
 *   ≥1024px  — all three columns visible, full layout.
 *   <1024px  — ServerRail persists; ChannelSidebar collapses to an overlay drawer
 *              with a toggle button in the MainColumn header.
 *
 * Wave 1 scope:
 *   Member list column is OUT of scope — not rendered.
 *   Connection state is prop-driven (no socket).
 */

import { useState } from 'react';
import { ChannelSidebar } from './ChannelSidebar';
import type { ConnectionState } from './ConnectionStateIndicator';
import { MainColumn } from './MainColumn';
import { ServerRail } from './ServerRail';
import { XIcon } from './icons';

type Props = {
  /** Prop-driven connection state for the indicator (not wired to real socket this wave). */
  connectionState?: ConnectionState;
};

export function AppShell({ connectionState = 'online' }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function toggleSidebar() {
    setSidebarOpen((prev) => !prev);
  }

  function closeSidebar() {
    setSidebarOpen(false);
  }

  return (
    <div className="flex h-full w-full overflow-hidden" style={{ backgroundColor: '#0a0a0b' }}>
      {/* ── Pane 1: Server Rail (always visible) ── */}
      <ServerRail />

      {/* ── Pane 2: Channel Sidebar ── */}
      {/*
       * Desktop (lg+): inline flex — always visible.
       * Mobile (<lg):  absolute overlay, shown/hidden via sidebarOpen state.
       * The sidebar is always in the DOM so assistive technology can reach it.
       */}
      <div
        aria-hidden={undefined /* the aside inside carries aria labels */}
        className="hidden lg:flex"
      >
        <ChannelSidebar />
      </div>

      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close channel sidebar"
          className="fixed inset-0 z-40 lg:hidden cursor-default"
          style={{ backgroundColor: 'rgba(0,0,0,0.50)' }}
          onClick={closeSidebar}
        />
      )}

      {/* Mobile overlay drawer */}
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

      {/* ── Pane 3: Main Column (flex-1, always visible) ── */}
      <MainColumn connectionState={connectionState} onToggleSidebar={toggleSidebar} />
    </div>
  );
}
