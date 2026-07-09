/**
 * Integration test: wave-79 M13 leg-3a — server-blind E2E DM encryption.
 * Real-Postgres. Tasks 60bda5be (key registry + who_can_dm-gated fetch) +
 * 491cb85d (server-blind envelope).
 *
 * THE SERVER-BLIND INVARIANT IS THE CROWN JEWEL (T-8-grade, load-bearing):
 * when a DM is sent as an encrypted envelope, the persisted row has
 * content IS NULL and ciphertext IS NOT NULL — the server stores NO readable
 * plaintext for that message, proven by a separate-connection SELECT.
 *
 * Key-fetch visibility matrix (P-4 karen correction 1): the peer-key fetch is
 * gated on who_can_dm (DmService.canDm — the shared enforceWhoCanDm seam),
 * NOT profile_visibility. Every not-permitted / blocked-by-policy / nonexistent
 * / no-key case returns a BYTE-IDENTICAL uniform 404 (no oracle). We exercise
 * the real ProfileController.getEncryptionKey so the 404 shape is the one
 * clients actually see.
 *
 * CF-2 (LOAD-BEARING): pg-harness MUST be the first import.
 */
// CF-2 side-effect import: sets process.env.DATABASE_URL = DATABASE_URL_TEST
import './pg-harness';
import {
  harnessQuery,
  insertFixtureMembership,
  insertFixtureServer,
  insertFixtureUser,
  setupHarness,
  teardownHarness,
  truncateTables,
} from './pg-harness';

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SendDmMessageSchema } from '@studyhall/shared';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { BlocksService } from '../../src/blocks/blocks.service';
import { DmService } from '../../src/dm/dm.service';
import type { AppendPrivacyEventService } from '../../src/privacy/append-privacy-event.service';
import { EncryptionKeyService } from '../../src/profile/encryption-key.service';
import { ProfileController } from '../../src/profile/profile.controller';

const SKIP = !process.env.DATABASE_URL_TEST;

// ---------------------------------------------------------------------------
// Fixture IDs
// ---------------------------------------------------------------------------
const ALICE = 'enc-alice';
const BOB = 'enc-bob';
const CAROL = 'enc-carol';
const SERVER_SHARED = '00000000-0000-0000-0079-000000000001';
const SERVER_BOB_ONLY = '00000000-0000-0000-0079-000000000002';

const PUBKEY_BOB = 'BOB_PUBLIC_KEY_base64_spki_material';
const ALGO = 'ECDH-P256-AES-GCM';

// A session-request builder matching ProfileController's SessionAugmentedRequest.
function req(userId: string) {
  return { session: { getUserId: () => userId } } as unknown as {
    session: { getUserId(): string };
  };
}

