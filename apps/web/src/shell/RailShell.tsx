/**
 * RailShell — slim two-column layout: ServerRail (72px) + flex-1 main area.
 *
 * Used by routes that need the server nav rail but NOT the full 4-column
 * AppShell (channel sidebar, member list panel).  The canonical case is
 * /discover: rail on the left, directory canvas filling the rest.
 *
 * ServerContext MUST be an ancestor — ServerRail reads `useServers()`.
 * The router mounts /discover inside DiscoverShell (below), which provides
 * ServerProvider before rendering RailShell.
 */

import type { ReactNode } from 'react';
import { ServerRail } from './ServerRail';

type Props = {
  children: ReactNode;
};

export function RailShell({ children }: Props) {
  return (
    <div className="flex h-full w-full overflow-hidden" style={{ backgroundColor: '#0a0a0b' }}>
      {/* Pane 1: Server Rail (72px, always visible) */}
      <ServerRail />

      {/* Pane 2: Main canvas (flex-1) */}
      <div className="flex flex-1 min-w-0 overflow-hidden">{children}</div>
    </div>
  );
}
