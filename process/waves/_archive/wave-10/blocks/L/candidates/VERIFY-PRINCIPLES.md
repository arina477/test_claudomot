1. Verify seeding ACs by inspecting create-path source, not runtime behavior; a safe fallback hides a missing seed.
   Why: A default-deny or nullable fallback passes runtime probes while the required seed is absent.
