1. Set enforce_admins=true on the main branch-protection rule so required CI checks apply to every actor.
   Why: With enforce_admins=false an admin or bot can push to main and bypass the required checks.
