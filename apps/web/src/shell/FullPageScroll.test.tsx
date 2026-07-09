/**
 * Tests for FullPageScroll (wave-81 B-3).
 *
 * The wrapper restores a scroll viewport within the body-locked app shell for
 * standalone full-page routes. Two invariants are guarded here:
 *
 *   1. It renders a root scroll container with `overflow-y: auto`.
 *   2. It NEVER sets transform / filter / contain / will-change — any of those
 *      establishes a containing block that would reparent LandingPage's
 *      `position: fixed` navbar to the wrapper, breaking the sticky nav.
 */

import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FullPageScroll } from './FullPageScroll';

describe('FullPageScroll', () => {
  it('renders children inside a root scroll container', () => {
    const { getByTestId } = render(
      <FullPageScroll>
        <p data-testid="child">content</p>
      </FullPageScroll>,
    );
    const child = getByTestId('child');
    expect(child.textContent).toBe('content');
    // The wrapper is the child's parent element.
    const wrapper = child.parentElement as HTMLElement;
    expect(wrapper).toBeTruthy();
  });

  it('applies overflow-y-auto and h-dvh (not h-screen) to the root', () => {
    const { container } = render(
      <FullPageScroll>
        <div>x</div>
      </FullPageScroll>,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toContain('overflow-y-auto');
    expect(wrapper.className).toContain('h-dvh');
    // Must NOT use h-screen (mobile-URL-bar clip variant).
    expect(wrapper.className).not.toContain('h-screen');
  });

  it('does NOT apply transform / filter / contain / will-change (fixed-nav invariant)', () => {
    const { container } = render(
      <FullPageScroll className="bg-surface-950">
        <div>x</div>
      </FullPageScroll>,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    const cls = wrapper.className;
    const style = wrapper.getAttribute('style') ?? '';

    // Neither className tokens nor inline style may introduce a containing block.
    for (const forbidden of ['transform', 'filter', 'contain', 'will-change']) {
      expect(cls).not.toContain(forbidden);
      expect(style).not.toContain(forbidden);
    }
    // className passthrough still works.
    expect(cls).toContain('bg-surface-950');
  });
});
