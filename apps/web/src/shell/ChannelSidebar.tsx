/**
 * ChannelSidebar — 260px channel list panel.
 *
 * Design system §8 spec (ChannelSidebar item):
 *   #/voice/clipboard glyph + name, 14px, secondary text → primary on hover/active.
 *   Active = surface-700 fill + emerald text.
 *   Category headers: 11px uppercase muted, collapsible.
 *   Voice channel expands to show occupants.
 *   A11y: nav list, active = aria-current.
 *
 * Wave 1 scope: static placeholder channels — no real data.
 *   Member list is OUT of scope this wave.
 */

import {
  CaretDownIcon,
  ClipboardTextIcon,
  GearIcon,
  HashIcon,
  MicrophoneIcon,
  SpeakerHighIcon,
} from './icons';

type ChannelItemProps = {
  icon: React.ReactNode;
  name: string;
  active?: boolean;
  unread?: boolean;
};

function ChannelItem({ icon, name, active = false, unread = false }: ChannelItemProps) {
  return (
    <a
      href="#"
      role="listitem"
      aria-current={active ? 'page' : undefined}
      className="flex items-center gap-2 rounded px-2 py-1.5 cursor-pointer select-none transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2"
      style={{
        backgroundColor: active ? '#27272a' : 'transparent',
        color: active
          ? '#10b981'
          : unread
          ? 'rgba(255,255,255,0.92)'
          : 'rgba(255,255,255,0.60)',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#1c1c1f';
          (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.92)';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'transparent';
          (e.currentTarget as HTMLAnchorElement).style.color = unread
            ? 'rgba(255,255,255,0.92)'
            : 'rgba(255,255,255,0.60)';
        }
      }}
      onClick={(e) => e.preventDefault()}
    >
      <span className="shrink-0" style={{ color: active ? '#10b981' : 'rgba(255,255,255,0.40)' }}>
        {icon}
      </span>
      <span className="text-[14px] truncate" style={{ fontWeight: active || unread ? 500 : 400 }}>
        {name}
      </span>
      {unread && !active && (
        <span
          aria-label="Unread messages"
          className="ml-auto inline-block w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: 'rgba(255,255,255,0.85)' }}
        />
      )}
    </a>
  );
}

type CategoryProps = {
  name: string;
  children: React.ReactNode;
};

function Category({ name, children }: CategoryProps) {
  return (
    <div>
      <button
        className="flex w-full items-center gap-1 px-1 mb-1 cursor-pointer focus-visible:outline-none group transition-colors duration-150"
        style={{ color: 'rgba(255,255,255,0.40)' }}
        aria-expanded="true"
      >
        <CaretDownIcon size={10} className="group-hover:text-white/60 transition-colors" />
        <span
          className="text-[11px] font-semibold uppercase tracking-widest group-hover:text-white/60 transition-colors"
        >
          {name}
        </span>
      </button>
      <div role="list" className="space-y-[2px]">
        {children}
      </div>
    </div>
  );
}

