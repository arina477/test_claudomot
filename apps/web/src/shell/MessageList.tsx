/**
 * MessageList — scrollable message area for a channel.
 *
 * - role="log" aria-live="polite" (design spec)
 * - Newest at bottom; scroll-to-bottom on new messages.
 * - "Load older" affordance at the top (scroll-up) via nextCursor.
 * - Three row states: sent, pending (greyed + clock + aria-busy),
 *   failed (danger tint + Retry button, role=alert).
 * - Empty-channel state rendered IN PLACE of the list when messages=[].
 * - Loading / error states.
 *
 * Receives the full message list (real + optimistic) from useMessages hook.
 */

import type { MessageResponse } from '@studyhall/shared';
import { useEffect, useRef } from 'react';
import { ChatsCircleIcon, ClockIcon, RetryIcon, SpinnerIcon, WarningCircleIcon } from './icons';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type OptimisticMessage = {
  /** Unique client-generated key — also used for dedup with the server id */
  idempotencyKey: string;
  content: string;
  /** Display name shown in the row */
  authorDisplay: string;
  state: 'pending' | 'failed';
};

export type DisplayMessage =
  | ({ kind: 'real' } & MessageResponse)
  | ({ kind: 'optimistic' } & OptimisticMessage);

type Props = {
  messages: DisplayMessage[];
  loadingInitial: boolean;
  loadingOlder: boolean;
  errorInitial: boolean;
  hasOlderMessages: boolean;
  onLoadOlder: () => void;
  onRetry: (idempotencyKey: string) => void;
  /** Label for the composer hint, e.g. "general" */
  channelName?: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

/** Derive initials from an authorId or display string. */
function initials(s: string): string {
  const words = s.trim().split(/\s+/);
  if (words.length >= 2) {
    return ((words[0]?.[0] ?? '') + (words[1]?.[0] ?? '')).toUpperCase();
  }
  return s.slice(0, 2).toUpperCase() || '?';
}

// ---------------------------------------------------------------------------
// Row components
// ---------------------------------------------------------------------------

function SentRow({ msg }: { msg: { kind: 'real' } & MessageResponse }) {
  const abbr = initials(msg.authorId);
  return (
    <article className="group px-4 py-2 flex gap-3.5 hover:bg-white/[0.03] transition-colors rounded-md">
      {/* Avatar */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5"
        style={{ backgroundColor: '#3f3f46', color: 'rgba(255,255,255,0.92)' }}
        aria-hidden="true"
      >
        {abbr}
      </div>
      <div className="flex flex-col w-full min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-medium text-sm" style={{ color: 'rgba(255,255,255,0.92)' }}>
            {msg.authorId}
          </span>
          <span
            className="text-xs font-medium tracking-wide"
            style={{ color: 'rgba(255,255,255,0.40)' }}
          >
            {formatTime(msg.createdAt)}
          </span>
        </div>
        <p className="text-sm leading-relaxed mt-0.5" style={{ color: 'rgba(255,255,255,0.80)' }}>
          {msg.content}
        </p>
      </div>
    </article>
  );
}

function PendingRow({ msg }: { msg: { kind: 'optimistic' } & OptimisticMessage }) {
  return (
    <article
      aria-busy="true"
      data-testid="pending-message"
      className="group px-4 py-2 flex gap-3.5 rounded-md"
      style={{ borderLeft: '2px solid rgba(245,158,11,0.5)' }}
    >
      {/* Avatar — dimmed */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5"
        style={{
          backgroundColor: '#3f3f46',
          color: 'rgba(255,255,255,0.92)',
          opacity: 0.6,
        }}
        aria-hidden="true"
      >
        {initials(msg.authorDisplay)}
      </div>
      <div className="flex flex-col w-full min-w-0">
        <div className="flex items-baseline gap-2">
          <span
            className="font-medium text-sm"
            style={{ color: 'rgba(255,255,255,0.92)', opacity: 0.6 }}
          >
            {msg.authorDisplay}
          </span>
          {/* Status label at full opacity so amber stays ≥4.5:1 (WCAG AA) */}
          <span
            className="text-xs font-semibold tracking-wide flex items-center gap-1"
            style={{ color: '#f59e0b' }}
          >
            <ClockIcon size={13} />
            Sending…
          </span>
        </div>
        <p
          className="text-sm leading-relaxed mt-0.5"
          style={{ color: 'rgba(255,255,255,0.80)', opacity: 0.6 }}
        >
          {msg.content}
        </p>
      </div>
    </article>
  );
}

function FailedRow({
  msg,
  onRetry,
}: {
  msg: { kind: 'optimistic' } & OptimisticMessage;
  onRetry: (key: string) => void;
}) {
  return (
    <div
      role="alert"
      data-testid="failed-message"
      className="group px-4 py-2 flex gap-3.5 rounded-md"
      style={{
        border: '1px solid rgba(239,68,68,0.3)',
        backgroundColor: 'rgba(239,68,68,0.05)',
      }}
    >
      {/* Avatar */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5"
        style={{ backgroundColor: '#3f3f46', color: 'rgba(255,255,255,0.92)' }}
        aria-hidden="true"
      >
        {initials(msg.authorDisplay)}
      </div>
      <div className="flex flex-col w-full min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-medium text-sm" style={{ color: 'rgba(255,255,255,0.92)' }}>
            {msg.authorDisplay}
          </span>
          <span
            className="text-xs font-semibold tracking-wide flex items-center gap-1"
            style={{ color: '#fca5a5' }}
          >
            <WarningCircleIcon size={13} />
            Failed to send
          </span>
        </div>
        <p className="text-sm leading-relaxed mt-0.5" style={{ color: 'rgba(255,255,255,0.80)' }}>
          {msg.content}
        </p>
        <div className="mt-1.5 flex items-center gap-3">
          <button
            type="button"
            onClick={() => onRetry(msg.idempotencyKey)}
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold rounded-md px-2.5 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2"
            style={{
              color: '#fca5a5',
              backgroundColor: 'rgba(239,68,68,0.10)',
              border: '1px solid rgba(239,68,68,0.40)',
            }}
            aria-label="Retry sending this message"
          >
            <RetryIcon size={13} />
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty channel state
// ---------------------------------------------------------------------------

function EmptyChannelState({ channelName }: { channelName?: string }) {
  return (
    <div
      data-testid="empty-channel-state"
      className="flex-1 flex flex-col items-center justify-center text-center px-6 select-none"
    >
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
        style={{ backgroundColor: 'rgba(39,39,42,0.60)' }}
        aria-hidden="true"
      >
        <ChatsCircleIcon size={32} style={{ color: 'rgba(255,255,255,0.40)' }} />
      </div>
      <h3
        className="text-xl font-semibold tracking-tight"
        style={{ color: 'rgba(255,255,255,0.92)' }}
      >
        No messages yet
      </h3>
      <p className="text-sm mt-1.5 max-w-xs" style={{ color: 'rgba(255,255,255,0.40)' }}>
        Start the conversation — your first message kicks off{' '}
        {channelName ? (
          <span style={{ color: 'rgba(255,255,255,0.70)', fontWeight: 500 }}>#{channelName}</span>
        ) : (
          'this channel'
        )}
        .
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MessageList
// ---------------------------------------------------------------------------

export function MessageList({
  messages,
  loadingInitial,
  loadingOlder,
  errorInitial,
  hasOlderMessages,
  onLoadOlder,
  onRetry,
  channelName,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(0);

  // Scroll to bottom when new messages arrive (not when loading older ones)
  useEffect(() => {
    const prevLen = prevLengthRef.current;
    const curLen = messages.length;
    // Only auto-scroll when appending new messages (not loading older)
    if (curLen > prevLen && !loadingOlder) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevLengthRef.current = curLen;
  }, [messages.length, loadingOlder]);

  // Initial scroll to bottom on first load — intentionally omits messages.length
  // from deps so it only fires on the loadingInitial → false transition, not on
  // every incoming message (the above effect handles that).
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional one-shot scroll
  useEffect(() => {
    if (!loadingInitial && messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'instant' });
    }
  }, [loadingInitial]);

  // Scroll-up detection for load-older
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    function handleScroll() {
      if (!el) return;
      // Trigger when scrolled within 80px of the top
      if (el.scrollTop < 80 && hasOlderMessages && !loadingOlder) {
        onLoadOlder();
      }
    }
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [hasOlderMessages, loadingOlder, onLoadOlder]);

  // ── Loading initial fetch ──────────────────────────────────────────────────
  if (loadingInitial) {
    return (
      <div
        className="flex-1 flex items-center justify-center"
        style={{ color: 'rgba(255,255,255,0.30)' }}
      >
        <SpinnerIcon size={24} className="animate-spin" />
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (errorInitial) {
    return (
      <div className="flex-1 flex items-center justify-center px-6">
        <p className="text-sm text-center" style={{ color: 'rgba(255,255,255,0.40)' }}>
          Couldn&apos;t load messages. Check your connection and try again.
        </p>
      </div>
    );
  }

  // ── Empty state — rendered IN PLACE of the list ───────────────────────────
  if (messages.length === 0) {
    return <EmptyChannelState {...(channelName ? { channelName } : {})} />;
  }

  // ── Message list ──────────────────────────────────────────────────────────
  return (
    <div
      ref={listRef}
      role="log"
      aria-live="polite"
      aria-label={`Messages${channelName ? ` in #${channelName}` : ''}`}
      data-testid="message-list"
      className="flex-1 overflow-y-auto px-1 py-4 flex flex-col gap-1 select-text"
    >
      {/* Load-older affordance at top */}
      {hasOlderMessages && (
        <output
          aria-live="polite"
          className="flex items-center justify-center py-2"
          style={{ color: 'rgba(255,255,255,0.40)' }}
        >
          {loadingOlder ? (
            <>
              <SpinnerIcon size={14} className="animate-spin mr-2" />
              <span className="text-xs tracking-wide">Loading older messages…</span>
            </>
          ) : (
            <button
              type="button"
              onClick={onLoadOlder}
              className="text-xs tracking-wide underline focus-visible:outline-none focus-visible:ring-2 rounded"
              style={{ color: 'rgba(255,255,255,0.40)' }}
            >
              Load older messages
            </button>
          )}
        </output>
      )}

      {/* Message rows */}
      {messages.map((msg) => {
        if (msg.kind === 'real') {
          return <SentRow key={msg.id} msg={msg} />;
        }
        if (msg.state === 'pending') {
          return <PendingRow key={msg.idempotencyKey} msg={msg} />;
        }
        return <FailedRow key={msg.idempotencyKey} msg={msg} onRetry={onRetry} />;
      })}

      {/* Scroll anchor */}
      <div ref={bottomRef} />
    </div>
  );
}
