/**
 * MainColumn — bg-surface-800 channel view with real-time messaging.
 *
 * Wave 12 (M3): wired to the real message list + composer.
 * Wave 14 (M3 presence): typing indicator above composer + typing hook wired to keypress.
 * - Uses useMessagesWithRetry for fetch, optimistic send, real-time socket,
 *   and retry on failure.
 * - Passes selectedChannelId / selectedChannelName from ServerContext.
 * - MessageList: role="log" aria-live="polite", newest at bottom, load-older.
 * - MessageComposer: auto-grow textarea, Enter-to-send + Shift+Enter newline.
 * - Empty-channel state replaces the list when messages=[].
 * - Typing indicator: role="status" aria-live="polite", zero-height when empty,
 *   pulsing dots animation.
 *
 * Design system §8 spec: ChannelHeader + MessageRow (3 states) + Composer.
 */

import type { MessageResponse, ValidatedAttachment } from '@studyhall/shared';
import { useCallback, useContext, useRef, useState } from 'react';
import { AssignmentsPanel } from './AssignmentsPanel';
import { type ConnectionState, ConnectionStateIndicator } from './ConnectionStateIndicator';
import { MessageComposer } from './MessageComposer';
import { MessageList } from './MessageList';
import { ProfileContext } from './ProfileContext';
import { useServers } from './ServerContext';
import { ThreadPanel } from './ThreadPanel';
import { VoiceStudyRoom } from './VoiceStudyRoom';
import { HashIcon, MagnifyingGlassIcon, MenuIcon, PushPinIcon } from './icons';
import { useMessagesWithRetry } from './useMessages';
import { useThread } from './useThread';
import { useTyping } from './useTyping';

type Props = {
  connectionState?: ConnectionState;
  onToggleSidebar?: () => void;
};

