/**
 * DmConversationList — scrollable left rail listing DM conversations.
 *
 * Design: design/direct-messages.html §PANEL 2.
 * - Conversation rows: 1:1 (single avatar + presence dot) or group (stacked mini-avatars).
 * - Active row: emerald left-edge pip + bg-surface-700 + text-accent-emerald name.
 * - Unread badge: small emerald dot top-right of row.
 * - Last-message preview (with Pending/amber indicator for optimistic).
 * - Empty state: icon + copy + "Start a Conversation" CTA.
 * - Loading: shimmer rows.
 * - Error: retry affordance.
 * - Search/filter input (client-side filter on display name).
 * - Header: "Direct Messages" + "+" (Start DM) button.
 * - Conversations ordered by last-message recency (from server; hook reorders on new msg).
 *
 * D-3 notes: conversation-row px-3 padding; sr-only presence text on dots.
 *
 * wave-46 M8 task 1ceffdc9.
 */

import type { DmConversation } from '@studyhall/shared';
import { useState } from 'react';
import { SpinnerIcon } from './icons';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRelativeTimestamp(isoString: string): string {
  try {
    const diff = Date.now() - new Date(isoString).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60) return 'Now';
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d`;
    return new Date(isoString).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

/** Derive up to 2 initials from a display name. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || '?';
}

// ---------------------------------------------------------------------------
// AvatarArea — renders a single circular avatar or stacked group mini-avatars
// ---------------------------------------------------------------------------

function AvatarArea({ conversation }: { conversation: DmConversation }) {
  if (conversation.isGroup) {
    const [p0, p1] = conversation.participants.slice(0, 2);
    return (
      <div className="relative shrink-0 w-[32px] h-[32px]" aria-hidden="true">
        {p1 && (
          <div
            className="absolute bottom-0 left-0 w-[22px] h-[22px] rounded-full flex items-center justify-center text-[9px] font-semibold border-2"
            style={{
              backgroundColor: '#3f3f46',
              color: 'rgba(255,255,255,0.92)',
              borderColor: '#121214',
              zIndex: 0,
            }}
          >
            {initials(p1.displayName)}
          </div>
        )}
        {p0 && (
          <div
            className="absolute top-0 right-0 w-[22px] h-[22px] rounded-full flex items-center justify-center text-[9px] font-semibold border-2"
            style={{
              backgroundColor: '#52525b',
              color: 'rgba(255,255,255,0.92)',
              borderColor: '#121214',
              zIndex: 1,
            }}
          >
            {initials(p0.displayName)}
          </div>
        )}
      </div>
    );
  }

  const p = conversation.participants[0];
  const online = p?.presence === 'online';
  const presenceKnown = p?.presence !== undefined;

  return (
    <div className="relative shrink-0" aria-hidden="true">
      <div
        className="w-[32px] h-[32px] rounded-full flex items-center justify-center text-xs font-semibold"
        style={{ backgroundColor: '#3f3f46', color: 'rgba(255,255,255,0.92)' }}
      >
        {p ? initials(p.displayName) : '?'}
      </div>
      {presenceKnown && (
        <div
          className="absolute -bottom-0.5 -right-0.5 w-[12px] h-[12px] rounded-full border-[2.5px]"
          style={{
            backgroundColor: online ? '#10b981' : '#52525b',
            borderColor: '#121214',
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ConversationRow
// ---------------------------------------------------------------------------

type ConversationRowProps = {
  conversation: DmConversation;
  active: boolean;
  currentUserId: string | null;
  onClick: () => void;
};

function ConversationRow({ conversation, active, currentUserId, onClick }: ConversationRowProps) {
  // Derive display name: other participant(s) for 1:1; first two names for group.
  const otherParticipants = conversation.participants.filter((p) => p.userId !== currentUserId);
  const displayName = conversation.isGroup
    ? otherParticipants
        .slice(0, 2)
        .map((p) => p.displayName)
        .join(', ')
    : (otherParticipants[0]?.displayName ?? conversation.participants[0]?.displayName ?? 'Unknown');

  const lastMsg = conversation.lastMessage;
  const hasUnread = (conversation.unreadCount ?? 0) > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      data-testid={`dm-conv-row-${conversation.id}`}
      className="relative flex items-center gap-3 w-full px-3 py-2 rounded-md select-none text-left transition-colors"
      style={{
        backgroundColor: active ? '#27272a' : 'transparent',
        color: active ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.60)',
      }}
      onMouseEnter={(e) => {
        if (!active) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1c1c1f';
      }}
      onMouseLeave={(e) => {
        if (!active) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
      }}
    >
      {/* Active left-edge pip */}
      {active && (
        <div
          className="absolute left-[-8px] top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-md"
          style={{ backgroundColor: '#10b981' }}
          aria-hidden="true"
        />
      )}

      <AvatarArea conversation={conversation} />

      {/* Copy */}
      <div className="flex-1 min-w-0 pr-1">
        <div className="flex justify-between items-baseline mb-[2px]">
          <span
            className="text-sm font-medium truncate"
            style={{ color: active ? '#10b981' : 'rgba(255,255,255,0.92)' }}
          >
            {displayName}
          </span>
          {lastMsg && (
            <span
              className="text-xs shrink-0"
              style={{ color: hasUnread ? '#10b981' : 'rgba(255,255,255,0.40)' }}
            >
              {formatRelativeTimestamp(lastMsg.createdAt)}
            </span>
          )}
        </div>

        {lastMsg && (
          <div
            className="text-xs truncate overflow-hidden"
            style={{ color: 'rgba(255,255,255,0.40)' }}
          >
            {lastMsg.content}
          </div>
        )}
      </div>

      {/* Unread dot */}
      {hasUnread && (
        <>
          <span className="sr-only">{conversation.unreadCount} unread</span>
          <div
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: '#10b981' }}
            aria-hidden="true"
          />
        </>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function ConversationListSkeleton() {
  return (
    <div
      className="flex flex-col gap-[2px] px-2 py-2 animate-pulse"
      data-testid="dm-list-skeleton"
      aria-busy="true"
      aria-label="Loading conversations"
    >
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-md">
          <div
            className="w-[32px] h-[32px] rounded-full shrink-0"
            style={{ backgroundColor: '#27272a', opacity: 1 - i * 0.15 }}
            aria-hidden="true"
          />
          <div className="flex-1 flex flex-col gap-1.5">
            <div
              className="h-3.5 rounded-md"
              style={{
                backgroundColor: '#27272a',
                width: `${[112, 128, 96, 80][i] ?? 96}px`,
                opacity: 1 - i * 0.15,
              }}
              aria-hidden="true"
            />
            <div
              className="h-2.5 rounded-md"
              style={{
                backgroundColor: '#27272a',
                width: `${[160, 140, 120, 100][i] ?? 120}px`,
                opacity: 0.7 - i * 0.12,
              }}
              aria-hidden="true"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyListState({ onStartDm }: { onStartDm: () => void }) {
  return (
    <div
      className="flex-1 px-6 flex flex-col items-center justify-center text-center"
      data-testid="dm-list-empty"
    >
      <div
        className="w-[120px] h-[120px] mb-6 rounded-full flex items-center justify-center"
        style={{ backgroundColor: '#1c1c1f', border: '1px solid rgba(255,255,255,0.06)' }}
        aria-hidden="true"
      >
        <svg width="48" height="48" viewBox="0 0 256 256" fill="none" aria-hidden="true">
          <path
            d="M128 28C73.8 28 30 66.5 30 114c0 20.9 8.4 40 22.4 55L44 198l52-12a106 106 0 0 0 32 5c54.2 0 98-38.5 98-86S182.2 28 128 28Z"
            stroke="rgba(255,255,255,0.20)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>
      <h2 className="text-lg font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.92)' }}>
        No direct messages yet
      </h2>
      <p className="text-sm mb-6 max-w-[200px]" style={{ color: 'rgba(255,255,255,0.60)' }}>
        Connect with classmates and professors directly.
      </p>
      <button
        type="button"
        onClick={onStartDm}
        className="px-4 py-2 text-sm font-semibold rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
        style={{
          backgroundColor: '#10b981',
          color: '#0a0a0b',
          boxShadow: '0 0 0 2px rgba(16,185,129,0.4)',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(16,185,129,0.85)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#10b981';
        }}
      >
        Start a Conversation
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DmConversationList — the full left rail
// ---------------------------------------------------------------------------

type Props = {
  conversations: DmConversation[];
  loading: boolean;
  error: boolean;
  openConversationId: string | null;
  currentUserId: string | null;
  onSelectConversation: (id: string) => void;
  onStartDm: () => void;
  onRetryLoad: () => void;
};

export function DmConversationList({
  conversations,
  loading,
  error,
  openConversationId,
  currentUserId,
  onSelectConversation,
  onStartDm,
  onRetryLoad,
}: Props) {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = searchQuery.trim()
    ? conversations.filter((c) => {
        const others = c.participants.filter((p) => p.userId !== currentUserId);
        return others.some((p) => p.displayName.toLowerCase().includes(searchQuery.toLowerCase()));
      })
    : conversations;

  return (
    <aside
      className="w-full lg:w-[320px] flex-shrink-0 flex flex-col h-full"
      style={{ backgroundColor: '#121214', borderRight: '1px solid rgba(255,255,255,0.06)' }}
      aria-label="Direct message conversations"
    >
      {/* Header */}
      <header
        className="h-[56px] px-4 flex items-center justify-between shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <h1
          className="text-xl font-semibold tracking-tight"
          style={{ color: 'rgba(255,255,255,0.92)' }}
        >
          Direct Messages
        </h1>
        <button
          type="button"
          onClick={onStartDm}
          aria-label="Start Direct Message"
          data-testid="start-dm-button"
          className="w-[32px] h-[32px] rounded-md flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
          style={{ color: 'rgba(255,255,255,0.60)' }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#27272a';
            (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.92)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '';
            (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.60)';
          }}
        >
          <svg width="18" height="18" viewBox="0 0 256 256" fill="none" aria-hidden="true">
            <path
              d="M128 40v176M40 128h176"
              stroke="currentColor"
              strokeWidth="24"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </header>

      {/* Search input */}
      <div className="py-3 px-3 shrink-0">
        <div className="relative">
          <svg
            width="16"
            height="16"
            viewBox="0 0 256 256"
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'rgba(255,255,255,0.40)' }}
            aria-hidden="true"
            fill="none"
          >
            <circle cx="112" cy="112" r="80" stroke="currentColor" strokeWidth="20" />
            <path
              d="M172 172 224 224"
              stroke="currentColor"
              strokeWidth="20"
              strokeLinecap="round"
            />
          </svg>
          <input
            type="search"
            placeholder="Find or start a conversation"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search conversations"
            data-testid="dm-search-input"
            className="w-full text-sm rounded-md py-1.5 pl-9 pr-3 outline-none"
            style={{
              backgroundColor: '#0a0a0b',
              border: '1px solid rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.92)',
            }}
            onFocus={(e) => {
              (e.currentTarget as HTMLInputElement).style.borderColor = 'rgba(16,185,129,0.50)';
            }}
            onBlur={(e) => {
              (e.currentTarget as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.06)';
            }}
          />
        </div>
      </div>

      {/* List body */}
      {loading ? (
        <ConversationListSkeleton />
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.60)' }}>
            Couldn&apos;t load conversations.
          </p>
          <button
            type="button"
            onClick={onRetryLoad}
            data-testid="dm-list-retry"
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold focus:outline-none focus-visible:ring-2"
            style={{ backgroundColor: '#27272a', color: 'rgba(255,255,255,0.92)' }}
          >
            <SpinnerIcon size={14} />
            Retry
          </button>
        </div>
      ) : filtered.length === 0 && !searchQuery ? (
        <EmptyListState onStartDm={onStartDm} />
      ) : (
        <nav
          aria-label="Conversations"
          className="flex-1 overflow-y-auto px-2 py-2 flex flex-col gap-[2px]"
        >
          {filtered.length === 0 && searchQuery ? (
            <p
              className="px-3 py-4 text-sm text-center"
              style={{ color: 'rgba(255,255,255,0.40)' }}
            >
              No conversations match &ldquo;{searchQuery}&rdquo;
            </p>
          ) : (
            filtered.map((conv) => (
              <ConversationRow
                key={conv.id}
                conversation={conv}
                active={openConversationId === conv.id}
                currentUserId={currentUserId}
                onClick={() => onSelectConversation(conv.id)}
              />
            ))
          )}
        </nav>
      )}
    </aside>
  );
}
