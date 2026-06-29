# D-2 Iteration log — roles-management-ui (wave-10)

iteration_counter: 2   # first-pass (0) + 2 pre-D-3 token/a11y/states refines; cap = 3

## Iteration 0 — first pass (Recipe 1)
- Refine prompt: (none — initial generation)
- Staging path: design/staging/roles-management-ui.html (56270 bytes)
- Checkpoint outcome: skipped-mode-automatic (D-2 Action 3: human checkpoint fires only under founder-review; mode=automatic → skipped)
- Static scan flagged: off-palette `#3b82f6` (7×) + missing static error-toast role; states JS-driven but not reviewable.

## Iteration 1 — refine (Recipe 2)
- Refine prompt (measurable deltas, cited to brief §9 token-only + DESIGN-SYSTEM §1 / brief §6 + §8 toast a11y):
  1. Remove every off-palette hex (#3b82f6 etc.); use accent-emerald for selected/active role accent, surface-500/600 neutral dots, accent-amber owner. Allowed hex set restricted to the 9 system tokens.
  2. Error/save-rejected Toast → role="alert" (assertive); success Toast stays role="status".
- Staging path: design/staging/roles-management-ui.html (56841 bytes)
- Result: all off-palette hex removed (verified: only 9 system hex remain). Error-toast role="alert" confirmed set assertively in JS.

## Iteration 2 — refine (Recipe 2)
- Refine prompt (measurable deltas, cited to brief §9 gating + §3 states):
  1. Add visible gated-controls note: "You only see controls you're allowed to use. Permissions are always enforced on the server." + a "Requires Manage Roles" disabled-tooltip example.
  2. Add a labelled state switcher (Loaded/Loading/Empty/Saving/Error) so reviewers can see every state; empty state = "No custom roles yet" + Create-role CTA; saving = spinner+aria-busy; error = danger block + Retry.
- Staging path: design/staging/roles-management-ui.html (58289 bytes)
- Result: gating note + "Requires Manage" tooltip present; 5-state switcher present; token palette + flags + selects + owner/safeguard unchanged (no regression). Committed.

Cap status: 2/3 used. One iteration remains for any D-3 back-edge.
