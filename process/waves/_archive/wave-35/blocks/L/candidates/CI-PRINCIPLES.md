7. For a non-git-connected Railway service, assert a change-unique marker appears in the served bundle after deploy.
   Why: A redeploy rebuilds the same source to a new digest, so digest-diff passes on stale code.
