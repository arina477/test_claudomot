/**
 * Thin fetch wrappers for /me and /profile.
 * Credentials are sent with every request so SuperTokens cookie-based
 * sessions work across origins.
 */

import type {
  AvatarPresignResponse,
  CreateServerInput,
  InvitePreview,
  InviteResponse,
  JoinResult,
  MeResponse,
  ProfileResponse,
  ServerDetail,
  ServerResponse,
  ServerSummary,
  UpdateProfileInput,
} from '@studyhall/shared';

const BASE = import.meta.env.VITE_API_ORIGIN ?? '';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText}: ${body}`);
  }

  return res.json() as Promise<T>;
}

/** Like `request` but for 204 No Content responses — returns void, throws on non-2xx. */
async function requestNoContent(path: string, init?: RequestInit): Promise<void> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText}: ${body}`);
  }
}

export const api = {
  getMe: () => request<MeResponse>('/me'),

  /** GET /profile → {displayName, username, avatarUrl, accentColor} */
  getProfile: () => request<ProfileResponse>('/profile'),

  /** PATCH /profile → updated ProfileResponse. Throws with status in message on 400/409/401. */
  patchProfile: (data: UpdateProfileInput) =>
    request<ProfileResponse>('/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  /**
   * POST /profile/avatar/presign → {uploadUrl, key}.
   * Throws with status prefix in message; callers check for "503" to detect
   * bucket-not-configured gracefully.
   */
  presignAvatar: (contentType: string) =>
    request<AvatarPresignResponse>('/profile/avatar/presign', {
      method: 'POST',
      body: JSON.stringify({ contentType }),
    }),

  /**
   * PUT the file directly to object storage.
   * NOTE: no credentials:include — this goes to the S3-compatible endpoint,
   * not the API server. The Content-Type must match what was presigned.
   */
  putAvatarToStorage: (uploadUrl: string, file: File): Promise<void> =>
    fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    }).then((res) => {
      if (!res.ok) throw new Error(`Storage PUT failed: ${res.status}`);
    }),

  /** POST /profile/avatar/confirm {key} → updated ProfileResponse with new avatarUrl. */
  confirmAvatar: (key: string) =>
    request<ProfileResponse>('/profile/avatar/confirm', {
      method: 'POST',
      body: JSON.stringify({ key }),
    }),

  /** POST /servers {name} → 201 {id,name,ownerId,createdAt}. Throws on 400/401. */
  createServer: (data: CreateServerInput) =>
    request<ServerResponse>('/servers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /** GET /servers → member-scoped server list [{id,name,ownerId}]. */
  getServers: () => request<ServerSummary[]>('/servers'),

  /** GET /servers/:id → {server, categories:[{id,name,position,channels:[...]}]}. */
  getServerDetail: (id: string) => request<ServerDetail>(`/servers/${id}`),

  // ── Invite endpoints (wave-8 M2) ──────────────────────────────────────────

  /**
   * GET /invites/:code → public; returns {server:{id,name,memberCount}}.
   * Throws on 404 (invalid/expired/maxed).
   */
  getInvitePreview: (code: string) => request<InvitePreview>(`/invites/${code}`),

  /**
   * POST /invites/:code/join → auth required; returns {serverId}.
   * Throws: 401 unauthed, 403 unverified, 404 invalid.
   */
  joinViaInvite: (code: string) =>
    request<JoinResult>(`/invites/${code}/join`, { method: 'POST', body: '{}' }),

  /**
   * POST /servers/:id/invites → creates ad-hoc invite; returns {code, url?}.
   * Requires auth. Body is optional (defaults to no-expiry, unlimited uses).
   */
  createInvite: (serverId: string) =>
    request<InviteResponse>(`/servers/${serverId}/invites`, { method: 'POST', body: '{}' }),

  /**
   * POST /invites/:code/revoke → revokes an ad-hoc invite.
   * Requires auth; owner/creator-gated. Idempotent (200 even if already revoked).
   * Throws: 403 non-owner/creator, 404 not found.
   */
  revokeInvite: (code: string) =>
    request<void>(`/invites/${code}/revoke`, { method: 'POST', body: '{}' }),

  // ── RBAC endpoints (wave-10 M2) ───────────────────────────────────────────

  /** GET /servers/:id/roles → Role[] */
  listRoles: (serverId: string) =>
    request<import('@studyhall/shared').Role[]>(`/servers/${serverId}/roles`),

  /** POST /servers/:id/roles → 201 Role */
  createRole: (serverId: string, data: import('@studyhall/shared').CreateRoleInput) =>
    request<import('@studyhall/shared').Role>(`/servers/${serverId}/roles`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /** PATCH /servers/:id/roles/:roleId → Role */
  updateRole: (
    serverId: string,
    roleId: string,
    data: import('@studyhall/shared').UpdateRoleInput,
  ) =>
    request<import('@studyhall/shared').Role>(`/servers/${serverId}/roles/${roleId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  /** DELETE /servers/:id/roles/:roleId → 204 void */
  deleteRole: (serverId: string, roleId: string) =>
    requestNoContent(`/servers/${serverId}/roles/${roleId}`, { method: 'DELETE' }),

  /** PATCH /servers/:id/members/:userId/role → 204 void */
  assignMemberRole: (serverId: string, userId: string, roleId: string | null) =>
    requestNoContent(`/servers/${serverId}/members/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ roleId }),
    }),

  /** GET /servers/:id/channels/:channelId/overrides → ChannelOverride[] */
  listChannelOverrides: (serverId: string, channelId: string) =>
    request<import('@studyhall/shared').ChannelOverride[]>(
      `/servers/${serverId}/channels/${channelId}/overrides`,
    ),

  /** POST /servers/:id/channels/:channelId/overrides → ChannelOverride */
  upsertChannelOverride: (
    serverId: string,
    channelId: string,
    data: import('@studyhall/shared').UpsertChannelOverrideInput,
  ) =>
    request<import('@studyhall/shared').ChannelOverride>(
      `/servers/${serverId}/channels/${channelId}/overrides`,
      { method: 'POST', body: JSON.stringify(data) },
    ),

  /** DELETE /servers/:id/channels/:channelId/overrides/:roleId → 204 void */
  deleteChannelOverride: (serverId: string, channelId: string, roleId: string) =>
    requestNoContent(`/servers/${serverId}/channels/${channelId}/overrides/${roleId}`, {
      method: 'DELETE',
    }),
};
