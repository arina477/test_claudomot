6. B-block specialists run the formatter on all touched files before reporting done, not only typecheck.
   Why: Format drift then surfaces only at the wiring stage or in CI, costing an extra fix cycle.
