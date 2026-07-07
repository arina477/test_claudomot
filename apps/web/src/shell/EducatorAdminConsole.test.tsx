/**
 * Component tests for EducatorAdminConsole — wave-76 M13 (Educator Admin
 * Console), task d81e266d.
 *
 * The visible/gating scenarios are exercised through the REAL parent caller
 * (ServerOverviewSettings), which resolves the owner gate via getMe() and reads
 * the server plan's educatorAdminTools entitlement before mounting the console —
 * per BUILD-PRINCIPLES rule 12 (test through the real parent, not an isolated
 * prop). The loading / empty / forbidden state scenarios are asserted through
 * the parent too where practical.
 *
 * Covers:
 *   - Owner + school tier → console visible; renders REAL analytics (not the
 *     mockup's placeholder strings).
 *   - Non-owner → console NOT surfaced (client gate).
 *   - Non-school tier (educatorAdminTools=false) → console NOT surfaced.
 *   - Loading → skeleton shown.
 *   - Empty (all aggregates zero) → "No activity yet".
 *   - 403 on analytics fetch → forbidden state.
 */

import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '../auth/api';
import { EducatorAdminConsole } from './EducatorAdminConsole';
import { ServerOverviewSettings } from './ServerOverviewSettings';

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
  getServerEducatorAnalytics: ReturnType<typeof vi.fn>;
};
const mockApi = api as unknown as MockApi;

// ── Fixtures ──────────────────────────────────────────────────────────────────

const SERVER_ID = 'srv-edu-1';
const OWNER_ID = 'user-owner';
const MEMBER_ID = 'user-member';

const SCHOOL_PLAN = {
  serverId: SERVER_ID,
  tier: 'school' as const,
  entitlements: { storageMb: 102400, callCapacity: 50, educatorAdminTools: true },
};

const FREE_PLAN = {
  serverId: SERVER_ID,
  tier: 'free' as const,
  entitlements: { storageMb: 2048, callCapacity: 5, educatorAdminTools: false },
};

const ANALYTICS = {
  memberCount: 342,
  roleBreakdown: [
    { roleId: 'r-educator', roleName: 'Educator', memberCount: 4 },
    { roleId: 'r-student', roleName: 'Student', memberCount: 338 },
  ],
  messageVolume: 15289,
  assignmentCount: 942,
  submissionRollup: { assignmentCount: 120, submissionCount: 4501 },
  recentActivity: [
    { type: 'assignment_published', count: 12 },
    { type: 'message_sent', count: 130 },
  ],
};

const EMPTY_ANALYTICS = {
  memberCount: 0,
  roleBreakdown: [],
  messageVolume: 0,
  assignmentCount: 0,
  submissionRollup: { assignmentCount: 0, submissionCount: 0 },
  recentActivity: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.getMe.mockResolvedValue({
    userId: OWNER_ID,
    email: 'owner@test.com',
    emailVerified: true,
  });
  mockApi.updateServer.mockResolvedValue({ id: SERVER_ID, name: 'CS 410', ownerId: OWNER_ID });
  mockApi.getServerPlan.mockResolvedValue(SCHOOL_PLAN);
  mockApi.changeServerTier.mockResolvedValue(SCHOOL_PLAN);
  mockApi.getServerEducatorAnalytics.mockResolvedValue(ANALYTICS);
});

// ── Visible for owner on school tier + renders real analytics (via parent) ────

describe('EducatorAdminConsole — visible + real analytics (via parent)', () => {
  function renderViaParent(ownerId = OWNER_ID) {
    return render(
      <ServerOverviewSettings
        serverId={SERVER_ID}
        serverName="CS 410"
        ownerId={ownerId}
        onClose={vi.fn()}
      />,
    );
  }

  it('owner on a school-tier server sees the console and REAL analytics values', async () => {
    renderViaParent();

    await waitFor(() => {
      expect(screen.getByTestId('educator-admin-console')).toBeInTheDocument();
    });

    // Dashboard renders once analytics resolve.
    await waitFor(() => {
      expect(screen.getByTestId('educator-console-dashboard')).toBeInTheDocument();
    });

    // Real values wired from the endpoint — NOT the mockup placeholders.
    expect(screen.getByTestId('stat-member-count')).toHaveTextContent('342');
    expect(screen.getByTestId('stat-message-volume')).toHaveTextContent('15,289');
    expect(screen.getByTestId('stat-assignment-count')).toHaveTextContent('942');
    expect(screen.getByTestId('stat-educator-count')).toHaveTextContent('4');
    expect(screen.getByTestId('stat-student-count')).toHaveTextContent('338');
    expect(screen.getByTestId('stat-submission-count')).toHaveTextContent('4,501');

    // Mockup placeholder strings must NOT survive the port.
    expect(screen.queryByText(/Sync 2m ago/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/142 total events/i)).not.toBeInTheDocument();

    // Real activity buckets rendered.
    expect(screen.getByTestId('recent-activity-list')).toBeInTheDocument();
    expect(screen.getByText(/assignment published/i)).toBeInTheDocument();

    // The console fetched the real endpoint.
    expect(mockApi.getServerEducatorAnalytics).toHaveBeenCalledWith(SERVER_ID);
  });
});

