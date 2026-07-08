/**
 * dm-encryption-indicator.test.tsx — wave-79 B-3 honest fail-closed indicator.
 *
 * The anti-security-theater guards, rendered through the REAL DmThread parent
 * (BUILD rule 12). The SHIP-BLOCKER contract: the lock/shield affordance
 * (data-testid="e2e-lock-affordance") appears ONLY in the provably-encrypted
 * state — it is ABSENT in every non-encrypted state (plaintext fallback, group
 * DM, cannot-decrypt, loading). NEVER a false padlock.
 */

import type { DmConversation } from '@studyhall/shared';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DmThread } from './DmThread';
import type { DmEncryptionState } from './dmEncryptionState';
import type { DisplayDmMessage } from './useDm';

function conversation(overrides: Partial<DmConversation> = {}): DmConversation {
  return {
    id: 'conv-1',
    isGroup: false,
    participants: [
      { userId: 'me', displayName: 'Me', avatar: null },
      { userId: 'peer', displayName: 'Dr. Aris Thorne', avatar: null },
    ],
    lastMessage: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function realRow(encryptionState: DmEncryptionState, content: string | null): DisplayDmMessage {
  return {
    kind: 'real',
    id: `m-${encryptionState}`,
    conversationId: 'conv-1',
    authorId: 'peer',
    content,
    createdAt: new Date().toISOString(),
    encryptionState,
    displayContent: content,
  };
}

const noop = () => {};

function renderThread(opts: {
  cap: 'loading' | 'encrypted' | 'plaintext' | 'group';
  messages: DisplayDmMessage[];
  conv?: DmConversation;
}) {
  return render(
    <DmThread
      conversation={opts.conv ?? conversation()}
      messages={opts.messages}
      messagesLoading={false}
      messagesError={false}
      hasOlderMessages={false}
      onLoadOlderMessages={noop}
      onRetryMessage={noop}
      onSend={noop}
      currentUserId="me"
      encryptionCapability={opts.cap}
    />,
  );
}

describe('E2E indicator — header badge honesty (no false padlock)', () => {
  it('encrypted capability → shows the lock/shield affordance', () => {
    renderThread({ cap: 'encrypted', messages: [realRow('encrypted', 'hi')] });
    const header = screen.getByTestId('dm-header-encryption-indicator');
    expect(header).toHaveAttribute('data-encryption-state', 'encrypted');
    expect(screen.getAllByTestId('e2e-lock-affordance').length).toBeGreaterThan(0);
  });

  it('plaintext-fallback capability (peer has no key) → NO lock/shield', () => {
    renderThread({ cap: 'plaintext', messages: [realRow('not-encrypted-plaintext', 'hi')] });
    const header = screen.getByTestId('dm-header-encryption-indicator');
    expect(header).toHaveAttribute('data-encryption-state', 'not-encrypted-plaintext');
    expect(screen.queryByTestId('e2e-lock-affordance')).toBeNull();
  });

  it('group DM capability → NO lock/shield', () => {
    const groupConv = conversation({
      isGroup: true,
      participants: [
        { userId: 'me', displayName: 'Me', avatar: null },
        { userId: 'a', displayName: 'A', avatar: null },
        { userId: 'b', displayName: 'B', avatar: null },
      ],
    });
    renderThread({
      cap: 'group',
      conv: groupConv,
      messages: [realRow('not-encrypted-group', 'hey all')],
    });
    const header = screen.getByTestId('dm-header-encryption-indicator');
    expect(header).toHaveAttribute('data-encryption-state', 'not-encrypted-group');
    expect(screen.queryByTestId('e2e-lock-affordance')).toBeNull();
  });

  it('loading capability (mount default) → NO lock/shield', () => {
    renderThread({ cap: 'loading', messages: [] });
    const header = screen.getByTestId('dm-header-encryption-indicator');
    expect(header).toHaveAttribute('data-encryption-state', 'loading');
    expect(screen.queryByTestId('e2e-lock-affordance')).toBeNull();
  });
});

describe('E2E indicator — per-message honesty', () => {
  it('encrypted message row shows NO sub-badge (header covers it) and no crash', () => {
    renderThread({ cap: 'encrypted', messages: [realRow('encrypted', 'plaintext body')] });
    const row = screen.getByTestId('dm-message-row-m-encrypted');
    expect(row).toHaveAttribute('data-encryption-state', 'encrypted');
    // No per-message affordance on encrypted rows; the body renders normally.
    expect(within(row).queryByTestId('dm-msg-encryption-indicator')).toBeNull();
    expect(within(row).getByText('plaintext body')).toBeInTheDocument();
  });

  it('plaintext-fallback message shows the honest "Not encrypted" affordance, NO lock', () => {
    renderThread({
      cap: 'plaintext',
      messages: [realRow('not-encrypted-plaintext', 'from a library PC')],
    });
    const row = screen.getByTestId('dm-message-row-m-not-encrypted-plaintext');
    const indicator = within(row).getByTestId('dm-msg-encryption-indicator');
    expect(indicator).toHaveAttribute('data-encryption-state', 'not-encrypted-plaintext');
    expect(within(row).queryByTestId('e2e-lock-affordance')).toBeNull();
  });

  it('cannot-decrypt message renders the calm payload shell — NO lock, no crash, no plaintext', () => {
    renderThread({ cap: 'encrypted', messages: [realRow('cannot-decrypt', null)] });
    const row = screen.getByTestId('dm-message-row-m-cannot-decrypt');
    expect(row).toHaveAttribute('data-encryption-state', 'cannot-decrypt');
    const indicator = within(row).getByTestId('dm-msg-encryption-indicator');
    expect(indicator).toHaveAttribute('data-encryption-state', 'cannot-decrypt');
    // Fail-closed: no lock affordance, and the undecryptable placeholder shows.
    expect(within(row).queryByTestId('e2e-lock-affordance')).toBeNull();
    expect(within(row).getByText(/encrypted payload unavailable/i)).toBeInTheDocument();
  });
});
