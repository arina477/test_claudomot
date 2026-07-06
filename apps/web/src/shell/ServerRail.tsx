/**
 * ServerRail — left 72px icon rail.
 *
 * Design system §8 spec:
 *   44px squircle icons, radius-lg default → radius-md morph on active.
 *   Active: emerald left-edge indicator bar.
 *   Hover: rounded-md + tooltip (server name).
 *   "+" create button at bottom.
 *   A11y: button + aria-label = server name, arrow-key nav.
 *
 * Wired to ServerContext: renders real server list from GET /servers.
 * States: loading (spinner skeleton) / empty / loaded / error.
 */

import { useRef } from 'react';
import { useServers } from './ServerContext';
import { BooksIcon, ChatTeardropIcon, PlusIcon, SpinnerIcon } from './icons';

/** Derive 2-character initials from a server name. */
function serverInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

type ServerIconProps = {
  id: string;
  label: string;
  active?: boolean;
  initials: string;
  onClick: () => void;
};

function ServerIconButton({ label, active = false, initials, onClick }: ServerIconProps) {
  return (
    <li className="relative flex w-full justify-center group">
      {/* Active left-edge indicator bar */}
      <span
        aria-hidden="true"
        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full transition-all duration-200"
        style={{
          backgroundColor: active ? '#10b981' : 'rgba(255,255,255,0.7)',
          height: active ? '32px' : '0px',
          opacity: active ? 1 : 0,
        }}
      />
      {/* Hover indicator */}
      <span
        aria-hidden="true"
        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity duration-150"
        style={{ backgroundColor: 'rgba(255,255,255,0.5)' }}
      />

      <button
        type="button"
        aria-label={label}
        aria-current={active ? 'page' : undefined}
        data-active={active}
        onClick={onClick}
        className="rail-icon w-11 h-11 flex items-center justify-center text-sm font-semibold cursor-pointer focus-visible:outline-none focus-visible:ring-2"
        style={{
          backgroundColor: active ? '#10b981' : '#1c1c1f',
          color: active ? '#0a0a0b' : 'rgba(255,255,255,0.60)',
          boxShadow: '0 1px 2px rgba(0,0,0,0.4)',
          transition: 'background-color 150ms ease, color 150ms ease',
        }}
      >
        {initials}
      </button>

      {/* Tooltip */}
      <div
        role="tooltip"
        className="pointer-events-none absolute left-16 top-1/2 -translate-y-1/2 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium shadow-pop"
        style={{
          backgroundColor: '#0a0a0b',
          border: '1px solid #27272a',
          color: 'rgba(255,255,255,0.92)',
        }}
      >
        {label}
      </div>
    </li>
  );
}

type Props = {
  /** Optional ref forwarded to the "Add a server" button for focus restore after modal close. */
  addServerBtnRef?: React.RefObject<HTMLButtonElement | null>;
  /** Whether the DM home surface is the active view. */
  dmActive?: boolean;
  /** Called when the DM home icon is clicked. */
  onDmHome?: () => void;
  /** Called to exit the DM home surface unconditionally (server-select or Home click). */
  onExitDmHome?: () => void;
};