// ── Hidden for non-owner ──────────────────────────────────────────────────────

describe('EducatorAdminConsole — hidden for non-owner (via parent)', () => {
  it('a non-owner does NOT see the console entry even on a school tier', async () => {
    // getMe resolves to a member ≠ ownerId → parent gates canAccess=false.
    mockApi.getMe.mockResolvedValue({
      userId: MEMBER_ID,
      email: 'member@test.com',
      emailVerified: true,
    });

    render(
      <ServerOverviewSettings
        serverId={SERVER_ID}
        serverName="CS 410"
        ownerId={OWNER_ID}
        onClose={vi.fn()}
      />,
    );

    // Wait until the owner gate resolves and the plan panel is present.
    await waitFor(() => {
      expect(screen.getByTestId('server-plan-current-tier')).toBeInTheDocument();
    });

    // Console entry not surfaced; analytics never fetched.
    expect(screen.queryByTestId('educator-admin-console')).not.toBeInTheDocument();
    expect(mockApi.getServerEducatorAnalytics).not.toHaveBeenCalled();
  });
});

// ── Hidden on non-school tier ─────────────────────────────────────────────────

describe('EducatorAdminConsole — hidden on non-school tier (via parent)', () => {
  it('an owner on a free tier (educatorAdminTools=false) does NOT see the console', async () => {
    mockApi.getServerPlan.mockResolvedValue(FREE_PLAN);

    render(
      <ServerOverviewSettings
        serverId={SERVER_ID}
        serverName="CS 410"
        ownerId={OWNER_ID}
        onClose={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('server-plan-current-tier')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('educator-admin-console')).not.toBeInTheDocument();
    expect(mockApi.getServerEducatorAnalytics).not.toHaveBeenCalled();
  });
});

// ── Loading state ─────────────────────────────────────────────────────────────

describe('EducatorAdminConsole — loading state', () => {
  it('shows the skeleton while analytics are in flight', async () => {
    // Never-resolving fetch keeps the console in loading.
    mockApi.getServerEducatorAnalytics.mockReturnValue(new Promise(() => {}));

    render(
      <EducatorAdminConsole serverId={SERVER_ID} canAccess={true} educatorToolsEnabled={true} />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('educator-console-loading')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('educator-console-dashboard')).not.toBeInTheDocument();
  });
});

// ── Empty state ───────────────────────────────────────────────────────────────

describe('EducatorAdminConsole — empty state', () => {
  it('renders "No activity yet" when every aggregate is zero', async () => {
    mockApi.getServerEducatorAnalytics.mockResolvedValue(EMPTY_ANALYTICS);

    render(
      <EducatorAdminConsole serverId={SERVER_ID} canAccess={true} educatorToolsEnabled={true} />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('educator-console-empty')).toBeInTheDocument();
    });
    expect(screen.getByText(/No activity yet/i)).toBeInTheDocument();
    expect(screen.queryByTestId('educator-console-dashboard')).not.toBeInTheDocument();
  });
});

// ── Forbidden state (403) ─────────────────────────────────────────────────────

describe('EducatorAdminConsole — forbidden state', () => {
  it('renders the access-denied surface when the analytics fetch returns 403', async () => {
    mockApi.getServerEducatorAnalytics.mockRejectedValue(new HttpError(403, '403 Forbidden'));

    render(
      <EducatorAdminConsole serverId={SERVER_ID} canAccess={true} educatorToolsEnabled={true} />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('educator-console-forbidden')).toBeInTheDocument();
    });
    expect(screen.getByText(/Access Restricted/i)).toBeInTheDocument();
    expect(screen.queryByTestId('educator-console-dashboard')).not.toBeInTheDocument();
  });
});

// ── Gate: nothing rendered when not entitled ──────────────────────────────────

describe('EducatorAdminConsole — client gate returns null', () => {
  it('renders nothing when educatorToolsEnabled is false', () => {
    const { container } = render(
      <EducatorAdminConsole serverId={SERVER_ID} canAccess={true} educatorToolsEnabled={false} />,
    );
    expect(container).toBeEmptyDOMElement();
    expect(mockApi.getServerEducatorAnalytics).not.toHaveBeenCalled();
  });

  it('renders nothing when canAccess is false', () => {
    const { container } = render(
      <EducatorAdminConsole serverId={SERVER_ID} canAccess={false} educatorToolsEnabled={true} />,
    );
    expect(container).toBeEmptyDOMElement();
    expect(mockApi.getServerEducatorAnalytics).not.toHaveBeenCalled();
  });
});
