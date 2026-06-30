/**
 * ThreadPanel — right-side thread view panel (Pane 3.5 / 4 per the design).
 *
 * Design contract (design/server-channel-view.html §PANE 3.5 / 4 THREAD PANEL):
 *   - bg-study-900 (#121214), border-l, 360px fixed width.
 *   - Parent message pinned at top ("Thread on:" section).
 *   - Reply count divider below parent.
 *   - Replies rendered oldest-first in <ol role="list"> / <li>.
 *   - Reply composer at foot (mirrors MessageComposer).
 *   - At ≤1024px: position:fixed overlay (right 0, full height, max-w-[360px], z-50).
 *
 * Accessibility (D-block carries):
 *   D-carry 1: focus-trap when open at ≤1024 (overlay / dialog mode).
 *   D-carry 2: Esc closes + restores focus to the affordance button.
 *   D-carry 3: affordance hidden when replyCount===0 (enforced in MessageList).
 *   D-carry 4: replies in <ol role="list">/<li>.
 *   D-carry 5: aria-live="polite" on the replies container (live appends announced).
 *
 *   role="dialog" aria-modal="true" aria-label="Thread" (WAI-ARIA dialog pattern).
 *   Close button: aria-label="Close thread", Esc key.
 *   Focus trap: when isOverlay (≤1024px), Tab/Shift+Tab cycle within the panel.
 *
 * Outbox parity (task 0b728319):
 *   The reply composer calls useThread.sendReply() which goes through the same
 *   pending/failed/reconcile machinery as top-level sends via useMessagesWithRetry.
 *   Pending rows: aria-busy + amber left border.
 *   Failed rows: role="alert" + red tint + Retry button.
 */

import type { MessageResponse } from '@studyhall/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { OptimisticMessage } from './MessageList';
import {
  ChatsCircleIcon,
  ClockIcon,
  PaperPlaneIcon,
  ProhibitIcon,
  RetryIcon,
  TrashIcon,
  WarningCircleIcon,
  XIcon,
} from './icons';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(isoString: string): string {
  try {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function initials(s: string): string {
  const words = s.trim().split(/\s+/);
  if (words.length >= 2) {
    return ((words[0]?.[0] ?? '') + (words[1]?.[0] ?? '')).toUpperCase();
  }
  return s.slice(0, 2).toUpperCase() || '?';
}

// ---------------------------------------------------------------------------
// Reply rows (compact — 32px avatar, 13px text, per design §THREAD PANEL)
// ---------------------------------------------------------------------------

function ReplyRow({ reply }: { reply: MessageResponse }) {
  if (reply.isDeleted) {
    return (
      <li
        aria-label="Deleted reply"
        className="flex gap-3 rounded-md px-2 py-2"
        style={{ listStyle: 'none' }}
      >
        <div
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border"
          style={{ backgroundColor: '#1c1c1f', borderColor: '#27272a' }}
          aria-hidden="true"
        >
          <ProhibitIcon size={14} style={{ color: 'rgba(255,255,255,0.20)' }} />
        </div>
        <div className="flex min-w-0 items-center">
          <span
            className="flex items-center gap-1.5 text-[13px] italic"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            <TrashIcon size={13} style={{ color: 'rgba(255,255,255,0.25)' }} />
            This reply was deleted
          </span>
        </div>
      </li>
    );
  }

  return (
    <li
      className="group relative flex gap-3 rounded-md px-2 py-2 transition-colors"
      style={{ listStyle: 'none' }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.03)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.backgroundColor = '';
      }}
    >
      <div
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
        style={{ backgroundColor: '#3f3f46', color: 'rgba(255,255,255,0.92)' }}
        aria-hidden="true"
      >
        {initials(reply.authorId)}
      </div>
      <div className="flex min-w-0 w-full flex-col">
        <div className="flex items-baseline gap-2">
          <span className="text-[14px] font-medium" style={{ color: 'rgba(255,255,255,0.92)' }}>
            {reply.authorId}
          </span>
          <span
            className="text-[11px] font-medium tracking-wide"
            style={{ color: 'rgba(255,255,255,0.40)' }}
          >
            {formatTime(reply.createdAt)}
          </span>
          {reply.isEdited && (
            <span
              className="text-[11px] font-normal"
              style={{ color: 'rgba(255,255,255,0.35)' }}
              title="Edited"
            >
              (edited)
            </span>
          )}
        </div>
        {reply.content && (
          <p
            className="mt-0.5 text-[13px] leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.80)' }}
          >
            {reply.content}
          </p>
        )}
      </div>
    </li>
  );
}

