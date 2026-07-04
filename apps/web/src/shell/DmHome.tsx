/**
 * DmHome — top-level DM surface.
 *
 * Composes: DmConversationList (left rail) + DmThread (right thread canvas)
 * + StartDmPicker (modal, lazy-mounted when open).
 *
 * Reachable from the server rail's DM-home icon button (chat teardrop icon).
 * Acts as the entry point for the entire DM feature.
 *
 * wave-46 M8 task 1ceffdc9.
 */

import { useContext, useRef, useState } from 'react';
import { DmConversationList } from './DmConversationList';
import { DmThread } from './DmThread';
import { ProfileContext } from './ProfileContext';
import { useServers } from './ServerContext';
import { StartDmPicker } from './StartDmPicker';
import { useDm } from './useDm';

export function DmHome() {
  const { profile } = useContext(ProfileContext);
  const { selectedId: serverId } = useServers();

  const currentUserId = profile?.username ?? null;
  const currentUserDisplay = profile?.displayName ?? profile?.username ?? 'Me';

  const {
    conversations,
    conversationsLoading,
    conversationsError,
    reloadConversations,
    openConversationId,
    selectConversation,
    messages,
    messagesLoading,
    messagesError,
    hasOlderMessages,
    loadOlderMessages,
    sendDmMessage,
    retryDmMessage,
    createConversation,
  } = useDm(currentUserId, currentUserDisplay);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const startDmBtnRef = useRef<HTMLButtonElement>(null);

  const openConversation = openConversationId
    ? (conversations.find((c) => c.id === openConversationId) ?? null)
    : null;

  async function handleCreateConversation(participantIds: string[]) {
    const result = await createConversation(participantIds);
    if (result.ok) {
      setPickerOpen(false);
      selectConversation(result.conversation.id);
    }
    return result;
  }

  return (
    <div className="flex h-full w-full overflow-hidden" data-testid="dm-home">
      {/* Left rail: conversation list */}
      {/* On desktop: always visible. On mobile: overlay drawer. */}
      <div
        className="absolute lg:relative h-full transition-transform duration-300 lg:translate-x-0 z-10"
        style={{
          transform: drawerOpen ? 'translateX(0)' : undefined,
        }}
        aria-hidden={!drawerOpen && undefined}
      >
        <DmConversationList
          conversations={conversations}
          loading={conversationsLoading}
          error={conversationsError}
          openConversationId={openConversationId}
          currentUserId={currentUserId}
          onSelectConversation={(id) => {
            selectConversation(id);
            setDrawerOpen(false);
          }}
          onStartDm={() => setPickerOpen(true)}
          onRetryLoad={reloadConversations}
        />
      </div>

      {/* Right pane: open thread */}
      <DmThread
        conversation={openConversation}
        messages={messages}
        messagesLoading={messagesLoading}
        messagesError={messagesError}
        hasOlderMessages={hasOlderMessages}
        onLoadOlderMessages={loadOlderMessages}
        onRetryMessage={retryDmMessage}
        onSend={sendDmMessage}
        currentUserId={currentUserId}
        onToggleDrawer={() => setDrawerOpen((v) => !v)}
      />

      {/* StartDmPicker modal */}
      {pickerOpen && (
        <StartDmPicker
          serverId={serverId}
          currentUserId={currentUserId}
          onConfirm={handleCreateConversation}
          onClose={() => setPickerOpen(false)}
          triggerRef={startDmBtnRef}
        />
      )}
    </div>
  );
}
