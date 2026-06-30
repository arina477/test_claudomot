2. Probe a new-only route for a 404-to-auth-gated-status flip after deploy-state SUCCESS before passing.
   Why: A SUCCESS with the new route still 404ing proves the prior revision serves, a false-green.
