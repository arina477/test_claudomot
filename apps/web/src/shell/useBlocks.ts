/**
 * useBlocks — shared blocks store hook.
 *
 * Module-level store (mirrors presenceSocket.ts pattern) so a single GET /blocks
 * fetch feeds both BlockedUsersPanel (settings/privacy) and MemberListPanel
 * (server sidebar) without duplicate requests.
 *
 * Exposes:
 *   blocks       — BlockListItem[] (enriched rows from GET /blocks)
 *   blockedSet   — Set<string> of blocked user ids (for O(1) lookup per member row)
 *   loading      — true while the initial fetch is in-flight
 *   error        — true if the last fetch failed
 *   refetch      — re-issue GET /blocks (call after a failed load)
 *   blockUser    — POST /blocks + optimistic update
 *   unblockUser  — DELETE /blocks/:id + optimistic update (reverts on failure)
 *
 * Loading fail-safe (P-4 AC): while loading is true the blockedSet is empty,
 * so callers default the affordance to Block (neutral) — never a wrong action.
 *
 * Optimistic update contract:
 *   blockUser(userId)   — immediately adds userId to blockedSet; on success
 *                          re-fetches to get the enriched BlockListItem row.
 *                          On failure the optimistic id is removed.
 *   unblockUser(userId) — immediately removes the matching row and userId from
 *                          blockedSet; on failure re-fetches to restore real state.
 */

import type { BlockListItem } from '@studyhall/shared';
import { useCallback, useEffect, useState } from 'react';
import { api } from '../auth/api';

// ---------------------------------------------------------------------------
// Module-level store
// ---------------------------------------------------------------------------

type BlocksState = {
  blocks: BlockListItem[];
  blockedSet: Set<string>;
  loading: boolean;
  error: boolean;
};

let _state: BlocksState = {
  blocks: [],
  blockedSet: new Set(),
  loading: false,
  error: false,
};

type Subscriber = () => void;
const _subscribers = new Set<Subscriber>();

function notify() {
  for (const sub of _subscribers) sub();
}

function setState(patch: Partial<BlocksState>) {
  _state = { ..._state, ...patch };
  notify();
}

// In-flight fetch guard — avoids duplicate concurrent fetches
let _fetchPromise: Promise<void> | null = null;

/**
 * Trigger a GET /blocks fetch. De-duplicates: if a fetch is already in-flight
 * a new subscriber just waits for that one to settle. Returns the promise so
 * callers can await if needed (tests).
 */
function fetchBlocks(): Promise<void> {
  if (_fetchPromise) return _fetchPromise;

  setState({ loading: true, error: false });

  _fetchPromise = api
    .getBlocks()
    .then((blocks) => {
      const blockedSet = new Set(blocks.map((b) => b.blocked_id));
      setState({ blocks, blockedSet, loading: false, error: false });
    })
    .catch(() => {
      setState({ loading: false, error: true });
    })
    .finally(() => {
      _fetchPromise = null;
    });

  return _fetchPromise;
}

/**
 * Subscribe to store updates. Returns unsubscribe function.
 * Triggers an initial fetch when the first subscriber attaches.
 */
function subscribe(fn: Subscriber): () => void {
  _subscribers.add(fn);
  // Kick off the fetch on first subscriber if not already loaded/loading
  if (_subscribers.size === 1 && !_state.loading && !_fetchPromise) {
    void fetchBlocks();
  }
  return () => {
    _subscribers.delete(fn);
  };
}

// ---------------------------------------------------------------------------
// Exported mutation helpers
// ---------------------------------------------------------------------------

/**
 * Optimistically add a user to the blocked set, then re-fetch.
 * On fetch failure the added entry is not in the blocks array but blockedSet
 * will be corrected by the re-fetch.
 */
async function doBlockUser(userId: string): Promise<void> {
  // Optimistic: add to set immediately so MemberItem flips to Unblock
  const nextSet = new Set(_state.blockedSet);
  nextSet.add(userId);
  setState({ blockedSet: nextSet });

  try {
    await api.blockUser(userId);
    // Re-fetch to get the enriched BlockListItem (includes displayName, avatarUrl)
    await fetchBlocks();
  } catch {
    // Revert optimistic update
    const revert = new Set(_state.blockedSet);
    revert.delete(userId);
    setState({ blockedSet: revert });
    throw new Error('blockUser failed');
  }
}

/**
 * Optimistically remove a user from blocks, then call DELETE.
 * On failure, re-fetch to restore real state.
 */
async function doUnblockUser(userId: string): Promise<void> {
  // Optimistic: remove from list and set
  const nextBlocks = _state.blocks.filter((b) => b.blocked_id !== userId);
  const nextSet = new Set(_state.blockedSet);
  nextSet.delete(userId);
  setState({ blocks: nextBlocks, blockedSet: nextSet });

  try {
    await api.unblockUser(userId);
    // No re-fetch needed — optimistic state is correct
  } catch {
    // Re-fetch to restore consistent state
    await fetchBlocks();
    throw new Error('unblockUser failed');
  }
}

// ---------------------------------------------------------------------------
// useBlocks hook
// ---------------------------------------------------------------------------

export type UseBlocksResult = {
  blocks: BlockListItem[];
  blockedSet: Set<string>;
  loading: boolean;
  error: boolean;
  refetch: () => void;
  blockUser: (userId: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
};

export function useBlocks(): UseBlocksResult {
  // Snapshot module state into React state on every store notification
  const [snapshot, setSnapshot] = useState<BlocksState>(() => ({ ..._state }));

  useEffect(() => {
    // Sync current state on mount (may have changed between module-level init and mount)
    setSnapshot({ ..._state });
    const unsub = subscribe(() => {
      setSnapshot({ ..._state });
    });
    return unsub;
  }, []);

  const refetch = useCallback(() => {
    void fetchBlocks();
  }, []);

  return {
    blocks: snapshot.blocks,
    blockedSet: snapshot.blockedSet,
    loading: snapshot.loading,
    error: snapshot.error,
    refetch,
    blockUser: doBlockUser,
    unblockUser: doUnblockUser,
  };
}

// ---------------------------------------------------------------------------
// Test helper — reset module state between test runs
// ---------------------------------------------------------------------------

/** @internal — test-only. Resets module-level store to initial state. */
export function _resetBlocksStore() {
  _state = {
    blocks: [],
    blockedSet: new Set(),
    loading: false,
    error: false,
  };
  _fetchPromise = null;
  _subscribers.clear();
}
