/**
 * ConnectionStateIndicator — the wedge made visible.
 *
 * Design system §8 spec:
 *   - Online:       emerald dot, hidden or subtle (aria-live polite)
 *   - Reconnecting: amber dot + "Reconnecting…" + spinner
 *   - Offline:      danger/grey dot + "Offline — messages will send when you're back"
 *   200ms color fade between states.
 *   role="status" aria-live="polite" — state communicated in text, not color alone.
 */

import { SpinnerIcon } from './icons';

export type ConnectionState = 'online' | 'reconnecting' | 'offline';

type Props = {
  state: ConnectionState;
};

export function ConnectionStateIndicator({ state }: Props) {
  if (state === 'online') {
    // Online state: minimal/hidden. Render invisibly so DOM presence is consistent.
    return (
      <output aria-live="polite" aria-label="Connection status: online" className="sr-only">
        Online
      </output>
    );
  }

  if (state === 'reconnecting') {
    return (
      <output
        aria-live="polite"
        className="sh-animate-pulse flex items-center gap-2 px-4 py-1.5 border-b text-xs font-medium tracking-wide"
        style={{
          backgroundColor: 'rgba(245, 158, 11, 0.10)',
          borderColor: 'rgba(245, 158, 11, 0.20)',
          color: 'rgba(245, 158, 11, 0.90)',
          transition: 'background-color 200ms ease, border-color 200ms ease, color 200ms ease',
        }}
      >
        {/* Amber dot */}
        <span
          className="inline-block w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: '#f59e0b' }}
          aria-hidden="true"
        />

        <SpinnerIcon size={12} className="sh-animate-spin shrink-0" />

        <span>Reconnecting…</span>
      </output>
    );
  }

  // offline
  return (
    <output
      aria-live="polite"
      className="flex items-center gap-2 px-4 py-1.5 border-b text-xs font-medium tracking-wide"
      style={{
        backgroundColor: 'rgba(239, 68, 68, 0.08)',
        borderColor: 'rgba(239, 68, 68, 0.18)',
        color: 'rgba(255, 255, 255, 0.60)',
        transition: 'background-color 200ms ease, border-color 200ms ease, color 200ms ease',
      }}
    >
      {/* Danger dot */}
      <span
        className="inline-block w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: '#ef4444' }}
        aria-hidden="true"
      />

      <span>Offline — messages will send when you&apos;re back</span>
    </output>
  );
}
