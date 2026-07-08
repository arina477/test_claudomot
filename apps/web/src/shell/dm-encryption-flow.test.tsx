/**
 * dm-encryption-flow.test.tsx — wave-79 B-3 crypto flow through the REAL parent.
 *
 * Drives the real useDm hook (via a thin harness) with the REAL outbox, REAL
 * dexie (fake-indexeddb) and REAL Web Crypto — only the api + socket are mocked.
 * Asserts:
 *   - keygen + register: PUT /profile/encryption-key carries ONLY a public key
 *     (no private key material in ANY request body).
 *   - encrypt→send: sending to a keyed peer POSTs an ENVELOPE (ciphertext +
 *     senderKeyRef + envelopeVersion), NEVER plaintext content.
 *   - plaintext fallback: a keyless peer (getPeerEncryptionKey rejects/404)
 *     sends plaintext content — honest, no envelope.
 */

import type { DmConversation } from '@studyhall/shared';
import { act, render, waitFor } from '@testing-library/react';
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StudyHallDB } from '../features/sync/db';

// ── Real dexie (fake-indexeddb), fresh per test ──────────────────────────────
let testDb: StudyHallDB;
vi.mock('../features/sync/db', async () => {
  const actual = await vi.importActual<typeof import('../features/sync/db')>('../features/sync/db');
  return {
    ...actual,
    // getter so each test's fresh testDb is used by both useDm (static import)
    // and useDmEncryption (dynamic import).
    get db() {
      return testDb;
    },
  };
});

// ── Socket mock ──────────────────────────────────────────────────────────────
vi.mock('./messagingSocket', () => ({
  getMessagingSocket: vi.fn(() => ({ connected: false, on: vi.fn(), off: vi.fn(), emit: vi.fn() })),
  onDmMessage: vi.fn(() => () => {}),
}));

// ── API mock ─────────────────────────────────────────────────────────────────
const putEncryptionKey = vi.fn();
const getPeerEncryptionKey = vi.fn();
const sendDmMessage = vi.fn();
const listDmConversations = vi.fn();
const listDmMessages = vi.fn();

vi.mock('../auth/api', () => ({
  api: {
    listDmConversations: (...a: unknown[]) => listDmConversations(...a),
    listDmMessages: (...a: unknown[]) => listDmMessages(...a),
    sendDmMessage: (...a: unknown[]) => sendDmMessage(...a),
    sendMessage: vi.fn(),
    putEncryptionKey: (...a: unknown[]) => putEncryptionKey(...a),
    getPeerEncryptionKey: (...a: unknown[]) => getPeerEncryptionKey(...a),
    createDmConversation: vi.fn(),
    getDmCandidates: vi.fn().mockResolvedValue([]),
  },
}));

import React from 'react';
import * as dmCrypto from '../features/crypto/dm-crypto';
import { generateKeypair } from '../features/crypto/dm-crypto';
import type { DisplayDmMessage } from './useDm';
import { useDm } from './useDm';

const CONV: DmConversation = {
  id: 'conv-1',
  isGroup: false,
  participants: [
    { userId: 'me', displayName: 'Me', avatar: null },
    { userId: 'peer', displayName: 'Peer', avatar: null },
  ],
  lastMessage: null,
  createdAt: new Date().toISOString(),
};

function Harness({ onReady }: { onReady: (send: (c: string) => void) => void }) {
  const { sendDmMessage: send, selectConversation, conversations } = useDm('me', 'Me');
  const [selected, setSelected] = React.useState(false);
  // Select only AFTER the conversation list has loaded, so capability resolution
  // (which reads the conversation for its participants) can find the peer.
  React.useEffect(() => {
    if (!selected && conversations.length > 0) {
      setSelected(true);
      selectConversation('conv-1');
    }
  }, [selected, conversations, selectConversation]);
  onReady(send);
  return <div data-testid="harness" />;
}

beforeEach(() => {
  vi.clearAllMocks();
  testDb = new StudyHallDB(new IDBFactory(), IDBKeyRange);
  listDmConversations.mockResolvedValue({ conversations: [CONV] });
  listDmMessages.mockResolvedValue({ messages: [], nextCursor: null });
  sendDmMessage.mockResolvedValue({ id: 'server-id-1' });
  putEncryptionKey.mockResolvedValue({
    userId: 'me',
    publicKey: 'pub',
    algorithm: 'ECDH-P256-AES-GCM',
    createdAt: new Date().toISOString(),
  });
});

/** Assert NO request body across all mocked endpoints ever contains a private key. */
function assertNoPrivateKeyOnWire() {
  const allBodies = [...putEncryptionKey.mock.calls, ...sendDmMessage.mock.calls].flat();
  const serialized = JSON.stringify(allBodies);
  expect(serialized).not.toMatch(/private/i);
  expect(serialized).not.toMatch(/pkcs8/i);
  // A raw EC private key 'd' JWK field must never appear.
  expect(serialized).not.toMatch(/"d"\s*:/);
}

describe('E2E flow — keygen + register (public key only, private stays local)', () => {
  it('registers ONLY the public key; no private material on the wire', async () => {
    render(<Harness onReady={() => {}} />);
    await waitFor(() => expect(putEncryptionKey).toHaveBeenCalled());
    const [publicKey, algorithm] = putEncryptionKey.mock.calls[0] as [string, string];
    expect(typeof publicKey).toBe('string');
    expect(publicKey.length).toBeGreaterThan(0);
    expect(algorithm).toBe('ECDH-P256-AES-GCM');
    assertNoPrivateKeyOnWire();
  });
});

