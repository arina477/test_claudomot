/**
 * Thin fetch wrappers for /me and /profile.
 * Credentials are sent with every request so SuperTokens cookie-based
 * sessions work across origins.
 */

import type {
  AccountDataResponse,
  Assignment,
  AssignmentListResponse,
  AssignmentPresignResponse,
  AssignmentStatusInput,
  AssignmentSubmission,
  AssignmentSubmissionPresignResponse,
  AssignmentSubmissionsListResponse,
  AttachmentPresignResponse,
  AvatarPresignResponse,
  Block,
  BlockListItem,
  CreateAssignmentInput,
  CreateReport,
  CreateScheduledSessionInput,
  CreateServerInput,
  DeleteAccountBlockedResponse,
  DeleteAccountResponse,
  DmCandidate,
  EditMessageInput,
  EffectivePermissions,
  InvitePreview,
  InviteResponse,
  JoinResult,
  MeResponse,
  MessageList,
  MessageResponse,
  MessagesAfterResponse,
  MyMentionsResponse,
  NotificationListResponse,
  PrivacySettingsResponse,
  ProfileResponse,
  ReactionToggleInput,
  ReactionToggleResponse,
  Report,
  ResolveReportAction,
  ReturnSubmissionInput,
  ScheduledSession,
  ScheduledSessionListResponse,
  SendMessageInput,
  ServerDetail,
  ServerMember,
  ServerResponse,
  ServerSummary,
  StudyTimer,
  StudyTimerConfig,
  SubmitAssignmentInput,
  UnreadCountResponse,
  UpdateAssignmentInput,
  UpdatePrivacyInput,
  UpdateProfileInput,
  UpdateScheduledSessionInput,
  ValidatedAttachment,
} from '@studyhall/shared';

import {
  DeleteAccountBlockedResponseSchema,
  DeleteAccountResponseSchema,
} from '@studyhall/shared';

import { retryOn429 } from './retryOn429';

const BASE = import.meta.env.VITE_API_ORIGIN ?? '';

/**
 * Error subclass carrying the HTTP status code and an optional Retry-After
 * value (seconds) so callers can branch on specific status codes without
 * parsing the message string.
 */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    /** Parsed Retry-After value in milliseconds, when the server sent the header. */
    public readonly retryAfterMs?: number,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

/**
 * Typed error thrown by deleteAccount when the server returns 409 (owner-blocked).
 * Carries the parsed DeleteAccountBlockedResponse body so the UI can surface
 * the blocking server list without parsing the raw message string.
 */
export class DeleteAccountBlockedError extends Error {
  constructor(public readonly blocked: DeleteAccountBlockedResponse) {
    super(blocked.reason);
    this.name = 'DeleteAccountBlockedError';
  }
}

/** Parse a Retry-After header value to milliseconds.
 * Accepts either an integer (delta-seconds) or an HTTP-date string.
 * Returns undefined when the header is absent or unparseable.
 */
