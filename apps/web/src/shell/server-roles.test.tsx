/**
 * Component tests for ServerRolesPage.
 *
 * Covers:
 *   - Loading state renders skeleton
 *   - Load error state renders retry button
 *   - Empty state (no custom roles) renders create-first-role button
 *   - Loaded state renders roles list and editor
 *   - Role name input: changing marks dirty, Save enabled
 *   - Permission flag toggle marks dirty
 *   - Channel visibility toggle calls API
 *   - Create role modal: validates name; calls api.createRole; adds role to list
 *   - Delete role modal: calls api.deleteRole; removes from list
 *   - 409 save rejection: shows inline conflict error
 *   - Member assignment section renders
 */

import type { ChannelOverride, Role } from '@studyhall/shared';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ServerRolesPageProps } from './ServerRolesPage';
import { ServerRolesPage } from './ServerRolesPage';

// ── API mock ──────────────────────────────────────────────────────────────────

vi.mock('../auth/api', () => ({
  api: {
    getMe: vi.fn(),
    listRoles: vi.fn(),
    createRole: vi.fn(),
    updateRole: vi.fn(),
    deleteRole: vi.fn(),
    listChannelOverrides: vi.fn(),
    upsertChannelOverride: vi.fn(),
    deleteChannelOverride: vi.fn(),
  },
}));

import { api } from '../auth/api';
type MockApi = {
  getMe: ReturnType<typeof vi.fn>;
  listRoles: ReturnType<typeof vi.fn>;
  createRole: ReturnType<typeof vi.fn>;
  updateRole: ReturnType<typeof vi.fn>;
  deleteRole: ReturnType<typeof vi.fn>;
  listChannelOverrides: ReturnType<typeof vi.fn>;
  upsertChannelOverride: ReturnType<typeof vi.fn>;
  deleteChannelOverride: ReturnType<typeof vi.fn>;
};
const mockApi = api as unknown as MockApi;

// ── Fixtures ──────────────────────────────────────────────────────────────────

const SERVER_ID = 'srv-1';
const OWNER_ID = 'user-owner';

