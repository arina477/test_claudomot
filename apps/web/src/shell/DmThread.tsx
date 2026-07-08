/**
 * DmThread — the message thread for an open DM conversation.
 *
 * Design: design/direct-messages.html §PANEL 3.
 * Renders using the same row patterns as MessageList (pending/failed/real).
 * - Thread header: participant name(s) + presence dot + ConnectionStateIndicator.
 * - Scrollable message log (role="log", aria-live="polite").
 * - Load-older affordance at top (scroll up → load older).
 * - Empty thread state (no messages yet).
 * - Loading / error states.
 * - Composer: reuses MessageComposer pattern (simple textarea + send, no
 *   attachment or @mention for this wave).
 *
 * wave-46 M8 task 1ceffdc9.
 */

import type { DmConversation } from '@studyhall/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import { DmEncryptionIndicator } from './DmEncryptionIndicator';
import type { ConversationCryptoCapability } from './dmEncryptionState';
import { headerStateFor } from './dmEncryptionState';
import { ClockIcon, RetryIcon, SpinnerIcon, WarningCircleIcon } from './icons';
import type { DisplayDmMessage, OptimisticDmMessage } from './useDm';

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

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || '?';
}

// ---------------------------------------------------------------------------
// Message row variants
// ---------------------------------------------------------------------------

type RealDmMessage = Extract<DisplayDmMessage, { kind: 'real' }>;

function RealRow({
  msg,
  participantMap,
}: {
  msg: RealDmMessage;
  /** Map from userId → displayName, built from conversation.participants. */
  participantMap: Map<string, string>;
}) {
  const displayName = participantMap.get(msg.authorId) ?? 'Unknown user';
  const abbr = initials(displayName);
  const cannotDecrypt = msg.encryptionState === 'cannot-decrypt';
  // Encrypted rows carry no sub-badge (the header badge covers the whole thread);
  // every non-encrypted / cannot-decrypt row shows an HONEST per-message affordance.
  const showMsgIndicator = msg.encryptionState !== 'encrypted';

  return (
    <article
      data-testid={`dm-message-row-${msg.id}`}
      data-encryption-state={msg.encryptionState}
      className="group flex gap-4 py-1 rounded-md -mx-2 px-2 transition-colors"
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.03)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.backgroundColor = '';
      }}
    >
      <div
        className="w-[40px] h-[40px] shrink-0 mt-1 rounded-full flex items-center justify-center text-xs font-semibold"
        style={{
          backgroundColor: '#3f3f46',
          color: 'rgba(255,255,255,0.92)',
          opacity: cannotDecrypt ? 0.6 : 1,
        }}
        aria-hidden="true"
      >
        {abbr}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span
            className="text-sm font-medium"
            style={{ color: 'rgba(255,255,255,0.92)', opacity: cannotDecrypt ? 0.6 : 1 }}
          >
            {displayName}
          </span>
          <time className="text-xs" style={{ color: 'rgba(255,255,255,0.40)' }}>
            {formatTime(msg.createdAt)}
          </time>
        </div>
        {cannotDecrypt ? (
          // Undecryptable payload shell — calm, no crash, no plaintext leaked.
          <div
            className="mt-1 px-3 py-2 rounded-md max-w-sm"
            style={{ backgroundColor: '#27272a', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <span
              className="italic font-mono text-[11px] break-all leading-tight"
              style={{ color: 'rgba(255,255,255,0.40)' }}
            >
              [encrypted payload unavailable]
            </span>
          </div>
        ) : (
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.80)' }}>
            {msg.displayContent ?? msg.content}
          </p>
        )}
        {showMsgIndicator && (
          <DmEncryptionIndicator state={msg.encryptionState} placement="message" />
        )}
      </div>
    </article>
  );
}

