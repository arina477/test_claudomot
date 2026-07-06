import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type {
  DiscoverServersResponse,
  InvitePreview,
  InviteResponse,
  JoinResult,
  ServerDetail,
  ServerResponse,
  ServerSummary,
} from '@studyhall/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InvitesController, ServersController } from './servers.controller';

// ---------------------------------------------------------------------------
// Minimal request helper
// ---------------------------------------------------------------------------

function makeReq(userId = 'user-abc') {
  return { session: { getUserId: () => userId } };
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockServerResponse: ServerResponse = {
  id: 'server-1',
  name: 'Study Hall',
  ownerId: 'user-abc',
  createdAt: '2026-01-01T00:00:00.000Z',
};

const mockSummaries: ServerSummary[] = [
  { id: 'server-1', name: 'Study Hall', ownerId: 'user-abc' },
];

const mockDetail: ServerDetail = {
  server: {
    id: 'server-1',
    name: 'Study Hall',
    ownerId: 'user-abc',
    inviteCode: 'perm-code-abc',
    is_public: false,
    description: null,
    topic: null,
  },
  categories: [
    {
      id: 'cat-1',
      name: 'General',
      position: 0,
      channels: [{ id: 'ch-1', name: 'general', type: 'text', isPrivate: false, position: 0 }],
    },
  ],
};

// ---------------------------------------------------------------------------
// Controller factory — bypasses NestJS DI (vitest does not emit decoratorMetadata)
// ---------------------------------------------------------------------------

function makeController() {
  const serversService = {
    createServer: vi.fn<() => Promise<ServerResponse>>(),
    findMyServers: vi.fn<() => Promise<ServerSummary[]>>(),
    findServerDetail: vi.fn<() => Promise<ServerDetail>>(),
    createInvite: vi.fn<() => Promise<InviteResponse>>(),
    getInvitePreview: vi.fn<() => Promise<InvitePreview>>(),
    joinViaInvite: vi.fn<() => Promise<JoinResult>>(),
    revokeInvite: vi.fn<() => Promise<void>>(),
    rotateInviteCode: vi.fn<() => Promise<{ invite_code: string }>>(),
    discoverServers: vi.fn<() => Promise<DiscoverServersResponse>>(),
    joinPublicServer: vi.fn<() => Promise<JoinResult>>(),
    updateServer: vi.fn<() => Promise<ServerSummary>>(),
  };
  // biome-ignore lint/suspicious/noExplicitAny: test mock — full type not needed
  const controller = new ServersController(serversService as any);
  // biome-ignore lint/suspicious/noExplicitAny: test mock — full type not needed
  const invitesController = new InvitesController(serversService as any);
  return { controller, invitesController, serversService };
}

// ---------------------------------------------------------------------------
// POST /servers
// ---------------------------------------------------------------------------

describe('ServersController.createServer', () => {
  let controller: ServersController;
  let serversService: ReturnType<typeof makeController>['serversService'];

  beforeEach(() => {
    ({ controller, serversService } = makeController());
  });

  it('returns 201 ServerResponse for valid input', async () => {
    serversService.createServer.mockResolvedValue(mockServerResponse);

    const result = await controller.createServer(makeReq(), { name: 'Study Hall' });

    expect(result).toEqual(mockServerResponse);
    expect(serversService.createServer).toHaveBeenCalledWith('user-abc', 'Study Hall');
  });

  it('trims whitespace from name via Zod', async () => {
    serversService.createServer.mockResolvedValue(mockServerResponse);

    await controller.createServer(makeReq(), { name: '  Study Hall  ' });

    // CreateServerSchema uses .trim(), so service receives the trimmed name
    expect(serversService.createServer).toHaveBeenCalledWith('user-abc', 'Study Hall');
  });

  it('throws BadRequestException (400) for missing name', async () => {
    await expect(controller.createServer(makeReq(), {})).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException (400) for empty string name', async () => {
    await expect(controller.createServer(makeReq(), { name: '' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws BadRequestException (400) for name exceeding 100 chars', async () => {
    await expect(controller.createServer(makeReq(), { name: 'a'.repeat(101) })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws BadRequestException (400) when body is not an object', async () => {
    await expect(controller.createServer(makeReq(), null)).rejects.toThrow(BadRequestException);
  });
});

// ---------------------------------------------------------------------------
// GET /servers
// ---------------------------------------------------------------------------

describe('ServersController.listServers', () => {
  let controller: ServersController;
  let serversService: ReturnType<typeof makeController>['serversService'];

  beforeEach(() => {
    ({ controller, serversService } = makeController());
  });

  it('returns list of ServerSummary for the calling user', async () => {
    serversService.findMyServers.mockResolvedValue(mockSummaries);

    const result = await controller.listServers(makeReq());

    expect(result).toEqual(mockSummaries);
    expect(serversService.findMyServers).toHaveBeenCalledWith('user-abc');
  });

  it('returns empty array when user has no servers', async () => {
    serversService.findMyServers.mockResolvedValue([]);

    const result = await controller.listServers(makeReq());

    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// GET /servers/:id
// ---------------------------------------------------------------------------

describe('ServersController.getServerDetail', () => {
  let controller: ServersController;
  let serversService: ReturnType<typeof makeController>['serversService'];

  beforeEach(() => {
    ({ controller, serversService } = makeController());
  });

  it('returns ServerDetail for a member', async () => {
    serversService.findServerDetail.mockResolvedValue(mockDetail);

    const result = await controller.getServerDetail(makeReq(), 'server-1');

    expect(result).toEqual(mockDetail);
    expect(serversService.findServerDetail).toHaveBeenCalledWith('user-abc', 'server-1');
  });

  it('propagates NotFoundException (404) from service', async () => {
    serversService.findServerDetail.mockRejectedValue(new NotFoundException('Server not found'));

    await expect(controller.getServerDetail(makeReq(), 'ghost-server')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('propagates ForbiddenException (403) from service', async () => {
    serversService.findServerDetail.mockRejectedValue(
      new ForbiddenException('Not a member of this server'),
    );

    await expect(controller.getServerDetail(makeReq(), 'server-1')).rejects.toThrow(
      ForbiddenException,
    );
  });
});

// ---------------------------------------------------------------------------
// POST /servers/:id/invites (task c7443638)
// ---------------------------------------------------------------------------

describe('ServersController.createInvite', () => {
  let controller: ServersController;
  let serversService: ReturnType<typeof makeController>['serversService'];

  beforeEach(() => {
    ({ controller, serversService } = makeController());
  });

  it('returns InviteResponse for a valid member request', async () => {
    serversService.createInvite.mockResolvedValue({ code: 'abc123def456ghi7' });

    const result = await controller.createInvite(makeReq(), 'server-1', {});

    expect(result.code).toBeDefined();
    expect(serversService.createInvite).toHaveBeenCalledWith('server-1', 'user-abc', {});
  });

  it('passes maxUses and expiresAt to service', async () => {
    serversService.createInvite.mockResolvedValue({ code: 'code-xyz' });

    await controller.createInvite(makeReq(), 'server-1', {
      maxUses: 10,
      expiresAt: '2026-12-31T00:00:00Z',
    });

    expect(serversService.createInvite).toHaveBeenCalledWith('server-1', 'user-abc', {
      maxUses: 10,
      expiresAt: '2026-12-31T00:00:00Z',
    });
  });

  it('throws BadRequestException (400) for invalid body (negative maxUses)', async () => {
    await expect(controller.createInvite(makeReq(), 'server-1', { maxUses: -1 })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('propagates ForbiddenException (403) from service when not a member', async () => {
    serversService.createInvite.mockRejectedValue(
      new ForbiddenException('Not a member of this server'),
    );

    await expect(controller.createInvite(makeReq(), 'server-1', {})).rejects.toThrow(
      ForbiddenException,
    );
  });
});

// ---------------------------------------------------------------------------
// GET /invites/:code (task 77e2041a) — public, no guard
// ---------------------------------------------------------------------------

describe('InvitesController.getInvitePreview', () => {
  let invitesController: InvitesController;
  let serversService: ReturnType<typeof makeController>['serversService'];

  beforeEach(() => {
    ({ invitesController, serversService } = makeController());
  });

  it('returns InvitePreview with server id, name, memberCount', async () => {
    const preview: InvitePreview = {
      server: { id: 'server-1', name: 'Study Hall', memberCount: 7 },
    };
    serversService.getInvitePreview.mockResolvedValue(preview);

    const result = await invitesController.getInvitePreview('abc123');

    expect(result).toEqual(preview);
    expect(serversService.getInvitePreview).toHaveBeenCalledWith('abc123');
  });

  it('propagates NotFoundException (404) for invalid code', async () => {
    serversService.getInvitePreview.mockRejectedValue(
      new NotFoundException('Invite not found or invalid'),
    );

    await expect(invitesController.getInvitePreview('bad-code')).rejects.toThrow(NotFoundException);
  });
});

// ---------------------------------------------------------------------------
// POST /invites/:code/join (task 77e2041a) — AuthGuard required
// ---------------------------------------------------------------------------

describe('InvitesController.joinViaInvite', () => {
  let invitesController: InvitesController;
  let serversService: ReturnType<typeof makeController>['serversService'];

  beforeEach(() => {
    ({ invitesController, serversService } = makeController());
  });

  it('returns {serverId} on successful join', async () => {
    serversService.joinViaInvite.mockResolvedValue({ serverId: 'server-1' });

    const result = await invitesController.joinViaInvite(makeReq(), 'abc123');

    expect(result).toEqual({ serverId: 'server-1' });
    expect(serversService.joinViaInvite).toHaveBeenCalledWith('abc123', 'user-abc');
  });

  it('returns {serverId} for existing member re-join (200 no-op)', async () => {
    // Service returns same shape — re-join is idempotent 200
    serversService.joinViaInvite.mockResolvedValue({ serverId: 'server-1' });

    const result = await invitesController.joinViaInvite(makeReq(), 'abc123');

    expect(result).toEqual({ serverId: 'server-1' });
  });

  it('propagates NotFoundException (404) for invalid invite', async () => {
    serversService.joinViaInvite.mockRejectedValue(
      new NotFoundException('Invite not found or invalid'),
    );

    await expect(invitesController.joinViaInvite(makeReq(), 'bad-code')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('propagates ForbiddenException (403) when email is unverified', async () => {
    // AuthGuard (verify-required) blocks unverified users at the framework level;
    // the service can additionally throw 403 for unverified session tokens that slip through.
    serversService.joinViaInvite.mockRejectedValue(new ForbiddenException('Email not verified'));

    await expect(invitesController.joinViaInvite(makeReq(), 'abc123')).rejects.toThrow(
      ForbiddenException,
    );
  });
});

// ---------------------------------------------------------------------------
// GET /invites/:code — guard confirmation: no @UseGuards = public
// (task 77e2041a — public-preview carry-forward)
// ---------------------------------------------------------------------------

describe('InvitesController — public preview guard contract', () => {
  it('getInvitePreview is callable without a session object (public endpoint contract)', async () => {
    const { invitesController, serversService } = makeController();
    const preview: InvitePreview = {
      server: { id: 'server-1', name: 'Study Hall', memberCount: 3 },
    };
    serversService.getInvitePreview.mockResolvedValue(preview);

    // A public endpoint does not call req.session — passing a req without session
    // must not throw any guard-related error at the handler level.
    const result = await invitesController.getInvitePreview('abc123');

    expect(result).toEqual(preview);
  });

  it('joinViaInvite requires a session userId (authenticated endpoint contract)', async () => {
    const { invitesController, serversService } = makeController();
    serversService.joinViaInvite.mockResolvedValue({ serverId: 'server-1' });

    // joinViaInvite extracts userId from req.session — verify it passes userId to the service.
    const result = await invitesController.joinViaInvite(makeReq('verified-user'), 'abc123');

    expect(serversService.joinViaInvite).toHaveBeenCalledWith('abc123', 'verified-user');
    expect(result).toEqual({ serverId: 'server-1' });
  });
});

// ---------------------------------------------------------------------------
// POST /servers/:id/invite-code/rotate (task d058283d) — owner-only
// ---------------------------------------------------------------------------

describe('ServersController.rotateInviteCode', () => {
  let controller: ServersController;
  let serversService: ReturnType<typeof makeController>['serversService'];

  beforeEach(() => {
    ({ controller, serversService } = makeController());
  });

  it('returns { invite_code } and wires req.session.getUserId() → service', async () => {
    serversService.rotateInviteCode.mockResolvedValue({ invite_code: 'new-code-abc123xyz00' });

    const result = await controller.rotateInviteCode(makeReq('owner-1'), 'server-1');

    expect(result).toEqual({ invite_code: 'new-code-abc123xyz00' });
    expect(serversService.rotateInviteCode).toHaveBeenCalledWith('server-1', 'owner-1');
  });

  it('propagates ForbiddenException (403) when caller is not the owner', async () => {
    serversService.rotateInviteCode.mockRejectedValue(
      new ForbiddenException("Not authorized to rotate this server's invite code"),
    );

    await expect(controller.rotateInviteCode(makeReq('non-owner'), 'server-1')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('propagates NotFoundException (404) for a non-existent server', async () => {
    serversService.rotateInviteCode.mockRejectedValue(new NotFoundException('Server not found'));

    await expect(controller.rotateInviteCode(makeReq('owner-1'), 'ghost-server')).rejects.toThrow(
      NotFoundException,
    );
  });
});

// ---------------------------------------------------------------------------
// POST /invites/:code/revoke (task 863c10ef) — AuthGuard required
// ---------------------------------------------------------------------------

describe('InvitesController.revokeInvite', () => {
  let invitesController: InvitesController;
  let serversService: ReturnType<typeof makeController>['serversService'];

  beforeEach(() => {
    ({ invitesController, serversService } = makeController());
  });

  it('returns void (200) on successful revoke by owner/creator', async () => {
    serversService.revokeInvite.mockResolvedValue(undefined);

    const result = await invitesController.revokeInvite(makeReq('owner-1'), 'rev-code-123');

    expect(result).toBeUndefined();
    expect(serversService.revokeInvite).toHaveBeenCalledWith('rev-code-123', 'owner-1');
  });

  it('is idempotent — re-revoking returns void (200) without error', async () => {
    serversService.revokeInvite.mockResolvedValue(undefined);

    const result = await invitesController.revokeInvite(makeReq('owner-1'), 'rev-code-123');

    expect(result).toBeUndefined();
  });

  it('propagates ForbiddenException (403) when caller is not owner/creator', async () => {
    serversService.revokeInvite.mockRejectedValue(
      new ForbiddenException('Not authorized to revoke this invite'),
    );

    await expect(
      invitesController.revokeInvite(makeReq('stranger-99'), 'rev-code-123'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('propagates NotFoundException (404) for permanent code or nonexistent code', async () => {
    serversService.revokeInvite.mockRejectedValue(
      new NotFoundException('Invite not found or invalid'),
    );

    await expect(invitesController.revokeInvite(makeReq('owner-1'), 'perm-code')).rejects.toThrow(
      NotFoundException,
    );
  });
});

// ---------------------------------------------------------------------------
// GET /servers/discover (wave-67)
// ---------------------------------------------------------------------------

describe('ServersController.discoverServers', () => {
  let controller: ServersController;
  let serversService: ReturnType<typeof makeController>['serversService'];

  beforeEach(() => {
    ({ controller, serversService } = makeController());
  });

  const mockDiscoverResponse: DiscoverServersResponse = {
    servers: [
      { id: 'srv-1', name: 'Alpha', description: 'desc', topic: 'math', memberCount: 5 },
      { id: 'srv-2', name: 'Beta', description: null, topic: null, memberCount: 2 },
    ],
  };

  it('returns DiscoverServersResponse with default query params', async () => {
    serversService.discoverServers.mockResolvedValue(mockDiscoverResponse);

    // NestJS binds @Query() as a plain object — pass minimal query
    const result = await controller.discoverServers({});

    expect(result).toEqual(mockDiscoverResponse);
    expect(serversService.discoverServers).toHaveBeenCalledWith({ limit: 20, offset: 0 });
  });

  it('passes q, limit, and offset to service when provided', async () => {
    serversService.discoverServers.mockResolvedValue({ servers: [] });

    await controller.discoverServers({ q: 'calc', limit: '10', offset: '5' });

    expect(serversService.discoverServers).toHaveBeenCalledWith({
      q: 'calc',
      limit: 10,
      offset: 5,
    });
  });

  it('coerces limit string to number via Zod', async () => {
    serversService.discoverServers.mockResolvedValue({ servers: [] });

    await controller.discoverServers({ limit: '15' });

    expect(serversService.discoverServers).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 15 }),
    );
  });

  it('throws BadRequestException (400) for limit > 50', async () => {
    await expect(controller.discoverServers({ limit: '100' })).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException (400) for negative offset', async () => {
    await expect(controller.discoverServers({ offset: '-1' })).rejects.toThrow(BadRequestException);
  });

  it('returns empty servers array', async () => {
    serversService.discoverServers.mockResolvedValue({ servers: [] });

    const result = await controller.discoverServers({});

    expect(result.servers).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// POST /servers/:id/join-public (wave-67)
// ---------------------------------------------------------------------------

describe('ServersController.joinPublicServer', () => {
  let controller: ServersController;
  let serversService: ReturnType<typeof makeController>['serversService'];

  beforeEach(() => {
    ({ controller, serversService } = makeController());
  });

  it('returns {serverId} on successful join', async () => {
    serversService.joinPublicServer.mockResolvedValue({ serverId: 'server-1' });

    const result = await controller.joinPublicServer(makeReq('user-abc'), 'server-1');

    expect(result).toEqual({ serverId: 'server-1' });
    expect(serversService.joinPublicServer).toHaveBeenCalledWith('server-1', 'user-abc');
  });

  it('returns {serverId} for existing member re-join (idempotent 200)', async () => {
    serversService.joinPublicServer.mockResolvedValue({ serverId: 'server-1' });

    const result = await controller.joinPublicServer(makeReq('user-abc'), 'server-1');

    expect(result).toEqual({ serverId: 'server-1' });
  });

  it('propagates ForbiddenException (403) when server is not public', async () => {
    serversService.joinPublicServer.mockRejectedValue(
      new ForbiddenException('Server is not open for public joining'),
    );

    await expect(controller.joinPublicServer(makeReq(), 'private-server')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('propagates NotFoundException (404) when server does not exist', async () => {
    serversService.joinPublicServer.mockRejectedValue(new NotFoundException('Server not found'));

    await expect(controller.joinPublicServer(makeReq(), 'ghost-server')).rejects.toThrow(
      NotFoundException,
    );
  });
});

// ---------------------------------------------------------------------------
// PATCH /servers/:id (wave-68)
// ---------------------------------------------------------------------------

describe('ServersController.updateServer', () => {
  let controller: ServersController;
  let serversService: ReturnType<typeof makeController>['serversService'];

  beforeEach(() => {
    ({ controller, serversService } = makeController());
  });

  const mockSummary: ServerSummary = { id: 'server-1', name: 'Study Hall', ownerId: 'user-abc' };

  it('owner can publish and edit description + topic', async () => {
    serversService.updateServer.mockResolvedValue(mockSummary);

    const result = await controller.updateServer(makeReq('user-abc'), 'server-1', {
      is_public: true,
      description: 'A great server',
      topic: 'Math',
    });

    expect(result).toEqual(mockSummary);
    expect(serversService.updateServer).toHaveBeenCalledWith('server-1', 'user-abc', {
      is_public: true,
      description: 'A great server',
      topic: 'Math',
    });
  });

  it('non-owner PATCH propagates ForbiddenException (403)', async () => {
    serversService.updateServer.mockRejectedValue(
      new ForbiddenException('Not authorized to update this server'),
    );

    await expect(
      controller.updateServer(makeReq('non-owner'), 'server-1', { is_public: true }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('PATCH missing server propagates NotFoundException (404)', async () => {
    serversService.updateServer.mockRejectedValue(new NotFoundException('Server not found'));

    await expect(
      controller.updateServer(makeReq('user-abc'), 'ghost-server', { is_public: false }),
    ).rejects.toThrow(NotFoundException);
  });

  it('invalid body throws BadRequestException (400)', async () => {
    // description exceeds 500 chars
    await expect(
      controller.updateServer(makeReq('user-abc'), 'server-1', {
        description: 'x'.repeat(501),
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('partial update — only description, is_public not sent', async () => {
    serversService.updateServer.mockResolvedValue(mockSummary);

    await controller.updateServer(makeReq('user-abc'), 'server-1', {
      description: 'Just a description',
    });

    expect(serversService.updateServer).toHaveBeenCalledWith('server-1', 'user-abc', {
      description: 'Just a description',
    });
  });

  it('unpublish — is_public=false accepted', async () => {
    serversService.updateServer.mockResolvedValue(mockSummary);

    const result = await controller.updateServer(makeReq('user-abc'), 'server-1', {
      is_public: false,
    });

    expect(result).toEqual(mockSummary);
    expect(serversService.updateServer).toHaveBeenCalledWith('server-1', 'user-abc', {
      is_public: false,
    });
  });
});