export function MainColumn({ connectionState = 'online', onToggleSidebar }: Props) {
  const {
    selectedChannelId,
    selectedChannelName,
    selectedId,
    assignmentsOpen,
    closeAssignments,
    selectedDetail,
  } = useServers();
  const { profile } = useContext(ProfileContext);

  // Resolve the type of the currently selected channel from the server detail.
  // This avoids adding selectedChannelType to ServerContext (minimal blast radius).
  const selectedChannelType: string | null =
    selectedChannelId && selectedDetail
      ? (selectedDetail.categories
          .flatMap((cat) => cat.channels)
          .find((ch) => ch.id === selectedChannelId)?.type ?? null)
      : null;

  // ── Thread panel state ─────────────────────────────────────────────────────
  const [openThreadParent, setOpenThreadParent] = useState<MessageResponse | null>(null);
  // Ref to the affordance button that last opened the panel (for focus-restore on close)
  const threadTriggerRef = useRef<HTMLButtonElement | null>(null);
  // Detect overlay mode (≤1024px) via matchMedia — re-evaluated on render.
  // Guard for environments where matchMedia is not implemented (jsdom in tests).
  const isOverlay =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(max-width: 1024px)').matches;

  const handleOpenThread = useCallback((msg: MessageResponse, triggerEl: HTMLButtonElement) => {
    threadTriggerRef.current = triggerEl;
    setOpenThreadParent(msg);
  }, []);

  const handleCloseThread = useCallback(() => {
    setOpenThreadParent(null);
    // Focus is restored by ThreadPanel via its triggerRef prop
  }, []);

  // useThread: fetch replies + subscribe to live events for the open thread.
  // Also keeps the affordance live-update for replyCount/lastReplyAt
  // (via the useMessages thread:reply:created listener in the channel list).
  const {
    replies,
    optimisticReplies,
    loadingInitial: threadLoadingInitial,
    errorInitial: threadErrorInitial,
    sendReply,
    retryReply,
  } = useThread(openThreadParent?.id ?? null, selectedChannelId);

  const {
    messages,
    loadingInitial,
    loadingOlder,
    errorInitial,
    hasOlderMessages,
    loadOlder,
    reloadMessages,
    sendMessage,
    retryMessage,
    editMessage,
    deleteMessage,
    toggleReaction,
  } = useMessagesWithRetry(selectedChannelId);

  // Ref to the composer wrapper — used so the empty-channel CTA can focus the textarea.
  const composerContainerRef = useRef<HTMLDivElement>(null);
  const focusComposer = useCallback(() => {
    composerContainerRef.current?.querySelector<HTMLTextAreaElement>('textarea')?.focus();
  }, []);

  // Typing presence — self-exclusion is enforced server-side via getTypers(excludeUserId).
  const { onComposerKeyPress, stopTyping, typingLabel } = useTyping(selectedChannelId);

  // Wrap sendMessage to also stop typing and forward attachments
  function handleSend(
    content: string,
    attachments?: ValidatedAttachment[],
    previews?: import('./MessageList').StagedAttachmentPreview[],
  ) {
    stopTyping();
    sendMessage(content, attachments, previews);
  }

  const displayName = selectedChannelName ?? 'channel';

  // triggerRef shape required by ThreadPanel: RefObject<HTMLButtonElement | null>
  // We store the element directly in threadTriggerRef (useRef<HTMLButtonElement | null>)
  // and pass a stable object with the current getter.
  const triggerRefForPanel = {
    get current() {
      return threadTriggerRef.current;
    },
    set current(v: HTMLButtonElement | null) {
      threadTriggerRef.current = v;
    },
  } as React.RefObject<HTMLButtonElement | null>;

  // When assignments panel is open, render it instead of the messaging view
  if (assignmentsOpen) {
    return (
      <main
        data-testid="main-column"
        className="relative flex min-w-0 flex-1"
        style={{ backgroundColor: '#1c1c1f' }}
      >
        <AssignmentsPanel onClose={closeAssignments} />
      </main>
    );
  }

  // When the selected channel is a voice channel, render VoiceStudyRoom
  if (selectedChannelType === 'voice' && selectedChannelId && selectedChannelName) {
    return (
      <main
        data-testid="main-column"
        className="relative flex min-w-0 flex-1"
        style={{ backgroundColor: '#1c1c1f' }}
      >
        <VoiceStudyRoom channelId={selectedChannelId} channelName={selectedChannelName} />
      </main>
    );
  }

  return (
    <main
      data-testid="main-column"
      className="relative flex min-w-0 flex-1"
      style={{ backgroundColor: '#1c1c1f' }}
    >
      {/* ── Channel content (flex-col, takes remaining space) ── */}
      <div className="flex flex-col min-w-0 flex-1 min-h-0">
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
            {selectedChannelId ? displayName : 'Select a channel'}
          </h2>

          {selectedChannelId && (
            <>
              {/* Divider */}
              <div
                aria-hidden="true"
                className="mx-3 h-5 w-px shrink-0"
                style={{ backgroundColor: '#3f3f46' }}
              />

              {/* Topic placeholder */}
              <p
                className="truncate text-[13px] font-medium"
                style={{ color: 'rgba(255,255,255,0.60)' }}
              >
                #{displayName}
              </p>
            </>
          )}

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

        {/* No channel selected — intro state */}
        {!selectedChannelId && (
          <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-12 select-text">
            <div className="flex flex-col items-center gap-3 text-center max-w-sm">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{
                  backgroundColor: '#27272a',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
                aria-hidden="true"
              >
                <HashIcon size={28} />
              </div>
              <h3 className="text-base font-semibold" style={{ color: 'rgba(255,255,255,0.92)' }}>
                Pick a channel
              </h3>
              <p
                className="text-[13px] leading-relaxed"
                style={{ color: 'rgba(255,255,255,0.40)' }}
              >
                Select a channel from the sidebar to start reading and sending messages.
              </p>
            </div>
          </div>
        )}

        {/* Channel selected — message list */}
        {selectedChannelId && (
          <MessageList
            messages={messages}
            loadingInitial={loadingInitial}
            loadingOlder={loadingOlder}
            errorInitial={errorInitial}
            hasOlderMessages={hasOlderMessages}
            onLoadOlder={loadOlder}
            onRetry={retryMessage}
            onRetryLoad={reloadMessages}
            onFocusComposer={focusComposer}
            onEdit={editMessage}
            onDelete={deleteMessage}
            onReaction={toggleReaction}
            currentUserId={profile?.username ?? null}
            viewerUsername={profile?.username ?? null}
            onOpenThread={handleOpenThread}
            openThreadParentId={openThreadParent?.id ?? null}
            {...(selectedChannelName ? { channelName: selectedChannelName } : {})}
          />
        )}

        {/* Typing indicator + Composer — always visible when a channel is selected */}
        {selectedChannelId && (
          <div ref={composerContainerRef} className="shrink-0 relative">
            {/* Typing indicator — zero-height container so it floats above the composer */}
            <output
              className="relative block w-full pointer-events-none"
              style={{ height: 0, zIndex: 10 }}
              aria-live="polite"
              aria-atomic="true"
            >
              {typingLabel && (
                <div
                  className="absolute bottom-2 left-6 flex items-center gap-1.5"
                  style={{ transition: 'opacity 150ms ease' }}
                >
                  <span
                    className="text-[12px] font-medium truncate"
                    style={{ color: 'rgba(255,255,255,0.50)' }}
                  >
                    {typingLabel}
                  </span>
                  {/* Pulsing dots */}
                  <span className="flex items-center gap-[3px]" style={{ marginBottom: 1 }}>
                    <TypingDot delay={0} />
                    <TypingDot delay={150} />
                    <TypingDot delay={300} />
                  </span>
                </div>
              )}
            </output>

            <MessageComposer
              {...(selectedChannelName ? { channelName: selectedChannelName } : {})}
              channelId={selectedChannelId}
              onSend={handleSend}
              onKeyPress={onComposerKeyPress}
              onBlur={stopTyping}
              serverId={selectedId}
            />
          </div>
        )}
      </div>

      {/* ── Thread Panel — sibling column at >1024px; fixed overlay at ≤1024px ── */}
      {openThreadParent && (
        <ThreadPanel
          parentMessage={openThreadParent}
          channelName={selectedChannelName}
          replies={replies}
          optimisticReplies={optimisticReplies}
          loadingInitial={threadLoadingInitial}
          errorInitial={threadErrorInitial}
          onSendReply={sendReply}
          onRetryReply={retryReply}
          onClose={handleCloseThread}
          triggerRef={triggerRefForPanel}
          isOverlay={isOverlay}
        />
      )}
    </main>
  );
}

/** Single animated dot for the typing indicator. */
function TypingDot({ delay }: { delay: number }) {
  return (
    <span
      className="typing-dot"
      style={{
        display: 'inline-block',
        width: 3,
        height: 3,
        borderRadius: '50%',
        backgroundColor: 'rgba(255,255,255,0.40)',
        animationDelay: `${delay}ms`,
      }}
    />
  );
}