function PendingRow({
  msg,
}: {
  msg: { kind: 'optimistic' } & OptimisticDmMessage;
}) {
  const abbr = initials(msg.authorDisplay);
  return (
    <article
      aria-busy="true"
      data-testid="dm-pending-message"
      className="flex gap-4 py-1 rounded-md -mx-2 px-2"
      style={{ borderLeft: '2px solid rgba(245,158,11,0.5)' }}
    >
      <div
        className="w-[40px] h-[40px] shrink-0 mt-1 rounded-full flex items-center justify-center text-xs font-semibold"
        style={{ backgroundColor: '#3f3f46', color: 'rgba(255,255,255,0.92)', opacity: 0.6 }}
        aria-hidden="true"
      >
        {abbr}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span
            className="text-sm font-medium"
            style={{ color: 'rgba(255,255,255,0.92)', opacity: 0.6 }}
          >
            {msg.authorDisplay}
          </span>
          <span
            className="flex items-center gap-1 text-xs font-semibold"
            style={{ color: '#f59e0b' }}
          >
            <ClockIcon size={13} />
            Sending…
          </span>
        </div>
        <p
          className="text-sm leading-relaxed"
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
  msg: { kind: 'optimistic' } & OptimisticDmMessage;
  onRetry: (key: string) => void;
}) {
  const abbr = initials(msg.authorDisplay);
  return (
    <div
      role="alert"
      data-testid="dm-failed-message"
      className="flex gap-4 py-1 rounded-md -mx-2 px-2"
      style={{
        border: '1px solid rgba(239,68,68,0.3)',
        backgroundColor: 'rgba(239,68,68,0.05)',
      }}
    >
      <div
        className="w-[40px] h-[40px] shrink-0 mt-1 rounded-full flex items-center justify-center text-xs font-semibold"
        style={{ backgroundColor: '#3f3f46', color: 'rgba(255,255,255,0.92)' }}
        aria-hidden="true"
      >
        {abbr}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.92)' }}>
            {msg.authorDisplay}
          </span>
          <span
            className="flex items-center gap-1 text-xs font-semibold"
            style={{ color: '#fca5a5' }}
          >
            <WarningCircleIcon size={13} />
            Failed to send
          </span>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.80)' }}>
          {msg.content}
        </p>
        <button
          type="button"
          onClick={() => onRetry(msg.idempotencyKey)}
          aria-label="Retry sending this message"
          className="mt-1 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2"
          style={{
            color: '#fca5a5',
            backgroundColor: 'rgba(239,68,68,0.10)',
            border: '1px solid rgba(239,68,68,0.40)',
          }}
        >
          <RetryIcon size={13} />
          Retry
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Thread header
// ---------------------------------------------------------------------------

type ThreadHeaderProps = {
  conversation: DmConversation;
  currentUserId: string | null;
  onToggleDrawer?: () => void;
  /** Number of pending outbox messages (shows offline indicator). */
  pendingCount: number;
  /** E2E capability of this conversation — drives the honest header badge. */
  encryptionCapability: ConversationCryptoCapability;
};

