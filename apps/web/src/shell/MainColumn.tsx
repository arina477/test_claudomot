/**
 * MainColumn — bg-surface-800 channel view.
 *
 * Design system §8 spec (ChannelHeader):
 *   channel glyph + name + topic;
 *   right side: connection indicator, search, pinned/assignments shortcut.
 *   Hairline bottom border.
 *
 * Wave 1 scope:
 *   - Static channel header.
 *   - ConnectionStateIndicator rendered inline (prop-driven, no real socket).
 *   - Message area is an empty placeholder (no messages this wave).
 *   - Member list column is OUT of scope this wave.
 */

import { type ConnectionState, ConnectionStateIndicator } from './ConnectionStateIndicator';
import { HashIcon, MagnifyingGlassIcon, MenuIcon, PushPinIcon } from './icons';

type Props = {
  connectionState?: ConnectionState;
  onToggleSidebar?: () => void;
};

export function MainColumn({ connectionState = 'online', onToggleSidebar }: Props) {
  return (
    <main
      data-testid="main-column"
      className="relative flex min-w-0 flex-1 flex-col"
      style={{ backgroundColor: '#1c1c1f' }}
    >
      {/* Connection state indicator — shown above channel header when not online */}
      <ConnectionStateIndicator state={connectionState} />

      {/* Channel header */}
      <header
        className="flex h-14 shrink-0 items-center px-5 z-10"
        style={{
          backgroundColor: 'rgba(28,28,31,0.95)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 4px 24px -8px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
        }}
      >
        {/* Mobile sidebar toggle — only visible below lg */}
        <button
          type="button"
          aria-label="Toggle channel sidebar"
          className="mr-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors duration-150 lg:hidden focus-visible:outline-none focus-visible:ring-2"
          style={{ color: 'rgba(255,255,255,0.60)' }}
          onClick={onToggleSidebar}
        >
          <MenuIcon size={18} />
        </button>

        {/* Channel icon + name */}
        <span
          className="shrink-0 mr-2"
          style={{ color: 'rgba(255,255,255,0.40)' }}
          aria-hidden="true"
        >
          <HashIcon size={22} />
        </span>

        <h2
          className="text-[15px] font-semibold tracking-tight shrink-0"
          style={{ color: 'rgba(255,255,255,0.92)' }}
        >
          questions
        </h2>

        {/* Divider */}
        <div
          aria-hidden="true"
          className="mx-3 h-5 w-px shrink-0"
          style={{ backgroundColor: '#3f3f46' }}
        />

        {/* Topic */}
        <p className="truncate text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.60)' }}>
          Discussion about lectures, concepts, and problem sets.
        </p>

        {/* Right actions */}
        <div
          className="ml-auto flex shrink-0 items-center gap-4"
          style={{ color: 'rgba(255,255,255,0.40)' }}
        >
          <button
            type="button"
            aria-label="Search in channel"
            className="transition-colors duration-150 hover:text-white/90 focus-visible:outline-none focus-visible:ring-2 rounded"
          >
            <MagnifyingGlassIcon size={18} />
          </button>
          <button
            type="button"
            aria-label="View pinned messages"
            className="transition-colors duration-150 hover:text-white/90 focus-visible:outline-none focus-visible:ring-2 rounded"
          >
            <PushPinIcon size={18} />
          </button>
        </div>
      </header>

      {/* Message area — empty placeholder this wave */}
      <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-12 select-text">
        <div className="flex flex-col items-center gap-3 text-center max-w-sm">
          {/* Empty state indicator */}
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{
              backgroundColor: '#27272a',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
            aria-hidden="true"
          >
            <HashIcon size={28} className="" />
          </div>

          <h3 className="text-base font-semibold" style={{ color: 'rgba(255,255,255,0.92)' }}>
            Welcome to #questions
          </h3>
          <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.40)' }}>
            This is the beginning of the #questions channel. Ask away — the whole cohort can help.
          </p>
        </div>
      </div>

      {/* Message composer placeholder — bottom */}
      <div className="shrink-0 px-5 pb-6 pt-2" aria-label="Message composer">
        <div
          className="flex items-center rounded-xl px-4 py-3"
          style={{
            backgroundColor: 'rgba(39,39,42,0.40)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
          }}
        >
          <span className="text-[14px]" style={{ color: 'rgba(255,255,255,0.30)' }}>
            Message #questions
          </span>
        </div>
      </div>
    </main>
  );
}
