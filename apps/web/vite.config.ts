import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';
import { cspMetaPlugin } from './src/csp';

export default defineConfig(({ mode, command }) => {
  // Resolve the CSP-relevant VITE_* vars from .env files + process.env so the
  // CSP plugin's connect-src / img-src are correct in every env (Docker sets
  // them as real env vars; local dev reads apps/web/.env). loadEnv merges
  // process.env over .env files. VITE_STORAGE_ORIGIN (Tigris) + VITE_LIVEKIT_URL
  // (voice signaling) + VITE_SENTRY_DSN (ingest host) are threaded the same way
  // as VITE_API_ORIGIN so the meta-tag policy names every real origin.
  const env = loadEnv(mode, process.cwd(), '');
  for (const key of [
    'VITE_API_ORIGIN',
    'VITE_STORAGE_ORIGIN',
    'VITE_LIVEKIT_URL',
    'VITE_SENTRY_DSN',
  ]) {
    if (env[key] && !process.env[key]) {
      process.env[key] = env[key];
    }
  }

  // A production `vite build` with an empty VITE_API_ORIGIN must FAIL loudly
  // (cspMetaPlugin throws) rather than silently ship a self-only policy that
  // bricks the deployed SPA. Dev-serve (command === 'serve') tolerates it.
  const isProdBuild = command === 'build';

  return {
    plugins: [
      cspMetaPlugin(isProdBuild),
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: 'StudyHall',
          short_name: 'StudyHall',
          description: 'Offline-first study communication app',
          theme_color: '#0f0f0f',
          background_color: '#0f0f0f',
          display: 'standalone',
          icons: [
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https?:\/\/.*\/api\//,
              handler: 'NetworkFirst',
              options: { cacheName: 'api-cache', networkTimeoutSeconds: 5 },
            },
          ],
        },
      }),
    ],
    server: {
      proxy: {
        '/api': 'http://localhost:3001',
        '/socket.io': { target: 'http://localhost:3001', ws: true },
      },
    },
    build: {
      target: 'es2022',
      sourcemap: true,
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test-setup.ts'],
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
      // The shell may have NODE_ENV=production (e.g. CI / Railway workers).
      // Vitest only writes NODE_ENV=test when it is unset — it does NOT override
      // an existing value.  React 19's production CJS build omits `act`, which
      // @testing-library/react requires.  Force NODE_ENV=test inside the test
      // runner so react and react-dom load their development builds (where `act`
      // is exported).  This env key is vitest-specific and does not affect
      // `vite build`.
      env: {
        NODE_ENV: 'test',
      },
    },
  };
});
