import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { EventEmitter2 } from '@nestjs/event-emitter';
import type {
  AttachmentRef,
  MentionEvent,
  MessageList,
  MessageResponse,
  MessagesAfterResponse,
  MyMentionsResponse,
  ReactionToggleResponse,
  SendMessageInput,
  ThreadRepliesResponse,
  ThreadReplyDeletedEvent,
  ThreadReplyEvent,
  ValidatedAttachment,
} from '@studyhall/shared';
import { and, eq, inArray, lt, max, or, sql } from 'drizzle-orm';
import { db } from '../db/index';
import {
  attachments,
  channels,
  message_mentions,
  message_reactions,
  messages,
  roles,
  server_members,
  servers,
  users,
} from '../db/schema/index';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { ATTACHMENT_ALLOWED_MIME, FilesService } from '../files/files.service';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { RbacService } from '../rbac/rbac.service';
import { parseMentions } from './mentions';

// ---------------------------------------------------------------------------
// MessagesService — wave-12 M3 REST data plane (task a0c322b4)
//                 + wave-13 M3 edit/delete/reactions (tasks e12886d7 + d78df376)
//                 + wave-15 M3 @mention parse/resolve/persist (task 3d238446)
//                 + wave-18 M3 thread replies (task 497c2ae6)
// ---------------------------------------------------------------------------

/** Opaque cursor encoding: base64(createdAt_iso|id) */
function encodeCursor(createdAt: Date, id: string): string {
  return Buffer.from(`${createdAt.toISOString()}|${id}`).toString('base64url');
}

