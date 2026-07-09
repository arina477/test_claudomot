/**
 * FullPageScroll — scroll viewport for standalone full-page routes.
 *
 * globals.css locks `html` + `body` to `height: 100%; overflow: hidden` (the
 * app-shell pattern). Standalone full-page routes (ProfilePage, SettingsPrivacy,
 * Privacy, Terms, Landing) use `min-h-screen` roots with no internal scroll
 * container, so any content past the viewport is clipped and unreachable.
 *
 * This wrapper restores the body-locked / inner-scroll shape the design mockups
 * model (settings-profile.html `<main class="h-[100dvh] overflow-y-auto">`,
 * settings-privacy.html `<main class="h-full overflow-y-auto">`): it is the
 * scroll viewport those pages were missing. The 6px dark scrollbar from
 * globals.css §9 (`::-webkit-scrollbar`) is global and applies here automatically.
 *
 * CRITICAL — this wrapper must NOT set `transform`, `filter`, `contain`, or
 * `will-change`. Any of those establishes a containing block, which would
 * reparent LandingPage's `position: fixed` navbar to this element instead of the
 * viewport, breaking the sticky nav. Only `h-dvh overflow-y-auto` (+ optional
 * bg passthrough via className) is allowed. `h-dvh` (not `h-screen`) tracks the
 * dynamic viewport so mobile URL-bar collapse doesn't clip the bottom.
 */

import type { ReactNode } from 'react';

export interface FullPageScrollProps {
  children: ReactNode;
  /** Optional extra classes (e.g. a background). Must not add transform/filter/contain/will-change. */
  className?: string;
}

export function FullPageScroll({ children, className }: FullPageScrollProps) {
  return (
    <div className={`h-dvh overflow-y-auto${className ? ` ${className}` : ''}`}>{children}</div>
  );
}
