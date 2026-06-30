CONCERN: The connection state hook conflates two sources of truth—the specific socket state and the general browser online status—without defining a clear priority. This risks displaying a state that misrepresents the user's actual ability to communicate, as the browser's global event is a coarse symptom, while the socket's state is the direct cause of connectivity.

EVIDENCE: "`apps/web/src/shell/useConnectionState.ts` (new hook): subscribe to the socket lifecycle (reuse `getSocketState()` in messagingSocket.ts which already returns `'online'|'reconnecting'|'offline'`) + `window` `online`/`offline` events. Return the live derived state, reactive."

SUGGESTION: The hook should treat the socket's
