import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';
import { cspMetaPlugin } from './src/csp';

export default defineConfig(({ mode }) => {
  // Resolve VITE_API_ORIGIN from .env files + process.env so the CSP plugin's
  // connect-src is correct in every env (Docker sets it as a real env var;
  // local dev reads apps/web/.env). loadEnv merges process.env over .env files.
  const env = loadEnv(mode, process.cwd(), '');
  if (env.VITE_API_ORIGIN && !process.env.VITE_API_ORIGIN) {
    process.env.VITE_API_ORIGIN = env.VITE_API_ORIGIN;
  }

  return {
    plugins: [
      cspMetaPlugin(),
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
