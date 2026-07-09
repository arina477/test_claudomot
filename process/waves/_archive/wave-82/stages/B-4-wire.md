# Wave 82 — B-4 Wire
Fix is self-wiring: AuthGuard.tsx `onSessionExpired` (SessionAuth prop, already-registered guard) + api.ts request()/requestNoContent() (all ~80 authed methods funnel through, no route change). refreshAndRetry.ts new module imported by both. No new routes/providers. Repo-wide typecheck clean (B-3 report).