function ThreadHeader({
  conversation,
  currentUserId,
  onToggleDrawer,
  pendingCount,
  encryptionCapability,
}: ThreadHeaderProps) {
  const others = conversation.participants.filter((p) => p.userId !== currentUserId);
  const displayName = conversation.isGroup
    ? others
        .slice(0, 3)
        .map((p) => p.displayName)
        .join(', ')
    : (others[0]?.displayName ?? conversation.participants[0]?.displayName ?? 'Conversation');

  const firstOther = others[0];
  const online = firstOther?.presence === 'online';
  const presenceKnown = firstOther?.presence !== undefined;

  return (
    <header
      className="h-[56px] px-4 flex items-center justify-between shrink-0 z-10"
      style={{
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        backgroundColor: '#1c1c1f',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
      }}
    >
      {/* Mobile drawer toggle */}
      {onToggleDrawer && (
        <button
          type="button"
          onClick={onToggleDrawer}
          aria-label="Toggle conversation list"
          className="mr-3 lg:hidden rounded transition-colors focus:outline-none focus-visible:ring-2"
          style={{ color: 'rgba(255,255,255,0.60)' }}
        >
          <svg width="20" height="20" viewBox="0 0 256 256" fill="none" aria-hidden="true">
            <path
              d="M32 64h192M32 128h192M32 192h192"
              stroke="currentColor"
              strokeWidth="20"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}

      {/* Participant info */}
      <div className="flex items-center gap-3">
        <div className="relative shrink-0" aria-hidden="true">
          <div
            className="w-[28px] h-[28px] rounded-full flex items-center justify-center text-xs font-semibold"
            style={{ backgroundColor: '#3f3f46', color: 'rgba(255,255,255,0.92)' }}
          >
            {initials(displayName)}
          </div>
          {presenceKnown && (
            <div
              className="absolute -bottom-0.5 -right-0.5 w-[10px] h-[10px] rounded-full border-[2px]"
              style={{
                backgroundColor: online ? '#10b981' : '#52525b',
                borderColor: '#1c1c1f',
              }}
            />
          )}
        </div>
        <div>
          <h2
            className="text-base font-semibold tracking-tight leading-none"
            style={{ color: 'rgba(255,255,255,0.92)' }}
          >
            {displayName}
          </h2>
          {presenceKnown && <span className="sr-only">{online ? 'Online' : 'Offline'}</span>}
        </div>
      </div>

      {/* Right side: honest E2E badge + connection/pending wedge */}
      <div className="flex items-center gap-3">
        {/* E2E encryption status — placement 1 (header badge). Defaults to the
            loading/indeterminate state on mount; NEVER a lock without proof. */}
        <DmEncryptionIndicator state={headerStateFor(encryptionCapability)} placement="header" />

        {pendingCount > 0 && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{
              backgroundColor: 'rgba(239,68,68,0.10)',
              border: '1px solid rgba(239,68,68,0.20)',
            }}
          >
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: '#ef4444' }}
              aria-hidden="true"
            />
            <span className="text-xs font-medium" style={{ color: '#f87171' }}>
              Offline — {pendingCount} pending
            </span>
          </div>
        )}
      </div>
    </header>
  );
}

// ---------------------------------------------------------------------------
// DmThread
// ---------------------------------------------------------------------------

type Props = {
  conversation: DmConversation | null;
  messages: DisplayDmMessage[];
  messagesLoading: boolean;
  messagesError: boolean;
  hasOlderMessages: boolean;
  onLoadOlderMessages: () => void;
  onRetryMessage: (idempotencyKey: string) => void;
  onSend: (content: string) => void;
  currentUserId: string | null;
  onToggleDrawer?: () => void;
  /** E2E capability of the open conversation — drives the honest header badge. */
  encryptionCapability: ConversationCryptoCapability;
};

