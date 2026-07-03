/**
 * RbacService unit tests — wave-10 P-4 T-8 security conditions.
 *
 * Covers:
 *   - can() default-deny (no membership, no role, null role_id, role flag false)
 *   - can() owner-superuser (owner_id → true for all permissions)
 *   - assignRole: non-manage_members caller → 403
 *   - assignRole: self-promote blocked at service layer (defence-in-depth)
 */

import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RbacService } from './rbac.service';

// ---------------------------------------------------------------------------
// Drizzle mock helpers (same pattern as existing service specs)
// ---------------------------------------------------------------------------

function makeSelectChain(resolveWith: unknown[]) {
  const chain: Record<string, unknown> = {
    // biome-ignore lint/suspicious/noThenProperty: intentional thenable mock
    then: (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
      Promise.resolve(resolveWith).then(res, rej),
  };
  for (const m of ['from', 'where', 'innerJoin', 'limit', 'orderBy', 'select']) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  return chain;
}

function makeInsertChain(returningValue: unknown[]) {
  const chain: Record<string, unknown> = {
    // biome-ignore lint/suspicious/noThenProperty: intentional thenable mock
    then: (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
      Promise.resolve(returningValue).then(res, rej),
    returning: vi.fn().mockResolvedValue(returningValue),
  };
  chain.values = vi.fn().mockReturnValue(chain);
  return chain;
}

function makeUpdateChain(returningValue: unknown[] = []) {
  const returningChain: Record<string, unknown> = {
    // biome-ignore lint/suspicious/noThenProperty: intentional thenable mock
    then: (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
      Promise.resolve(undefined).then(res, rej),
    returning: vi.fn().mockResolvedValue(returningValue),
  };
  const whereChain: Record<string, unknown> = {
    // biome-ignore lint/suspicious/noThenProperty: intentional thenable mock
    then: (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
      Promise.resolve(undefined).then(res, rej),
    returning: vi.fn().mockResolvedValue(returningValue),
  };
  const setChain: Record<string, unknown> = {};
  setChain.where = vi.fn().mockReturnValue(whereChain);
  const chain: Record<string, unknown> = {};
  chain.set = vi.fn().mockReturnValue(setChain);
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable mock
  chain.then = returningChain.then;
  chain.returning = returningChain.returning;
  return chain;
}

function makeDeleteChain() {
  const chain: Record<string, unknown> = {
    // biome-ignore lint/suspicious/noThenProperty: intentional thenable mock
    then: (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
      Promise.resolve(undefined).then(res, rej),
  };
  chain.where = vi.fn().mockReturnValue(chain);
  return chain;
}

// ---------------------------------------------------------------------------
// Mock db module
// ---------------------------------------------------------------------------

vi.mock('../db/index', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

import { db } from '../db/index';

type MockFn = ReturnType<typeof vi.fn>;
const mockSelect = db.select as unknown as MockFn;
const mockInsert = db.insert as unknown as MockFn;
const mockUpdate = db.update as unknown as MockFn;
const mockDelete = db.delete as unknown as MockFn;

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockServer = { id: 'server-1', owner_id: 'owner-1' };
const mockMemberWithRole = {
  id: 'mem-1',
  server_id: 'server-1',
  user_id: 'user-member',
  role_id: 'role-1',
};
const mockMemberNoRole = {
  id: 'mem-2',
  server_id: 'server-1',
  user_id: 'user-norole',
  role_id: null,
};
const mockRoleAllFalse = {
  id: 'role-1',
  server_id: 'server-1',
  name: 'Member',
  position: 0,
  manage_server: false,
  manage_roles: false,
  manage_channels: false,
  manage_members: false,
  is_default: true,
  created_at: new Date(),
};
const mockRoleManageMembers = {
  ...mockRoleAllFalse,
  id: 'role-2',
  manage_members: true,
};

// ---------------------------------------------------------------------------
// can() — default-deny + owner-superuser
// ---------------------------------------------------------------------------

describe('RbacService.can() — default-deny', () => {
  let service: RbacService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new RbacService();
  });

  it('returns false when server does not exist (default-deny)', async () => {
    mockSelect.mockReturnValue(makeSelectChain([]));

    const result = await service.can('any-user', 'nonexistent-server', 'manage_server');

    expect(result).toBe(false);
  });

  it('returns true for owner regardless of permission (owner-superuser)', async () => {
    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return makeSelectChain([mockServer]);
      return makeSelectChain([]);
    });

    // Owner does not need to have a role
    const result = await service.can('owner-1', 'server-1', 'manage_server');
    expect(result).toBe(true);
  });

  it('returns true for owner on all 4 permissions (superuser)', async () => {
    const permissions: Array<
      'manage_server' | 'manage_roles' | 'manage_channels' | 'manage_members'
    > = ['manage_server', 'manage_roles', 'manage_channels', 'manage_members'];

    for (const perm of permissions) {
      vi.clearAllMocks();
      mockSelect.mockReturnValue(makeSelectChain([mockServer]));
      const result = await service.can('owner-1', 'server-1', perm);
      expect(result).toBe(true);
    }
  });

  it('returns false when user is not a member (default-deny)', async () => {
    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return makeSelectChain([mockServer]); // server found
      return makeSelectChain([]); // no membership
    });

    const result = await service.can('outsider', 'server-1', 'manage_roles');
    expect(result).toBe(false);
  });

  it('returns false when member has null role_id (default-deny)', async () => {
    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return makeSelectChain([mockServer]);
      if (callCount === 2) return makeSelectChain([mockMemberNoRole]);
      return makeSelectChain([]);
    });

    const result = await service.can('user-norole', 'server-1', 'manage_channels');
    expect(result).toBe(false);
  });

  it('returns false when role flag is false (default-deny)', async () => {
    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return makeSelectChain([mockServer]);
      if (callCount === 2) return makeSelectChain([mockMemberWithRole]);
      return makeSelectChain([mockRoleAllFalse]);
    });

    const result = await service.can('user-member', 'server-1', 'manage_roles');
    expect(result).toBe(false);
  });

  it('returns true when member has role with the requested flag set true', async () => {
    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return makeSelectChain([mockServer]);
      if (callCount === 2) return makeSelectChain([{ ...mockMemberWithRole, role_id: 'role-2' }]);
      return makeSelectChain([mockRoleManageMembers]);
    });

    const result = await service.can('user-member', 'server-1', 'manage_members');
    expect(result).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// can() — non-owner member with partial permissions