describe('E2E flow — encrypt on send to a keyed peer', () => {
  it('POSTs a server-blind ENVELOPE (ciphertext, no plaintext content)', async () => {
    const peer = await generateKeypair();
    getPeerEncryptionKey.mockResolvedValue({
      userId: 'peer',
      publicKey: peer.publicKeyBase64,
      algorithm: 'ECDH-P256-AES-GCM',
      createdAt: new Date().toISOString(),
    });

    let send!: (c: string) => void;
    render(
      <Harness
        onReady={(s) => {
          send = s;
        }}
      />,
    );
    // Wait for keygen+register AND peer-key resolution (capability → encrypted).
    await waitFor(() => expect(getPeerEncryptionKey).toHaveBeenCalledWith('peer'));

    await act(async () => {
      send('anomalous variance in column C');
      await Promise.resolve();
    });

    await waitFor(() => expect(sendDmMessage).toHaveBeenCalled());
    const [convId, body] = sendDmMessage.mock.calls[0] as [
      string,
      { content?: string; ciphertext?: string; senderKeyRef?: string; envelopeVersion?: number },
    ];
    expect(convId).toBe('conv-1');
    // Envelope path — ciphertext present, plaintext content ABSENT.
    expect(body.ciphertext).toBeTruthy();
    // senderKeyRef is the SENDER's own public key (the one registered) so the
    // recipient can derive the shared secret — it is NOT the peer's key.
    const [registeredPublicKey] = putEncryptionKey.mock.calls[0] as [string];
    expect(body.senderKeyRef).toBe(registeredPublicKey);
    expect(body.senderKeyRef).not.toBe(peer.publicKeyBase64);
    expect(body.envelopeVersion).toBe(1);
    expect(body.content).toBeUndefined();
    // The plaintext must not leak anywhere on the wire.
    expect(JSON.stringify(body)).not.toContain('anomalous variance');
    assertNoPrivateKeyOnWire();
  });
});

describe('E2E flow — plaintext fallback for a keyless peer (fail-closed, honest)', () => {
  it('a 404 peer key → sends PLAINTEXT content, no envelope, no padlock claim', async () => {
    getPeerEncryptionKey.mockRejectedValue(new Error('404'));

    let send!: (c: string) => void;
    render(
      <Harness
        onReady={(s) => {
          send = s;
        }}
      />,
    );
    await waitFor(() => expect(getPeerEncryptionKey).toHaveBeenCalledWith('peer'));

    await act(async () => {
      send('plain hello');
      await Promise.resolve();
    });

    await waitFor(() => expect(sendDmMessage).toHaveBeenCalled());
    const [, body] = sendDmMessage.mock.calls[0] as [
      string,
      { content?: string; ciphertext?: string },
    ];
    expect(body.content).toBe('plain hello');
    expect(body.ciphertext).toBeUndefined();
  });
});

// F7 — a delivered row's lock derives from the ACTUAL send outcome, never from
// live capability. Harness that exposes the reconciled messages + capability.
function MsgHarness({
  onReady,
}: {
  onReady: (ctx: {
    send: (c: string) => void;
    messages: DisplayDmMessage[];
    capability: string;
  }) => void;
}) {
  const {
    sendDmMessage: send,
    selectConversation,
    conversations,
    messages,
    encryptionCapability,
  } = useDm('me', 'Me');
  const [selected, setSelected] = React.useState(false);
  React.useEffect(() => {
    if (!selected && conversations.length > 0) {
      setSelected(true);
      selectConversation('conv-1');
    }
  }, [selected, conversations, selectConversation]);
  onReady({ send, messages, capability: encryptionCapability });
  return <div data-testid="harness" />;
}

describe('E2E flow — F7 proof-based delivered-row indicator (actual send outcome, not capability)', () => {
  it('a PLAINTEXT send never shows the lock even when capability resolves to encrypted', async () => {
    // Keyed peer → capability resolves to 'encrypted'. But we force the actual
    // encrypt to FAIL, so the real send outcome is PLAINTEXT. The delivered row
    // MUST be labeled from the real outcome (not-encrypted), NEVER the lock.
    const peer = await generateKeypair();
    getPeerEncryptionKey.mockResolvedValue({
      userId: 'peer',
      publicKey: peer.publicKeyBase64,
      algorithm: 'ECDH-P256-AES-GCM',
      createdAt: new Date().toISOString(),
    });
    // Force encryptMessage to throw → makeSendFn falls back to plaintext (mode
    // 'plaintext') while capability is still 'encrypted' — the exact race.
    const encryptSpy = vi
      .spyOn(dmCrypto, 'encryptMessage')
      .mockRejectedValue(new Error('transient crypto failure'));

    let ctx!: { send: (c: string) => void; messages: DisplayDmMessage[]; capability: string };
    render(
      <MsgHarness
        onReady={(c) => {
          ctx = c;
        }}
      />,
    );
    // Capability resolves to 'encrypted' (peer key present).
    await waitFor(() => expect(ctx.capability).toBe('encrypted'));

    await act(async () => {
      ctx.send('race window message');
      await Promise.resolve();
    });

    // The send went out as PLAINTEXT (encrypt threw → plaintext fallback).
    await waitFor(() => expect(sendDmMessage).toHaveBeenCalled());
    const [, body] = sendDmMessage.mock.calls[0] as [
      string,
      { content?: string; ciphertext?: string },
    ];
    expect(body.content).toBe('race window message');
    expect(body.ciphertext).toBeUndefined();

    // The reconciled delivered row must NOT claim the lock, even though
    // capability === 'encrypted'. Proof-based: derived from the real send mode.
    await waitFor(() => {
      const real = ctx.messages.find((m) => m.kind === 'real');
      expect(real).toBeTruthy();
      if (real && real.kind === 'real') {
        expect(real.encryptionState).not.toBe('encrypted');
      }
    });
    expect(ctx.capability).toBe('encrypted');

    encryptSpy.mockRestore();
  });
});
