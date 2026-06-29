1. Verify a deploy via the platform deployment-state endpoint reading status SUCCESS, never via /health alone.
   Why: /health can return 200 from the prior revision and hide a crashed or wrong-revision deploy.