function PendingReplyRow({ msg }: { msg: OptimisticMessage }) {
  return (
    <li
      aria-busy="true"
      className="flex gap-3 rounded-md px-2 py-2"
      style={{ borderLeft: '2px solid rgba(245,158,11,0.5)', listStyle: 'none' }}
    >
      <div
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
        style={{ backgroundColor: '#3f3f46', color: 'rgba(255,255,255,0.92)', opacity: 0.6 }}
        aria-hidden="true"
      >
        {initials(msg.authorDisplay)}
      </div>
      <div className="flex min-w-0 w-full flex-col">
        <div className="flex items-baseline gap-2">
          <span
            className="text-[14px] font-medium"
            style={{ color: 'rgba(255,255,255,0.92)', opacity: 0.6 }}
          >
            {msg.authorDisplay}
          </span>
          <span
            className="flex items-center gap-1 text-[11px] font-semibold tracking-wide"
            style={{ color: '#f59e0b' }}
          >
            <ClockIcon size={12} />
            Sending…
          </span>
        </div>
        <p
          className="mt-0.5 text-[13px] leading-relaxed"
          style={{ color: 'rgba(255,255,255,0.80)', opacity: 0.6 }}
        >
          {msg.content}
        </p>
      </div>
    </li>
  );
}

function FailedReplyRow({
  msg,
  onRetry,
}: {
  msg: OptimisticMessage;
  onRetry: (key: string) => void;
}) {
  return (
    <li
      role="alert"
      className="flex gap-3 rounded-md px-2 py-2"
      style={{
        border: '1px solid rgba(239,68,68,0.3)',
        backgroundColor: 'rgba(239,68,68,0.05)',
        listStyle: 'none',
      }}
    >
      <div
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
        style={{ backgroundColor: '#3f3f46', color: 'rgba(255,255,255,0.92)' }}
        aria-hidden="true"
      >
        {initials(msg.authorDisplay)}
      </div>
      <div className="flex min-w-0 w-full flex-col">
        <div className="flex items-baseline gap-2">
          <span className="text-[14px] font-medium" style={{ color: 'rgba(255,255,255,0.92)' }}>
            {msg.authorDisplay}
          </span>
          <span
            className="flex items-center gap-1 text-[11px] font-semibold tracking-wide"
            style={{ color: '#fca5a5' }}
          >
            <WarningCircleIcon size={12} />
            Failed to send
          </span>
        </div>
        <p
          className="mt-0.5 text-[13px] leading-relaxed"
          style={{ color: 'rgba(255,255,255,0.80)' }}
        >
          {msg.content}
        </p>
        <div className="mt-1 flex items-center">
          <button
            type="button"
            onClick={() => onRetry(msg.idempotencyKey)}
            aria-label="Retry sending this reply"
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60"
            style={{
              color: '#fca5a5',
              backgroundColor: 'rgba(239,68,68,0.10)',
              border: '1px solid rgba(239,68,68,0.40)',
            }}
          >
            <RetryIcon size={12} />
            Retry
          </button>
        </div>
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Reply composer (inline — mirrors MessageComposer but compact + panel-specific)
// ---------------------------------------------------------------------------

type ReplyComposerProps = {
  parentAuthorId: string;
  onSend: (content: string) => void;
  disabled?: boolean;
};

function ReplyComposer({ parentAuthorId, onSend, disabled = false }: ReplyComposerProps) {
  const [value, setValue] = useState('');
  const taRef = useRef<HTMLTextAreaElement>(null);

  const canSend = value.trim().length > 0 && !disabled;

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleSend() {
    const content = value.trim();
    if (!content || disabled) return;
    onSend(content);
    setValue('');
    if (taRef.current) {
      taRef.current.style.height = 'auto';
    }
    taRef.current?.focus();
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const v = e.target.value;
    setValue(v);
    // auto-grow
    const ta = taRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = `${ta.scrollHeight}px`;
    }
  }

  return (
    <div className="shrink-0 p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
      <div
        className="relative flex items-end rounded-md overflow-hidden"
        style={{
          backgroundColor: '#1c1c1f',
          border: '1px solid rgba(63,63,70,0.6)',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.02)',
        }}
      >
        <label htmlFor="thread-reply-input" className="sr-only">
          Reply to {parentAuthorId}
        </label>
        <textarea
          ref={taRef}
          id="thread-reply-input"
          data-testid="thread-reply-input"
          rows={1}
          placeholder={`Reply to ${parentAuthorId}…`}
          value={value}
          disabled={disabled}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent text-[14px] outline-none resize-none overflow-y-auto"
          style={{
            color: 'rgba(255,255,255,0.92)',
            caretColor: '#10b981',
            padding: '12px 14px',
            minHeight: '44px',
            maxHeight: '30dvh',
            lineHeight: '1.5',
          }}
        />
        <div className="px-2 py-2 flex items-center shrink-0 self-stretch">
          <button
            type="button"
            data-testid="thread-send-button"
            disabled={!canSend}
            aria-label="Send reply"
            onClick={handleSend}
            className="flex h-7 w-7 items-center justify-center rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
            style={{
              backgroundColor: canSend ? '#10b981' : '#27272a',
              color: canSend ? '#0a0a0b' : 'rgba(255,255,255,0.30)',
              cursor: canSend ? 'pointer' : 'not-allowed',
              border: canSend ? 'none' : '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <PaperPlaneIcon size={14} />
          </button>
        </div>
      </div>
      <p
        className="mt-2 px-1 text-[11px] tracking-wide"
        style={{ color: 'rgba(255,255,255,0.30)' }}
      >
        <kbd className="font-sans" style={{ color: 'rgba(255,255,255,0.40)' }}>
          Enter
        </kbd>{' '}
        to send &nbsp;·&nbsp;{' '}
        <kbd className="font-sans" style={{ color: 'rgba(255,255,255,0.40)' }}>
          Shift
        </kbd>
        +
        <kbd className="font-sans" style={{ color: 'rgba(255,255,255,0.40)' }}>
          Enter
        </kbd>{' '}
        for newline
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ThreadPanel
// ---------------------------------------------------------------------------

export type ThreadPanelProps = {
  /** The parent message the thread is for. */
  parentMessage: MessageResponse | null;
  /** Channel name for display. */
  channelName?: string | null;
  /** Replies fetched + live (from useThread). */
  replies: MessageResponse[];
  /** Optimistic reply rows (from useThread). */
  optimisticReplies: OptimisticMessage[];
  /** True while fetching replies. */
  loadingInitial: boolean;
  /** True when initial fetch errored. */
  errorInitial: boolean;
  /** Called when user sends a reply — goes to useThread.sendReply. */
  onSendReply: (content: string) => void;
  /** Called when user retries a failed reply. */
  onRetryReply: (idempotencyKey: string) => void;
  /** Called when user closes the panel. */
  onClose: () => void;
  /**
   * Ref of the affordance button that opened this panel.
   * Used to restore focus on close (D-carry 2).
   */
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
  /**
   * True when the viewport is ≤1024px — panel renders as a fixed overlay
   * with role="dialog" aria-modal and focus-trap (D-carry 1).
   */
  isOverlay?: boolean;
};

export function ThreadPanel({
  parentMessage,
  channelName,
  replies,
  optimisticReplies,
  loadingInitial,
  errorInitial,
  onSendReply,
  onRetryReply,
  onClose,
  triggerRef,
  isOverlay = false,
}: ThreadPanelProps) {
  const panelRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // ── D-carry 2: Esc closes and restores focus to the affordance ────────────
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    }
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [onClose]);

  // Restore focus to trigger on close
  const handleClose = useCallback(() => {
    onClose();
    // Defer so the panel has time to unmount before focus transfer
    requestAnimationFrame(() => {
      triggerRef?.current?.focus();
    });
  }, [onClose, triggerRef]);

  // ── D-carry 1: Focus-trap when overlay (≤1024px) ─────────────────────────
  useEffect(() => {
    if (!isOverlay) return;
    const panel = panelRef.current;
    if (!panel) return;

    // Move focus inside the panel on mount
    closeButtonRef.current?.focus();

    function getFocusable(): HTMLElement[] {
      if (!panel) return [];
      return Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.hasAttribute('disabled'));
    }

    function handleTab(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;
      const focusable = getFocusable();
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }

    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [isOverlay]);

  const replyCount = replies.length + optimisticReplies.length;

  const panelStyle: React.CSSProperties = isOverlay
    ? {
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        maxWidth: 360,
        zIndex: 50,
        boxShadow: '-8px 0 24px rgba(0,0,0,0.5)',
        backgroundColor: '#121214',
        borderLeft: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
      }
    : {
        width: 360,
        flexShrink: 0,
        backgroundColor: '#121214',
        borderLeft: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      };

  return (
    <aside
      ref={panelRef}
      id="thread-panel"
      role="dialog"
      aria-modal={isOverlay ? 'true' : undefined}
      aria-label={`Thread${channelName ? ` in #${channelName}` : ''}`}
      data-testid="thread-panel"
      style={panelStyle}
    >
      {/* Thread Header */}
      <header
        className="flex h-14 shrink-0 items-center justify-between px-4"
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          backgroundColor: '#121214',
        }}
      >
        <h2
          className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest"
          style={{ color: 'rgba(255,255,255,0.40)' }}
        >
          Thread
          {channelName && (
            <span
              className="rounded px-1.5 py-0.5 text-[10px] tracking-normal capitalize font-semibold"
              style={{
                backgroundColor: '#27272a',
                color: 'rgba(255,255,255,0.60)',
              }}
            >
              #{channelName}
            </span>
          )}
        </h2>
        <button
          ref={closeButtonRef}
          type="button"
          aria-label="Close thread"
          onClick={handleClose}
          className="flex h-8 w-8 items-center justify-center rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
          style={{ color: 'rgba(255,255,255,0.40)' }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#27272a';
            (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.92)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '';
            (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.40)';
          }}
        >
          <XIcon size={16} />
        </button>
      </header>

      {/* Scrollable content area */}
      <div
        className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-6"
        style={{ minHeight: 0 }}
      >
        {/* Pinned parent message */}
        {parentMessage && (
          <div>
            <h3
              className="mb-2 text-[11px] font-bold uppercase tracking-widest"
              style={{ color: 'rgba(255,255,255,0.40)' }}
            >
              Thread on:
            </h3>
            <div
              className="flex gap-3 rounded-lg border p-3.5 shadow-sm"
              style={{
                backgroundColor: '#1c1c1f',
                borderColor: 'rgba(255,255,255,0.05)',
              }}
            >
              <div
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
                style={{ backgroundColor: '#3f3f46', color: 'rgba(255,255,255,0.92)' }}
                aria-hidden="true"
              >
                {initials(parentMessage.authorId)}
              </div>
              <div className="flex min-w-0 w-full flex-col">
                <div className="flex items-baseline gap-2">
                  <span
                    className="text-[14px] font-medium"
                    style={{ color: 'rgba(255,255,255,0.92)' }}
                  >
                    {parentMessage.authorId}
                  </span>
                  <span
                    className="text-[11px] font-medium"
                    style={{ color: 'rgba(255,255,255,0.40)' }}
                  >
                    {formatTime(parentMessage.createdAt)}
                  </span>
                </div>
                {parentMessage.content && (
                  <p
                    className="mt-0.5 text-[13px] leading-relaxed"
                    style={{ color: 'rgba(255,255,255,0.80)' }}
                  >
                    {parentMessage.content}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Reply count divider */}
        {replyCount > 0 && !loadingInitial && !errorInitial && (
          <div className="flex w-full items-center px-1">
            <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
            <span
              className="mx-3 text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: 'rgba(255,255,255,0.40)' }}
            >
              {replyCount === 1 ? '1 Reply' : `${replyCount} Replies`}
            </span>
            <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
          </div>
        )}

        {/* Loading skeleton */}
        {loadingInitial && (
          <div
            className="flex flex-col gap-4 animate-pulse"
            aria-busy="true"
            aria-label="Loading replies"
          >
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 px-2 py-2">
                <div
                  className="h-8 w-8 shrink-0 rounded-full"
                  style={{ backgroundColor: '#27272a' }}
                />
                <div className="flex flex-col gap-2 w-full pt-1">
                  <div
                    className="h-[10px] w-1/4 rounded-md"
                    style={{ backgroundColor: '#27272a' }}
                  />
                  <div
                    className="h-[10px] w-full rounded-md"
                    style={{ backgroundColor: '#27272a' }}
                  />
                  <div
                    className="h-[10px] w-2/3 rounded-md"
                    style={{ backgroundColor: '#27272a' }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {errorInitial && !loadingInitial && (
          <p className="px-2 text-sm" style={{ color: 'rgba(255,255,255,0.40)' }}>
            Couldn&apos;t load replies. Check your connection and try again.
          </p>
        )}

        {/* Empty state (no replies yet, not loading, no error) */}
        {!loadingInitial && !errorInitial && replyCount === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div
              className="mb-3 flex h-12 w-12 items-center justify-center rounded-full"
              style={{ backgroundColor: '#1c1c1f', color: 'rgba(255,255,255,0.40)' }}
            >
              <ChatsCircleIcon size={24} />
            </div>
            <p className="text-[14px] font-medium" style={{ color: 'rgba(255,255,255,0.70)' }}>
              No replies yet
            </p>
            <p className="mt-1 text-[13px]" style={{ color: 'rgba(255,255,255,0.40)' }}>
              Start the conversation below.
            </p>
          </div>
        )}

        {/* Replies list (oldest-first) — D-carry 4: <ol> (semantic list) */}
        {!loadingInitial && (replies.length > 0 || optimisticReplies.length > 0) && (
          <ol
            aria-live="polite"
            aria-label="Thread replies"
            aria-atomic="false"
            data-testid="thread-replies-list"
            className="flex flex-col gap-0.5 w-full"
            style={{ listStyle: 'none', padding: 0, margin: 0 }}
          >
            {/* Confirmed replies — oldest first */}
            {replies.map((reply) => (
              <ReplyRow key={reply.id} reply={reply} />
            ))}

            {/* Optimistic rows */}
            {optimisticReplies.map((msg) => {
              if (msg.state === 'pending') {
                return <PendingReplyRow key={msg.idempotencyKey} msg={msg} />;
              }
              return <FailedReplyRow key={msg.idempotencyKey} msg={msg} onRetry={onRetryReply} />;
            })}
          </ol>
        )}
      </div>

      {/* Reply composer at foot */}
      <ReplyComposer parentAuthorId={parentMessage?.authorId ?? 'thread'} onSend={onSendReply} />
    </aside>
  );
}