describe.skipIf(SKIP)('wave-79 server-blind DM encryption (60bda5be + 491cb85d)', () => {
  let dmService: DmService;
  let encryptionKeys: EncryptionKeyService;
  let controller: ProfileController;

  beforeAll(async () => {
    await setupHarness();
    const noopAppend = {
      append: vi.fn().mockResolvedValue(undefined),
    } as unknown as AppendPrivacyEventService;
    const blocksService = new BlocksService(noopAppend);
    dmService = new DmService(new EventEmitter2(), blocksService);
    encryptionKeys = new EncryptionKeyService();
    // ProfileController wiring: only the encryption-key path is exercised here,
    // so UsersService + ProfileVisibilityService are stubbed (unused on this path).
    controller = new ProfileController({} as never, {} as never, encryptionKeys, dmService);
  });

  afterAll(async () => {
    await teardownHarness();
  });

  beforeEach(async () => {
    await truncateTables();
    await insertFixtureUser(ALICE, 'enc-alice@test.local', 'alice');
    await insertFixtureUser(BOB, 'enc-bob@test.local', 'bob');
    await insertFixtureUser(CAROL, 'enc-carol@test.local', 'carol');
  });

  // Helper: create a 1:1 conversation between two users (bypasses who_can_dm
  // by inserting rows directly — the send-path invariant is what's under test).
  async function makeConversation(a: string, b: string): Promise<string> {
    const rows = await harnessQuery<{ id: string }>(
      'INSERT INTO dm_conversations (is_group, created_by) VALUES (false, $1) RETURNING id',
      [a],
    );
    const id = rows[0]?.id;
    if (!id) throw new Error('failed to create fixture conversation');
    await harnessQuery(
      'INSERT INTO dm_participants (conversation_id, user_id) VALUES ($1, $2), ($1, $3)',
      [id, a, b],
    );
    return id;
  }

  // =========================================================================
  // 1. SERVER-BLIND INVARIANT — the load-bearing security assertion
  // =========================================================================

  describe('server-blind invariant (491cb85d)', () => {
    it('encrypted send persists ciphertext with content NULL — no plaintext stored', async () => {
      const convId = await makeConversation(ALICE, BOB);

      const parsed = SendDmMessageSchema.safeParse({
        ciphertext: 'BASE64_AES_GCM_ENVELOPE_iv_ct_tag',
        senderKeyRef: 'alice-key-ref-1',
        envelopeVersion: 1,
        idempotencyKey: 'enc-idem-1',
      });
      expect(parsed.success).toBe(true);
      if (!parsed.success) return;

      const dto = await dmService.sendMessage(convId, ALICE, parsed.data);

      // DTO carries the envelope, no plaintext.
      expect(dto.content).toBeNull();
      expect(dto.ciphertext).toBe('BASE64_AES_GCM_ENVELOPE_iv_ct_tag');
      expect(dto.senderKeyRef).toBe('alice-key-ref-1');
      expect(dto.envelopeVersion).toBe(1);

      // DB row (queried over a SEPARATE connection): content IS NULL, ciphertext IS NOT NULL.
      const rows = await harnessQuery<{
        content: string | null;
        ciphertext: string | null;
        sender_key_ref: string | null;
        envelope_version: number | null;
      }>(
        `SELECT content, ciphertext, sender_key_ref, envelope_version
           FROM dm_messages WHERE id = $1`,
        [dto.id],
      );
      expect(rows).toHaveLength(1);
      expect(rows[0]?.content).toBeNull();
      expect(rows[0]?.ciphertext).toBe('BASE64_AES_GCM_ENVELOPE_iv_ct_tag');
      expect(rows[0]?.sender_key_ref).toBe('alice-key-ref-1');
      expect(rows[0]?.envelope_version).toBe(1);
    });

    it('no code path can read plaintext for an encrypted row — content column is NULL everywhere', async () => {
      const convId = await makeConversation(ALICE, BOB);
      const parsed = SendDmMessageSchema.parse({
        ciphertext: 'CT_NO_PLAINTEXT',
        senderKeyRef: 'ref',
        envelopeVersion: 1,
        idempotencyKey: 'enc-idem-blind',
      });
      const dto = await dmService.sendMessage(convId, ALICE, parsed);

      // listMessages (the read path) returns content NULL for the encrypted row.
      const listed = await dmService.listMessages(convId, BOB);
      const found = listed.messages.find((m) => m.id === dto.id);
      expect(found).toBeDefined();
      expect(found?.content).toBeNull();
      expect(found?.ciphertext).toBe('CT_NO_PLAINTEXT');

      // Full-table scan for ANY non-null content across all rows of this conv → none.
      const anyPlaintext = await harnessQuery<{ n: string }>(
        `SELECT count(*)::text AS n FROM dm_messages
           WHERE conversation_id = $1 AND content IS NOT NULL`,
        [convId],
      );
      expect(anyPlaintext[0]?.n).toBe('0');
    });

    it('listConversations preview shows "Encrypted message" placeholder for an encrypted last message', async () => {
      const convId = await makeConversation(ALICE, BOB);
      await dmService.sendMessage(
        convId,
        ALICE,
        SendDmMessageSchema.parse({
          ciphertext: 'CT_PREVIEW',
          senderKeyRef: 'ref',
          envelopeVersion: 1,
          idempotencyKey: 'enc-preview-1',
        }),
      );

      const list = await dmService.listConversations(BOB);
      const conv = list.conversations.find((c) => c.id === convId);
      expect(conv).toBeDefined();
      expect(conv?.lastMessage).not.toBeNull();
      // No crash, no blank, no plaintext (there is none) — fixed placeholder.
      expect(conv?.lastMessage?.content).toBe('Encrypted message');
    });
  });

  // =========================================================================
  // 2. REJECT encrypted+plaintext-both (mutually exclusive) → 400 at schema
  // =========================================================================

  describe('mutual exclusivity at the write boundary (491cb85d)', () => {
    it('rejects a send carrying BOTH plaintext content AND ciphertext', () => {
      const r = SendDmMessageSchema.safeParse({
        content: 'hello',
        ciphertext: 'CT',
        senderKeyRef: 'ref',
        envelopeVersion: 1,
        idempotencyKey: 'both-1',
      });
      expect(r.success).toBe(false);
    });

    it('rejects a send carrying NEITHER content NOR ciphertext', () => {
      const r = SendDmMessageSchema.safeParse({ idempotencyKey: 'neither-1' });
      expect(r.success).toBe(false);
    });

    it('rejects a partial envelope (ciphertext without senderKeyRef/version)', () => {
      const r = SendDmMessageSchema.safeParse({
        ciphertext: 'CT',
        idempotencyKey: 'partial-1',
      });
      expect(r.success).toBe(false);
    });

    it('accepts a plaintext-only send (backward-compatible)', () => {
      const r = SendDmMessageSchema.safeParse({ content: 'hi', idempotencyKey: 'plain-1' });
      expect(r.success).toBe(true);
    });
  });

  // =========================================================================
  // 3. PLAINTEXT FALLBACK — peer has no key → plaintext persists, no error
  // =========================================================================

  describe('plaintext fallback (491cb85d)', () => {
    it('a plaintext send persists content with ciphertext NULL — no regression', async () => {
      const convId = await makeConversation(ALICE, BOB);
      const dto = await dmService.sendMessage(
        convId,
        ALICE,
        SendDmMessageSchema.parse({ content: 'plain hello', idempotencyKey: 'plain-fb-1' }),
      );
      expect(dto.content).toBe('plain hello');
      expect(dto.ciphertext).toBeNull();

      const rows = await harnessQuery<{ content: string | null; ciphertext: string | null }>(
        'SELECT content, ciphertext FROM dm_messages WHERE id = $1',
        [dto.id],
      );
      expect(rows[0]?.content).toBe('plain hello');
      expect(rows[0]?.ciphertext).toBeNull();
    });

    it('idempotent re-send of an encrypted envelope → single row', async () => {
      const convId = await makeConversation(ALICE, BOB);
      const body = SendDmMessageSchema.parse({
        ciphertext: 'CT_IDEM',
        senderKeyRef: 'ref',
        envelopeVersion: 1,
        idempotencyKey: 'enc-idem-dup',
      });
      const first = await dmService.sendMessage(convId, ALICE, body);
      const second = await dmService.sendMessage(convId, ALICE, body);
      expect(second.id).toBe(first.id);

      const count = await harnessQuery<{ n: string }>(
        'SELECT count(*)::text AS n FROM dm_messages WHERE conversation_id = $1',
        [convId],
      );
      expect(count[0]?.n).toBe('1');
    });
  });

  // =========================================================================
  // 4. KEY REGISTRY — store / rotate / no private material
  // =========================================================================

  describe('EncryptionKeyService store + rotate (60bda5be)', () => {
    it('stores a public key and reads it back', async () => {
      await encryptionKeys.upsertKey(BOB, { publicKey: PUBKEY_BOB, algorithm: ALGO });
      const got = await encryptionKeys.getKeyFor(BOB);
      expect(got?.userId).toBe(BOB);
      expect(got?.publicKey).toBe(PUBKEY_BOB);
      expect(got?.algorithm).toBe(ALGO);
    });

    it('rotation: second PUT replaces the row (one active key per user)', async () => {
      await encryptionKeys.upsertKey(BOB, { publicKey: PUBKEY_BOB, algorithm: ALGO });
      await encryptionKeys.upsertKey(BOB, { publicKey: 'ROTATED_KEY', algorithm: ALGO });

      const got = await encryptionKeys.getKeyFor(BOB);
      expect(got?.publicKey).toBe('ROTATED_KEY');

      const count = await harnessQuery<{ n: string }>(
        'SELECT count(*)::text AS n FROM user_encryption_keys WHERE user_id = $1',
        [BOB],
      );
      expect(count[0]?.n).toBe('1');
    });

    it('no private-key column exists on user_encryption_keys', async () => {
      const cols = await harnessQuery<{ column_name: string }>(
        `SELECT column_name FROM information_schema.columns
           WHERE table_name = 'user_encryption_keys'`,
      );
      const names = cols.map((c) => c.column_name);
      expect(names).toContain('public_key');
      expect(names.some((n) => n.includes('private'))).toBe(false);
    });
  });

  // =========================================================================
  // 5. KEY-FETCH VISIBILITY MATRIX — who_can_dm gate + BYTE-IDENTICAL 404
  // =========================================================================

  describe('GET /profile/:userId/encryption-key visibility matrix (60bda5be, P-4 karen 1)', () => {
    // Capture the exact NotFoundException the controller throws, so we can prove
    // every not-permitted case is byte-identical (no oracle).
    async function fetchExpectingNotFound(
      viewer: string,
      target: string,
    ): Promise<{ status: number; message: unknown }> {
      try {
        await controller.getEncryptionKey(req(viewer), target);
        throw new Error('expected NotFoundException, got a 200');
      } catch (e) {
        if (!(e instanceof NotFoundException)) throw e;
        return { status: e.getStatus(), message: e.getResponse() };
      }
    }

    it("who_can_dm='everyone' + key present → 200 PublicKeyResponse", async () => {
      await harnessQuery(`UPDATE users SET who_can_dm = 'everyone' WHERE id = $1`, [BOB]);
      await encryptionKeys.upsertKey(BOB, { publicKey: PUBKEY_BOB, algorithm: ALGO });

      const resp = await controller.getEncryptionKey(req(ALICE), BOB);
      expect(resp.userId).toBe(BOB);
      expect(resp.publicKey).toBe(PUBKEY_BOB);
      expect(resp.algorithm).toBe(ALGO);
      expect(typeof resp.createdAt).toBe('string');
      // Never leaks email / private material.
      expect(resp).not.toHaveProperty('email');
      expect(Object.values(resp)).not.toContain('enc-bob@test.local');
    });

    it("who_can_dm='server-members' + shared server + key → 200", async () => {
      await harnessQuery(`UPDATE users SET who_can_dm = 'server-members' WHERE id = $1`, [BOB]);
      await insertFixtureServer(SERVER_SHARED, ALICE, 'Shared');
      await insertFixtureMembership(SERVER_SHARED, ALICE);
      await insertFixtureMembership(SERVER_SHARED, BOB);
      await encryptionKeys.upsertKey(BOB, { publicKey: PUBKEY_BOB, algorithm: ALGO });

      const resp = await controller.getEncryptionKey(req(ALICE), BOB);
      expect(resp.publicKey).toBe(PUBKEY_BOB);
    });

    it('self-fetch is always permitted (bypasses who_can_dm gate)', async () => {
      await harnessQuery(`UPDATE users SET who_can_dm = 'nobody' WHERE id = $1`, [BOB]);
      await encryptionKeys.upsertKey(BOB, { publicKey: PUBKEY_BOB, algorithm: ALGO });

      const resp = await controller.getEncryptionKey(req(BOB), BOB);
      expect(resp.publicKey).toBe(PUBKEY_BOB);
    });

    // --- the no-oracle matrix: every not-permitted case is byte-identical 404 ---

    it('BYTE-IDENTICAL 404 across who_can_dm=nobody / server-not-shared / nonexistent / no-key-registered', async () => {
      // Case A: who_can_dm='nobody' but a key IS registered (visible-but-no-DM).
      await harnessQuery(`UPDATE users SET who_can_dm = 'nobody' WHERE id = $1`, [BOB]);
      await encryptionKeys.upsertKey(BOB, { publicKey: PUBKEY_BOB, algorithm: ALGO });
      const caseA = await fetchExpectingNotFound(ALICE, BOB);

      // Case B: server-members but NO shared server, key registered.
      await harnessQuery(`UPDATE users SET who_can_dm = 'server-members' WHERE id = $1`, [BOB]);
      await insertFixtureServer(SERVER_BOB_ONLY, BOB, 'Bob-only');
      await insertFixtureMembership(SERVER_BOB_ONLY, BOB);
      const caseB = await fetchExpectingNotFound(ALICE, BOB);

      // Case C: nonexistent target.
      const caseC = await fetchExpectingNotFound(ALICE, 'no-such-user');

      // Case D: permitted (everyone) but NO key registered.
      await harnessQuery(`UPDATE users SET who_can_dm = 'everyone' WHERE id = $1`, [CAROL]);
      const caseD = await fetchExpectingNotFound(ALICE, CAROL);

      // All four must be the SAME status and the SAME body (byte-identical — no oracle).
      for (const c of [caseA, caseB, caseC, caseD]) {
        expect(c.status).toBe(404);
      }
      expect(caseA.message).toStrictEqual(caseB.message);
      expect(caseB.message).toStrictEqual(caseC.message);
      expect(caseC.message).toStrictEqual(caseD.message);
    });

    it('canDm seam matches the gate: nobody→false, everyone→true, shared-server→true, not-shared→false', async () => {
      await harnessQuery(`UPDATE users SET who_can_dm = 'everyone' WHERE id = $1`, [BOB]);
      expect(await dmService.canDm(ALICE, BOB)).toBe(true);

      await harnessQuery(`UPDATE users SET who_can_dm = 'nobody' WHERE id = $1`, [BOB]);
      expect(await dmService.canDm(ALICE, BOB)).toBe(false);

      await harnessQuery(`UPDATE users SET who_can_dm = 'server-members' WHERE id = $1`, [BOB]);
      expect(await dmService.canDm(ALICE, BOB)).toBe(false); // no shared server
      await insertFixtureServer(SERVER_SHARED, ALICE, 'Shared');
      await insertFixtureMembership(SERVER_SHARED, ALICE);
      await insertFixtureMembership(SERVER_SHARED, BOB);
      expect(await dmService.canDm(ALICE, BOB)).toBe(true);

      // Missing target → false (fail-closed).
      expect(await dmService.canDm(ALICE, 'ghost')).toBe(false);
    });
  });

  // =========================================================================
  // 6. SENDER-KEY-REF RE-VALIDATION on the encrypted send path (wave-88 B-2)
  // =========================================================================

  describe('encrypted send senderKeyRef re-validation (wave-88 B-2)', () => {
    const KEY_A = 'ALICE_PUBLIC_KEY_A_base64_spki';
    const KEY_B = 'ALICE_PUBLIC_KEY_B_base64_spki';

    it('registered key MATCHING senderKeyRef → row stored', async () => {
      const convId = await makeConversation(ALICE, BOB);
      await encryptionKeys.upsertKey(ALICE, { publicKey: KEY_A, algorithm: ALGO });

      const dto = await dmService.sendMessage(
        convId,
        ALICE,
        SendDmMessageSchema.parse({
          ciphertext: 'CT_MATCH',
          senderKeyRef: KEY_A,
          envelopeVersion: 1,
          idempotencyKey: 'skr-match-1',
        }),
      );
      expect(dto.senderKeyRef).toBe(KEY_A);

      // Row committed and visible over a separate connection.
      const rows = await harnessQuery<{ n: string }>(
        `SELECT count(*)::text AS n FROM dm_messages
           WHERE conversation_id = $1 AND ciphertext = 'CT_MATCH'`,
        [convId],
      );
      expect(rows[0]?.n).toBe('1');
    });

    it('registered key MISMATCHING senderKeyRef → rejected, no row stored', async () => {
      const convId = await makeConversation(ALICE, BOB);
      await encryptionKeys.upsertKey(ALICE, { publicKey: KEY_A, algorithm: ALGO });

      await expect(
        dmService.sendMessage(
          convId,
          ALICE,
          SendDmMessageSchema.parse({
            ciphertext: 'CT_SPOOF',
            senderKeyRef: 'SPOOFED_KEY_NOT_REGISTERED',
            envelopeVersion: 1,
            idempotencyKey: 'skr-spoof-1',
          }),
        ),
      ).rejects.toBeInstanceOf(BadRequestException);

      // Side-effect-free rejection: NO row persisted for the spoofed send.
      const rows = await harnessQuery<{ n: string }>(
        'SELECT count(*)::text AS n FROM dm_messages WHERE conversation_id = $1',
        [convId],
      );
      expect(rows[0]?.n).toBe('0');
    });

    it('sender with NO registered key → send SUCCEEDS (fail-open)', async () => {
      const convId = await makeConversation(ALICE, BOB);
      // ALICE has no user_encryption_keys row.

      const dto = await dmService.sendMessage(
        convId,
        ALICE,
        SendDmMessageSchema.parse({
          ciphertext: 'CT_NOKEY',
          senderKeyRef: 'any-ref-since-no-registered-key',
          envelopeVersion: 1,
          idempotencyKey: 'skr-nokey-1',
        }),
      );
      expect(dto.ciphertext).toBe('CT_NOKEY');

      const rows = await harnessQuery<{ n: string }>(
        `SELECT count(*)::text AS n FROM dm_messages
           WHERE conversation_id = $1 AND ciphertext = 'CT_NOKEY'`,
        [convId],
      );
      expect(rows[0]?.n).toBe('1');
    });

    it('post-rotation (T-8): send with the CURRENT (rotated) key ref is ACCEPTED, not rejected', async () => {
      const convId = await makeConversation(ALICE, BOB);
      // Register key A, then rotate to key B (upsertKey replaces — UNIQUE(user_id)).
      await encryptionKeys.upsertKey(ALICE, { publicKey: KEY_A, algorithm: ALGO });
      await encryptionKeys.upsertKey(ALICE, { publicKey: KEY_B, algorithm: ALGO });

      // Sanity: only one key row, and it is the rotated key B.
      const keyRows = await harnessQuery<{ public_key: string; n: string }>(
        `SELECT public_key, count(*) OVER ()::text AS n
           FROM user_encryption_keys WHERE user_id = $1`,
        [ALICE],
      );
      expect(keyRows).toHaveLength(1);
      expect(keyRows[0]?.public_key).toBe(KEY_B);

      // Send with senderKeyRef = the rotated key B → ACCEPTED (uses current key).
      const dto = await dmService.sendMessage(
        convId,
        ALICE,
        SendDmMessageSchema.parse({
          ciphertext: 'CT_ROTATED',
          senderKeyRef: KEY_B,
          envelopeVersion: 1,
          idempotencyKey: 'skr-rotated-1',
        }),
      );
      expect(dto.senderKeyRef).toBe(KEY_B);

      const rows = await harnessQuery<{ n: string }>(
        `SELECT count(*)::text AS n FROM dm_messages
           WHERE conversation_id = $1 AND ciphertext = 'CT_ROTATED'`,
        [convId],
      );
      expect(rows[0]?.n).toBe('1');

      // And a send with the STALE key A is now rejected (proves current-key check).
      await expect(
        dmService.sendMessage(
          convId,
          ALICE,
          SendDmMessageSchema.parse({
            ciphertext: 'CT_STALE',
            senderKeyRef: KEY_A,
            envelopeVersion: 1,
            idempotencyKey: 'skr-stale-1',
          }),
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});

// Clear skip message when DATABASE_URL_TEST is not set.
if (SKIP) {
  describe('wave-79 server-blind DM encryption', () => {
    it.skip('SKIPPED: DATABASE_URL_TEST is not set — set it to a real Postgres URL to run', () => {});
  });
}
