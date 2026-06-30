export { HealthResponseSchema } from './health.js';
export type { HealthResponse } from './health.js';

export { MeResponseSchema } from './auth.js';
export type { MeResponse } from './auth.js';

export {
  ProfileResponseSchema,
  UpdateProfileSchema,
  AvatarPresignResponseSchema,
} from './profile.js';
export type { ProfileResponse, UpdateProfileInput, AvatarPresignResponse } from './profile.js';

export {
  CreateServerSchema,
  ServerResponseSchema,
  ServerSummarySchema,
  ServerSummaryWithInviteSchema,
  ChannelSummarySchema,
  CategoryWithChannelsSchema,
  ServerDetailSchema,
  ServerMemberSchema,
  ServerMembersResponseSchema,
} from './servers.js';
export type {
  CreateServerInput,
  ServerResponse,
  ServerSummary,
  ServerSummaryWithInvite,
  ChannelSummary,
  CategoryWithChannels,
  ServerDetail,
  ServerMember,
  ServerMembersResponse,
} from './servers.js';

export {
  InvitePreviewSchema,
  CreateInviteSchema,
  InviteResponseSchema,
  JoinResultSchema,
} from './invites.js';
export type { InvitePreview, CreateInviteInput, InviteResponse, JoinResult } from './invites.js';

export {
  RolePermissionsSchema,
  RoleSchema,
  ChannelOverrideSchema,
  CreateRoleSchema,
  UpdateRoleSchema,
  AssignRoleSchema,
  UpsertChannelOverrideSchema,
} from './rbac.js';
export type {
  RolePermissions,
  Role,
  ChannelOverride,
  CreateRoleInput,
  UpdateRoleInput,
  AssignRoleInput,
  UpsertChannelOverrideInput,
} from './rbac.js';

export {
  ReactionSummarySchema,
  MentionRefSchema,
  MessageResponseSchema,
  SendMessageSchema,
  EditMessageSchema,
  ReactionToggleSchema,
  ReactionToggleResponseSchema,
  MessageListSchema,
  MyMentionsResponseSchema,
} from './messaging.js';
export type {
  ReactionSummary,
  MentionRef,
  MessageResponse,
  SendMessageInput,
  EditMessageInput,
  ReactionToggleInput,
  ReactionToggleResponse,
  MessageList,
  MyMentionsResponse,
} from './messaging.js';

export {
  PresenceStatusSchema,
  PresenceStateSchema,
  PresenceSnapshotSchema,
  PresenceOnlinePayloadSchema,
  PresenceOfflinePayloadSchema,
  TypingStartSchema,
  TypingStopSchema,
  TypingActiveSchema,
  PRESENCE_EVENTS,
} from './presence.js';
export type {
  PresenceStatus,
  PresenceState,
  PresenceSnapshot,
  PresenceOnlinePayload,
  PresenceOfflinePayload,
  TypingStartInput,
  TypingStopInput,
  TypingActive,
} from './presence.js';