// ---------------------------------------------------------------------------

describe('RbacService.can() — role flag resolution', () => {
  let service: RbacService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new RbacService();
  });

  it('returns false for manage_members when role only has manage_roles=true', async () => {
    const roleManageRolesOnly = { ...mockRoleAllFalse, manage_roles: true };
    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return makeSelectChain([mockServer]);
      if (callCount === 2) return makeSelectChain([mockMemberWithRole]);
      return makeSelectChain([roleManageRolesOnly]);
    });

    const result = await service.can('user-member', 'server-1', 'manage_members');
    expect(result).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// createRole
// ---------------------------------------------------------------------------

describe('RbacService.createRole', () => {
  let service: RbacService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new RbacService();
  });

  it('inserts role and returns DTO', async () => {
    mockSelect.mockReturnValue(makeSelectChain([{ id: 'server-1' }]));

    const newRole = {
      id: 'role-new',
      server_id: 'server-1',
      name: 'Moderator',
      position: 1,
      manage_server: false,
      manage_roles: false,
      manage_channels: true,
      manage_members: true,
      is_default: false,
      created_at: new Date('2026-01-01'),
    };
    mockInsert.mockReturnValue(makeInsertChain([newRole]));

    const result = await service.createRole('server-1', {
      name: 'Moderator',
      manage_channels: true,
      manage_members: true,
    });

    expect(result.name).toBe('Moderator');
    expect(result.permissions.manage_channels).toBe(true);
    expect(result.permissions.manage_members).toBe(true);
    expect(result.isDefault).toBe(false);
  });

  it('throws NotFoundException when server does not exist', async () => {
    mockSelect.mockReturnValue(makeSelectChain([]));

    await expect(service.createRole('ghost-server', { name: 'Test' })).rejects.toThrow(
      NotFoundException,
    );
  });
});

// ---------------------------------------------------------------------------
// updateRole
// ---------------------------------------------------------------------------

