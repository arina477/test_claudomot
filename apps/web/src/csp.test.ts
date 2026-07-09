/**
 * csp.test.ts — wave-84 B-3/B-6: the cross-origin-safe Content-Security-Policy.
 *
 * These assert the LOAD-BEARING guarantees of the web-app CSP (empirically
 * derived + verified against the built SPA loading with zero CSP violations):
 *   - connect-src includes the api origin over BOTH https AND wss (Socket.IO
 *     handshake + WS upgrade for the 4 realtime namespaces).
 *   - connect-src + img-src include the Tigris storage origin (attachments,
 *     uploads, avatar-redirect target) — B-6 REWORK: the B-3 policy blocked it.
 *   - connect-src includes the LiveKit wss origin (voice signaling) — B-6.
 *   - connect-src includes the Sentry ingest origin WHEN a DSN is set — B-6.
 *   - media-src allows blob:/mediastream: (LiveKit WebRTC audio/screen-share).
 *   - Google Fonts allowlisted (style-src fonts.googleapis.com + font-src
 *     fonts.gstatic.com) — the Geist typeface is the only external resource.
 *   - script-src is 'self' with NO 'unsafe-inline' (the anti-injection core).
 *   - default-src / object-src / base-uri lock-downs present.
 *   - a production `vite build` with an empty VITE_API_ORIGIN THROWS (B-6) —
 *     no silent self-only shipped policy.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildCsp, cspMetaPlugin, sentryOriginFromDsn } from './csp';

const PROD_API = 'https://api-production-b93e.up.railway.app';
const STORAGE = 'https://fly.storage.tigris.dev';
const LIVEKIT = 'wss://studyhall.livekit.cloud';
const SENTRY_DSN = 'https://abc123@o987654.ingest.us.sentry.io/4501234';
const SENTRY_ORIGIN = 'https://o987654.ingest.us.sentry.io';

const directiveOf =
  (policy: string) =>
  (name: string): string =>
    policy
      .split(';')
      .map((d) => d.trim())
      .find((d) => d.startsWith(`${name} `) || d === name) ?? '';

describe('buildCsp — cross-origin-safe web CSP', () => {
  const policy = buildCsp(PROD_API, {
    storageOrigin: STORAGE,
    livekitUrl: LIVEKIT,
    sentryDsn: SENTRY_DSN,
  });
  const directive = directiveOf(policy);

  it('connect-src includes the api origin over BOTH https AND wss', () => {
    const connect = directive('connect-src');
    expect(connect).toContain('https://api-production-b93e.up.railway.app');
    expect(connect).toContain('wss://api-production-b93e.up.railway.app');
    expect(connect).toContain("'self'");
  });

  it('connect-src includes the Tigris storage origin (attachments/uploads/avatars)', () => {
    expect(directive('connect-src')).toContain(STORAGE);
  });

  it('connect-src includes the LiveKit wss origin (voice signaling)', () => {
    expect(directive('connect-src')).toContain(LIVEKIT);
  });

  it('connect-src includes the Sentry ingest origin when the DSN is set', () => {
    expect(directive('connect-src')).toContain(SENTRY_ORIGIN);
  });

  it('img-src includes self, data:, blob:, api AND the Tigris storage origin', () => {
    const img = directive('img-src');
    expect(img).toContain("'self'");
    expect(img).toContain('data:');
    expect(img).toContain('blob:');
    expect(img).toContain(PROD_API);
    expect(img).toContain(STORAGE);
  });

  it('media-src allows self, blob: and mediastream: (LiveKit WebRTC media)', () => {
    const media = directive('media-src');
    expect(media).toContain("'self'");
    expect(media).toContain('blob:');
    expect(media).toContain('mediastream:');
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

  it('locks down default-src, object-src, base-uri', () => {
    expect(directive('default-src')).toBe("default-src 'self'");
    expect(directive('object-src')).toBe("object-src 'none'");
    expect(directive('base-uri')).toBe("base-uri 'self'");
  });

  it('omits the Sentry origin when no DSN is provided', () => {
    const noSentry = buildCsp(PROD_API, { storageOrigin: STORAGE, livekitUrl: LIVEKIT });
    expect(directiveOf(noSentry)('connect-src')).not.toContain('sentry.io');
  });

  it('omits storage/livekit tokens when those origins are unset', () => {
    const bare = directiveOf(buildCsp(PROD_API));
    const connect = bare('connect-src');
    // Only 'self' + api https + api wss — no extra external hosts.
    expect(connect).toBe(`connect-src 'self' ${PROD_API} wss://api-production-b93e.up.railway.app`);
  });

  it('derives ws origin from an http api origin (local dev)', () => {
    const dev = buildCsp('http://localhost:3001');
    const connect = directiveOf(dev)('connect-src');
    expect(connect).toContain('http://localhost:3001');
    expect(connect).toContain('ws://localhost:3001');
  });

  it('falls back to self-only api directives when no origin is set (non-prod unit case)', () => {
    // NOTE: this fallback is ONLY valid for dev-serve / undefined-origin unit
    // cases. A production `vite build` with an empty VITE_API_ORIGIN is rejected
    // by cspMetaPlugin (see the throw-on-empty-api-origin test below).
    const bare = buildCsp(undefined);
    const connect = directiveOf(bare)('connect-src');
    expect(connect).toBe("connect-src 'self'");
  });

  it('strips a trailing slash from every origin', () => {
    const p = buildCsp(`${PROD_API}/`, {
      storageOrigin: `${STORAGE}/`,
      livekitUrl: `${LIVEKIT}/`,
    });
    expect(p).toContain(`connect-src 'self' ${PROD_API} wss://api-production-b93e.up.railway.app`);
    expect(p).toContain(STORAGE);
    expect(p).not.toContain(`${STORAGE}/ `);
    expect(p).not.toContain(`${PROD_API}/ `);
  });
});

describe('sentryOriginFromDsn', () => {
  it('parses the ingest origin from a well-formed DSN', () => {
    expect(sentryOriginFromDsn(SENTRY_DSN)).toBe(SENTRY_ORIGIN);
  });

  it('returns empty for an unset / empty / unparseable DSN', () => {
    expect(sentryOriginFromDsn(undefined)).toBe('');
    expect(sentryOriginFromDsn('')).toBe('');
    expect(sentryOriginFromDsn('   ')).toBe('');
    expect(sentryOriginFromDsn('not-a-url')).toBe('');
  });
});

describe('cspMetaPlugin — build-time guard', () => {
  const OLD_ENV = { ...process.env };

  afterEach(() => {
    process.env = { ...OLD_ENV };
    vi.restoreAllMocks();
  });

  const runHandler = (isProdBuild: boolean): string => {
    const plugin = cspMetaPlugin(isProdBuild);
    const handler = plugin.transformIndexHtml.handler;
    return handler('<html><head></head><body></body></html>');
  };

  it('THROWS on a production build with an empty VITE_API_ORIGIN', () => {
    process.env.VITE_API_ORIGIN = '';
    expect(() => runHandler(true)).toThrow(/VITE_API_ORIGIN is empty/);
  });

  it('THROWS on a production build with a whitespace-only VITE_API_ORIGIN', () => {
    process.env.VITE_API_ORIGIN = '   ';
    expect(() => runHandler(true)).toThrow(/VITE_API_ORIGIN is empty/);
  });

  it('does NOT throw on dev-serve with an empty VITE_API_ORIGIN (self-only fallback)', () => {
    process.env.VITE_API_ORIGIN = '';
    expect(() => runHandler(false)).not.toThrow();
    expect(runHandler(false)).toContain('Content-Security-Policy');
  });

  it('injects the storage + livekit + sentry origins from env on a prod build', () => {
    process.env.VITE_API_ORIGIN = PROD_API;
    process.env.VITE_STORAGE_ORIGIN = STORAGE;
    process.env.VITE_LIVEKIT_URL = LIVEKIT;
    process.env.VITE_SENTRY_DSN = SENTRY_DSN;
    const out = runHandler(true);
    expect(out).toContain(STORAGE);
    expect(out).toContain(LIVEKIT);
    expect(out).toContain(SENTRY_ORIGIN);
  });
});