export function ServerRail({ addServerBtnRef, dmActive = false, onDmHome, onExitDmHome }: Props) {
  const { servers, status, selectedId, selectServer, openCreateModal } = useServers();
  const internalRef = useRef<HTMLButtonElement>(null);
  const btnRef = addServerBtnRef ?? internalRef;

  return (
    <nav
      aria-label="Server rail"
      data-testid="server-rail"
      className="flex w-[72px] shrink-0 flex-col items-center gap-2 py-4"
      style={{
        backgroundColor: 'var(--color-surface-900)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Home button */}
      <div className="relative flex w-full justify-center group">
        <span
          aria-hidden="true"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full"
          style={{ backgroundColor: 'rgba(255,255,255,0.85)' }}
        />
        <button
          type="button"
          aria-label="Home"
          onClick={onExitDmHome}
          className="w-11 h-11 flex items-center justify-center rounded-xl cursor-pointer focus-visible:outline-none focus-visible:ring-2"
          style={{
            backgroundColor: '#1c1c1f',
            color: 'rgba(255,255,255,0.92)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.4)',
          }}
        >
          <BooksIcon size={20} />
        </button>
        <div
          role="tooltip"
          className="pointer-events-none absolute left-16 top-1/2 -translate-y-1/2 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium shadow-pop"
          style={{
            backgroundColor: '#0a0a0b',
            border: '1px solid #27272a',
            color: 'rgba(255,255,255,0.92)',
          }}
        >
          Home
        </div>
      </div>

      {/* DM Home button — wave-46 M8 */}
      <div className="relative flex w-full justify-center group">
        {dmActive && (
          <span
            aria-hidden="true"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full"
            style={{ backgroundColor: '#10b981' }}
          />
        )}
        <button
          type="button"
          aria-label="Direct Messages"
          aria-current={dmActive ? 'page' : undefined}
          onClick={onDmHome}
          data-testid="dm-home-rail-button"
          className="w-11 h-11 flex items-center justify-center rounded-xl cursor-pointer focus-visible:outline-none focus-visible:ring-2 transition-colors"
          style={{
            backgroundColor: dmActive ? '#10b981' : '#1c1c1f',
            color: dmActive ? '#0a0a0b' : 'rgba(255,255,255,0.60)',
            boxShadow: dmActive ? '0 0 0 2px rgba(16,185,129,0.4)' : '0 1px 2px rgba(0,0,0,0.4)',
          }}
          onMouseEnter={(e) => {
            if (!dmActive) {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#27272a';
              (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.92)';
            }
          }}
          onMouseLeave={(e) => {
            if (!dmActive) {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1c1c1f';
              (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.60)';
            }
          }}
        >
          <ChatTeardropIcon size={20} />
        </button>
        <div
          role="tooltip"
          className="pointer-events-none absolute left-16 top-1/2 -translate-y-1/2 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium shadow-pop"
          style={{
            backgroundColor: '#0a0a0b',
            border: '1px solid #27272a',
            color: 'rgba(255,255,255,0.92)',
          }}
        >
          Direct Messages
        </div>
      </div>

      {/* Divider */}
      <div
        aria-hidden="true"
        className="my-1 h-px w-8 rounded-full"
        style={{ backgroundColor: '#27272a' }}
      />

      {/* Server list */}
      <ul
        aria-label="Your servers"
        className="flex flex-col items-center gap-2 w-full"
        style={{ listStyle: 'none', padding: 0, margin: 0 }}
      >
        {status === 'loading' && (
          <li className="flex w-full justify-center" aria-label="Loading servers">
            <div
              className="w-11 h-11 flex items-center justify-center"
              style={{ color: 'rgba(255,255,255,0.30)' }}
            >
              <SpinnerIcon size={18} className="animate-spin" />
            </div>
          </li>
        )}

        {status === 'error' && (
          <li className="flex w-full justify-center px-2">
            <span
              className="text-[10px] text-center leading-tight"
              style={{ color: 'rgba(255,255,255,0.30)' }}
            >
              Failed to load
            </span>
          </li>
        )}

        {(status === 'loaded' || status === 'idle') &&
          servers.map((s) => (
            <ServerIconButton
              key={s.id}
              id={s.id}
              label={s.name}
              active={s.id === selectedId}
              initials={serverInitials(s.name)}
              onClick={() => {
                selectServer(s.id);
                onExitDmHome?.();
              }}
            />
          ))}
      </ul>

      {/* Spacer */}
      <div className="flex-1" aria-hidden="true" />

      {/* Create / Add server button */}
      <div className="relative flex w-full justify-center group">
        <button
          ref={btnRef}
          type="button"
          aria-label="Add a server"
          onClick={openCreateModal}
          className="rail-icon w-11 h-11 flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2"
          style={{
            backgroundColor: '#1c1c1f',
            color: '#10b981',
            border: '1px solid rgba(255,255,255,0.06)',
            transition: 'background-color 150ms ease, color 150ms ease, border-radius 300ms ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#10b981';
            (e.currentTarget as HTMLButtonElement).style.color = '#0a0a0b';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1c1c1f';
            (e.currentTarget as HTMLButtonElement).style.color = '#10b981';
          }}
        >
          <PlusIcon size={18} />
        </button>
        <div
          role="tooltip"
          className="pointer-events-none absolute left-16 top-1/2 -translate-y-1/2 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium"
          style={{
            backgroundColor: '#0a0a0b',
            border: '1px solid #27272a',
            color: 'rgba(255,255,255,0.92)',
          }}
        >
          Add a Server
        </div>
      </div>
    </nav>
  );
}