describe('RbacService.updateRole', () => {
  let service: RbacService;

  const existingRole = {
    id: 'role-1',
    server_id: 'server-1',
    name: 'Member',
    position: 0,
    manage_server: false,
    manage_roles: false,
    manage_channels: false,
    manage_members: false,
    is_default: true,
    created_at: new Date('2026-01-01'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new RbacService();
  });

  it('updates role and returns updated DTO', async () => {
    mockSelect.mockReturnValue(makeSelectChain([existingRole]));
    const updated = { ...existingRole, name: 'Moderator', manage_channels: true };
    mockUpdate.mockReturnValue(makeUpdateChain([updated]));

    const result = await service.updateRole('server-1', 'role-1', {
      name: 'Moderator',
      manage_channels: true,
    });

    expect(result.name).toBe('Moderator');
    expect(result.permissions.manage_channels).toBe(true);
  });

  it('throws NotFoundException when role does not exist', async () => {
    mockSelect.mockReturnValue(makeSelectChain([]));

    await expect(service.updateRole('server-1', 'ghost-role', { name: 'X' })).rejects.toThrow(
      NotFoundException,
    );
  });
});

// ---------------------------------------------------------------------------
// deleteRole
// ---------------------------------------------------------------------------

describe('RbacService.deleteRole', () => {
  let service: RbacService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new RbacService();
  });

  it('deletes role successfully when no member is assigned', async () => {
    // select 1: role exists; select 2: no member assigned
    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      return makeSelectChain(callCount === 1 ? [{ id: 'role-1' }] : []);
    });
    mockDelete.mockReturnValue(makeDeleteChain());

    await expect(service.deleteRole('server-1', 'role-1')).resolves.toBeUndefined();
    expect(mockDelete).toHaveBeenCalledOnce();
  });

  it('throws NotFoundException when role does not exist', async () => {
    mockSelect.mockReturnValue(makeSelectChain([]));

    await expect(service.deleteRole('server-1', 'ghost-role')).rejects.toThrow(NotFoundException);
  });

  it('throws ConflictException (409) when role is still assigned to a member', async () => {
    // select 1: role exists; select 2: one member row found (role still assigned)
    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      return makeSelectChain(callCount === 1 ? [{ id: 'role-1' }] : [{ id: 'mem-1' }]);
    });

    await expect(service.deleteRole('server-1', 'role-1')).rejects.toThrow(ConflictException);
    // delete must NOT be called
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('does not delete when assigned; role still intact (guard prevents deletion)', async () => {
    // Same as above — explicit check that delete is never reached
    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      return makeSelectChain(callCount === 1 ? [{ id: 'role-1' }] : [{ id: 'mem-1' }]);
    });

    try {
      await service.deleteRole('server-1', 'role-1');
    } catch {
      // expected ConflictException
    }

    expect(mockDelete).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// canViewChannel — private default-deny + override logic (P-4 T-8)
// ---------------------------------------------------------------------------