export function ChannelSidebar() {
  return (
    <aside
      aria-label="Channel sidebar"
      data-testid="channel-sidebar"
      className="flex w-[260px] shrink-0 flex-col"
      style={{
        backgroundColor: '#121214',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Server header */}
      <header
        className="flex h-14 shrink-0 items-center justify-between px-4 cursor-pointer select-none transition-colors duration-150"
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.03)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
        }}
      >
        <h1
          className="truncate pr-2 text-[15px] font-semibold tracking-tight"
          style={{ color: 'rgba(255,255,255,0.92)' }}
        >
          CS-201 Data Structures
        </h1>
        <span style={{ color: 'rgba(255,255,255,0.40)' }} className="shrink-0">
          <CaretDownIcon size={14} />
        </span>
      </header>

      {/* Scrollable channel list */}
      <div className="flex-1 overflow-y-auto px-2 py-4 space-y-5">
        <Category name="Coursework">
          <ChannelItem icon={<HashIcon size={16} />} name="general" />
          <ChannelItem icon={<HashIcon size={16} />} name="questions" active />
          <ChannelItem icon={<ClipboardTextIcon size={16} />} name="assignments" unread />
          <ChannelItem icon={<HashIcon size={16} />} name="syllabus" />
        </Category>

        <Category name="Live Study">
          {/* Voice channel with expanded occupants */}
          <div
            className="rounded overflow-hidden"
            style={{
              backgroundColor: 'rgba(10,10,11,0.40)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <ChannelItem icon={<SpeakerHighIcon size={16} />} name="Study Room (Quiet)" />
            {/* Placeholder occupants */}
            <div className="pl-8 pr-2 pb-2 space-y-1.5" aria-label="Study room occupants">
              <div className="flex items-center gap-2">
                <div
                  className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[9px] font-bold"
                  style={{ backgroundColor: '#27272a', color: 'rgba(255,255,255,0.60)' }}
                  aria-label="Sarah Jenkins, speaking"
                >
                  SJ
                </div>
                <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.60)' }}>
                  Sarah Jenkins
                </span>
                {/* Voice wave indicator (emerald) */}
                <div
                  className="ml-auto flex items-end gap-[2px]"
                  aria-hidden="true"
                  style={{ height: 12 }}
                >
                  {[4, 8, 6].map((h, i) => (
                    <span
                      key={i}
                      className="inline-block w-[2px] rounded-sm"
                      style={{ height: h, backgroundColor: '#10b981' }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[9px] font-bold"
                  style={{
                    backgroundColor: '#27272a',
                    color: 'rgba(255,255,255,0.40)',
                    opacity: 0.7,
                  }}
                  aria-label="David C., muted"
                >
                  DC
                </div>
                <span
                  className="text-[12px]"
                  style={{ color: 'rgba(255,255,255,0.40)', opacity: 0.7 }}
                >
                  David C.
                </span>
              </div>
            </div>
          </div>
        </Category>
      </div>

      {/* Current user panel (bottom) */}
      <div
        className="flex h-[60px] shrink-0 items-center px-2"
        style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          backgroundColor: 'rgba(10,10,11,0.80)',
        }}
      >
        <button
          aria-label="Your profile and settings"
          className="flex w-full items-center gap-2 rounded-md p-1.5 cursor-pointer transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 group"
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1c1c1f';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
          }}
        >
          {/* Avatar with presence dot */}
          <div className="relative shrink-0">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-semibold"
              style={{ backgroundColor: '#27272a', color: 'rgba(255,255,255,0.92)' }}
              aria-hidden="true"
            >
              ET
            </div>
            <span
              aria-hidden="true"
              className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
              style={{
                backgroundColor: '#10b981',
                border: '2px solid #0a0a0b',
              }}
            />
          </div>

          {/* Name + email */}
          <div className="flex min-w-0 flex-col">
            <span
              className="truncate text-[13px] font-medium"
              style={{ color: 'rgba(255,255,255,0.92)' }}
            >
              Elias (You)
            </span>
            <span className="truncate text-[11px]" style={{ color: 'rgba(255,255,255,0.40)' }}>
              elias@mit.edu
            </span>
          </div>

          {/* Action icons (appear on hover) */}
          <div className="ml-auto flex shrink-0 gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            <span
              aria-hidden="true"
              className="flex h-7 w-7 items-center justify-center rounded transition-colors duration-150"
              style={{ color: 'rgba(255,255,255,0.40)' }}
            >
              <MicrophoneIcon size={14} />
            </span>
            <span
              aria-hidden="true"
              className="flex h-7 w-7 items-center justify-center rounded transition-colors duration-150"
              style={{ color: 'rgba(255,255,255,0.40)' }}
            >
              <GearIcon size={14} />
            </span>
          </div>
        </button>
      </div>
    </aside>
  );
}
