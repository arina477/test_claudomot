/**
 * csp.test.ts — wave-84 B-3: the cross-origin-safe Content-Security-Policy.
 *
 * These assert the LOAD-BEARING guarantees of the web-app CSP (empirically
 * derived + verified against the built SPA loading with zero CSP violations):
 *   - connect-src includes the api origin over BOTH https AND wss (Socket.IO
 *     handshake + WS upgrade for the 4 realtime namespaces).
 *   - Google Fonts allowlisted (style-src fonts.googleapis.com + font-src
 *     fonts.gstatic.com) — the Geist typeface is the only external resource.
 *   - script-src is 'self' with NO 'unsafe-inline' (the anti-injection core).
 *   - default-src / object-src / base-uri lock-downs present.
 */

import { describe, expect, it } from 'vitest';
import { buildCsp } from './csp';

const PROD_API = 'https://api-production-b93e.up.railway.app';

describe('buildCsp — cross-origin-safe web CSP', () => {
  const policy = buildCsp(PROD_API);
  const directive = (name: string): string =>
    policy
      .split(';')
      .map((d) => d.trim())
      .find((d) => d.startsWith(`${name} `) || d === name) ?? '';

  it('connect-src includes the api origin over BOTH https AND wss', () => {
    const connect = directive('connect-src');
    expect(connect).toContain('https://api-production-b93e.up.railway.app');
    expect(connect).toContain('wss://api-production-b93e.up.railway.app');
    expect(connect).toContain("'self'");
  });

  it('allowlists Google Fonts (style-src + font-src)', () => {
    expect(directive('style-src')).toContain('https://fonts.googleapis.com');
    expect(directive('font-src')).toContain('https://fonts.gstatic.com');
  });

  it("script-src is 'self' with NO 'unsafe-inline'", () => {
    const script = directive('script-src');
    expect(script).toContain("'self'");
    expect(script).not.toContain("'unsafe-inline'");
  });

  it("style-src allows 'unsafe-inline' (React inline style attributes + Tailwind)", () => {
    expect(directive('style-src')).toContain("'unsafe-inline'");
  });

  it('img-src allows self, data:, blob: and the api origin', () => {
    const img = directive('img-src');
    expect(img).toContain("'self'");
    expect(img).toContain('data:');
    expect(img).toContain('blob:');
    expect(img).toContain(PROD_API);
  });

  it('locks down default-src, object-src, base-uri', () => {
    expect(directive('default-src')).toBe("default-src 'self'");
    expect(directive('object-src')).toBe("object-src 'none'");
    expect(directive('base-uri')).toBe("base-uri 'self'");
  });

  it('derives ws origin from an http api origin (local dev)', () => {
    const dev = buildCsp('http://localhost:3001');
    const connect = dev
      .split(';')
      .map((d) => d.trim())
      .find((d) => d.startsWith('connect-src')) as string;
    expect(connect).toContain('http://localhost:3001');
    expect(connect).toContain('ws://localhost:3001');
  });

  it('falls back to self-only api directives when no origin is set', () => {
    const bare = buildCsp(undefined);
    const connect = bare
      .split(';')
      .map((d) => d.trim())
      .find((d) => d.startsWith('connect-src')) as string;
    expect(connect).toBe("connect-src 'self'");
  });

  it('strips a trailing slash from the api origin', () => {
    const p = buildCsp(`${PROD_API}/`);
    expect(p).toContain(`connect-src 'self' ${PROD_API} wss://api-production-b93e.up.railway.app`);
    expect(p).not.toContain(`${PROD_API}/ `);
  });
});