describe('RbacService.canViewChannel — private default-deny', () => {
  let service: RbacService;

  const mockChannel = {
    id: 'ch-1',
    server_id: 'server-1',
    is_private: false,
  };
  const mockPrivateChannel = {
    id: 'ch-private',
    server_id: 'server-1',
    is_private: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new RbacService();
  });

  it('owner can view private channel (superuser)', async () => {
    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return makeSelectChain([mockServer]); // server
      return makeSelectChain([]);
    });

    const result = await service.canViewChannel('owner-1', 'server-1', 'ch-private');
    expect(result).toBe(true);
  });

  it('returns false when user is not a member', async () => {
    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return makeSelectChain([mockServer]);
      return makeSelectChain([]); // no membership
    });

    const result = await service.canViewChannel('outsider', 'server-1', 'ch-1');
    expect(result).toBe(false);
  });

  it('private channel: default-deny (no override → false)', async () => {
    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return makeSelectChain([mockServer]);
      if (callCount === 2) return makeSelectChain([mockMemberWithRole]);
      if (callCount === 3) return makeSelectChain([mockPrivateChannel]); // channel
      return makeSelectChain([]); // no override
    });

    const result = await service.canViewChannel('user-member', 'server-1', 'ch-private');
    expect(result).toBe(false);
  });

  it('private channel: visible when override grants can_view=true', async () => {
    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return makeSelectChain([mockServer]);
      if (callCount === 2) return makeSelectChain([mockMemberWithRole]);
      if (callCount === 3) return makeSelectChain([mockPrivateChannel]);
      return makeSelectChain([{ can_view: true }]); // override grants view
    });

    const result = await service.canViewChannel('user-member', 'server-1', 'ch-private');
    expect(result).toBe(true);
  });

  it('public channel: visible by default (no override)', async () => {
    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return makeSelectChain([mockServer]);
      if (callCount === 2) return makeSelectChain([mockMemberWithRole]);
      if (callCount === 3) return makeSelectChain([mockChannel]); // public channel
      return makeSelectChain([]); // no override
    });

    const result = await service.canViewChannel('user-member', 'server-1', 'ch-1');
    expect(result).toBe(true);
  });

  it('public channel: hidden when override sets can_view=false', async () => {
    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return makeSelectChain([mockServer]);
      if (callCount === 2) return makeSelectChain([mockMemberWithRole]);
      if (callCount === 3) return makeSelectChain([mockChannel]);
      return makeSelectChain([{ can_view: false }]); // override denies
    });

    const result = await service.canViewChannel('user-member', 'server-1', 'ch-1');
    expect(result).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// assignRole — no self-promote (P-4 T-8 security condition)
// ---------------------------------------------------------------------------

describe('RbacService.assignRole — no self-promote / manage_members gate', () => {
  let service: RbacService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new RbacService();
  });

  it('throws ForbiddenException (403) when caller lacks manage_members', async () => {
    // can() resolution: server found, member found, role has manage_members=false
    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return makeSelectChain([mockServer]); // server for can()
      if (callCount === 2) return makeSelectChain([mockMemberWithRole]); // membership for can()
      return makeSelectChain([mockRoleAllFalse]); // role flags — all false
    });

    await expect(
      service.assignRole('server-1', 'target-user', 'user-member', { roleId: 'role-1' }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when a Member (no manage_members) tries to self-promote', async () => {
    // Self-promote scenario: callerUserId === targetUserId, no manage_members
    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return makeSelectChain([mockServer]);
      if (callCount === 2) return makeSelectChain([mockMemberNoRole]);
      return makeSelectChain([mockRoleAllFalse]);
    });

    await expect(
      service.assignRole('server-1', 'user-norole', 'user-norole', { roleId: 'role-1' }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('succeeds when caller has manage_members and assigns valid role', async () => {
    // can() paths for caller: server, member-with-role-2, role-manage-members
    // Then: target member found, role found
    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return makeSelectChain([mockServer]); // can(): server
      if (callCount === 2) return makeSelectChain([{ ...mockMemberWithRole, role_id: 'role-2' }]); // can(): membership
      if (callCount === 3) return makeSelectChain([mockRoleManageMembers]); // can(): role flags
      if (callCount === 4) return makeSelectChain([{ id: 'target-mem' }]); // target member check
      return makeSelectChain([{ id: 'role-1' }]); // role validation
    });
    mockUpdate.mockReturnValue(makeUpdateChain());

    await expect(
      service.assignRole('server-1', 'target-user', 'user-member', { roleId: 'role-1' }),
    ).resolves.toBeUndefined();
  });

  it('throws NotFoundException when target member is not in server', async () => {
    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return makeSelectChain([mockServer]);
      if (callCount === 2) return makeSelectChain([{ ...mockMemberWithRole, role_id: 'role-2' }]);
      if (callCount === 3) return makeSelectChain([mockRoleManageMembers]);
      return makeSelectChain([]); // target member not found
    });

    await expect(
      service.assignRole('server-1', 'ghost-user', 'user-member', { roleId: 'role-1' }),
    ).rejects.toThrow(NotFoundException);
  });
});

// ---------------------------------------------------------------------------
// getEffectivePermissions — authz boundary (wave-23 B-6 coverage)
// ---------------------------------------------------------------------------

