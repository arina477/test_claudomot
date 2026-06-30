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

import { useContext } from 'react';
import { type ConnectionState, ConnectionStateIndicator } from './ConnectionStateIndicator';
import { MessageComposer } from './MessageComposer';
import { MessageList } from './MessageList';
import { ProfileContext } from './ProfileContext';
import { useServers } from './ServerContext';
import { HashIcon, MagnifyingGlassIcon, MenuIcon, PushPinIcon } from './icons';
import { useMessagesWithRetry } from './useMessages';
import { useTyping } from './useTyping';

type Props = {
  connectionState?: ConnectionState;
  onToggleSidebar?: () => void;
};

export function MainColumn({ connectionState = 'online', onToggleSidebar }: Props) {
  const { selectedChannelId, selectedChannelName } = useServers();
  const { profile } = useContext(ProfileContext);

  const {
    messages,
    loadingInitial,
    loadingOlder,
    errorInitial,
    hasOlderMessages,
    loadOlder,
    sendMessage,
    retryMessage,
    editMessage,
    deleteMessage,
    toggleReaction,
  } = useMessagesWithRetry(selectedChannelId);

  // Typing presence — self userId comes from profile (excludes own name from indicator)
  const currentUserId = profile?.username ?? null;
  const { onComposerKeyPress, stopTyping, typingLabel } = useTyping(
    selectedChannelId,
    currentUserId,
  );

  // Wrap sendMessage to also stop typing
  function handleSend(content: string) {
    stopTyping();
    sendMessage(content);
  }

  const displayName = selectedChannelName ?? 'channel';

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
            <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.40)' }}>
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
          onEdit={editMessage}
          onDelete={deleteMessage}
          onReaction={toggleReaction}
          currentUserId={profile?.username ?? null}
          {...(selectedChannelName ? { channelName: selectedChannelName } : {})}
        />
      )}

      {/* Typing indicator + Composer — always visible when a channel is selected */}
      {selectedChannelId && (
        <div className="shrink-0 relative">
          {/* Typing indicator — zero-height container so it floats above the composer */}
          <div
            className="relative w-full pointer-events-none"
            style={{ height: 0, zIndex: 10 }}
            role="status"
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
          </div>

          <MessageComposer
            {...(selectedChannelName ? { channelName: selectedChannelName } : {})}
            onSend={handleSend}
            onKeyPress={onComposerKeyPress}
            onBlur={stopTyping}
          />
        </div>
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