function parseRetryAfterMs(header: string | null): number | undefined {
  if (!header) return undefined;
  const deltaSec = Number(header.trim());
  if (Number.isFinite(deltaSec) && deltaSec >= 0) return Math.round(deltaSec * 1000);
  // Try HTTP-date
  const date = new Date(header);
  if (!Number.isNaN(date.getTime())) {
    const ms = date.getTime() - Date.now();
    return ms > 0 ? ms : 0;
  }
  return undefined;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    const retryAfterMs =
      res.status === 429 ? parseRetryAfterMs(res.headers.get('Retry-After')) : undefined;
    throw new HttpError(res.status, `${res.status} ${res.statusText}: ${body}`, retryAfterMs);
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
    const retryAfterMs =
      res.status === 429 ? parseRetryAfterMs(res.headers.get('Retry-After')) : undefined;
    throw new HttpError(res.status, `${res.status} ${res.statusText}: ${body}`, retryAfterMs);
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

  /**
   * GET /servers/:id/members → [{userId, displayName, avatarUrl}].
   * Caller must be a member; returns 403 otherwise.
   */
  getServerMembers: (id: string) => request<ServerMember[]>(`/servers/${id}/members`),

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

  /**
   * GET /servers/:serverId/me/permissions → EffectivePermissions.
   * Session-scoped; owner gets all-true. Throws: 403 non-member, 401 unauthed.
   * wave-23 B-2 backend + B-3 frontend gate.
   */
  getMyPermissions: (serverId: string) =>
    request<EffectivePermissions>(`/servers/${serverId}/me/permissions`),

  // ── Messaging endpoints (wave-12 M3) ─────────────────────────────────────

  // ── Attachment endpoints (wave-19 M3) ────────────────────────────────────

  /**
   * POST /channels/:channelId/attachments/presign {contentType, filename}
   * → {uploadUrl, key}.
   * Throws: 401 unauthed, 403 non-member, 400 bad content-type.
   */
  presignAttachment: (channelId: string, contentType: string, filename: string) =>
    request<AttachmentPresignResponse>(`/channels/${channelId}/attachments/presign`, {
      method: 'POST',
      body: JSON.stringify({ contentType, filename }),
    }),

  /**
   * PUT the file directly to object storage.
   * NOTE: no credentials:include — goes to S3-compatible endpoint.
   * The Content-Type must match what was presigned.
   */
  putAttachmentToStorage: (uploadUrl: string, file: File): Promise<void> =>
    fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    }).then((res) => {
      if (!res.ok) throw new Error(`Storage PUT failed: ${res.status}`);
    }),

  /**
   * POST /channels/:channelId/attachments/confirm {key, filename, contentType}
   * → ValidatedAttachment.
   * Throws: 401 unauthed, 403 non-member, 400 bad key.
   */
  confirmAttachment: (channelId: string, key: string, filename: string, contentType: string) =>
    request<ValidatedAttachment>(`/channels/${channelId}/attachments/confirm`, {
      method: 'POST',
      body: JSON.stringify({ key, filename, contentType }),
    }),

  /**
   * POST /channels/:channelId/messages {content, idempotencyKey, attachments?} → 201 MessageResponse.
   * Throws: 401 unauthed, 403 non-permitted, 400 bad content.
   */
  sendMessage: (channelId: string, body: SendMessageInput) =>
    request<MessageResponse>(`/channels/${channelId}/messages`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  /**
   * GET /channels/:channelId/messages?cursor=&limit= → {messages, nextCursor}.
   * Cursor-based pagination (pass cursor from previous response for older messages).
   */
  listMessages: (channelId: string, cursor?: string) => {
    const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
    return request<MessageList>(`/channels/${channelId}/messages${qs}`);
  },

  /**
   * GET /channels/:channelId/messages?after=<cursor> → MessagesAfterResponse.
   * Forward catch-up cursor — returns all messages AFTER the given cursor
   * (ASC created_at, oldest-first). Used on reconnect to fill the offline gap.
   * wave-20 M4 (B-2 backend: forward cursor + idempotency-lock).
   */
  getMessagesAfter: (channelId: string, after: string) =>
    request<MessagesAfterResponse>(
      `/channels/${channelId}/messages?after=${encodeURIComponent(after)}`,
    ),

  /**
   * PATCH /channels/:channelId/messages/:messageId {content} → 200 updated MessageResponse.
   * Throws: 401 unauthed, 403 not author, 409 if deleted.
   */
  editMessage: (channelId: string, messageId: string, body: EditMessageInput) =>
    request<MessageResponse>(`/channels/${channelId}/messages/${messageId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  /**
   * DELETE /channels/:channelId/messages/:messageId → 200/204 (soft-delete).
   * Throws: 401 unauthed, 403 not author/moderator.
   */
  deleteMessage: (channelId: string, messageId: string) =>
    requestNoContent(`/channels/${channelId}/messages/${messageId}`, { method: 'DELETE' }),

  /**
   * POST /channels/:channelId/messages/:messageId/reactions {emoji} → 200 {reacted: bool}.
   * Toggles reaction (add if absent, remove if present).
   */
  toggleReaction: (channelId: string, messageId: string, body: ReactionToggleInput) =>
    request<ReactionToggleResponse>(`/channels/${channelId}/messages/${messageId}/reactions`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  /**
   * GET /me/mentions?cursor= → {items: MessageResponse[], nextCursor}.
   * Returns messages in which the authenticated user is @mentioned, newest first.
   * Wave-15 task 3d238446.
   */
  getMyMentions: (cursor?: string) => {
    const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
    return request<MyMentionsResponse>(`/me/mentions${qs}`);
  },

  // ── Thread reply endpoints (wave-18 M3) ──────────────────────────────────

  /**
   * POST /messages/:parentId/replies?channelId=<channelId>
   *   body: {content, idempotencyKey}
   *   → 201 MessageResponse (the new reply row; threadParentId = parentId).
   * Throws: 401 unauthed, 403 not member, 404 parent not found,
   *         409 reply-of-reply (400), idempotency conflict (200 if already created).
   */
  postReply: (parentId: string, channelId: string, content: string, idempotencyKey: string) =>
    request<import('@studyhall/shared').MessageResponse>(
      `/messages/${parentId}/replies?channelId=${encodeURIComponent(channelId)}`,
      {
        method: 'POST',
        body: JSON.stringify({ content, idempotencyKey }),
      },
    ),

  /**
   * GET /messages/:parentId/replies?cursor=<cursor>
   *   → ThreadRepliesResponse  {items: MessageResponse[], nextCursor?}
   * Replies are ordered oldest-first (ASC created_at).
   * Throws: 401 unauthed, 403 not member, 404 parent not found.
   */
  getThreadReplies: (parentId: string, cursor?: string) => {
    const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
    return request<import('@studyhall/shared').ThreadRepliesResponse>(
      `/messages/${parentId}/replies${qs}`,
    );
  },

  // ── Assignment endpoints (wave-22 M5) ────────────────────────────────────

  /**
   * POST /servers/:serverId/assignments → 201 Assignment.
   * Organizer-only (owner OR manage_channels permission).
   * Throws: 401 unauthed, 403 non-organizer, 400 bad input.
   */
  createAssignment: (serverId: string, data: CreateAssignmentInput) =>
    request<Assignment>(`/servers/${serverId}/assignments`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * GET /servers/:serverId/assignments → AssignmentListResponse.
   * Ordered by due_date ASC. Includes myStatus per authenticated user.
   * Throws: 401 unauthed, 403 non-member.
   */
  listAssignments: (serverId: string) =>
    request<AssignmentListResponse>(`/servers/${serverId}/assignments`),

  /**
   * GET /assignments/:id → Assignment.
   * Throws: 401 unauthed, 403 non-member, 404 not found.
   */
  getAssignment: (id: string) => request<Assignment>(`/assignments/${id}`),

  /**
   * PATCH /assignments/:id → updated Assignment.
   * Organizer-only partial update. Throws: 401, 403, 404.
   */
  updateAssignment: (id: string, data: UpdateAssignmentInput) =>
    request<Assignment>(`/assignments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  /**
   * DELETE /assignments/:id → 204 void (soft-delete).
   * Organizer-only. Throws: 401, 403, 404.
   */
  deleteAssignment: (id: string) => requestNoContent(`/assignments/${id}`, { method: 'DELETE' }),

  /**
   * PUT /assignments/:id/status {state} → updated Assignment.
   * Member toggle (todo ↔ done). Throws: 401 unauthed, 403 non-member, 404.
   */
  setAssignmentStatus: (id: string, data: AssignmentStatusInput) =>
    request<Assignment>(`/assignments/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  /**
   * POST /servers/:serverId/assignments/attachments/presign {contentType, filename}
   * → AssignmentPresignResponse {uploadUrl, key}.
   * Organizer-only. Throws: 401, 403, 400 bad content-type.
   */
  presignAssignmentAttachment: (serverId: string, contentType: string, filename: string) =>
    request<AssignmentPresignResponse>(`/servers/${serverId}/assignments/attachments/presign`, {
      method: 'POST',
      body: JSON.stringify({ contentType, filename }),
    }),

  /**
   * PUT the assignment attachment file directly to object storage.
   * NOTE: no credentials:include — goes to the S3-compatible endpoint.
   */
  putAssignmentAttachmentToStorage: (uploadUrl: string, file: File): Promise<void> =>
    fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    }).then((res) => {
      if (!res.ok) throw new Error(`Storage PUT failed: ${res.status}`);
    }),

  // ── Assignment submission endpoints (wave-42 M9) ─────────────────────────

  /**
   * POST /assignments/:id/submit {text?, attachment?} → AssignmentSubmission.
   * At least one of text or attachment required.
   * Throws: 401 unauthed, 403 non-member, 404 not found, 400 bad input.
   */
  submitAssignment: (id: string, data: SubmitAssignmentInput): Promise<AssignmentSubmission> =>
    request<AssignmentSubmission>(`/assignments/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * POST /servers/:serverId/assignments/submissions/presign
   * {contentType, filename} → AssignmentSubmissionPresignResponse {uploadUrl, key}.
   * Member-gated. Throws: 401, 403, 400.
   */
  presignSubmissionAttachment: (
    serverId: string,
    contentType: string,
    filename: string,
  ): Promise<AssignmentSubmissionPresignResponse> =>
    request<AssignmentSubmissionPresignResponse>(
      `/servers/${serverId}/assignments/submissions/presign`,
      { method: 'POST', body: JSON.stringify({ contentType, filename }) },
    ),

  /**
   * PUT a submission attachment file directly to object storage.
   * NOTE: no credentials:include — goes to the S3-compatible endpoint.
   */
  putSubmissionAttachmentToStorage: (uploadUrl: string, file: File): Promise<void> =>
    fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    }).then((res) => {
      if (!res.ok) throw new Error(`Storage PUT failed: ${res.status}`);
    }),

  /**
   * GET /assignments/:id/submissions → AssignmentSubmissionsListResponse.
   * Organizer-only (manage_assignments); 403 otherwise.
   * Throws: 401 unauthed, 403 non-organizer, 404 not found.
   */
  listAssignmentSubmissions: (id: string): Promise<AssignmentSubmissionsListResponse> =>
    request<AssignmentSubmissionsListResponse>(`/assignments/${id}/submissions`),

  /**
   * POST /assignments/:id/submissions/:submissionId/return {comment?} → AssignmentSubmission.
   * Organizer-only. :submissionId is the submission UUID PK (not the submitter's userId).
   * Throws: 401, 403, 404.
   */
  returnSubmission: (
    assignmentId: string,
    submissionId: string,
    data: ReturnSubmissionInput,
  ): Promise<AssignmentSubmission> =>
    request<AssignmentSubmission>(
      `/assignments/${assignmentId}/submissions/${submissionId}/return`,
      { method: 'POST', body: JSON.stringify(data) },
    ),

  // ── Scheduled session endpoints (wave-43 M10) ───────────────────────────

  /**
   * POST /servers/:serverId/scheduled-sessions {title,description,startsAt,endsAt,recurrence,recurrenceUntil}
   * → 201 ScheduledSession.
   * Organizer-only (manage_assignments). Throws: 401, 403, 400.
   */
  createSession: (serverId: string, data: CreateScheduledSessionInput): Promise<ScheduledSession> =>
    request<ScheduledSession>(`/servers/${serverId}/scheduled-sessions`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * GET /servers/:serverId/scheduled-sessions?from=&to= → ScheduledSessionListResponse.
   * Member-visible. Expands weekly occurrences in the window.
   * Throws: 401 unauthed, 403 non-member.
   */
  listSessions: (
    serverId: string,
    from: string,
    to: string,
  ): Promise<ScheduledSessionListResponse> => {
    const qs = `?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
    return request<ScheduledSessionListResponse>(`/servers/${serverId}/scheduled-sessions${qs}`);
  },

  /**
   * GET /scheduled-sessions/:id → ScheduledSession.
   * Member-visible. Throws: 401 unauthed, 403 non-member, 404 not found.
   */
  getSession: (id: string): Promise<ScheduledSession> =>
    request<ScheduledSession>(`/scheduled-sessions/${id}`),

  /**
   * PATCH /scheduled-sessions/:id → updated ScheduledSession.
   * Organizer-only partial update. Throws: 401, 403, 404.
   */
  updateSession: (id: string, data: UpdateScheduledSessionInput): Promise<ScheduledSession> =>
    request<ScheduledSession>(`/scheduled-sessions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  /**
   * DELETE /scheduled-sessions/:id → 204 void.
   * Organizer-only. Throws: 401, 403, 404.
   */
  deleteSession: (id: string): Promise<void> =>
    requestNoContent(`/scheduled-sessions/${id}`, { method: 'DELETE' }),

  // ── Voice endpoints (wave-31 M6) ─────────────────────────────────────────

  /**
   * POST /channels/:channelId/voice/token → { token: string, url: string }.
   * Returns the LiveKit JWT and wss:// server URL the client needs to connect.
   * Session + RBAC-gated server-side (AuthGuard + RBAC canViewChannelById).
   *
   * Throws: 400 non-voice channel, 401 unauthed, 403 not a member,
   *         404 channel not found, 503 LiveKit not configured.
   */
  getVoiceToken: (channelId: string) =>
    request<{ token: string; url: string }>(`/channels/${channelId}/voice/token`, {
      method: 'POST',
      body: '{}',
    }),

  /**
   * GET /channels/:channelId/voice/participants
   * → { count: number, participants: { userId: string, displayName: string }[] }.
   *
   * Returns current LiveKit-room occupancy for the given voice channel.
   * Session + RBAC-gated server-side (same gate as voice/token).
   *
   * Throws: 400 non-voice channel, 401 unauthed, 403 not a member,
   *         503 LiveKit not configured (returns {count:0,participants:[]} when creds absent).
   * Empty / not-yet-created room → { count: 0, participants: [] } (not an error).
   */
  getVoiceParticipants: (channelId: string, signal?: AbortSignal) =>
    request<{ count: number; participants: { userId: string; displayName: string }[] }>(
      `/channels/${channelId}/voice/participants`,
      signal != null ? { signal } : undefined,
    ),

  // ── Privacy endpoints (wave-35 M7) ──────────────────────────────────────

  /**
   * GET /profile/privacy → PrivacySettingsResponse {profileVisibility, whoCanDm}.
   * Throws: 401 unauthed.
   */
  getPrivacy: (): Promise<PrivacySettingsResponse> =>
    request<PrivacySettingsResponse>('/profile/privacy'),

  /**
   * PUT /profile/privacy {profileVisibility, whoCanDm} → updated PrivacySettingsResponse.
   * Full-replace semantics (PUT, not PATCH). Throws: 401 unauthed, 400 bad input.
   */
  putPrivacy: (body: UpdatePrivacyInput): Promise<PrivacySettingsResponse> =>
    request<PrivacySettingsResponse>('/profile/privacy', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  /**
   * GET /profile/data → AccountDataResponse.
   * Returns profile fields, membership list, and activity summary held on the
   * authenticated user. Throws: 401 unauthed.
   */
  getAccountData: (): Promise<AccountDataResponse> => request<AccountDataResponse>('/profile/data'),

  // ── Moderation endpoints (wave-41 M8) ────────────────────────────────────

  /**
   * POST /servers/:serverId/members/:userId/timeout {durationMinutes} → 200 { mutedUntil: string }.
   * Requires moderate_members + rank guard. Throws: 401, 403.
   */
  timeoutMember: (
    serverId: string,
    userId: string,
    durationMinutes: number,
  ): Promise<{ mutedUntil: string }> =>
    request<{ mutedUntil: string }>(`/servers/${serverId}/members/${userId}/timeout`, {
      method: 'POST',
      body: JSON.stringify({ durationMinutes }),
    }),

  /**
   * DELETE /servers/:serverId/members/:userId/timeout → 204 void.
   * Removes an active timeout. Requires moderate_members + rank guard.
   * Throws: 401, 403.
   */
  removeTimeout: (serverId: string, userId: string): Promise<void> =>
    requestNoContent(`/servers/${serverId}/members/${userId}/timeout`, { method: 'DELETE' }),

  // ── Notification endpoints (wave-37 M7) ─────────────────────────────────────

  /**
   * GET /me/notifications?cursor= → NotificationListResponse.
   * Returns paginated in-app notifications (newest first) with total unreadCount.
   * Throws: 401 unauthed.
   */
  getNotifications: (cursor?: string): Promise<NotificationListResponse> => {
    const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
    return request<NotificationListResponse>(`/me/notifications${qs}`);
  },

  /**
   * PATCH /me/notifications/:id/read → UnreadCountResponse.
   * Marks a single notification as read. Idempotent.
   * Throws: 401 unauthed, 404 not found or not owned.
   */
  markNotificationRead: (id: string): Promise<UnreadCountResponse> =>
    request<UnreadCountResponse>(`/me/notifications/${id}/read`, {
      method: 'PATCH',
    }),

  /**
   * POST /me/notifications/read-all → UnreadCountResponse.
   * Marks every notification for the authenticated user as read.
   * Throws: 401 unauthed.
   */
  markAllNotificationsRead: (): Promise<UnreadCountResponse> =>
    request<UnreadCountResponse>('/me/notifications/read-all', {
      method: 'POST',
      body: '{}',
    }),

  /**
   * GET /profile/data/export → triggers a file download of the user's data as
   * a JSON blob. Fetches with credentials, creates an object URL, and clicks a
   * temporary anchor with download="studyhall-account-data.json".
   * Throws on non-2xx response.
   */
  // ── Direct message endpoints (wave-46 M8) ────────────────────────────────

  /**
   * POST /dm/conversations {participantIds, isGroup?} → DmConversation.
   * Creates a new 1:1 or group DM. who_can_dm enforced server-side.
   * Throws: 400 (cap/invalid), 403 (policy), 401 unauthed.
   */
  createDmConversation: (body: import('@studyhall/shared').CreateConversationInput) =>
    request<import('@studyhall/shared').DmConversation>('/dm/conversations', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  /**
   * GET /dm/conversations → DmConversationListResponse.
   * Returns conversations where the caller is a participant, ordered by
   * last-message recency.
   * Throws: 401 unauthed.
   * 429-resilient: bounded exponential-backoff retry via retryOn429 (reads only).
   */
  listDmConversations: () =>
    retryOn429(() =>
      request<import('@studyhall/shared').DmConversationListResponse>('/dm/conversations'),
    ),

  /**
   * POST /dm/conversations/:id/messages {content, idempotencyKey} → DmMessage.
   * Caller must be a participant. Idempotent on (conversationId, idempotencyKey).
   * Throws: 403/404 non-participant, 401 unauthed.
   */
  sendDmMessage: (conversationId: string, body: import('@studyhall/shared').SendDmMessageInput) =>
    request<import('@studyhall/shared').DmMessage>(`/dm/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  /**
   * GET /dm/conversations/:id/messages?cursor= → DmMessageListResponse.
   * Cursor-paginated; caller must be a participant.
   * Throws: 403/404 non-participant, 401 unauthed.
   * 429-resilient: bounded exponential-backoff retry via retryOn429 (reads only).
   */
  listDmMessages: (conversationId: string, cursor?: string) => {
    const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
    return retryOn429(() =>
      request<import('@studyhall/shared').DmMessageListResponse>(
        `/dm/conversations/${conversationId}/messages${qs}`,
      ),
    );
  },

  /**
   * GET /dm/candidates → DmCandidate[] (bare array).
   * Returns the caller's DM candidates — DISTINCT members of all servers the
   * caller belongs to, excluding self and users with who_can_dm='nobody'.
   * Ordered stably by displayName. Caller in no servers → 200 [].
   * Throws: 401 unauthed.
   * 429-resilient: bounded exponential-backoff retry via retryOn429 (reads only).
   */
  getDmCandidates: () => retryOn429(() => request<DmCandidate[]>('/dm/candidates')),

  // ── Study timer endpoints (wave-49 M8) ─────────────────────────────────────

  /**
   * GET /servers/:serverId/study-timer → StudyTimer.
   * Returns compute-on-read authoritative timer state (remainingMs/running derived
   * server-side from anchors). idle/no-row → calm idle DTO.
   * Throws: 401 unauthed, 403 non-member.
   */
  getStudyTimer: (serverId: string): Promise<StudyTimer> =>
    request<StudyTimer>(`/servers/${serverId}/study-timer`),

  /**
   * POST /servers/:serverId/study-timer/start → StudyTimer.
   * Starts a new work-phase session (25 min). Idempotent if already running.
   * Throws: 401 unauthed, 403 non-member.
   */
  startStudyTimer: (serverId: string): Promise<StudyTimer> =>
    request<StudyTimer>(`/servers/${serverId}/study-timer/start`, {
      method: 'POST',
      body: '{}',
    }),

  /**
   * POST /servers/:serverId/study-timer/pause → StudyTimer.
   * Freezes the countdown (paused_remaining_ms = ends_at - now).
   * Throws: 401 unauthed, 403 non-member.
   */
  pauseStudyTimer: (serverId: string): Promise<StudyTimer> =>
    request<StudyTimer>(`/servers/${serverId}/study-timer/pause`, {
      method: 'POST',
      body: '{}',
    }),

  /**
   * POST /servers/:serverId/study-timer/resume → StudyTimer.
   * Resumes from frozen remaining (ends_at = now + paused_remaining_ms).
   * Throws: 401 unauthed, 403 non-member.
   */
  resumeStudyTimer: (serverId: string): Promise<StudyTimer> =>
    request<StudyTimer>(`/servers/${serverId}/study-timer/resume`, {
      method: 'POST',
      body: '{}',
    }),

  /**
   * POST /servers/:serverId/study-timer/reset → StudyTimer.
   * Returns to idle state (run_state='idle', phase='work', endsAt=null).
   * Throws: 401 unauthed, 403 non-member.
   */
  resetStudyTimer: (serverId: string): Promise<StudyTimer> =>
    request<StudyTimer>(`/servers/${serverId}/study-timer/reset`, {
      method: 'POST',
      body: '{}',
    }),

  /**
   * PATCH /servers/:serverId/study-timer/config {workMinutes, breakMinutes} → StudyTimer.
   * Updates per-server work/break durations (work 1-120 min, break 1-60 min).
   * Config is allowed ONLY while the timer is idle; a running/paused timer returns 409.
   * The updated DTO is broadcast to the server room via study-timer:update so all
   * members' widgets reconcile without a page reload.
   * Throws: 400 invalid range, 409 timer not idle, 403 non-member, 401 anon.
   */
  configureStudyTimer: (serverId: string, body: StudyTimerConfig): Promise<StudyTimer> =>
    request<StudyTimer>(`/servers/${serverId}/study-timer/config`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  // ── Server overview / publish endpoints (wave-68 M13) ───────────────────

  /**
   * PATCH /servers/:id {is_public?, description?, topic?} → ServerSummary.
   * Owner-only. Omitted fields are unchanged; null clears description/topic.
   * Throws: 400 invalid body, 403 non-owner, 404 not found.
   */
  updateServer: (
    serverId: string,
    patch: import('@studyhall/shared').UpdateServer,
  ): Promise<import('@studyhall/shared').ServerSummary> =>
    request<import('@studyhall/shared').ServerSummary>(`/servers/${serverId}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),

  // ── Server discovery endpoints (wave-67 M12) ─────────────────────────────

  /**
   * GET /servers/discover?q=&limit=&offset= → DiscoverServersResponse.
   * Public server directory; auth-required (AuthGuard).
   * Throws: 401 unauthed.
   */
  getDiscoverServers: (params?: {
    q?: string;
    limit?: number;
    offset?: number;
  }): Promise<import('@studyhall/shared').DiscoverServersResponse> => {
    const qs = new URLSearchParams();
    if (params?.q) qs.set('q', params.q);
    if (params?.limit != null) qs.set('limit', String(params.limit));
    if (params?.offset != null) qs.set('offset', String(params.offset));
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return request<import('@studyhall/shared').DiscoverServersResponse>(
      `/servers/discover${suffix}`,
    );
  },

  /**
   * POST /servers/:id/join-public → JoinResult ({ serverId }).
   * Joins a public server (is_public-gated — rejects private with 404/403).
   * Idempotent: re-joining returns the same serverId.
   * Throws: 401 unauthed, 403/404 private or not found.
   */
  joinPublicServer: (serverId: string): Promise<JoinResult> =>
    request<JoinResult>(`/servers/${serverId}/join-public`, { method: 'POST', body: '{}' }),

  // ── Report endpoints (wave-69 M14) ──────────────────────────────────────────

  /**
   * POST /reports {target_type, target_server_id?, target_user_id?, target_message_id?, reason}
   * → 201 Report.
   * Auth-required. Throws: 401 unauthed, 400 bad input.
   */
  createReport: (body: CreateReport): Promise<Report> =>
    request<Report>('/reports', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  /**
   * GET /servers/:serverId/reports?status=open → Report[].
   * Requires moderate_members. Throws: 401 unauthed, 403 non-mod.
   */
  getServerReports: (serverId: string, status?: string): Promise<Report[]> => {
    const qs = status ? `?status=${encodeURIComponent(status)}` : '';
    return request<Report[]>(`/servers/${serverId}/reports${qs}`);
  },

  /**
   * POST /servers/:serverId/reports/:reportId/resolve {action} → Report.
   * Requires moderate_members. Throws: 401 unauthed, 403 non-mod, 404 not found.
   */
  resolveReport: (
    serverId: string,
    reportId: string,
    action: ResolveReportAction,
  ): Promise<Report> =>
    request<Report>(`/servers/${serverId}/reports/${reportId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    }),

  // ── Block endpoints (wave-70 M14) ───────────────────────────────────────────

  /**
   * POST /blocks {blockedUserId} → 201 Block.
   * Auth-required. Idempotent (re-blocking returns the existing row).
   * Throws: 400 bad input, 401 unauthed, 409 self-block.
   */
  blockUser: (blockedUserId: string): Promise<Block> =>
    request<Block>('/blocks', {
      method: 'POST',
      body: JSON.stringify({ blockedUserId }),
    }),

  /**
   * DELETE /blocks/:blockedUserId → 204 void.
   * Auth-required. Idempotent (unblocking a non-blocked user is a no-op).
   * Throws: 401 unauthed.
   */
  unblockUser: (blockedUserId: string): Promise<void> =>
    requestNoContent(`/blocks/${blockedUserId}`, { method: 'DELETE' }),

  /**
   * GET /blocks → { blocks: BlockListItem[] }.
   * Returns the caller's block list (blocks they initiated), enriched with
   * blockedUser display fields (displayName, username, avatarUrl).
   * Throws: 401 unauthed.
   */
  getBlocks: (): Promise<BlockListItem[]> =>
    request<{ blocks: BlockListItem[] }>('/blocks').then((res) => res.blocks),

  // ── Account deletion (wave-72 B-3) ─────────────────────────────────────────

  /**
   * POST /profile/delete {confirm: true} → DeleteAccountResponse.
   *
   * On 200: returns parsed DeleteAccountResponse {status: 'deleted'}.
   *   The server has already revoked all sessions — the caller must clear
   *   client-side auth state and navigate to /login.
   *
   * On 409: the caller owns one or more servers that must be transferred or
   *   deleted first. Throws DeleteAccountBlockedError carrying reason + servers[]
   *   so the UI can render the list without redirecting.
   *
   * Throws HttpError for any other non-2xx status.
   */
  deleteAccount: async (): Promise<DeleteAccountResponse> => {
    const res = await fetch(`${BASE}/profile/delete`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirm: true }),
    });

    if (res.status === 409) {
      // Owner-blocked: parse the blocked response and throw a typed error.
      const rawBody = await res.json().catch(() => ({}));
      const parsed = DeleteAccountBlockedResponseSchema.safeParse(rawBody);
      if (parsed.success) {
        throw new DeleteAccountBlockedError(parsed.data);
      }
      // If parse fails fall through to generic HttpError below.
      throw new HttpError(409, `409 Conflict: ${JSON.stringify(rawBody)}`);
    }

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new HttpError(res.status, `${res.status} ${res.statusText}: ${body}`);
    }

    const rawSuccess = await res.json().catch(() => ({}));
    const parsed = DeleteAccountResponseSchema.safeParse(rawSuccess);
    if (!parsed.success) {
      throw new Error(`Unexpected delete-account response shape: ${JSON.stringify(rawSuccess)}`);
    }
    return parsed.data;
  },

  exportAccountData: async (): Promise<void> => {
    const res = await fetch(`${BASE}/profile/data/export`, { credentials: 'include' });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`${res.status} ${res.statusText}: ${body}`);
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'studyhall-account-data.json';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  },
};