describe('RbacService.getEffectivePermissions', () => {
  let service: RbacService;

  // Full role fixture including manage_assignments (wave-23) + moderate_members (wave-41)
  const mockRoleAssignmentsOnly = {
    id: 'role-assign',
    server_id: 'server-1',
    name: 'Organizer',
    position: 1,
    manage_server: false,
    manage_roles: false,
    manage_channels: false,
    manage_members: false,
    manage_assignments: true,
    moderate_members: false,
    is_default: false,
    created_at: new Date(),
  };

  const mockRoleAllFalseFull = {
    id: 'role-default',
    server_id: 'server-1',
    name: 'Member',
    position: 0,
    manage_server: false,
    manage_roles: false,
    manage_channels: false,
    manage_members: false,
    manage_assignments: false,
    moderate_members: false,
    is_default: true,
    created_at: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new RbacService();
  });

  it('server not found → throws ForbiddenException (no enumeration)', async () => {
    mockSelect.mockReturnValue(makeSelectChain([]));

    await expect(service.getEffectivePermissions('any-user', 'nonexistent-server')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('owner → all flags true + owner:true', async () => {
    // select 1: server (owner_id === userId — short-circuit, no further selects)
    mockSelect.mockReturnValue(makeSelectChain([mockServer]));

    const result = await service.getEffectivePermissions('owner-1', 'server-1');

    expect(result).toEqual({
      owner: true,
      manage_server: true,
      manage_roles: true,
      manage_channels: true,
      manage_members: true,
      manage_assignments: true,
      moderate_members: true,
    });
  });

  it('non-member of server → throws ForbiddenException (403 — key negative path)', async () => {
    // select 1: server found (userId is not owner); select 2: no membership row
    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return makeSelectChain([mockServer]);
      return makeSelectChain([]); // no server_members row
    });

    await expect(service.getEffectivePermissions('outsider', 'server-1')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('member with null role_id → all flags false + owner:false (default-deny)', async () => {
    // select 1: server; select 2: member with role_id=null
    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return makeSelectChain([mockServer]);
      return makeSelectChain([mockMemberNoRole]);
    });

    const result = await service.getEffectivePermissions('user-norole', 'server-1');

    expect(result).toEqual({
      owner: false,
      manage_server: false,
      manage_roles: false,
      manage_channels: false,
      manage_members: false,
      manage_assignments: false,
      moderate_members: false,
    });
  });

  it('member with role_id but role row missing → all flags false + owner:false (data inconsistency default-deny)', async () => {
    // select 1: server; select 2: member with role_id set; select 3: role row absent
    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return makeSelectChain([mockServer]);
      if (callCount === 2) return makeSelectChain([mockMemberWithRole]); // role_id: 'role-1'
      return makeSelectChain([]); // role row missing
    });

    const result = await service.getEffectivePermissions('user-member', 'server-1');

    expect(result).toEqual({
      owner: false,
      manage_server: false,
      manage_roles: false,
      manage_channels: false,
      manage_members: false,
      manage_assignments: false,
      moderate_members: false,
    });
  });

  it('member with role having manage_assignments:true → returns exact role flags', async () => {
    // select 1: server; select 2: member with role_id; select 3: role with manage_assignments=true
    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return makeSelectChain([mockServer]);
      if (callCount === 2)
        return makeSelectChain([{ ...mockMemberWithRole, role_id: 'role-assign' }]);
      return makeSelectChain([mockRoleAssignmentsOnly]);
    });

    const result = await service.getEffectivePermissions('user-member', 'server-1');

    expect(result).toEqual({
      owner: false,
      manage_server: false,
      manage_roles: false,
      manage_channels: false,
      manage_members: false,
      manage_assignments: true,
      moderate_members: false,
    });
  });

  it('member with role having all flags false → returns all-false + owner:false', async () => {
    // select 1: server; select 2: member with role_id; select 3: role all false
    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return makeSelectChain([mockServer]);
      if (callCount === 2) return makeSelectChain([mockMemberWithRole]);
      return makeSelectChain([mockRoleAllFalseFull]);
    });

    const result = await service.getEffectivePermissions('user-member', 'server-1');

    expect(result).toEqual({
      owner: false,
      manage_server: false,
      manage_roles: false,
      manage_channels: false,
      manage_members: false,
      manage_assignments: false,
      moderate_members: false,
    });
  });
});