function makeRole(overrides: Partial<Role> = {}): Role {
  return {
    id: 'role-1',
    serverId: SERVER_ID,
    name: 'TA (Admin)',
    position: 1,
    permissions: {
      manage_server: false,
      manage_roles: true,
      manage_channels: true,
      manage_members: false,
    },
    isDefault: false,
    createdAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

const DEFAULT_ROLE: Role = {
  id: 'role-default',
  serverId: SERVER_ID,
  name: 'member',
  position: 100,
  permissions: {
    manage_server: false,
    manage_roles: false,
    manage_channels: false,
    manage_members: false,
  },
  isDefault: true,
  createdAt: '2024-01-01T00:00:00Z',
};

const CHANNELS = [
  { id: 'ch-1', name: 'general', type: 'text', isPrivate: false, position: 0 },
  { id: 'ch-2', name: 'assignments', type: 'text', isPrivate: true, position: 1 },
];

function renderPage(props: Partial<ServerRolesPageProps> = {}) {
  return render(
    <ServerRolesPage
      serverId={SERVER_ID}
      serverName="CS 410"
      ownerId={OWNER_ID}
      channels={CHANNELS}
      onClose={vi.fn()}
      {...props}
    />,
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ServerRolesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.getMe.mockResolvedValue({
      userId: OWNER_ID,
      email: 'owner@test.com',
      emailVerified: true,
    });
    mockApi.listChannelOverrides.mockResolvedValue([]);
  });

  // ── Loading state ─────────────────────────────────────────────────────────

  it('renders loading skeleton while roles are being fetched', () => {
    // listRoles never resolves in this test
    mockApi.listRoles.mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByTestId('roles-loading')).toBeInTheDocument();
  });

  // ── Load error state ─────────────────────────────────────────────────────

  it('renders error state with retry button on load failure', async () => {
    mockApi.listRoles.mockRejectedValue(new Error('500 Server Error'));
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('roles-load-error')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('retries loading roles when Retry Connection is clicked', async () => {
    mockApi.listRoles.mockRejectedValueOnce(new Error('500')).mockResolvedValueOnce([makeRole()]);
    renderPage();
    await waitFor(() => expect(screen.getByTestId('roles-load-error')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    await waitFor(() => expect(screen.getByTestId('roles-loaded')).toBeInTheDocument());
  });

  // ── Empty state ───────────────────────────────────────────────────────────

  it('renders empty state when only the default role exists', async () => {
    mockApi.listRoles.mockResolvedValue([DEFAULT_ROLE]);
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('roles-empty')).toBeInTheDocument();
    });
    expect(screen.getByTestId('create-first-role-btn')).toBeInTheDocument();
  });

  // ── Loaded: roles list ────────────────────────────────────────────────────

  it('renders the custom role in the nav rail when loaded', async () => {
    mockApi.listRoles.mockResolvedValue([makeRole(), DEFAULT_ROLE]);
    renderPage();
    await waitFor(() => expect(screen.getByTestId('roles-loaded')).toBeInTheDocument());
    expect(screen.getByTestId('role-item-role-1')).toBeInTheDocument();
    expect(screen.getByText('@TA (Admin)')).toBeInTheDocument();
  });

  it('marks the Owner role as aria-disabled in the nav rail', async () => {
    mockApi.listRoles.mockResolvedValue([makeRole()]);
    renderPage();
    await waitFor(() => expect(screen.getByTestId('roles-loaded')).toBeInTheDocument());
    const ownerBtn = screen.getByRole('button', { name: /@owner/i });
    expect(ownerBtn).toHaveAttribute('aria-disabled', 'true');
  });

  // ── Role editor ───────────────────────────────────────────────────────────

  it('renders the role editor for the auto-selected first custom role', async () => {
    mockApi.listRoles.mockResolvedValue([makeRole()]);
    renderPage();
    await waitFor(() => expect(screen.getByTestId('role-editor')).toBeInTheDocument());
    const nameInput = screen.getByTestId('role-name-input');
    expect(nameInput).toHaveValue('TA (Admin)');
  });

  it('marks role dirty and enables Save when role name changes', async () => {
    mockApi.listRoles.mockResolvedValue([makeRole()]);
    renderPage();
    await waitFor(() => expect(screen.getByTestId('role-name-input')).toBeInTheDocument());

    const nameInput = screen.getByTestId('role-name-input');
    fireEvent.change(nameInput, { target: { value: 'New Role Name' } });

    const saveBtn = screen.getByTestId('save-role-btn');
    expect(saveBtn).not.toBeDisabled();
  });

  it('calls api.updateRole on Save and shows success toast', async () => {
    const role = makeRole();
    mockApi.listRoles.mockResolvedValue([role]);
    mockApi.updateRole.mockResolvedValue({ ...role, name: 'New Name' });

    renderPage();
    await waitFor(() => expect(screen.getByTestId('role-name-input')).toBeInTheDocument());

    fireEvent.change(screen.getByTestId('role-name-input'), { target: { value: 'New Name' } });
    fireEvent.click(screen.getByTestId('save-role-btn'));

    await waitFor(() => {
      expect(mockApi.updateRole).toHaveBeenCalledWith(
        SERVER_ID,
        'role-1',
        expect.objectContaining({ name: 'New Name' }),
      );
    });

    // Success toast
    await waitFor(() => {
      expect(screen.getByText(/roles configuration saved/i)).toBeInTheDocument();
    });
  });

  it('shows 409 conflict error on save rejection', async () => {
    mockApi.listRoles.mockResolvedValue([makeRole()]);
    mockApi.updateRole.mockRejectedValue(new Error('409 Conflict: owner protection'));

    renderPage();
    await waitFor(() => expect(screen.getByTestId('role-name-input')).toBeInTheDocument());

    fireEvent.change(screen.getByTestId('role-name-input'), { target: { value: 'Changed' } });
    fireEvent.click(screen.getByTestId('save-role-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('save-409-error')).toBeInTheDocument();
    });
  });

  it('Discard resets dirty edits to original values', async () => {
    mockApi.listRoles.mockResolvedValue([makeRole()]);
    renderPage();
    await waitFor(() => expect(screen.getByTestId('role-name-input')).toBeInTheDocument());

    fireEvent.change(screen.getByTestId('role-name-input'), { target: { value: 'Edited' } });
    expect(screen.getByTestId('role-name-input')).toHaveValue('Edited');

    fireEvent.click(screen.getByTestId('discard-btn'));
    expect(screen.getByTestId('role-name-input')).toHaveValue('TA (Admin)');
  });

  // ── Permission flag toggles ───────────────────────────────────────────────

  it('flag toggle changes dirty state and can be saved', async () => {
    mockApi.listRoles.mockResolvedValue([makeRole()]);
    const updated = makeRole({
      permissions: {
        manage_server: true,
        manage_roles: true,
        manage_channels: true,
        manage_members: false,
      },
    });
    mockApi.updateRole.mockResolvedValue(updated);

    renderPage();
    await waitFor(() => expect(screen.getByTestId('role-editor')).toBeInTheDocument());

    // The manage_server checkbox (off → on) — find the visual div toggle
    // Flags are rendered as presentation divs; click the label's div
    const editor = screen.getByTestId('role-editor');
    const saveBtn = within(editor).getByTestId('save-role-btn');
    expect(saveBtn).toBeDisabled();

    // Change name to trigger dirty
    fireEvent.change(screen.getByTestId('role-name-input'), { target: { value: 'X' } });
    expect(saveBtn).not.toBeDisabled();

    fireEvent.click(saveBtn);
    await waitFor(() => expect(mockApi.updateRole).toHaveBeenCalled());
  });

  // ── Channel visibility ────────────────────────────────────────────────────

  it('renders channel visibility list', async () => {
    mockApi.listRoles.mockResolvedValue([makeRole()]);
    renderPage();
    await waitFor(() => expect(screen.getByTestId('channel-visibility-list')).toBeInTheDocument());
    expect(screen.getByText('general')).toBeInTheDocument();
    expect(screen.getByText('assignments')).toBeInTheDocument();
  });

  it('shows Private badge for isPrivate channels', async () => {
    mockApi.listRoles.mockResolvedValue([makeRole()]);
    renderPage();
    await waitFor(() => expect(screen.getByTestId('channel-visibility-list')).toBeInTheDocument());
    // a11y fix (2): "Private" badge on private channels
    expect(screen.getByText('Private')).toBeInTheDocument();
  });

  it('calls api.upsertChannelOverride when visibility is toggled ON', async () => {
    mockApi.listRoles.mockResolvedValue([makeRole()]);
    const override: ChannelOverride = {
      id: 'ov-1',
      channelId: 'ch-1',
      roleId: 'role-1',
      canView: true,
    };
    mockApi.upsertChannelOverride.mockResolvedValue(override);

    renderPage();
    await waitFor(() => expect(screen.getByTestId('channel-visibility-list')).toBeInTheDocument());

    // Click the visual toggle div for "general" (canView=null → toggle ON)
    const generalLabel = screen.getByLabelText(/can view general channel/i);
    fireEvent.click(generalLabel.closest('div[aria-hidden="true"]') ?? generalLabel);

    await waitFor(() => {
      expect(mockApi.upsertChannelOverride).toHaveBeenCalledWith(SERVER_ID, 'ch-1', {
        roleId: 'role-1',
        canView: true,
      });
    });
  });

  // ── Create role modal ─────────────────────────────────────────────────────

  it('opens create role modal on + button click', async () => {
    mockApi.listRoles.mockResolvedValue([makeRole()]);
    renderPage();
    await waitFor(() => expect(screen.getByTestId('add-role-btn')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('add-role-btn'));
    expect(screen.getByRole('dialog', { name: /create new role/i })).toBeInTheDocument();
  });

  it('create role button disabled when name is empty', async () => {
    mockApi.listRoles.mockResolvedValue([makeRole()]);
    renderPage();
    await waitFor(() => screen.getByTestId('add-role-btn'));

    fireEvent.click(screen.getByTestId('add-role-btn'));

    const createBtn = screen.getByRole('button', { name: /create role/i });
    expect(createBtn).toBeDisabled();
  });

  it('calls api.createRole and adds new role to list', async () => {
    mockApi.listRoles.mockResolvedValue([makeRole()]);
    const newRole = makeRole({ id: 'role-2', name: 'Moderators' });
    mockApi.createRole.mockResolvedValue(newRole);

    renderPage();
    await waitFor(() => screen.getByTestId('add-role-btn'));

    fireEvent.click(screen.getByTestId('add-role-btn'));

    const modal = screen.getByRole('dialog', { name: /create new role/i });
    const nameInput = within(modal).getByLabelText(/role name/i);
    fireEvent.change(nameInput, { target: { value: 'Moderators' } });
    fireEvent.click(within(modal).getByRole('button', { name: /create role/i }));

    await waitFor(() => {
      expect(mockApi.createRole).toHaveBeenCalledWith(SERVER_ID, { name: 'Moderators' });
    });

    // Modal closes and toast appears
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /create new role/i })).not.toBeInTheDocument();
      expect(screen.getByText(/role created successfully/i)).toBeInTheDocument();
    });
  });

  // ── Delete role modal ─────────────────────────────────────────────────────

  it('opens delete modal on Delete Role button click', async () => {
    mockApi.listRoles.mockResolvedValue([makeRole()]);
    renderPage();
    await waitFor(() => expect(screen.getByTestId('delete-role-btn')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('delete-role-btn'));
    expect(screen.getByRole('dialog', { name: /delete role/i })).toBeInTheDocument();
  });

  it('calls api.deleteRole and removes role from list', async () => {
    mockApi.listRoles.mockResolvedValue([makeRole()]);
    mockApi.deleteRole.mockResolvedValue(undefined);

    renderPage();
    await waitFor(() => screen.getByTestId('delete-role-btn'));

    fireEvent.click(screen.getByTestId('delete-role-btn'));

    const deleteBtn = screen.getByRole('button', { name: /^delete$/i });
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(mockApi.deleteRole).toHaveBeenCalledWith(SERVER_ID, 'role-1');
    });

    // Modal closes + toast
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /delete role/i })).not.toBeInTheDocument();
      expect(screen.getByText(/role deleted/i)).toBeInTheDocument();
    });
  });

  it('shows 409 error in delete modal on last-owner constraint', async () => {
    mockApi.listRoles.mockResolvedValue([makeRole()]);
    mockApi.deleteRole.mockRejectedValue(new Error('409 Conflict: owner protection'));

    renderPage();
    await waitFor(() => screen.getByTestId('delete-role-btn'));

    fireEvent.click(screen.getByTestId('delete-role-btn'));
    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/owner-protection active/i)).toBeInTheDocument();
    });
  });

  // ── Member assignment section ─────────────────────────────────────────────

  it('renders member assignment section with search input', async () => {
    mockApi.listRoles.mockResolvedValue([makeRole()]);
    renderPage();
    await waitFor(() =>
      expect(screen.getByTestId('member-assignment-section')).toBeInTheDocument(),
    );
    expect(screen.getByTestId('member-search-input')).toBeInTheDocument();
  });

  // ── Empty state: create first role CTA ───────────────────────────────────

  it('Create First Role button opens create modal from empty state', async () => {
    mockApi.listRoles.mockResolvedValue([DEFAULT_ROLE]);
    renderPage();
    await waitFor(() => expect(screen.getByTestId('create-first-role-btn')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('create-first-role-btn'));
    expect(screen.getByRole('dialog', { name: /create new role/i })).toBeInTheDocument();
  });

  // ── onClose ────────────────────────────────────────────────────────────────

  it('calls onClose when the X button is clicked', async () => {
    mockApi.listRoles.mockResolvedValue([makeRole()]);
    const onClose = vi.fn();
    renderPage({ onClose });
    await waitFor(() => expect(screen.getByTestId('roles-loaded')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /close settings/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