export function DmThread({
  conversation,
  messages,
  messagesLoading,
  messagesError,
  hasOlderMessages,
  onLoadOlderMessages,
  onRetryMessage,
  onSend,
  currentUserId,
  onToggleDrawer,
  encryptionCapability,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(0);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  const pendingCount = messages.filter(
    (m) => m.kind === 'optimistic' && m.state === 'pending',
  ).length;

  // Build a stable authorId → displayName lookup from conversation participants.
  // Used by RealRow to show human-readable names instead of opaque userId strings.
  const participantMap = new Map<string, string>(
    conversation ? conversation.participants.map((p) => [p.userId, p.displayName]) : [],
  );

  // Scroll to bottom on new messages
  useEffect(() => {
    const prev = prevLengthRef.current;
    const cur = messages.length;
    if (cur > prev) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevLengthRef.current = cur;
  }, [messages.length]);

  // Initial scroll to bottom
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional one-shot scroll
  useEffect(() => {
    if (!messagesLoading && messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'instant' });
    }
  }, [messagesLoading]);

  // Load-older on scroll-up
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    function handleScroll() {
      if (!el) return;
      if (el.scrollTop < 80 && hasOlderMessages) {
        onLoadOlderMessages();
      }
    }
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [hasOlderMessages, onLoadOlderMessages]);

  // ── Composer state ─────────────────────────────────────────────────────────
  const [value, setValue] = useDmComposerState('');

  const handleSend = useCallback(() => {
    const content = value.trim();
    if (!content) return;
    onSend(content);
    setValue('');
    if (composerRef.current) composerRef.current.style.height = 'auto';
    composerRef.current?.focus();
  }, [value, onSend, setValue]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  function autoGrow(el: HTMLTextAreaElement) {
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }

  if (!conversation) {
    return (
      <main
        className="flex-1 flex flex-col items-center justify-center bg-surface-800 min-w-0"
        style={{ backgroundColor: '#1c1c1f' }}
        data-testid="dm-no-conversation"
      >
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.40)' }}>
          Select a conversation to start messaging.
        </p>
      </main>
    );
  }

  const canSend = value.trim().length > 0;

  return (
    <main
      className="flex-1 flex flex-col min-w-0 h-full overflow-hidden"
      style={{ backgroundColor: '#1c1c1f' }}
      data-testid="dm-thread"
    >
      <ThreadHeader
        conversation={conversation}
        currentUserId={currentUserId}
        {...(onToggleDrawer !== undefined ? { onToggleDrawer } : {})}
        pendingCount={pendingCount}
        encryptionCapability={encryptionCapability}
      />

      {/* Message area */}
      {messagesLoading ? (
        <div
          className="flex-1 flex flex-col gap-1 px-1 py-4 animate-pulse"
          aria-busy="true"
          aria-label="Loading messages"
          data-testid="dm-messages-skeleton"
        >
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex gap-4 py-1 px-2">
              <div
                className="w-[40px] h-[40px] rounded-full shrink-0 mt-1"
                style={{ backgroundColor: '#27272a' }}
                aria-hidden="true"
              />
              <div className="flex flex-col gap-2 flex-1 pt-1">
                <div
                  className="h-3 rounded-md"
                  style={{ backgroundColor: '#27272a', width: `${[112, 96, 80][i] ?? 96}px` }}
                  aria-hidden="true"
                />
                <div
                  className="h-3 rounded-md"
                  style={{ backgroundColor: '#27272a', width: '75%' }}
                  aria-hidden="true"
                />
              </div>
            </div>
          ))}
        </div>
      ) : messagesError ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center px-6">
            <p className="text-sm mb-3" style={{ color: 'rgba(255,255,255,0.60)' }}>
              Couldn&apos;t load messages.
            </p>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold focus:outline-none focus-visible:ring-2"
              style={{ backgroundColor: '#27272a', color: 'rgba(255,255,255,0.92)' }}
            >
              <SpinnerIcon size={14} />
              Retry
            </button>
          </div>
        </div>
      ) : messages.length === 0 ? (
        <div
          className="flex-1 flex flex-col items-center justify-center text-center px-6"
          data-testid="dm-empty-thread"
        >
          <div
            className="mb-4 w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(39,39,42,0.60)' }}
            aria-hidden="true"
          >
            <svg width="32" height="32" viewBox="0 0 256 256" fill="none" aria-hidden="true">
              <path
                d="M128 28C73.8 28 30 66.5 30 114c0 20.9 8.4 40 22.4 55L44 198l52-12a106 106 0 0 0 32 5c54.2 0 98-38.5 98-86S182.2 28 128 28Z"
                stroke="rgba(255,255,255,0.40)"
                strokeWidth="14"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </div>
          <h3
            className="text-xl font-semibold tracking-tight mb-1.5"
            style={{ color: 'rgba(255,255,255,0.92)' }}
          >
            No messages yet
          </h3>
          <p className="text-sm max-w-xs" style={{ color: 'rgba(255,255,255,0.40)' }}>
            Send a message to start the conversation.
          </p>
          <button
            type="button"
            onClick={() => composerRef.current?.focus()}
            className="mt-5 inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
            style={{ backgroundColor: '#10b981', color: '#0a0a0b' }}
          >
            Send a message
          </button>
        </div>
      ) : (
        <div
          ref={listRef}
          role="log"
          aria-live="polite"
          aria-label="Direct messages"
          data-testid="dm-message-list"
          className="flex-1 overflow-y-auto px-4 lg:px-8 py-4 flex flex-col gap-0"
        >
          {/* Load-older */}
          {hasOlderMessages && (
            <output aria-live="polite" className="flex justify-center py-2">
              <button
                type="button"
                onClick={onLoadOlderMessages}
                className="rounded text-xs underline focus-visible:outline-none focus-visible:ring-2"
                style={{ color: 'rgba(255,255,255,0.40)' }}
              >
                Load older messages
              </button>
            </output>
          )}

          {messages.map((msg) => {
            if (msg.kind === 'real') {
              return <RealRow key={msg.id} msg={msg} participantMap={participantMap} />;
            }
            if (msg.state === 'pending') {
              return <PendingRow key={msg.idempotencyKey} msg={msg} />;
            }
            return <FailedRow key={msg.idempotencyKey} msg={msg} onRetry={onRetryMessage} />;
          })}

          <div ref={bottomRef} />
        </div>
      )}

      {/* Composer */}
      <div
        className="shrink-0 px-4 lg:px-6 pb-6 pt-2"
        style={{ background: 'linear-gradient(to top, #1c1c1f 60%, transparent)' }}
        aria-label="Message composer"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative flex flex-col overflow-hidden rounded-md"
          style={{
            backgroundColor: '#27272a',
            border: '1px solid rgba(63,63,70,0.6)',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
          }}
        >
          <div className="flex items-end w-full">
            <label htmlFor="dm-composer-input" className="sr-only">
              {`Message ${conversation.isGroup ? 'group' : (conversation.participants.find((p) => p.userId !== currentUserId)?.displayName ?? 'DM')}`}
            </label>
            <textarea
              ref={composerRef}
              id="dm-composer-input"
              data-testid="dm-composer-input"
              rows={1}
              placeholder={`Message ${conversation.isGroup ? 'group' : (conversation.participants.find((p) => p.userId !== currentUserId)?.displayName ?? '')}`}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                autoGrow(e.target);
              }}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent text-[14px] outline-none resize-none overflow-y-auto"
              style={{
                color: 'rgba(255,255,255,0.92)',
                caretColor: '#10b981',
                padding: '14px 16px',
                minHeight: '48px',
                maxHeight: '40dvh',
                lineHeight: '1.5',
              }}
            />
            <div
              className="flex shrink-0 items-center self-stretch p-2.5"
              style={{ paddingBottom: '10px' }}
            >
              <button
                type="submit"
                disabled={!canSend}
                aria-label="Send message"
                aria-disabled={!canSend}
                data-testid="dm-send-button"
                className="w-9 h-9 flex items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2"
                style={{
                  backgroundColor: canSend ? '#10b981' : '#27272a',
                  color: canSend ? '#0a0a0b' : 'rgba(255,255,255,0.30)',
                  cursor: canSend ? 'pointer' : 'not-allowed',
                  border: canSend ? 'none' : '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 256 256" fill="none" aria-hidden="true">
                  <path d="M224 128 56 40l24 88-24 88 168-88Z" fill="currentColor" />
                </svg>
              </button>
            </div>
          </div>
        </form>
        <div
          className="text-[11px] mt-2 px-1 tracking-wide"
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
        </div>
      </div>
    </main>
  );
}

// Tiny local hook for composer value to keep types clean
function useDmComposerState(initial: string): [string, (v: string) => void] {
  return useState(initial);
}
