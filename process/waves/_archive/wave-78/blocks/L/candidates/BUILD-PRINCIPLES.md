17. Default a hidden-vs-error UI branch to hidden with an explicit error-allowlist, never a not-equal-status default.
    Why: A not-equal default lets a new status reach the error state, leaking why content is hidden.