function decodeCursor(cursor: string): { createdAt: Date; id: string } | null {
  try {
    const raw = Buffer.from(cursor, 'base64url').toString('utf8');
    const sep = raw.indexOf('|');
    if (sep === -1) return null;
    const iso = raw.slice(0, sep);
    const id = raw.slice(sep + 1);
    const createdAt = new Date(iso);
    if (Number.isNaN(createdAt.getTime())) return null;
    return { createdAt, id };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// ReactionRow — raw DB row from message_reactions
// ---------------------------------------------------------------------------

interface ReactionRow {
  message_id: string;
  user_id: string;
  emoji: string;
}

// ---------------------------------------------------------------------------
// MentionRow — raw DB row from message_mentions + joined username
// ---------------------------------------------------------------------------

interface MentionRow {
  message_id: string;
  mentioned_user_id: string;
  username: string | null;
}

// ---------------------------------------------------------------------------
// rowToDto — map a DB row + aggregated reactions + mentions to MessageResponse
//
// Soft-deleted messages: content becomes null (tombstone), isDeleted=true.
// Reactions are always included (may be empty array).
// Mentions are always included (may be empty array); soft-deleted messages
// still carry their mentions[] so the caller can reason about them, but
// my-mentions excludes soft-deleted rows at the query level.
// ---------------------------------------------------------------------------

function rowToDto(
  row: {
    id: string;
    channel_id: string;
    author_id: string;
    content: string;
    created_at: Date;
    is_edited: boolean;
    edited_at: Date | null;
    is_deleted: boolean;
    deleted_at: Date | null;
    // wave-18 thread reply fields (optional — older call-sites don't supply them)
    thread_parent_id?: string | null;
    reply_count?: number;
    last_reply_at?: Date | null;
    // wave-58: echoed back for optimistic reconciliation; null on historical/server rows
    idempotency_key?: string | null;
  },
  reactions: ReactionRow[],
  viewerUserId: string,
  mentionRows: MentionRow[] = [],
  attachmentRefs: AttachmentRef[] = [],
): MessageResponse {
  // Aggregate reactions for this message
  const emojiMap = new Map<string, { count: number; reactedByMe: boolean }>();
  for (const r of reactions) {
    if (r.message_id !== row.id) continue;
    const existing = emojiMap.get(r.emoji);
    if (existing) {
      existing.count += 1;
      if (r.user_id === viewerUserId) existing.reactedByMe = true;
    } else {
      emojiMap.set(r.emoji, {
        count: 1,
        reactedByMe: r.user_id === viewerUserId,
      });
    }
  }

  const reactionSummaries = Array.from(emojiMap.entries()).map(
    ([emoji, { count, reactedByMe }]) => ({
      emoji,
      count,
      reactedByMe,
    }),
  );

  // Aggregate mentions for this message (filter to this row's id, skip null usernames)
  const mentions = mentionRows
    .filter((m) => m.message_id === row.id && m.username !== null)
    .map((m) => ({ userId: m.mentioned_user_id, username: m.username as string }));

  return {
    id: row.id,
    channelId: row.channel_id,
    authorId: row.author_id,
    // Soft-deleted: content is null (tombstone); callers MUST NOT expose old content
    content: row.is_deleted ? null : row.content,
    createdAt: row.created_at.toISOString(),
    isEdited: row.is_edited,
    editedAt: row.edited_at ? row.edited_at.toISOString() : null,
    isDeleted: row.is_deleted,
    reactions: reactionSummaries,
    mentions,
    // wave-18 thread fields:
    //   threadParentId — set on reply rows; null/undefined on top-level messages
    //   replyCount / lastReplyAt — set on top-level messages (the parent); absent on replies
    threadParentId: row.thread_parent_id ?? null,
    replyCount: row.reply_count ?? 0,
    lastReplyAt: row.last_reply_at ? row.last_reply_at.toISOString() : null,
    // wave-19 M3 — attachments (empty array on soft-deleted or unattached messages)
    attachments: attachmentRefs,
    // wave-58 — client-generated idempotency key echoed for optimistic reconciliation.
    // Defaults to null for rows that don't carry the column (partial select call-sites).
    idempotencyKey: row.idempotency_key ?? null,
  };
}

// ---------------------------------------------------------------------------
// resolveMentions — parse @username tokens, resolve to server members, return
// rows ready for message_mentions INSERT.
//
// Security invariant:
//   - Only users who are MEMBERS of the channel's server are resolved.
//   - username IS NOT NULL guard applied — prevents NULL username from
//     matching an unset-username user (P-4 carry-forward).
//   - @everyone/@here/@role are out of scope (parseMentions only captures
//     individual username tokens).
//
// Returns: array of { message_id, mentioned_user_id } ready for db.insert().
// ---------------------------------------------------------------------------

async function resolveMentions(
  messageId: string,
  body: string,
  serverId: string,
): Promise<Array<{ message_id: string; mentioned_user_id: string }>> {
  const tokens = parseMentions(body);
  if (tokens.length === 0) return [];

  // JOIN server_members ⋈ users WHERE lower(username) = ANY(tokens)
  // AND username IS NOT NULL AND server_id = serverId
  // Returns only users who are actual members of this server.
  const resolved = await db
    .select({
      user_id: server_members.user_id,
    })
    .from(server_members)
    .innerJoin(users, eq(server_members.user_id, users.id))
    .where(
      and(
        eq(server_members.server_id, serverId),
        sql`${users.username} IS NOT NULL`,
        inArray(sql`lower(${users.username})`, tokens),
      ),
    );

  return resolved.map((r) => ({
    message_id: messageId,
    mentioned_user_id: r.user_id,
  }));
}

// ---------------------------------------------------------------------------
// fetchMentionRows — batch-load mention rows for a set of message IDs,
// joined with username. Called once per page (no N+1).
// ---------------------------------------------------------------------------

async function fetchMentionRows(messageIds: string[]): Promise<MentionRow[]> {
  if (messageIds.length === 0) return [];

  return db
    .select({
      message_id: message_mentions.message_id,
      mentioned_user_id: message_mentions.mentioned_user_id,
      username: users.username,
    })
    .from(message_mentions)
    .innerJoin(users, eq(message_mentions.mentioned_user_id, users.id))
    .where(inArray(message_mentions.message_id, messageIds));
}

// ---------------------------------------------------------------------------
// AttachmentRow — raw DB row from the attachments table (batch-load)
// ---------------------------------------------------------------------------

interface AttachmentRow {
  id: string;
  message_id: string;
  object_key: string;
  filename: string;
  content_type: string;
  size_bytes: number;
}

// ---------------------------------------------------------------------------
// fetchAttachmentRows — batch-load attachment rows for a set of message IDs.
// Called once per page (no N+1).
// ---------------------------------------------------------------------------

async function fetchAttachmentRows(messageIds: string[]): Promise<AttachmentRow[]> {
  if (messageIds.length === 0) return [];

  return db
    .select({
      id: attachments.id,
      message_id: attachments.message_id,
      object_key: attachments.object_key,
      filename: attachments.filename,
      content_type: attachments.content_type,
      size_bytes: attachments.size_bytes,
    })
    .from(attachments)
    .where(inArray(attachments.message_id, messageIds));
}

// ---------------------------------------------------------------------------
// buildAttachmentRefMap — given raw attachment rows + filesService for URL
// signing, build a Map<messageId, AttachmentRef[]> for O(1) lookup in rowToDto.
//
// presigned-GET URLs are resolved in parallel (Promise.all) — Railway Buckets
// are private so we cannot use static public URLs (karen C7 carry).
// If filesService.resolveAttachmentUrl returns null (storage not configured),
// the url field falls back to an empty string (graceful degradation consistent
// with the 503 pattern elsewhere).
// ---------------------------------------------------------------------------

async function buildAttachmentRefMap(
  rows: AttachmentRow[],
  filesService: FilesService,
): Promise<Map<string, AttachmentRef[]>> {
  const map = new Map<string, AttachmentRef[]>();
  if (rows.length === 0) return map;

  // Resolve all presigned-GET URLs in parallel
  const urls = await Promise.all(rows.map((r) => filesService.resolveAttachmentUrl(r.object_key)));

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const url = urls[i];
    if (!row) continue;
    const ref: AttachmentRef = {
      id: row.id,
      filename: row.filename,
      contentType: row.content_type,
      sizeBytes: row.size_bytes,
      url: url ?? '',
    };
    const existing = map.get(row.message_id);
    if (existing) {
      existing.push(ref);
    } else {
      map.set(row.message_id, [ref]);
    }
  }

  return map;
}

// ---------------------------------------------------------------------------
// Attachment send-time invariants (C-1 fix — wave-19 B-6)
//
// /confirm is an OPTIONAL UX pre-check; SEND is the BINDING enforcement gate.
//
// Before any attachment row is INSERTed the following are checked per descriptor:
//   1. Channel-scope guard (closes IDOR / cross-channel key swap):
//      The object_key must match ^attachments/<channelId>/[A-Za-z0-9._-]+$
//      anchored at both ends, with channelId from the message's ACTUAL channel
//      (never a client-supplied value).  Path-traversal segments (".." etc.) and
//      nested slashes are rejected by the character class.
//
//   2. HeadObject re-derive (closes size-bypass + type-spoof):
//      FilesService.headAttachment() is called to get the SERVER-authoritative
//      ContentLength and ContentType.  The client-supplied sizeBytes / contentType
//      are discarded.  Only the server-derived values are INSERTed.
//
//   3. Size cap: server ContentLength must be ≤ ATTACHMENT_SEND_MAX_BYTES (10 MB).
//
//   4. MIME allowlist: server ContentType must be in ATTACHMENT_ALLOWED_MIME.
// ---------------------------------------------------------------------------

const ATTACHMENT_SEND_MAX_BYTES = 10 * 1024 * 1024; // 10 MB — mirrors FilesService cap

/**
 * Server-side attachment descriptor validation at SEND time (C-1 fix).
 *
 * Returns an array of { ...descriptor, sizeBytes, contentType } where
 * sizeBytes and contentType come from HeadObject (NOT the client payload).
 *
 * Throws:
 *   400 BadRequestException  — key fails anchored channel-scope regex
 *   413 PayloadTooLargeException — server-reported size > 10 MB
 *   400 BadRequestException  — server-reported MIME not in allowlist
 *   503 ServiceUnavailableException — storage not configured (propagated)
 */
async function validateAndHeadAttachments(
  descriptors: import('@studyhall/shared').ValidatedAttachment[],
  channelId: string,
  filesService: FilesService,
): Promise<
  Array<{
    key: string;
    filename: string;
    contentType: string;
    sizeBytes: number;
  }>
> {
  if (descriptors.length === 0) return [];

  // Escape channelId for regex interpolation (UUIDs are safe; belt-and-suspenders).
  const escapedChannelId = channelId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const KEY_PATTERN = new RegExp(`^attachments/${escapedChannelId}/[A-Za-z0-9._-]+$`);

  const validated: Array<{
    key: string;
    filename: string;
    contentType: string;
    sizeBytes: number;
  }> = [];

  for (const descriptor of descriptors) {
    // 1. Channel-scope + path-traversal guard
    if (!KEY_PATTERN.test(descriptor.key)) {
      throw new BadRequestException(
        `Attachment key is not scoped to this channel or contains invalid characters: ${descriptor.key}`,
      );
    }

    // 2. HeadObject — server-derived ContentLength + ContentType
    const { contentLength, contentType: serverContentType } = await filesService.headAttachment(
      descriptor.key,
    );

    // 3. Size cap (server-authoritative)
    if (contentLength > ATTACHMENT_SEND_MAX_BYTES) {
      throw new PayloadTooLargeException({
        code: 'ATTACHMENT_TOO_LARGE',
        message: `Attachment must be ≤ 10 MB. Object ${descriptor.key} is ${Math.ceil(contentLength / 1024)} KB.`,
      });
    }

    // 4. MIME allowlist (server-authoritative)
    if (!(serverContentType in ATTACHMENT_ALLOWED_MIME)) {
      throw new BadRequestException(
        `Attachment content-type '${serverContentType}' is not permitted. Allowed: ${Object.keys(ATTACHMENT_ALLOWED_MIME).join(', ')}`,
      );
    }

    validated.push({
      key: descriptor.key,
      filename: descriptor.filename,
      contentType: serverContentType, // server-derived — NOT client-claimed
      sizeBytes: contentLength, // server-derived — NOT client-claimed
    });
  }

  return validated;
}

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly rbacService: RbacService,
    private readonly filesService: FilesService,
  ) {}

  // -------------------------------------------------------------------------
  // createMessage — INSERT with idempotency
  //
  // Security invariant: authorId is always req.session.getUserId() —
  // never from the request body. Enforced in the controller.
  //
  // Idempotency: ON CONFLICT (channel_id, idempotency_key) DO NOTHING.
  // If a repeat idempotencyKey is submitted, the existing message is returned
  // without error (no duplicate insertion).
  //
  // Emits: 'message.created' (EventEmitter2) for the Socket.IO gateway.
  // -------------------------------------------------------------------------

  async createMessage(
    channelId: string,
    authorId: string,
    input: SendMessageInput,
  ): Promise<MessageResponse> {
    // Verify channel exists (guard already verified permission, but service
    // provides a clean 404 for a missing channel as defence-in-depth).
    // Fetch server_id (mention resolution) and name (mention event channelName).
    const [channel] = await db
      .select({ id: channels.id, server_id: channels.server_id, name: channels.name })
      .from(channels)
      .where(eq(channels.id, channelId))
      .limit(1);

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    // -----------------------------------------------------------------------
    // wave-41 send-gate: refuse if the sender's server_members.muted_until > now().
    // Delegated to assertNotMuted (shared with createReply).
    // -----------------------------------------------------------------------
    await this.assertNotMuted(authorId, channel.server_id);

    // Attempt insert; idempotency_key may be null (no dedup) or a client key
    const idempotencyKey = input.idempotencyKey ?? null;
    const rawAttachmentDescriptors: ValidatedAttachment[] = input.attachments ?? [];

    // -----------------------------------------------------------------------
    // C-1 fix (wave-19 B-6) — server-validate attachment descriptors BEFORE
    // any DB write.  validateAndHeadAttachments:
    //   (a) enforces an anchored channel-scope regex on each key (IDOR guard)
    //   (b) calls HeadObject to get server-authoritative size + content-type
    //   (c) rejects keys >10MB or with disallowed MIME
    // The resulting `attachmentDescriptors` carry SERVER-DERIVED size/type,
    // not the client-supplied values — so the INSERT below is safe.
    // -----------------------------------------------------------------------
    const attachmentDescriptors = await validateAndHeadAttachments(
      rawAttachmentDescriptors,
      channelId,
      this.filesService,
    );

    // -----------------------------------------------------------------------
    // Wrap message INSERT + attachment INSERT in a single db.transaction.
    //
    // row-at-send (P-4): attachment rows are born here, not at /confirm.
    // message_id is NOT NULL in the schema, so this transaction is the only
    // location where attachment rows can be created.
    //
    // Idempotency: ON CONFLICT (channel_id, idempotency_key) DO NOTHING.
    // On an idempotent replay (key conflict) the INSERT returns nothing; we
    // re-fetch the existing message and skip attachment INSERT entirely
    // (isNewInsert = false guard) so replays do NOT double-attach.
    // -----------------------------------------------------------------------
    const message = await db.transaction(async (tx) => {
      // INSERT ... ON CONFLICT (channel_id, idempotency_key) DO NOTHING
      // The UNIQUE constraint only fires when idempotency_key IS NOT NULL
      // (NULL values are never considered equal in a UNIQUE index).
      const insertReturning = await tx
        .insert(messages)
        .values({
          channel_id: channelId,
          author_id: authorId,
          content: input.content,
          idempotency_key: idempotencyKey,
        })
        .onConflictDoNothing({
          target: [messages.channel_id, messages.idempotency_key],
        })
        .returning();

      const isNewInsert = insertReturning.length > 0;

      // Fetch the canonical message row (handles both fresh insert + replay).
      let messageRow: typeof messages.$inferSelect | undefined;

      if (isNewInsert) {
        messageRow = insertReturning[0];
      } else if (idempotencyKey !== null) {
        // Idempotent replay: fetch the existing row by idempotency_key
        const [existing] = await tx
          .select()
          .from(messages)
          .where(
            and(eq(messages.channel_id, channelId), eq(messages.idempotency_key, idempotencyKey)),
          )
          .limit(1);
        messageRow = existing;
      } else {
        // No idempotency key — fetch the most recently inserted row for this
        // author+channel+content within a small window (best-effort; non-idempotent path)
        const [latest] = await tx
          .select()
          .from(messages)
          .where(
            and(
              eq(messages.channel_id, channelId),
              eq(messages.author_id, authorId),
              eq(messages.content, input.content),
              sql`${messages.idempotency_key} IS NULL`,
            ),
          )
          .orderBy(sql`${messages.created_at} DESC`)
          .limit(1);
        messageRow = latest;
      }

      if (!messageRow) {
        throw new Error('Message insert failed unexpectedly');
      }

      // Attachment INSERT (row-at-send) — ONLY on new insert, not replay.
      // uploader_id = authorId (session-derived), channel_id = channelId (route).
      // On replay: skip to avoid double-attaching.
      // messageRow is guaranteed non-null here (thrown above if undefined).
      const confirmedMessageRow = messageRow;
      if (isNewInsert && attachmentDescriptors.length > 0) {
        await tx.insert(attachments).values(
          attachmentDescriptors.map((a) => ({
            message_id: confirmedMessageRow.id,
            uploader_id: authorId,
            channel_id: channelId,
            object_key: a.key,
            filename: a.filename,
            content_type: a.contentType,
            size_bytes: a.sizeBytes,
          })),
        );
      }

      return messageRow;
    });

    // Resolve @username tokens to server members and persist mention rows.
    // ON CONFLICT DO NOTHING — idempotent if this path is replayed.
    const mentionValues = await resolveMentions(message.id, input.content, channel.server_id);
    if (mentionValues.length > 0) {
      await db
        .insert(message_mentions)
        .values(mentionValues)
        .onConflictDoNothing({
          target: [message_mentions.message_id, message_mentions.mentioned_user_id],
        });
    }

    // Fetch persisted mention rows (with username) for the DTO
    const mentionRows = await fetchMentionRows([message.id]);

    // Batch-load attachments for this single message and resolve presigned URLs
    const attachmentRows = await fetchAttachmentRows([message.id]);
    const attachmentRefMap = await buildAttachmentRefMap(attachmentRows, this.filesService);
    const attachmentRefs = attachmentRefMap.get(message.id) ?? [];

    const dto = rowToDto(message, [], authorId, mentionRows, attachmentRefs);

    // Emit domain event for the Socket.IO gateway (@OnEvent('message.created'))
    // mentions[] + attachments[] ride on the DTO — no new event needed
    this.eventEmitter.emit('message.created', dto);

    // Emit per-user mention events for cross-channel unread-mention signal.
    //
    // One 'mention.created' event is emitted per mentioned user so each user's
    // 'user:<id>' room receives only their own event.
    //
    // Author exclusion: if the author mentions themselves, no mention event is
    // emitted (a user should not receive a badge for their own message).
    //
    // channelName and serverId are included so the client can attribute the
    // unread badge to the correct channel and server without an additional fetch.
    if (mentionValues.length > 0) {
      for (const { mentioned_user_id } of mentionValues) {
        if (mentioned_user_id === authorId) continue; // exclude self-mention
        const mentionEvent: MentionEvent = {
          messageId: message.id,
          channelId,
          channelName: channel.name,
          serverId: channel.server_id,
          mentionedUserId: mentioned_user_id,
        };
        this.eventEmitter.emit('mention.created', mentionEvent);
      }
    }

    return dto;
  }

  // -------------------------------------------------------------------------
  // editMessage — PATCH /channels/:channelId/messages/:messageId
  //
  // Security:
  //   - AUTHOR-ONLY: userId must equal message.author_id → ForbiddenException(403)
  //   - Cannot edit a deleted message → ConflictException(409)
  //   - Message not found → NotFoundException(404)
  //
  // Sets is_edited=true, edited_at=now(), updates content.
  // Emits: 'message.updated' for the gateway fan-out.
  // -------------------------------------------------------------------------

  async editMessage(
    channelId: string,
    messageId: string,
    userId: string,
    content: string,
  ): Promise<MessageResponse> {
    const [message] = await db
      .select()
      .from(messages)
      .where(and(eq(messages.id, messageId), eq(messages.channel_id, channelId)))
      .limit(1);

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Author-only gate
    if (message.author_id !== userId) {
      throw new ForbiddenException('Only the author can edit this message');
    }

    // Cannot edit a deleted message
    if (message.is_deleted) {
      throw new ConflictException('Cannot edit a deleted message');
    }

    // Resolve the channel's server_id for mention resolution (and name for mention events)
    const [channel] = await db
      .select({ server_id: channels.server_id, name: channels.name })
      .from(channels)
      .where(eq(channels.id, channelId))
      .limit(1);

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    // -----------------------------------------------------------------------
    // Mention diff pre-read: resolve current and new mention sets BEFORE
    // opening the transaction so the transaction body is pure write-only
    // (reads here are non-transactional but consistent for the diff; the
    // three writes below are the atomicity boundary).
    // -----------------------------------------------------------------------

    // Existing mentioned user IDs
    const existingMentions = await db
      .select({ mentioned_user_id: message_mentions.mentioned_user_id })
      .from(message_mentions)
      .where(eq(message_mentions.message_id, messageId));

    const existingIds = new Set(existingMentions.map((m) => m.mentioned_user_id));

    // Newly resolved mention values
    const newMentionValues = await resolveMentions(messageId, content, channel.server_id);
    const newIds = new Set(newMentionValues.map((m) => m.mentioned_user_id));

    // Removals: in existingIds but not in newIds
    const toRemove = [...existingIds].filter((id) => !newIds.has(id));

    // Additions: in newIds but not in existingIds
    const toInsert = newMentionValues.filter((m) => !existingIds.has(m.mentioned_user_id));

    // -----------------------------------------------------------------------
    // Atomic transaction: UPDATE messages + DELETE stale mention rows +
    // INSERT new mention rows. A mid-txn failure rolls back all three writes
    // so the pre-edit state is fully preserved. Mirrors createReply (~:1031).
    // -----------------------------------------------------------------------
    const now = new Date();
    const updated = await db.transaction(async (tx) => {
      const [updatedRow] = await tx
        .update(messages)
        .set({ content, is_edited: true, edited_at: now })
        .where(eq(messages.id, messageId))
        .returning();

      if (!updatedRow) {
        throw new Error('Message update failed unexpectedly');
      }

      if (toRemove.length > 0) {
        await tx
          .delete(message_mentions)
          .where(
            and(
              eq(message_mentions.message_id, messageId),
              inArray(message_mentions.mentioned_user_id, toRemove),
            ),
          );
      }

      if (toInsert.length > 0) {
        await tx
          .insert(message_mentions)
          .values(toInsert)
          .onConflictDoNothing({
            target: [message_mentions.message_id, message_mentions.mentioned_user_id],
          });
      }

      return updatedRow;
    });

    // Fetch updated mention rows (with username) for the DTO
    const mentionRows = await fetchMentionRows([messageId]);

    // Fetch reactions for the updated message
    const reactions = await db
      .select({
        message_id: message_reactions.message_id,
        user_id: message_reactions.user_id,
        emoji: message_reactions.emoji,
      })
      .from(message_reactions)
      .where(eq(message_reactions.message_id, messageId));

    const dto = rowToDto(updated, reactions, userId, mentionRows);

    // Emit event for gateway fan-out (mentions[] rides on the DTO)
    this.eventEmitter.emit('message.updated', dto);

    // Emit per-user mention events for newly-added mentions on edit.
    // Only users in `toInsert` (not previously mentioned) receive a mention
    // event; removed or pre-existing mentions do not fire a new event.
    // Author exclusion applies here too.
    if (toInsert.length > 0) {
      for (const { mentioned_user_id } of toInsert) {
        if (mentioned_user_id === userId) continue; // exclude self-mention
        const mentionEvent: MentionEvent = {
          messageId,
          channelId,
          channelName: channel.name,
          serverId: channel.server_id,
          mentionedUserId: mentioned_user_id,
        };
        this.eventEmitter.emit('mention.created', mentionEvent);
      }
    }

    return dto;
  }

  // -------------------------------------------------------------------------
  // deleteMessage — DELETE /channels/:channelId/messages/:messageId
  //
  // Security:
  //   - author_id === userId → allowed (author deletes own message)
  //   - OR rbacService.can(userId, serverId, 'manage_channels') → allowed (moderator)
  //   - serverId resolved from channels.server_id (SELECT server_id FROM channels
  //     WHERE id = channelId) — NEVER trusted from request; channels.server_id notNull.
  //   - Neither → ForbiddenException(403)
  //
  // Soft-delete: is_deleted=true, deleted_at=now(), content cleared to empty string
  // (tombstoned — rowToDto() returns content:null for is_deleted rows).
  // Idempotent: double-delete returns 204 without error.
  //
  // Emits: 'message.deleted' for the gateway fan-out.
  // -------------------------------------------------------------------------

  async deleteMessage(channelId: string, messageId: string, userId: string): Promise<void> {
    const [message] = await db
      .select()
      .from(messages)
      .where(and(eq(messages.id, messageId), eq(messages.channel_id, channelId)))
      .limit(1);

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Idempotent: already deleted → return without error
    if (message.is_deleted) {
      return;
    }

    // Resolve server_id from the channel (MUST be done before rbac can() call)
    const [channel] = await db
      .select({ server_id: channels.server_id })
      .from(channels)
      .where(eq(channels.id, channelId))
      .limit(1);

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    const serverId = channel.server_id;

    // Author may always delete their own message
    const isAuthor = message.author_id === userId;

    // Moderator path: can(userId, serverId, 'moderate_members') — widened from manage_channels
    // (wave-41 spec 6ddddc2d: delete-any-message gated on moderate_members, not manage_channels).
    // serverId resolved from channel row above — never from request body.
    const isModerator = isAuthor
      ? false
      : await this.rbacService.can(userId, serverId, 'moderate_members');

    if (!isAuthor && !isModerator) {
      throw new ForbiddenException('Insufficient permissions to delete this message');
    }

    // -----------------------------------------------------------------------
    // wave-41 B-6 rank guard (Fix 2): when the deleter acts via moderate_members
    // (not as the message author), refuse if the message's AUTHOR is the server
    // owner or holds manage_server / manage_roles — same rule as the timeout rank
    // guard in ModerationService.assertRankGuard.
    // Author-deleting-own-message bypasses this (isAuthor path, isModerator=false).
    // -----------------------------------------------------------------------
    if (isModerator) {
      await this.assertDeleteRankGuard(serverId, message.author_id);
    }

    const now = new Date();

    // -----------------------------------------------------------------------
    // wave-18: if the message being deleted is a reply (threadParentId set),
    // we must atomically:
    //   (a) soft-delete the reply
    //   (b) decrement reply_count on the parent (ALWAYS)
    //   (c) recompute last_reply_at ONLY when the deleted reply was the tail
    //       (deletedReply.created_at === parent.last_reply_at); otherwise leave
    //       last_reply_at unchanged — avoids a wasted MAX() on non-tail deletes.
    //       Set to NULL when no live replies remain after this delete.
    //
    // If the message is a top-level message (threadParentId is null), the
    // existing simple UPDATE is used (no parent to update).
    // -----------------------------------------------------------------------

    if (message.thread_parent_id !== null) {
      // Reply soft-delete — wrap in a transaction for atomicity
      const updated = await db.transaction(async (tx) => {
        // (a) Soft-delete the reply
        const [deleted] = await tx
          .update(messages)
          .set({ is_deleted: true, deleted_at: now, content: '' })
          .where(eq(messages.id, messageId))
          .returning();

        if (!deleted) {
          throw new Error('Message delete failed unexpectedly');
        }

        // (b) Decrement reply_count on the parent — ALWAYS
        // (c) Conditionally recompute last_reply_at (tail-only)
        const parentId = message.thread_parent_id as string;

        // Fetch the parent's current last_reply_at to determine if this was the tail
        const [parent] = await tx
          .select({ last_reply_at: messages.last_reply_at })
          .from(messages)
          .where(eq(messages.id, parentId))
          .limit(1);

        const isTailReply =
          parent?.last_reply_at !== undefined &&
          parent.last_reply_at !== null &&
          deleted.created_at.getTime() === parent.last_reply_at.getTime();

        if (isTailReply) {
          // Recompute last_reply_at = MAX(created_at) over remaining live replies
          // NULL when no live replies remain after this soft-delete.
          const [maxRow] = await tx
            .select({ maxCreatedAt: max(messages.created_at) })
            .from(messages)
            .where(
              and(
                eq(messages.thread_parent_id, parentId),
                eq(messages.is_deleted, false),
                sql`${messages.id} != ${messageId}`,
              ),
            );

          const newLastReplyAt = maxRow?.maxCreatedAt ?? null;

          await tx
            .update(messages)
            .set({
              reply_count: sql`GREATEST(${messages.reply_count} - 1, 0)`,
              last_reply_at: newLastReplyAt,
            })
            .where(eq(messages.id, parentId));
        } else {
          // Non-tail delete: decrement count only, leave last_reply_at unchanged
          await tx
            .update(messages)
            .set({ reply_count: sql`GREATEST(${messages.reply_count} - 1, 0)` })
            .where(eq(messages.id, parentId));
        }

        return deleted;
      });

      const dto = rowToDto(updated, [], userId);
      this.eventEmitter.emit('message.deleted', dto);

      // H-1 fix (wave-18 B-6): emit thread-scoped delete event so open thread
      // panels remove the deleted reply and the affordance replyCount decrements.
      //
      // Fetch the parent's post-commit reply_count + last_reply_at — the txn
      // already applied the decrement, so this read reflects the committed values.
      const replyParentId = message.thread_parent_id as string;
      const [updatedParent] = await db
        .select({
          reply_count: messages.reply_count,
          last_reply_at: messages.last_reply_at,
          channel_id: messages.channel_id,
        })
        .from(messages)
        .where(eq(messages.id, replyParentId))
        .limit(1);

      if (updatedParent) {
        const threadDeleteEvent: ThreadReplyDeletedEvent = {
          parentId: replyParentId,
          channelId: updatedParent.channel_id,
          replyId: messageId,
          replyCount: updatedParent.reply_count,
          lastReplyAt: updatedParent.last_reply_at
            ? updatedParent.last_reply_at.toISOString()
            : null,
        };
        this.eventEmitter.emit('thread.reply.deleted', threadDeleteEvent);
      }

      return;
    }

    // Top-level message delete (no parent to update — existing path)
    const [updated] = await db
      .update(messages)
      .set({ is_deleted: true, deleted_at: now, content: '' })
      .where(eq(messages.id, messageId))
      .returning();

    if (!updated) {
      throw new Error('Message delete failed unexpectedly');
    }

    // Emit event for gateway fan-out (content will be null in DTO due to is_deleted)
    const dto = rowToDto(updated, [], userId);
    this.eventEmitter.emit('message.deleted', dto);
  }

  // -------------------------------------------------------------------------
  // createReply — POST /messages/:parentId/replies
  //
  // Creates a reply to an existing top-level message. All operations run in a
  // single db.transaction() (createServer pattern — NOT the non-transactional
  // createMessage sequential-await pattern).
  //
  // Validation (reject with 4xx before any write):
  //   (a) parent not found → 404
  //   (b) parent.channel_id !== channelId (cross-channel) → 400
  //   (c) parent.thread_parent_id IS NOT NULL (reply-of-reply) → 400
  //   (d) parent is soft-deleted → 409
  //
  // Insert: message row with thread_parent_id = parentId, idempotency ON
  // CONFLICT(channel_id, idempotency_key) DO NOTHING + canonical re-fetch.
  //
  // Count: ONLY when the insert produced a NEW row (not idempotent replay),
  // UPDATE parent SET reply_count = reply_count + 1, last_reply_at = <reply.created_at>
  // in the SAME transaction. Idempotent retry returns the existing reply without
  // double-counting.
  //
  // Emits: 'thread.reply.created' (EventEmitter2) for the Socket.IO gateway.
  // -------------------------------------------------------------------------

  async createReply(
    channelId: string,
    parentId: string,
    authorId: string,
    input: SendMessageInput,
  ): Promise<MessageResponse> {
    // Pre-flight: load the parent BEFORE opening the transaction.
    // This is a read-only check — if it passes, we open the txn.
    const [parent] = await db.select().from(messages).where(eq(messages.id, parentId)).limit(1);

    if (!parent) {
      throw new NotFoundException('Parent message not found');
    }

    // (b) cross-channel guard
    // Validate the query param matches the parent's actual channel — the param
    // is NOT trusted as the authoritative source; the parent row is.
    if (parent.channel_id !== channelId) {
      throw new BadRequestException('Parent message does not belong to this channel');
    }

    // (b2) channel membership guard — IDOR fix (wave-18 B-6)
    // Derive the authoritative channelId from the parent row (already validated
    // above). The query param cannot bypass this check even if forged because
    // we already confirmed parent.channel_id === channelId, so the authoritative
    // channel is parent.channel_id regardless.
    const canView = await this.rbacService.canViewChannelById(authorId, parent.channel_id);
    if (!canView) {
      throw new ForbiddenException('Insufficient permissions to access this channel');
    }

    // (c) one-level-only guard: reject reply-of-reply
    if (parent.thread_parent_id !== null) {
      throw new BadRequestException('Replies to replies are not supported (one level only)');
    }

    // (d) soft-deleted parent guard
    if (parent.is_deleted) {
      throw new ConflictException('Cannot reply to a deleted message');
    }

    // -----------------------------------------------------------------------
    // wave-41 B-6 send-gate (Fix 1): refuse if the reply author is currently
    // muted in the server that owns this channel.  Same semantics as
    // createMessage — muted_until > now() → 403; past or NULL → allowed.
    // serverId resolved from the channel row (never from request).
    // -----------------------------------------------------------------------
    const [replyChannel] = await db
      .select({ server_id: channels.server_id })
      .from(channels)
      .where(eq(channels.id, channelId))
      .limit(1);

    if (!replyChannel) {
      throw new NotFoundException('Channel not found');
    }

    await this.assertNotMuted(authorId, replyChannel.server_id);

    const idempotencyKey = input.idempotencyKey ?? null;
    const rawAttachmentDescriptors: ValidatedAttachment[] = input.attachments ?? [];

    // -----------------------------------------------------------------------
    // C-1 fix (wave-19 B-6) — same send-time validation as createMessage.
    // Anchored channel-scope regex + HeadObject re-derive + size/MIME gate.
    // -----------------------------------------------------------------------
    const attachmentDescriptors = await validateAndHeadAttachments(
      rawAttachmentDescriptors,
      channelId,
      this.filesService,
    );

    // All DB writes in one atomic transaction (createServer template pattern)
    const reply = await db.transaction(async (tx) => {
      // INSERT with RETURNING so we can detect new-vs-replay in a single statement.
      // ON CONFLICT(channel_id, idempotency_key) DO NOTHING returns an empty array
      // when the key already existed (idempotent replay) → skip count increment.
      // When idempotencyKey IS NULL the UNIQUE constraint does not apply (NULL ≠ NULL
      // in unique indexes), so every call inserts a new row and RETURNING always
      // carries the new row.
      const insertReturning = await tx
        .insert(messages)
        .values({
          channel_id: channelId,
          author_id: authorId,
          content: input.content,
          idempotency_key: idempotencyKey,
          thread_parent_id: parentId,
        })
        .onConflictDoNothing({
          target: [messages.channel_id, messages.idempotency_key],
        })
        .returning();

      const isNewInsert = insertReturning.length > 0;

      // Canonical row: new insert → use returning row; replay → re-fetch by key.
      let replyRow: typeof messages.$inferSelect | undefined;

      if (isNewInsert) {
        replyRow = insertReturning[0];
      } else if (idempotencyKey !== null) {
        // Idempotent replay: fetch the existing row by idempotency_key
        const [existing] = await tx
          .select()
          .from(messages)
          .where(
            and(eq(messages.channel_id, channelId), eq(messages.idempotency_key, idempotencyKey)),
          )
          .limit(1);
        replyRow = existing;
      } else {
        // No idempotency key and RETURNING was empty — should not happen since
        // NULL keys never conflict, but guard defensively.
        throw new Error('Reply insert failed unexpectedly');
      }

      if (!replyRow) {
        throw new Error('Reply insert failed unexpectedly');
      }

      // Count increment: ONLY on new insert, not idempotent replay.
      // This is the load-bearing atomicity guarantee: insert + count++ in one txn.
      if (isNewInsert) {
        await tx
          .update(messages)
          .set({
            reply_count: sql`${messages.reply_count} + 1`,
            last_reply_at: replyRow.created_at,
          })
          .where(eq(messages.id, parentId));

        // Attachment INSERT (row-at-send) — ONLY on new insert, not replay.
        // replyRow is guaranteed non-null here (thrown unconditionally above if undefined).
        const confirmedReplyRow = replyRow;
        if (attachmentDescriptors.length > 0) {
          await tx.insert(attachments).values(
            attachmentDescriptors.map((a) => ({
              message_id: confirmedReplyRow.id,
              uploader_id: authorId,
              channel_id: channelId,
              object_key: a.key,
              filename: a.filename,
              content_type: a.contentType,
              size_bytes: a.sizeBytes,
            })),
          );
        }
      }

      return replyRow;
    });

    // Batch-load attachments for the reply and resolve presigned URLs
    const attachmentRows = await fetchAttachmentRows([reply.id]);
    const attachmentRefMap = await buildAttachmentRefMap(attachmentRows, this.filesService);
    const attachmentRefs = attachmentRefMap.get(reply.id) ?? [];

    const dto = rowToDto(reply, [], authorId, [], attachmentRefs);

    // Emit domain event for the Socket.IO gateway (@OnEvent('thread.reply.created'))
    const threadEvent: ThreadReplyEvent = {
      parentId,
      channelId,
      reply: dto,
    };
    this.eventEmitter.emit('thread.reply.created', threadEvent);

    return dto;
  }

  // -------------------------------------------------------------------------
  // listThreadReplies — GET /messages/:parentId/replies
  //
  // Returns replies WHERE thread_parent_id = parentId AND NOT soft-deleted,
  // ordered ASC created_at (oldest-first for thread chronology), cursor-paginated.
  //
  // Excludes tombstoned replies (is_deleted = true) per spec.
  //
  // Cursor encodes (created_at, id) using the same scheme as listMessages.
  // -------------------------------------------------------------------------

  async listThreadReplies(
    parentId: string,
    viewerUserId: string,
    cursor?: string,
    limit = 50,
  ): Promise<ThreadRepliesResponse> {
    // Verify the parent exists — fetch channel_id so we can enforce membership.
    // We select channel_id here (not just id) to drive the authz check below
    // without a second DB round-trip.
    const [parent] = await db
      .select({ id: messages.id, is_deleted: messages.is_deleted, channel_id: messages.channel_id })
      .from(messages)
      .where(eq(messages.id, parentId))
      .limit(1);

    if (!parent) {
      throw new NotFoundException('Parent message not found');
    }

    // Channel membership guard — IDOR fix (wave-18 B-6)
    // Channel is derived from the parent row — never from a request param.
    const canView = await this.rbacService.canViewChannelById(viewerUserId, parent.channel_id);
    if (!canView) {
      throw new ForbiddenException('Insufficient permissions to access this channel');
    }

    const safeLimit = Math.min(Math.max(1, limit), 100);

    let rows: (typeof messages.$inferSelect)[];

    if (cursor) {
      const decoded = decodeCursor(cursor);
      if (!decoded) {
        // Invalid cursor — treat as no cursor (first page)
        rows = await db
          .select()
          .from(messages)
          .where(and(eq(messages.thread_parent_id, parentId), eq(messages.is_deleted, false)))
          .orderBy(sql`${messages.created_at} ASC, ${messages.id} ASC`)
          .limit(safeLimit + 1);
      } else {
        // ASC pagination: fetch rows AFTER the cursor position
        rows = await db
          .select()
          .from(messages)
          .where(
            and(
              eq(messages.thread_parent_id, parentId),
              eq(messages.is_deleted, false),
              or(
                sql`${messages.created_at} > ${decoded.createdAt.toISOString()}`,
                and(
                  sql`${messages.created_at} = ${decoded.createdAt.toISOString()}`,
                  sql`${messages.id} > ${decoded.id}`,
                ),
              ),
            ),
          )
          .orderBy(sql`${messages.created_at} ASC, ${messages.id} ASC`)
          .limit(safeLimit + 1);
      }
    } else {
      rows = await db
        .select()
        .from(messages)
        .where(and(eq(messages.thread_parent_id, parentId), eq(messages.is_deleted, false)))
        .orderBy(sql`${messages.created_at} ASC, ${messages.id} ASC`)
        .limit(safeLimit + 1);
    }

    const hasMore = rows.length > safeLimit;
    if (hasMore) rows.pop();

    const lastRow = rows[rows.length - 1];
    const nextCursor =
      hasMore && lastRow !== undefined ? encodeCursor(lastRow.created_at, lastRow.id) : null;

    // Batch-load reactions for the reply page (no N+1)
    const messageIds = rows.map((r) => r.id);
    let reactionRows: ReactionRow[] = [];
    if (messageIds.length > 0) {
      reactionRows = await db
        .select({
          message_id: message_reactions.message_id,
          user_id: message_reactions.user_id,
          emoji: message_reactions.emoji,
        })
        .from(message_reactions)
        .where(inArray(message_reactions.message_id, messageIds));
    }

    // Batch-load mentions for the reply page
    const mentionRows = await fetchMentionRows(messageIds);

    // Batch-load attachments for the reply page (single query + presign — no N+1)
    const attachmentRows = await fetchAttachmentRows(messageIds);
    const attachmentRefMap = await buildAttachmentRefMap(attachmentRows, this.filesService);

    return {
      items: rows.map((row) =>
        rowToDto(row, reactionRows, viewerUserId, mentionRows, attachmentRefMap.get(row.id) ?? []),
      ),
      nextCursor,
    };
  }

  // -------------------------------------------------------------------------
  // toggleReaction — POST /channels/:channelId/messages/:messageId/reactions
  //
  // Idempotent toggle via UNIQUE(message_id, user_id, emoji):
  //   - If the reaction does NOT exist → INSERT → reacted: true, emit reaction.added
  //   - If the reaction EXISTS → DELETE → reacted: false, emit reaction.removed
  //
  // userId ALWAYS from session (controller never accepts userId from body).
  // Message must exist and belong to channelId.
  // -------------------------------------------------------------------------

  async toggleReaction(
    channelId: string,
    messageId: string,
    userId: string,
    emoji: string,
  ): Promise<ReactionToggleResponse> {
    // Verify message exists and belongs to the channel
    const [message] = await db
      .select({ id: messages.id, is_deleted: messages.is_deleted })
      .from(messages)
      .where(and(eq(messages.id, messageId), eq(messages.channel_id, channelId)))
      .limit(1);

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.is_deleted) {
      throw new ConflictException('Cannot react to a deleted message');
    }

    // Check if this reaction already exists
    const [existing] = await db
      .select({ id: message_reactions.id })
      .from(message_reactions)
      .where(
        and(
          eq(message_reactions.message_id, messageId),
          eq(message_reactions.user_id, userId),
          eq(message_reactions.emoji, emoji),
        ),
      )
      .limit(1);

    let reacted: boolean;

    if (existing) {
      // Toggle OFF: remove the reaction
      await db
        .delete(message_reactions)
        .where(
          and(
            eq(message_reactions.message_id, messageId),
            eq(message_reactions.user_id, userId),
            eq(message_reactions.emoji, emoji),
          ),
        );

      reacted = false;
      this.eventEmitter.emit('reaction.removed', {
        messageId,
        channelId,
        userId,
        emoji,
      });
    } else {
      // Toggle ON: add the reaction
      await db
        .insert(message_reactions)
        .values({
          message_id: messageId,
          user_id: userId,
          emoji,
        })
        .onConflictDoNothing({
          target: [
            message_reactions.message_id,
            message_reactions.user_id,
            message_reactions.emoji,
          ],
        });

      reacted = true;
      this.eventEmitter.emit('reaction.added', {
        messageId,
        channelId,
        userId,
        emoji,
      });
    }

    return { reacted };
  }

  // -------------------------------------------------------------------------
  // listMessages — cursor pagination
  //
  // Default: newest-first (DESC created_at, DESC id), return `limit` rows.
  // Cursor encodes (created_at, id) of the LAST item returned; next page
  // fetches rows strictly older than that cursor.
  //
  // Response is chronological (ASC) so the client can append from the bottom.
  //
  // Now includes:
  //   - is_edited, edited_at, is_deleted (wave-13)
  //   - reactions aggregated [{emoji, count, reactedByMe}] (wave-13)
  //   - is_deleted messages have content: null (tombstone)
  // -------------------------------------------------------------------------

  async listMessages(
    channelId: string,
    viewerUserId: string,
    cursor?: string,
    limit = 50,
  ): Promise<MessageList> {
    // Verify channel exists
    const [channel] = await db
      .select({ id: channels.id })
      .from(channels)
      .where(eq(channels.id, channelId))
      .limit(1);

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    const safeLimit = Math.min(Math.max(1, limit), 100);

    let rows: (typeof messages.$inferSelect)[];

    if (cursor) {
      const decoded = decodeCursor(cursor);
      if (!decoded) {
        // Invalid cursor — treat as no cursor (first page)
        rows = await db
          .select()
          .from(messages)
          .where(eq(messages.channel_id, channelId))
          .orderBy(sql`${messages.created_at} DESC, ${messages.id} DESC`)
          .limit(safeLimit + 1);
      } else {
        // Fetch rows older than the cursor position (stable cursor pagination)
        rows = await db
          .select()
          .from(messages)
          .where(
            and(
              eq(messages.channel_id, channelId),
              or(
                lt(messages.created_at, decoded.createdAt),
                and(
                  sql`${messages.created_at} = ${decoded.createdAt.toISOString()}`,
                  sql`${messages.id} < ${decoded.id}`,
                ),
              ),
            ),
          )
          .orderBy(sql`${messages.created_at} DESC, ${messages.id} DESC`)
          .limit(safeLimit + 1);
      }
    } else {
      rows = await db
        .select()
        .from(messages)
        .where(eq(messages.channel_id, channelId))
        .orderBy(sql`${messages.created_at} DESC, ${messages.id} DESC`)
        .limit(safeLimit + 1);
    }

    // Determine if there is a next page
    const hasMore = rows.length > safeLimit;
    if (hasMore) rows.pop(); // remove the sentinel row

    // Return in chronological order (oldest → newest) for the client
    const chronological = [...rows].reverse();

    const lastRow = rows[rows.length - 1];
    const nextCursor =
      hasMore && lastRow !== undefined ? encodeCursor(lastRow.created_at, lastRow.id) : null;

    // Fetch reactions for all messages in the page (single query, not N+1)
    const messageIds = chronological.map((r) => r.id);
    let reactionRows: ReactionRow[] = [];
    if (messageIds.length > 0) {
      reactionRows = await db
        .select({
          message_id: message_reactions.message_id,
          user_id: message_reactions.user_id,
          emoji: message_reactions.emoji,
        })
        .from(message_reactions)
        .where(inArray(message_reactions.message_id, messageIds));
    }

    // Fetch mentions for all messages in the page (single query, not N+1)
    const mentionRows = await fetchMentionRows(messageIds);

    // Fetch attachments for all messages in the page (single query + presign — no N+1)
    const attachmentRows = await fetchAttachmentRows(messageIds);
    const attachmentRefMap = await buildAttachmentRefMap(attachmentRows, this.filesService);

    return {
      messages: chronological.map((row) =>
        rowToDto(row, reactionRows, viewerUserId, mentionRows, attachmentRefMap.get(row.id) ?? []),
      ),
      nextCursor,
    };
  }

  // -------------------------------------------------------------------------
  // listMessagesAfter — forward catch-up cursor for offline reconnect
  // wave-20 M4 task 92d85e0e
  //
  // GET /channels/:channelId/messages?after=<cursor>&limit=
  //
  // Returns channel messages AFTER the given cursor position, ordered oldest-
  // first (ASC created_at, ASC id) — the forward keyset direction.
  //
  // Mirrors listThreadReplies (ASC/gt keyset) — NOT listMessages (DESC/lt).
  //
  // Security:
  //   - channelId from route param (ChannelMessageGuard enforces membership
  //     before the controller calls this method — 403 for non-members).
  //   - viewerUserId from session (controller enforces).
  //   - Tombstones excluded (is_deleted = true rows are not returned).
  //
  // Cursor semantics:
  //   - after=<cursor>: return rows with (created_at, id) strictly greater than
  //     the decoded cursor (oldest-next-page direction).
  //   - after absent: return the first page (oldest messages first).
  //   - Malformed after cursor (cannot decode) → BadRequestException 400.
  //
  // Response: MessagesAfterResponse { items: MessageResponse[], nextCursor? }
  // -------------------------------------------------------------------------

  async listMessagesAfter(
    channelId: string,
    viewerUserId: string,
    after?: string,
    limit = 50,
  ): Promise<MessagesAfterResponse> {
    const safeLimit = Math.min(Math.max(1, limit), 100);

    let rows: (typeof messages.$inferSelect)[];

    if (after !== undefined) {
      const decoded = decodeCursor(after);
      if (!decoded) {
        throw new BadRequestException('Invalid after cursor');
      }
      // ASC keyset: fetch rows strictly AFTER the cursor position
      // Pattern mirrors listThreadReplies — NOT listMessages DESC
      rows = await db
        .select()
        .from(messages)
        .where(
          and(
            eq(messages.channel_id, channelId),
            eq(messages.is_deleted, false),
            or(
              sql`${messages.created_at} > ${decoded.createdAt.toISOString()}`,
              and(
                sql`${messages.created_at} = ${decoded.createdAt.toISOString()}`,
                sql`${messages.id} > ${decoded.id}`,
              ),
            ),
          ),
        )
        .orderBy(sql`${messages.created_at} ASC, ${messages.id} ASC`)
        .limit(safeLimit + 1);
    } else {
      // No cursor — first page, oldest-first
      rows = await db
        .select()
        .from(messages)
        .where(and(eq(messages.channel_id, channelId), eq(messages.is_deleted, false)))
        .orderBy(sql`${messages.created_at} ASC, ${messages.id} ASC`)
        .limit(safeLimit + 1);
    }

    const hasMore = rows.length > safeLimit;
    if (hasMore) rows.pop();

    const lastRow = rows[rows.length - 1];
    const nextCursor =
      hasMore && lastRow !== undefined ? encodeCursor(lastRow.created_at, lastRow.id) : null;

    // Batch-load reactions for the page (no N+1) — empty array when no rows
    const messageIds = rows.map((r) => r.id);
    let reactionRows: ReactionRow[] = [];
    if (messageIds.length > 0) {
      reactionRows = await db
        .select({
          message_id: message_reactions.message_id,
          user_id: message_reactions.user_id,
          emoji: message_reactions.emoji,
        })
        .from(message_reactions)
        .where(inArray(message_reactions.message_id, messageIds));
    }

    // Batch-load mentions for the page
    const mentionRows = await fetchMentionRows(messageIds);

    // Batch-load attachments for the page (single query + presign — no N+1)
    const attachmentRows = await fetchAttachmentRows(messageIds);
    const attachmentRefMap = await buildAttachmentRefMap(attachmentRows, this.filesService);

    return {
      items: rows.map((row) =>
        rowToDto(row, reactionRows, viewerUserId, mentionRows, attachmentRefMap.get(row.id) ?? []),
      ),
      nextCursor,
    };
  }

  // -------------------------------------------------------------------------
  // getMyMentions — GET /me/mentions
  //
  // Returns the authed user's mentioned messages, most-recent-first, cursor-
  // paginated. Only returns messages from servers the viewer is a member of.
  // Excludes soft-deleted (is_deleted=true) messages.
  //
  // Security invariants:
  //   - viewerUserId is ALWAYS from session (req.session.getUserId()) —
  //     NEVER from a request param. The controller enforces this.
  //   - Server-membership scoped: JOIN server_members via channels.server_id.
  //     A user cannot see mentions in a server they have since left.
  //   - No cross-user read: WHERE mentioned_user_id = viewerUserId only.
  // -------------------------------------------------------------------------

  async getMyMentions(
    viewerUserId: string,
    cursor?: string,
    limit = 50,
  ): Promise<MyMentionsResponse> {
    const safeLimit = Math.min(Math.max(1, limit), 100);

    // Cursor encodes (createdAt, id) of the last message_mentions row returned.
    // We reuse the same opaque cursor scheme as listMessages.
    let cursorDecoded: { createdAt: Date; id: string } | null = null;
    if (cursor) {
      cursorDecoded = decodeCursor(cursor);
      // Invalid cursor: treat as no cursor (first page)
    }

    // Build the base WHERE clause for my-mentions:
    //   - mentioned_user_id = viewerUserId (auth: session-derived)
    //   - JOIN messages: is_deleted = false (exclude tombstones)
    //   - JOIN channels → server_members: viewer is member of the channel's server
    //
    // We use message_mentions as the driving table, join messages and channels
    // to filter and select, then join server_members to scope to servers the
    // viewer belongs to.

    // Base condition: this user's mention rows, scoped to server membership
    const baseWhere = and(
      eq(message_mentions.mentioned_user_id, viewerUserId),
      eq(messages.is_deleted, false),
      eq(server_members.user_id, viewerUserId),
    );

    // Cursor condition: fetch rows for message_mentions rows with message
    // created_at strictly before the cursor (DESC ordering)
    const whereClause = cursorDecoded
      ? and(
          baseWhere,
          or(
            lt(messages.created_at, cursorDecoded.createdAt),
            and(
              sql`${messages.created_at} = ${cursorDecoded.createdAt.toISOString()}`,
              sql`${messages.id} < ${cursorDecoded.id}`,
            ),
          ),
        )
      : baseWhere;

    // Fetch safeLimit + 1 rows to detect hasMore
    const mentionedMessages = await db
      .select({
        id: messages.id,
        channel_id: messages.channel_id,
        author_id: messages.author_id,
        content: messages.content,
        created_at: messages.created_at,
        is_edited: messages.is_edited,
        edited_at: messages.edited_at,
        is_deleted: messages.is_deleted,
        deleted_at: messages.deleted_at,
      })
      .from(message_mentions)
      .innerJoin(messages, eq(message_mentions.message_id, messages.id))
      .innerJoin(channels, eq(messages.channel_id, channels.id))
      .innerJoin(
        server_members,
        and(
          eq(channels.server_id, server_members.server_id),
          eq(server_members.user_id, viewerUserId),
        ),
      )
      .where(whereClause)
      .orderBy(sql`${messages.created_at} DESC, ${messages.id} DESC`)
      .limit(safeLimit + 1);

    const hasMore = mentionedMessages.length > safeLimit;
    if (hasMore) mentionedMessages.pop();

    const lastRow = mentionedMessages[mentionedMessages.length - 1];
    const nextCursor =
      hasMore && lastRow !== undefined ? encodeCursor(lastRow.created_at, lastRow.id) : null;

    // Batch-load reactions and mentions for the page (no N+1)
    const messageIds = mentionedMessages.map((r) => r.id);

    let reactionRows: ReactionRow[] = [];
    if (messageIds.length > 0) {
      reactionRows = await db
        .select({
          message_id: message_reactions.message_id,
          user_id: message_reactions.user_id,
          emoji: message_reactions.emoji,
        })
        .from(message_reactions)
        .where(inArray(message_reactions.message_id, messageIds));
    }

    const mentionRows = await fetchMentionRows(messageIds);

    // Batch-load attachments for the mentions page (single query + presign — no N+1)
    const attachmentRows = await fetchAttachmentRows(messageIds);
    const attachmentRefMap = await buildAttachmentRefMap(attachmentRows, this.filesService);

    return {
      items: mentionedMessages.map((row) =>
        rowToDto(row, reactionRows, viewerUserId, mentionRows, attachmentRefMap.get(row.id) ?? []),
      ),
      nextCursor,
    };
  }

  // -------------------------------------------------------------------------
  // assertNotMuted — shared send-gate helper (Fix 1, wave-41 B-6)
  //
  // Throws ForbiddenException(403) when server_members.muted_until > now().
  // Time-based expiry — no cron needed; past muted_until → allowed.
  // NULL muted_until → not muted → allowed (membership row absent → allowed).
  // Called from BOTH createMessage AND createReply before any DB write.
  // serverId MUST be resolved from the channel row — never from a request param.
  // -------------------------------------------------------------------------

  private async assertNotMuted(userId: string, serverId: string): Promise<void> {
    const [membership] = await db
      .select({ muted_until: server_members.muted_until })
      .from(server_members)
      .where(and(eq(server_members.server_id, serverId), eq(server_members.user_id, userId)))
      .limit(1);

    if (
      membership?.muted_until !== null &&
      membership?.muted_until !== undefined &&
      membership.muted_until > new Date()
    ) {
      throw new ForbiddenException('You are currently muted in this server');
    }
  }

  // -------------------------------------------------------------------------
  // assertDeleteRankGuard — rank guard for moderator-delete path (Fix 2, wave-41 B-6)
  //
  // A moderator acting via moderate_members CANNOT soft-delete a message whose
  // AUTHOR is the server owner OR holds manage_server OR manage_roles.
  // Mirrors ModerationService.assertRankGuard but applied to the MESSAGE AUTHOR,
  // not to the action target user (which is the moderator themselves there).
  //
  // Author-deleting-own-message bypasses this entirely (isAuthor path in caller).
  // Moderator deleting a peer-or-below member's message: passes (ranks not above).
  //
  // Throws ForbiddenException(403) when the authorship rank guard fails.
  // -------------------------------------------------------------------------

  private async assertDeleteRankGuard(serverId: string, authorId: string): Promise<void> {
    // Load server to check ownership
    const [server] = await db
      .select({ owner_id: servers.owner_id })
      .from(servers)
      .where(eq(servers.id, serverId))
      .limit(1);

    if (!server) {
      throw new NotFoundException('Server not found');
    }

    // Guard 1: cannot delete messages from the server owner
    if (server.owner_id === authorId) {
      throw new ForbiddenException('Cannot delete messages from the server owner');
    }

    // Guards 2+3: load author's role and check manage_server / manage_roles
    const [authorMember] = await db
      .select({ role_id: server_members.role_id })
      .from(server_members)
      .where(and(eq(server_members.server_id, serverId), eq(server_members.user_id, authorId)))
      .limit(1);

    if (!authorMember?.role_id) {
      // No role → no elevated permissions → rank guard passes
      return;
    }

    const [authorRole] = await db
      .select({ manage_server: roles.manage_server, manage_roles: roles.manage_roles })
      .from(roles)
      .where(eq(roles.id, authorMember.role_id))
      .limit(1);

    if (!authorRole) {
      // Role row missing (data inconsistency) — treat as no perms, guard passes
      return;
    }

    if (authorRole.manage_server || authorRole.manage_roles) {
      throw new ForbiddenException(
        'Cannot delete messages from a member with manage_server or manage_roles permissions',
      );
    }
  }
}
