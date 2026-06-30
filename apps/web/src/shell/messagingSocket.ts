/**
 * messagingSocket — singleton Socket.IO client for the /messaging namespace.
 *
 * Connect once with credentials (session cookie). Callers call joinChannel /
 * leaveChannel to subscribe to a specific room. The socket is created lazily
 * on first import and kept for the lifetime of the app session.
 *
 * Auth strategy: primary = session cookie (credentials: 'include' equivalent
 * in socket.io is achieved by `withCredentials: true`); fallback not needed
 * because the REST layer and socket share the same origin / cookie. If the
 * cookie crosses origins the handshake auth token can be set via
 * socket.auth.accessToken but that is not wired here (same-origin deploy).
 *
 * Wave-13 events (message lifecycle):
 *   message:updated  — { MessageResponse }  — edit or any field change
 *   message:deleted  — { messageId, channelId } — soft-delete, render tombstone
 *   reaction:added   — { messageId, channelId, emoji, count, reactedByMe }
 *   reaction:removed — { messageId, channelId, emoji, count, reactedByMe }
 *
 * Wave-15 events (mentions):
 *   mention — { MentionEvent } — pushed to per-user room ('user:<userId>');
 *             server excludes the author so callers never receive self-mentions.
 */

import type { MentionEvent, MessageResponse, ReactionSummary } from '@studyhall/shared';
import { type Socket, io } from 'socket.io-client';

// ---------------------------------------------------------------------------
// Wave-13 socket payload types
// ---------------------------------------------------------------------------

export type MessageDeletedPayload = {
  messageId: string;
  channelId: string;
};

export type ReactionEventPayload = {
  messageId: string;
  channelId: string;
  emoji: string;
  count: number;
  reactedByMe: boolean;
};

// Internal helper — reconstruct reactions array from a reaction event
export function applyReactionEvent(
  existing: ReactionSummary[],
  payload: ReactionEventPayload,
): ReactionSummary[] {
  const { emoji, count, reactedByMe } = payload;
  if (count === 0) {
    return existing.filter((r) => r.emoji !== emoji);
  }
  const idx = existing.findIndex((r) => r.emoji === emoji);
  if (idx === -1) {
    return [...existing, { emoji, count, reactedByMe }];
  }
  return existing.map((r, i) => (i === idx ? { emoji, count, reactedByMe } : r));
}

const BASE = (import.meta.env.VITE_API_ORIGIN as string | undefined) ?? '';

let _socket: Socket | null = null;

export function getMessagingSocket(): Socket {
  if (!_socket) {
    _socket = io(`${BASE}/messaging`, {
      withCredentials: true,
      // auto-connect on creation
      autoConnect: true,
      // reconnect with exponential backoff
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
  }
  return _socket;
}

/** Join a channel room. Safe to call multiple times — server dedupes. */
export function joinChannel(channelId: string): void {
  getMessagingSocket().emit('join_channel', { channelId });
}

/** Leave a channel room. */
export function leaveChannel(channelId: string): void {
  getMessagingSocket().emit('leave_channel', { channelId });
}

/** Subscribe to new messages for the current channel. Returns unsubscribe fn. */
export function onMessageNew(handler: (msg: MessageResponse) => void): () => void {
  const socket = getMessagingSocket();
  socket.on('message:new', handler);
  return () => {
    socket.off('message:new', handler);
  };
}

/**
 * Subscribe to message:updated events (edit or any field change).
 * Returns unsubscribe fn.
 */
export function onMessageUpdated(handler: (msg: MessageResponse) => void): () => void {
  const socket = getMessagingSocket();
  socket.on('message:updated', handler);
  return () => {
    socket.off('message:updated', handler);
  };
}

/**
 * Subscribe to message:deleted events.
 * Returns unsubscribe fn.
 */
export function onMessageDeleted(handler: (payload: MessageDeletedPayload) => void): () => void {
  const socket = getMessagingSocket();
  socket.on('message:deleted', handler);
  return () => {
    socket.off('message:deleted', handler);
  };
}

/**
 * Subscribe to reaction:added events.
 * Returns unsubscribe fn.
 */
export function onReactionAdded(handler: (payload: ReactionEventPayload) => void): () => void {
  const socket = getMessagingSocket();
  socket.on('reaction:added', handler);
  return () => {
    socket.off('reaction:added', handler);
  };
}

/**
 * Subscribe to reaction:removed events.
 * Returns unsubscribe fn.
 */
export function onReactionRemoved(handler: (payload: ReactionEventPayload) => void): () => void {
  const socket = getMessagingSocket();
  socket.on('reaction:removed', handler);
  return () => {
    socket.off('reaction:removed', handler);
  };
}

/**
 * Subscribe to mention events pushed to the current user's per-user room
 * ('user:<userId>') by the /messaging gateway.  The server excludes the
 * author so callers never receive self-mention events.
 * Returns unsubscribe fn.
 */
export function onMention(handler: (event: MentionEvent) => void): () => void {
  const socket = getMessagingSocket();
  socket.on('mention', handler);
  return () => {
    socket.off('mention', handler);
  };
}

/** Expose socket connection state for the ConnectionStateIndicator. */
export function getSocketState(): 'online' | 'reconnecting' | 'offline' {
  const s = _socket;
  if (!s) return 'offline';
  if (s.connected) return 'online';
  if (s.active) return 'reconnecting'; // socket is trying to connect
  return 'offline';
}
