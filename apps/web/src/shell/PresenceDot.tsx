/**
 * PresenceDot — shared presentational presence indicator dot.
 *
 * Single dot-styling source for the entire app (AC2).
 * Used by:
 *   - MemberListPanel: member row avatar dot
 *   - MessageList: message-row author avatar dot (SentRow only — real messages)
 *
 * Color tokens (CARRY-3):
 *   - Online: var(--color-accent-emerald)   → apps/web/src/styles/globals.css:18
 *   - Offline: var(--color-surface-500)     → muted zinc tone
 *
 * Performance (CARRY-1):
 *   - Pure presentational — no data-fetching, no subscriptions.
 *   - Wrapped in React.memo so re-renders only when `online` or `size` changes.
 *   - Callers must resolve presence OUTSIDE this component and pass `online` as
 *     a primitive boolean to maximise memoization effectiveness.
 */

import { memo } from 'react';

export type PresenceDotProps = {
  /** True when the user is online; false when offline or unknown. */
  online: boolean;
  /**
   * Inner dot diameter in pixels.
   * Defaults to 6 (sm). Pass 8 for a slightly larger variant.
   */
  size?: number;
};

/**
 * Renders a presence dot with an accessible sr-only label.
 * The outer ring is a 3px-larger container that provides the background mask
 * (same pattern as the original MemberListPanel dot at :92-101).
 */
export const PresenceDot = memo(function PresenceDot({ online, size = 6 }: PresenceDotProps) {
  // Outer ring diameter = inner dot + 2×(ring thickness 1.5px each side rounded)
  const outerSize = size + 6;

  return (
    <div
      className="absolute -bottom-0.5 -right-0.5 rounded-full flex items-center justify-center pointer-events-none"
      style={{
        width: outerSize,
        height: outerSize,
        backgroundColor: '#121214',
      }}
    >
      <span className="sr-only">{online ? 'Online' : 'Offline'}</span>
      {/* aria-hidden on the visual dot only — the decorative color dot is purely visual.
          The sr-only label above remains in the a11y tree on the outer container. */}
      <div
        aria-hidden="true"
        className="rounded-full"
        data-testid="presence-dot-inner"
        style={{
          width: size,
          height: size,
          backgroundColor: online ? 'var(--color-accent-emerald)' : 'var(--color-surface-500)',
        }}
      />
    </div>
  );
});
