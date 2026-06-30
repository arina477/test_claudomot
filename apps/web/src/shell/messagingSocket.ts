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
 */

import type { MessageResponse } from '@studyhall/shared';
import { type Socket, io } from 'socket.io-client';

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

/** Expose socket connection state for the ConnectionStateIndicator. */
export function getSocketState(): 'online' | 'reconnecting' | 'offline' {
  const s = _socket;
  if (!s) return 'offline';
  if (s.connected) return 'online';
  if (s.active) return 'reconnecting'; // socket is trying to connect
  return 'offline';
}
