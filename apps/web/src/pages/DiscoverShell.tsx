/**
 * DiscoverShell — authenticated wrapper for the /discover route.
 *
 * Provides ServerProvider (required by ServerRail + ServerDiscoverPage's
 * join flow, which calls ServerContext.refetch() and sh:select-server).
 * Renders RailShell so the ServerRail is present beside the discover canvas,
 * matching the canonical design (design/server-discover.html l.209 + l.262).
 *
 * NOTE: ProfileProvider is intentionally omitted — /discover does not render
 * the user profile header or any profile-dependent UI.
 */

import { RailShell } from '../shell/RailShell';
import { ServerProvider } from '../shell/ServerContext';
import { ServerDiscoverPage } from '../shell/ServerDiscoverPage';

export function DiscoverShell() {
  return (
    <ServerProvider>
      <RailShell>
        <ServerDiscoverPage />
      </RailShell>
    </ServerProvider>
  );
}
