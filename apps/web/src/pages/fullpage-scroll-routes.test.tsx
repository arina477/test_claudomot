/**
 * wave-81 B-3 — standalone full-page routes are wrapped in a scroll viewport.
 *
 * globals.css body-locks the app shell (`overflow: hidden`), so standalone
 * full-page routes need their own inner scroll container to reach content past
 * the viewport. This test proves the FullPageScroll wrapper is the ROOT element
 * a wrapped page renders — an `overflow-y-auto` scroll container — for pages that
 * need no data mocking (PrivacyPage, TermsPage, LandingPage), and asserts the
 * fixed-nav invariant (no transform/filter/contain/will-change on the wrapper).
 */

import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { LandingPage } from './LandingPage';
import { PrivacyPage } from './PrivacyPage';
import { TermsPage } from './TermsPage';

function rootOf(ui: React.ReactElement): HTMLElement {
  const { container } = render(<MemoryRouter>{ui}</MemoryRouter>);
  return container.firstElementChild as HTMLElement;
}

describe('full-page routes: scroll viewport wrapper', () => {
  for (const [name, ui] of [
    ['PrivacyPage', <PrivacyPage key="p" />],
    ['TermsPage', <TermsPage key="t" />],
    ['LandingPage', <LandingPage key="l" />],
  ] as const) {
    it(`${name} renders a root overflow-y-auto scroll container`, () => {
      const root = rootOf(ui);
      expect(root.className).toContain('overflow-y-auto');
      expect(root.className).toContain('h-dvh');
    });

    it(`${name} wrapper does not establish a containing block (fixed-nav safe)`, () => {
      const root = rootOf(ui);
      const cls = root.className;
      const style = root.getAttribute('style') ?? '';
      for (const forbidden of ['transform', 'filter', 'contain', 'will-change']) {
        expect(cls).not.toContain(forbidden);
        expect(style).not.toContain(forbidden);
      }
    });
  }

  it('LandingPage keeps its fixed navbar as a descendant of the scroll wrapper', () => {
    const root = rootOf(<LandingPage key="l" />);
    // The wrapper is the scroll container; the fixed navbar lives inside it and
    // stays viewport-anchored because the wrapper adds no containing block.
    const fixedNav = root.querySelector('header.fixed');
    expect(fixedNav).not.toBeNull();
  });
});
