/**
 * Component tests for ServerPlanPanel — wave-75 M9 mock freemium upgrade path.
 *
 * Covers:
 *   - Owner sees the switch-plan affordance; a successful switch REFRESHES the
 *     displayed tier + limits (no reload). This success path is exercised
 *     through the REAL parent caller (ServerOverviewSettings), which resolves
 *     the owner gate via getMe() and mounts the panel — per BUILD-PRINCIPLES
 *     rule 12 (test through the real parent, not an isolated prop).
 *   - Non-owner sees read-only plan info and NO affordance.
 *   - A failed change (403) surfaces an inline error and leaves the displayed
 *     plan UNCHANGED.
 *   - The mock-mode / no-charge label is present.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '../auth/api';
import { ServerOverviewSettings } from './ServerOverviewSettings';
import { ServerPlanPanel } from './ServerPlanPanel';

// ── API mock ────────────────────────────────────────────────────────────────

vi.mock('../auth/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../auth/api')>();
  return {
    ...actual,
    api: {
      getMe: vi.fn(),
      updateServer: vi.fn(),
      getServerPlan: vi.fn(),
      changeServerTier: vi.fn(),
      // EducatorAdminConsole is mounted inside ServerOverviewSettings (wave-76).
      // The FREE_PLAN fixture has educatorAdminTools=false so the console renders
      // nothing; this mock only guards against an undefined api method.
      getServerEducatorAnalytics: vi.fn(),
    },
  };
});

import { api } from '../auth/api';

type MockApi = {
  getMe: ReturnType<typeof vi.fn>;
  updateServer: ReturnType<typeof vi.fn>;
  getServerPlan: ReturnType<typeof vi.fn>;
  changeServerTier: ReturnType<typeof vi.fn>;
};
const mockApi = api as unknown as MockApi;

// ── Fixtures ──────────────────────────────────────────────────────────────────

const SERVER_ID = 'srv-plan-1';
const OWNER_ID = 'user-owner';

const FREE_PLAN = {
  serverId: SERVER_ID,
  tier: 'free' as const,
  entitlements: { storageMb: 2048, callCapacity: 5, educatorAdminTools: false },
};

const SCHOOL_PLAN = {
  serverId: SERVER_ID,
  tier: 'school' as const,
  entitlements: { storageMb: 102400, callCapacity: 50, educatorAdminTools: true },
};

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.getMe.mockResolvedValue({
    userId: OWNER_ID,
    email: 'owner@test.com',
    emailVerified: true,
  });
  mockApi.updateServer.mockResolvedValue({ id: SERVER_ID, name: 'CS 410', ownerId: OWNER_ID });
  mockApi.getServerPlan.mockResolvedValue(FREE_PLAN);
  mockApi.changeServerTier.mockResolvedValue(SCHOOL_PLAN);
});

// ── Success path through the real parent (ServerOverviewSettings) ─────────────

describe('ServerPlanPanel — owner switch refreshes displayed plan (via parent)', () => {
  function renderViaParent() {
    return render(
      <ServerOverviewSettings
        serverId={SERVER_ID}
        serverName="CS 410"
        ownerId={OWNER_ID}
        onClose={vi.fn()}
      />,
    );
  }

  it('owner sees the affordance and a successful switch refreshes tier + limits', async () => {
    renderViaParent();

    // Panel mounts once the owner gate (getMe) resolves and the plan loads.
    await waitFor(() => {
      expect(screen.getByTestId('server-plan-current-tier')).toHaveTextContent('Free');
    });

    // Owner affordance present.
    const changeSection = screen.getByTestId('server-plan-change');
    expect(changeSection).toBeInTheDocument();

    // Baseline limits (Free: 2048 MB → 2 GB, 5 concurrent, educator Off).
    expect(screen.getByTestId('server-plan-storage')).toHaveTextContent('2 GB');
    expect(screen.getByTestId('server-plan-voice')).toHaveTextContent('5');
    expect(screen.getByTestId('server-plan-educator')).toHaveTextContent('Off');

    // Pick School and confirm.
    fireEvent.click(screen.getByTestId('server-plan-option-school'));
    fireEvent.click(screen.getByTestId('server-plan-confirm'));

    await waitFor(() => {
      expect(mockApi.changeServerTier).toHaveBeenCalledWith(SERVER_ID, 'school');
    });

    // Displayed tier + limits refresh from the returned ServerPlan — no reload.
    await waitFor(() => {
      expect(screen.getByTestId('server-plan-current-tier')).toHaveTextContent('School');
    });
    expect(screen.getByTestId('server-plan-storage')).toHaveTextContent('100 GB');
    expect(screen.getByTestId('server-plan-voice')).toHaveTextContent('50');
    expect(screen.getByTestId('server-plan-educator')).toHaveTextContent('On');
  });
});

// ── Non-owner: read-only, no affordance ───────────────────────────────────────

describe('ServerPlanPanel — non-owner is read-only', () => {
  it('non-owner sees plan info but NO switch affordance', async () => {
    render(<ServerPlanPanel serverId={SERVER_ID} isOwner={false} />);

    await waitFor(() => {
      expect(screen.getByTestId('server-plan-current-tier')).toHaveTextContent('Free');
    });

    // Plan limits still shown.
    expect(screen.getByTestId('server-plan-storage')).toHaveTextContent('2 GB');

    // No affordance / confirm / mock-notice for a non-owner.
    expect(screen.queryByTestId('server-plan-change')).not.toBeInTheDocument();
    expect(screen.queryByTestId('server-plan-confirm')).not.toBeInTheDocument();
    expect(screen.queryByTestId('server-plan-mock-notice')).not.toBeInTheDocument();
  });
});

// ── Failed change: inline error, plan unchanged ───────────────────────────────

describe('ServerPlanPanel — failed change', () => {
  it('shows an inline error and leaves the displayed plan unchanged on 403', async () => {
    mockApi.changeServerTier.mockRejectedValue(new HttpError(403, '403 Forbidden'));

    render(<ServerPlanPanel serverId={SERVER_ID} isOwner={true} />);

    await waitFor(() => {
      expect(screen.getByTestId('server-plan-current-tier')).toHaveTextContent('Free');
    });

    fireEvent.click(screen.getByTestId('server-plan-option-school'));
    fireEvent.click(screen.getByTestId('server-plan-confirm'));

    // Inline error surfaces.
    await waitFor(() => {
      expect(screen.getByTestId('server-plan-change-error')).toBeInTheDocument();
    });
    expect(screen.getByTestId('server-plan-change-error')).toHaveTextContent(/owner/i);

    // Displayed plan UNCHANGED — still Free, still 2 GB.
    expect(screen.getByTestId('server-plan-current-tier')).toHaveTextContent('Free');
    expect(screen.getByTestId('server-plan-storage')).toHaveTextContent('2 GB');
  });
});

// ── Mock-mode label present ───────────────────────────────────────────────────

describe('ServerPlanPanel — mock checkout labelling', () => {
  it('shows a clearly-visible no-charge / test-mode label for the owner', async () => {
    render(<ServerPlanPanel serverId={SERVER_ID} isOwner={true} />);

    await waitFor(() => {
      expect(screen.getByTestId('server-plan-confirm')).toBeInTheDocument();
    });

    // Confirm button reads as a mock.
    expect(screen.getByTestId('server-plan-confirm')).toHaveTextContent(/test mode — no charge/i);

    // Explicit no-charge disclosure.
    expect(screen.getByTestId('server-plan-mock-notice')).toHaveTextContent(/does not charge/i);
  });
});
